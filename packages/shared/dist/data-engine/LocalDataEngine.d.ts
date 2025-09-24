import { Transaction, TransactionWithSplits, CreateTransactionRequest, UpdateTransactionRequest, CreateTransactionSplitRequest } from '../types/transactions';
import { CategoryTotal, BudgetStatus } from '../types/analytics';
import { SubscriptionManager } from './SubscriptionManager';
import { BackupService } from './BackupService';
export interface LocalDB {
    insert<T>(table: string, data: T): Promise<T>;
    query<T>(table: string, filter?: any): Promise<T[]>;
    update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
    delete(table: string, id: string): Promise<void>;
    getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<CategoryTotal[]>;
    getBudgetProgress(userId: string): Promise<BudgetStatus[]>;
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
export declare class UpgradeRequiredError extends Error {
    constructor(message: string);
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
export declare class LocalDataEngine {
    private localDB;
    private subscription;
    private backupService;
    private hasUnsyncedChanges;
    constructor(localDB?: LocalDB, subscription?: SubscriptionManager, backupService?: BackupService);
    initialize(localDB: LocalDB, subscription: SubscriptionManager, backupService: BackupService): void;
    private isInitialized;
    addTransaction(transaction: CreateTransactionRequest): Promise<Transaction>;
    getTransactions(filter?: Filter): Promise<TransactionWithSplits[]>;
    updateTransaction(id: string, update: UpdateTransactionRequest): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
    splitTransaction(request: CreateTransactionSplitRequest): Promise<TransactionWithSplits>;
    private getTransactionWithSplits;
    createBudget(budget: any): Promise<any>;
    getBudgets(userId: string): Promise<any[]>;
    updateBudget(id: string, update: any): Promise<any>;
    createAccount(account: any): Promise<any>;
    getAccounts(userId: string): Promise<any[]>;
    updateAccount(id: string, update: any): Promise<any>;
    createCategory(category: any): Promise<any>;
    getCategories(userId: string): Promise<any[]>;
    updateCategory(id: string, update: any): Promise<any>;
    createPortfolio(userId: string, portfolioData: any): Promise<any>;
    getPortfolios(userId: string): Promise<any[]>;
    updatePortfolio(id: string, update: any): Promise<any>;
    deletePortfolio(id: string): Promise<void>;
    createInvestment(portfolioId: string, investmentData: any): Promise<any>;
    getInvestments(portfolioId?: string): Promise<any[]>;
    updateInvestment(id: string, update: any): Promise<any>;
    deleteInvestment(id: string): Promise<void>;
    getPortfolioWithInvestments(portfolioId: string): Promise<any>;
    getAllPortfoliosWithInvestments(userId: string): Promise<any[]>;
    calculatePortfolioPerformance(portfolioId: string): Promise<any>;
    calculateTotalPortfolioValue(userId: string): Promise<any>;
    getAssetAllocation(userId: string): Promise<any[]>;
    private categorizeAssetType;
    calculateCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<CategoryTotal[]>;
    getBudgetProgress(userId: string): Promise<BudgetStatus[]>;
    generateNetWorthSnapshot(userId: string): Promise<any>;
    generatePDFReport(userId: string, type: 'monthly' | 'yearly'): Promise<Blob>;
    generateExcelReport(userId: string, type: 'monthly' | 'yearly'): Promise<Blob>;
    endSession(): Promise<void>;
    restoreFromBackup(): Promise<void>;
    processReceiptOCR(imageFile: File | any): Promise<Transaction[]>;
    connectPlaidAccount(institution: any): Promise<any>;
    addFamilyMember(email: string): Promise<any>;
    private generateId;
    getSubscriptionTier(): string;
    hasUnsavedChanges(): boolean;
}
//# sourceMappingURL=LocalDataEngine.d.ts.map