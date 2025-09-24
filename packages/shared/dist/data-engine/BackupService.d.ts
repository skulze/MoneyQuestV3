/**
 * BackupService - Session-based encrypted cloud backup
 *
 * Handles encrypted backup to S3 for cross-device sync
 * Triggers on app close/inactivity, not real-time
 */
export interface BackupData {
    version: string;
    timestamp: Date;
    userId: string;
    data: {
        accounts: any[];
        transactions: any[];
        categories: any[];
        budgets: any[];
        investments?: any[];
    };
    checksum: string;
}
export declare class BackupService {
    private userId;
    private encryptionKey;
    constructor(userId: string, encryptionKey: string);
    /**
     * Backup user data to encrypted cloud storage
     */
    backup(data: any): Promise<void>;
    /**
     * Restore user data from cloud backup
     */
    restore(): Promise<any | null>;
    /**
     * List available backups for user
     */
    listBackups(): Promise<BackupData[]>;
    /**
     * Delete backup
     */
    deleteBackup(timestamp: Date): Promise<void>;
    /**
     * Check if backup exists
     */
    hasBackup(): Promise<boolean>;
    private encrypt;
    private decrypt;
    private generateChecksum;
    private uploadToStorage;
    private downloadFromStorage;
    /**
     * Merge local changes with cloud backup
     * Used for multi-device sync conflict resolution
     */
    mergeWithBackup(localData: any, cloudData: any): Promise<any>;
}
//# sourceMappingURL=BackupService.d.ts.map