/**
 * Data migration utility for transitioning from LocalStorage to IndexedDB
 */

import { IndexedDBService } from './IndexedDBService';

export class DataMigration {
  private static readonly LOCALSTORAGE_KEY = 'playerData';
  private static readonly MIGRATION_FLAG_KEY = 'kb_migrated_to_indexeddb';

  /**
   * Check if migration has already been completed
   */
  public static isMigrationCompleted(): boolean {
    return localStorage.getItem(this.MIGRATION_FLAG_KEY) === 'true';
  }

  /**
   * Migrate player data from LocalStorage to IndexedDB
   * Returns true if migration was performed, false if no migration was needed
   */
  public static async migrateFromLocalStorage(): Promise<boolean> {
    // If already migrated, skip
    if (this.isMigrationCompleted()) {
      return false;
    }

    const indexedDBService = IndexedDBService.getInstance();
    
    try {
      // Check if there's existing data in LocalStorage
      const localStorageData = localStorage.getItem(this.LOCALSTORAGE_KEY);
      
      if (localStorageData) {
        // Parse the base64 encoded data from LocalStorage
        const json = atob(localStorageData);
        const parsedData = JSON.parse(json);
        
        // Check if IndexedDB already has data (to avoid overwriting)
        const hasExistingData = await indexedDBService.hasPlayerData();
        
        if (!hasExistingData) {
          // Migrate data to IndexedDB
          await indexedDBService.savePlayerData(parsedData);
          console.log('Successfully migrated player data from LocalStorage to IndexedDB');
        } else {
          console.log('IndexedDB already has player data, skipping migration');
        }
        
        // Clean up LocalStorage data after successful migration
        localStorage.removeItem(this.LOCALSTORAGE_KEY);
      } else {
        console.log('No LocalStorage data found to migrate');
      }
      
      // Mark migration as completed
      localStorage.setItem(this.MIGRATION_FLAG_KEY, 'true');
      return true;
      
    } catch (error) {
      console.error('Failed to migrate data from LocalStorage to IndexedDB:', error);
      // Don't mark as migrated if there was an error
      return false;
    }
  }

  /**
   * Reset migration flag (useful for testing or manual reset)
   */
  public static resetMigrationFlag(): void {
    localStorage.removeItem(this.MIGRATION_FLAG_KEY);
  }

  /**
   * Get LocalStorage data without removing it (for inspection purposes)
   */
  public static getLocalStorageData(): any | null {
    try {
      const localStorageData = localStorage.getItem(this.LOCALSTORAGE_KEY);
      if (localStorageData) {
        const json = atob(localStorageData);
        return JSON.parse(json);
      }
      return null;
    } catch (error) {
      console.error('Failed to read LocalStorage data:', error);
      return null;
    }
  }
}