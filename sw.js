// Increment this version every time you update the app
const CACHE = 'fintrack-v9';
const FILES = ['./', './index.html', './manifest.json', './icon.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for HTML — always get latest version
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first for assets
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});

// Tell all clients to reload when new SW activates
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
