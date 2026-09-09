type Translatable = { content: string; source_language: string };
const pending = new Map<string, Promise<string>>();
const cache = new Map<string, { text: string; expires: number }>();
let active = 0;
const queue: Array<() => void> = [];

export function translationKey(item: Translatable, language: string) {
  return JSON.stringify([item.source_language, language, item.content]);
}

export function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  if (!text || sourceLanguage === targetLanguage) return Promise.resolve(text);
  const key = translationKey({ content: text, source_language: sourceLanguage }, targetLanguage);
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.text);
  if (saved) cache.delete(key);
  const running = pending.get(key);
  if (running) return running;
  if (pending.size >= 100) return Promise.reject(new Error('Translation queue full'));
  const task = (async () => {
    await new Promise<void>((resolve) => {
      const start = () => { active++; resolve(); };
      if (active < 3) start(); else queue.push(start);
    });
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { ensureWydIdentity, getSupabaseBrowser } = await import('./supabase-browser.ts');
        await ensureWydIdentity();
        const session = await getSupabaseBrowser()!.auth.getSession();
        if (!session.data.session) throw new Error('Authentication unavailable');
        headers.Authorization = `Bearer ${session.data.session.access_token}`;
      }
      const response = await fetch('/api/translate', {
        method: 'POST', headers,
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await response.json();
      if (!response.ok || typeof data.translatedText !== 'string' || !data.translatedText.trim()) throw new Error('Translation unavailable');
      cache.set(key, { text: data.translatedText, expires: Date.now() + 600000 });
      if (cache.size > 300) cache.delete(cache.keys().next().value!);
      return data.translatedText as string;
    } finally { active--; queue.shift()?.(); pending.delete(key); }
  })();
  pending.set(key, task);
  return task;
}
