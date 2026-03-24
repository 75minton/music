const SW_VERSION = '75minton-pwa-v20260325b';
const APP_SCOPE_PATH = new URL('./', self.registration.scope).pathname;
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './songs.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SW_VERSION).then((cache) => cache.addAll(CORE_ASSETS.map((path) => new Request(path, { cache: 'reload' })))).catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== SW_VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isAppRequest(requestUrl) {
  return requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(APP_SCOPE_PATH);
}

async function networkFirst(request) {
  const cache = await caches.open(SW_VERSION);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SW_VERSION);
  const cached = await cache.match(request, { ignoreSearch: false });
  const fetchPromise = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isAppRequest(url)) return;

  const path = url.pathname;
  if (path.endsWith('/songs.json') || path.endsWith('/manifest.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type !== 'WARM_CACHE' || !Array.isArray(data.assets)) return;

  event.waitUntil((async () => {
    const cache = await caches.open(SW_VERSION);
    await Promise.all(data.assets.map(async (asset) => {
      try {
        await cache.add(new Request(asset, { cache: 'reload' }));
      } catch (error) {
        // 일부 외부/누락 자산은 조용히 무시
      }
    }));
  })());
});
