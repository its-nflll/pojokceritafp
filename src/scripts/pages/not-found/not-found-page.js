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
        <a href="/" class="btn btn-primary" id="back-to-home">Kembali ke Beranda</a>
      </div>
    </section>
  `;
  
  // Perbaikan: Gunakan dua metode untuk memastikan tombol kembali bekerja
  const backButton = main.querySelector('#back-to-home');
  if (backButton) {
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      // Gunakan location.href untuk navigasi langsung ke root
      const baseUrl = window.location.origin;
      window.location.href = baseUrl;
    });
  }
};

export default renderNotFoundPage; 