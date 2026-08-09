const CACHE_VERSION = '75minton-pwa-v2.0-20260809-v20-guide';
const ASSET_VERSION = '20260809-v20-guide';
const APP_SHELL = [
  './',
  './index.html',
  './guide.html',
  `./styles.css?v=${ASSET_VERSION}`,
  `./home-content.js?v=${ASSET_VERSION}`,
  `./analytics-config.js?v=${ASSET_VERSION}`,
  `./analytics.js?v=${ASSET_VERSION}`,
  `./app.js?v=${ASSET_VERSION}`,
  './share/player.html',
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

  // ?ㅻ뵒??seek(Range ?붿껌)???쒕퉬?ㅼ썙而ㅺ? 嫄대뱶由ъ? ?딅룄濡?洹몃?濡??ㅽ듃?뚰겕濡?蹂대깂
  if (isRangeRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // HTML 臾몄꽌 ?대룞留?index.html fallback ?덉슜
  if (isNavigationRequest(request) && requestUrl.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  if (!isRuntimeCacheable(request.url)) return;

  // 誘몃뵒??媛??JSON? ?덈? index.html濡??泥댄븯吏 ?딆쓬
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


