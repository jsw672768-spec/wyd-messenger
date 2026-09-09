-- Read-only inspection before connecting the existing WYD database.
-- This script does not modify tables, permissions, functions, or user data.

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('events', 'rooms', 'messages', 'announcements',
    'announcement_reads', 'room_participants', 'event_participants',
    'event_announcements', 'event_announcement_reads', 'event_schedule_items',
    'event_meeting_points', 'help_alerts')
ORDER BY table_name, ordinal_position;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND c.relname IN ('events', 'rooms', 'messages', 'announcements',
    'announcement_reads', 'room_participants', 'event_participants',
    'event_announcements', 'event_announcement_reads', 'event_schedule_items',
    'event_meeting_points', 'help_alerts')
ORDER BY c.relname;

SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT c.relname AS table_name, con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint AS con
JOIN pg_class AS c ON c.oid = con.conrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, con.conname;

SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer, pg_get_functiondef(p.oid) AS definition
FROM pg_proc AS p JOIN pg_namespace AS n ON n.oid = p.pronamespace
WHERE n.nspname = 'wyd_private' OR (n.nspname = 'public' AND p.proname IN (
  'wyd_security_version', 'create_wyd_event', 'join_wyd_event', 'join_wyd_room',
  'send_wyd_message', 'end_wyd_event', 'set_wyd_participant_role',
  'acknowledge_wyd_announcement', 'reserve_wyd_translation'));

SELECT routine_schema, routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema IN ('public', 'wyd_private')
ORDER BY routine_schema, routine_name, grantee;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'realtime' AND tablename = 'messages'
ORDER BY policyname;

SELECT pubname, schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
ORDER BY tablename;
