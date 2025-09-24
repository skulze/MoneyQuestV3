"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDataEngine = exports.UpgradeRequiredError = void 0;
const OCRService_1 = require("./OCRService");
const PlaidService_1 = require("./PlaidService");
class UpgradeRequiredError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UpgradeRequiredError';
    }
}
exports.UpgradeRequiredError = UpgradeRequiredError;
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
class LocalDataEngine {
    constructor(localDB, subscription, backupService) {
        this.hasUnsyncedChanges = false;
        this.localDB = localDB;
        this.subscription = subscription;
        this.backupService = backupService;
    }
    // ==========================================
    // Core Transaction Operations (Instant, Local)
    // ==========================================
    async addTransaction(transaction) {
        const newTransaction = await this.localDB.insert('transactions', {
            ...transaction,
            id: this.generateId(),
            isParent: false,
            date: new Date(transaction.date),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.hasUnsyncedChanges = true;
        return newTransaction;
    }
    async getTransactions(filter) {
        return this.localDB.query('transactions', filter);
    }
    async updateTransaction(id, update) {
        // Get current transaction to preserve required fields
        const current = await this.localDB.query('transactions', { id });
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
        return updated;
    }
    async deleteTransaction(id) {
        await this.localDB.delete('transactions', id);
        this.hasUnsyncedChanges = true;
    }
    // ==========================================
    // Transaction Splitting (Core Feature)
    // ==========================================
    async splitTransaction(request) {
        const { transactionId, splits } = request;
        // Validate split amounts sum to original transaction amount
        const transactions = await this.localDB.query('transactions', { id: transactionId });
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
    async getTransactionWithSplits(id) {
        const transactions = await this.localDB.query('transactions', { id });
        const splits = await this.localDB.query('transaction_splits', { transactionId: id });
        return {
            ...transactions[0],
            splits,
        };
    }
    // ==========================================
    // Budget Management
    // ==========================================
    async createBudget(budget) {
        const newBudget = await this.localDB.insert('budgets', {
            ...budget,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.hasUnsyncedChanges = true;
        return newBudget;
    }
    async getBudgets(userId) {
        return this.localDB.query('budgets', { userId });
    }
    async updateBudget(id, update) {
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
    async createAccount(account) {
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
    async getAccounts(userId) {
        return this.localDB.query('accounts', { userId, isActive: true });
    }
    async updateAccount(id, update) {
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
    async createCategory(category) {
        const newCategory = await this.localDB.insert('categories', {
            ...category,
            id: this.generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        this.hasUnsyncedChanges = true;
        return newCategory;
    }
    async getCategories(userId) {
        return this.localDB.query('categories', { userId });
    }
    async updateCategory(id, update) {
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
    async calculateCategorySpending(userId, startDate, endDate) {
        return this.localDB.getCategorySpending(userId, startDate, endDate);
    }
    async getBudgetProgress(userId) {
        return this.localDB.getBudgetProgress(userId);
    }
    async generateNetWorthSnapshot(userId) {
        const accounts = await this.localDB.query('accounts', { userId });
        const investments = await this.localDB.query('investments', { userId });
        const totalAssets = accounts
            .filter((acc) => acc.type !== 'credit_card')
            .reduce((sum, acc) => sum + Number(acc.balance), 0);
        const totalLiabilities = accounts
            .filter((acc) => acc.type === 'credit_card')
            .reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
        const investmentValue = investments
            .reduce((sum, inv) => sum + (Number(inv.quantity) * Number(inv.currentPrice)), 0);
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
    async generatePDFReport(userId, type) {
        // This would use jsPDF to generate reports client-side
        // Implementation depends on platform (web vs mobile)
        throw new Error('PDF generation not implemented - platform specific');
    }
    async generateExcelReport(userId, type) {
        // This would use SheetJS to generate Excel files client-side
        // Implementation depends on platform (web vs mobile)
        throw new Error('Excel generation not implemented - platform specific');
    }
    // ==========================================
    // Session-based Backup
    // ==========================================
    async endSession() {
        if (this.hasUnsyncedChanges) {
            try {
                const data = await this.localDB.exportAll();
                await this.backupService.backup(data);
                this.hasUnsyncedChanges = false;
            }
            catch (error) {
                console.error('Failed to backup data:', error);
                // Don't throw - backup failures shouldn't break user flow
            }
        }
    }
    async restoreFromBackup() {
        try {
            const data = await this.backupService.restore();
            if (data) {
                await this.localDB.importData(data);
                this.hasUnsyncedChanges = false;
            }
        }
        catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Failed to restore data from backup');
        }
    }
    // ==========================================
    // Feature Gates (Plus/Premium Features)
    // ==========================================
    async processReceiptOCR(imageFile) {
        if (!this.subscription.canUseOCR()) {
            throw new UpgradeRequiredError('OCR requires Plus ($2.99/month)');
        }
        return await OCRService_1.OCRService.processReceipt(imageFile);
    }
    async connectPlaidAccount(institution) {
        if (!this.subscription.canConnectBanks()) {
            throw new UpgradeRequiredError('Bank connections require Premium ($9.99/month)');
        }
        return await PlaidService_1.PlaidService.connect(institution);
    }
    async addFamilyMember(email) {
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
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getSubscriptionTier() {
        return this.subscription.getTier();
    }
    hasUnsavedChanges() {
        return this.hasUnsyncedChanges;
    }
}
exports.LocalDataEngine = LocalDataEngine;
//# sourceMappingURL=LocalDataEngine.js.map