'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useDataEngine } from '@/hooks/useDataEngine';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { generatePDFReport, generateExcelReport, generateCSVExport, prepareExportData, ExportData } from '@/lib/exports';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Target, PieChart as PieChartIcon, Download, FileSpreadsheet, FileText } from 'lucide-react';

interface SpendingTrendData {
  date: string;
  spending: number;
  income: number;
  netFlow: number;
}

interface CategoryBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  [key: string]: any;
}

interface BudgetComparisonData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  status: 'over' | 'under' | 'on_track';
}

interface NetWorthData {
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const { dataEngine, stats, getCategorySpending, getBudgetProgress, subscriptionTier } = useDataEngine();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  // Analytics data state
  const [spendingTrends, setSpendingTrends] = useState<SpendingTrendData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdownData[]>([]);
  const [budgetComparison, setBudgetComparison] = useState<BudgetComparisonData[]>([]);
  const [netWorthData, setNetWorthData] = useState<NetWorthData[]>([]);
  const [insights, setInsights] = useState<{
    totalSpent: number;
    totalIncome: number;
    netSavings: number;
    avgDailySpending: number;
    topSpendingCategory: string;
    budgetPerformance: number;
  }>({
    totalSpent: 0,
    totalIncome: 0,
    netSavings: 0,
    avgDailySpending: 0,
    topSpendingCategory: '',
    budgetPerformance: 0
  });

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  useEffect(() => {
    if (!dataEngine || !session?.user?.id) return;

    loadAnalyticsData();
  }, [dataEngine, session?.user?.id, timeframe]);

