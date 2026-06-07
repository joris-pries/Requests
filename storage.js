// File System Access API + IndexedDB helpers
// Loaded as a plain script (no JSX) before app.jsx

(function () {
  const DB_NAME = 'loop-db';
  const STORE   = 'handles';
  const KEY     = 'data-file';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE);
      req.onsuccess  = (e) => resolve(e.target.result);
      req.onerror    = ()  => reject(req.error);
    });
  }

  async function getStoredHandle() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror   = () => resolve(null);
      });
    } catch { return null; }
  }

  async function storeHandle(handle) {
    try {
      const db = await openDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(handle, KEY);
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      });
    } catch {}
  }

  async function clearStoredHandle() {
    try {
      const db = await openDB();
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      });
    } catch {}
  }

  async function verifyPermission(handle) {
    try {
      const opts = { mode: 'readwrite' };
      if (await handle.queryPermission(opts)  === 'granted') return true;
      if (await handle.requestPermission(opts) === 'granted') return true;
      return false;
    } catch { return false; }
  }

  async function readLoopFile(handle) {
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  }

  async function writeLoopFile(handle, data) {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  window.LoopStorage = {
    supported: typeof window.showOpenFilePicker === 'function',
    getStoredHandle,
    storeHandle,
    clearStoredHandle,
    verifyPermission,
    readLoopFile,
    writeLoopFile,
  };
})();
