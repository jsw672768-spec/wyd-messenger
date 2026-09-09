type Translatable = { content: string; source_language: string };
const pending = new Map<string, Promise<string>>();
const cache = new Map<string, string>();
let active = 0;
const queue: Array<() => void> = [];

export function translationKey(item: Translatable, language: string) {
  return JSON.stringify([item.source_language, language, item.content]);
}

export function translateText(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  if (!text || sourceLanguage === targetLanguage) return Promise.resolve(text);
  const key = translationKey({ content: text, source_language: sourceLanguage }, targetLanguage);
  const saved = cache.get(key);
  if (saved !== undefined) return Promise.resolve(saved);
  const running = pending.get(key);
  if (running) return running;
  const task = (async () => {
    await new Promise<void>((resolve) => {
      const start = () => { active++; resolve(); };
      if (active < 3) start(); else queue.push(start);
    });
    try {
      const response = await fetch('/api/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage }),
        signal: AbortSignal.timeout(45000),
      });
      const data = await response.json();
      if (!response.ok || typeof data.translatedText !== 'string' || !data.translatedText.trim()) throw new Error('Translation unavailable');
      cache.set(key, data.translatedText);
      if (cache.size > 300) cache.delete(cache.keys().next().value!);
      return data.translatedText as string;
    } finally { active--; queue.shift()?.(); pending.delete(key); }
  })();
  pending.set(key, task);
  return task;
}
