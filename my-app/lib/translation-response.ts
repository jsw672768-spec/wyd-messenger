import { translateText } from './translation-client.ts';
/** Adapter for existing screens; all requests share the bounded client queue. */
export async function translationResponse(input: { text: string; sourceLanguage: string; targetLanguage: string }) {
  try { return Response.json({ translatedText: await translateText(input.text, input.sourceLanguage, input.targetLanguage) }); }
  catch { return Response.json({ error: 'Translation unavailable' }, { status: 503 }); }
}
