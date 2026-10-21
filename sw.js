// Garde l'app sur l'appareil pour qu'elle s'ouvre sans réseau.
// Stratégie : on sert la copie locale tout de suite et on la met à jour en arrière-plan
// (une nouvelle version s'affiche à l'ouverture suivante).
const CACHE = 'suiviperso-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  const cdn = url.hostname === 'cdnjs.cloudflare.com';
  if (req.method !== 'GET' || (url.origin !== location.origin && !cdn)) return; // la synchro (POST vers Google) passe directement
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const hit = await cache.match(key, {ignoreSearch: true});
    const net = fetch(req).then(r => { if (r.ok) cache.put(key, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
