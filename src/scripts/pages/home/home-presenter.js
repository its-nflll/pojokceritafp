import HomeModel from './home-model.js';
import HomeView from './home-view.js';
import Api from '../../data/api.js';

const HomePresenter = {
  async showStories() {
    const container = document.getElementById('main-content');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.hash = '#/login';
        return;
      }

      container.innerHTML = '<div class="loading">Memuat cerita...</div>';
      
      // Try from network first
      try {
        const result = await HomeModel.getStories();
        
        if (!result.error) {
          HomeView.renderStories(result.listStory || [], { isOnline: true });
          this.initForm();
          this.initMiniMaps(result.listStory || []);
          return;
        }
      } catch (err) {
        console.log('Network fetch failed, falling back to offline data:', err);
      }

      // If network fails, get from IndexedDB
      const offlineStories = await getAllStories();
      if (offlineStories && offlineStories.length > 0) {
        HomeView.renderStories(offlineStories, { isOnline: false });
        this.initForm();
        this.initMiniMaps(offlineStories);
        container.insertAdjacentHTML('afterbegin', 
          '<div class="offline-notice" style="background:#fff3cd;color:#856404;padding:0.75rem;border-radius:4px;margin-bottom:1rem;">Menampilkan data offline. Beberapa fitur mungkin terbatas.</div>'
        );
      } else {
        container.innerHTML = `<div class="error-message">Tidak dapat memuat cerita. Anda sedang offline dan belum ada data tersimpan.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div class="error-message">Error: ${err.message}</div>`;
    }
  },

  initForm() {
    // Get elements after render
    const openFormBtn = document.getElementById('open-story-form-btn');
    const modal = document.getElementById('story-form-modal');
    const closeFormBtn = document.getElementById('close-form-btn');
    const storyForm = document.getElementById('storyForm');
    const message = document.getElementById('story-form-message');
    const photoInput = document.getElementById('story-photo');
    const previewPhoto = document.getElementById('preview-photo');
    const openCameraBtn = document.getElementById('open-camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const cameraVideo = document.getElementById('camera-video');
    const takePhotoBtn = document.getElementById('take-photo-btn');
    const cameraCanvas = document.getElementById('camera-canvas');

    if (!openFormBtn || !modal || !closeFormBtn || !storyForm) {
      console.error('Required form elements not found');
      return;
    }

    // Deteksi apakah ini adalah localhost/development server
    const isLocalDevelopment = 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.match(/^192\.168\.\d+\.\d+$/) ||
      window.location.hostname.match(/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/) ||
      window.location.hostname.match(/^10\.\d+\.\d+\.\d+$/);
    
    // Deteksi browser
    const isChrome = /chrome/i.test(navigator.userAgent) && /google/i.test(navigator.vendor);
    const isFirefox = /firefox/i.test(navigator.userAgent);
    
    // Tampilkan informasi jika ini adalah development server
    if (isLocalDevelopment && !location.protocol.startsWith('https') && openCameraBtn) {
      // Hapus info element yang mungkin sudah ada
      const existingInfo = document.getElementById('camera-info-element');
      if (existingInfo) {
        existingInfo.remove();
      }
      
      // Buat tombol info kamera yang lebih rapi
      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.id = 'camera-info-btn';
      infoBtn.setAttribute('aria-label', 'Informasi kamera');
      infoBtn.style.cssText = `
        background: #f0f0f0;
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 12px;
        color: #1b4636;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        vertical-align: middle;
      `;
      infoBtn.innerHTML = '<i class="fa fa-info"></i>';
      
      // Tambahkan ke samping tombol kamera
      openCameraBtn.insertAdjacentElement('afterend', infoBtn);
      
      // Buat modal info yang tersembunyi
      const infoModal = document.createElement('div');
      infoModal.id = 'camera-info-modal';
      infoModal.style.cssText = `
        display: none;
        position: absolute;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        padding: 10px 15px;
        width: 90%;
        max-width: 400px;
        z-index: 100;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.9rem;
      `;
      
      if (isChrome) {
        infoModal.innerHTML = `
          <h3 style="margin-top:0;font-size:1rem;color:#1b4636;">Info Akses Kamera</h3>
          <p style="margin-bottom:0.5rem">Untuk mengakses kamera di development server pada Chrome:</p>
          <ol style="margin-top:0;padding-left:20px;">
            <li>Salin URL ini: <code style="background:#f5f5f5;padding:2px 4px;border-radius:3px;font-size:0.8rem;">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
            <li>Buka di tab baru Chrome</li>
            <li>Pada kotak teks, tambahkan: <code style="background:#f5f5f5;padding:2px 4px;border-radius:3px;font-size:0.8rem;">${window.location.origin}</code></li>
            <li>Ubah dropdown menjadi <strong>Enabled</strong></li>
            <li>Restart browser Chrome</li>
          </ol>
          <button id="close-info-modal" style="background:#1b4636;color:white;border:none;border-radius:4px;padding:5px 10px;float:right;cursor:pointer;">Tutup</button>
          <div style="clear:both"></div>
        `;
      } else if (isFirefox) {
        infoModal.innerHTML = `
          <h3 style="margin-top:0;font-size:1rem;color:#1b4636;">Info Akses Kamera</h3>
          <p>Untuk mengakses kamera di Firefox:</p>
          <ol style="margin-top:0;padding-left:20px;">
            <li>Pastikan Anda memberikan izin saat Firefox meminta akses kamera</li>
            <li>Jika masih gagal, coba ubah alamat menjadi <code>localhost</code> (bukan IP)</li>
          </ol>
          <button id="close-info-modal" style="background:#1b4636;color:white;border:none;border-radius:4px;padding:5px 10px;float:right;cursor:pointer;">Tutup</button>
          <div style="clear:both"></div>
        `;
      } else {
        infoModal.innerHTML = `
          <h3 style="margin-top:0;font-size:1rem;color:#1b4636;">Info Akses Kamera</h3>
          <p>Beberapa browser memerlukan HTTPS untuk akses kamera.</p>
          <p>Jika mengalami masalah:</p>
          <ul style="margin-top:0;padding-left:20px;">
            <li>Coba gunakan Chrome atau Firefox terbaru</li>
            <li>Ubah alamat menjadi <code>localhost</code> (bukan IP)</li>
          </ul>
          <button id="close-info-modal" style="background:#1b4636;color:white;border:none;border-radius:4px;padding:5px 10px;float:right;cursor:pointer;">Tutup</button>
          <div style="clear:both"></div>
        `;
      }
      
      // Tambahkan overlay
      const infoOverlay = document.createElement('div');
      infoOverlay.id = 'camera-info-overlay';
      infoOverlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 99;
      `;
      
      // Gabungkan semua elemen ke dokumen
      document.body.appendChild(infoOverlay);
      document.body.appendChild(infoModal);
      
      // Event listener untuk tombol info
      infoBtn.addEventListener('click', () => {
        infoModal.style.display = 'block';
        infoOverlay.style.display = 'block';
      });
      
      // Event listener untuk menutup modal
      document.getElementById('close-info-modal').addEventListener('click', () => {
        infoModal.style.display = 'none';
        infoOverlay.style.display = 'none';
      });
      
      // Tutup juga saat klik overlay
      infoOverlay.addEventListener('click', () => {
        infoModal.style.display = 'none';
        infoOverlay.style.display = 'none';
      });
    }

    // Initialize map for location picker
    const locationMap = L.map('story-location-map').setView([-7.797068, 110.370529], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(locationMap);
    
    let locationMarker = null;
    locationMap.on('click', function(e) {
      const { lat, lng } = e.latlng;
      if (locationMarker) {
        locationMarker.setLatLng([lat, lng]);
      } else {
        locationMarker = L.marker([lat, lng]).addTo(locationMap);
      }
      document.getElementById('story-lat').value = lat;
      document.getElementById('story-lon').value = lng;
      document.getElementById('story-location-info').textContent = 
        `Lokasi dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    });

    // Initialize form events
    openFormBtn.onclick = () => modal.style.display = 'block';
    closeFormBtn.onclick = () => {
      modal.style.display = 'none';
      this.closeCamera();
      openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
    };

    // Add close camera event listener
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'close-form-btn') {
        modal.style.display = 'none';
        this.closeCamera();
      }
    });    // Helper function to safely get camera access
    const getCameraStream = async (constraints) => {
      console.log('Trying to access camera with constraints:', constraints);
      
      // Deteksi browser dengan lebih tepat
      const isChrome = /chrome/i.test(navigator.userAgent) && !/edge/i.test(navigator.userAgent);
      const isFirefox = /firefox/i.test(navigator.userAgent);
      const isEdge = /edge/i.test(navigator.userAgent);
      const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
      
      console.log('Browser detection:', { isChrome, isFirefox, isEdge, isSafari });
      
      // Coba berbagai cara mendapatkan akses kamera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern API (paling disarankan)
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      
      // Fallback untuk API lama (deprecated)
      const getUserMediaFn = 
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
        
      if (getUserMediaFn) {
        return new Promise((resolve, reject) => {
          getUserMediaFn.call(navigator, constraints, resolve, reject);
        });
      }
      
      // Tidak ada API yang didukung
      throw new Error('Browser Anda tidak mendukung akses kamera');
    };

    // Tambahkan alternatif untuk upload file
    const enhanceFileUpload = () => {
      if (photoInput) {
        // Hapus tip yang mungkin sudah ada sebelumnya
        const existingTip = document.getElementById('photo-upload-tip');
        if (existingTip) {
          existingTip.remove();
        }
        
        // Buat UI yang lebih rapi
        const fileContainer = photoInput.parentElement;
        if (fileContainer) {
          const tipElement = document.createElement('div');
          tipElement.id = 'photo-upload-tip';
          tipElement.style.cssText = `
            font-size: 0.85rem;
            color: #555;
            margin-top: 5px;
            display: flex;
            align-items: center;
          `;
          
          tipElement.innerHTML = `
            <i class="fa fa-lightbulb-o" style="margin-right:5px;color:#ff9800"></i>
            <span>Jika kamera tidak berfungsi, Anda dapat <a href="#" style="color:#1b4636;text-decoration:underline;" id="trigger-file-input">mengupload foto</a> dari perangkat Anda.</span>
          `;
          
          // Masukkan tip setelah pilihan file
          fileContainer.insertAdjacentElement('afterend', tipElement);
          
          // Tambahkan event listener untuk link upload
          document.getElementById('trigger-file-input')?.addEventListener('click', (e) => {
            e.preventDefault();
            photoInput.click();
          });
        }
      }
    };
    
    // Panggil fungsi untuk meningkatkan file upload
    enhanceFileUpload();

    // Camera handling with icon toggle
    openCameraBtn?.addEventListener('click', async () => {
      try {
        if (cameraVideo.srcObject) {
          // If camera is active, stop it
          this.closeCamera();
          cameraContainer.style.display = 'none';
          openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
        } else {
          // Reset pesan error dan status
          message.textContent = '';
          message.style.color = '';
          
          // Cek apakah berjalan di development server
          const isLocalDevelopment = 
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.match(/^192\.168\.\d+\.\d+$/) ||
            window.location.hostname.match(/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/) ||
            window.location.hostname.match(/^10\.\d+\.\d+\.\d+$/);
          
          // If camera is inactive, start it
          cameraContainer.style.display = 'block';
          document.getElementById('camera-fallback').style.display = 'none';
          cameraVideo.style.display = 'block';
          previewPhoto.style.display = 'none';
          photoInput.value = '';

          try {
            console.log('Memulai akses kamera...', {
              isLocalDevelopment,
              secureContext: window.isSecureContext,
              hostname: window.location.hostname,
              protocol: location.protocol
            });
            
            // Coba berbagai definisi constraint untuk kompatibilitas
            const constraints = [
              { 
                video: { 
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                },
                audio: false
              },
              // Fallback dengan constraint yang lebih sederhana
              { video: true, audio: false },
              // Fallback dengan tipe media yang lebih sederhana
              { video: { facingMode: 'environment' }, audio: false },
              // Fallback dengan kamera depan
              { video: { facingMode: 'user' }, audio: false }
            ];
            
            // Coba tiap constraint secara berurutan sampai berhasil
            let stream = null;
            let error = null;
            
            for (const constraint of constraints) {
              if (stream) break; // Sudah mendapatkan stream, berhenti mencoba
              
              try {
                console.log('Mencoba constraint:', constraint);
                
                // Gunakan timeout untuk menghindari blokir UI
                stream = await Promise.race([
                  getCameraStream(constraint),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Camera access timeout')), 10000))
                ]);
                
                console.log('Berhasil mendapatkan stream kamera');
              } catch (err) {
                console.warn(`Gagal dengan constraint ${JSON.stringify(constraint)}:`, err);
                error = err;
              }
            }
            
            if (!stream) {
              throw error || new Error('Tidak bisa mengakses kamera dengan constraint apapun');
            }
            
            // Fungsi untuk menunjukkan fallback
            const showCameraFallback = (errorMessage) => {
              console.error('Camera error:', errorMessage);
              cameraVideo.style.display = 'none';
              document.getElementById('camera-fallback').style.display = 'block';
              document.getElementById('take-photo-btn').style.display = 'none';
              
              // Tampilkan pesan error yang user-friendly
              message.textContent = 'Tidak dapat mengakses kamera. Silakan gunakan opsi upload file.';
              message.style.color = '#d32f2f';
            };

            // Masukkan stream ke video element
            cameraVideo.srcObject = stream;
            
            // Setup event untuk saat video sudah siap
            cameraVideo.onloadedmetadata = () => {
              cameraVideo.play()
                .then(() => {
                  console.log('Camera video playing successfully');
                  document.getElementById('take-photo-btn').style.display = 'block';
                })
                .catch(err => {
                  console.error('Error playing video:', err);
                  showCameraFallback(err);
                });
            };
            
            // Handle error pada video
            cameraVideo.onerror = (err) => {
              console.error('Video element error:', err);
              showCameraFallback(err);
            };
            
            // Ubah icon tombol
            openCameraBtn.innerHTML = '<i class="fa fa-times"></i> <span>Tutup Kamera</span>';
            
          } catch (err) {
            console.error('Camera error:', err);
            
            // Tampilkan fallback UI untuk kamera tidak tersedia
            cameraVideo.style.display = 'none';
            document.getElementById('camera-fallback').style.display = 'block';
            document.getElementById('take-photo-btn').style.display = 'none';
            
            // Tampilkan pesan error yang user-friendly
            const errorMessage = err.name === 'NotAllowedError'
              ? 'Akses kamera ditolak. Izinkan akses kamera di pengaturan browser Anda.'
              : 'Browser Anda tidak mendukung akses kamera atau tidak diizinkan di alamat ini.';
            
            message.textContent = errorMessage;
            message.style.color = '#d32f2f';
          }
        }
      } catch (err) {
        console.error('General camera error:', err);
        message.textContent = 'Terjadi kesalahan saat mengakses kamera.';
        message.style.color = '#d32f2f';
      }
    });

    // Take photo button
    takePhotoBtn?.addEventListener('click', () => {
      try {
        const canvas = document.getElementById('camera-canvas');
        const context = canvas.getContext('2d');
        
        // Cek apakah kamera aktif
        if (!cameraVideo.srcObject || !cameraVideo.srcObject.active) {
          console.error('Kamera tidak aktif saat mencoba ambil foto');
          message.textContent = 'Kamera tidak aktif. Coba muat ulang kamera.';
          message.style.color = '#d32f2f';
          return;
        }
        
        // Set canvas dimensions berdasarkan video
        const videoWidth = cameraVideo.videoWidth || 640;
        const videoHeight = cameraVideo.videoHeight || 480;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Gambar video ke canvas
        context.drawImage(cameraVideo, 0, 0, videoWidth, videoHeight);
        
        // Konversi ke file
        canvas.toBlob((blob) => {
          // Pastikan blob valid
          if (!blob) {
            console.error('Gagal mengonversi gambar kamera ke blob');
            message.textContent = 'Gagal mengambil foto. Coba lagi.';
            message.style.color = '#d32f2f';
            return;
          }
          
          // Buat URL untuk preview
          const previewUrl = URL.createObjectURL(blob);
          
          // Tampilkan preview dengan modal
          const photoPreview = document.createElement('div');
          photoPreview.id = 'photo-preview-container';
          photoPreview.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 2000;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          `;
          
          photoPreview.innerHTML = `
            <div style="position: relative; width: 90%; max-width: 600px; background: white; border-radius: 12px; overflow: hidden;">
              <div style="text-align: center; padding: 1rem; background: #1b4636; color: white;">
                <h3 style="margin: 0; font-size: 1.2rem;">Preview Foto</h3>
              </div>
              <img src="${previewUrl}" alt="Preview foto" style="width: 100%; max-height: 70vh; object-fit: contain; display: block;" />
              <div style="padding: 1rem; display: flex; justify-content: space-between;">
                <button id="retake-photo-btn" style="padding: 0.6rem 1rem; background: #757575; color: white; border: none; border-radius: 6px; cursor: pointer;">
                  <i class="fa fa-refresh"></i> Ambil Ulang
                </button>
                <button id="use-photo-btn" style="padding: 0.6rem 1rem; background: #1b4636; color: white; border: none; border-radius: 6px; cursor: pointer;">
                  <i class="fa fa-check"></i> Gunakan Foto
                </button>
              </div>
            </div>
          `;
          
          document.body.appendChild(photoPreview);
          
          // Tampilkan dengan animasi
          setTimeout(() => {
            photoPreview.style.opacity = '1';
          }, 10);
          
          // Event handlers untuk tombol-tombol
          document.getElementById('retake-photo-btn').addEventListener('click', () => {
            // Hapus preview
            photoPreview.style.opacity = '0';
            setTimeout(() => {
              photoPreview.remove();
              
              // Bersihkan URL
              URL.revokeObjectURL(previewUrl);
              
              // Reset pesan
              message.textContent = '';
              
              // Kamera tetap aktif untuk pengambilan foto lainnya
              cameraContainer.style.display = 'block';
            }, 300);
          });
          
          document.getElementById('use-photo-btn').addEventListener('click', () => {
            // Hapus preview dengan animasi
            photoPreview.style.opacity = '0';
            
            setTimeout(() => {
              photoPreview.remove();
              
              // Set preview untuk form
              previewPhoto.src = previewUrl;
              previewPhoto.style.display = 'block';
              previewPhoto.dataset.photoBlob = 'camera-photo'; // Tandai sebagai foto dari kamera
              
              // Sembunyikan kamera
              cameraContainer.style.display = 'none';
              
              // Buat file dari blob
              const filename = `camera_photo_${Date.now()}.jpg`;
              const file = new File([blob], filename, { type: 'image/jpeg' });
              
              // Buat FileList tiruan
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              photoInput.files = dataTransfer.files;
              
              // Ubah tampilan tombol kamera
              openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
              
              // Matikan kamera
              this.closeCamera();
              
              // Konfirmasi ke pengguna
              message.textContent = 'Foto berhasil diambil.';
              message.style.color = '#388e3c';
              
              // Hapus pesan setelah beberapa detik
              setTimeout(() => {
                if (message.textContent === 'Foto berhasil diambil.') {
                  message.textContent = '';
                }
              }, 3000);
            }, 300);
          });
        }, 'image/jpeg', 0.85);
      } catch (err) {
        console.error('Error saat mengambil foto:', err);
        message.textContent = 'Terjadi kesalahan saat mengambil foto. ' + (err.message || '');
        message.style.color = '#d32f2f';
      }
    });

    // Photo input change handler
    photoInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewPhoto.src = e.target.result;
          previewPhoto.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    // Form submit handler
    storyForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      message.textContent = '';

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Anda belum login');

        const formData = new FormData();
        formData.append('description', storyForm.description.value);
        
        // Add photo from input or canvas
        if (photoInput.files.length > 0) {
          formData.append('photo', photoInput.files[0]);
          console.log('Menambahkan foto dari file input');
        } else if (previewPhoto.style.display !== 'none' && previewPhoto.dataset.photoBlob === 'camera-photo') {
          // Convert Data URL to Blob
          try {
            console.log('Memproses foto dari kamera...');
            // Konversi data URL ke blob
            const dataUrl = previewPhoto.src;
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: mimeType });
            formData.append('photo', blob, 'camera-photo.jpg');
            console.log('Foto dari kamera berhasil diproses');
          } catch (error) {
            console.error('Error converting camera photo:', error);
            throw new Error('Gagal memproses foto dari kamera: ' + error.message);
          }
        }

        // Add location if selected
        const lat = document.getElementById('story-lat').value;
        const lon = document.getElementById('story-lon').value;
        if (lat && lon) {
          formData.append('lat', lat);
          formData.append('lon', lon);
        }

        message.textContent = 'Mengirim...';
        const response = await Api.addStory(token, formData);

        if (response.error) throw new Error(response.message);

        message.style.color = '#388e3c';
        message.textContent = 'Cerita berhasil dikirim!';
        setTimeout(() => {
          modal.style.display = 'none';
          this.showStories();
        }, 1000);
      } catch (err) {
        message.style.color = '#d32f2f';
        message.textContent = err.message;
      }
    });
  },
  closeCamera() {
    const video = document.getElementById('camera-video');
    const openCameraBtn = document.getElementById('open-camera-btn');
    const cameraContainer = document.getElementById('camera-container');
    const message = document.getElementById('story-form-message');
    
    try {
      console.log('Menutup kamera...');
      
      // Bersihkan event handler
      if (video) {
        video.onloadedmetadata = null;
        video.onerror = null;
        video.onclick = null;
        
        // Hentikan semua track media
        if (video.srcObject) {
          const tracks = video.srcObject.getTracks();
          tracks.forEach(track => {
            console.log('Menghentikan track kamera:', track.kind);
            track.stop();
          });
          video.srcObject = null;
        }
      }
      
      // Reset tampilan tombol
      if (openCameraBtn) {
        openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
      }
      
      // Reset tampilan container
      if (cameraContainer) {
        cameraContainer.style.display = 'none';
      }
      
      // Reset fallback
      const fallback = document.getElementById('camera-fallback');
      if (fallback) {
        fallback.style.display = 'none';
      }
      
      // Reset pesan
      if (message && message.textContent.includes('kamera')) {
        message.textContent = '';
        message.style.color = '';
      }
      
      // Tampilkan kembali tombol ambil foto
      const takePhotoBtn = document.getElementById('take-photo-btn');
      if (takePhotoBtn) {
        takePhotoBtn.style.display = 'block';
      }
      
      console.log('Kamera berhasil ditutup');
    } catch (err) {
      console.error('Gagal menutup kamera:', err);
    }
  },

  initMap(stories) {
    // Tunggu DOM siap
    setTimeout(() => {
      const mapEl = document.getElementById('map');
      if (!mapEl) return;
      
      // Hapus instance map sebelumnya jika ada
      if (window._pojokcerita_map) {
        window._pojokcerita_map.remove();
        window._pojokcerita_map = null;
      }

      // Inisialisasi peta
      const map = L.map('map').setView([-7.797068, 110.370529], 5);
      window._pojokcerita_map = map;

      // Define basemap layers
      const layers = {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }),
        'Satellite': L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=5aXozvBKRLllN8T5b6nq', {
          attribution: '&copy; MapTiler',
          tileSize: 512,
          zoomOffset: -1,
          minZoom: 1
        }),
        'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
        })
      };

      // Add default layer
      layers['OpenStreetMap'].addTo(map);

      // Add layer control
      L.control.layers(layers).addTo(map);

      // Tambahkan marker untuk setiap cerita yang punya lat/lon
      stories.forEach(story => {
        if (story.lat && story.lon) {
          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);
        }
      });
    }, 0);
  },

  initMiniMaps(stories) {
    setTimeout(() => {
      stories.forEach((story, idx) => {
        if (story.lat && story.lon) {
          const el = document.getElementById(`story-map-${idx}`);
          if (el) {
            const miniMap = L.map(el, {
              attributionControl: false,
              zoomControl: true,          // Enable zoom controls
              dragging: true,             // Enable map dragging
              scrollWheelZoom: true,      // Enable zoom with mouse wheel
              doubleClickZoom: true,      // Enable zoom on double click
              boxZoom: true,              // Enable box zoom
              keyboard: true,             // Enable keyboard navigation
              tap: true,                  // Enable tap for mobile
              touchZoom: true,            // Enable touch zoom for mobile
              zoomSnap: 0.5,             // Smooth zoom steps
              minZoom: 2,                 // Minimum zoom level
              maxZoom: 18                 // Maximum zoom level
            }).setView([story.lat, story.lon], 13);

            // Add map layers
            const layers = {
              'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
              'Satellite': L.tileLayer('https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=5aXozvBKRLllN8T5b6nq', {
                tileSize: 512,
                zoomOffset: -1,
                minZoom: 1
              })
            };

            // Add default layer
            layers['Satellite'].addTo(miniMap);

            // Add layer control
            L.control.layers(layers).addTo(miniMap);
            
            // Add marker with popup
            L.marker([story.lat, story.lon])
              .addTo(miniMap)
              .bindPopup(`<strong>${story.name}</strong><br>${story.description}`);

            // Position zoom control to top-right
            miniMap.zoomControl.setPosition('topright');
          }
        }
      });
    }, 0);
  }
};

export default HomePresenter;