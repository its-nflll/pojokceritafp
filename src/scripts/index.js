// CSS imports
import '../styles/styles.css';

import App from './pages/app.js';
import AuthHelper from './utils/auth-helper.js';

// Global function untuk logout
window.handleLogout = async () => {
  await AuthHelper.logout();
  window.location.hash = '#/login';
  if (typeof updateAuthNav === 'function') {
    updateAuthNav();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.renderPage();
});
window.addEventListener('hashchange', () => {
  App.renderPage();
});
