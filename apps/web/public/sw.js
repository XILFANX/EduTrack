const CACHE_NAME = 'estatetrack-pwa-v1';

// Install event: Skip waiting to ensure the new service worker activates immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event: Claim clients to ensure the service worker controls the page immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event: Required for PWA installation prompt in Chrome
self.addEventListener('fetch', (event) => {
  // Simple Network-First strategy
  if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Optional: Return a custom offline fallback page here if caching fails
        return new Response('Network error and no cached version available.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = JSON.parse(event?.data?.text() || '{}')
  
  const title = data.title || 'EstateTrack Notification'
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.data || { url: '/' }
  }

  event.waitUntil(self.registration.showNotification(title, options))
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data.url || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
});
