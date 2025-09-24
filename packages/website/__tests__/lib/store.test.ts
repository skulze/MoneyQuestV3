import { renderHook, act } from '@testing-library/react';
import { useStore } from '@/lib/store';
import { openDB } from 'idb';

// Mock IndexedDB
jest.mock('idb');
const mockOpenDB = openDB as jest.MockedFunction<typeof openDB>;

const mockDB = {
  transaction: jest.fn().mockReturnValue({
    objectStore: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue('1'),
      put: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getAll: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(null),
    }),
    done: Promise.resolve(),
  }),
};

beforeEach(() => {
  mockOpenDB.mockResolvedValue(mockDB as any);
  jest.clearAllMocks();
});

describe('useStore', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useStore());

    expect(result.current.transactions).toEqual([]);
    expect(result.current.accounts).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.budgets).toEqual([]);
  });

  it('adds a transaction', async () => {
    const { result } = renderHook(() => useStore());

    const transaction = {
      amount: 25.50,
      description: 'Lunch',
      accountId: '1',
      categoryId: '1',
      date: '2024-01-15',
      type: 'EXPENSE' as const
    };

    await act(async () => {
      await result.current.addTransaction(transaction);
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]).toMatchObject(transaction);
    expect(result.current.transactions[0].id).toBeDefined();
  });

  it('adds an account', async () => {
    const { result } = renderHook(() => useStore());

    const account = {
      name: 'Checking',
      type: 'CHECKING' as const,
      balance: 1000,
      currencyId: '1'
    };

    await act(async () => {
      await result.current.addAccount(account);
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0]).toMatchObject(account);
    expect(result.current.accounts[0].id).toBeDefined();
  });

  it('updates account balance when transaction is added', async () => {
    const { result } = renderHook(() => useStore());

    // Add account first
    const account = {
      name: 'Checking',
      type: 'CHECKING' as const,
      balance: 1000,
      currencyId: '1'
    };

    await act(async () => {
      await result.current.addAccount(account);
    });

    const accountId = result.current.accounts[0].id;

    // Add expense transaction
    const transaction = {
      amount: 25.50,
      description: 'Lunch',
      accountId,
      categoryId: '1',
      date: '2024-01-15',
      type: 'EXPENSE' as const
    };

    await act(async () => {
      await result.current.addTransaction(transaction);
    });

    expect(result.current.accounts[0].balance).toBe(974.50);
  });

  it('creates and updates budgets', async () => {
    const { result } = renderHook(() => useStore());

    const budget = {
      categoryId: '1',
      amount: 500,
      period: 'MONTHLY' as const,
      startDate: '2024-01-01',
      currencyId: '1'
    };

    await act(async () => {
      await result.current.addBudget(budget);
    });

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]).toMatchObject(budget);

    // Update budget
    const budgetId = result.current.budgets[0].id;
    await act(async () => {
      await result.current.updateBudget(budgetId, { amount: 600 });
    });

    expect(result.current.budgets[0].amount).toBe(600);
  });

  it('calculates spending insights correctly', () => {
    const { result } = renderHook(() => useStore());

    // Mock some transactions
    act(() => {
      result.current.transactions = [
        {
          id: '1',
          amount: 50,
          description: 'Groceries',
          accountId: '1',
          categoryId: '1',
          date: '2024-01-15',
          type: 'EXPENSE',
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          amount: 30,
          description: 'Coffee',
          accountId: '1',
          categoryId: '1',
          date: '2024-01-16',
          type: 'EXPENSE',
          createdAt: new Date('2024-01-16')
        }
      ];

      result.current.categories = [
        { id: '1', name: 'Food', type: 'EXPENSE', color: '#FF5733' }
      ];
    });

    const insights = result.current.getSpendingInsights();

    expect(insights.totalSpent).toBe(80);
    expect(insights.transactionCount).toBe(2);
    expect(insights.avgTransactionAmount).toBe(40);
  });

  it('handles transaction deletion', async () => {
    const { result } = renderHook(() => useStore());

    // Add a transaction
    const transaction = {
      amount: 25.50,
      description: 'Lunch',
      accountId: '1',
      categoryId: '1',
      date: '2024-01-15',
      type: 'EXPENSE' as const
    };

    await act(async () => {
      await result.current.addTransaction(transaction);
    });

    const transactionId = result.current.transactions[0].id;

    await act(async () => {
      await result.current.deleteTransaction(transactionId);
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('filters transactions by date range', () => {
    const { result } = renderHook(() => useStore());

    // Mock transactions with different dates
    act(() => {
      result.current.transactions = [
        {
          id: '1',
          amount: 50,
          description: 'Old transaction',
          accountId: '1',
          categoryId: '1',
          date: '2023-12-15',
          type: 'EXPENSE',
          createdAt: new Date('2023-12-15')
        },
        {
          id: '2',
          amount: 30,
          description: 'Recent transaction',
          accountId: '1',
          categoryId: '1',
          date: '2024-01-16',
          type: 'EXPENSE',
          createdAt: new Date('2024-01-16')
        }
      ];
    });

    const filtered = result.current.getTransactionsByDateRange(
      '2024-01-01',
      '2024-01-31'
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].description).toBe('Recent transaction');
  });
});