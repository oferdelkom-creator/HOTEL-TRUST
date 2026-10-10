-- Add hotel support records. Existing hotel/account/exchange data is retained.
create table public.hotel_support_knowledge (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 150),
 body text not null check (char_length(trim(body)) between 3 and 3000),
 language text not null check (language in ('en','fr','es','it','de','he')),
 category text not null check (category in ('general','checkin','housekeeping','maintenance','billing','urgent')),
 approved boolean not null default false,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.hotel_support_requests (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 guest_name text not null default '' check (char_length(guest_name)<=100),
 room text not null default '' check (char_length(room)<=80),
 body text not null check (char_length(trim(body)) between 3 and 3000),
 language text not null check (language in ('en','fr','es','it','de','he')),
 category text not null check (category in ('general','checkin','housekeeping','maintenance','billing','urgent')),
 status text not null default 'open' check (status in ('open','in_progress','resolved')),
 staff_notes text not null default '' check (char_length(staff_notes)<=3000),
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.hotel_support_connections (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id) on delete cascade,
 provider text not null check (provider in ('pms','booking','email','whatsapp','fixfix')),
 reference text not null default '' check (char_length(reference)<=200),
 status text not null default 'requested' check (status in ('requested','closed')),
 created_at timestamptz not null default now(),
 unique(hotel_id,provider)
);
create index hotel_support_knowledge_hotel_idx on public.hotel_support_knowledge(hotel_id,created_at desc);
create index hotel_support_requests_hotel_idx on public.hotel_support_requests(hotel_id,status,created_at desc);
alter table public.hotel_support_knowledge enable row level security;
alter table public.hotel_support_requests enable row level security;
alter table public.hotel_support_connections enable row level security;
revoke all on public.hotel_support_knowledge,public.hotel_support_requests,public.hotel_support_connections from public,anon;
grant select,insert,update on public.hotel_support_knowledge,public.hotel_support_requests to authenticated;
grant select,insert on public.hotel_support_connections to authenticated;
create policy hotel_support_knowledge_read on public.hotel_support_knowledge for select to authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_knowledge_create on public.hotel_support_knowledge for insert to authenticated with check (version=1 and exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_knowledge_update on public.hotel_support_knowledge for update to authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid()))) with check (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_requests_read on public.hotel_support_requests for select to authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_requests_create on public.hotel_support_requests for insert to authenticated with check (version=1 and status='open' and exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_requests_update on public.hotel_support_requests for update to authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid()))) with check (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_connections_read on public.hotel_support_connections for select to authenticated using (exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create policy hotel_support_connections_create on public.hotel_support_connections for insert to authenticated with check (status='requested' and exists(select 1 from public.hotels h where h.id=hotel_id and h.owner_id=(select auth.uid())));
create function public.hotel_support_stamp_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.hotel_id<>old.hotel_id or new.id<>old.id then raise exception 'Record identity cannot change'; end if;
 new.created_at:=old.created_at;
 new.version:=old.version+1;
 new.updated_at:=now();
 return new;
end;
$$;
revoke all on function public.hotel_support_stamp_version() from public,anon,authenticated;
create trigger hotel_support_knowledge_version before update on public.hotel_support_knowledge for each row execute function public.hotel_support_stamp_version();
create trigger hotel_support_requests_version before update on public.hotel_support_requests for each row execute function public.hotel_support_stamp_version();
