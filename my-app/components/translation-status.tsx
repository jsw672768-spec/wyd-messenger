'use client';
import { readerCopy } from '@/lib/languages';
export default function TranslationStatus({ status, language, retry }: { status: string; language: string; retry: () => void }) {
  const t = readerCopy(language);
  if (status !== 'failed' && status !== 'loading') return null;
  return <span className="mt-2 block text-xs font-medium leading-5 text-neutral-600" role="status">
    {status === 'loading' ? t.loading : t.error}
    {status === 'failed' && <button type="button" onClick={retry} className="ml-2 underline">{t.retry}</button>}
  </span>;
}
