/**
 * IndexedDB wrapper service for player data storage
 * Provides CRUD operations with better storage capacity and performance than LocalStorage
 */

interface IDBPlayerData {
  id: string;
  data: string; // JSON stringified player data
  lastModified: number;
}

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'KnightBaseDB';
  private readonly dbVersion = 1;
  private readonly storeName = 'playerData';

  private constructor() {}

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  /**
   * Initialize the IndexedDB database
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('lastModified', 'lastModified', { unique: false });
        }
      };
    });
  }

  /**
   * Save player data to IndexedDB
   */
  public async savePlayerData(data: any): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      const playerData: IDBPlayerData = {
        id: 'playerData', // Single record for player data
        data: JSON.stringify(data),
        lastModified: Date.now()
      };

      const request = store.put(playerData);

      request.onerror = () => {
        reject(new Error(`Failed to save player data: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Load player data from IndexedDB
   */
  public async loadPlayerData(): Promise<any | null> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('playerData');

      request.onerror = () => {
        reject(new Error(`Failed to load player data: ${request.error}`));
      };

      request.onsuccess = () => {
        if (request.result) {
          try {
            const parsed = JSON.parse(request.result.data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse player data: ${error}`));
          }
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * Check if player data exists in IndexedDB
   */
  public async hasPlayerData(): Promise<boolean> {
    try {
      const data = await this.loadPlayerData();
      return data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Delete all player data from IndexedDB
   */
  public async clearPlayerData(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete('playerData');

      request.onerror = () => {
        reject(new Error(`Failed to clear player data: ${request.error}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}