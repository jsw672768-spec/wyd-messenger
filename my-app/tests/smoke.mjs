import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '4319'], { stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
server.stdout.on('data', (data) => { output += data; });
server.stderr.on('data', (data) => { output += data; });
try {
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(poll); reject(new Error(output || 'Server did not start')); }, 15000);
    const poll = setInterval(() => { if (output.includes('Ready')) { clearTimeout(timeout); clearInterval(poll); resolve(); } }, 100);
  });
  const get = (path, options) => fetch(`http://127.0.0.1:4319${path}`, options);
  const home = await get('/'); assert.equal(home.status, 200);
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('referrer-policy'), 'no-referrer');
  const html = await home.text(); assert.ok(html.includes('WYD Messenger')); assert.ok(html.includes('/manifest.webmanifest'));
  const health = await get('/api/health'); assert.equal(health.status, 503);
  const healthBody = await health.json(); assert.equal(healthBody.configured, false); assert.equal(healthBody.dependencies, 'not_probed');
  const reader = await get('/message'); assert.equal(reader.status, 200);
  const readerHtml = await reader.text(); assert.ok(readerHtml.includes('noindex')); assert.ok(readerHtml.includes('no-referrer')); assert.ok(readerHtml.includes('Opening your message'));
  const manifest = await (await get('/manifest.webmanifest')).json();
  assert.equal(manifest.display, 'standalone'); assert.equal(manifest.start_url, '/');
  for (const icon of manifest.icons) { const response = await get(icon.src); assert.equal(response.status, 200); assert.ok(response.headers.get('content-type').includes('image/png')); }
  const sw = await get('/sw.js'); assert.equal(sw.status, 200); assert.ok(sw.headers.get('cache-control').includes('no-store'));
  assert.equal((await get('/offline.html')).status, 200);
  const post = (body) => get('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  assert.equal((await post('{')).status, 400);
  assert.equal((await post({ text: 'x', sourceLanguage: 'xx', targetLanguage: 'ko' })).status, 400);
  assert.equal((await post({ text: '가'.repeat(4000), sourceLanguage: 'en', targetLanguage: 'ko' })).status, 413);
  assert.equal((await post({ text: 'x'.repeat(65000), sourceLanguage: 'en', targetLanguage: 'ko' })).status, 413);
  const cross = await get('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: JSON.stringify({ text: 'hi', sourceLanguage: 'en', targetLanguage: 'ko' }) }); assert.equal(cross.status, 403);
  const unavailable = await post({ text: 'hello', sourceLanguage: 'en', targetLanguage: 'ko' }); assert.equal(unavailable.status, 503); assert.ok(!(await unavailable.json()).translatedText);
  const same = await post({ text: '안녕', sourceLanguage: 'ko', targetLanguage: 'ko' }); assert.equal(same.status, 200); assert.equal((await same.json()).translatedText, '안녕');
  console.log('Production smoke checks passed: home, shared-message route, manifest, icons, SW, offline page, API validation and same-language response.');
} finally { server.kill('SIGTERM'); }
