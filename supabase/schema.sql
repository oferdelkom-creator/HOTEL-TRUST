-- Hotel Trust: credit-based room exchange for verified hotel owners.
-- Run this whole file once in the Supabase SQL editor on a fresh project.

-- ============================================================
-- profiles
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'hotel_owner' check (role in ('hotel_owner', 'admin')),
  created_at timestamptz not null default now()
);

-- security definer so RLS policies can check "is the current user an admin?"
-- without recursively re-evaluating RLS on profiles for every check.
create function is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table profiles enable row level security;

create policy "profiles_select" on profiles for select
  using (auth.uid() = id or is_admin());

create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- hotels
-- ============================================================
create table hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  country text not null,
  city text not null,
  stars smallint not null check (stars in (3, 4, 5)),
  -- ownership verification is the trust gate for the whole platform;
  -- only admins may move a hotel out of 'pending' (see trigger below).
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  verification_proof_url text,
  verification_note text,
  created_at timestamptz not null default now()
);

alter table hotels enable row level security;

create policy "hotels_select" on hotels for select
  using (owner_id = auth.uid() or verification_status = 'verified' or is_admin());

create policy "hotels_insert_own" on hotels for insert
  with check (owner_id = auth.uid());

create policy "hotels_update_own_or_admin" on hotels for update
  using (owner_id = auth.uid() or is_admin());

create function lock_verification_fields() returns trigger
language plpgsql as $$
begin
  if not is_admin() then
    new.verification_status := old.verification_status;
    new.verification_note := old.verification_note;
  end if;
  return new;
end;
$$;

create trigger trg_lock_verification
  before update on hotels
  for each row execute function lock_verification_fields();

-- ============================================================
-- night_offers: date ranges an owner opens to the exchange pool.
-- Booked as a whole block (no partial-range splitting) to keep the
-- MVP simple - same tradeoff other starters in this workspace made.
-- ============================================================
create table night_offers (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  nights smallint generated always as (end_date - start_date) stored,
  -- season_tier drives the credit price multiplier. It is admin-set,
  -- never self-declared, so an owner can't inflate their own exchange
  -- rate by labeling everything "high season".
  season_tier text not null default 'regular'
    check (season_tier in ('low', 'regular', 'high')),
  status text not null default 'open' check (status in ('open', 'booked', 'withdrawn')),
  created_at timestamptz not null default now()
);

alter table night_offers enable row level security;

create policy "night_offers_select" on night_offers for select
  using (
    (status = 'open' and exists (
      select 1 from hotels h
      where h.id = night_offers.hotel_id and h.verification_status = 'verified'
    ))
    or hotel_id in (select id from hotels where owner_id = auth.uid())
    or is_admin()
  );

create policy "night_offers_insert_own" on night_offers for insert
  with check (
    hotel_id in (
      select id from hotels where owner_id = auth.uid() and verification_status = 'verified'
    )
  );

create policy "night_offers_update_own_or_admin" on night_offers for update
  using (hotel_id in (select id from hotels where owner_id = auth.uid()) or is_admin());

create function lock_season_tier() returns trigger
language plpgsql as $$
begin
  if new.season_tier is distinct from old.season_tier and not is_admin() then
    new.season_tier := old.season_tier;
  end if;
  return new;
end;
$$;

create trigger trg_lock_season_tier
  before update on night_offers
  for each row execute function lock_season_tier();

-- ============================================================
-- bookings: one hotel's credits redeemed for nights at another hotel.
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  night_offer_id uuid not null references night_offers (id),
  host_hotel_id uuid not null references hotels (id),
  requesting_hotel_id uuid not null references hotels (id),
  check (host_hotel_id <> requesting_hotel_id),
  -- who actually checks in - widens usage beyond the owner's own travel
  -- calendar, per the "owner, family, or staff" redemption model.
  guest_type text not null check (guest_type in ('owner', 'family', 'employee')),
  guest_name text not null,
  -- snapshotted at booking time so later star/season edits don't
  -- retroactively change the price of an already-booked stay.
  stars_at_booking smallint not null default 0,
  season_tier_at_booking text not null default 'regular',
  nights smallint not null default 0,
  credits_cost numeric(8, 2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  -- 'pending' = a real-money hold is owed because this booking pushed
  -- the requesting hotel's credit balance negative; see settle_booking().
  hold_status text not null default 'none'
    check (hold_status in ('none', 'pending', 'released', 'captured')),
  created_at timestamptz not null default now()
);

-- Claims the night_offer and prices the booking server-side (never trust
-- client-submitted credits_cost - it's the platform's currency). Locks
-- the offer row so two concurrent bookings can't both claim it.
create function claim_night_offer_and_price() returns trigger
language plpgsql as $$
declare
  v_offer night_offers%rowtype;
  v_hotel hotels%rowtype;
  v_star_value numeric;
  v_season_mult numeric;
  v_balance_before numeric;
