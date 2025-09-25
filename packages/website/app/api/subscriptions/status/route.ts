import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For demo purposes, we'll derive subscription from the session
    // In production, this would query your database
    const userEmail = session.user.email;
    let subscriptionTier: string = 'FREE';

    // Demo logic: determine tier based on email domain or stored session data
    if (session.user?.subscription) {
      subscriptionTier = session.user.subscription;
    } else {
      // Fallback logic for demo
      if (userEmail.includes('plus')) {
        subscriptionTier = 'PLUS';
      } else if (userEmail.includes('premium')) {
        subscriptionTier = 'PREMIUM';
      }
    }

    // Try to get actual Stripe subscription if available and properly configured
    let stripeSubscription = null;
    let isDemoMode = true;

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
            const priceId = stripeSubscription.items.data[0]?.price.id;

            // Update tier based on actual Stripe subscription
            if (priceId === SUBSCRIPTION_TIERS.PLUS.priceId) {
              subscriptionTier = 'PLUS';
            } else if (priceId === SUBSCRIPTION_TIERS.PREMIUM.priceId) {
              subscriptionTier = 'PREMIUM';
            }
            isDemoMode = false;
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
      demoMode: isDemoMode,
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