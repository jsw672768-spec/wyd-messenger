'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { languages } from '@/lib/languages';

export function Brand() {
  return <Link href="/" className="wyd-brand" aria-label="WYD Messenger"><span>WYD<span className="wyd-brand-dot">.</span></span><small>MESSENGER</small></Link>;
}
export function Icon({ name, size = 24 }: { name: 'scan' | 'write' | 'arrow' | 'link' | 'globe' | 'plus' | 'check' | 'close'; size?: number }) {
  const paths = {
    scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M3 12h2m14 0h2"/></>,
    write: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15l-1 5ZM13 20h8"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    link: <><path d="m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function LanguageSelect({ value, onChange, label, compact = false }: { value: string; onChange: (value: string) => void; label: string; compact?: boolean }) {
  const id = useId();
  return <div className={compact ? 'wyd-language compact' : 'wyd-language'}><label htmlFor={id} className={compact ? 'sr-only' : 'wyd-label'}>{label}</label><div className="wyd-select-wrap">{compact && <Icon name="globe" size={18}/>}<select id={id} value={value} onChange={(event) => onChange(event.target.value)}>{languages.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}</select></div></div>;
}
export function Modal({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="wyd-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}><section><header className="wyd-dialog-header"><h2 id={titleId}>{title}</h2><button className="wyd-icon-button" type="button" aria-label={closeLabel} onClick={onClose}><Icon name="close"/></button></header>{children}</section></dialog>;
}
