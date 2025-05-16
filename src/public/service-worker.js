// Gunakan self.location.pathname untuk mendapatkan path relatif yang benar
const basePath = self.location.pathname.replace('service-worker.js', '');

// Import scripts dengan path relatif yang benar
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
importScripts(new URL('idb-helper.js', self.location.href).href);

// Versi cache baru
const CACHE_VERSION = 'v3';

self.addEventListener('push', async function(event) {
  // Periksa apakah masih berlangganan push notification sebelum memproses
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[Service Worker] Pengguna tidak lagi berlangganan push notification, abaikan push event');
      return; // Jangan tampilkan notifikasi jika tidak berlangganan
    }
  } catch (err) {
    console.error('[Service Worker] Error saat memeriksa status subscription:', err);
    return; // Abaikan push jika terjadi error
  }
  
  // Lanjutkan dengan menampilkan notifikasi karena user masih berlangganan
  let notificationData = {
    title: 'PojokCerita',
    options: {
      body: 'Ada notifikasi baru!',
      icon: './images/logo.png',
      badge: './favicon.png',
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
        
        try {
          // Store in IndexedDB
          const db = await openDB();
          const tx = db.transaction('stories', 'readwrite');
          const store = tx.objectStore('stories');
          
          // Dapatkan daftar cerita offline saat ini
          const currentStoriesRequest = store.getAll();
          
          currentStoriesRequest.onsuccess = () => {
            const currentStories = currentStoriesRequest.result;
            const currentOfflineIds = new Set();
            
            // Catat ID cerita yang ditandai sebagai offline
            currentStories.forEach(story => {
              if (story.isOffline === true) {
                currentOfflineIds.add(story.id);
              }
            });
            
            // Update data dari server, tapi pertahankan flag isOffline
            data.listStory.forEach(story => {
              if (currentOfflineIds.has(story.id)) {
                story.isOffline = true;
              }
              store.put(story);
            });
          };
        } catch (err) {
          console.error('Error updating IndexedDB:', err);
        }
        
        return response;
      }
      throw new Error('Network response was not ok');
    } catch (err) {
      // Fallback to IndexedDB
      const stories = await getAllStories();
      
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
          return await caches.match('./images/placeholder.png') ||
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
    return caches.match('./index.html');
  }
  return Response.error();
});

// Tambahkan handler baru untuk notifikasi
self.addEventListener('message', async (event) => {
  console.log('[Service Worker] Menerima pesan:', event.data);
  
  if (event.data && event.data.type === 'NOTIFY_NEW_STORY') {
    const { title, options } = event.data;
    console.log('[Service Worker] Memeriksa status berlangganan sebelum menampilkan notifikasi:', title);
    
    try {
      // Periksa apakah pengguna berlangganan push notifikasi
      const subscription = await self.registration.pushManager.getSubscription();
      if (!subscription) {
        console.log('[Service Worker] Pengguna belum berlangganan push notifikasi, notifikasi tidak ditampilkan');
        // Jika ada port untuk memberi respons balik ke client
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            status: 'skipped',
            message: 'User not subscribed to push notifications'
          });
        }
        return;
      }
      
      // Jika berlangganan, tampilkan notifikasi
      await self.registration.showNotification(title, options);
      console.log('[Service Worker] Notifikasi berhasil ditampilkan');
      
      // Jika ada port untuk memberi respons balik ke client
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'success',
          message: 'Notification shown successfully'
        });
      }
    } catch (err) {
      console.error('[Service Worker] Error saat menampilkan notifikasi:', err);
      // Jika ada port untuk memberi respons balik ke client
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'error',
          message: err.message
        });
      }
    }
  } else if (event.data && event.data.action === 'DELETE_STORY') {
    // Tangani penghapusan cerita
    const storyId = event.data.storyId;
    
    try {
      console.log('[Service Worker] Menghapus cerita dari IndexedDB:', storyId);
      
      // Periksa dulu apakah pengguna berlangganan push notifikasi
      const subscription = await self.registration.pushManager.getSubscription();
      const isSubscribed = !!subscription;
      
      // Proses penghapusan dari IndexedDB
      const db = await openDB();
      const tx = db.transaction('stories', 'readwrite');
      const store = tx.objectStore('stories');
      
      // Hapus cerita dari IndexedDB
      await store.delete(storyId);
      console.log('[Service Worker] Cerita berhasil dihapus dari IndexedDB');
      
      // Kirim respons sukses ke client
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'success',
          message: 'Story deleted successfully from IndexedDB',
          isSubscribed: isSubscribed
        });
      }
      
      // Tampilkan notifikasi hanya jika user berlangganan
      if (isSubscribed) {
        await self.registration.showNotification('PojokCerita', {
          body: 'Cerita berhasil dihapus dari penyimpanan offline',
          icon: './images/logo.png',
          badge: './favicon.png'
        });
      } else {
        console.log('[Service Worker] User tidak berlangganan, tidak menampilkan notifikasi');
      }
    } catch (err) {
      console.error('[Service Worker] Error saat menghapus cerita:', err);
      
      // Kirim respons error ke client
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          status: 'error',
          message: err.message
        });
      }
    }
  }
});

// Event listener untuk klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);
  
  event.notification.close();
  
  // Navigasi ke halaman detail cerita
  if (event.notification.data && event.notification.data.url) {
    clients.openWindow(event.notification.data.url);
  } else {
    clients.openWindow('/');
  }
});
