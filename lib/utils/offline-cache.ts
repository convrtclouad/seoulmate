// ─── Offline Cache (IndexedDB via localStorage fallback) ──────────────────────
// Wraps IndexedDB for structured offline storage of schedules & expenses.

const DB_NAME = "seoulmate_offline";
const DB_VERSION = 1;

type StoreName = "schedules" | "expenses" | "profiles" | "trips";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const stores: StoreName[] = ["schedules", "expenses", "profiles", "trips"];
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });
}

export async function cacheItems<T extends { id: string }>(
  store: StoreName,
  items: T[]
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    const s  = tx.objectStore(store);
    for (const item of items) s.put(item);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror    = () => rej(tx.error);
    });
  } catch (err) {
    console.warn("[offline-cache] IDB write failed:", err);
  }
}

export async function getCachedItems<T>(store: StoreName): Promise<T[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getCachedItem<T>(
  store: StoreName,
  id: string
): Promise<T | undefined> {
  if (typeof indexedDB === "undefined") return undefined;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror   = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function clearCache(store: StoreName): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDB();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
  } catch {
    /* silent */
  }
}

// ─── Simple localStorage helpers for small scalars ───────────────────────────

export function lsSet(key: string, value: unknown): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`sm_${key}`, JSON.stringify(value));
}

export function lsGet<T>(key: string): T | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(`sm_${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function lsRemove(key: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`sm_${key}`);
}
