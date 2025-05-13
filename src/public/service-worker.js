importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Versi cache baru
const CACHE_VERSION = 'v3';

self.addEventListener('push', function(event) {
  let notificationData = {
    title: 'PojokCerita',
    options: {
      body: 'Ada notifikasi baru!',
      icon: '/images/logo.png',
      badge: '/favicon.png',
      data: {}
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        options: {
          ...notificationData.options,
          body: data.options?.body || notificationData.options.body,
          data: data
        }
      };
    } catch (err) {
      console.error('Error parsing push data:', err);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      const hadWindowToFocus = windowClients.some((windowClient) => {
        if (windowClient.url === urlToOpen) {
          windowClient.focus();
          return true;
        }
        return false;
      });

      if (!hadWindowToFocus) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Workbox: Cache dokumen, script, style dengan NetworkFirst (ambil versi terbaru jika ada)
workbox.routing.registerRoute(
  ({request}) =>
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new workbox.strategies.NetworkFirst({
    cacheName: 'assets-cache-' + CACHE_VERSION,
  })
);

// Workbox: Cache API (contoh endpoint /stories, sesuaikan jika endpoint lain)
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache-' + CACHE_VERSION,
    networkTimeoutSeconds: 5,
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 5 })
    ]
  })
);

// Workbox: Cache gambar
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-cache-' + CACHE_VERSION,
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 50 }),
    ],
  })
);

// Fallback offline page untuk navigasi
const defaultHandler = new workbox.strategies.NetworkFirst({
  cacheName: 'documents-cache-' + CACHE_VERSION,
});
workbox.routing.setDefaultHandler(defaultHandler);

workbox.routing.setCatchHandler(async ({event}) => {
  // Fallback ke index.html hanya untuk navigasi dokumen
  if (event.request.destination === 'document') {
    return caches.match('/index.html');
  }
  return Response.error();
});
