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
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Delete the story and its associated image if exists
    store.get(id).onsuccess = (event) => {
      const story = event.target.result;
      if (story && story.photoUrl) {
        try {
          const imageTx = db.transaction('image-cache', 'readwrite');
          imageTx.objectStore('image-cache').delete(story.photoUrl);
        } catch (e) {
          console.error('Error deleting associated image:', e);
        }
      }
    };
    
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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