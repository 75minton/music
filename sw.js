const CACHE_VERSION = '75minton-pwa-20260923-v31-pwa';
const ASSET_VERSION = '20260923-v31-pwa';
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
      keys.filter(key => key.startsWith('75minton-pwa-') && key !== CACHE_VERSION).map(key => caches.delete(key))
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

function isImageRequest(request) {
  return request.destination === 'image' || /\.(png|jpe?g|webp|gif|svg|ico|avif)$/i.test(new URL(request.url).pathname);
}

async function storeResponse(cache, request, response) {
  if (response && (response.ok || response.type === 'opaque') && response.status !== 206) {
    try { await cache.put(request, response.clone()); } catch (error) {
      console.warn('Cache write failed', error);
    }
  }
}

self.addEventListener('message', event => {
  if (event.data?.type !== 'WARM_CACHE' || !Array.isArray(event.data.assets)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const assets = [...new Set(event.data.assets)].filter(value => {
      try {
        const url = new URL(value, self.location.href);
        return url.origin === self.location.origin && isImageRequest({ url: url.href });
      } catch { return false; }
    });
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (assets.length) {
        const url = assets.shift();
        try {
          if (!await cache.match(url)) await storeResponse(cache, url, await fetch(url));
        } catch { /* Missing images can be retried on the next visit. */ }
      }
    }));
  })());
});

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
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        return await cache.match(request, { ignoreSearch: true }) || await cache.match('./index.html');
      })
    );
    return;
  }

  if (!isRuntimeCacheable(request.url) && !isImageRequest(request)) return;
  if (!['http:', 'https:'].includes(requestUrl.protocol)) return;

  // 誘몃뵒??媛??JSON? ?덈? index.html濡??泥댄븯吏 ?딆쓬
  if (isMediaOrDataRequest(request)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          await storeResponse(cache, request, response);
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
      if (isImageRequest(request)) return cached;
      event.waitUntil(
        fetch(request)
          .then(response => {
            if (response && (response.ok || response.type === 'opaque')) {
              return storeResponse(cache, request, response);
            }
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        await storeResponse(cache, request, response);
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});


