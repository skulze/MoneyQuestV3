import {
  LocalDataEngine,
  SubscriptionManager,
  BackupService,
  createFreeSubscription,
  SubscriptionStatus
} from '@moneyquest/shared';
import { IndexedDBWrapper } from './IndexedDBWrapper';

/**
 * Factory for creating LocalDataEngine instances for the web app
 */
export class DataEngineFactory {
  private static instance: LocalDataEngine | null = null;
  private static dbWrapper: IndexedDBWrapper | null = null;

  /**
   * Get or create a singleton LocalDataEngine instance
   */
  static async getInstance(
    userId?: string,
    subscriptionStatus?: SubscriptionStatus
  ): Promise<LocalDataEngine> {
    if (!this.instance) {
      this.instance = await this.createEngine(userId, subscriptionStatus);
    }
    return this.instance;
  }

  /**
   * Create a new LocalDataEngine instance
   */
  static async createEngine(
    userId?: string,
    subscriptionStatus?: SubscriptionStatus
  ): Promise<LocalDataEngine> {
    // Initialize IndexedDB wrapper
    if (!this.dbWrapper) {
      this.dbWrapper = new IndexedDBWrapper();

      // Initialize with default data if userId provided
      if (userId) {
        await this.dbWrapper.initialize(userId);
      }
    }

    // Create subscription manager
    const subscription = new SubscriptionManager(
      subscriptionStatus || createFreeSubscription()
    );

    // Create backup service (minimal implementation for now)
    const backupService = new WebBackupService(userId || 'anonymous', 'temp-key');

    // Create and return LocalDataEngine
    return new LocalDataEngine(
      this.dbWrapper,
      subscription,
      backupService
    );
  }

  /**
   * Reset the singleton instance (useful for testing or user logout)
   */
  static reset(): void {
    this.instance = null;
    this.dbWrapper = null;
  }

  /**
   * Get the database wrapper directly (for advanced operations)
   */
  static getDBWrapper(): IndexedDBWrapper | null {
    return this.dbWrapper;
  }
}

/**
 * Web implementation of BackupService
 * Uses localStorage for simple backup/restore for now
 * In production, this would use encrypted cloud storage
 */
class WebBackupService extends BackupService {
  private static readonly BACKUP_KEY = 'moneyquest_backup';

  constructor(userId: string, encryptionKey: string) {
    super(userId, encryptionKey);
  }

  async backup(data: any): Promise<void> {
    try {
      // Encrypt data in production
      const backupData = {
        data,
        timestamp: new Date().toISOString(),
        version: 1
      };

      // For now, store in localStorage (limited to ~5MB)
      // In production, this would be encrypted and stored in S3
      localStorage.setItem(
        WebBackupService.BACKUP_KEY,
        JSON.stringify(backupData)
      );

      console.log('Data backed up locally');
    } catch (error) {
      console.error('Failed to backup data:', error);
      throw new Error(`Backup failed: ${error}`);
    }
  }

  async restore(): Promise<any> {
    try {
      const backupString = localStorage.getItem(WebBackupService.BACKUP_KEY);

      if (!backupString) {
        console.log('No backup data found');
        return null;
      }

      const backupData = JSON.parse(backupString);

      // Validate backup data structure
      if (!backupData.data || !backupData.timestamp) {
        throw new Error('Invalid backup data format');
      }

      console.log(`Restored backup from ${backupData.timestamp}`);
      return backupData.data;
    } catch (error) {
      console.error('Failed to restore data:', error);
      throw new Error(`Restore failed: ${error}`);
    }
  }

  async hasBackup(): Promise<boolean> {
    return localStorage.getItem(WebBackupService.BACKUP_KEY) !== null;
  }

  async clearBackup(): Promise<void> {
    localStorage.removeItem(WebBackupService.BACKUP_KEY);
    console.log('Backup data cleared');
  }
}

/**
 * Hook for React components to get the data engine
 */
export async function useDataEngine(
  userId?: string,
  subscriptionStatus?: SubscriptionStatus
): Promise<LocalDataEngine> {
  return DataEngineFactory.getInstance(userId, subscriptionStatus);
}

/**
 * Initialize the data engine for the app
 */
export async function initializeDataEngine(
  userId: string,
  subscriptionStatus?: SubscriptionStatus
): Promise<LocalDataEngine> {
  console.log(`Initializing data engine for user: ${userId}`);

  const engine = await DataEngineFactory.createEngine(userId, subscriptionStatus);

  // Check if we can restore from backup
  const backupService = new WebBackupService(userId, 'temp-key');
  const hasBackup = await backupService.hasBackup();

  if (hasBackup) {
    console.log('Backup found, attempting to restore...');
    try {
      await engine.restoreFromBackup();
      console.log('Successfully restored from backup');
    } catch (error) {
      console.warn('Failed to restore from backup, continuing with fresh data:', error);
    }
  }

  return engine;
}