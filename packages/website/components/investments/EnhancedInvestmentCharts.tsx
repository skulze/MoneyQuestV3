import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { TrendingUp, PieChart, BarChart3, LineChart, Calendar, Target, Zap } from 'lucide-react';

interface InvestmentData {
  symbol: string;
  name: string;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  sector?: string;
  historicalData?: { date: string; value: number }[];
}

interface Props {
  investments: InvestmentData[];
  isVisible?: boolean;
}

export function EnhancedInvestmentCharts({ investments, isVisible = true }: Props) {
  const [activeChart, setActiveChart] = useState<'allocation' | 'performance' | 'trends' | 'heatmap'>('allocation');
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');

  // Mock data for demonstration
  const mockInvestments: InvestmentData[] = investments.length > 0 ? investments : [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currentValue: 18750,
      costBasis: 15000,
      gainLoss: 3750,
      gainLossPercent: 25,
      sector: 'Technology',
      historicalData: [
        { date: '2024-01', value: 15000 },
        { date: '2024-02', value: 15800 },
        { date: '2024-03', value: 16500 },
        { date: '2024-04', value: 17200 },
        { date: '2024-05', value: 17800 },
        { date: '2024-06', value: 18750 },
      ]
    },
    {
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      currentValue: 12400,
      costBasis: 11000,
      gainLoss: 1400,
      gainLossPercent: 12.7,
      sector: 'ETF',
      historicalData: [
        { date: '2024-01', value: 11000 },
        { date: '2024-02', value: 11200 },
        { date: '2024-03', value: 11600 },
        { date: '2024-04', value: 11900 },
        { date: '2024-05', value: 12100 },
        { date: '2024-06', value: 12400 },
      ]
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      currentValue: 8200,
      costBasis: 9500,
      gainLoss: -1300,
      gainLossPercent: -13.7,
      sector: 'Automotive',
      historicalData: [
        { date: '2024-01', value: 9500 },
        { date: '2024-02', value: 9200 },
        { date: '2024-03', value: 8800 },
        { date: '2024-04', value: 8400 },
        { date: '2024-05', value: 8100 },
        { date: '2024-06', value: 8200 },
      ]
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      currentValue: 15600,
      costBasis: 8000,
      gainLoss: 7600,
      gainLossPercent: 95,
      sector: 'Technology',
      historicalData: [
        { date: '2024-01', value: 8000 },
        { date: '2024-02', value: 10200 },
        { date: '2024-03', value: 12800 },
        { date: '2024-04', value: 14100 },
        { date: '2024-05', value: 15200 },
        { date: '2024-06', value: 15600 },
      ]
    }
  ];

  // Calculate sector allocation
  const sectorAllocation = mockInvestments.reduce((acc, inv) => {
    const sector = inv.sector || 'Other';
    acc[sector] = (acc[sector] || 0) + inv.currentValue;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = mockInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);

  // Performance metrics
  const topPerformers = mockInvestments
    .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
    .slice(0, 3);

  const worstPerformers = mockInvestments
    .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
    .slice(0, 3);

  if (!isVisible) return null;

  return (
    <FeatureGate feature="multiUser">
      <div className="space-y-6">
        {/* Enhanced Charts Header */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Plus Feature</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Enhanced Investment Analytics</h3>
                <p className="text-sm text-gray-600">
                  Advanced charting and portfolio insights available with Plus subscription
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">
                  ${totalValue.toLocaleString()}
                </div>
                <p className="text-sm text-purple-600">Total Portfolio Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interactive Charts</CardTitle>
              <div className="flex space-x-1">
                {[
                  { key: 'allocation', label: 'Allocation', icon: PieChart },
                  { key: 'performance', label: 'Performance', icon: BarChart3 },
                  { key: 'trends', label: 'Trends', icon: LineChart },
                  { key: 'heatmap', label: 'Heatmap', icon: Target }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={activeChart === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveChart(key as any)}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-1">
                {['1M', '3M', '6M', '1Y', 'ALL'].map((period) => (
                  <Button
                    key={period}
                    variant={timeframe === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeframe(period as any)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Chart Content */}
            <div className="min-h-[300px]">
              {activeChart === 'allocation' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sector Allocation Pie Chart Simulation */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Sector Allocation</h4>
                    <div className="relative">
                      {/* Simulated Pie Chart */}
                      <div className="w-48 h-48 mx-auto rounded-full border-8 border-gray-200 relative overflow-hidden">
                        {Object.entries(sectorAllocation).map(([sector, value], index) => {
                          const percentage = (value / totalValue) * 100;
                          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
                          return (
                            <div
                              key={sector}
                              className={`absolute inset-0 ${colors[index % colors.length]}`}
                              style={{
                                clipPath: `polygon(50% 50%, 50% 0%, ${50 + percentage/2}% 0%, ${50 + percentage}% 50%)`
                              }}
                            />
                          );
                        })}
                        <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold">${(totalValue/1000).toFixed(0)}K</div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Legend */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(sectorAllocation).map(([sector, value], index) => {
                        const percentage = (value / totalValue) * 100;
                        const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
                        return (
                          <div key={sector} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                              <span className="text-sm text-gray-700">{sector}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{percentage.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">${value.toLocaleString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'performance' && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Performance Comparison</h4>

                  {/* Simulated Bar Chart */}
                  <div className="space-y-4">
                    {mockInvestments.map((inv, index) => (
                      <div key={inv.symbol} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{inv.symbol}</span>
                          <span className={`text-sm font-medium ${inv.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {inv.gainLossPercent >= 0 ? '+' : ''}{inv.gainLossPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              inv.gainLossPercent >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.min(Math.abs(inv.gainLossPercent), 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeChart === 'trends' && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Portfolio Trends ({timeframe})</h4>

                  {/* Simulated Line Chart */}
                  <div className="relative h-64 bg-gray-50 rounded-lg p-4">
                    <div className="absolute inset-4 border-l-2 border-b-2 border-gray-300">
                      <div className="relative w-full h-full">
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 gap-0">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="border-r border-t border-gray-200 border-opacity-50" />
                          ))}
                        </div>

                        {/* Trend line simulation */}
                        <svg className="absolute inset-0 w-full h-full">
                          <path
                            d="M 0,80% L 20%,60% L 40%,45% L 60%,30% L 80%,20% L 100%,15%"
                            stroke="#10b981"
                            strokeWidth="3"
                            fill="none"
                            className="drop-shadow-sm"
                          />
                          <path
                            d="M 0,70% L 20%,65% L 40%,55% L 60%,50% L 80%,45% L 100%,40%"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray="5,5"
                          />
                        </svg>

                        <div className="absolute bottom-0 left-0 text-xs text-gray-600">
                          Portfolio Growth Trend
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trend Legend */}
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-0.5 bg-green-500" />
                      <span>Total Value</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-0.5 bg-blue-500 border-dashed" />
                      <span>Benchmark</span>
                    </div>
                  </div>
                </div>
              )}

              {activeChart === 'heatmap' && (
                <div className="space-y-6">
                  <h4 className="font-medium text-gray-900">Performance Heatmap</h4>

                  {/* Performance Heatmap Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockInvestments.map((inv) => {
                      const getHeatColor = (percent: number) => {
                        if (percent >= 20) return 'bg-green-500 text-white';
                        if (percent >= 10) return 'bg-green-300 text-green-900';
                        if (percent >= 0) return 'bg-yellow-200 text-yellow-900';
                        if (percent >= -10) return 'bg-orange-300 text-orange-900';
                        return 'bg-red-500 text-white';
                      };

                      return (
                        <div
                          key={inv.symbol}
                          className={`p-4 rounded-lg text-center ${getHeatColor(inv.gainLossPercent)}`}
                        >
                          <div className="font-bold text-lg">{inv.symbol}</div>
                          <div className="text-sm opacity-90">
                            {inv.gainLossPercent >= 0 ? '+' : ''}{inv.gainLossPercent.toFixed(1)}%
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            ${inv.currentValue.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex justify-center items-center space-x-4 text-xs">
                    <span>Performance:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span>&lt;-10%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-orange-300 rounded" />
                      <span>-10-0%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-yellow-200 rounded" />
                      <span>0-10%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-green-300 rounded" />
                      <span>10-20%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span>&gt;20%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top & Bottom Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top & Bottom Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-3">🎯 Top Performers</h4>
                  <div className="space-y-2">
                    {topPerformers.map((inv) => (
                      <div key={inv.symbol} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{inv.symbol}</span>
                        <span className="text-sm text-green-600 font-medium">
                          +{inv.gainLossPercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-3">📉 Bottom Performers</h4>
                  <div className="space-y-2">
                    {worstPerformers.map((inv) => (
                      <div key={inv.symbol} className="flex justify-between items-center">
                        <span className="text-sm font-medium">{inv.symbol}</span>
                        <span className="text-sm text-red-600 font-medium">
                          {inv.gainLossPercent.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Risk & Diversification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Portfolio Volatility</span>
                  <span className="text-sm font-medium">Medium (15.3%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sharpe Ratio</span>
                  <span className="text-sm font-medium">1.24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Max Drawdown</span>
                  <span className="text-sm font-medium text-red-600">-8.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Diversification Score</span>
                  <span className="text-sm font-medium text-green-600">Good (7.2/10)</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Your portfolio shows good diversification across sectors</p>
                    <p>• Consider rebalancing if any position exceeds 20%</p>
                    <p>• Risk-adjusted returns are above market average</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureGate>
  );
}