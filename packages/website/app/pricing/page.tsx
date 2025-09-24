'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

// Define subscription tiers directly here
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Manual transaction entry',
      'Basic budgeting',
      'Local data storage',
      'PDF/Excel reports',
      'Up to 3 accounts'
    ],
    limits: {
      users: 1,
      accounts: 3,
      transactions: 1000,
      budgets: 5,
      categories: 20
    }
  },
  PLUS: {
    name: 'Plus',
    price: 2.99,
    features: [
      'Everything in Free',
      'Multi-user collaboration',
      'OCR receipt processing',
      'Enhanced analytics',
      'Up to 5 accounts',
      'Priority support'
    ],
    limits: {
      users: 5,
      accounts: 5,
      transactions: 10000,
      budgets: 20,
      categories: 50
    }
  },
  PREMIUM: {
    name: 'Premium',
    price: 9.99,
    features: [
      'Everything in Plus',
      'Bank account connections',
      'Automatic transaction import',
      'Investment account sync',
      'Advanced automation',
      'Tax optimization',
      'Unlimited accounts'
    ],
    limits: {
      users: 10,
      accounts: 999,
      transactions: 999999,
      budgets: 999,
      categories: 999
    }
  }
} as const;

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { subscription, isLoading: subscriptionLoading, upgrade, manageBilling } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/pricing');
      return;
    }

    if (tier === 'FREE' || subscription?.tier === tier) {
      return;
    }

    setIsLoading(true);
    setLoadingTier(tier);

    try {
      await upgrade(tier as 'PLUS' | 'PREMIUM');
    } catch (error) {
      console.error('Error upgrading:', error);
      // Show error message to user
      alert('Failed to start upgrade process. Please try again.');
    }

    setIsLoading(false);
    setLoadingTier(null);
  };

  const handleManageBilling = async () => {
    setIsLoading(true);

    try {
      await manageBilling();
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    }

    setIsLoading(false);
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'FREE':
        return <Shield className="w-8 h-8 text-blue-500" />;
      case 'PLUS':
        return <Zap className="w-8 h-8 text-purple-500" />;
      case 'PREMIUM':
        return <Crown className="w-8 h-8 text-yellow-500" />;
      default:
        return <Shield className="w-8 h-8 text-blue-500" />;
    }
  };

  const isCurrentTier = (tierId: string) => subscription?.tier === tierId;
  const isUpgrade = (tierId: string) => {
    if (!subscription) return true;
    const tierOrder = ['FREE', 'PLUS', 'PREMIUM'];
    const currentIndex = tierOrder.indexOf(subscription.tier);
    const targetIndex = tierOrder.indexOf(tierId);
    return targetIndex > currentIndex;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your MoneyQuest Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Local-first personal finance with powerful features for everyone
          </p>

          {subscription && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Current Plan: {subscription.tierName}
              {subscription.price > 0 && (
                <span className="ml-2">${subscription.price}/month</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Object.entries(SUBSCRIPTION_TIERS).map(([tierId, tier]) => (
            <Card
              key={tierId}
              className={`relative ${
                isCurrentTier(tierId)
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200'
              } ${
                tierId === 'PLUS' ? 'transform scale-105 shadow-xl' : ''
              }`}
            >
              {tierId === 'PLUS' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getTierIcon(tierId)}
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {tier.price === 0 ? (
                    'Free'
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">$</span>
                      {tier.price}
                      <span className="text-sm text-gray-500">/month</span>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {session?.user ? (
                  isCurrentTier(tierId) ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageBilling}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Manage Billing'}
                    </Button>
                  ) : tierId === 'FREE' ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade Not Available
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tierId)}
                      disabled={isLoading || loadingTier === tierId}
                    >
                      {loadingTier === tierId ? (
                        'Processing...'
                      ) : isUpgrade(tierId) ? (
                        `Upgrade to ${tier.name}`
                      ) : (
                        `Switch to ${tier.name}`
                      )}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(tierId)}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Features</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Plus</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 text-gray-700">Users</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.FREE.limits.users}</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.PLUS.limits.users}</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.PREMIUM.limits.users}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Accounts</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.FREE.limits.accounts}</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.PLUS.limits.accounts}</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.PREMIUM.limits.accounts}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Budgets</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.FREE.limits.budgets}</td>
                  <td className="py-3 px-4 text-center">{SUBSCRIPTION_TIERS.PLUS.limits.budgets}</td>
                  <td className="py-3 px-4 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">OCR Receipt Processing</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">✅</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Bank Connections</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">❌</td>
                  <td className="py-3 px-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Investment Sync</td>
                  <td className="py-3 px-4 text-center">Manual</td>
                  <td className="py-3 px-4 text-center">Manual</td>
                  <td className="py-3 px-4 text-center">Automatic</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes, you can cancel your subscription at any time from the billing portal. You'll continue to have access to paid features until the end of your current billing period.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What happens to my data if I cancel?</h3>
                <p className="text-gray-600">Your data is stored locally on your device and remains yours. You can continue using the free features, and all your data will remain intact.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
                <p className="text-gray-600">Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}