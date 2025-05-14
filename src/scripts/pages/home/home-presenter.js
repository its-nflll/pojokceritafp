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
    });    // Camera handling with icon toggle
    openCameraBtn?.addEventListener('click', async () => {
      try {
        if (cameraVideo.srcObject) {
          // If camera is active, stop it
          this.closeCamera();
          cameraContainer.style.display = 'none';
          openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
        } else {
          // Check if mediaDevices API is supported
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser Anda tidak mendukung akses kamera. Gunakan browser modern seperti Chrome atau Firefox.');
          }

          // If camera is inactive, start it
          cameraContainer.style.display = 'block';
          previewPhoto.style.display = 'none';
          photoInput.value = '';

          try {
            console.log('Memulai akses kamera...');
            const constraints = { 
              video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } 
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (!stream) {
              throw new Error('Tidak dapat mengakses kamera');
            }

            cameraVideo.srcObject = stream;
            await cameraVideo.play().catch(e => {
              console.error('Error playing video:', e);
              throw new Error('Gagal memutar video kamera');
            });
            
            openCameraBtn.innerHTML = '<i class="fa fa-camera-slash"></i> <span>Tutup Kamera</span>';
          } catch (mediaError) {
            console.error('Media error:', mediaError);
            throw new Error('Gagal mengakses kamera: ' + (mediaError.message || 'Izin ditolak'));
          }
        }
      } catch (err) {
        let extraMsg = '';
        if (window.isSecureContext === false || location.protocol !== 'https:') {
          extraMsg = '\nAkses kamera hanya didukung di HTTPS atau localhost.';
        }
        message.textContent = 'Tidak dapat mengakses kamera: ' + err.message + extraMsg;
        console.error('Camera error:', err);
      }
    });

    // Take photo button
    takePhotoBtn?.addEventListener('click', async () => {
      if (!cameraVideo.srcObject) {
        console.error('Tidak ada akses kamera');
        message.textContent = 'Tidak ada akses kamera';
        return;
      }

      try {
        console.log('Mengambil foto...');
        // Set canvas dimensions to match video
        const videoWidth = cameraVideo.videoWidth || 640;
        const videoHeight = cameraVideo.videoHeight || 480;
        
        cameraCanvas.width = videoWidth;
        cameraCanvas.height = videoHeight;

        // Draw video frame to canvas
        const context = cameraCanvas.getContext('2d');
        context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

        // Convert canvas to data URL and show preview
        const dataUrl = cameraCanvas.toDataURL('image/jpeg');
        previewPhoto.src = dataUrl;
        previewPhoto.style.display = 'block';
        previewPhoto.dataset.photoBlob = 'camera-photo'; // Tanda photo diambil dari kamera
        
        // Stop camera and hide camera UI
        this.closeCamera();
        cameraContainer.style.display = 'none';
      } catch (err) {
        console.error('Error creating image from canvas:', err);
        message.textContent = 'Gagal mengambil foto: ' + err.message;
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
    try {
      console.log('Menutup kamera...');
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => {
          console.log('Menghentikan track kamera');
          track.stop();
        });
        video.srcObject = null;
      }
      if (cameraContainer) {
        cameraContainer.style.display = 'none';
      }
      if (openCameraBtn) {
        openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
      }
      console.log('Kamera berhasil ditutup');
    } catch (err) {
      console.error('Error closing camera:', err);
      if (video) video.srcObject = null;
      if (cameraContainer) cameraContainer.style.display = 'none';
      if (openCameraBtn) {
        openCameraBtn.innerHTML = '<i class="fa fa-camera"></i> <span>Kamera</span>';
      }
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