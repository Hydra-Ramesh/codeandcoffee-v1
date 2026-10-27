/**
 * Resilient Browser Storage & IndexedDB Engine for Code & Coffee
 * Handles offline persistence, quota limit monitoring, and quota eviction
 */

const DB_NAME = 'code_and_coffee_db';
const DB_VERSION = 1;
const STORES = ['offline_bookmarks', 'practice_drafts', 'telemetry_cache'];

class StorageEngine {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB not available in current runtime environment.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          STORES.forEach((storeName) => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
            }
          });
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return this.dbPromise;
  }

  /**
   * Monitor device storage quota and percentage used
   */
  public async getStorageQuota(): Promise<{
    quotaBytes: number;
    usageBytes: number;
    usagePercentage: number;
  }> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const { quota = 0, usage = 0 } = await navigator.storage.estimate();
        const usagePercentage = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(2)) : 0;
        return { quotaBytes: quota, usageBytes: usage, usagePercentage };
      } catch (err) {
        console.warn('[Storage] Quota estimation check bypassed:', err);
      }
    }
    return { quotaBytes: 0, usageBytes: 0, usagePercentage: 0 };
  }

  /**
   * Safely store an item in IndexedDB with quota-exhaustion fallback
   */
  public async setItem<T extends { id: string }>(storeName: string, item: T): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => {
          console.warn(`[Storage] Failed writing to \${storeName}:`, tx.error);
          resolve(false);
        };
      });
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError') {
        console.warn('[Storage] Browser storage quota exceeded! Triggering eviction.');
        await this.clearStore(storeName);
      }
      return false;
    }
  }

  /**
   * Retrieve an item from IndexedDB
   */
  public async getItem<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieve all items in an object store
   */
  public async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Remove an item from IndexedDB
   */
  public async removeItem(storeName: string, id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(id);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Evict/clear an entire store
   */
  public async clearStore(storeName: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}

export const browserStorage = new StorageEngine();
