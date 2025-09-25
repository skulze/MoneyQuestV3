'use client';

import React, { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('demo-login', {
        email: formData.email,
        password: formData.password,
        callbackUrl: callbackUrl
      });

      // If we get here and result exists, there was an error
      if (result?.error) {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
      // If signIn succeeds with callbackUrl, NextAuth handles the redirect automatically
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Sign in error:', err);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDemoLogin = (userType: string) => {
    const demoUsers = {
      free: { email: 'john@moneyquest.com', password: 'john123' },
      plus: { email: 'sarah@moneyquest.com', password: 'sarah123' },
      premium: { email: 'adam@moneyquest.com', password: 'adam123' }
    };

    const user = demoUsers[userType as keyof typeof demoUsers];
    if (user) {
      setFormData(user);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sign In
          </h1>
          <p className="text-gray-600">
            Welcome to MoneyQuestV3 - Sign in to your personal finance dashboard
          </p>
        </div>

        {/* Demo Users */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle level={5}>Demo Accounts</CardTitle>
            <CardDescription>Try different subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('free')}
                className="justify-start"
              >
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-400 rounded-full mr-3"></span>
                  John (Free Tier) - john@moneyquest.com
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('plus')}
                className="justify-start"
              >
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-400 rounded-full mr-3"></span>
                  Sarah (Plus $2.99) - sarah@moneyquest.com
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('premium')}
                className="justify-start"
              >
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-400 rounded-full mr-3"></span>
                  Adam (Premium $9.99) - adam@moneyquest.com
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials or use a demo account above
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                autocomplete="username"
                required
                disabled={isLoading}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                disabled={isLoading}
              />
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            What you'll get:
          </h3>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
            <span className="px-2 py-1 bg-white rounded-full shadow-sm">Transaction Splitting</span>
            <span className="px-2 py-1 bg-white rounded-full shadow-sm">Real-time Analytics</span>
            <span className="px-2 py-1 bg-white rounded-full shadow-sm">Budget Tracking</span>
            <span className="px-2 py-1 bg-white rounded-full shadow-sm">Local-first</span>
            <span className="px-2 py-1 bg-white rounded-full shadow-sm">GDPR Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}