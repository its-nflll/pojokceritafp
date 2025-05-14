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

// Cache halaman utama
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages-cache-' + CACHE_VERSION,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      })
    ]
  })
);

// Cache assets (JS, CSS, Web Workers)
workbox.routing.registerRoute(
  ({request}) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'assets-cache-' + CACHE_VERSION,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      })
    ]
  })
);

// Cache API dengan fallback ke IndexedDB
workbox.routing.registerRoute(
  new RegExp('/stories($|\\?.*)'),
  async ({event}) => {
    try {
      // Try network first
      const response = await fetch(event.request);
      if (response.ok) {
        const clone = response.clone();
        const data = await clone.json();
        
        // Store in IndexedDB
        const db = await openDB();
        const tx = db.transaction('stories', 'readwrite');
        const store = tx.objectStore('stories');
        data.listStory.forEach(story => store.put(story));
        
        return response;
      }
      throw new Error('Network response was not ok');
    } catch (err) {
      // Fallback to IndexedDB
      const db = await openDB();
      const tx = db.transaction('stories', 'readonly');
      const store = tx.objectStore('stories');
      const stories = await store.getAll();
      
      return new Response(JSON.stringify({
        error: false,
        message: "Success (Offline Mode)",
        listStory: stories
      }));
    }
  }
);

// Cache gambar dengan fallback
workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.NetworkFirst({
    cacheName: 'images-cache-' + CACHE_VERSION,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      {
        handlerDidError: async () => {
          return await caches.match('/images/placeholder.png') ||
                 new Response(
                   '<svg>...</svg>', 
                   {headers: {'Content-Type': 'image/svg+xml'}}
                 );
        }
      }
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
