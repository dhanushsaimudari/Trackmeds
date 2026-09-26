/**
 * Progressive Web App (PWA) Offline-First Synchronization Service
 * Uses IndexedDB to buffer mutations (stock receipts, emergency SOS, transfer approvals)
 * when rural PHC clinics lose internet connectivity, and synchronizes automatically on reconnection.
 */
import { api } from './api';

const DB_NAME = 'trackmeds_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'mutation_queue';

export interface QueuedMutation {
  id: string;
  type: 'REDISTRIBUTION_APPROVAL' | 'EMERGENCY_SOS' | 'STOCK_INGESTION' | 'COLD_CHAIN_LOG';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this browser environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const pwaSyncService = {
  /**
   * Enqueue mutation into local persistent storage
   */
  async enqueueMutation(type: QueuedMutation['type'], payload: any): Promise<QueuedMutation> {
    const db = await openDatabase();
    const mutation: QueuedMutation = {
      id: `MUT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(mutation);

      req.onsuccess = () => {
        // Request background sync if available
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then((reg: any) => {
            return reg.sync.register('trackmeds-offline-sync');
          }).catch(() => {});
        }
        resolve(mutation);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Get all pending offline mutations
   */
  async getPendingMutations(): Promise<QueuedMutation[]> {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const items: QueuedMutation[] = req.result || [];
          resolve(items.filter(i => i.status === 'PENDING'));
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  /**
   * Process and synchronize pending mutations with the live backend
   */
  async flushQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    if (!navigator.onLine) {
      return { syncedCount: 0, failedCount: 0 };
    }

    const pending = await this.getPendingMutations();
    if (pending.length === 0) return { syncedCount: 0, failedCount: 0 };

    const db = await openDatabase();
    let synced = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        if (item.type === 'REDISTRIBUTION_APPROVAL') {
          await api.approveRedistribution(item.payload.id);
        } else if (item.type === 'EMERGENCY_SOS') {
          await api.createEmergencyRequest(item.payload);
        } else if (item.type === 'STOCK_INGESTION') {
          await api.commitIngestedStock(item.payload);
        }

        // Delete or mark synced
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(item.id);
        synced++;
      } catch (err) {
        console.warn(`Failed to sync queued mutation ${item.id}:`, err);
        const tx = db.transaction(STORE_NAME, 'readwrite');
        item.retryCount += 1;
        item.status = item.retryCount > 5 ? 'FAILED' : 'PENDING';
        tx.objectStore(STORE_NAME).put(item);
        failed++;
      }
    }

    return { syncedCount: synced, failedCount: failed };
  },

  /**
   * Register service worker and background listeners
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('PWA Service Worker registration skipped:', err);
        });
      });

      // Listen for sync messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TRIGGER_BACKGROUND_SYNC') {
          this.flushQueue();
        }
      });
    }

    // Auto-flush when browser goes online
    window.addEventListener('online', () => {
      console.log('Network back online. Synchronizing offline PHC mutations...');
      this.flushQueue();
    });
  }
};
