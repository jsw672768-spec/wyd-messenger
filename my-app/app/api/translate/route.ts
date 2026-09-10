import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LANGUAGES, MAX_TEXT_BYTES, translate } from '@/lib/translation-server';
const json = (data: object, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

async function readLimited(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > 64000) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 64000) { await reader.cancel(); throw new RangeError(); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return json({ error: 'Origin not allowed.' }, 403);
  let body;
  try { body = await readLimited(request); }
  catch (error) { return json({ error: error instanceof RangeError ? 'Request too large.' : 'Invalid JSON.' }, error instanceof RangeError ? 413 : 400); }
  const text = typeof body?.text === 'string' ? body.text : '';
  const normalize = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
  const source = normalize(body?.sourceLanguage ?? body?.source_language ?? body?.source);
  const target = normalize(body?.targetLanguage ?? body?.target_language ?? body?.target);
  if (!text.trim() || !LANGUAGES.includes(source) || !LANGUAGES.includes(target)) return json({ error: 'Text and supported source/target languages are required.' }, 400);
  if (Buffer.byteLength(text) > MAX_TEXT_BYTES) return json({ error: 'Text too long.' }, 413);
  if (source === target) return json({ translatedText: text });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let reserve: ((characters: number) => Promise<void>) | undefined;
  if (url && key) {
    const authorization = request.headers.get('authorization') || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) return json({ error: 'Participant authentication required.' }, 401);
    const db = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const verified = await db.auth.getUser(authorization.slice(7));
    if (verified.error || !verified.data.user) return json({ error: 'Participant authentication required.' }, 401);
    reserve = async (characters) => {
      const result = await db.rpc('reserve_wyd_translation', { p_characters: characters });
      if (result.error) throw new Error('Translation allowance unavailable');
    };
  } else if (process.env.NODE_ENV === 'production') {
    return json({ error: 'Translation service configuration pending.' }, 503);
  }
  try { return json({ translatedText: await translate(text, source, target, reserve) }); }
  catch { return json({ error: 'Translation unavailable or allowance reached. Original text remains available.' }, 503); }
}
