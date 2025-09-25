'use client';

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard, Modal, Input, CurrencyInput } from '@/components/ui';
import { useDataEngine } from '@/hooks/useDataEngine';
import { useSubscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/utils';
import { SubscriptionDashboard } from '@/components/subscription/SubscriptionDashboard';
import { FeaturePrompt, UsageLimitGate } from '@/components/subscription/FeatureGate';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      console.log('🔒 No session found, redirecting to login');
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    console.log('✅ User is authenticated:', session.user?.email);
  }, [session, status, router]);
  const {
    dataEngine,
    isInitializing,
    stats,
    refreshStats,
    addTransaction,
    addBudget,
    subscriptionTier,
    hasUnsavedChanges
  } = useDataEngine();

  const { subscription: subscriptionData } = useSubscription();

  // Investment tracking state
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [investmentStats, setInvestmentStats] = useState({
    totalPortfolioValue: 0,
    totalCostBasis: 0,
    totalGainLoss: 0,
    portfolioCount: 0,
    totalHoldings: 0
  });

  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    description: '',
    amount: 0,
    categoryId: '',
    accountId: ''
  });
  const [budgetForm, setBudgetForm] = useState({
    categoryId: '',
    amount: 0,
    period: 'monthly'
  });

  // Load investment data
  useEffect(() => {
    const loadInvestmentData = async () => {
      if (!session?.user?.email || !dataEngine || isInitializing) {
        console.log('DataEngine not ready or no session, skipping investment load');
        return;
      }

      try {
        const userId = session.user.email;
        const portfolioData = await dataEngine.getAllPortfoliosWithInvestments(userId);
        setPortfolios(portfolioData);

        // Calculate investment stats
        const enrichedPortfolios = portfolioData.map(portfolio => {
          if (!portfolio.investments || portfolio.investments.length === 0) {
            return { ...portfolio, totalValue: 0, totalCost: 0, gainLoss: 0 };
          }

          const totalValue = portfolio.investments.reduce((sum: number, inv: any) =>
            sum + (inv.quantity * inv.currentPrice), 0);
          const totalCost = portfolio.investments.reduce((sum: number, inv: any) =>
            sum + (inv.quantity * inv.costBasis), 0);
          const gainLoss = totalValue - totalCost;

          return { ...portfolio, totalValue, totalCost, gainLoss };
        });

        const totalPortfolioValue = enrichedPortfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
        const totalCostBasis = enrichedPortfolios.reduce((sum, p) => sum + (p.totalCost || 0), 0);
        const totalGainLoss = totalPortfolioValue - totalCostBasis;
        const totalHoldings = enrichedPortfolios.reduce((sum, p) => sum + (p.investments?.length || 0), 0);

        setInvestmentStats({
          totalPortfolioValue,
          totalCostBasis,
          totalGainLoss,
          portfolioCount: portfolioData.length,
          totalHoldings
        });
      } catch (error) {
        console.error('Failed to load investment data:', error);
      }
    };

    loadInvestmentData();
  }, [session, dataEngine, isInitializing]);

  const handleSignOut = async () => {
    try {
      // Save any pending changes before signing out
      if (hasUnsavedChanges && dataEngine) {
        await dataEngine.endSession();
      }

      await signOut({
        callbackUrl: '/'
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionForm.description || !transactionForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // For demo purposes, create a default account if none exists
      let accountId = transactionForm.accountId;
      if (!accountId && stats.accounts.length === 0) {
        const defaultAccount = await dataEngine?.createAccount?.({
          name: 'Primary Account',
          type: 'checking',
          balance: 1000,
          currencyId: 'usd',
          userId: 'demo'
        });
        accountId = defaultAccount?.id;
      } else if (!accountId) {
        accountId = stats.accounts[0]?.id;
      }

      // Get default category if none selected
      let categoryId = transactionForm.categoryId;
      if (!categoryId && stats.categories.length > 0) {
        categoryId = stats.categories[0]?.id;
      }

      await addTransaction({
        description: transactionForm.description,
        originalAmount: transactionForm.amount,
        accountId,
        categoryId,
        currencyId: 'usd',
        date: new Date()
      });

      setTransactionForm({
        description: '',
        amount: 0,
        categoryId: '',
        accountId: ''
      });
      setShowAddTransaction(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetForm.categoryId || !budgetForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addBudget({
        categoryId: budgetForm.categoryId,
        amount: budgetForm.amount,
        period: budgetForm.period,
        startDate: new Date(),
        currencyId: 'usd'
      });

      setBudgetForm({
        categoryId: '',
        amount: 0,
        period: 'monthly'
      });
      setShowAddBudget(false);
    } catch (error) {
      console.error('Failed to add budget:', error);
      alert('Failed to add budget. Please try again.');
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while initializing data
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing your data...</p>
        </div>
      </div>
    );
  }

  const tierColors = {
    free: 'text-gray-600',
    plus: 'text-blue-600',
    premium: 'text-purple-600'
  };

  const tierLabels = {
    free: 'Free',
    plus: 'Plus ($2.99/month)',
    premium: 'Premium ($9.99/month)'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MoneyQuestV3</h1>
              <p className="text-sm text-gray-500">Personal Finance Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Transactions
              </Link>
              <Link
                href="/budgets"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Budgets
              </Link>
              <Link
                href="/investments"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Investments
              </Link>
              <Link
                href="/analytics"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Analytics
              </Link>
              <Link
                href="/collaboration"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Collaboration
              </Link>
              <Link
                href="/receipts"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Receipts
              </Link>
              <Link
                href="/sync"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Sync
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Billing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'User'}</p>
                <p className={`text-xs font-medium ${tierColors[subscriptionTier as keyof typeof tierColors]}`}>
                  {tierLabels[subscriptionTier as keyof typeof tierLabels]}
                </p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-lg text-gray-600">
            Your local-first personal finance dashboard is ready.
          </p>
        </div>

        {/* Data Engine Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Local-first data engine and subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Data Engine</p>
                  <p className="text-xs text-gray-500">
                    {dataEngine ? 'Active' : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Local Storage</p>
                  <p className="text-xs text-gray-500">IndexedDB Ready</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Subscription</p>
                  <p className="text-xs text-gray-500">{tierLabels[subscriptionTier as keyof typeof tierLabels]}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 ${hasUnsavedChanges ? 'bg-yellow-400' : 'bg-green-400'} rounded-full mr-3`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Sync Status</p>
                  <p className="text-xs text-gray-500">
                    {hasUnsavedChanges ? 'Changes pending' : 'Up to date'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Dashboard Stats - Now with Net Worth */}
        <div className="space-y-6 mb-8">
          {/* Net Worth Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Worth</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(stats.totalBalance + investmentStats.totalPortfolioValue)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Total assets across accounts and investments
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Investment Gain/Loss</div>
                  <div className={`text-lg font-semibold ${investmentStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investmentStats.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(investmentStats.totalGainLoss)}
                  </div>
                  <div className={`text-xs ${investmentStats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {investmentStats.totalCostBasis > 0
                      ? `${investmentStats.totalGainLoss >= 0 ? '+' : ''}${((investmentStats.totalGainLoss / investmentStats.totalCostBasis) * 100).toFixed(2)}%`
                      : 'No investments yet'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard
              title="Cash & Bank"
              value={formatCurrency(stats.totalBalance)}
              subtitle={`${stats.accounts.length} accounts`}
              trend={stats.totalBalance > 0 ? { value: 100, isPositive: true } : undefined}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
            <StatCard
              title="Investments"
              value={formatCurrency(investmentStats.totalPortfolioValue)}
              subtitle={`${investmentStats.portfolioCount} portfolios`}
              trend={investmentStats.totalGainLoss !== 0 ? {
                value: Math.abs((investmentStats.totalGainLoss / investmentStats.totalCostBasis) * 100),
                isPositive: investmentStats.totalGainLoss >= 0
              } : undefined}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <StatCard
              title="Holdings"
              value={investmentStats.totalHoldings.toString()}
              subtitle="Individual stocks/funds"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v10" />
                </svg>
              }
            />
            <StatCard
              title="Transactions"
              value={stats.transactionCount.toString()}
              subtitle="Total recorded"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              title="Categories"
              value={stats.categoryCount.toString()}
              subtitle="Available"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatCard
              title="Budgets"
              value={stats.budgetCount.toString()}
              subtitle="Active budgets"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your financial tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowAddTransaction(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowAddBudget(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Create Budget
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/analytics')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v10" />
                </svg>
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Features</CardTitle>
              <CardDescription>Available in your {tierLabels[subscriptionTier as keyof typeof tierLabels]} plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Free Features */}
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Transaction Splitting</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Budget Tracking</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Analytics Dashboard</span>
                </div>

                {/* Plus/Premium Features */}
                {(subscriptionTier === 'plus' || subscriptionTier === 'premium') && (
                  <>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">OCR Receipt Processing</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Multi-User Collaboration</span>
                    </div>
                  </>
                )}

                {/* Premium Features */}
                {subscriptionTier === 'premium' && (
                  <>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Bank Account Connections</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm">Advanced Automation</span>
                    </div>
                  </>
                )}

                {/* Upgrade prompt for free users */}
                {subscriptionTier === 'free' && (
                  <div className="pt-3 border-t border-gray-200">
                    <Button variant="outline" size="sm" className="w-full">
                      Upgrade to Plus - $2.99/month
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        {stats.recentTransactions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(transaction.originalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Dashboard */}
        <div className="mt-6">
          <SubscriptionDashboard />
        </div>
      </main>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="Add Transaction"
        description="Record a new financial transaction"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <Input
            label="Description"
            placeholder="e.g., Grocery shopping"
            value={transactionForm.description}
            onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
            required
          />
          <CurrencyInput
            value={transactionForm.amount}
            onChange={(value) => setTransactionForm({ ...transactionForm, amount: value })}
            placeholder="0.00"
            required
          />
          {stats.categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Optional)
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                value={transactionForm.categoryId}
                onChange={(e) => setTransactionForm({ ...transactionForm, categoryId: e.target.value })}
              >
                <option value="">Select a category</option>
                {stats.categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddTransaction(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Budget Modal */}
      <Modal
        isOpen={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        title="Create Budget"
        description="Set a spending budget for a category"
      >
        <form onSubmit={handleAddBudget} className="space-y-4">
          {stats.categories.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                value={budgetForm.categoryId}
                onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {stats.categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No categories available. Categories will be created automatically when you add transactions.</p>
          )}
          <CurrencyInput
            value={budgetForm.amount}
            onChange={(value) => setBudgetForm({ ...budgetForm, amount: value })}
            placeholder="0.00"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              value={budgetForm.period}
              onChange={(e) => setBudgetForm({ ...budgetForm, period: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddBudget(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={stats.categories.length === 0}>
              Create Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}