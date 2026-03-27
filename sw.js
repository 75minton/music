const CACHE_VERSION = '75minton-pwa-v2.1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
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

function isNavigationRequest(request) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isRangeRequest(request) {
  return request.headers.has('range');
}

function isMediaOrDataRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const destination = request.destination || '';

  if (['audio', 'video'].includes(destination)) return true;

  return /\.(mp3|m4a|aac|wav|ogg|flac|lrc|json)$/i.test(path);
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);

  // 오디오 seek(Range 요청)는 서비스워커가 건드리지 않도록 그대로 네트워크로 보냄
  if (isRangeRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML 문서 이동만 index.html fallback 허용
  if (isNavigationRequest(request) && requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isRuntimeCacheable(request.url)) return;

  // 미디어/가사/JSON은 절대 index.html로 대체하지 않음
  if (isMediaOrDataRequest(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(
        fetch(request)
          .then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(request, response.clone());
            }
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
