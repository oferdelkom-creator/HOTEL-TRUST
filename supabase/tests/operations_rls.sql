begin;
-- Transaction-only fixtures. No email or provider calls, all changes roll back.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('a1111111-1111-4111-8111-111111111111','ht-owner-test@example.invalid',now(),'{}'),
 ('b2222222-2222-4222-8222-222222222222','ht-other-test@example.invalid',now(),'{}'),
 ('c3333333-3333-4333-8333-333333333333','ht-staff-test@example.invalid',now(),'{}');
insert into public.hotels(id,owner_id,name,country,city,stars) values
 ('d4444444-4444-4444-8444-444444444444','a1111111-1111-4111-8111-111111111111','Test A','France','Paris',3),
 ('e5555555-5555-4555-8555-555555555555','b2222222-2222-4222-8222-222222222222','Test B','France','Paris',3);
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":false}',true);
set local role authenticated;
insert into public.ht_records(hotel_id,kind,external_key,data) values('d4444444-4444-4444-8444-444444444444','room_type','classic','{"name":"Classic","capacity":2}');
insert into public.ht_members(hotel_id,user_id,role) values('d4444444-4444-4444-8444-444444444444','c3333333-3333-4333-8333-333333333333','reception');
do $$ begin
 if (select count(*) from public.ht_records where external_key='classic')<>1 then raise exception 'Owner cannot read'; end if;
 if (select count(*) from public.ht_audit where action='INSERT')<>1 then raise exception 'Audit missing'; end if;
 begin
  insert into public.ht_records(hotel_id,kind,external_key,data) values('e5555555-5555-4555-8555-555555555555','room','bad','{}');
  raise exception 'Cross-hotel write allowed';
 exception when insufficient_privilege then null; end;
end $$;
update public.ht_records set data='{"name":"Updated","capacity":2}' where external_key='classic' and version=1;
do $$ begin
 if (select version from public.ht_records where external_key='classic')<>2 then raise exception 'Version not incremented'; end if;
 if exists(select 1 from public.ht_records where external_key='classic' and version=1) then raise exception 'Stale version accepted'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"b2222222-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 if exists(select 1 from public.ht_records) then raise exception 'Other owner can read hotel records'; end if;
 if exists(select 1 from public.ht_audit) then raise exception 'Other owner can read audit'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated","is_anonymous":false}',true);
do $$ begin
 if (select count(*) from public.ht_records)<>1 then raise exception 'Reception cannot read'; end if;
 if exists(select 1 from public.ht_audit) then raise exception 'Reception can read manager-only audit'; end if;
 begin
  insert into public.ht_records(hotel_id,kind,external_key,data) values('d4444444-4444-4444-8444-444444444444','knowledge','unauthorised','{}');
  raise exception 'Reception can write approved knowledge';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.ht_members(hotel_id,user_id,role) values('d4444444-4444-4444-8444-444444444444','b2222222-2222-4222-8222-222222222222','manager');
  raise exception 'Reception can grant membership';
 exception when insufficient_privilege then null; end;
end $$;
insert into public.ht_records(hotel_id,kind,external_key,data) values('d4444444-4444-4444-8444-444444444444','team_note','question','{"title":"Question","body":"Check availability","status":"open"}');
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":true}',true);
do $$ begin
 if exists(select 1 from public.ht_records) then raise exception 'Anonymous auth user has access'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform count(*) from public.ht_records;
  raise exception 'Unsigned user has table access';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: owner, cross-hotel isolation, reception restrictions, anonymous users, immutable versions and audit logging; fixtures rolled back.' as result;
