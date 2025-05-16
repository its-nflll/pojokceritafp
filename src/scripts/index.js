// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';
import AuthHelper from './utils/auth-helper.js';
import UrlParser from './routes/url-parser.js';
import routes from './routes/routes.js';

// Global function untuk logout
window.handleLogout = async () => {
  await AuthHelper.logout();
  window.location.hash = '#/login';
  if (typeof updateAuthNav === 'function') {
    updateAuthNav();
  }
};

// Fungsi untuk menangani perubahan URL
const handleRouteChange = () => {
  App.renderPage();
};

window.addEventListener('DOMContentLoaded', handleRouteChange);
window.addEventListener('hashchange', handleRouteChange);
