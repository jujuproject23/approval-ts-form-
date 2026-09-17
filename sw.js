/**
 * ==========================================================================
 * XIAOMI SERVICE CENTER - SERVICE WORKER (PWA OFFLINE CACHING & INSTALL)
 * File: sw.js
 * ==========================================================================
 */

const CACHE_NAME = "mi-approval-v2.1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/config.js",
  "./js/auth.js",
  "./js/signature-pad.js",
  "./js/canvas-sketch.js",
  "./js/templates.js",
  "./js/app.js"
];

// Install Event: Cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup Old Caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for API, Cache First for Static Assets
self.addEventListener("fetch", (event) => {
  // Biarkan request Apps Script langsung ke jaringan
  if (event.request.url.includes("script.google.com") || event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
