import routes from '../routes/routes.js';
import UrlParser from '../routes/url-parser.js';

const App = {
  async renderPage() {
    const url = UrlParser.parseActiveUrlWithoutCombiner();
    
    // Cek apakah URL ada di routes, jika tidak gunakan halaman 404
    let page;
    
    if (UrlParser.isKnownRoute(url, routes)) {
      page = routes[url];
    } else {
      page = routes['/404'];
    }
    
    let pageInstance, html;

    // Gunakan View Transitions API jika didukung
    if (document.startViewTransition) {
      const transition = document.startViewTransition(async () => {
        // Perbaikan: deteksi class dengan page.prototype && page.prototype.render
        if (typeof page === 'function' && page.prototype && page.prototype.render) {
          pageInstance = new page();
          html = await pageInstance.render();
          document.getElementById('main-content').innerHTML = html;
          if (typeof pageInstance.afterRender === 'function') {
            await pageInstance.afterRender();
          }
        } else if (typeof page === 'function') {
          await page();
        }
      });

      // Handle transition animation
      try {
        await transition.finished;
      } catch (error) {
        // Handle error jika transisi gagal
        console.error('View transition error:', error);
      }
    } else {
      // Fallback untuk browser yang tidak mendukung View Transitions API
      if (typeof page === 'function' && page.prototype && page.prototype.render) {
        pageInstance = new page();
        html = await pageInstance.render();
        document.getElementById('main-content').innerHTML = html;
        if (typeof pageInstance.afterRender === 'function') {
          await pageInstance.afterRender();
        }
      } else if (typeof page === 'function') {
        await page();
      }
    }
  }
};

export default App;
