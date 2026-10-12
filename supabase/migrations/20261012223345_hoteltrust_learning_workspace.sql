create table public.ht_learning_runs (
 id uuid primary key default gen_random_uuid(), hotel_id uuid not null references public.hotels(id),
 actor_id uuid not null references public.profiles(id), action text not null check(action in ('draft','analyse','research','test')),
 language text not null check(language in ('fr','en','es','de','it')), question text not null check(char_length(question) between 1 and 4000),
 status text not null default 'running' check(status in ('running','completed','failed')), result jsonb,
 knowledge_snapshot jsonb, usage jsonb, duration_ms integer, error text, created_at timestamptz not null default now(),
 check(result is null or octet_length(result::text)<60000)
);
create index ht_learning_runs_hotel_time on public.ht_learning_runs(hotel_id,created_at desc);
alter table public.ht_learning_runs enable row level security;
revoke all on public.ht_learning_runs from public,anon,authenticated;
grant select on public.ht_learning_runs to authenticated;
grant update(status,result,knowledge_snapshot,usage,duration_ms,error) on public.ht_learning_runs to authenticated;
create policy ht_learning_read on public.ht_learning_runs for select to authenticated using(ht_private.can_access(hotel_id,true));
create policy ht_learning_update on public.ht_learning_runs for update to authenticated using(actor_id=(select auth.uid()) and ht_private.can_access(hotel_id,true)) with check(actor_id=(select auth.uid()) and ht_private.can_access(hotel_id,true));
create function public.ht_reserve_learning_run(target_hotel uuid,task_action text,task_language text,task_question text)
returns uuid language plpgsql security definer set search_path='' as $$
declare run_id uuid;
begin
 if auth.uid() is null or not ht_private.can_access(target_hotel,true) then raise exception 'Access denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_hotel::text,71));
 if (select count(*) from public.ht_learning_runs where hotel_id=target_hotel and created_at>now()-interval '1 hour')>=20 then raise exception 'Hourly learning limit reached'; end if;
 insert into public.ht_learning_runs(hotel_id,actor_id,action,language,question) values(target_hotel,auth.uid(),task_action,task_language,task_question) returning id into run_id;
 return run_id;
end; $$;
revoke all on function public.ht_reserve_learning_run(uuid,text,text,text) from public,anon;
grant execute on function public.ht_reserve_learning_run(uuid,text,text,text) to authenticated;
