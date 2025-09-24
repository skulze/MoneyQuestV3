'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LocalDataEngine, SubscriptionStatus } from '@moneyquest/shared';
import { initializeDataEngine } from '@/lib/database/DataEngineFactory';

export interface DashboardStats {
  totalBalance: number;
  transactionCount: number;
  categoryCount: number;
  budgetCount: number;
  recentTransactions: any[];
  categories: any[];
  accounts: any[];
}

export function useDataEngine() {
  const { data: session } = useSession();
  const [dataEngine, setDataEngine] = useState<LocalDataEngine | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    transactionCount: 0,
    categoryCount: 0,
    budgetCount: 0,
    recentTransactions: [],
    categories: [],
    accounts: []
  });

  // Initialize data engine when session is available
  useEffect(() => {
    console.log('🔄 useDataEngine effect triggered');
    console.log('📊 Session status:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      subscription: session?.user?.subscription
    });

    if (!session?.user?.id) {
      console.log('⚠️ No session user ID, skipping initialization');
      return;
    }

    const initEngine = async () => {
      try {
        console.log('🚀 Starting data engine initialization for user:', session.user.id);
        setIsInitializing(true);

        const subscriptionStatus: SubscriptionStatus = {
          tier: session.user?.subscription || 'free',
          status: 'active',
        };

        console.log('🎯 Initializing with subscription:', subscriptionStatus);

        const engine = await initializeDataEngine(
          session.user.id,
          subscriptionStatus
        );

        setDataEngine(engine);
        console.log('✅ Data engine initialized successfully:', engine.getSubscriptionTier());

        // Load initial stats
        console.log('📈 Loading initial stats...');
        await refreshStats(engine);
        console.log('✅ Initial stats loaded');
      } catch (error) {
        console.error('❌ Failed to initialize data engine:', error);
      } finally {
        console.log('🏁 Data engine initialization complete, setting isInitializing to false');
        setIsInitializing(false);
      }
    };

    initEngine();
  }, [session?.user?.id, session?.user?.subscription]);

  // Refresh dashboard statistics
  const refreshStats = async (engine?: LocalDataEngine) => {
    if (!session?.user?.id) return;

    const activeEngine = engine || dataEngine;
    if (!activeEngine) return;

    try {
      // Get accounts and calculate total balance
      const accounts = await activeEngine.getAccounts?.(session.user.id) || [];
      const totalBalance = accounts.reduce((sum: number, account: any) => sum + Number(account.balance), 0);

      // Get transactions
      const transactions = await activeEngine.getTransactions() || [];
      const recentTransactions = transactions.slice(0, 5); // Get 5 most recent

      // Get categories
      const categories = await activeEngine.getCategories?.(session.user.id) || [];

      // Get budgets
      const budgets = await activeEngine.getBudgets?.(session.user.id) || [];

      setStats({
        totalBalance,
        transactionCount: transactions.length,
        categoryCount: categories.length,
        budgetCount: budgets.length,
        recentTransactions,
        categories,
        accounts
      });

      console.log('Stats updated:', {
        totalBalance,
        transactionCount: transactions.length,
        categoryCount: categories.length,
        accounts: accounts.length
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  // Add a new transaction
  const addTransaction = async (transactionData: any) => {
    if (!dataEngine || !session?.user?.id) return null;

    try {
      const transaction = await dataEngine.addTransaction({
        ...transactionData,
        userId: session.user.id,
        date: transactionData.date || new Date(),
      });

      // Refresh stats after adding transaction
      await refreshStats();

      return transaction;
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  // Add a new budget
  const addBudget = async (budgetData: any) => {
    if (!dataEngine || !session?.user?.id) return null;

    try {
      const budget = await dataEngine.createBudget({
        ...budgetData,
        userId: session.user.id,
      });

      // Refresh stats after adding budget
      await refreshStats();

      return budget;
    } catch (error) {
      console.error('Failed to add budget:', error);
      throw error;
    }
  };

  // Get analytics data
  const getCategorySpending = async (startDate: Date, endDate: Date) => {
    if (!dataEngine || !session?.user?.id) return [];

    try {
      return await dataEngine.calculateCategorySpending(
        session.user.id,
        startDate,
        endDate
      );
    } catch (error) {
      console.error('Failed to get category spending:', error);
      return [];
    }
  };

  // Get budget progress
  const getBudgetProgress = async () => {
    if (!dataEngine || !session?.user?.id) return [];

    try {
      return await dataEngine.getBudgetProgress(session.user.id);
    } catch (error) {
      console.error('Failed to get budget progress:', error);
      return [];
    }
  };

  return {
    dataEngine,
    isInitializing,
    stats,
    refreshStats: () => refreshStats(),
    addTransaction,
    addBudget,
    getCategorySpending,
    getBudgetProgress,
    subscriptionTier: session?.user?.subscription || 'free',
    hasUnsavedChanges: dataEngine?.hasUnsavedChanges() || false
  };
}