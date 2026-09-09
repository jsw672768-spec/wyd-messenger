-- Fresh staging installation only. Existing production requires the audited
-- cutover described in ops/SUPABASE_ROLLOUT.md; this guard protects its data.
begin;
do $$ begin
  if to_regclass('public.events') is not null then
    raise exception 'STOP: existing WYD schema found. Audit, backup and approve a tailored cutover first.';
  end if;
end $$;

create schema if not exists wyd_private;
revoke all on schema wyd_private from public, anon;
grant usage on schema wyd_private to authenticated;

create table public.events (
  id text primary key, name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 1000), owner_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active','ended')),
  start_at timestamptz, end_at timestamptz, created_at timestamptz not null default now(), ended_at timestamptz,
  check (end_at is null or start_at is null or end_at > start_at)
);
create table public.event_participants (
  event_id text not null references public.events(id), user_id uuid not null references auth.users(id),
  display_name text not null check (char_length(display_name) between 1 and 50),
  language text not null check (language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  role text not null default 'participant' check (role in ('participant','staff','organizer')),
  updated_at timestamptz not null default now(), primary key(event_id,user_id)
);
create table public.rooms (
  id text primary key, event_id text not null references public.events(id), name text not null,
  owner_id uuid not null references auth.users(id),
  room_type text not null default 'general' check (room_type in ('general','country','group','location','help','custom')),
  country_code text, sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active','ended')),
  created_at timestamptz not null default now(), ended_at timestamptz
);
create unique index one_country_room on public.rooms(event_id,country_code) where room_type='country' and status='active';
create table public.room_participants (
  room_id text not null references public.rooms(id), user_id uuid not null references auth.users(id),
  display_name text not null check (char_length(display_name) between 1 and 50),
  language text not null check (language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  updated_at timestamptz not null default now(), primary key(room_id,user_id)
);
create table public.messages (
  id bigint generated always as identity primary key, room_id text not null references public.rooms(id),
  sender_id uuid not null references auth.users(id), client_message_id uuid not null,
  content text not null check (char_length(content) between 1 and 3000),
  source_language text not null check (source_language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  created_at timestamptz not null default now(), unique(sender_id,client_message_id)
);
create index messages_room_time on public.messages(room_id,created_at desc);
create index messages_sender_time on public.messages(sender_id,created_at desc);
create table public.announcements (
  id bigint generated always as identity primary key, room_id text not null references public.rooms(id),
  author_id uuid not null references auth.users(id), content text not null check(char_length(content) between 1 and 3000),
  source_language text not null check (source_language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  created_at timestamptz not null default now()
);
create table public.event_announcements (
  id bigint generated always as identity primary key, event_id text not null references public.events(id),
  author_id uuid not null references auth.users(id), content text not null check(char_length(content) between 1 and 3000),
  source_language text not null check (source_language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  created_at timestamptz not null default now()
);
create table public.announcement_reads (
  announcement_id bigint not null references public.announcements(id) on delete cascade,
  room_id text not null references public.rooms(id), user_id uuid not null references auth.users(id),
  read_at timestamptz not null default now(), acknowledged_at timestamptz, primary key(announcement_id,user_id)
);
create table public.event_announcement_reads (
  announcement_id bigint not null references public.event_announcements(id) on delete cascade,
  event_id text not null references public.events(id), user_id uuid not null references auth.users(id),
  read_at timestamptz not null default now(), acknowledged_at timestamptz, primary key(announcement_id,user_id)
);
create table public.event_schedule_items (
  id bigint generated always as identity primary key, event_id text not null references public.events(id),
  title text not null check(char_length(title) between 1 and 200), description text check(char_length(description)<=3000),
  created_by uuid default auth.uid() references auth.users(id),
  location_name text, starts_at timestamptz not null, ends_at timestamptz,
  source_language text not null check (source_language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(ends_at is null or ends_at>starts_at)
);
create table public.event_meeting_points (
  event_id text primary key references public.events(id), name text not null,
  updated_by uuid default auth.uid() references auth.users(id),
  details text check(char_length(details)<=3000), map_url text check(map_url is null or map_url ~ '^https://'),
  source_language text not null check (source_language in ('en','ko','es','fr','it','pt','de','pl','ja','zh')),
  updated_at timestamptz not null default now()
);
create table public.help_alerts (
  id bigint generated always as identity primary key, event_id text not null references public.events(id),
  room_id text not null references public.rooms(id), message_id bigint references public.messages(id),
  sender_id uuid not null references auth.users(id), sender_name text not null,
  room_name text not null, message_text text not null,
  status text not null default 'open' check(status in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now(), acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id)
);

create function wyd_private.event_role(eid text) returns text language sql stable security definer set search_path='' as $$
  select case when e.owner_id=auth.uid() then 'organizer' else p.role end
  from public.events e left join public.event_participants p on p.event_id=e.id and p.user_id=auth.uid() where e.id=eid;
$$;
create function wyd_private.event_active(eid text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.events where id=eid and status='active');
$$;
create function wyd_private.can_manage(eid text) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(wyd_private.event_role(eid) in ('organizer','staff'),false) and wyd_private.event_active(eid);
$$;
create function wyd_private.can_read_room(rid text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.rooms r where r.id=rid and wyd_private.event_role(r.event_id) is not null);
$$;
create function wyd_private.can_manage_room(rid text) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.rooms r where r.id=rid and r.status='active' and wyd_private.can_manage(r.event_id));
$$;

do $$ declare t text; begin
  foreach t in array array['events','event_participants','rooms','room_participants','messages','announcements','event_announcements','announcement_reads','event_announcement_reads','event_schedule_items','event_meeting_points','help_alerts'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
grant usage,select on all sequences in schema public to authenticated;
create policy event_members_read on public.events for select to authenticated using (wyd_private.event_role(id) is not null);
create policy event_members_directory on public.event_participants for select to authenticated using (wyd_private.event_role(event_id) is not null);
create policy event_rooms_read on public.rooms for select to authenticated using (wyd_private.event_role(event_id) is not null);
create policy room_members_directory on public.room_participants for select to authenticated using(wyd_private.can_read_room(room_id));
create policy room_messages_read on public.messages for select to authenticated using(wyd_private.can_read_room(room_id));
create policy room_announcements_read on public.announcements for select to authenticated using(wyd_private.can_read_room(room_id));
create policy event_announcements_read on public.event_announcements for select to authenticated using(wyd_private.event_role(event_id) is not null);
create policy room_receipts_read on public.announcement_reads for select to authenticated using(wyd_private.can_read_room(room_id));
create policy event_receipts_read on public.event_announcement_reads for select to authenticated using(wyd_private.event_role(event_id) is not null);
create policy schedule_read on public.event_schedule_items for select to authenticated using(wyd_private.event_role(event_id) is not null);
create policy meeting_read on public.event_meeting_points for select to authenticated using(wyd_private.event_role(event_id) is not null);
create policy help_read on public.help_alerts for select to authenticated using(sender_id=auth.uid() or wyd_private.can_manage(event_id));

grant insert on public.rooms to authenticated;
create policy rooms_create on public.rooms for insert to authenticated with check(owner_id=auth.uid() and status='active' and wyd_private.can_manage(event_id) and char_length(id)>=32);
grant update(status,ended_at) on public.rooms to authenticated;
create policy rooms_close on public.rooms for update to authenticated using(wyd_private.can_manage_room(id)) with check(status='ended' and wyd_private.can_manage(event_id));

grant insert,delete on public.announcements, public.event_announcements to authenticated;
grant update(content,priority,source_language) on public.announcements, public.event_announcements to authenticated;
create policy room_notice_create on public.announcements for insert to authenticated with check(author_id=auth.uid() and wyd_private.can_manage_room(room_id));
create policy room_notice_edit on public.announcements for update to authenticated using(wyd_private.can_manage_room(room_id)) with check(wyd_private.can_manage_room(room_id));
create policy room_notice_delete on public.announcements for delete to authenticated using(wyd_private.can_manage_room(room_id));
create policy event_notice_create on public.event_announcements for insert to authenticated with check(author_id=auth.uid() and wyd_private.can_manage(event_id));
create policy event_notice_edit on public.event_announcements for update to authenticated using(wyd_private.can_manage(event_id)) with check(wyd_private.can_manage(event_id));
create policy event_notice_delete on public.event_announcements for delete to authenticated using(wyd_private.can_manage(event_id));
grant insert on public.announcement_reads,public.event_announcement_reads to authenticated;
create policy room_read_self on public.announcement_reads for insert to authenticated with check(user_id=auth.uid() and acknowledged_at is null and exists(select 1 from public.announcements a where a.id=announcement_id and a.room_id=announcement_reads.room_id) and wyd_private.can_read_room(room_id));
create policy event_read_self on public.event_announcement_reads for insert to authenticated with check(user_id=auth.uid() and acknowledged_at is null and exists(select 1 from public.event_announcements a where a.id=announcement_id and a.event_id=event_announcement_reads.event_id) and wyd_private.event_role(event_id) is not null);
grant insert,update,delete on public.event_schedule_items,public.event_meeting_points to authenticated;
create policy schedule_write on public.event_schedule_items for all to authenticated using(wyd_private.can_manage(event_id)) with check(wyd_private.can_manage(event_id));
create policy meeting_write on public.event_meeting_points for all to authenticated using(wyd_private.can_manage(event_id)) with check(wyd_private.can_manage(event_id));
grant update(status,acknowledged_at,acknowledged_by) on public.help_alerts to authenticated;
create policy help_manage on public.help_alerts for update to authenticated using(wyd_private.can_manage(event_id)) with check(wyd_private.can_manage(event_id) and acknowledged_by=auth.uid());

create function public.wyd_security_version() returns integer language sql stable set search_path='' as $$ select 1; $$;
create function public.create_wyd_event(p_name text,p_description text,p_start_at timestamptz,p_end_at timestamptz,p_display_name text,p_language text)
returns text language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); eid text=replace(gen_random_uuid()::text,'-',''); rid text=replace(gen_random_uuid()::text,'-','');
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,17));
  if (select count(*) from public.events where owner_id=uid and created_at>now()-interval '1 day')>=5 then raise exception 'Daily event limit reached' using errcode='P0001'; end if;
  insert into public.events(id,name,description,owner_id,start_at,end_at) values(eid,trim(p_name),p_description,uid,p_start_at,p_end_at);
  insert into public.event_participants(event_id,user_id,display_name,language,role) values(eid,uid,trim(p_display_name),p_language,'organizer');
  insert into public.rooms(id,event_id,name,owner_id) values(rid,eid,'General',uid);
  return eid;
end $$;
create function public.join_wyd_event(p_event_id text,p_display_name text,p_language text)
returns void language plpgsql security definer set search_path='' as $$
declare e public.events; uid uuid=auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into e from public.events where id=p_event_id for share;
  if not found then raise exception 'Invalid invitation' using errcode='42501'; end if;
  if e.status='ended' then
    if wyd_private.event_role(e.id) is null then raise exception 'Event ended' using errcode='42501'; end if;
    return;
  end if;
  -- New event IDs contain 122 random bits. Possession of the QR link authorizes joining, not administration.
  insert into public.event_participants(event_id,user_id,display_name,language,role)
  values(e.id,uid,trim(p_display_name),p_language,case when e.owner_id=uid then 'organizer' else 'participant' end)
  on conflict(event_id,user_id) do update set display_name=excluded.display_name,language=excluded.language,updated_at=now();
end $$;
create function public.join_wyd_room(p_room_id text,p_display_name text,p_language text)
returns void language plpgsql security definer set search_path='' as $$
declare r public.rooms; uid uuid=auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into r from public.rooms where id=p_room_id for share;
  if not found then raise exception 'Invalid invitation' using errcode='42501'; end if;
  if r.status='ended' then
    if not wyd_private.can_read_room(r.id) then raise exception 'Room ended' using errcode='42501'; end if;
    return;
  end if;
  perform public.join_wyd_event(r.event_id,p_display_name,p_language);
  if not wyd_private.event_active(r.event_id) then raise exception 'Event ended' using errcode='42501'; end if;
  insert into public.room_participants(room_id,user_id,display_name,language) values(r.id,uid,trim(p_display_name),p_language)
  on conflict(room_id,user_id) do update set display_name=excluded.display_name,language=excluded.language,updated_at=now();
end $$;
create function public.send_wyd_message(p_room_id text,p_client_message_id uuid,p_content text,p_source_language text)
returns public.messages language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); r public.rooms; m public.messages;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text,19));
  select * into m from public.messages where sender_id=uid and client_message_id=p_client_message_id;
  if found then
    if m.room_id<>p_room_id or m.content<>trim(p_content) or m.source_language<>p_source_language then raise exception 'Idempotency key already used for different content'; end if;
    return m;
  end if;
  select * into r from public.rooms where id=p_room_id for share;
  if not found or r.status<>'active' or not wyd_private.can_read_room(r.id) or not wyd_private.event_active(r.event_id) then raise exception 'Room unavailable' using errcode='42501'; end if;
  if not exists(select 1 from public.room_participants where room_id=r.id and user_id=uid) then raise exception 'Join room first' using errcode='42501'; end if;
  if (select count(*) from public.messages where sender_id=uid and created_at>now()-interval '10 seconds')>=10 then raise exception 'Sending too quickly'; end if;
  insert into public.messages(room_id,sender_id,client_message_id,content,source_language) values(r.id,uid,p_client_message_id,trim(p_content),p_source_language) returning * into m;
  if r.room_type='help' then
    insert into public.help_alerts(event_id,room_id,message_id,sender_id,sender_name,room_name,message_text)
    select r.event_id,r.id,m.id,uid,p.display_name,r.name,m.content from public.room_participants p where p.room_id=r.id and p.user_id=uid;
  end if;
  return m;
