const AuthHelper = {
  async logout() {
    try {
      // Unsubscribe dari push notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }

      // Hapus data dari localStorage
      localStorage.clear();
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      // Minimal clear storage
      localStorage.clear();
      return false;
    }
  }
};

export default AuthHelper;
