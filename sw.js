// Fit mit Herz – Service Worker (Offline-Betrieb)
// WICHTIG: Bei jeder Änderung an der App die Versionsnummer erhöhen.
const VERSION = 'fmh-v2.0.0';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/exercises.js',
  './js/plans.js',
  './js/figures.js',
  './js/trainer.js',
  './js/progress.js',
  './js/charts.js',
  './js/ui.js',
  './js/voice.js',
  './js/phrases.js',
  './js/tips.js',
  './js/body.js',
  './audio/clips.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(FILES);
    // Sprachaufnahmen der Trainerin für den Offline-Betrieb mitspeichern
    try {
      const m = await (await fetch('./audio/clips.json', { cache: 'no-store' })).json();
      await c.addAll(m.files.map((f) => `./audio/${f}.ogg`));
    } catch (err) { /* Aufnahmen werden dann beim ersten Abspielen geladen */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Erst aus dem Netz (damit Updates sofort ankommen). Bei schlechtem oder keinem Netz
// nach spätestens 2,5 Sekunden die gespeicherte Version nehmen.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const network = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    const timeout = new Promise((r) => setTimeout(() => r(null), 2500));
    const fast = await Promise.race([network, timeout]);
    if (fast) return fast;
    const cached = await cache.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    if (cached) { e.waitUntil(network); return cached; }
    const late = await network;
    return late || new Response('Offline', { status: 503 });
  })());
});
