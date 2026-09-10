import { createHash } from 'node:crypto';
import { jsonRecord } from './json-record.ts';
export const LANGUAGES = ['en', 'ko', 'es', 'fr', 'it', 'pt', 'de', 'pl', 'ja', 'zh'];
export const MAX_TEXT_BYTES = 9000;
const cache = new Map<string, { text: string; expires: number }>();
const pending = new Map<string, Promise<string>>();
const queue: Array<() => void> = [];
let activeChunks = 0;
let budgetDay = '', budgetUsed = 0;
const metrics = { providerRequests: 0, retries: 0, cacheHits: 0, coalesced: 0, failures: 0, maxConcurrent: 0 };
export function translationMetrics() { return { ...metrics, active: activeChunks, queued: queue.length }; }

export function splitTextByBytes(text: string, maxBytes = 450) {
  if (!Number.isInteger(maxBytes) || maxBytes < 4) throw new Error('Invalid chunk size');
  const chunks: string[] = [];
  let chunk = '';
  for (const char of text) {
    if (Buffer.byteLength(chunk + char, 'utf8') > maxBytes) {
      const boundary = Math.max(...Array.from(chunk.matchAll(/[\s.!?。！？]/g), match => match.index! + match[0].length), 0);
      const cut = boundary > chunk.length / 2 ? boundary : chunk.length;
      chunks.push(chunk.slice(0, cut)); chunk = chunk.slice(cut);
    }
    chunk += char;
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

// Preserve PR #2's entity decoding. Returned strings are rendered as React text.
export function decodeTranslation(text: string) {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return text.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (key in named) return named[key];
    const number = key[1] === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : match;
  });
}

class ProviderError extends Error {
  retryable: boolean;
  constructor(retryable: boolean) { super('Translation provider unavailable'); this.retryable = retryable; }
}

async function translateChunk(text: string, source: string, target: string, deadline: number, charge: (characters: number) => Promise<void>) {
  if (!text.trim()) return text;
  await new Promise<void>(resolve => {
    const start = () => { activeChunks++; metrics.maxConcurrent = Math.max(metrics.maxConcurrent, activeChunks); resolve(); };
    if (activeChunks < 4) start(); else queue.push(start);
  });
  try {
    const prefix = text.match(/^\s*/)?.[0] || '', suffix = text.match(/\s*$/)?.[0] || '';
    const params = new URLSearchParams({ q: text.trim(), langpair: `${source === 'zh' ? 'zh-CN' : source}|${target === 'zh' ? 'zh-CN' : target}` });
    if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL);
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new ProviderError(false);
      await charge(Array.from(text.trim()).length);
      try {
        metrics.providerRequests++;
        const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, { cache: 'no-store', signal: AbortSignal.timeout(Math.min(8000, remaining)) });
        if (!response.ok) throw new ProviderError(response.status >= 500);
        const data = jsonRecord(await response.json());
        const result = jsonRecord(data.responseData);
        if (Number(data.responseStatus) !== 200 || data.quotaFinished === true || typeof result.translatedText !== 'string' || !result.translatedText.trim()) throw new ProviderError(false);
        return prefix + decodeTranslation(result.translatedText).trim() + suffix;
      } catch (error) {
        if (attempt === 1 || (error instanceof ProviderError && !error.retryable) || deadline - Date.now() < 500) throw error;
        metrics.retries++;
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    throw new ProviderError(false);
  } finally { activeChunks--; queue.shift()?.(); }
}

export async function translate(text: string, source: string, target: string, reserve?: (characters: number) => Promise<void>): Promise<string> {
  if (!text || !LANGUAGES.includes(source) || !LANGUAGES.includes(target) || Buffer.byteLength(text) > MAX_TEXT_BYTES) throw new Error('Invalid translation input');
  if (source === target) return text;
  const key = createHash('sha256').update(JSON.stringify([source, target, text])).digest('hex');
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) { metrics.cacheHits++; return saved.text; }
  if (saved) cache.delete(key);
  const running = pending.get(key);
  if (running) { metrics.coalesced++; return running; }
  if (pending.size >= 12) throw new Error('Translation busy');
  const charge = reserve || (async (characters: number) => {
    // Development fallback. Production uses the shared database allowance.
    const today = new Date().toISOString().slice(0, 10);
    if (budgetDay !== today) { budgetDay = today; budgetUsed = 0; }
    if (budgetUsed + characters > 5000) throw new Error('Translation daily allowance reached');
    budgetUsed += characters;
  });
  const work = Promise.resolve().then(async () => {
    try {
      const deadline = Date.now() + 20000;
      const parts = await Promise.allSettled(splitTextByBytes(text).map(chunk => translateChunk(chunk, source, target, deadline, charge)));
      const result = parts.map(part => { if (part.status === 'rejected') throw part.reason; return part.value; }).join('');
      cache.set(key, { text: result, expires: Date.now() + 600000 });
      if (cache.size > 500) cache.delete(cache.keys().next().value!);
      return result;
    } catch (error) { metrics.failures++; throw error; }
    finally { pending.delete(key); }
  });
  pending.set(key, work);
  return work;
}
