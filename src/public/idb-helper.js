// Helper file for IndexedDB functions in service worker

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

async function deleteStory(id) {
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

async function getAllStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

self.openDB = openDB;
self.deleteStory = deleteStory;
self.getAllStories = getAllStories; 