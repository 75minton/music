const CACHE_VERSION = '75minton-pwa-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isRuntimeCacheable(requestUrl) {
  const url = new URL(requestUrl);
  if (url.origin === self.location.origin) return true;
  return ['raw.githubusercontent.com', 'githubusercontent.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === 'navigate' && requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isRuntimeCacheable(event.request.url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(event.request);
    if (cached) {
      event.waitUntil(
        fetch(event.request)
          .then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(event.request, response.clone());
            }
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const response = await fetch(event.request);
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      if (requestUrl.origin === self.location.origin) {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
