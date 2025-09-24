import {
  Transaction,
  TransactionWithSplits,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  CreateTransactionSplitRequest
} from '../types/transactions';
import { CategoryTotal, BudgetStatus } from '../types/analytics';
import { SubscriptionManager } from './SubscriptionManager';
import { BackupService } from './BackupService';
import { OCRService } from './OCRService';
import { PlaidService } from './PlaidService';

// Database interface - will be implemented differently for web (IndexedDB) and mobile (SQLite)
export interface LocalDB {
  // Core CRUD operations
  insert<T>(table: string, data: T): Promise<T>;
  query<T>(table: string, filter?: any): Promise<T[]>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;

  // Analytics queries
  getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<CategoryTotal[]>;
  getBudgetProgress(userId: string): Promise<BudgetStatus[]>;

  // Export/backup
  exportAll(): Promise<any>;
  importData(data: any): Promise<void>;
}


export interface Filter {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export class UpgradeRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpgradeRequiredError';
  }
}

/**
 * LocalDataEngine - Core local-first data management system
 *
 * Handles 99% of operations locally with instant performance:
 * - All CRUD operations (transactions, budgets, accounts)
 * - Analytics and charts generation
 * - PDF/Excel report generation
 * - Feature gating based on subscription tier
 *
 * 1% cloud services:
 * - Session-based encrypted backups
 * - Multi-device sync
 * - OCR processing (Plus+)
 * - Bank connections (Premium)
 */
export class LocalDataEngine {
  private localDB: LocalDB;
  private subscription: SubscriptionManager;
  private backupService: BackupService;
  private hasUnsyncedChanges: boolean = false;

  constructor(
    localDB: LocalDB,
    subscription: SubscriptionManager,
    backupService: BackupService
  ) {
    this.localDB = localDB;
    this.subscription = subscription;
    this.backupService = backupService;
  }

  // ==========================================
  // Core Transaction Operations (Instant, Local)
  // ==========================================

