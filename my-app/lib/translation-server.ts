import { createHash } from 'node:crypto';
export const LANGUAGES = ['en', 'ko', 'es', 'fr', 'it', 'pt', 'de', 'pl', 'ja', 'zh'];
export const MAX_TEXT_BYTES = 9000;
const cache = new Map<string, { text: string; expires: number }>();
const pending = new Map<string, Promise<string>>();
let activeChunks = 0;
const queue: Array<() => void> = [];
export function splitTextByBytes(text: string, maxBytes = 450) {
  const chunks: string[] = [];
  let chunk = '';
  for (const char of text) {
    if (Buffer.byteLength(chunk + char, 'utf8') > maxBytes) { chunks.push(chunk); chunk = ''; }
    chunk += char;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
async function translateChunk(text: string, source: string, target: string, deadline: number) {
  await new Promise<void>((resolve) => {
    const start = () => { activeChunks++; resolve(); };
    if (activeChunks < 4) start(); else queue.push(start);
  });
  try {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Translation timed out');
    const params = new URLSearchParams({ q: text, langpair: `${source === 'zh' ? 'zh-CN' : source}|${target === 'zh' ? 'zh-CN' : target}` });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, { cache: 'no-store', signal: AbortSignal.timeout(Math.min(10000, remaining)) });
    const data = await response.json();
    if (!response.ok || Number(data.responseStatus) !== 200 || data.quotaFinished === true || typeof data.responseData?.translatedText !== 'string' || !data.responseData.translatedText.trim()) throw new Error('Translation provider unavailable');
    return data.responseData.translatedText as string;
  } finally { activeChunks--; queue.shift()?.(); }
}
export async function translate(text: string, source: string, target: string) {
  const key = createHash('sha256').update(JSON.stringify([source, target, text])).digest('hex');
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.text;
  if (saved) cache.delete(key);
  const running = pending.get(key);
  if (running) return running;
  if (pending.size >= 12) throw new Error('Translation busy');
  const work = (async () => {
    try {
      const deadline = Date.now() + 20000;
      const parts = await Promise.allSettled(splitTextByBytes(text).map((chunk) => translateChunk(chunk, source, target, deadline)));
      const result = parts.map((part) => { if (part.status === 'rejected') throw part.reason; return part.value; }).join('');
      cache.set(key, { text: result, expires: Date.now() + 600000 });
      if (cache.size > 500) cache.delete(cache.keys().next().value!);
      return result;
    } finally { pending.delete(key); }
  })();
  pending.set(key, work);
  return work;
}
