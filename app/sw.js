/* Vocal Gym service worker (v0.8.7): makes the app installable and lets its shell open without a connection.
   Strategy: the network first for every page file (so a running server always serves the newest code), with
   the cached copy when it cannot be reached; the shell is cached on install. The API is never cached, except
   GET /api/meta (the lists of ragas and talas the shell needs to start); accounts and logs always go to the
   server, and a log made offline waits in the page (app/js/session.js) until the server is back. v0.9: the
   repertoire's list is cached with the shell, and each composition (/repertoire/c/) once it has been opened. */
const CACHE = 'vg-shell-0.9.4';
const SHELL = [
  '/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png',
  '/css/app.css', '/shared/korvai-lab.css', '/shared/mela-explorer.css',
  '/js/main.js', '/js/api.js', '/js/audio.js', '/js/ui.js', '/js/glossary.js', '/js/session.js', '/js/fx.js',
  '/js/pages/home.js', '/js/pages/alankara.js', '/js/pages/kalpana.js', '/js/pages/korvai.js', '/js/pages/melakarta.js',
  '/js/pages/judge.js', '/js/pages/learn.js', '/js/pages/practice.js', '/js/pages/account.js', '/js/pages/repertoire.js',
  '/shared/voice.js', '/shared/mridangam.js', '/shared/solkattu.js', '/shared/solkattu-bank.js', '/shared/korvai-lab.js', '/shared/mela-explorer.js',
  '/engine/melakarta.js', '/engine/ragas.js', '/engine/repertoire.js', '/engine/talas.js', '/repertoire/index.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function networkFirst(req, fallback) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req, { ignoreSearch: true })) || (fallback && (await cache.match(fallback))) || Response.error();
  }
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // posts and fonts: the network as usual
  if (url.pathname.startsWith('/api/')) { if (url.pathname === '/api/meta') e.respondWith(networkFirst(req)); return; }
  e.respondWith(networkFirst(req, req.mode === 'navigate' ? '/index.html' : null));
});
