import renderHomePage from '../pages/home/home-page.js';
import renderAboutPage from '../pages/about/about-page.js';
import renderLoginPage from '../pages/login/login-page.js';
import renderNotFoundPage from '../pages/not-found/not-found-page.js';

const routes = {
  '/': renderHomePage,
  '/about': renderAboutPage,
  '/login': renderLoginPage,
  '/404': renderNotFoundPage,
};

export default routes;
