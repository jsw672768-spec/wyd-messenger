'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import JoinByLink from '@/components/join-by-link';
import InstallApp from '@/components/install-app';
import MessageComposer from '@/components/message-composer';
import QrScanner from '@/components/qr-scanner';
import CreateEvent from '@/components/create-event';
import { Brand, Icon, LanguageSelect } from '@/components/wyd-ui';
import { preferredLanguage, saveLanguage } from '@/lib/languages';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState('ko');
  const [ready, setReady] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const ko = language === 'ko';
  const es = language === 'es';
  const eventConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  useEffect(() => {
    const initial = preferredLanguage();
    setLanguage(initial); saveLanguage(initial);
    let seen = false;
    try { seen = sessionStorage.getItem('wyd_welcome_seen') === '1'; sessionStorage.setItem('wyd_welcome_seen', '1'); } catch {}
    const timer = setTimeout(() => setReady(true), seen || window.location.hash ? 0 : 650);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (ready && window.location.hash === '#write') document.getElementById('write')?.scrollIntoView({ block: 'start' });
  }, [ready]);
  const enter = useCallback((path: string) => { setShowScanner(false); router.push(path); }, [router]);
  if (!ready) return <main className="wyd-splash"><div><span className="wyd-splash-word">WYD<span>.</span></span><p>MESSENGER</p></div></main>;
  return <main className="wyd-home">
    <div className="wyd-shell">
      <header className="wyd-header"><Brand/><LanguageSelect compact value={language} label={ko ? '화면 언어' : 'Interface language'} onChange={(code) => { setLanguage(code); saveLanguage(code); }}/></header>
      <div className="wyd-page-intro"><p className="wyd-eyebrow">WYD CONNECT</p><h1>{ko ? '만나고, 전하고, 함께하기.' : es ? 'Conecta en tu idioma.' : 'Connect in your own language.'}</h1></div>
      <div className="wyd-workspace">
        <div className="wyd-connect-column">
          <section className="wyd-scan-card" aria-labelledby="scan-title">
            <div className="wyd-scan-top"><span className="wyd-step">01</span><span>{ko ? 'QR로 연결하기' : es ? 'Conectar con QR' : 'Connect with QR'}</span><Icon name="globe" size={22}/></div>
            <div className="wyd-scan-symbol"><Icon name="scan" size={66}/></div>
            <h2 id="scan-title">{ko ? 'QR을 찍고\n바로 시작해요.' : es ? 'Escanea.\nConecta.' : 'One scan.\nYou’re connected.'}</h2>
            <p>{ko ? '받은 메시지를 읽거나\n함께할 행사에 참여하세요.' : es ? 'Lee un mensaje o únete a tu evento.' : 'Read a message or join your event.'}</p>
            <button type="button" onClick={() => setShowScanner(true)} className="wyd-button wyd-scan-button"><Icon name="scan" size={20}/>{ko ? 'QR 스캔하기' : es ? 'Escanear QR' : 'Scan QR'}<Icon name="arrow" size={20}/></button>
          </section>
          <JoinByLink language={language}/>
          <section className="wyd-event-card"><span className="wyd-icon-tile"><Icon name="plus"/></span><div><h2>{ko ? '함께할 행사 만들기' : es ? 'Crea tu evento' : 'Bring your event together'}</h2><p>{ko ? '공지, 일정, 채팅을 한 공간에서.' : es ? 'Anuncios, horarios y chat en un solo lugar.' : 'Announcements, schedules, and chat in one place.'}</p></div><button type="button" className="wyd-event-button" aria-label={ko ? '행사 만들기' : 'Create event'} onClick={() => setShowEvent(true)}><Icon name="arrow"/></button></section>
          {!eventConfigured && <p className="wyd-event-status">{ko ? '행사·실시간 채팅은 연결 준비 중이에요.' : es ? 'Los eventos y el chat esperan la configuración.' : 'Events and live chat are awaiting setup.'}</p>}
        </div>
        <MessageComposer language={language}/>
      </div>
      <footer className="wyd-footer"><p><Icon name="globe" size={18}/>{ko ? '10개 언어로 전하는 마음' : es ? 'Mensajes en 10 idiomas' : 'Messages in 10 languages'}</p><span>WYD MESSENGER</span></footer>
      <div className="wyd-install"><InstallApp language={language}/></div>
    </div>
    {showScanner && <QrScanner language={language} onClose={() => setShowScanner(false)} onDetected={enter}/>}
    {showEvent && <CreateEvent language={language} onClose={() => setShowEvent(false)}/>}
  </main>;
}
