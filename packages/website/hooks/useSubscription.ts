import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Import types and utilities without initializing Stripe
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

const canAccessFeature = (currentTier: string, requiredTier: string): boolean => {
  const tierOrder = ['FREE', 'PLUS', 'PREMIUM'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return currentIndex >= requiredIndex;
};

const checkUsageLimit = (tier: string, resource: string, currentCount: number): boolean => {
  const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  if (!tierConfig) return false;
  const limit = tierConfig.limits[resource as keyof typeof tierConfig.limits];
  return currentCount < limit;
};

const getUpgradeMessage = (currentTier: string, requiredTier: string): string => {
  if (requiredTier === 'PLUS') {
    return 'Upgrade to Plus ($2.99/month) to access this feature';
  }
  if (requiredTier === 'PREMIUM') {
    return 'Upgrade to Premium ($9.99/month) to access this feature';
  }
  return 'Please upgrade to access this feature';
};

export interface SubscriptionStatus {
  tier: 'FREE' | 'PLUS' | 'PREMIUM';
  tierName: string;
  price: number;
  features: string[];
  limits: {
    users: number;
    accounts: number;
    transactions: number;
    budgets: number;
    categories: number;
  };
  isActive: boolean;
  stripeSubscription?: {
    id: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
}

export interface UseSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;

  // Feature access checks
  canAccess: (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM') => boolean;
  canUseFeature: (feature: 'multiUser' | 'ocrReceipts' | 'prioritySync' | 'enhancedInvestments' | 'bankConnections' | 'investmentSync') => boolean;

  // Usage limit checks
  canAddResource: (resource: 'users' | 'accounts' | 'budgets' | 'categories', currentCount: number) => boolean;
  getResourceLimit: (resource: 'users' | 'accounts' | 'budgets' | 'categories') => number;

  // Upgrade helpers
  getUpgradeMessage: (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM') => string;
  needsUpgrade: (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM') => boolean;

  // Actions
  refresh: () => Promise<void>;
  upgrade: (tier: 'PLUS' | 'PREMIUM') => Promise<void>;
  manageBilling: () => Promise<void>;
}

const FEATURE_TIER_MAP = {
  multiUser: 'PLUS',
  ocrReceipts: 'PLUS',
  prioritySync: 'PLUS',
  enhancedInvestments: 'PLUS',
  bankConnections: 'PREMIUM',
  investmentSync: 'PREMIUM',
} as const;

export function useSubscription(): UseSubscriptionReturn {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!session?.user?.email) {
      // Default to free tier for unauthenticated users
      setSubscription({
        tier: 'FREE',
        tierName: 'Free',
        price: 0,
        features: SUBSCRIPTION_TIERS.FREE.features,
        limits: SUBSCRIPTION_TIERS.FREE.limits,
        isActive: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/subscriptions/status');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError('Failed to load subscription status');

      // Fallback to free tier
      setSubscription({
        tier: 'FREE',
        tierName: 'Free',
        price: 0,
        features: SUBSCRIPTION_TIERS.FREE.features,
        limits: SUBSCRIPTION_TIERS.FREE.limits,
        isActive: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [session?.user?.email]);

  const canAccess = (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM'): boolean => {
    if (!subscription) return false;
    return canAccessFeature(subscription.tier, requiredTier);
  };

  const canUseFeature = (feature: keyof typeof FEATURE_TIER_MAP): boolean => {
    const requiredTier = FEATURE_TIER_MAP[feature];
    return canAccess(requiredTier);
  };

  const canAddResource = (resource: 'users' | 'accounts' | 'budgets' | 'categories', currentCount: number): boolean => {
    if (!subscription) return false;
    return checkUsageLimit(subscription.tier, resource, currentCount);
  };

  const getResourceLimit = (resource: 'users' | 'accounts' | 'budgets' | 'categories'): number => {
    if (!subscription) return SUBSCRIPTION_TIERS.FREE.limits[resource];
    return subscription.limits[resource];
  };

  const needsUpgrade = (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM'): boolean => {
    return !canAccess(requiredTier);
  };

  const getUpgradeMessageForTier = (requiredTier: 'FREE' | 'PLUS' | 'PREMIUM'): string => {
    if (!subscription) return 'Please sign in to access this feature';
    return getUpgradeMessage(subscription.tier, requiredTier);
  };

  const upgrade = async (tier: 'PLUS' | 'PREMIUM') => {
    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } else {
        // Handle demo mode gracefully
        const errorData = await response.text().catch(() => '{}');
        console.log('Demo mode: Upgrade to', tier, 'requested');
        throw new Error(`Demo Mode: Stripe not configured. Would upgrade to ${tier} ($${SUBSCRIPTION_TIERS[tier].price}/month)`);
      }
    } catch (err) {
      console.error('Error starting upgrade:', err);
      throw err;
    }
  };

  const manageBilling = async () => {
    try {
      const response = await fetch('/api/subscriptions/create-portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { portalUrl } = await response.json();
        window.location.href = portalUrl;
      } else {
        // Handle demo mode gracefully
        console.log('Demo mode: Billing management requested');
        throw new Error('Demo Mode: Stripe not configured. Would open billing portal');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      throw err;
    }
  };

  const refresh = async () => {
    setIsLoading(true);
    await fetchSubscriptionStatus();
  };

  return {
    subscription,
    isLoading,
    error,
    canAccess,
    canUseFeature,
    canAddResource,
    getResourceLimit,
    getUpgradeMessage: getUpgradeMessageForTier,
    needsUpgrade,
    refresh,
    upgrade,
    manageBilling,
  };
}