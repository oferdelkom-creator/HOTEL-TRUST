-- Additive setup workspace: no channel jobs, secrets, AI calls or outgoing delivery.
create schema if not exists ht_private;
revoke all on schema ht_private from public, anon;
grant usage on schema ht_private to authenticated;

create table public.ht_members (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id),
 user_id uuid not null references public.profiles(id),
 role text not null check (role in ('manager','reception')),
 created_at timestamptz not null default now(),
 unique(hotel_id,user_id)
);
alter table public.ht_members enable row level security;
revoke all on public.ht_members from public,anon,authenticated;
grant select,insert,update,delete on public.ht_members to authenticated;
create index ht_members_user_idx on public.ht_members(user_id);

-- Privileged lookup intentionally lives in a non-exposed schema to avoid recursive
-- membership policies. auth.uid() is the only actor; callers cannot supply a user.
create function ht_private.can_access(target uuid, manage boolean default false)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
 and (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
 or exists(select 1 from public.hotels h where h.id=target and h.owner_id=auth.uid())
 or exists(select 1 from public.ht_members m where m.hotel_id=target and m.user_id=auth.uid() and (not manage or m.role='manager'))
 );
$$;
revoke all on function ht_private.can_access(uuid,boolean) from public,anon;
grant execute on function ht_private.can_access(uuid,boolean) to authenticated;
create policy ht_members_read on public.ht_members for select to authenticated using(ht_private.can_access(hotel_id));
create policy ht_members_add on public.ht_members for insert to authenticated with check(ht_private.can_access(hotel_id,true) and exists(select 1 from public.hotels h where h.id=hotel_id and (h.owner_id=(select auth.uid()) or public.is_admin())));
create policy ht_members_edit on public.ht_members for update to authenticated using(exists(select 1 from public.hotels h where h.id=hotel_id and (h.owner_id=(select auth.uid()) or public.is_admin()))) with check(exists(select 1 from public.hotels h where h.id=hotel_id and (h.owner_id=(select auth.uid()) or public.is_admin())));
create policy ht_members_remove on public.ht_members for delete to authenticated using(exists(select 1 from public.hotels h where h.id=hotel_id and (h.owner_id=(select auth.uid()) or public.is_admin())));
create policy ht_staff_hotel_read on public.hotels for select to authenticated using(ht_private.can_access(id));

create table public.ht_records (
 id uuid primary key default gen_random_uuid(),
 hotel_id uuid not null references public.hotels(id),
 kind text not null check(kind in ('room_type','room','reservation','conversation','message','review','knowledge','team_note','connection','settings')),
 external_key text not null check(char_length(external_key) between 1 and 120),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=24000),
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(hotel_id,kind,external_key),
 check(kind<>'message' or data->>'delivery' in ('historical','draft','internal')),
 check(kind<>'connection' or not data ? 'status' or data->>'status'='not_connected')
);
create index ht_records_hotel_kind_idx on public.ht_records(hotel_id,kind,created_at);
alter table public.ht_records enable row level security;
revoke all on public.ht_records from public,anon,authenticated;
grant select,insert,update on public.ht_records to authenticated;
create policy ht_records_read on public.ht_records for select to authenticated using(ht_private.can_access(hotel_id));
create policy ht_records_add on public.ht_records for insert to authenticated with check(version=1 and ht_private.can_access(hotel_id,kind in ('room_type','room','knowledge','connection','settings')));
create policy ht_records_edit on public.ht_records for update to authenticated using(ht_private.can_access(hotel_id,kind in ('room_type','room','knowledge','connection','settings'))) with check(ht_private.can_access(hotel_id,kind in ('room_type','room','knowledge','connection','settings')));

create table public.ht_audit (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hotels(id),
 record_id uuid not null, actor_id uuid, action text not null, kind text not null,
 before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
create index ht_audit_hotel_idx on public.ht_audit(hotel_id,created_at desc);
alter table public.ht_audit enable row level security;
revoke all on public.ht_audit from public,anon,authenticated;
grant select on public.ht_audit to authenticated;
create policy ht_audit_read on public.ht_audit for select to authenticated using(ht_private.can_access(hotel_id,true));
create function ht_private.record_audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authenticated actor required'; end if;
 if tg_op='UPDATE' then
  if new.id<>old.id or new.hotel_id<>old.hotel_id or new.kind<>old.kind or new.external_key<>old.external_key then raise exception 'Identity is immutable'; end if;
  new.version:=old.version+1; new.created_at:=old.created_at;
 end if;
 new.updated_at:=now();
 insert into public.ht_audit(hotel_id,record_id,actor_id,action,kind,before_data,after_data)
 values(new.hotel_id,new.id,auth.uid(),tg_op,new.kind,case when tg_op='UPDATE' then old.data else null end,new.data);
 return new;
end; $$;
revoke all on function ht_private.record_audit() from public,anon,authenticated;
create trigger ht_records_audit before insert or update on public.ht_records for each row execute function ht_private.record_audit();

create function public.ht_import_records(target_hotel uuid,record_kind text,items jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 if not ht_private.can_access(target_hotel,record_kind in ('room_type','room','knowledge','connection','settings')) then raise exception 'Access denied'; end if;
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 500 then raise exception 'Import 1-500 records'; end if;
 insert into public.ht_records(hotel_id,kind,external_key,data)
 select target_hotel,record_kind,item->>'external_key',item->'data' from jsonb_array_elements(items) item
 on conflict(hotel_id,kind,external_key) do nothing;
 get diagnostics affected=row_count;
 return affected;
end; $$;
revoke all on function public.ht_import_records(uuid,text,jsonb) from public,anon;
grant execute on function public.ht_import_records(uuid,text,jsonb) to authenticated;

-- No self-promotion through legacy profile insert paths.
alter policy profiles_insert_own on public.profiles with check(auth.uid()=id and role='hotel_owner');
