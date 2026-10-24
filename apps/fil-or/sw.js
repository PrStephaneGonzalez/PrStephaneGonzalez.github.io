const CACHE='fil-or-shell-b88e605cb73201cb';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.mjs',
  './home-simple.mjs',
  './art.mjs',
  './academy.mjs',
  './treasures.mjs',
  './academy-art.mjs',
  './academy-rooms.mjs',
  './castle-map.mjs',
  './mini-courses.mjs',
  './practice-variants.mjs',
  './engine.mjs',
  './potion-data.mjs',
  './messages.mjs',
  './feedback.mjs',
  './learning.mjs',
  './learning-data.mjs',
  './catalog.mjs',
  './deep-practice.mjs',
  './written-operations.mjs',
  './school-progress.mjs',
  './daily-practice.mjs',
  './positioning.mjs',
  './curriculum.mjs',
  './journey.mjs',
  './extra-games.mjs',
  './extra-ui.mjs',
  './guided-data.mjs',
  './guided-ui.mjs',
  './logic-games.mjs',
  './sync.mjs',
  './supabase-progress.mjs',
  './story.mjs',
  './story-ui.mjs',
  './world-map.mjs',
  './travel-link.mjs',
  './training-state.mjs',
  './math-core.mjs',
  './math-ui.mjs',
  './math-parent.mjs',
  './reading-ui.mjs',
  './reading-texts.mjs',
  './training-parent.mjs',
  './cm2-coverage.mjs',
  './cm2-additions.mjs',
  './solver-worker.mjs',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('fil-or-shell-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  if (
    u.pathname.startsWith('/api/') ||
    u.pathname.includes('signin-with-chatgpt') ||
    u.pathname.includes('signout-with-chatgpt') ||
    u.pathname.endsWith('.zip')
  )
    return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (r.ok && !r.redirected) {
            const copy = r.clone();
            caches
              .open(CACHE)
              .then((c) => c.put('./index.html', copy))
              .catch(() => {});
          }
          return r;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
