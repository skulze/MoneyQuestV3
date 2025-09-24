import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

// Subscription tiers and pricing
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Single user account',
      'Manual transaction entry',
      'Basic budgets and analytics',
      'Manual investment tracking',
      'PDF/Excel reports',
      'Up to 3 accounts'
    ],
    limits: {
      users: 1,
      accounts: 3,
      transactions: -1, // unlimited
      budgets: 5,
      categories: 20
    }
  },
  PLUS: {
    id: 'plus',
    name: 'Plus',
    price: 2.99,
    priceId: process.env.STRIPE_PLUS_PRICE_ID,
    features: [
      'Everything in Free',
      'Multi-user collaboration (up to 5 users)',
      'OCR receipt processing',
      'Enhanced investment analytics',
      'Priority sync and support',
      'Up to 5 accounts'
    ],
    limits: {
      users: 5,
      accounts: 5,
      transactions: -1, // unlimited
      budgets: 20,
      categories: 50
    }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Everything in Plus',
      'Automatic bank connections (Plaid)',
      'Real-time transaction sync',
      'Automatic investment sync',
      'Advanced automation rules',
      'Tax optimization features',
      'Professional integrations',
      'Up to 10 accounts'
    ],
    limits: {
      users: 10,
      accounts: 10,
      transactions: -1, // unlimited
      budgets: -1, // unlimited
      categories: -1 // unlimited
    }
  }
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Helper functions
export const getTierByPriceId = (priceId: string): SubscriptionTier | null => {
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.priceId === priceId) {
      return key as SubscriptionTier;
    }
  }
  return null;
};

export const canAccessFeature = (userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean => {
  const tierOrder = ['FREE', 'PLUS', 'PREMIUM'];
  const userIndex = tierOrder.indexOf(userTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return userIndex >= requiredIndex;
};

export const checkUsageLimit = (userTier: SubscriptionTier, resource: string, currentCount: number): boolean => {
  const limits = SUBSCRIPTION_TIERS[userTier].limits;
  const limit = limits[resource as keyof typeof limits];
  return limit === -1 || currentCount < limit;
};

export const getUpgradeMessage = (userTier: SubscriptionTier, requiredTier: SubscriptionTier): string => {
  if (requiredTier === 'PLUS') {
    return `This feature requires Plus subscription ($${SUBSCRIPTION_TIERS.PLUS.price}/month)`;
  }
  if (requiredTier === 'PREMIUM') {
    return `This feature requires Premium subscription ($${SUBSCRIPTION_TIERS.PREMIUM.price}/month)`;
  }
  return 'This feature requires a subscription upgrade';
};