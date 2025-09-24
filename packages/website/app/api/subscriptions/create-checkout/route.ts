import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      console.error('Stripe not configured - missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json();

    if (!tier || !['PLUS', 'PREMIUM'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    if (!tierConfig.priceId) {
      return NextResponse.json({ error: 'Price ID not configured' }, { status: 500 });
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