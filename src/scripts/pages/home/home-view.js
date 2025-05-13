import { saveStory, getAllStories, deleteStory } from '../../utils/idb.js';

const HomeView = {
  async renderStories(stories) {
    const container = document.getElementById('main-content');

    // Camera button style
    const cameraButtonStyle = `
      padding:0.5rem 1rem;
      font-size:0.95rem;
      border-radius:8px;
      background:#2196f3;
      color:white;
      border:none;
      display:flex;
      align-items:center;
      gap:0.5rem;
      cursor:pointer;
      transition:all 0.2s ease;
      box-shadow:0 2px 4px rgba(0,0,0,0.1);
    `;

    // Submit button style  
    const submitButtonStyle = `
      width:100%;
      padding:0.7rem;
      font-size:1rem;
      border-radius:8px;
      background:#388e3c;
      color:white;
      border:none;
      font-weight:600;
      cursor:pointer;
      transition:all 0.2s ease;
      box-shadow:0 2px 4px rgba(0,0,0,0.1);
    `;

    container.innerHTML = `
      <section class="container" style="display:flex;gap:1.5rem;padding:1rem;">
        <!-- Header Section -->
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
            <h1 style="margin:0;font-size:1.5rem;color:#2d2d2d;">Beranda</h1>
            <button id="open-story-form-btn" class="primary-btn" 
              style="padding:0.6rem 1.2rem;font-size:0.95rem;border-radius:8px;background:#388e3c;color:white;border:none;
              display:flex;align-items:center;gap:0.5rem;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              <i class="fa fa-plus" style="font-size:0.9em;"></i>
              <span>Buat Cerita</span>
            </button>
          </div>
          <button id="show-fav-btn" style="margin-bottom:1rem;background:#2196f3;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:8px;cursor:pointer;">Cerita Favorit Offline</button>
          <!-- Stories List -->
          <div class="stories-list" style="display:grid;gap:0.8rem;">
            ${stories.length === 0 ? 
              `<div class="error-message" style="text-align:center;padding:2rem;">Belum ada cerita.</div>` : 
              stories.map((story, idx) => `
                <article class="story-card" style="background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;">
                  <div class="story-content" style="padding:0.8rem;">
                    <div class="story-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                      <strong style="font-size:0.95rem;color:#2d2d2d;">${story.name}</strong>
                      <span style="color:#777;font-size:0.8rem;">${new Date(story.createdAt).toLocaleString()}</span>
                    </div>
                    <p class="story-desc" style="margin:0 0 0.8rem;font-size:0.92rem;line-height:1.4;color:#444;">${story.description}</p>
                    ${story.photoUrl ? 
                      `<div style="text-align:center;">
                         <img src="${story.photoUrl}" alt="Foto cerita" style="max-width:70%;height:auto;border-radius:6px;margin-bottom:0.8rem;">
                       </div>` : 
                      ''}
                    ${story.lat && story.lon ? 
                      `<div id="story-map-${idx}" class="story-mini-map" style="height:150px;border-radius:6px;margin:0.5rem auto;max-width:85%;"></div>` :
                      ''}
                    <button class="save-fav-btn" data-story='${JSON.stringify(story).replace(/'/g, "&apos;")}' style="margin-top:0.7rem;background:#ff9800;color:#fff;padding:0.4rem 1rem;border:none;border-radius:6px;cursor:pointer;">Simpan Offline</button>
                  </div>
                </article>
              `).join('')}
          </div>
          <div id="fav-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:2000;">
            <div style="background:#fff;max-width:500px;margin:2rem auto;padding:1.5rem;border-radius:12px;position:relative;">
              <button id="close-fav-modal" style="position:absolute;right:1rem;top:1rem;background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
              <h2>Daftar Cerita Favorit (Offline)</h2>
              <ul id="fav-list" style="list-style:none;padding:0;margin:0;"></ul>
            </div>
          </div>
        </div>

        <!-- Form Modal -->
        <div id="story-form-modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;">
          <div class="modal-content" style="background:#fff;max-width:500px;margin:2rem auto;padding:1.5rem;border-radius:12px;position:relative;">
            <button type="button" id="close-form-btn" style="position:absolute;right:1rem;top:1rem;background:none;border:none;font-size:1.5rem;cursor:pointer;">&times;</button>
            <h2 style="margin:0 0 1.5rem;">Buat Cerita Baru</h2>
            <form id="storyForm">
              <div class="form-group" style="margin-bottom:1rem;">
                <label for="story-desc">Deskripsi</label>
                <textarea id="story-desc" name="description" required rows="3" style="width:100%;padding:0.5rem;border:1px solid #ddd;border-radius:8px;"></textarea>
              </div>
              
              <div class="form-group" style="margin-bottom:1rem;">
                <label>Foto (opsional)</label>
                <div style="display:flex;gap:0.5rem;margin-top:0.3rem;">
                  <input type="file" id="story-photo" accept="image/*" style="flex:1;">
                  <button type="button" id="open-camera-btn" style="${cameraButtonStyle}">
                    <i class="fa fa-camera"></i>
                    <span>Kamera</span>
                  </button>
                </div>
                <div id="camera-container" style="display:none;margin-top:0.8rem;">
                  <video id="camera-video" style="width:100%;border-radius:8px;" autoplay playsinline></video>
                  <button type="button" id="take-photo-btn" style="${cameraButtonStyle};width:100%;margin-top:0.5rem;">
                    <i class="fa fa-camera"></i>
                    <span>Ambil Foto</span>
                  </button>
                  <canvas id="camera-canvas" style="display:none;"></canvas>
                </div>
                <img id="preview-photo" style="display:none;width:100%;margin-top:0.8rem;border-radius:8px;" alt="Preview foto">
              </div>

              <div class="form-group" style="margin-bottom:1rem;">
                <label>Lokasi (opsional)</label>
                <div id="story-location-map" style="height:200px;border-radius:8px;margin:0.5rem 0;"></div>
                <input type="hidden" id="story-lat" name="lat">
                <input type="hidden" id="story-lon" name="lon">
                <div id="story-location-info" style="font-size:0.9rem;color:#666;"></div>
              </div>

              <button type="submit" style="${submitButtonStyle}">Kirim Cerita</button>
              <div id="story-form-message" style="margin-top:0.8rem;text-align:center;" aria-live="polite"></div>
            </form>
          </div>
        </div>
      </section>
    `;

    // Event untuk simpan offline
    setTimeout(() => {
      document.querySelectorAll('.save-fav-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const story = JSON.parse(btn.getAttribute('data-story').replace(/&apos;/g, "'"));
          await saveStory(story);
          btn.textContent = 'Tersimpan!';
          btn.disabled = true;
        });
      });
      document.getElementById('show-fav-btn').onclick = async () => {
        const favModal = document.getElementById('fav-modal');
        const favList = document.getElementById('fav-list');
        favModal.style.display = 'block';
        favList.innerHTML = '<li>Memuat...</li>';
        const favStories = await getAllStories();
        favList.innerHTML = favStories.length === 0 ? '<li>Tidak ada cerita favorit offline.</li>' : favStories.map(story => `<li style="margin-bottom:1.2rem;"><strong>${story.name || 'Tanpa Nama'}</strong><br>${story.description}<br><button class="delete-fav-btn" data-id="${story.id}" style="margin-top:0.5rem;background:#d32f2f;color:#fff;padding:0.3rem 0.8rem;border:none;border-radius:6px;cursor:pointer;">Hapus</button></li>`).join('');
        favList.querySelectorAll('.delete-fav-btn').forEach(btn => {
          btn.onclick = async () => {
            let id = btn.getAttribute('data-id');
            const idKey = !isNaN(Number(id)) && id === String(Number(id)) ? Number(id) : id;
            try {
              await deleteStory(idKey);
              btn.parentElement.remove();
              // Push notification jika diizinkan
              if (window.Notification) {
                if (Notification.permission === 'granted') {
                  navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg) {
                      reg.showNotification('Cerita offline dihapus', {
                        body: 'Cerita favorit offline berhasil dihapus.',
                        icon: '/images/logo.png',
                        badge: '/favicon.png'
                      });
                    }
                  });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg) {
                          reg.showNotification('Cerita offline dihapus', {
                            body: 'Cerita favorit offline berhasil dihapus.',
                            icon: '/images/logo.png',
                            badge: '/favicon.png'
                          });
                        }
                      });
                    } else {
                      alert('Cerita offline berhasil dihapus. (Aktifkan notifikasi untuk pesan pop-up)');
                    }
                  });
                } else {
                  alert('Cerita offline berhasil dihapus. (Notifikasi diblokir)');
                }
              } else {
                alert('Cerita offline berhasil dihapus. (Browser tidak mendukung notifikasi)');
              }
            } catch (e) {
              alert('Gagal menghapus: ' + (e.message || 'ID tidak valid.'));
            }
          };
        });
        document.getElementById('close-fav-modal').onclick = () => {
          favModal.style.display = 'none';
        };
      };
    }, 0);
  }
};

export default HomeView;
