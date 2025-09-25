'use client';

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Modal } from '@/components/ui';
import { TrendingUp, Plus, PieChart, DollarSign, BarChart3, Target } from 'lucide-react';
import { LocalDataEngine } from '@moneyquest/shared/src/data-engine/LocalDataEngine';
import { EnhancedInvestmentCharts } from '@/components/investments/EnhancedInvestmentCharts';
import { useSubscription } from '@/hooks/useSubscription';

export default function InvestmentsPage() {
  const { session, isLoading: authLoading } = useAuthGuard('/investments');
  const { subscription } = useSubscription();
  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [showAddInvestment, setShowAddInvestment] = useState(false);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataEngine] = useState(() => new LocalDataEngine());

  // Form states
  const [portfolioForm, setPortfolioForm] = useState({
    name: '',
    provider: '',
    accountNumber: ''
  });
  const [investmentForm, setInvestmentForm] = useState({
    portfolioId: '',
    symbol: '',
    name: '',
    quantity: '',
    costBasis: '',
    currentPrice: ''
  });

  useEffect(() => {
    if (session?.user?.email) {
      loadPortfolios();
    }
  }, [session]);

  const loadPortfolios = async () => {
    try {
      setLoading(true);
      const userId = session?.user?.email || 'demo-user';
      const portfolioData = await dataEngine.getAllPortfoliosWithInvestments(userId);
      setPortfolios(portfolioData);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Calculate totals and analytics from real data
  const enrichedPortfolios = portfolios.map(portfolio => {
    if (!portfolio.investments || portfolio.investments.length === 0) {
      return { ...portfolio, totalValue: 0, totalCost: 0, gainLoss: 0, gainLossPercent: 0 };
    }

    const totalValue = portfolio.investments.reduce((sum: number, inv: any) =>
      sum + (inv.quantity * inv.currentPrice), 0);
    const totalCost = portfolio.investments.reduce((sum: number, inv: any) =>
      sum + (inv.quantity * inv.costBasis), 0);
    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    return {
      ...portfolio,
      totalValue,
      totalCost,
      gainLoss,
      gainLossPercent
    };
  });

  const totalPortfolioValue = enrichedPortfolios.reduce((sum, p) => sum + (p.totalValue || 0), 0);
  const totalCostBasis = enrichedPortfolios.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

  // Investment analytics
  const topPerformers = enrichedPortfolios.flatMap(p =>
    (p.investments || []).map((inv: any) => ({
      ...inv,
      portfolioName: p.name,
      totalValue: inv.quantity * inv.currentPrice,
      gainLoss: inv.quantity * (inv.currentPrice - inv.costBasis),
      gainLossPercent: inv.costBasis > 0 ? ((inv.currentPrice - inv.costBasis) / inv.costBasis) * 100 : 0
    }))
  ).sort((a, b) => b.gainLossPercent - a.gainLossPercent).slice(0, 5);

  const totalInvestments = enrichedPortfolios.reduce((sum, p) => sum + (p.investments?.length || 0), 0);

  // Asset allocation for the largest portfolio
  const largestPortfolio = enrichedPortfolios.reduce((max, current) =>
    current.totalValue > max.totalValue ? current : max,
    { totalValue: 0, investments: [] }
  );

  // Handle portfolio creation
  const handleCreatePortfolio = async () => {
    try {
      const userId = session?.user?.email || 'demo-user';
      await dataEngine.createPortfolio(userId, {
        name: portfolioForm.name,
        provider: portfolioForm.provider,
        accountNumber: portfolioForm.accountNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form and close modal
      setPortfolioForm({ name: '', provider: '', accountNumber: '' });
      setShowAddPortfolio(false);

      // Reload portfolios
      await loadPortfolios();
    } catch (error) {
      console.error('Failed to create portfolio:', error);
    }
  };

  // Handle investment creation
  const handleCreateInvestment = async () => {
    try {
      const userId = session?.user?.email || 'demo-user';
      const quantity = parseFloat(investmentForm.quantity);
      const costBasis = parseFloat(investmentForm.costBasis);
      const currentPrice = parseFloat(investmentForm.currentPrice);

      await dataEngine.createInvestment(userId, {
        portfolioId: investmentForm.portfolioId,
        symbol: investmentForm.symbol.toUpperCase(),
        name: investmentForm.name,
        quantity,
        costBasis,
        currentPrice,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Reset form and close modal
      setInvestmentForm({
        portfolioId: '',
        symbol: '',
        name: '',
        quantity: '',
        costBasis: '',
        currentPrice: ''
      });
      setShowAddInvestment(false);

      // Reload portfolios
      await loadPortfolios();
    } catch (error) {
      console.error('Failed to create investment:', error);
    }
  };

  // Use real data if available, otherwise show empty state

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Portfolio</h1>
            <p className="text-gray-600">Track your investments and monitor portfolio performance</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={() => setShowAddPortfolio(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Portfolio
            </Button>
            <Button
              onClick={() => setShowAddInvestment(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Investment
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {portfolios.length} portfolios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalGainLoss).toLocaleString()}
              </div>
              <p className={`text-xs ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCostBasis.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Original investment amount
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holdings</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvestments}</div>
              <p className="text-xs text-muted-foreground">
                Across {enrichedPortfolios.length} portfolios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Investment Charts (Plus Feature) */}
        {enrichedPortfolios.length > 0 && subscription?.canUseFeature('multiUser') && (
          <EnhancedInvestmentCharts
            investments={enrichedPortfolios.flatMap(p =>
              (p.investments || []).map((inv: any) => ({
                symbol: inv.symbol,
                name: inv.name,
                currentValue: inv.quantity * inv.currentPrice,
                costBasis: inv.quantity * inv.costBasis,
                gainLoss: inv.quantity * (inv.currentPrice - inv.costBasis),
                gainLossPercent: inv.costBasis > 0 ? ((inv.currentPrice - inv.costBasis) / inv.costBasis) * 100 : 0,
                sector: 'Technology' // Would be determined by actual data
              }))
            )}
          />
        )}

        {/* Investment Analytics Section */}
        {enrichedPortfolios.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Investment Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.length > 0 ? (
                      topPerformers.map((investment, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{investment.symbol}</p>
                            <p className="text-sm text-gray-600">{investment.portfolioName}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${investment.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {investment.gainLossPercent >= 0 ? '+' : ''}{investment.gainLossPercent.toFixed(2)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              ${investment.totalValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No investments yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Portfolio Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrichedPortfolios.map((portfolio) => (
                      <div key={portfolio.id} className="flex justify-between items-center py-2">
                        <div>
                          <p className="font-medium">{portfolio.name}</p>
                          <p className="text-sm text-gray-600">${portfolio.totalValue?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${(portfolio.gainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(portfolio.gainLossPercent || 0) >= 0 ? '+' : ''}{(portfolio.gainLossPercent || 0).toFixed(2)}%
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${(portfolio.gainLossPercent || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{
                                width: `${Math.min(Math.abs(portfolio.gainLossPercent || 0), 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Investment Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Investment Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {enrichedPortfolios.filter(p => (p.gainLossPercent || 0) > 0).length}
                    </div>
                    <div className="text-sm text-blue-800">Profitable Portfolios</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {topPerformers.filter(inv => inv.gainLossPercent > 10).length}
                    </div>
                    <div className="text-sm text-green-800">Strong Performers (&gt;10%)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ${(totalPortfolioValue / enrichedPortfolios.length || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-800">Avg Portfolio Value</div>
                  </div>
                </div>
                {totalGainLoss !== 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Performance Summary:</span>{' '}
                      Your total investment portfolio is {totalGainLoss >= 0 ? 'up' : 'down'}{' '}
                      <span className={`font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalGainLossPercent.toFixed(2)}%
                      </span>{' '}
                      with a {totalGainLoss >= 0 ? 'gain' : 'loss'} of{' '}
                      <span className={`font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(totalGainLoss).toLocaleString()}
                      </span>.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio List */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Portfolios</h2>

          {enrichedPortfolios.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PieChart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios yet</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create your first portfolio to start tracking your investments
                </p>
                <Button onClick={() => setShowAddPortfolio(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Portfolio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrichedPortfolios.map((portfolio) => (
                <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                        <p className="text-sm text-gray-600">{portfolio.provider}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${portfolio.totalValue.toLocaleString()}</div>
                        <div className={`text-sm ${portfolio.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {portfolio.gainLoss >= 0 ? '+' : ''}${Math.abs(portfolio.gainLoss).toLocaleString()}
                          ({portfolio.gainLoss >= 0 ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cost Basis:</span>
                        <span className="font-medium">${portfolio.totalCost.toLocaleString()}</span>
                      </div>

                      {/* Investment Holdings Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Holdings ({portfolio.investments.length})</h4>
                        <div className="space-y-1">
                          {portfolio.investments.slice(0, 3).map((investment, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {investment.symbol} - {investment.quantity} shares
                              </span>
                              <span className="font-medium">
                                ${(investment.quantity * investment.currentPrice).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {portfolio.investments.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{portfolio.investments.length - 3} more holdings
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit Portfolio
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Portfolio Modal */}
        <Modal
          isOpen={showAddPortfolio}
          onClose={() => setShowAddPortfolio(false)}
          title="Add New Portfolio"
        >
          <div className="space-y-4">
            <Input
              label="Portfolio Name"
              placeholder="e.g., Retirement 401(k), Brokerage Account"
              value={portfolioForm.name}
              onChange={(e) => setPortfolioForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Provider/Institution"
              placeholder="e.g., Vanguard, Fidelity, TD Ameritrade"
              value={portfolioForm.provider}
              onChange={(e) => setPortfolioForm(prev => ({ ...prev, provider: e.target.value }))}
            />
            <Input
              label="Account Number (Optional)"
              placeholder="Last 4 digits for reference"
              value={portfolioForm.accountNumber}
              onChange={(e) => setPortfolioForm(prev => ({ ...prev, accountNumber: e.target.value }))}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddPortfolio(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePortfolio}
                disabled={!portfolioForm.name || !portfolioForm.provider}
              >
                Create Portfolio
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Investment Modal */}
        <Modal
          isOpen={showAddInvestment}
          onClose={() => setShowAddInvestment(false)}
          title="Add Investment"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={investmentForm.portfolioId}
                onChange={(e) => setInvestmentForm(prev => ({ ...prev, portfolioId: e.target.value }))}
              >
                <option value="">Select a portfolio</option>
                {enrichedPortfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Symbol/Ticker"
              placeholder="e.g., AAPL, VTI, BTC"
              value={investmentForm.symbol}
              onChange={(e) => setInvestmentForm(prev => ({ ...prev, symbol: e.target.value }))}
            />
            <Input
              label="Investment Name"
              placeholder="e.g., Apple Inc., Vanguard Total Stock Market ETF"
              value={investmentForm.name}
              onChange={(e) => setInvestmentForm(prev => ({ ...prev, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity/Shares"
                type="number"
                placeholder="100"
                value={investmentForm.quantity}
                onChange={(e) => setInvestmentForm(prev => ({ ...prev, quantity: e.target.value }))}
              />
              <Input
                label="Cost Basis per Share"
                type="number"
                placeholder="150.00"
                step="0.01"
                value={investmentForm.costBasis}
                onChange={(e) => setInvestmentForm(prev => ({ ...prev, costBasis: e.target.value }))}
              />
            </div>
            <Input
              label="Current Price per Share"
              type="number"
              placeholder="175.00"
              step="0.01"
              value={investmentForm.currentPrice}
              onChange={(e) => setInvestmentForm(prev => ({ ...prev, currentPrice: e.target.value }))}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddInvestment(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvestment}
                disabled={!investmentForm.portfolioId || !investmentForm.symbol || !investmentForm.name || !investmentForm.quantity || !investmentForm.costBasis || !investmentForm.currentPrice}
              >
                Add Investment
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}