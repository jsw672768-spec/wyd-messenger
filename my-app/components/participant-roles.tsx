'use client';
import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type Member = { user_id: string; display_name: string; language: string; role: string };
export default function ParticipantRoles({ eventId, ownerId, language, ended }: { eventId: string; ownerId: string; language: string; ended: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const db = getSupabaseBrowser();
  useEffect(() => {
    if (!db) return;
    let active = true;
    db.from('event_participants').select('user_id,display_name,language,role').eq('event_id', eventId).order('display_name').then(result => { if (active && !result.error) setMembers(result.data || []); });
    return () => { active = false; };
  }, [db, eventId, revision]);
  async function assign(member: Member) {
    if (!db || busy || ended) return;
    setBusy(member.user_id); setError('');
    try {
      const result = await db.rpc('set_wyd_participant_role', { p_event_id: eventId, p_user_id: member.user_id, p_role: member.role === 'staff' ? 'participant' : 'staff' });
      if (result.error) throw result.error;
      setRevision(value => value + 1);
    } catch { setError(language === 'ko' ? '권한을 변경하지 못했어요. 다시 시도해주세요.' : 'Role change failed. Please retry.'); }
    finally { setBusy(''); }
  }
  return <section className="mt-6 rounded-3xl border border-neutral-100 bg-white p-5">
    <h2 className="text-lg font-black">{language === 'ko' ? '참가자와 운영진' : 'Participants & staff'}</h2>
    <p className="mt-2 text-xs leading-5 text-neutral-500">{language === 'ko' ? '운영진은 공지·일정·채팅방을 관리할 수 있어요. 행사 종료와 운영진 지정은 방장만 할 수 있어요.' : 'Staff manage notices, schedules and rooms. Only the organizer ends the event or assigns staff.'}</p>
    <ul className="mt-4 divide-y divide-neutral-100">{members.map(member => <li key={member.user_id} className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="min-w-0 break-words">{member.display_name} <small className="text-neutral-500">{member.language.toUpperCase()} · {member.role}</small></span>
      {member.user_id !== ownerId && !ended && <button type="button" disabled={Boolean(busy)} onClick={() => assign(member)} className="shrink-0 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{busy === member.user_id ? '…' : member.role === 'staff' ? (language === 'ko' ? '참가자로 변경' : 'Remove staff role') : language === 'ko' ? '운영진 지정' : 'Make staff'}</button>}
    </li>)}</ul>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
