const CACHE_VERSION = '75minton-pwa-v20260319-2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const MEDIA_CACHE = `${CACHE_VERSION}-media`;

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './songs.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== SHELL_CACHE && key !== MEDIA_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'WARM_CACHE' && Array.isArray(data.assets)) {
    event.waitUntil(warmCache(data.assets));
  }
});

function normalizePath(input) {
  const url = new URL(input, self.location.origin);
  return url.pathname;
}

function normalizeMediaCacheKey(input) {
  const url = new URL(input, self.location.origin);
  return url.pathname + url.search;
}

function isSongsManifestAsset(input) {
  const url = new URL(input, self.location.origin);
  return /\/songs\.json$/i.test(url.pathname);
}

function isAudioAsset(input) {
  const url = new URL(input, self.location.origin);
  return /\.(mp3|m4a|wav|ogg|flac)$/i.test(url.pathname);
}

function isImageOrTextAsset(input) {
  const url = new URL(input, self.location.origin);
  return /\.(lrc|png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
}

function getCacheNameForAsset(input) {
  if (isSongsManifestAsset(input)) return SHELL_CACHE;
  if (isAudioAsset(input) || isImageOrTextAsset(input)) return MEDIA_CACHE;
  return SHELL_CACHE;
}

function getCacheKeyForAsset(input) {
  if (isSongsManifestAsset(input)) return normalizePath(input);
  if (isAudioAsset(input) || isImageOrTextAsset(input)) return normalizeMediaCacheKey(input);
  return normalizePath(input);
}

async function warmCache(assets) {
  const uniqueAssets = [...new Set(assets)].filter(Boolean);

  await Promise.all(uniqueAssets.map(async (asset) => {
    try {
      const request = new Request(asset, { cache: 'reload' });
      const response = await fetch(request);
      if (!response || !response.ok) return;

      const cache = await caches.open(getCacheNameForAsset(asset));
      await cache.put(getCacheKeyForAsset(asset), response.clone());
    } catch (err) {
      console.warn('캐시 예열 실패:', asset, err);
    }
  }));
}

function isSongsManifestRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && /\/songs\.json$/i.test(url.pathname);
}

function isAudioRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && /\.(mp3|m4a|wav|ogg|flac)$/i.test(url.pathname);
}

function isImageOrTextRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && /\.(lrc|png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
}

function isAppShellRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin &&
    (url.pathname.endsWith('/') ||
     url.pathname.endsWith('/index.html') ||
     url.pathname.endsWith('/manifest.json') ||
     /\/icons\/.+\.(png|svg)$/i.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isSongsManifestRequest(request)) {
    event.respondWith(networkFirstSongsManifest(request));
    return;
  }

  if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(request));
    return;
  }

  if (isImageOrTextRequest(request)) {
    event.respondWith(staleWhileRevalidateWithKey(request, MEDIA_CACHE, normalizeMediaCacheKey(request.url)));
    return;
  }

  if (isAppShellRequest(request)) {
    event.respondWith(staleWhileRevalidateWithKey(request, SHELL_CACHE, normalizePath(request.url)));
  }
});

async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    await cache.put('./index.html', fresh.clone());
    return fresh;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match('./index.html')) || (await cache.match('./'));
  }
}

async function networkFirstSongsManifest(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cacheKey = normalizePath(request.url);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
      return response;
    }
    throw new Error(`songs.json network response: ${response?.status}`);
  } catch (err) {
    return (await cache.match(cacheKey)) || (await cache.match('./songs.json')) || new Response('{"songs":[]}', {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidateWithKey(request, cacheName, cacheKey) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(cacheKey);

  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || networkPromise;
}

async function handleAudioRequest(request) {
  const rangeHeader = request.headers.get('range');
  const mediaCache = await caches.open(MEDIA_CACHE);
  const cacheKey = normalizeMediaCacheKey(request.url);

  let cached = await mediaCache.match(cacheKey);
  if (!cached) cached = await mediaCache.match(request);

  if (!cached) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && (networkResponse.ok || networkResponse.status === 206)) {
        const fullFetch = rangeHeader ? await fetch(request.url) : networkResponse.clone();
        if (fullFetch && fullFetch.ok) {
          await mediaCache.put(cacheKey, fullFetch.clone());
          cached = fullFetch.clone();
        } else if (networkResponse.ok) {
          cached = networkResponse.clone();
        }
      }
      if (!cached) return networkResponse;
    } catch (err) {
      if (!cached) throw err;
    }
  }

  if (rangeHeader) {
    return createPartialResponse(cached, rangeHeader);
  }

  return cached;
}

async function createPartialResponse(response, rangeHeader) {
  const buffer = await response.arrayBuffer();
  const total = buffer.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);

  if (!match) {
    return new Response(buffer, {
      status: 200,
      headers: response.headers
    });
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : total - 1;

  if (Number.isNaN(start)) start = 0;
  if (Number.isNaN(end) || end >= total) end = total - 1;

  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${total}` }
    });
  }

  const sliced = buffer.slice(start, end + 1);
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
  headers.set('Content-Length', String(sliced.byteLength));
  headers.set('Accept-Ranges', 'bytes');
  if (!headers.get('Content-Type')) {
    headers.set('Content-Type', 'audio/mpeg');
  }

  return new Response(sliced, {
    status: 206,
    statusText: 'Partial Content',
    headers
  });
}