  async addTransaction(transaction: CreateTransactionRequest): Promise<Transaction> {
    const newTransaction = await this.localDB.insert('transactions', {
      ...transaction,
      id: this.generateId(),
      isParent: false,
      date: new Date(transaction.date),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return newTransaction as Transaction;
  }

  async getTransactions(filter?: Filter): Promise<TransactionWithSplits[]> {
    return this.localDB.query('transactions', filter);
  }

  async updateTransaction(
    id: string,
    update: UpdateTransactionRequest
  ): Promise<Transaction> {
    // Get current transaction to preserve required fields
    const current = await this.localDB.query<Transaction>('transactions', { id });
    if (!current.length) {
      throw new Error('Transaction not found');
    }

    const updated = await this.localDB.update('transactions', id, {
      ...current[0],
      ...update,
      date: update.date ? new Date(update.date) : current[0].date,
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return updated as Transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.localDB.delete('transactions', id);
    this.hasUnsyncedChanges = true;
  }

  // ==========================================
  // Transaction Splitting (Core Feature)
  // ==========================================

  async splitTransaction(request: CreateTransactionSplitRequest): Promise<TransactionWithSplits> {
    const { transactionId, splits } = request;

    // Validate split amounts sum to original transaction amount
    const transactions = await this.localDB.query<Transaction>('transactions', { id: transactionId });
    if (!transactions.length) {
      throw new Error('Transaction not found');
    }

    const originalAmount = transactions[0].originalAmount;
    const splitSum = splits.reduce((sum, split) => sum + split.amount, 0);

    if (Math.abs(splitSum - originalAmount) > 0.01) {
      throw new Error('Split amounts must sum to original transaction amount');
    }

    // Create split records
    for (const split of splits) {
      await this.localDB.insert('transaction_splits', {
        id: this.generateId(),
        transactionId,
        ...split,
        percentage: (split.amount / originalAmount) * 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Mark original as parent transaction
    await this.localDB.update('transactions', transactionId, {
      isParent: true,
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;

    // Return transaction with splits
    return this.getTransactionWithSplits(transactionId);
  }

  private async getTransactionWithSplits(id: string): Promise<TransactionWithSplits> {
    const transactions = await this.localDB.query<Transaction>('transactions', { id });
    const splits = await this.localDB.query<any>('transaction_splits', { transactionId: id });

    return {
      ...transactions[0],
      splits,
    };
  }

  // ==========================================
  // Budget Management
  // ==========================================

  async createBudget(budget: any): Promise<any> {
    const newBudget = await this.localDB.insert('budgets', {
      ...budget,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return newBudget;
  }

  async getBudgets(userId: string): Promise<any[]> {
    return this.localDB.query('budgets', { userId });
  }

  async updateBudget(id: string, update: any): Promise<any> {
    const updated = await this.localDB.update('budgets', id, {
      ...update,
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return updated;
  }

  // ==========================================
  // Account Management
  // ==========================================

  async createAccount(account: any): Promise<any> {
    const newAccount = await this.localDB.insert('accounts', {
      ...account,
      id: this.generateId(),
      balance: account.balance || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return newAccount;
  }

  async getAccounts(userId: string): Promise<any[]> {
    return this.localDB.query('accounts', { userId, isActive: true });
  }

  async updateAccount(id: string, update: any): Promise<any> {
    const updated = await this.localDB.update('accounts', id, {
      ...update,
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return updated;
  }

  // ==========================================
  // Category Management
  // ==========================================

  async createCategory(category: any): Promise<any> {
    const newCategory = await this.localDB.insert('categories', {
      ...category,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return newCategory;
  }

  async getCategories(userId: string): Promise<any[]> {
    return this.localDB.query('categories', { userId });
  }

  async updateCategory(id: string, update: any): Promise<any> {
    const updated = await this.localDB.update('categories', id, {
      ...update,
      updatedAt: new Date(),
    });

    this.hasUnsyncedChanges = true;
    return updated;
  }

  // ==========================================
  // Analytics (100% Local)
  // ==========================================

  async calculateCategorySpending(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CategoryTotal[]> {
    return this.localDB.getCategorySpending(userId, startDate, endDate);
  }

  async getBudgetProgress(userId: string): Promise<BudgetStatus[]> {
    return this.localDB.getBudgetProgress(userId);
  }

  async generateNetWorthSnapshot(userId: string): Promise<any> {
    const accounts = await this.localDB.query<any>('accounts', { userId });
    const investments = await this.localDB.query<any>('investments', { userId });

    const totalAssets = accounts
      .filter((acc: any) => acc.type !== 'credit_card')
      .reduce((sum: number, acc: any) => sum + Number(acc.balance), 0);

    const totalLiabilities = accounts
      .filter((acc: any) => acc.type === 'credit_card')
      .reduce((sum: number, acc: any) => sum + Math.abs(Number(acc.balance)), 0);

    const investmentValue = investments
      .reduce((sum: number, inv: any) => sum + (Number(inv.quantity) * Number(inv.currentPrice)), 0);

    const netWorth = totalAssets + investmentValue - totalLiabilities;

    const snapshot = {
      id: this.generateId(),
      userId,
      totalAssets: totalAssets + investmentValue,
      totalLiabilities,
      netWorth,
      date: new Date(),
      createdAt: new Date(),
    };

    await this.localDB.insert('net_worth_snapshots', snapshot);
    this.hasUnsyncedChanges = true;

    return snapshot;
  }

  // ==========================================
  // Report Generation (Client-Side)
  // ==========================================

  async generatePDFReport(userId: string, type: 'monthly' | 'yearly'): Promise<Blob> {
    // This would use jsPDF to generate reports client-side
    // Implementation depends on platform (web vs mobile)
    throw new Error('PDF generation not implemented - platform specific');
  }

  async generateExcelReport(userId: string, type: 'monthly' | 'yearly'): Promise<Blob> {
    // This would use SheetJS to generate Excel files client-side
    // Implementation depends on platform (web vs mobile)
    throw new Error('Excel generation not implemented - platform specific');
  }

  // ==========================================
  // Session-based Backup
  // ==========================================

  async endSession(): Promise<void> {
    if (this.hasUnsyncedChanges) {
      try {
        const data = await this.localDB.exportAll();
        await this.backupService.backup(data);
        this.hasUnsyncedChanges = false;
      } catch (error) {
        console.error('Failed to backup data:', error);
        // Don't throw - backup failures shouldn't break user flow
      }
    }
  }

  async restoreFromBackup(): Promise<void> {
    try {
      const data = await this.backupService.restore();
      if (data) {
        await this.localDB.importData(data);
        this.hasUnsyncedChanges = false;
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw new Error('Failed to restore data from backup');
    }
  }

  // ==========================================
  // Feature Gates (Plus/Premium Features)
  // ==========================================

  async processReceiptOCR(imageFile: File | any): Promise<Transaction[]> {
    if (!this.subscription.canUseOCR()) {
      throw new UpgradeRequiredError('OCR requires Plus ($2.99/month)');
    }

    return await OCRService.processReceipt(imageFile);
  }

  async connectPlaidAccount(institution: any): Promise<any> {
    if (!this.subscription.canConnectBanks()) {
      throw new UpgradeRequiredError('Bank connections require Premium ($9.99/month)');
    }

    return await PlaidService.connect(institution);
  }

  async addFamilyMember(email: string): Promise<any> {
    if (!this.subscription.canUseMultiUser()) {
      throw new UpgradeRequiredError('Family sharing requires Plus ($2.99/month)');
    }

    // Implementation for adding family member
    const relationship = {
      id: this.generateId(),
      relatedUserEmail: email,
      relationshipType: 'family',
      status: 'pending',
      createdAt: new Date(),
    };

    await this.localDB.insert('user_relationships', relationship);
    this.hasUnsyncedChanges = true;

    return relationship;
  }

  // ==========================================
  // Utilities
  // ==========================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getSubscriptionTier(): string {
    return this.subscription.getTier();
  }

  hasUnsavedChanges(): boolean {
    return this.hasUnsyncedChanges;
  }
}