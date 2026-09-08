const CACHE = 'wyd-offline-v1';
const OFFLINE = '/offline.html';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('wyd-offline-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  // Never persist messages, API responses, authenticated pages or participant data.
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE)) || new Response('Offline — please reconnect.', { status: 503 })));
});
