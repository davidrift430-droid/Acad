// Offline-first service worker for the web/PWA build (the Android APK already bundles every file).
const VERSION = 'dymo-v2';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon.svg'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Cache-first for hashed assets and exercise images; network-first for the HTML shell.
  const isAsset = /\/(assets|ex)\//.test(req.url);
  e.respondWith(isAsset
    ? caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); } return res; }))
    : fetch(req).then((res) => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then((x) => x.put(req, c)); } return res; }).catch(() => caches.match(req).then((h) => h || caches.match('index.html'))));
});
