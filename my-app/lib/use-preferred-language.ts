'use client';
import { useSyncExternalStore } from 'react';
import { preferredLanguage, saveLanguage } from './languages';
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback); window.addEventListener('wyd-language', callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener('wyd-language', callback); };
};
export function usePreferredLanguage(fallback = 'en') {
  const language = useSyncExternalStore(subscribe, preferredLanguage, () => fallback);
  return [language, saveLanguage] as const;
}
