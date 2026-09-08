'use client';
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Modal } from '@/components/wyd-ui';

export default function CreateEvent({ language, onClose }: { language: string; onClose: () => void }) {
  const ko = language === 'ko';
  const es = language === 'es';
  const label = (korean: string, english: string, spanish: string) => ko ? korean : es ? spanish : english;
  const router = useRouter();
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy || !name.trim()) return;
    if (start && end && new Date(end) <= new Date(start)) { setError(label('종료 시간을 시작 시간보다 늦게 설정해주세요.', 'The end must be after the start.', 'El final debe ser posterior al inicio.')); return; }
    setBusy(true); setError('');
    try {
      let senderId = localStorage.getItem('wyd_sender_id');
      if (!senderId) { senderId = crypto.randomUUID(); localStorage.setItem('wyd_sender_id', senderId); }
      const eventId = crypto.randomUUID().replaceAll('-', '').slice(0, 10);
      const roomId = crypto.randomUUID().replaceAll('-', '').slice(0, 10);
      const eventInsert = await supabase.from('events').insert({ id: eventId, name: name.trim(), description: description.trim() || null, owner_id: senderId, status: 'active', start_at: start ? new Date(start).toISOString() : null, end_at: end ? new Date(end).toISOString() : null });
      if (eventInsert.error) throw eventInsert.error;
      const roomInsert = await supabase.from('rooms').insert({ id: roomId, event_id: eventId, name: 'General', room_type: 'general', sort_order: 0, owner_id: senderId, status: 'active' });
      if (roomInsert.error) { setError(ko ? '행사는 만들어졌지만 채팅방을 만들지 못했어요. 기존 행사에서 다시 확인해주세요.' : 'The event was created, but its chat room could not be created. Open the existing event to check it.'); router.push(`/event/${eventId}`); return; }
      const displayName = localStorage.getItem('wyd_display_name');
      if (displayName) await supabase.from('event_participants').upsert({ event_id: eventId, user_id: senderId, display_name: displayName, language, role: 'organizer', updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
      router.push(`/event/${eventId}`);
    } catch { setError(label('행사를 만들지 못했어요. 연결을 확인하고 다시 시도해주세요.', 'The event could not be created. Check your connection and try again.', 'No se pudo crear el evento. Revisa tu conexión e inténtalo de nuevo.')); }
    finally { setBusy(false); }
  }
  return <Modal title={label('행사 만들기', 'Create event', 'Crear evento')} closeLabel={label('닫기', 'Close', 'Cerrar')} onClose={() => { if (!busy) onClose(); }}>
    {!supabase ? <><p className="wyd-muted">{ko ? '행사와 실시간 채팅은 아직 연결 준비 중이에요. 홈에서 QR 메시지를 만들어 전달할 수 있어요.' : 'Events and live chat are awaiting setup. You can create a QR message from Home.'}</p><button type="button" className="wyd-button wyd-button-primary wyd-full" onClick={onClose}>{ko ? '홈으로 돌아가기' : 'Back to Home'}</button></> : <form onSubmit={submit} className="wyd-event-form">
      <label className="wyd-label" htmlFor="event-name">{label('행사 이름', 'Event name', 'Nombre del evento')}</label><input id="event-name" className="wyd-input" autoFocus required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="WYD Seoul 2027"/>
      <label className="wyd-label" htmlFor="event-description">{label('설명 · 선택', 'Description · Optional', 'Descripción · Opcional')}</label><textarea id="event-description" className="wyd-textarea" rows={3} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)}/>
      <div className="wyd-field-pair"><div><label className="wyd-label" htmlFor="event-start">{label('시작 · 선택', 'Start · Optional', 'Inicio · Opcional')}</label><input className="wyd-input" id="event-start" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)}/></div><div><label className="wyd-label" htmlFor="event-end">{label('종료 · 선택', 'End · Optional', 'Fin · Opcional')}</label><input className="wyd-input" id="event-end" type="datetime-local" min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)}/></div></div>
      {error && <p role="alert" className="wyd-error">{error}</p>}<button type="submit" className="wyd-button wyd-button-primary wyd-full" disabled={busy || !name.trim()}>{busy ? label('만드는 중…', 'Creating…', 'Creando…') : label('행사 만들기', 'Create event', 'Crear evento')}</button>
    </form>}
  </Modal>;
}
