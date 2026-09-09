import test from 'node:test';
import assert from 'node:assert/strict';
import { splitTextByBytes, translate } from '../lib/translation-server.ts';
import { translationKey, translateText } from '../lib/translation-client.ts';
import { joinPath } from '../lib/join-path.ts';

test('UTF-8 chunks retain Korean, emoji, whitespace and order within provider limit', () => {
  const text = ('안녕하세요 🌍\n Welcome! ').repeat(75);
  const chunks = splitTextByBytes(text);
  assert.equal(chunks.join(''), text);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk) <= 450));
});
test('invitation parsing keeps only valid app paths, never executable URLs', () => {
  assert.equal(joinPath('https://old.example/event/abc123?x=1'), '/event/abc123');
  assert.equal(joinPath('/room/a-b_c'), '/room/a-b_c');
  for (const path of ['javascript:alert(1)', 'https://example.com/', '/event/a/b', '/room/%2fadmin', 'hello']) assert.equal(joinPath(path), null);
});
test('edited text and selected language get distinct cache keys', () => {
  const item = { content: 'hello', source_language: 'en' };
  assert.notEqual(translationKey(item, 'ko'), translationKey(item, 'es'));
  assert.notEqual(translationKey(item, 'ko'), translationKey({ ...item, content: 'updated' }, 'ko'));
});
test('server coalesces concurrent requests and serves successful cache without a fetch', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 5)); return Response.json({ responseStatus: 200, responseData: { translatedText: '안녕' } }); };
  try {
    assert.deepEqual(await Promise.all([translate('hello-cache-test', 'en', 'ko'), translate('hello-cache-test', 'en', 'ko')]), ['안녕', '안녕']);
    assert.equal(await translate('hello-cache-test', 'en', 'ko'), '안녕');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
test('quota error is never treated as translation or cached, retry can succeed', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json(calls === 1 ? { responseStatus: 429, quotaFinished: true, responseData: { translatedText: 'QUOTA EXCEEDED' } } : { responseStatus: 200, responseData: { translatedText: '성공' } }); };
  try {
    await assert.rejects(translate('quota-retry-test', 'en', 'ko'));
    assert.equal(await translate('quota-retry-test', 'en', 'ko'), '성공');
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});
test('parallel chunks retain original order with at most four upstream requests', async () => {
  const original = globalThis.fetch;
  let active = 0, maximum = 0;
  globalThis.fetch = async (url) => {
    active++; maximum = Math.max(maximum, active);
    const text = new URL(url).searchParams.get('q');
    await new Promise((resolve) => setTimeout(resolve, text.startsWith('a') ? 15 : 2));
    active--;
    return Response.json({ responseStatus: 200, responseData: { translatedText: text } });
  };
  try {
    const text = 'a'.repeat(450) + 'b'.repeat(450) + 'c'.repeat(450) + 'd'.repeat(450) + 'e'.repeat(450);
    assert.equal(await translate(text, 'en', 'ko'), text);
    assert.equal(maximum, 4);
  } finally { globalThis.fetch = original; }
});
test('client deduplicates requests and permits retry after a temporary failure', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 3)); return calls === 1 ? Response.json({ error: 'busy' }, { status: 503 }) : Response.json({ translatedText: '다시 성공' }); };
  try {
    const results = await Promise.allSettled([translateText('client-test', 'en', 'ko'), translateText('client-test', 'en', 'ko')]);
    assert.ok(results.every((result) => result.status === 'rejected'));
    assert.equal(calls, 1);
    assert.equal(await translateText('client-test', 'en', 'ko'), '다시 성공');
    assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});
