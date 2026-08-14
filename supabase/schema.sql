-- Grisha: Airbnb-style short-term rental marketplace for guests and hosts in Russia.
-- Run this whole file once in the Supabase SQL editor on a fresh project.

-- ============================================================
-- profiles
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own" on profiles for update
  using (auth.uid() = id);

-- Auto-creates the profiles row the moment an auth user is created, not
-- only when the client happens to have an active session right after
-- signup - matters when email confirmation delays the session, since a
-- client-side insert needs auth.uid() to pass RLS.
create function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- listings: any signed-in user can host - no admin approval gate.
-- ============================================================
create table listings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles (id) on delete cascade,
  -- snapshotted from the host's own profile at insert time (self-select
  -- always passes RLS) so listing/search pages can show a host name
  -- without needing a cross-user read policy on profiles.
  host_name text not null default '',
  title text not null,
  description text not null default '',
  city text not null,
  address text not null default '',
  property_type text not null default 'apartment'
    check (property_type in ('apartment', 'house', 'room', 'studio')),
  room_type text not null default 'entire_place'
    check (room_type in ('entire_place', 'private_room', 'shared_room')),
  max_guests smallint not null default 1 check (max_guests > 0),
  bedrooms smallint not null default 1 check (bedrooms >= 0),
  beds smallint not null default 1 check (beds >= 0),
  bathrooms smallint not null default 1 check (bathrooms >= 0),
  price_per_night numeric(10, 2) not null check (price_per_night > 0),
  cleaning_fee numeric(10, 2) not null default 0 check (cleaning_fee >= 0),
  amenities text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create index listings_city_status_idx on listings (city, status);

alter table listings enable row level security;

create policy "listings_select" on listings for select
  using (status = 'published' or host_id = auth.uid());

create policy "listings_insert_own" on listings for insert
  with check (host_id = auth.uid());

create policy "listings_update_own" on listings for update
  using (host_id = auth.uid());

create policy "listings_delete_own" on listings for delete
  using (host_id = auth.uid());

-- ============================================================
-- listing_photos
-- ============================================================
create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  url text not null,
  sort_order smallint not null default 0
);

alter table listing_photos enable row level security;

create policy "listing_photos_select" on listing_photos for select
  using (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and (l.status = 'published' or l.host_id = auth.uid())
    )
  );

create policy "listing_photos_insert_own" on listing_photos for insert
  with check (
    exists (select 1 from listings l where l.id = listing_photos.listing_id and l.host_id = auth.uid())
  );

create policy "listing_photos_delete_own" on listing_photos for delete
  using (
    exists (select 1 from listings l where l.id = listing_photos.listing_id and l.host_id = auth.uid())
  );

-- ============================================================
-- blocked_dates: host-managed manual blocks (on top of confirmed bookings).
-- ============================================================
create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  date date not null,
  reason text,
  unique (listing_id, date)
);

alter table blocked_dates enable row level security;

create policy "blocked_dates_select" on blocked_dates for select
  using (
    exists (
      select 1 from listings l
      where l.id = blocked_dates.listing_id
        and (l.status = 'published' or l.host_id = auth.uid())
    )
  );

create policy "blocked_dates_insert_own" on blocked_dates for insert
  with check (
    exists (select 1 from listings l where l.id = blocked_dates.listing_id and l.host_id = auth.uid())
  );

create policy "blocked_dates_delete_own" on blocked_dates for delete
  using (
    exists (select 1 from listings l where l.id = blocked_dates.listing_id and l.host_id = auth.uid())
  );

-- ============================================================
-- bookings: priced and validated server-side, never trust client input.
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id),
  guest_id uuid not null references profiles (id),
  -- snapshotted from the guest's own profile at insert time, same reasoning
  -- as listings.host_name - lets the host's bookings view show a guest
  -- name without a cross-user read policy on profiles.
  guest_name text not null default '',
  check_in date not null,
  check_out date not null check (check_out > check_in),
  nights smallint generated always as (check_out - check_in) stored,
  guests_count smallint not null default 1 check (guests_count > 0),
  price_per_night_snapshot numeric(10, 2) not null default 0,
  cleaning_fee_snapshot numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index bookings_listing_idx on bookings (listing_id);
create index bookings_guest_idx on bookings (guest_id);

-- Prices the booking from the listing's current price (the client never
-- gets to set its own total) and rejects dates that overlap an existing
-- pending/confirmed booking or a host-blocked date. Locks the listing row
-- first so two concurrent booking attempts on the same listing serialize
-- instead of both passing the overlap check.
create function price_and_validate_booking() returns trigger
language plpgsql as $$
declare
  v_listing listings%rowtype;
  v_conflict boolean;
