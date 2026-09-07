import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const languages = new Set(["en", "ko", "es", "fr", "it", "pt", "de", "pl", "ja", "zh"]);
const pending = new Map<string, Promise<string>>();
const memory = new Map<string, string>();
const MAX_CACHE = 500;
const MAX_TEXT = 12000;

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function hash(text: string) { return createHash("sha256").update(text).digest("hex"); }
function decode(text: string) {
  return text.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|amp|lt|gt|quot|apos|#39);/gi, (match, entity: string) => {
    const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
    const key = entity.toLowerCase();
    if (key in named) return named[key];
    if (!key.startsWith("#")) return match;
    const numeric = key[1] === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return Number.isInteger(numeric) && numeric > 0 && numeric <= 0x10ffff && !(numeric >= 0xd800 && numeric <= 0xdfff) ? String.fromCodePoint(numeric) : match;
  });
}
function splitText(text: string, maxBytes = 450) {
  const chunks: string[] = [];
  let current = "";
  for (const character of text) {
    if (Buffer.byteLength(current + character, "utf8") > maxBytes && current) { chunks.push(current); current = ""; }
    current += character;
  }
  if (current) chunks.push(current);
  return chunks;
}
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key) : null;
}
async function translateChunk(text: string, source: string, target: string) {
  const params = new URLSearchParams({ q: text, langpair: `${source === "zh" ? "zh-CN" : source}|${target === "zh" ? "zh-CN" : target}`, mt: "1" });
  if (process.env.MYMEMORY_EMAIL) params.set("de", process.env.MYMEMORY_EMAIL);
  const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Provider HTTP ${response.status}`);
  const data = await response.json();
  if (Number(data.responseStatus) !== 200 || typeof data.responseData?.translatedText !== "string" || !data.responseData.translatedText.trim()) throw new Error("Translation provider rejected the request");
  return decode(data.responseData.translatedText);
}
async function translate(text: string, source: string, target: string) {
  const key = JSON.stringify([text, source, target]);
  const cached = memory.get(key);
  if (cached !== undefined) return { translatedText: cached, cached: true };
  const existing = pending.get(key);
  if (existing) return { translatedText: await existing, cached: true };
  const task = (async () => {
    const supabase = getSupabase();
    const sourceHash = hash(text);
    if (supabase) {
      const { data } = await supabase.from("translation_cache").select("translated_text").eq("source_hash", sourceHash).eq("source_language", source).eq("target_language", target).maybeSingle();
      if (typeof data?.translated_text === "string" && data.translated_text) return data.translated_text;
    }
    const chunks = splitText(text);
    const translatedText = (await Promise.all(chunks.map(chunk => translateChunk(chunk, source, target)))).join("");
    if (supabase) {
      const { error } = await supabase.from("translation_cache").upsert({ source_hash: sourceHash, source_text: text, source_language: source, target_language: target, translated_text: translatedText }, { onConflict: "source_hash,source_language,target_language" });
      if (error) console.warn("Translation cache unavailable:", error.code);
    }
    return translatedText;
  })();
  pending.set(key, task);
  try {
    const translatedText = await task;
    memory.set(key, translatedText);
    if (memory.size > MAX_CACHE) memory.delete(memory.keys().next().value!);
    return { translatedText, cached: false };
  } finally { pending.delete(key); }
}
export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 50000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const source = normalize(body?.sourceLanguage ?? body?.source_language ?? body?.source);
    const target = normalize(body?.targetLanguage ?? body?.target_language ?? body?.target);
    if (!text || text.length > MAX_TEXT || !languages.has(source) || !languages.has(target)) return NextResponse.json({ error: "Invalid translation request" }, { status: 400 });
    if (source === target) return NextResponse.json({ translatedText: text, cached: false });
    return NextResponse.json(await translate(text, source, target));
  } catch (error) {
    console.error("Translation failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Translation is temporarily unavailable. The original text remains available." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
