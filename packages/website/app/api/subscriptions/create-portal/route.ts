import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { stripe } from '@/lib/stripe';

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

    // Find or create Stripe customer
    const customers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer if not found
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.email,
        },
      });
      customerId = customer.id;
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
    });

    return NextResponse.json({
      portalUrl: portalSession.url
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}