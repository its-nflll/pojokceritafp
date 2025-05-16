const renderNotFoundPage = () => {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <section class="not-found container">
      <div class="not-found-content">
        <h2>404 - Halaman Tidak Ditemukan</h2>
        <p>Maaf, halaman yang Anda cari tidak tersedia.</p>
        <div class="not-found-image">
          <img src="./images/404.png" alt="Halaman tidak ditemukan" onerror="this.onerror=null; this.src='./images/logo.png';">
        </div>
        <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
      </div>
    </section>
  `;
  
  // Pastikan event listener untuk tombol kembali bekerja
  const backButton = main.querySelector('.btn-primary');
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#/';
    });
  }
};

export default renderNotFoundPage; 