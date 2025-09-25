# Stripe Integration Guide - MoneyQuestV3

## 🎯 Overview

This guide provides complete Stripe integration best practices for MoneyQuestV3's subscription-based personal finance application. Based on Vercel's official Next.js + TypeScript + Stripe example and Stripe's go-live checklist.

## 📋 Quick Setup Checklist

### ✅ Environment Configuration
```bash
# Required Environment Variables (.env.local)
STRIPE_SECRET_KEY=sk_test_...                           # Test: sk_test_*, Live: sk_*
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...          # Test: pk_test_*, Live: pk_*
STRIPE_WEBHOOK_SECRET=whsec_...                         # From Stripe CLI or Dashboard
STRIPE_PLUS_PRICE_ID=price_...                          # $2.99/month price ID
STRIPE_PREMIUM_PRICE_ID=price_...                       # $9.99/month price ID
```

### ✅ Test Cards (Development)
```bash
# Success: 4242424242424242 (any CVC + future date)
# 3D Secure: 4000002760003184
# Declined: 4000000000000002
# More: https://stripe.com/docs/testing
```

## 🏗️ Architecture Overview

### Current Implementation Status
- ✅ **Server-side Stripe instance**: `/lib/stripe.ts`
- ✅ **Client-side integration**: React Stripe.js
- ✅ **Subscription API**: `/api/subscriptions/status/route.ts`
- ✅ **Tier definitions**: Free/Plus/Premium with feature gating
- ⚠️ **Webhook handling**: Needs implementation
- ⚠️ **Checkout flow**: Needs implementation

### File Structure
```
lib/stripe.ts                          # Stripe client configuration
app/api/subscriptions/status/route.ts  # Subscription status API
hooks/useSubscription.ts                # Frontend subscription hook
components/billing/                     # Billing UI components (future)
app/api/webhooks/stripe/route.ts       # Webhook handler (future)
```

## 🔧 Implementation Guide

### 1. Stripe Client Setup (`/lib/stripe.ts`)

```typescript
import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Pin to specific version
    })
  : null;

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    );
  }
  return stripePromise;
};

// Subscription configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['Single user', 'Manual entry', 'Basic analytics'],
    limits: { users: 1, accounts: 3, transactions: -1 }
  },
  PLUS: {
    id: 'plus',
    name: 'Plus',
    price: 2.99,
    priceId: process.env.STRIPE_PLUS_PRICE_ID,
    features: ['Multi-user', 'OCR receipts', 'Enhanced analytics'],
    limits: { users: 5, accounts: 5, transactions: -1 }
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: ['Bank connections', 'Automation', 'Tax optimization'],
    limits: { users: 10, accounts: 10, transactions: -1 }
  }
} as const;
```

### 2. Subscription Status API (`/api/subscriptions/status/route.ts`)

**Current Implementation Issues:**
- ❌ Using placeholder Stripe keys causes API failures
- ❌ No proper error handling for Stripe API failures
- ❌ Performance degradation from failed API calls

