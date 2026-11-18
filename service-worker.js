const CACHE_NAME = "rubenca-dmx-tools-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("rubenca-dmx-tools-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Cache the app shell and same-origin files. Also cache the pinned PDF libraries
  // after a successful first online load so repeat visits can work offline.
  if (url.origin === self.location.origin || ["cdnjs.cloudflare.com", "unpkg.com"].includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        throw error;
      }
    })());
  }
});