begin
  select * into v_listing from listings where id = new.listing_id for update;
  if v_listing.id is null or v_listing.status <> 'published' then
    raise exception 'listing is not available for booking';
  end if;
  if new.guests_count > v_listing.max_guests then
    raise exception 'guests_count exceeds this listing''s max_guests';
  end if;

  select exists (
    select 1 from bookings b
    where b.listing_id = new.listing_id
      and b.status in ('pending_payment', 'confirmed')
      and daterange(b.check_in, b.check_out) && daterange(new.check_in, new.check_out)
  ) into v_conflict;
  if v_conflict then
    raise exception 'selected dates are no longer available';
  end if;

  select exists (
    select 1 from blocked_dates d
    where d.listing_id = new.listing_id
      and d.date >= new.check_in and d.date < new.check_out
  ) into v_conflict;
  if v_conflict then
    raise exception 'selected dates are blocked by the host';
  end if;

  new.price_per_night_snapshot := v_listing.price_per_night;
  new.cleaning_fee_snapshot := v_listing.cleaning_fee;
  new.total_amount := round(v_listing.price_per_night * (new.check_out - new.check_in) + v_listing.cleaning_fee, 2);
  new.status := 'pending_payment';
  return new;
end;
$$;

create trigger trg_price_and_validate_booking
  before insert on bookings
  for each row execute function price_and_validate_booking();

alter table bookings enable row level security;

create policy "bookings_select" on bookings for select
  using (
    guest_id = auth.uid()
    or listing_id in (select id from listings where host_id = auth.uid())
  );

create policy "bookings_insert_own" on bookings for insert
  with check (guest_id = auth.uid());

-- No update policy for regular users: status only moves via the payments
-- webhook, which uses the service-role key and bypasses RLS entirely.

-- ============================================================
-- payments: one YooKassa payment per booking attempt.
-- ============================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  provider text not null default 'yookassa',
  provider_payment_id text,
  amount numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'canceled', 'refunded')),
  confirmation_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index payments_booking_idx on payments (booking_id);

alter table payments enable row level security;

create policy "payments_select" on payments for select
  using (
    booking_id in (
      select id from bookings
      where guest_id = auth.uid()
        or listing_id in (select id from listings where host_id = auth.uid())
    )
  );

-- Created by the authenticated guest via /api/payments/create, only for
-- their own booking while it's still awaiting payment.
create policy "payments_insert_own" on payments for insert
  with check (
    booking_id in (select id from bookings where guest_id = auth.uid() and status = 'pending_payment')
  );

-- No update policy for regular users: the webhook (service-role) is the
-- only writer of status changes, since it re-verifies against the
-- YooKassa API rather than trusting anything client-submitted.

-- ============================================================
-- reviews: mutual, guest <-> host, one per side per booking, only after
-- the stay is actually over (booking confirmed and check_out has passed).
-- ============================================================
create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  listing_id uuid not null references listings (id),
  author_id uuid not null references profiles (id),
  author_name text not null default '',
  reviewee_id uuid not null references profiles (id),
  author_role text not null check (author_role in ('guest', 'host')),
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (booking_id, author_role)
);

create index reviews_listing_idx on reviews (listing_id);

-- Validates eligibility and who's allowed to author which side, and fills
-- in listing_id/reviewee_id server-side so the client never has to (and
-- can't tamper with) who's actually being reviewed.
create function validate_review() returns trigger
language plpgsql as $$
declare
  v_booking bookings%rowtype;
  v_listing listings%rowtype;
begin
  select * into v_booking from bookings where id = new.booking_id;
  if v_booking.id is null then
    raise exception 'booking not found';
  end if;
  if v_booking.status <> 'confirmed' or v_booking.check_out > current_date then
    raise exception 'this stay is not finished yet, so it cannot be reviewed';
  end if;

  select * into v_listing from listings where id = v_booking.listing_id;

  if new.author_role = 'guest' then
    if new.author_id <> v_booking.guest_id then
      raise exception 'only the guest of this booking can leave a guest review';
    end if;
    new.reviewee_id := v_listing.host_id;
  else
    if new.author_id <> v_listing.host_id then
      raise exception 'only the host of this listing can leave a host review';
    end if;
    new.reviewee_id := v_booking.guest_id;
  end if;

  new.listing_id := v_listing.id;
  return new;
end;
$$;

create trigger trg_validate_review
  before insert on reviews
  for each row execute function validate_review();

alter table reviews enable row level security;

-- Guest-authored reviews (rating the listing/host) are public on published
-- listings, like any marketplace review. Host-authored reviews (rating the
-- guest) are private - visible only to that guest and the host who wrote
-- it, since there's no guest-profile browsing feature for other hosts to
-- read them anyway.
create policy "reviews_select" on reviews for select
  using (
    (author_role = 'guest' and exists (
      select 1 from listings l where l.id = reviews.listing_id and l.status = 'published'
    ))
    or author_id = auth.uid()
    or reviewee_id = auth.uid()
  );

create policy "reviews_insert_own" on reviews for insert
  with check (author_id = auth.uid());

create view listing_ratings with (security_invoker = true) as
select listing_id, avg(rating)::numeric(3, 2) as avg_rating, count(*) as review_count
from reviews
where author_role = 'guest'
group by listing_id;

-- ============================================================
-- Storage: listing photos, uploaded by the host to their own uid-prefixed
-- folder, publicly readable (needed for search/listing pages).
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "listing_photos_public_read" on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "listing_photos_owner_write" on storage.objects for insert
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "listing_photos_owner_delete" on storage.objects for delete
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
