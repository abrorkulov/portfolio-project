// Bump this on any change to the caching strategy below.
const CACHE_NAME = 'signal-portfolio-v4'

// The shell is cached as an offline fallback only — never as the primary
// source for a navigation. See the fetch handler.
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // A single 404 in addAll rejects the whole install, so tolerate misses.
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Never touch cross-origin traffic (fonts, icon CDN) — let the browser and
  // its own HTTP cache handle it.
  if (url.origin !== self.location.origin) return

  // Navigations go to the network first.
  //
  // Cache-first here was a deploy-breaking bug: every build emits new hashed
  // filenames, so a cached index.html kept pointing at assets that no longer
  // existed on the server. Returning visitors got 404s on every script tag and
  // a blank white page until they hard-refreshed.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || Response.error())),
    )
    return
  }

  // Build assets carry a content hash, so a hit is always the right file.
  const isHashedAsset = url.pathname.startsWith('/assets/')

  if (isHashedAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          }),
      ),
    )
    return
  }

  // Everything else: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)

      return cached || network
    }),
  )
})
