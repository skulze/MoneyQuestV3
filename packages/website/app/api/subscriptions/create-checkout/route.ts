import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !['PLUS', 'PREMIUM'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

    // Check if Stripe is properly configured for production
    if (!stripe || !tierConfig.priceId ||
        tierConfig.priceId.startsWith('price_your_') ||
        tierConfig.priceId.includes('_demo') ||
        tierConfig.priceId.includes('_test_') && tierConfig.priceId.includes('_tier_')) {
      console.log('Demo mode: Stripe not configured or using placeholder/demo price IDs');
      return NextResponse.json({
        error: 'Demo Mode: Stripe not configured. Please set up valid Stripe price IDs in environment variables.',
        isDemoMode: true,
        tier: tier,
        price: tierConfig.price
      }, { status: 400 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.email,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: session.user.email,
          tier: tier,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}