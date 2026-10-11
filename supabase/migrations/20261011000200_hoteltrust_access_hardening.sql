create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke execute on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;
alter function public.handle_new_user() set search_path='';
revoke execute on function public.handle_new_user() from public,anon,authenticated;
alter table public.ht_records add constraint ht_single_settings check(kind<>'settings' or external_key='hotel');
alter table public.ht_records add constraint ht_message_shape check(kind<>'message' or
 (data ?& array['conversation_key','direction','body','sent_at','delivery','substantive']
 and data->>'direction' in ('guest','hotel') and jsonb_typeof(data->'body')='string'
 and jsonb_typeof(data->'substantive')='boolean'
 and not(data->>'direction'='guest' and data->>'delivery'='draft')));
