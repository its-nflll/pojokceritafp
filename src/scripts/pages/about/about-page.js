export default function renderAboutPage() {
  const container = document.getElementById('main-content');
  container.innerHTML = `
    <section class="container" style="max-width:500px;margin:0 auto;">
      <h1 style="text-align:center;margin-bottom:2rem;">About</h1>
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:2rem 1.5rem;">
        <ul style="list-style:none;padding:0;margin:0;">
          <li style="margin-bottom:1.1rem;">
            <strong>Nama</strong><br>
            <span style="color:#388e3c;font-size:1.1rem;">Naufal Haidar Nityasa</span>
          </li>
          <li style="margin-bottom:1.1rem;">
            <strong>Kampus</strong><br>
            <span style="color:#388e3c;">Universitas Amikom Yogyakarta</span>
          </li>
          <li style="margin-bottom:1.1rem;">
            <strong>Program</strong><br>
            <span style="color:#388e3c;">Coding Camp 2025 powered by DBS</span>
          </li>
          <li>
            <strong>Minat</strong><br>
            <span style="color:#388e3c;">Fullstack Developer</span>
          </li>
        </ul>
      </div>
    </section>
  `;
}
