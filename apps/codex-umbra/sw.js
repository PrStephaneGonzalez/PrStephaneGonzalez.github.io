// Codex Umbra — fonctionnement hors connexion. Changer VERSION à chaque publication.
const VERSION = 'codex-umbra-v12';
const SHELL = ['./', './index.html', './style.css', './core.js', './kit.js', './c-vec.js', './c-alg.js', './c-misc.js', './methods.js', './story.js', './art.js', './music.js', './app.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('codex-umbra-') && k !== VERSION && k !== VERSION + '-cdn').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  const cdn = /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.hostname);
  if (u.origin !== location.origin && !cdn) return;
  if (cdn) {
    // polices et KaTeX : cache d'abord, réseau sinon
    e.respondWith(caches.open(VERSION + '-cdn').then((c) => c.match(e.request).then((r) => r || fetch(e.request).then((res) => (res.ok || res.type === 'opaque' ? c.put(e.request, res.clone()) : 0, res)))));
    return;
  }
  // nos fichiers : réseau d'abord (pour les mises à jour), cache hors connexion
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
