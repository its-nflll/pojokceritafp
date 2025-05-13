import CONFIG from '../config';
import Api from '../data/api';

const NotificationHelper = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Browser tidak mendukung notifikasi.');
      return;
    }

    const result = await Notification.requestPermission();
    if (result === 'denied') {
      console.log('Fitur notifikasi tidak diijinkan.');
      return;
    }

    if (result === 'default') {
      console.log('Pengguna menutup kotak dialog permintaan ijin.');
      return;
    }

    console.log('Fitur notifikasi diijinkan.');
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker tidak didukung browser ini.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/public/service-worker.js');
      console.log('Service worker registered');
      return registration;
    } catch (error) {
      console.error('Registrasi service worker gagal.', error);
    }
  },

  async urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  async subscribePushMessage(registration) {
    try {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: await this.urlBase64ToUint8Array(CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY)
      };
      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('Berhasil melakukan subscribe');

      // Kirim subscription ke server
      await this.sendSubscription(subscription);
    } catch (err) {
      console.error('Tidak dapat melakukan subscribe ', err.message);
    }
  },

  async sendSubscription(subscription) {
    const token = localStorage.getItem('token');
    const response = await fetch(CONFIG.PUSH_MSG_SUBSCRIBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });
    return response.json();
  },

  async unsubscribePushNotification() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await Api.unsubscribePushNotification(token, {
        endpoint: subscription.endpoint,
      });

      await subscription.unsubscribe();
      console.log('Push notification unsubscribe berhasil');
    } catch (err) {
      console.error('Error unsubscribe push notification:', err.message);
    }
  }
};

export default NotificationHelper;
