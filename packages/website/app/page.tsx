'use client';

import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, StatCard, Modal, Input, CurrencyInput, SearchInput } from '@/components/ui';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currencyValue, setCurrencyValue] = useState(0);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MoneyQuestV3
          </h1>
          <p className="text-lg text-gray-600">
            Local-first personal finance with transaction splitting and real-time analytics
          </p>
        </div>

        {/* Component Demo Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            UI Component Library Demo
          </h2>

          {/* Button Examples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Button Components</CardTitle>
              <CardDescription>Various button styles and states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="md">Secondary</Button>
                <Button variant="outline" size="lg">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex gap-4">
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
                <Button onClick={() => setShowModal(true)}>Open Modal</Button>
              </div>
            </CardContent>
          </Card>

          {/* Input Examples */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Input Components</CardTitle>
              <CardDescription>Different input types for various use cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Input
                  label="Basic Input"
                  placeholder="Enter text..."
                  helperText="This is a helper text"
                />
                <CurrencyInput
                  value={currencyValue}
                  onChange={setCurrencyValue}
                  placeholder="0.00"
                  currencySymbol="$"
                />
                <SearchInput
                  label="Search Transactions"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClear={() => setSearchValue('')}
                />
              </div>
              <div className="mt-6">
                <Input
                  label="Input with Error"
                  placeholder="Enter email..."
                  error="Please enter a valid email address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Balance"
              value="$12,450.00"
              subtitle="Across 3 accounts"
              trend={{ value: 12.5, isPositive: true }}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
            <StatCard
              title="Monthly Spending"
              value="$2,340.50"
              subtitle="This month"
              trend={{ value: 8.2, isPositive: false }}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
            />
            <StatCard
              title="Budget Progress"
              value="73%"
              subtitle="$1,825 / $2,500"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v10" />
                </svg>
              }
            />
            <StatCard
              title="Transactions"
              value="127"
              subtitle="This month"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="elevated" className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle level={4}>Transaction Splitting</CardTitle>
              <CardDescription>
                Split any transaction across multiple spending categories for precise tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-blue-600">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">Advanced Splitting</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle level={4}>Real-Time Analytics</CardTitle>
              <CardDescription>
                Get instant insights with client-side analytics and beautiful charts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-600">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v10" />
                </svg>
                <span className="text-sm font-medium">Live Charts</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle level={4}>Budget Management</CardTitle>
              <CardDescription>
                Set budgets per category with real-time progress tracking and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-purple-600">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                <span className="text-sm font-medium">Smart Budgets</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle level={4}>GDPR Compliant</CardTitle>
              <CardDescription>
                Enterprise-grade privacy controls and security standards built-in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-red-600">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Privacy First</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Demo Modal"
          description="This is a demo of the modal component with various features."
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              This modal demonstrates the accessible modal component with backdrop, ESC key handling, and focus management.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowModal(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Take Control of Your Finances?
            </h3>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Start with our free tier and experience the power of local-first personal finance management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = '/auth/signin'}>
                Try Demo Login
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/auth/signin'}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Built with Modern Technology
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="px-3 py-1 bg-white rounded-full shadow">Next.js 14</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">TypeScript</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Tailwind CSS</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">IndexedDB</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Local-First</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">Dexie.js</span>
            <span className="px-3 py-1 bg-white rounded-full shadow">NextAuth</span>
          </div>
        </div>
      </div>
    </main>
  );
}