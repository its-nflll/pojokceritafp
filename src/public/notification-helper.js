// Helper untuk push notification
const NotificationHelper = {
  sendNotification: async (registration, data) => {
    if (!registration || !registration.active) {
      console.error('Service worker tidak aktif');
      return;
    }

    registration.active.postMessage({
      type: 'NOTIFY_NEW_STORY',
      title: 'Cerita Baru Ditambahkan',
      options: {
        body: `"${data.title}" baru saja ditambahkan!`,
        icon: './images/icons/icon-192x192.png',
        badge: './images/icons/badge-72x72.png',
        data: {
          url: `#/detail/${data.id}`
        }
      }
    });

    console.log('Notifikasi cerita baru dikirim ke service worker');
  }
};

window.NotificationHelper = NotificationHelper; 