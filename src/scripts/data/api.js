import CONFIG from '../config';

const Api = {
  async login({ email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register({ name, email, password }) {
    const response = await fetch(`${CONFIG.BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  },

  async getStories(token) {
    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async createStory({ token, description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    if (photo) formData.append('photo', photo);
    // Kirim lat/lon hanya jika valid number
    if (typeof lat === 'number' && !isNaN(lat)) formData.append('lat', lat);
    if (typeof lon === 'number' && !isNaN(lon)) formData.append('lon', lon);

    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Jangan set Content-Type, biarkan browser mengatur boundary FormData
      },
      body: formData,
    });
    return response.json();
  },

  async deleteStory({ token, id }) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Dicoding API kemungkinan tidak support DELETE, jadi simulasi sukses jika status 200-299
      if (response.ok) {
        return { error: false, message: 'Story berhasil dihapus' };
      }
      // Jika API mengembalikan JSON error
      const data = await response.json();
      return data;
    } catch (err) {
      return { error: true, message: 'Gagal menghapus story. Fitur hapus mungkin tidak tersedia pada API Dicoding.' };
    }
  },

  async addStory(token, formData) {
    const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },

  async subscribePushNotification(token, subscriptionBody) {
    const response = await fetch(`${CONFIG.PUSH_MSG_SUBSCRIBE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionBody),
    });
    return response.json();
  },

  async unsubscribePushNotification(token, subscriptionBody) {
    const response = await fetch(`${CONFIG.PUSH_MSG_UNSUBSCRIBE_URL}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(subscriptionBody),
    });
    return response.json();
  },
};

export default Api;