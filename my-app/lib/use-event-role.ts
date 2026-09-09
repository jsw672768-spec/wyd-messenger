'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from './supabase-browser';

/** UI hints only. Every mutation is still authorized by the database. */
export function useEventRole(eventId: string | null, userId: string) {
  const [result, setResult] = useState<{ key: string; role: string; active: boolean } | null>(null);
  const key = `${eventId}:${userId}`;
  useEffect(() => {
    const db = getSupabaseBrowser();
    if (!db || !eventId || !userId) return;
    let live = true, busy = false;
    async function refresh() {
      if (!live || busy) return;
      busy = true;
      try {
        const [member, event] = await Promise.all([
          db!.from('event_participants').select('role').eq('event_id', eventId!).eq('user_id', userId).maybeSingle(),
          db!.from('events').select('status').eq('id', eventId!).maybeSingle(),
        ]);
        if (live) setResult({ key, role: member.error ? '' : member.data?.role || '', active: !event.error && event.data?.status === 'active' });
      } finally { busy = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 10000);
    const channel = db.channel(`wyd-role-${eventId}-${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants', filter: `event_id=eq.${eventId}` }, refresh).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, refresh).subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    return () => { live = false; clearInterval(timer); void db.removeChannel(channel); };
  }, [eventId, userId, key]);
  const current = result?.key === key ? result : null;
  return { role: current?.role || '', isOrganizer: current?.role === 'organizer', canManage: Boolean(current?.active && ['organizer', 'staff'].includes(current.role)) };
}
