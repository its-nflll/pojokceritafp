import { saveStory, getAllStories, deleteStory, saveImage, getImage } from '../../utils/idb.js';

const HomeView = {
  async renderStories(stories, { isOnline = true } = {}) {
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
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;">
            <h1 style="margin:0;font-size:1.5rem;color:#2d2d2d;">Beranda</h1>
            ${isOnline ? `
              <button id="open-story-form-btn" class="primary-btn" 
                style="padding:0.6rem 1.2rem;font-size:0.95rem;border-radius:8px;background:#388e3c;color:white;border:none;
                display:flex;align-items:center;gap:0.5rem;cursor:pointer;transition:all 0.2s ease;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <i class="fa fa-plus" style="font-size:0.9em;"></i>
                <span>Buat Cerita</span>
              </button>
            ` : ''}
          </div>
          <button id="show-fav-btn" style="margin-bottom:1rem;background:#2196f3;color:#fff;padding:0.5rem 1.2rem;border:none;border-radius:8px;cursor:pointer;">
            Cerita Favorit Offline
          </button>
          
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
                         <img src="${story.photoUrl}" 
                              alt="Foto cerita" 
                              style="max-width:70%;height:auto;border-radius:6px;margin-bottom:0.8rem;"
                              onerror="this.onerror=null;this.src='/images/placeholder.png'">
                       </div>` : 
                      ''}
                    ${story.lat && story.lon ? 
                      `<div id="story-map-${idx}" class="story-mini-map" style="height:150px;border-radius:6px;margin:0.5rem auto;max-width:85%;"></div>` :
                      ''}
                    ${!story.isOffline ? 
                      `<button class="save-fav-btn" data-story='${JSON.stringify(story).replace(/'/g, "&apos;")}' 
                        style="margin-top:0.7rem;background:#ff9800;color:#fff;padding:0.4rem 1rem;border:none;border-radius:6px;cursor:pointer;">
                        Simpan Offline
                      </button>` :
                      `<span style="display:inline-block;margin-top:0.7rem;color:#388e3c;font-size:0.9rem;">
                        <i class="fa fa-check"></i> Tersimpan Offline
                      </span>`
                    }
                  </div>
                </article>
              `).join('')}
          </div>          <div id="fav-modal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:2000;">
            <div style="background:#fff;max-width:500px;margin:2rem auto;padding:1.5rem;border-radius:12px;position:relative;max-height:90vh;display:flex;flex-direction:column;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <h2 style="margin:0;">Daftar Cerita Favorit (Offline)</h2>
                <button id="close-fav-modal" 
                        style="background:none;border:none;font-size:1.5rem;cursor:pointer;padding:0.5rem;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;transition:background-color 0.2s;"
                        onmouseover="this.style.backgroundColor='#f0f0f0'"
                        onmouseout="this.style.backgroundColor='transparent'"
                        aria-label="Tutup">&times;</button>
              </div>
              <div style="flex:1;overflow-y:auto;margin:0 -1.5rem;padding:0 1.5rem;">
                <ul id="fav-list" style="list-style:none;padding:0;margin:0;"></ul>
              </div>
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
                  <input type="file" 
                         id="story-photo" 
                         name="story-photo"
                         accept="image/*" 
                         style="flex:1;" 
                         aria-label="Pilih file foto untuk cerita"
                         title="Pilih file foto untuk cerita">
                  <button type="button" 
                          id="open-camera-btn" 
                          style="${cameraButtonStyle}"
                          aria-label="Buka kamera">
                    <i class="fa fa-camera"></i>
                    <span>Kamera</span>
                  </button>
                </div>
                <div id="camera-container" style="display:none;margin-top:0.8rem;">
                  <video id="camera-video" 
                         style="width:100%;border-radius:8px;max-height:300px;object-fit:contain;" 
                         autoplay 
                         playsinline
                         aria-label="Preview kamera"
                         title="Preview kamera"></video>
                  <button type="button" 
                          id="take-photo-btn" 
                          style="${cameraButtonStyle};width:100%;margin-top:0.5rem;"
                          aria-label="Ambil foto">
                    <i class="fa fa-camera"></i>
                    <span>Ambil Foto</span>
                  </button>
                  <canvas id="camera-canvas" style="display:none;"></canvas>
                </div>
                <img id="preview-photo" 
                     style="display:none;width:100%;max-height:300px;object-fit:contain;margin-top:0.8rem;border-radius:8px;" 
                     alt="Preview foto yang dipilih">
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

    // Event handlers for offline storage
    const setupOfflineHandlers = async () => {
      // Save handlers
      document.querySelectorAll('.save-fav-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const story = JSON.parse(btn.getAttribute('data-story').replace(/&apos;/g, "'"));
          
          btn.textContent = 'Menyimpan...';
          btn.disabled = true;
          
          try {
            // Cache image if exists
            if (story.photoUrl) {
              try {
                const response = await fetch(story.photoUrl);
                const blob = await response.blob();
                await saveImage(story.photoUrl, blob);
              } catch (error) {
                console.error('Failed to cache image:', error);
              }
            }
            
            await saveStory({ ...story, isOffline: true });
            
            btn.outerHTML = `<span style="display:inline-block;margin-top:0.7rem;color:#388e3c;font-size:0.9rem;">
              <i class="fa fa-check"></i> Tersimpan Offline
            </span>`;
            
          } catch (error) {
            btn.textContent = 'Gagal Menyimpan';
            btn.disabled = false;
            console.error('Failed to save story:', error);
          }
        });
      });

      // Handle favorite stories modal
      const setupFavModal = async () => {
        document.getElementById('show-fav-btn').onclick = async () => {
          const favModal = document.getElementById('fav-modal');
          const favList = document.getElementById('fav-list');
          favModal.style.display = 'block';
          favList.innerHTML = '<li>Memuat...</li>';
          
          const favStories = await getAllStories();
          
          favList.innerHTML = favStories.length === 0 ? 
            '<li>Tidak ada cerita favorit offline.</li>' : 
            favStories.map((story, idx) => `
              <li style="margin-bottom:2rem;padding:1rem;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <div style="margin-bottom:0.8rem;">
                  <strong style="font-size:1.1rem;">${story.name || 'Tanpa Nama'}</strong>
                  <div style="color:#666;font-size:0.9rem;margin-top:0.2rem;">
                    ${new Date(story.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <p style="margin:0.8rem 0;line-height:1.4;">${story.description}</p>
                
                ${story.photoUrl ? 
                  `<div style="margin:1rem 0;text-align:center;">
                    <img src="${story.photoUrl}" 
                         alt="Foto cerita" 
                         style="max-width:100%;height:auto;border-radius:8px;"
                         onerror="this.onerror=null;this.src='/images/placeholder.png'"
                         class="offline-story-image"
                         data-url="${story.photoUrl}">
                  </div>` : 
                  ''}
                
                ${story.lat && story.lon ? 
                  `<div id="offline-story-map-${idx}" 
                        class="story-mini-map" 
                        style="height:200px;border-radius:8px;margin:1rem 0;"
                        data-lat="${story.lat}"
                        data-lon="${story.lon}">
                  </div>` : 
                  ''}
                
                <button class="delete-fav-btn" 
                        data-id="${story.id}" 
                        style="margin-top:1rem;background:#d32f2f;color:#fff;padding:0.5rem 1rem;border:none;border-radius:6px;cursor:pointer;">
                  <i class="fa fa-trash"></i> Hapus
                </button>
              </li>
            `).join('');

          // Initialize maps for offline stories
          favStories.forEach((story, idx) => {
            if (story.lat && story.lon) {
              const mapElement = document.getElementById(`offline-story-map-${idx}`);
              if (mapElement) {
                const map = L.map(mapElement, {
                  attributionControl: false,
                  zoomControl: true,
                  dragging: true,
                  scrollWheelZoom: true,
                  doubleClickZoom: true,
                  boxZoom: true,
                  keyboard: true,
                  tap: true,
                  touchZoom: true,
                  zoomSnap: 0.5,
                  minZoom: 2,
                  maxZoom: 18
                }).setView([story.lat, story.lon], 13);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                L.marker([story.lat, story.lon]).addTo(map);
              }
            }
          });

          // Load cached images
          document.querySelectorAll('.offline-story-image').forEach(async img => {
            try {
              const url = img.getAttribute('data-url');
              const cachedImage = await getImage(url);
              if (cachedImage) {
                const objectUrl = URL.createObjectURL(cachedImage);
                img.src = objectUrl;
              }
            } catch (error) {
              console.error('Failed to load cached image:', error);
            }
          });

          // Setup delete handlers
          favList.querySelectorAll('.delete-fav-btn').forEach(btn => {
            btn.onclick = async () => {
              if (confirm('Apakah Anda yakin ingin menghapus cerita ini dari penyimpanan offline?')) {
                const id = btn.getAttribute('data-id');
                try {
                  await deleteStory(isNaN(id) ? id : Number(id));
                  btn.closest('li').remove();
                  
                  if (favList.children.length === 0) {
                    favList.innerHTML = '<li>Tidak ada cerita favorit offline.</li>';
                  }
                  
                  // Show notification
                  if (window.Notification && Notification.permission === 'granted') {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification('PojokCerita', {
                        body: 'Cerita berhasil dihapus dari penyimpanan offline',
                        icon: '/images/logo.png',
                        badge: '/favicon.png'
                      });
                    });
                  }
                } catch (error) {
                  console.error('Failed to delete story:', error);
                  alert('Gagal menghapus cerita');
                }
              }
            };
          });
        };        // Close modal handlers
        const closeModal = () => {
          const favModal = document.getElementById('fav-modal');
          if (favModal) {
            favModal.style.display = 'none';
          }
        };

        // Close on X button click
        document.getElementById('close-fav-modal')?.addEventListener('click', closeModal);

        // Close on clicking outside modal
        document.getElementById('fav-modal')?.addEventListener('click', (e) => {
          if (e.target.id === 'fav-modal') {
            closeModal();
          }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && document.getElementById('fav-modal').style.display === 'block') {
            closeModal();
          }
        });
      };

      await setupFavModal();
    };

    setupOfflineHandlers();
  }
};

export default HomeView;
