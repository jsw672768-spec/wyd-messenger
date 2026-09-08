import { NextRequest, NextResponse } from 'next/server';
import { LANGUAGES, MAX_TEXT_BYTES, translate } from '@/lib/translation-server';
const json = (data: object, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: NextRequest) {
  let body;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 64000) return json({ error: 'Request too large.' }, 413);
    body = JSON.parse(raw);
  } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const normalize = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
  const source = normalize(body?.sourceLanguage ?? body?.source_language ?? body?.source);
  const target = normalize(body?.targetLanguage ?? body?.target_language ?? body?.target);
  if (!text || !LANGUAGES.includes(source) || !LANGUAGES.includes(target)) return json({ error: 'Text and supported source/target languages are required.' }, 400);
  if (Buffer.byteLength(text) > MAX_TEXT_BYTES) return json({ error: 'Text too long.' }, 413);
  if (source === target) return json({ translatedText: text });
  try { return json({ translatedText: await translate(text, source, target) }); }
  catch { return json({ error: 'Translation temporarily unavailable. Please retry.' }, 503); }
}
