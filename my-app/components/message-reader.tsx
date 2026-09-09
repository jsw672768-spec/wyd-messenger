'use client';
import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';
import { decodeMessage } from '@/lib/message-link';
import { languageName, readerCopy, saveLanguage } from '@/lib/languages';
import { Brand, Icon, LanguageSelect } from '@/components/wyd-ui';
import { usePreferredLanguage } from '@/lib/use-preferred-language';
import TranslatedMessage from '@/components/translated-message';

export default function MessageReader() {
  const [language, setLanguage] = usePreferredLanguage();
  const hash = useSyncExternalStore(callback => {
    window.addEventListener('hashchange', callback);
    return () => window.removeEventListener('hashchange', callback);
  }, () => window.location.hash, () => null);
  const ready = hash !== null;
  const message = useMemo(() => hash ? decodeMessage(hash.slice(1)) : null, [hash]);
  const t = readerCopy(language);
  return <main className="wyd-home wyd-reader"><div className="wyd-reader-shell">
    <header className="wyd-header"><Brand/><Link href="/" className="wyd-home-link">{t.home}</Link></header>
    {!ready ? <div className="wyd-card wyd-reader-card"><p className="wyd-translation-status" role="status"><span className="wyd-spinner"/>{t.opening}</p></div> : !message ? <section className="wyd-card wyd-reader-card"><span className="wyd-icon-tile"><Icon name="link"/></span><h1>{t.invalidTitle}</h1><p className="wyd-muted">{t.invalidBody}</p><Link href="/" className="wyd-button wyd-button-primary">{t.home}</Link></section> : <>
      <section className="wyd-card wyd-reader-card" aria-labelledby="reader-title"><div className="wyd-reader-accent"/><div className="wyd-reader-heading"><span className="wyd-icon-tile"><Icon name="write"/></span><p className="wyd-eyebrow">WYD MESSAGE</p></div><h1 id="reader-title">{t.title}</h1>
        {message.sender && <p className="wyd-sender">{t.sender} <strong dir="auto">{message.sender}</strong></p>}
        <LanguageSelect value={language} label={t.languageLabel} onChange={(code) => { setLanguage(code); saveLanguage(code); }}/>
        <div className="wyd-reader-message"><p className="wyd-result-label">{languageName(message.source)} <span aria-hidden="true">→</span> {languageName(language)}</p><TranslatedMessage text={message.text} source={message.source} target={language}/></div>
        {message.source !== language && <><details className="wyd-original"><summary>{t.original} · {languageName(message.source)}</summary><p className="wyd-message-text" lang={message.source} dir="auto">{message.text}</p></details><p className="wyd-field-note">{t.notice}</p></>}
      </section>
      <Link href="/#write" className="wyd-button wyd-button-secondary wyd-full">{t.compose}<Icon name="arrow" size={18}/></Link>
    </>}
    <footer className="wyd-reader-footer">WYD Messenger</footer>
  </div></main>;
}
