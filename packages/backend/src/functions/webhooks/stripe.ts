import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { prisma } from '../../lib/database';
import { createAuthResponse } from '../../lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return createAuthResponse(400, { error: 'Missing signature or secret' });
    }

    // Verify webhook signature
    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return createAuthResponse(400, { error: 'Invalid signature' });
    }

    console.log(`Processing Stripe webhook: ${stripeEvent.type}`);

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return createAuthResponse(200, { received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return createAuthResponse(500, { error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const { userId, tier } = session.metadata || {};

    if (!userId || !tier) {
      console.error('Missing metadata in checkout session');
      return;
    }

    console.log(`Checkout completed: User ${userId} upgrading to ${tier}`);

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    // Update user subscription in database
    const expiresAt = new Date(subscription.current_period_end * 1000);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionTier: tier as 'PLUS' | 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date()
      }
    });

    console.log(`Successfully upgraded user ${userId} to ${tier} tier`);

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const { userId, tier } = subscription.metadata || {};

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    const expiresAt = new Date(subscription.current_period_end * 1000);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionTier: tier as 'PLUS' | 'PREMIUM' || 'PLUS',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date()
      }
    });

    console.log(`Subscription created for user ${userId}: ${subscription.id}`);

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { userId } = subscription.metadata || {};

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    const expiresAt = new Date(subscription.current_period_end * 1000);
    let status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

    switch (subscription.status) {
      case 'active':
        status = 'ACTIVE';
        break;
      case 'canceled':
        status = 'CANCELLED';
        break;
      case 'past_due':
      case 'unpaid':
        status = 'EXPIRED';
        break;
      default:
        status = 'ACTIVE';
    }

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      }
    });

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const { userId } = subscription.metadata || {};

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Downgrade user to free tier
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionTier: 'FREE',
        subscriptionStatus: 'CANCELLED',
        subscriptionExpiresAt: null,
        stripeSubscriptionId: null,
        updatedAt: new Date()
      }
    });

    console.log(`Subscription cancelled for user ${userId}, downgraded to FREE tier`);

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const { userId } = subscription.metadata || {};

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Update subscription expiration date
    const expiresAt = new Date(subscription.current_period_end * 1000);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      }
    });

    console.log(`Payment succeeded for user ${userId}, subscription renewed until ${expiresAt}`);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const { userId } = subscription.metadata || {};

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Mark subscription as past due
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        subscriptionStatus: 'EXPIRED',
        updatedAt: new Date()
      }
    });

    console.log(`Payment failed for user ${userId}, subscription marked as expired`);

    // TODO: Send notification to user about failed payment

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}