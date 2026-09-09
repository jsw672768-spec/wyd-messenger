begin;
-- Shared counters contain no text, IP address or translation content. Only the
-- database operator can change the provider allowance after checking its plan.
create table wyd_private.translation_settings (
  id boolean primary key default true check(id), daily_characters integer not null default 5000 check(daily_characters between 0 and 1000000)
);
insert into wyd_private.translation_settings default values;
create table wyd_private.translation_days (
  day date primary key, characters integer not null default 0
);
create table wyd_private.translation_windows (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null, requests integer not null, characters integer not null
);
revoke all on wyd_private.translation_settings, wyd_private.translation_days, wyd_private.translation_windows from public,anon,authenticated;
create function public.reserve_wyd_translation(p_characters integer)
returns void language plpgsql security definer set search_path='' as $$
declare uid uuid=auth.uid(); today date=(now() at time zone 'UTC')::date; allowance integer; recent wyd_private.translation_windows;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_characters is null or p_characters not between 1 and 9000 then raise exception 'Invalid character count'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wyd-translation',23));
  select daily_characters into allowance from wyd_private.translation_settings where id=true;
  insert into wyd_private.translation_days(day) values(today) on conflict do nothing;
  if (select characters from wyd_private.translation_days where day=today)+p_characters>allowance then raise exception 'Daily translation allowance reached'; end if;
  select * into recent from wyd_private.translation_windows where user_id=uid;
  if recent.window_start>now()-interval '1 minute' and (recent.requests>=60 or recent.characters+p_characters>9000) then raise exception 'Translation rate limit reached'; end if;
  insert into wyd_private.translation_windows values(uid,now(),1,p_characters)
  on conflict(user_id) do update set
    window_start=case when translation_windows.window_start>now()-interval '1 minute' then translation_windows.window_start else now() end,
    requests=case when translation_windows.window_start>now()-interval '1 minute' then translation_windows.requests+1 else 1 end,
    characters=case when translation_windows.window_start>now()-interval '1 minute' then translation_windows.characters+p_characters else p_characters end;
  update wyd_private.translation_days set characters=characters+p_characters where day=today;
  delete from wyd_private.translation_days where day<today-7;
  delete from wyd_private.translation_windows where window_start<now()-interval '1 day';
end $$;
revoke all on function public.reserve_wyd_translation(integer) from public,anon;
grant execute on function public.reserve_wyd_translation(integer) to authenticated;
commit;