**Improved Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    let subscriptionTier: string = 'FREE';

    // Demo logic with fallback
    if (session.user?.subscription) {
      subscriptionTier = session.user.subscription;
    } else if (userEmail.includes('plus')) {
      subscriptionTier = 'PLUS';
    } else if (userEmail.includes('premium')) {
      subscriptionTier = 'PREMIUM';
    }

    // Only call Stripe if we have valid keys
    let stripeSubscription = null;
    if (stripe && process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
      try {
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const subscriptions = await stripe.subscriptions.list({
            customer: customers.data[0].id,
            status: 'active',
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            stripeSubscription = subscriptions.data[0];
            // Update tier based on actual subscription
            const priceId = stripeSubscription.items.data[0]?.price.id;
            if (priceId === SUBSCRIPTION_TIERS.PLUS.priceId) {
              subscriptionTier = 'PLUS';
            } else if (priceId === SUBSCRIPTION_TIERS.PREMIUM.priceId) {
              subscriptionTier = 'PREMIUM';
            }
          }
        }
      } catch (stripeError) {
        console.warn('Stripe API call failed (using demo mode):', stripeError.message);
        // Continue with demo logic - don't let Stripe failures break the app
      }
    } else {
      console.log('Using demo mode - no valid Stripe keys configured');
    }

    const tierConfig = SUBSCRIPTION_TIERS[subscriptionTier as keyof typeof SUBSCRIPTION_TIERS];

    return NextResponse.json({
      tier: subscriptionTier,
      tierName: tierConfig.name,
      price: tierConfig.price,
      features: tierConfig.features,
      limits: tierConfig.limits,
      isActive: true,
      demoMode: !stripe || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_'),
      stripeSubscription: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      } : null,
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Webhook Implementation (Recommended)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Update user's subscription status in your database
  console.log('Subscription created:', subscription.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update user's subscription tier/status
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Downgrade user to free tier
  console.log('Subscription deleted:', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Confirm subscription is active
  console.log('Payment succeeded:', invoice.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - maybe send email notification
  console.log('Payment failed:', invoice.id);
}
```

### 4. Checkout Session Creation

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId, tier } = await request.json();

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: session.user.email,
      success_url: `${request.headers.get('origin')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
      metadata: {
        userId: session.user.id,
        tier: tier,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

## 🔐 Security Best Practices

### 1. API Key Management
- ✅ Use test keys (`sk_test_*`, `pk_test_*`) in development
- ✅ Use live keys (`sk_*`, `pk_*`) in production
- ✅ Store keys in environment variables, never in code
- ✅ Rotate keys regularly (especially before going live)

### 2. Webhook Security
```typescript
// Always verify webhook signatures
try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  // Invalid signature - reject the request
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

### 3. Error Handling
```typescript
// Graceful degradation when Stripe is unavailable
if (!stripe || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
  // Use demo mode or cached data
  return demoResponse;
}
```

## 🚀 Deployment Checklist

### Pre-Production
- [ ] Set API version to latest (`2023-10-16` or newer)
- [ ] Test with all test card scenarios
- [ ] Implement proper error handling for all API calls
- [ ] Verify webhook signatures
- [ ] Test subscription lifecycle (create/update/cancel)
- [ ] Ensure no test objects in production code

### Production
- [ ] Replace test keys with live keys
- [ ] Create live webhook endpoints
- [ ] Set up webhook monitoring/alerting
- [ ] Implement proper logging (without sensitive data)
- [ ] Subscribe to Stripe API announcements
- [ ] Test checkout flow end-to-end

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid API Key provided"
**Cause**: Using placeholder keys or malformed keys
**Solution**:
```bash
# Check your .env.local file
STRIPE_SECRET_KEY=sk_test_51...  # Must start with sk_test_ or sk_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...  # Must start with pk_test_ or pk_
```

### Issue 2: Performance degradation over time
**Cause**: Failed Stripe API calls causing retry loops
**Solution**: Implement graceful fallbacks and proper error handling

### Issue 3: Webhook signature verification failures
**Cause**: Request body manipulation by framework
**Solution**: Use raw body for signature verification

## 📊 MoneyQuestV3 Pricing Strategy

### Tier Structure
- **Free**: $0 - Single user, manual entry, basic features
- **Plus**: $2.99/month - Multi-user, OCR, enhanced analytics
- **Premium**: $9.99/month - Bank connections, automation, tax features

### Revenue Projections
- **Unit Economics**: 85-90% profit margins (PWA saves 30% App Store fees)
- **Target Mix**: 75% Free, 15% Plus, 10% Premium
- **LTV**: Plus $32.28, Premium $102.48

## 🔗 Useful Resources

- [Stripe Docs](https://stripe.com/docs)
- [Next.js + Stripe Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Webhook Best Practices](https://stripe.com/docs/webhooks#best-practices)
- [Go-Live Checklist](https://stripe.com/docs/get-started/checklist/go-live)

---

*Generated for MoneyQuestV3 - Last updated: September 2024*