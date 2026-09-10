'use client';
import { useEffect, useState } from 'react';
import { translateText, translationKey } from './translation-client';

/** A result belongs to the exact text/language pair, including while a retry is running. */
export function useTranslation(text: string, source: string, target: string) {
  const key = translationKey({ content: text, source_language: source }, target);
  const [result, setResult] = useState<{ key: string; text: string; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!text || source === target) return;
    translateText(text, source, target).then(
      value => { if (active) setResult({ key, text: value, failed: false }); },
      () => { if (active) setResult({ key, text: '', failed: true }); },
    );
    return () => { active = false; };
  }, [text, source, target, key, attempt]);
  const current = result?.key === key ? result : null;
  const status = !text || source === target ? 'original' : !current ? 'loading' : current.failed ? 'failed' : 'translated';
  return {
    text: status === 'translated' ? current!.text : '', status,
    retry: () => { setResult(null); setAttempt(value => value + 1); },
  };
}
