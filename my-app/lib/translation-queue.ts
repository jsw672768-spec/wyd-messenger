import { jsonRecord } from './json-record.ts';
export type TranslationInput = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

const pending = new Map<string, Promise<string>>();
const memory = new Map<string, string>();
const MAX_CACHE = 500;

export async function translateText(input: TranslationInput): Promise<string> {
  const key = JSON.stringify(input);
  if (input.sourceLanguage === input.targetLanguage) return input.text;
  const cached = memory.get(key);
  if (cached !== undefined) return cached;
  const existing = pending.get(key);
  if (existing) return existing;
  const task = (async () => {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(`Translation HTTP ${response.status}`);
    const data = jsonRecord(await response.json());
    if (typeof data.translatedText !== "string" || !data.translatedText.trim()) throw new Error("Empty translation");
    memory.set(key, data.translatedText);
    if (memory.size > MAX_CACHE) memory.delete(memory.keys().next().value!);
    return data.translatedText as string;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}

export async function translateMany<T>(
  items: T[],
  input: (item: T) => TranslationInput,
  onResult: (item: T, translated: string) => void,
  concurrency = 4,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try { onResult(item, await translateText(input(item))); } catch { /* Keep the original visible and allow later retry. */ }
    }
  });
  await Promise.all(workers);
}
