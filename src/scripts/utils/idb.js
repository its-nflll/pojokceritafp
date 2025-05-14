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

export async function getAllStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.index('createdAt').getAll();
    
    request.onsuccess = () => {
      // Sort by creation date, newest first
      const stories = request.result.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      resolve(stories);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStory(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Delete the story and its associated image if exists
    store.get(id).onsuccess = (event) => {
      const story = event.target.result;
      if (story && story.photoUrl) {
        const imageTx = db.transaction('image-cache', 'readwrite');
        imageTx.objectStore('image-cache').delete(story.photoUrl);
      }
    };
    
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveImage(url, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('image-cache', 'readwrite');
    tx.objectStore('image-cache').put({ url, blob, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImage(url) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('image-cache', 'readonly');
    const request = tx.objectStore('image-cache').get(url);
    request.onsuccess = () => resolve(request.result?.blob);
    request.onerror = () => reject(request.error);
  });
}
