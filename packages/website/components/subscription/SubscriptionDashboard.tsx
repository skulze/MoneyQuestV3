import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Crown, Zap, Shield, ExternalLink, Calendar, CreditCard, Users, Database } from 'lucide-react';

export function SubscriptionDashboard() {
  const { subscription, isLoading, manageBilling, upgrade } = useSubscription();
  const [isManaging, setIsManaging] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Unable to load subscription information</p>
        </CardContent>
      </Card>
    );
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PREMIUM':
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 'PLUS':
        return <Zap className="w-8 h-8 text-purple-500" />;
      default:
        return <Shield className="w-8 h-8 text-blue-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PREMIUM':
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 'PLUS':
        return 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200';
      default:
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
    }
  };

  const handleManageBilling = async () => {
    setIsManaging(true);
    try {
      await manageBilling();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsManaging(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsageColor = (current: number, limit: number) => {
    if (limit === -1) return 'text-green-600';
    const usage = current / limit;
    if (usage >= 0.9) return 'text-red-600';
    if (usage >= 0.7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={`border-2 ${getTierColor(subscription.tier)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTierIcon(subscription.tier)}
              <div>
                <CardTitle className="text-xl">
                  {subscription.tierName} Plan
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {subscription.price === 0 ? (
                    'Free forever'
                  ) : (
                    <>
                      ${subscription.price}/month
                      {subscription.stripeSubscription?.cancelAtPeriodEnd && (
                        <span className="ml-2 text-red-600">(Cancelling)</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>

            {subscription.tier !== 'FREE' && (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isManaging}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isManaging ? 'Loading...' : 'Manage Billing'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Features */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
              <ul className="space-y-2">
                {subscription.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
                {subscription.features.length > 4 && (
                  <li className="text-sm text-gray-500">
                    +{subscription.features.length - 4} more features
                  </li>
                )}
              </ul>
            </div>

            {/* Billing Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
              {subscription.stripeSubscription ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="capitalize font-medium">
                      {subscription.stripeSubscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next billing:</span>
                    <span className="font-medium">
                      {formatDate(subscription.stripeSubscription.currentPeriodEnd)}
                    </span>
                  </div>
                  {subscription.stripeSubscription.cancelAtPeriodEnd && (
                    <div className="text-red-600 text-sm">
                      Your subscription will end on{' '}
                      {formatDate(subscription.stripeSubscription.currentPeriodEnd)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No billing information</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Usage & Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Users */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium">Users</span>
                </div>
                <span className={`text-sm ${getUsageColor(1, subscription.limits.users)}`}>
                  1 / {subscription.limits.users === -1 ? '∞' : subscription.limits.users}
                </span>
              </div>
              {subscription.limits.users > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${getUsagePercentage(1, subscription.limits.users)}%`
                    }}
                  ></div>
                </div>
              )}
            </div>

            {/* Accounts */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium">Accounts</span>
                </div>
                <span className={`text-sm ${getUsageColor(0, subscription.limits.accounts)}`}>
                  0 / {subscription.limits.accounts === -1 ? '∞' : subscription.limits.accounts}
                </span>
              </div>
              {subscription.limits.accounts > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${getUsagePercentage(0, subscription.limits.accounts)}%`
                    }}
                  ></div>
                </div>
              )}
            </div>

            {/* Budgets */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                  <span className="text-sm font-medium">Budgets</span>
                </div>
                <span className={`text-sm ${getUsageColor(0, subscription.limits.budgets)}`}>
                  0 / {subscription.limits.budgets === -1 ? '∞' : subscription.limits.budgets}
                </span>
              </div>
              {subscription.limits.budgets > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${getUsagePercentage(0, subscription.limits.budgets)}%`
                    }}
                  ></div>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-500 rounded mr-1" />
                  <span className="text-sm font-medium">Categories</span>
                </div>
                <span className={`text-sm ${getUsageColor(0, subscription.limits.categories)}`}>
                  0 / {subscription.limits.categories === -1 ? '∞' : subscription.limits.categories}
                </span>
              </div>
              {subscription.limits.categories > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${getUsagePercentage(0, subscription.limits.categories)}%`
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {subscription.tier !== 'PREMIUM' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscription.tier === 'FREE' && (
                <div className="p-4 border border-purple-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Zap className="w-5 h-5 text-purple-500 mr-2" />
                    <h4 className="font-medium">Plus Plan</h4>
                    <span className="ml-auto text-lg font-bold">$2.99/mo</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Multi-user support, OCR receipts, enhanced analytics
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => upgrade('PLUS')}
                  >
                    Upgrade to Plus
                  </Button>
                </div>
              )}

              <div className="p-4 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                  <h4 className="font-medium">Premium Plan</h4>
                  <span className="ml-auto text-lg font-bold">$9.99/mo</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Bank connections, automatic sync, advanced automation
                </p>
                <Button
                  className="w-full"
                  onClick={() => upgrade('PREMIUM')}
                >
                  Upgrade to Premium
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/pricing'}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}