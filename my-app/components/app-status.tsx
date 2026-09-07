'use client';
import { useEffect, useState } from 'react';
export default function AppStatus() {
  const [offline, setOffline] = useState(false);
  const [ko, setKo] = useState(false);
  useEffect(() => {
    const update = () => { setOffline(!navigator.onLine); setKo(document.documentElement.lang === 'ko'); };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    }
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return <div role="status" className="sticky top-0 z-[100] bg-amber-100 px-4 py-3 text-center text-sm text-amber-950">{ko ? '인터넷 연결이 끊겼어요. 메시지 전송과 번역은 연결 후 다시 시도해주세요.' : 'You are offline. Reconnect before sending messages or translating.'}</div>;
}
