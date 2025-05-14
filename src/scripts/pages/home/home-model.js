import Api from '../../data/api.js';

const HomeModel = {
  async getStories() {
    const token = localStorage.getItem('token');
    if (!token) return { error: true, message: 'Anda belum login' };
    try {
      const response = await Api.getStories(token);
      return response;
    } catch (err) {
      return { error: true, message: err.message };
    }
  }
};

export default HomeModel;
