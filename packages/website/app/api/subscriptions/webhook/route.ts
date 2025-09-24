import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, getTierByPriceId } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe not configured - missing STRIPE_SECRET_KEY');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = headers().get('stripe-signature') as string;

  if (!signature) {
    console.error('Missing Stripe signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`📥 Processing webhook event: ${event.type} [${event.id}]`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

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
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // Additional important events
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.upcoming':
        await handleUpcomingInvoice(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log(`✅ Successfully processed webhook event: ${event.type} [${event.id}]`);
    return NextResponse.json({ received: true, eventId: event.id });
  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type} [${event.id}]:`, error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      eventId: event.id,
      eventType: event.type
    }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`);

  // Here you would update your database with the subscription info
  // For now, we'll just log the event
  // In a full implementation, you'd:
  // 1. Update user record with new subscription tier
  // 2. Set subscription status to active
  // 3. Update feature access permissions
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierByPriceId(priceId);

  console.log(`Subscription created for user ${userId}, tier: ${tier}`);

  // Update database with subscription details
  // await updateUserSubscription({
  //   userId,
  //   stripeCustomerId: customerId,
  //   stripeSubscriptionId: subscription.id,
  //   tier,
  //   status: subscription.status,
  //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierByPriceId(priceId);

  console.log(`Subscription updated for user ${userId}, tier: ${tier}, status: ${subscription.status}`);

  // Update database with new subscription details
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  console.log(`Subscription cancelled for user ${userId}`);

  // Update user to free tier
  // await updateUserSubscription({
  //   userId,
  //   tier: 'FREE',
  //   status: 'cancelled',
  //   cancelledAt: new Date(),
  // });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  console.log(`Payment succeeded for subscription ${subscriptionId}`);

  // Update subscription status and period
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  console.log(`Payment failed for subscription ${subscriptionId}`);

  // Handle failed payment - maybe send notification or update status
  // In a full implementation, you'd:
  // 1. Update subscription status to past_due
  // 2. Send payment failure notification email
  // 3. Track failed payment in analytics
  // 4. Potentially suspend account access based on retry attempts
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata for trial ending');
    return;
  }

  const trialEndDate = new Date(subscription.trial_end! * 1000);
  console.log(`Trial ending soon for user ${userId}, ends on ${trialEndDate.toISOString()}`);

  // Handle trial ending soon
  // In a full implementation, you'd:
  // 1. Send trial ending notification email
  // 2. Show in-app prompts to upgrade
  // 3. Track conversion opportunity
  // 4. Potentially offer special pricing
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  if (!subscriptionId) return;

  const amountDue = invoice.amount_due / 100; // Convert from cents
  const periodStart = new Date(invoice.period_start * 1000);
  const periodEnd = new Date(invoice.period_end * 1000);

  console.log(`Upcoming invoice for subscription ${subscriptionId}: $${amountDue} due on ${new Date(invoice.period_end * 1000).toISOString()}`);

  // Handle upcoming invoice
  // In a full implementation, you'd:
  // 1. Send upcoming payment notification email
  // 2. Check for payment method issues
  // 3. Update billing preview in dashboard
  // 4. Track billing cycle analytics
}