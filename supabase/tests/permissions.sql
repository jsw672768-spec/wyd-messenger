\set ON_ERROR_STOP on
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.create_wyd_event('WYD A','Test',null,null,'방장','ko') as event_a \gset
select set_config('test.event_a',:'event_a',false);
select id as room_a from public.rooms where event_id=:'event_a' \gset
select set_config('test.room_a',:'room_a',false);
insert into public.event_announcements(event_id,author_id,content,source_language,priority)
values(:'event_a',auth.uid(),'오후 3시 성당 앞에서 모입니다.','ko','urgent') returning id as notice_a \gset
select set_config('test.notice_a',:'notice_a',false);
insert into public.event_schedule_items(event_id,title,starts_at,source_language) values(:'event_a','Gathering',now()+interval '1 hour','en');
insert into public.event_meeting_points(event_id,name,details,source_language) values(:'event_a','Church entrance','Meet here','en');

set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.create_wyd_event('WYD B',null,null,null,'Other organizer','es') as event_b \gset
select set_config('test.event_b',:'event_b',false);
do $$ begin
  assert (select count(*)=0 from public.events where id=current_setting('test.event_a')), 'Cross-event event leak';
  assert (select count(*)=0 from public.event_announcements where event_id=current_setting('test.event_a')), 'Cross-event announcement leak';
  assert (select count(*)=0 from public.event_schedule_items where event_id=current_setting('test.event_a')), 'Cross-event schedule leak';
  begin
    perform public.end_wyd_event(current_setting('test.event_a'),'00000000-0000-4000-8000-000000000001');
    raise exception 'Forged organizer ID was accepted';
  exception when insufficient_privilege then null; end;
end $$;

set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
select public.join_wyd_event(:'event_a','Participant','fr');
select public.join_wyd_room(:'room_a','Participant','fr');
select public.send_wyd_message(:'room_a','10000000-0000-4000-8000-000000000001','Bonjour!','fr');
select public.send_wyd_message(:'room_a','10000000-0000-4000-8000-000000000001','Bonjour!','fr');
select public.acknowledge_wyd_announcement('event',:'notice_a');
select public.acknowledge_wyd_announcement('event',:'notice_a');
do $$ begin
  assert (select count(*)=1 from public.messages), 'Duplicate message inserted';
  assert (select count(*)=1 from public.event_announcement_reads where acknowledged_at is not null), 'Acknowledgement is not idempotent';
  assert (select count(*)=1 from public.event_schedule_items), 'Participant cannot view schedule';
  assert (select count(*)=1 from public.event_meeting_points), 'Participant cannot view meeting point';
  begin
    update public.event_participants set role='organizer' where user_id=auth.uid();
    raise exception 'Role escalation was accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.events set owner_id=auth.uid() where id=current_setting('test.event_a');
    raise exception 'Ownership theft was accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.messages set content='tampered';
    raise exception 'Message edit was accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.event_announcements(event_id,author_id,content,source_language) values(current_setting('test.event_a'),auth.uid(),'forged','fr');
    raise exception 'Participant announcement was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_wyd_participant_role(current_setting('test.event_a'),auth.uid(),'staff');
    raise exception 'Self promotion was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.end_wyd_event(current_setting('test.event_a'));
    raise exception 'Participant event closure was accepted';
  exception when insufficient_privilege then null; end;
end $$;

set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.set_wyd_participant_role(:'event_a','00000000-0000-4000-8000-000000000002','staff');
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
-- Rejoining must preserve a server-granted role.
select public.join_wyd_event(:'event_a','Staff','fr');
insert into public.event_announcements(event_id,author_id,content,source_language) values(:'event_a',auth.uid(),'Staff announcement','fr');
do $$ begin
  assert (select role='staff' from public.event_participants where event_id=current_setting('test.event_a') and user_id=auth.uid()), 'Rejoin downgraded staff';
  begin
    perform public.end_wyd_event(current_setting('test.event_a'));
    raise exception 'Staff event closure was accepted';
  exception when insufficient_privilege then null; end;
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
select public.end_wyd_event(:'event_a');
do $$ begin
  assert (select bool_and(status='ended') from public.rooms where event_id=current_setting('test.event_a')), 'Room closure not atomic';
end $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ begin
  begin
    perform public.send_wyd_message(current_setting('test.room_a'),'10000000-0000-4000-8000-000000000002','After closing','fr');
    raise exception 'Message after closure was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin
    perform * from public.events;
    raise exception 'Unauthenticated read was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.join_wyd_event(current_setting('test.event_a'),'Forged','en');
    raise exception 'Unauthenticated join was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: authenticated owner, participant, outsider, staff, receipts, idempotency and event closure' as result;