end $$;
create function public.end_wyd_event(p_event_id text,p_user_id uuid default null)
returns void language plpgsql security definer set search_path='' as $$
declare e public.events;
begin
  select * into e from public.events where id=p_event_id for update;
  if not found or auth.uid() is null or e.owner_id<>auth.uid() or (p_user_id is not null and p_user_id<>auth.uid()) then raise exception 'Only the verified organizer may end an event' using errcode='42501'; end if;
  update public.events set status='ended',ended_at=coalesce(ended_at,now()) where id=e.id;
  update public.rooms set status='ended',ended_at=coalesce(ended_at,now()) where event_id=e.id;
end $$;
create function public.set_wyd_participant_role(p_event_id text,p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if wyd_private.event_role(p_event_id) is distinct from 'organizer' or not wyd_private.event_active(p_event_id) or p_user_id=auth.uid() or p_role not in ('staff','participant') then raise exception 'Only the organizer can assign staff' using errcode='42501'; end if;
  update public.event_participants set role=p_role,updated_at=now() where event_id=p_event_id and user_id=p_user_id and role<>'organizer';
  if not found then raise exception 'Participant not found'; end if;
end $$;
create function public.acknowledge_wyd_announcement(p_scope text,p_announcement_id bigint)
returns void language plpgsql security definer set search_path='' as $$
declare eid text; rid text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_scope='event' then
    select event_id into eid from public.event_announcements where id=p_announcement_id;
    if eid is null or wyd_private.event_role(eid) is null then raise exception 'Access denied' using errcode='42501'; end if;
    insert into public.event_announcement_reads(announcement_id,event_id,user_id,acknowledged_at) values(p_announcement_id,eid,auth.uid(),now())
    on conflict(announcement_id,user_id) do update set acknowledged_at=coalesce(public.event_announcement_reads.acknowledged_at,now());
  elsif p_scope='room' then
    select room_id into rid from public.announcements where id=p_announcement_id;
    if rid is null or not wyd_private.can_read_room(rid) then raise exception 'Access denied' using errcode='42501'; end if;
    insert into public.announcement_reads(announcement_id,room_id,user_id,acknowledged_at) values(p_announcement_id,rid,auth.uid(),now())
    on conflict(announcement_id,user_id) do update set acknowledged_at=coalesce(public.announcement_reads.acknowledged_at,now());
  else raise exception 'Invalid announcement scope'; end if;
end $$;

-- No function relies on a user ID supplied by the client for authorization.
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='wyd_private' or (n.nspname='public' and p.proname in ('wyd_security_version','create_wyd_event','join_wyd_event','join_wyd_room','send_wyd_message','end_wyd_event','set_wyd_participant_role','acknowledge_wyd_announcement')) loop
    execute format('revoke all on function %s from public,anon',f.sig);
    execute format('grant execute on function %s to authenticated',f.sig);
  end loop;
end $$;
-- Enable database change feeds only for existing application subscriptions.
do $$ declare t text; begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['events','rooms','messages','announcements','announcement_reads','event_participants','event_announcements','event_announcement_reads','event_schedule_items','event_meeting_points','help_alerts'] loop
      execute format('alter publication supabase_realtime add table public.%I',t);
    end loop;
  end if;
end $$;
-- Private presence topics require event membership, just like database rows.
do $$ begin
  if to_regclass('realtime.messages') is not null then
    execute $policy$create policy wyd_presence_read on realtime.messages for select to authenticated using (realtime.topic() like 'wyd-room-%' and wyd_private.can_read_room(substring(realtime.topic() from 10)))$policy$;
    execute $policy$create policy wyd_presence_write on realtime.messages for insert to authenticated with check (realtime.topic() like 'wyd-room-%' and wyd_private.can_read_room(substring(realtime.topic() from 10)))$policy$;
  end if;
end $$;
commit;
