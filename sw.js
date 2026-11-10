// Service worker: o app funciona offline depois da primeira visita.
const VERSION = 'fofit-v1';
const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/generator.js',
  'js/stats.js',
  'js/charts.js',
  'js/ui.js',
  'js/data/exercises.js',
  'js/data/guides.js',
  'js/views/home.js',
  'js/views/onboarding.js',
  'js/views/plans.js',
  'js/views/library.js',
  'js/views/session.js',
  'js/views/progress.js',
  'js/views/learn.js',
  'js/views/profile.js',
  'img/icon.svg',
  'img/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro para o código (pega atualizações), cache primeiro para imagens e fontes.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isAsset = url.pathname.includes('/img/') || url.host.includes('fonts.g');
  if (isAsset) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('index.html'))),
  );
});