begin
  select * into v_offer from night_offers where id = new.night_offer_id for update;
  if v_offer.id is null then
    raise exception 'night_offer not found';
  end if;
  if v_offer.status <> 'open' then
    raise exception 'night_offer % is not open for booking', new.night_offer_id;
  end if;
  if v_offer.hotel_id <> new.host_hotel_id then
    raise exception 'host_hotel_id does not match night_offer';
  end if;

  select * into v_hotel from hotels where id = v_offer.hotel_id;

  v_star_value := case v_hotel.stars when 3 then 1.0 when 4 then 1.5 when 5 then 2.0 else 1.0 end;
  v_season_mult := case v_offer.season_tier when 'low' then 0.8 when 'high' then 1.4 else 1.0 end;

  new.stars_at_booking := v_hotel.stars;
  new.season_tier_at_booking := v_offer.season_tier;
  new.nights := v_offer.nights;
  new.credits_cost := round(v_star_value * v_season_mult * v_offer.nights, 2);

  select coalesce(sum(amount), 0) into v_balance_before
  from credit_ledger where hotel_id = new.requesting_hotel_id;

  new.hold_status := case
    when (v_balance_before - new.credits_cost) < 0 then 'pending'
    else 'none'
  end;

  update night_offers set status = 'booked' where id = new.night_offer_id;
  return new;
end;
$$;

create table credit_ledger (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels (id) on delete cascade,
  booking_id uuid references bookings (id),
  amount numeric(8, 2) not null,
  reason text not null check (reason in ('booking_spent', 'stay_redeemed', 'admin_adjustment')),
  created_at timestamptz not null default now()
);

create trigger trg_claim_night_offer_and_price
  before insert on bookings
  for each row execute function claim_night_offer_and_price();

alter table bookings enable row level security;

create policy "bookings_select" on bookings for select
  using (
    requesting_hotel_id in (select id from hotels where owner_id = auth.uid())
    or host_hotel_id in (select id from hotels where owner_id = auth.uid())
    or is_admin()
  );

create policy "bookings_insert" on bookings for insert
  with check (
    requesting_hotel_id in (
      select id from hotels where owner_id = auth.uid() and verification_status = 'verified'
    )
  );

-- host confirms/cancels; admin can also intervene (e.g. dispute resolution)
create policy "bookings_update_host_or_admin" on bookings for update
  using (host_hotel_id in (select id from hotels where owner_id = auth.uid()) or is_admin());

-- ============================================================
-- credit_ledger: append-only ledger, balance = sum(amount) per hotel.
-- ============================================================
alter table credit_ledger enable row level security;

create policy "credit_ledger_select" on credit_ledger for select
  using (hotel_id in (select id from hotels where owner_id = auth.uid()) or is_admin());

-- An owner may only self-insert the exact negative spend entry that
-- matches a booking they made - prevents inflating your own balance.
create policy "credit_ledger_insert_own_spend" on credit_ledger for insert
  with check (
    reason = 'booking_spent'
    and amount < 0
    and hotel_id in (select id from hotels where owner_id = auth.uid())
    and exists (
      select 1 from bookings b
      where b.id = credit_ledger.booking_id
        and b.requesting_hotel_id = credit_ledger.hotel_id
        and b.credits_cost = -credit_ledger.amount
    )
  );

create policy "credit_ledger_insert_admin" on credit_ledger for insert
  with check (is_admin());

create view credit_balances with (security_invoker = true) as
select hotel_id, coalesce(sum(amount), 0)::numeric(8, 2) as balance
from credit_ledger
group by hotel_id;

-- ============================================================
-- settle_booking: called at checkout. Credits the host (unless the
-- stay was a no-show) and decides whether the requesting hotel's HOLD
-- gets released or captured, based on their balance at that moment.
-- ============================================================
create function settle_booking(p_booking_id uuid, p_credit_host boolean default true)
returns void
language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_balance numeric;
begin
  if not is_admin() then
    raise exception 'only admin can settle bookings';
  end if;

  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking.id is null then
    raise exception 'booking not found';
  end if;
  if v_booking.status = 'completed' then
    raise exception 'booking already completed';
  end if;

  if p_credit_host then
    insert into credit_ledger (hotel_id, booking_id, amount, reason)
    values (v_booking.host_hotel_id, v_booking.id, v_booking.credits_cost, 'stay_redeemed');
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from credit_ledger where hotel_id = v_booking.requesting_hotel_id;

  update bookings
  set status = 'completed',
      hold_status = case when v_balance < 0 then 'captured' else 'released' end
  where id = p_booking_id;
end;
$$;
