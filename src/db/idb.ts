// Minimal IndexedDB key-value layer (offline-first). Falls back to memory when IndexedDB is unavailable.
const DB_NAME = 'dymo';
const STORES = ['kv', 'blobs'] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memory = new Map<string, unknown>();

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => STORES.forEach((s) => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return memory.get(`${store}:${key}`) as T | undefined;
  return new Promise((resolve) => {
    const req = db.transaction(store).objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => resolve(undefined);
  });
}

export async function idbSet(store: StoreName, key: string, value: unknown): Promise<void> {
  const db = await open();
  if (!db) { memory.set(`${store}:${key}`, value); return; }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDel(store: StoreName, key: string): Promise<void> {
  const db = await open();
  if (!db) { memory.delete(`${store}:${key}`); return; }
  return new Promise((resolve) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function idbClear(): Promise<void> {
  const db = await open();
  memory.clear();
  if (!db) return;
  await Promise.all(STORES.map((s) => new Promise<void>((resolve) => {
    const tx = db.transaction(s, 'readwrite');
    tx.objectStore(s).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  })));
}
