// Utility IndexedDB sederhana untuk PojokCerita
// Menggunakan IndexedDB untuk menyimpan cerita favorit/offline

const DB_NAME = 'pojokcerita-db';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // Create indexes for better searching
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
      // Create store for image cache if needed
      if (!db.objectStoreNames.contains('image-cache')) {
        db.createObjectStore('image-cache', { keyPath: 'url' });
      }
    };
  });
}

export async function saveStory(story) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // If story already exists, update it
    store.get(story.id).onsuccess = (event) => {
      if (event.target.result) {
        store.put({...event.target.result, ...story, updatedAt: new Date().toISOString()});
      } else {
        store.add({...story, savedAt: new Date().toISOString()});
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllStories(page = 1, limit = 5) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    let request;
    // Fallback jika index tidak ada
    try {
      if (store.indexNames.contains('createdAt')) {
        request = store.index('createdAt').getAll();
      } else {
        request = store.getAll();
      }
    } catch (e) {
      // Jika error, fallback ke getAll
      request = store.getAll();
    }
    request.onsuccess = () => {
      // Sort by creation date, newest first jika memungkinkan
      let allStories = request.result;
      if (allStories.length && allStories[0].createdAt) {
        allStories = allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      const start = (page - 1) * limit;
      const end = start + limit;
      const stories = allStories.slice(start, end);
      const totalStories = allStories.length;
      const totalPages = Math.ceil(totalStories / limit);
      resolve({
        stories,
        totalStories,
        totalPages,
        currentPage: page,
        hasMore: page < totalPages
      });
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getTotalStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStory(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      // Validasi ID
      if (!id) {
        reject(new Error('Story ID is required'));
        return;
      }
      
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.onerror = (event) => {
        console.error('Transaction error:', event);
        reject(new Error('Transaction failed'));
      };
      
      const store = tx.objectStore(STORE_NAME);
      
      // Periksa apakah cerita ada sebelum menghapus
      const getRequest = store.get(id);
      
      getRequest.onsuccess = (event) => {
        const story = event.target.result;
        
        if (!story) {
          // Jika cerita tidak ditemukan, tetap selesaikan promise
          console.warn(`Story with ID ${id} not found, skipping delete operation`);
          resolve();
          return;
        }
        
        // Hapus gambar terkait jika ada
        if (story.photoUrl) {
          try {
            const imageTx = db.transaction('image-cache', 'readwrite');
            imageTx.objectStore('image-cache').delete(story.photoUrl);
            
            // Hapus juga dari localStorage jika ada
            try {
              localStorage.removeItem(`img_${story.photoUrl}`);
            } catch (localErr) {
              console.warn('Failed to remove image from localStorage:', localErr);
            }
          } catch (e) {
            console.error('Error deleting associated image:', e);
            // Lanjutkan meskipun gagal menghapus gambar
          }
        }
        
        // Hapus cerita
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => {
          console.log(`Successfully deleted story with ID: ${id}`);
          resolve();
        };
        
        deleteRequest.onerror = (event) => {
          console.error(`Error deleting story with ID ${id}:`, event.target.error);
          reject(event.target.error);
        };
      };
      
      getRequest.onerror = (event) => {
        console.error(`Error retrieving story with ID ${id}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('Unexpected error in deleteStory:', error);
      reject(error);
    }
  });
}

export async function saveImage(url, blob) {
  localStorage.setItem(`img_${url}`, await blobToBase64(blob));
}

export async function getImage(url) {
  const base64 = localStorage.getItem(`img_${url}`);
  return base64 ? base64ToBlob(base64) : null;
}

// Helper functions
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}
