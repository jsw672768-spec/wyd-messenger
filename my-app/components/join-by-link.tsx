'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinPath } from '@/lib/join-path';
export default function JoinByLink({ language }: { language: string }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();
  const ko = language === 'ko';
  return <details className="wyd-join-link">
    <summary>{ko ? 'QR 대신 링크로 열기' : language === 'es' ? 'Abrir con un enlace' : 'Open with a link'}</summary>
    <form className="mt-3" onSubmit={(event) => { event.preventDefault(); const path = joinPath(value); if (path) router.push(path); else setError(true); }}>
      <label htmlFor="invitation" className="wyd-label">{ko ? '받은 WYD 링크를 붙여넣으세요' : 'Paste your WYD link'}</label>
      <div className="wyd-link-entry"><input id="invitation" value={value} onChange={(event) => { setValue(event.target.value); setError(false); }} required autoCapitalize="none" autoCorrect="off" spellCheck={false} className="wyd-input" placeholder="https://…"/><button className="wyd-button wyd-button-primary">{ko ? '열기' : 'Open'}</button></div>
      {error && <p role="alert" className="wyd-error">{ko ? '메시지·행사·채팅방 링크 전체를 확인해주세요.' : 'Check the full message, event, or room link.'}</p>}
    </form>
  </details>;
}