  const loadAnalyticsData = async () => {
    if (!dataEngine || !session?.user?.id) return;

    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Set date range based on timeframe
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Generate real spending trends data from transactions
      const realSpendingTrends = generateRealSpendingTrends(startDate, endDate);
      setSpendingTrends(realSpendingTrends);

      // Get category spending data
      const categorySpending = await getCategorySpending(startDate, endDate);
      const totalSpending = categorySpending.reduce((sum, cat) => sum + Math.abs(cat.totalAmount), 0);

      const categoryData = categorySpending.map((category, index) => ({
        category: category.categoryName || 'Uncategorized',
        amount: Math.abs(category.totalAmount),
        percentage: totalSpending > 0 ? (Math.abs(category.totalAmount) / totalSpending) * 100 : 0,
        color: colors[index % colors.length]
      }));
      setCategoryBreakdown(categoryData);

      // Get real budget comparison data
      const budgetProgress = await getBudgetProgress();
      const realBudgetComparison = generateRealBudgetComparison(budgetProgress);
      setBudgetComparison(realBudgetComparison);

      // Generate mock net worth data
      const mockNetWorthData = generateMockNetWorthData(startDate, endDate);
      setNetWorthData(mockNetWorthData);

      // Calculate insights
      const totalSpent = realSpendingTrends.reduce((sum, day) => sum + day.spending, 0);
      const totalIncome = realSpendingTrends.reduce((sum, day) => sum + day.income, 0);
      const netSavings = totalIncome - totalSpent;
      const avgDailySpending = totalSpent / Math.max(realSpendingTrends.length, 1);
      const topCategory = categoryData.length > 0 ? categoryData[0].category : 'None';
      const budgetPerformance = realBudgetComparison.length > 0
        ? realBudgetComparison.filter(b => b.status !== 'over').length / realBudgetComparison.length * 100
        : 100;

      setInsights({
        totalSpent,
        totalIncome,
        netSavings,
        avgDailySpending,
        topSpendingCategory: topCategory,
        budgetPerformance
      });

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRealSpendingTrends = (startDate: Date, endDate: Date): SpendingTrendData[] => {
    const data: SpendingTrendData[] = [];
    const currentDate = new Date(startDate);

    // Get all transactions from stats
    const transactions = stats.recentTransactions || [];

    while (currentDate <= endDate) {
      const dayKey = currentDate.toISOString().split('T')[0];

      // Filter transactions for this day
      const dayTransactions = transactions.filter((tx: any) => {
        const txDate = new Date(tx.date).toISOString().split('T')[0];
        return txDate === dayKey;
      });

      // Calculate spending (negative amounts) and income (positive amounts)
      const spending = Math.abs(dayTransactions
        .filter((tx: any) => tx.originalAmount < 0)
        .reduce((sum: number, tx: any) => sum + Math.abs(tx.originalAmount), 0));

      const income = dayTransactions
        .filter((tx: any) => tx.originalAmount > 0)
        .reduce((sum: number, tx: any) => sum + tx.originalAmount, 0);

      data.push({
        date: dayKey,
        spending: Math.round(spending),
        income: Math.round(income),
        netFlow: Math.round(income - spending)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  };

  const generateRealBudgetComparison = (budgetProgress: any[]): BudgetComparisonData[] => {
    if (!budgetProgress || budgetProgress.length === 0) {
      return []; // Return empty array if no budget data
    }

    return budgetProgress.map(budget => {
      const budgeted = budget.amount || 0;
      const actual = Math.abs(budget.spent || 0);
      const variance = actual - budgeted;
      const status = variance > budgeted * 0.1 ? 'over' : variance < -budgeted * 0.1 ? 'under' : 'on_track';

      return {
        category: budget.categoryName || 'Uncategorized',
        budgeted: Math.round(budgeted),
        actual: Math.round(actual),
        variance: Math.round(variance),
        status: status as 'over' | 'under' | 'on_track'
      };
    });
  };

  const generateMockNetWorthData = (startDate: Date, endDate: Date): NetWorthData[] => {
    const data: NetWorthData[] = [];
    const currentDate = new Date(startDate);
    let assets = 50000;
    let liabilities = 15000;

    while (currentDate <= endDate) {
      // Simulate gradual changes
      assets += Math.random() * 200 - 100; // Random change between -$100 and +$100
      liabilities += Math.random() * 50 - 25; // Smaller random change for liabilities

      data.push({
        date: currentDate.toISOString().split('T')[0],
        assets: Math.round(assets),
        liabilities: Math.round(liabilities),
        netWorth: Math.round(assets - liabilities)
      });

      currentDate.setDate(currentDate.getDate() + Math.max(1, Math.floor(data.length / 10))); // Fewer data points for longer timeframes
    }

    return data;
  };

  const TimeframeButton = ({ value, label }: { value: typeof timeframe; label: string }) => (
    <Button
      variant={timeframe === value ? "primary" : "outline"}
      size="sm"
      onClick={() => setTimeframe(value)}
    >
      {label}
    </Button>
  );

  const handleExportPDF = () => {
    if (!session?.user) return;

    const exportData = prepareExportData(
      insights,
      spendingTrends,
      categoryBreakdown,
      budgetComparison,
      timeframe,
      session.user.name || undefined,
      session.user.email || undefined
    );

    generatePDFReport(exportData);
  };

  const handleExportExcel = () => {
    if (!session?.user) return;

    const exportData = prepareExportData(
      insights,
      spendingTrends,
      categoryBreakdown,
      budgetComparison,
      timeframe,
      session.user.name || undefined,
      session.user.email || undefined
    );

    generateExcelReport(exportData);
  };

  const handleExportCSV = () => {
    if (!session?.user) return;

    const exportData = prepareExportData(
      insights,
      spendingTrends,
      categoryBreakdown,
      budgetComparison,
      timeframe,
      session.user.name || undefined,
      session.user.email || undefined
    );

    generateCSVExport(exportData);
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Insights into your spending patterns and financial health
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Export buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>

            {/* Timeframe selector */}
            <div className="flex gap-2">
              <TimeframeButton value="7d" label="7 Days" />
              <TimeframeButton value="30d" label="30 Days" />
              <TimeframeButton value="90d" label="90 Days" />
              <TimeframeButton value="1y" label="1 Year" />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(insights.totalSpent)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(insights.totalIncome)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Savings</p>
                    <p className={`text-2xl font-bold ${insights.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(insights.netSavings)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Budget Performance</p>
                    <p className="text-2xl font-bold text-blue-600">{insights.budgetPerformance.toFixed(0)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spending Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Spending Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Spending"
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Income"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown and Budget Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                        label={({ percentage }: any) => `${percentage.toFixed(0)}%`}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value}`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Budget vs Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: number) => [`$${value}`, '']} />
                      <Legend />
                      <Bar dataKey="budgeted" fill="#8884d8" name="Budgeted" />
                      <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Net Worth Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Net Worth Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      formatter={(value: number) => [`$${value}`, '']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Net Worth"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Insights and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Spending Patterns</h4>
                  <p className="text-sm text-gray-600">
                    Your top spending category is <strong>{insights.topSpendingCategory}</strong>.
                    You spend an average of <strong>{formatCurrency(insights.avgDailySpending)}</strong> per day.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Budget Performance</h4>
                  <p className="text-sm text-gray-600">
                    You're staying within budget {insights.budgetPerformance.toFixed(0)}% of the time.
                    {insights.budgetPerformance >= 80 ? ' Great job!' : ' Consider reviewing your spending habits.'}
                  </p>
                </div>
              </div>

              {insights.netSavings > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Positive Cash Flow</h4>
                  <p className="text-sm text-green-700">
                    You've saved {formatCurrency(insights.netSavings)} this period. Consider investing this surplus to grow your wealth.
                  </p>
                </div>
              )}

              {insights.netSavings < 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900">Spending Alert</h4>
                  <p className="text-sm text-red-700">
                    You've spent {formatCurrency(Math.abs(insights.netSavings))} more than you earned this period.
                    Review your expenses and consider adjusting your budget.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}