/* Minimal service worker for installability and future caching */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch; can be expanded later for caching strategies
self.addEventListener('fetch', () => {
  // no-op
});


