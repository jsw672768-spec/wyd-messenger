'use client';
import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

/** A receipt is created only after the on-screen notice reaches the reader.
 * Confirmation is a separate explicit action; neither depends on translation. */
export default function AnnouncementReceipt({ scope, id, parentId, userId, language }: {
  scope: 'event' | 'room'; id: number; parentId: string; userId: string; language: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const db = getSupabaseBrowser();
  const table = scope === 'event' ? 'event_announcement_reads' : 'announcement_reads';
  useEffect(() => {
    if (!db || !userId || !element.current) return;
    let active = true, read = false, visible = false, writing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    db.from(table).select('acknowledged_at').eq('announcement_id', id).eq('user_id', userId).maybeSingle().then(result => {
      if (!active || result.error) return;
      read = Boolean(result.data);
      setConfirmed(Boolean(result.data?.acknowledged_at));
    });
    const markRead = async () => {
      if (!active || read || writing || !visible || document.visibilityState !== 'visible') return;
      writing = true;
      const result = await db.from(table).insert({ announcement_id: id, user_id: userId, [scope === 'event' ? 'event_id' : 'room_id']: parentId });
      writing = false;
      if (!result.error || result.error.code === '23505') read = true;
    };
    const schedule = () => {
      clearTimeout(timer);
      if (visible && document.visibilityState === 'visible') timer = setTimeout(markRead, 800);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0.5 });
    observer.observe(element.current);
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('online', schedule);
    return () => { active = false; clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', schedule); window.removeEventListener('online', schedule); };
  }, [db, table, scope, id, parentId, userId]);
  async function confirm() {
    if (!db || !userId || busy || confirmed) return;
    setBusy(true); setError('');
    try {
      const result = await db.rpc('acknowledge_wyd_announcement', { p_scope: scope, p_announcement_id: id });
      if (result.error) throw result.error;
      setConfirmed(true);
    } catch { setError(language === 'ko' ? '확인 상태를 저장하지 못했어요. 다시 눌러주세요.' : 'Confirmation was not saved. Please retry.'); }
    finally { setBusy(false); }
  }
  return <div ref={element} className="mt-3 text-xs">
    <button type="button" onClick={confirm} disabled={busy || confirmed || !userId} className="rounded-full border border-current px-4 py-2 font-bold disabled:opacity-60">
      {confirmed ? (language === 'ko' ? '✓ 확인 완료' : '✓ Confirmed') : busy ? '…' : language === 'ko' ? '내용을 확인했어요' : 'Confirm notice'}
    </button>
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
  </div>;
}
