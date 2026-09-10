'use client';
import { useEffect, useState } from 'react';
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export default function InstallApp({ language }: { language: string }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const ko = language === 'ko';
  useEffect(() => {
    const media = matchMedia('(display-mode: standalone)');
    const update = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const done = () => { setInstalled(true); setPrompt(null); };
    update();
    media.addEventListener('change', update);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', done);
    return () => { media.removeEventListener('change', update); window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', done); };
  }, []);
  if (installed) return null;
  async function install() {
    if (!prompt) { setHelp(!help); return; }
    setBusy(true);
    try { await prompt.prompt(); const choice = await prompt.userChoice; if (choice.outcome === 'accepted') setInstalled(true); }
    catch { setHelp(true); }
    finally { setPrompt(null); setBusy(false); }
  }
  return <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-left">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-sm font-bold">WYD Messenger</p><p className="mt-1 text-xs text-neutral-500">{ko ? '홈 화면에서 바로 시작하세요' : 'Open straight from your home screen'}</p></div>
      <button type="button" disabled={busy} onClick={install} className="rounded-full bg-[#101820] px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{ko ? '앱 설치' : 'Install app'}</button>
    </div>
    {help && <p role="status" className="mt-3 text-xs leading-6 text-neutral-600">{ko ? '삼성 인터넷·Chrome: 브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요. iPhone·iPad: Safari의 공유 메뉴에서 “홈 화면에 추가”를 선택하세요. 설치 항목이 없다면 HTTPS 주소로 열었는지 확인하세요.' : 'In Samsung Internet or Chrome, open the browser menu and choose Install app or Add to Home screen. On iPhone or iPad, use Safari → Share → Add to Home Screen. Installation requires an HTTPS address.'}</p>}
  </div>;
}
