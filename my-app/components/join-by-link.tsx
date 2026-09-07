'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinPath } from '@/lib/join-path';
export default function JoinByLink({ language }: { language: string }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();
  const ko = language === 'ko';
  return <details className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm">
    <summary className="cursor-pointer font-semibold">{ko ? 'QR 대신 초대 링크로 입장' : 'Join with an invitation link'}</summary>
    <form className="mt-3" onSubmit={(event) => { event.preventDefault(); const path = joinPath(value); if (path) router.push(path); else setError(true); }}>
      <label htmlFor="invitation" className="block text-xs text-neutral-500">{ko ? '받은 WYD 초대 링크를 붙여넣으세요' : 'Paste your WYD invitation link'}</label>
      <div className="mt-2 flex gap-2"><input id="invitation" value={value} onChange={(event) => { setValue(event.target.value); setError(false); }} required autoCapitalize="none" autoCorrect="off" className="min-w-0 flex-1 rounded-xl border border-neutral-200 p-3" placeholder="https://…/event/…"/><button className="rounded-xl bg-[#2868d8] px-4 text-white">{ko ? '입장' : 'Join'}</button></div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{ko ? '이벤트 또는 채팅방 초대 링크를 확인해주세요.' : 'Check the event or room invitation link.'}</p>}
    </form>
  </details>;
}
