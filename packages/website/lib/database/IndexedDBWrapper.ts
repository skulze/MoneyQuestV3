import Dexie, { Table } from 'dexie';
import {
  LocalDB,
  Filter
} from '@moneyquest/shared';
import { CategoryTotal, BudgetStatus } from '@moneyquest/shared';

// Define database schema matching Prisma schema
interface User {
  id: string;
  cognitoId: string;
  email: string;
  preferences: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currencyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  accountId: string;
  originalAmount: number;
  description: string;
  date: Date;
  currencyId: string;
  isParent: boolean;
  parentTransactionId?: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionSplit {
  id: string;
  transactionId: string;
  amount: number;
  categoryId: string;
  description?: string;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currencyId: string;
  period: string;
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Investment {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Portfolio {
  id: string;
  userId: string;
  name: string;
  provider?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NetWorthSnapshot {
  id: string;
  userId: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  date: Date;
  createdAt: Date;
}

class MoneyQuestDB extends Dexie {
  users!: Table<User>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  transaction_splits!: Table<TransactionSplit>;
  budgets!: Table<Budget>;
  currencies!: Table<Currency>;
  investments!: Table<Investment>;
  portfolios!: Table<Portfolio>;
  net_worth_snapshots!: Table<NetWorthSnapshot>;

  constructor() {
    super('MoneyQuestDB');

    this.version(1).stores({
      users: 'id, cognitoId, email, createdAt',
      accounts: 'id, userId, name, type, isActive, createdAt',
      categories: 'id, userId, name, type, isDefault, createdAt',
      transactions: 'id, accountId, date, categoryId, isParent, parentTransactionId, createdAt',
      transaction_splits: 'id, transactionId, categoryId, createdAt',
      budgets: 'id, userId, categoryId, period, startDate, isActive, createdAt',
      currencies: 'id, code, name, isActive, createdAt',
      investments: 'id, portfolioId, symbol, createdAt',
      portfolios: 'id, userId, name, isActive, createdAt',
      net_worth_snapshots: 'id, userId, date, createdAt'
    });
  }
}

export class IndexedDBWrapper implements LocalDB {
  private db: MoneyQuestDB;

  constructor() {
    this.db = new MoneyQuestDB();
  }

  // ==========================================
  // Core CRUD Operations
  // ==========================================

  async insert<T>(table: string, data: T): Promise<T> {
    try {
      const dbTable = this.getTable(table);
      const id = await dbTable.add(data as any);

      // Return the inserted data with the generated ID if needed
      if (typeof id === 'string' && (data as any).id === undefined) {
        return { ...data, id } as T;
      }

      return data;
    } catch (error) {
      console.error(`Failed to insert into ${table}:`, error);
      throw new Error(`Database insert failed: ${error}`);
    }
  }

  async query<T>(table: string, filter?: any): Promise<T[]> {
    try {
      const dbTable = this.getTable(table);
      let collection = dbTable.toCollection();

      if (filter) {
        // Apply filters based on the filter object
        if (filter.id) {
          return [(await dbTable.get(filter.id))] as T[];
        }

        // Apply common filters
        Object.keys(filter).forEach(key => {
          if (filter[key] !== undefined && filter[key] !== null) {
            collection = collection.filter(item => {
              const value = (item as any)[key];
              const filterValue = filter[key];

              // Handle date range filters
              if (key === 'startDate' && value instanceof Date) {
                return value >= filterValue;
              }
              if (key === 'endDate' && value instanceof Date) {
                return value <= filterValue;
              }

              // Handle exact matches
              return value === filterValue;
            });
          }
        });
      }

      const results = await collection.toArray();
      return results as T[];
    } catch (error) {
      console.error(`Failed to query ${table}:`, error);
      throw new Error(`Database query failed: ${error}`);
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const dbTable = this.getTable(table);

      // Get existing record
      const existing = await dbTable.get(id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${table}`);
      }

      // Merge updates
      const updated = { ...existing, ...data, updatedAt: new Date() };

      // Update in database
      await dbTable.update(id, updated);

      return updated as T;
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      throw new Error(`Database update failed: ${error}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    try {
      const dbTable = this.getTable(table);
      await dbTable.delete(id);
    } catch (error) {
      console.error(`Failed to delete from ${table}:`, error);
      throw new Error(`Database delete failed: ${error}`);
    }
  }

  // ==========================================
  // Analytics Queries
  // ==========================================

  async getCategorySpending(userId: string, startDate: Date, endDate: Date): Promise<CategoryTotal[]> {
    try {
      // Get user's transactions in date range
      const transactions = await this.db.transactions
        .where('date')
        .between(startDate, endDate, true, true)
        .filter(t => {
          // We need to check if the account belongs to the user
          // This would normally be a JOIN operation
          return true; // Simplified for now
        })
        .toArray();

      // Get user's categories
      const categories = await this.db.categories
        .where('userId')
        .equals(userId)
        .toArray();

      // Calculate spending by category
      const categoryMap = new Map<string, CategoryTotal>();

      // Initialize categories
      categories.forEach(cat => {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          totalAmount: 0,
          transactionCount: 0,
          percentage: 0
        });
      });

      // Aggregate transaction amounts
      let totalSpending = 0;

      for (const transaction of transactions) {
        if (transaction.categoryId) {
          const category = categoryMap.get(transaction.categoryId);
          if (category) {
            category.totalAmount += Math.abs(transaction.originalAmount);
            category.transactionCount += 1;
            totalSpending += Math.abs(transaction.originalAmount);
          }
        }

        // Handle splits
        const splits = await this.db.transaction_splits
          .where('transactionId')
          .equals(transaction.id)
          .toArray();

        splits.forEach(split => {
          const category = categoryMap.get(split.categoryId);
          if (category) {
            category.totalAmount += Math.abs(split.amount);
            totalSpending += Math.abs(split.amount);
          }
        });
      }

      // Calculate percentages
      categoryMap.forEach(category => {
        if (totalSpending > 0) {
          category.percentage = (category.totalAmount / totalSpending) * 100;
        }
      });

      return Array.from(categoryMap.values())
        .filter(cat => cat.totalAmount > 0)
        .sort((a, b) => b.totalAmount - a.totalAmount);

    } catch (error) {
      console.error('Failed to get category spending:', error);
      throw new Error(`Analytics query failed: ${error}`);
    }
  }

  async getBudgetProgress(userId: string): Promise<BudgetStatus[]> {
    try {
      const budgets = await this.db.budgets
        .where('userId')
        .equals(userId)
        .filter(b => b.isActive)
        .toArray();

      const budgetStatus: BudgetStatus[] = [];

      for (const budget of budgets) {
        // Calculate period start/end dates
        const now = new Date();
        let periodStart = new Date(budget.startDate);
        let periodEnd = new Date(budget.startDate);

        if (budget.period === 'monthly') {
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (budget.period === 'yearly') {
          periodStart = new Date(now.getFullYear(), 0, 1);
          periodEnd = new Date(now.getFullYear(), 11, 31);
        }

        // Calculate spending for this category in the period
        const categorySpending = await this.getCategorySpending(userId, periodStart, periodEnd);
        const spent = categorySpending.find(c => c.categoryId === budget.categoryId)?.totalAmount || 0;

        // Get category details
        const category = await this.db.categories.get(budget.categoryId);

        budgetStatus.push({
          budgetId: budget.id,
          categoryId: budget.categoryId,
          categoryName: category?.name || 'Unknown Category',
          budgetAmount: budget.amount,
          spentAmount: spent,
          remainingAmount: budget.amount - spent,
          percentageUsed: (spent / budget.amount) * 100,
          period: budget.period as 'monthly' | 'yearly',
          isOverBudget: spent > budget.amount
        });
      }

      return budgetStatus;
    } catch (error) {
      console.error('Failed to get budget progress:', error);
      throw new Error(`Budget progress query failed: ${error}`);
    }
  }

  // ==========================================
  // Export/Import Operations
  // ==========================================

  async exportAll(): Promise<any> {
    try {
      const data: any = {};

      // Export all tables
      const tables = [
        'users', 'accounts', 'categories', 'transactions',
        'transaction_splits', 'budgets', 'currencies',
        'investments', 'portfolios', 'net_worth_snapshots'
      ];

      for (const tableName of tables) {
        const table = this.getTable(tableName);
        data[tableName] = await table.toArray();
      }

      return {
        version: 1,
        exportedAt: new Date(),
        data
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error(`Data export failed: ${error}`);
    }
  }

  async importData(importData: any): Promise<void> {
    try {
      if (!importData.data) {
        throw new Error('Invalid import data format');
      }

      // Clear existing data (optional - might want to merge instead)
      await this.db.transaction('rw', [
        this.db.users, this.db.accounts, this.db.categories,
        this.db.transactions, this.db.transaction_splits,
        this.db.budgets, this.db.currencies, this.db.investments,
        this.db.portfolios, this.db.net_worth_snapshots
      ], async () => {
        // Import data table by table
        const tables = [
          'users', 'accounts', 'categories', 'transactions',
          'transaction_splits', 'budgets', 'currencies',
          'investments', 'portfolios', 'net_worth_snapshots'
        ];

        for (const tableName of tables) {
          if (importData.data[tableName]) {
            const table = this.getTable(tableName);
            await table.bulkAdd(importData.data[tableName]);
          }
        }
      });

    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error(`Data import failed: ${error}`);
    }
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  private getTable(tableName: string): Table {
    const table = (this.db as any)[tableName];
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    return table;
  }

  // Initialize with default data
  async initialize(userId: string): Promise<void> {
    try {
      console.log(`Starting IndexedDB initialization for user: ${userId}`);

      // Check if already initialized
      const user = await this.db.users.get(userId);
      if (user) {
        console.log(`User ${userId} already initialized`);
        return; // Already initialized
      }

      console.log(`Creating new user profile for: ${userId}`);

      // Create user record
      const newUser = {
        id: userId,
        cognitoId: userId, // Using userId as cognitoId for demo accounts
        email: `${userId}@moneyquest.com`,
        preferences: JSON.stringify({ theme: 'light', currency: 'USD' }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create default currencies
      const defaultCurrencies = [
        {
          id: 'usd',
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'eur',
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Create default categories
      const defaultCategories = [
        { name: 'Groceries', type: 'expense', color: '#10B981' },
        { name: 'Transportation', type: 'expense', color: '#3B82F6' },
        { name: 'Housing', type: 'expense', color: '#8B5CF6' },
        { name: 'Utilities', type: 'expense', color: '#F59E0B' },
        { name: 'Entertainment', type: 'expense', color: '#EF4444' },
        { name: 'Healthcare', type: 'expense', color: '#EC4899' },
        { name: 'Salary', type: 'income', color: '#059669' },
        { name: 'Investment', type: 'income', color: '#0891B2' }
      ].map(cat => ({
        id: `${userId}-${cat.name.toLowerCase().replace(/\s+/g, '-')}`,
        userId,
        ...cat,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Create some demo accounts for new users
      const defaultAccounts = [
        {
          id: `${userId}-checking`,
          userId,
          name: 'Checking Account',
          type: 'checking',
          balance: 2500.00,
          currencyId: 'usd',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `${userId}-savings`,
          userId,
          name: 'Savings Account',
          type: 'savings',
          balance: 12500.00,
          currencyId: 'usd',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Initialize database with transaction
      await this.db.transaction('rw', [
        this.db.users,
        this.db.currencies,
        this.db.categories,
        this.db.accounts
      ], async () => {
        console.log('Creating user record...');
        await this.db.users.add(newUser);

        console.log('Adding default currencies...');
        // Add currencies (only if not exist)
        for (const currency of defaultCurrencies) {
          const existing = await this.db.currencies.get(currency.id);
          if (!existing) {
            await this.db.currencies.add(currency);
          }
        }

        console.log('Adding default categories...');
        await this.db.categories.bulkAdd(defaultCategories);

        console.log('Adding default accounts...');
        await this.db.accounts.bulkAdd(defaultAccounts);
      });

      console.log(`Successfully initialized database for user: ${userId}`);

    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }
}