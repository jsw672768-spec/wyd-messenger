'use client';
import { useEffect, useState } from 'react';
import { translateText, translationKey } from '@/lib/translation-client';
import { readerCopy } from '@/lib/languages';

export default function TranslatedMessage({ text, source, target }: { text: string; source: string; target: string }) {
  const key = translationKey({ content: text, source_language: source }, target);
  const [result, setResult] = useState<{ key: string; text: string; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const t = readerCopy(target);
  useEffect(() => {
    let cancelled = false;
    if (source === target) return;
    translateText(text, source, target).then(
      (translated) => { if (!cancelled) setResult({ key, text: translated, failed: false }); },
      () => { if (!cancelled) setResult({ key, text, failed: true }); },
    );
    return () => { cancelled = true; };
  }, [text, source, target, key, attempt]);
  const current = result?.key === key ? result : null;
  const loading = source !== target && !current;
  return <div className="wyd-translation" aria-live="polite" aria-busy={loading}>
    {loading ? <><p className="wyd-translation-status"><span className="wyd-spinner"/>{t.loading}</p><p className="wyd-message-text wyd-original-loading" lang={source}>{text}</p></> : <p className="wyd-message-text" lang={current?.failed ? source : target} dir="auto">{source === target ? text : current?.text}</p>}
    {current?.failed && source !== target && <div className="wyd-error"><p>{t.error}</p><button type="button" className="wyd-text-button" onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>{t.retry}</button></div>}
  </div>;
}
