// High-End Recovery Service Worker
const CACHE_NAME = 'chat-recovery-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-messages') {
    event.waitUntil(syncOfflineMessages());
  }
});

async function syncOfflineMessages() {
  // Sync logic from IndexedDB via postMessage to main thread
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SYNC_OFFLINE' }));
  });
}

// Recovery notifications
self.registration.showNotification('Chat Recovery Ready', {
  body: 'Messages auto-backed up & recoverable offline.',
  icon: '/icon-192.png'
});
