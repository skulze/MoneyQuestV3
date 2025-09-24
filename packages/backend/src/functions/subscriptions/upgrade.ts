import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { prisma } from '../../lib/database';
import { extractUserFromEvent, createAuthResponse, AuthError } from '../../lib/auth';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

const upgradeSchema = z.object({
  tier: z.enum(['PLUS', 'PREMIUM'], {
    required_error: 'Subscription tier is required',
    invalid_type_error: 'Invalid subscription tier'
  }),
  priceId: z.string().min(1, 'Stripe price ID is required'),
  successUrl: z.string().url('Invalid success URL').optional(),
  cancelUrl: z.string().url('Invalid cancel URL').optional()
});

// Predefined price mappings for security
const ALLOWED_PRICES = {
  PLUS: {
    monthly: 'price_plus_monthly', // Replace with actual Stripe price IDs
    yearly: 'price_plus_yearly'
  },
  PREMIUM: {
    monthly: 'price_premium_monthly',
    yearly: 'price_premium_yearly'
  }
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Extract authenticated user
    const cognitoUser = await extractUserFromEvent(event);

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validatedData = upgradeSchema.parse(body);

    const { tier, priceId, successUrl, cancelUrl } = validatedData;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { cognitoId: cognitoUser.cognitoId }
    });

    if (!user) {
      return createAuthResponse(404, {
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Validate price ID against allowed prices for security
    const allowedPriceIds = Object.values(ALLOWED_PRICES[tier]);
    if (!allowedPriceIds.includes(priceId)) {
      return createAuthResponse(400, {
        error: {
          code: 'INVALID_PRICE_ID',
          message: 'Invalid price ID for selected tier'
        }
      });
    }

    // Check if user is already on this tier or higher
    if (user.subscriptionTier === tier ||
        (tier === 'PLUS' && user.subscriptionTier === 'PREMIUM')) {
      return createAuthResponse(400, {
        error: {
          code: 'ALREADY_SUBSCRIBED',
          message: `User is already subscribed to ${user.subscriptionTier} tier`
        }
      });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id.toString(),
          cognitoId: user.cognitoId
        }
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard?subscription=cancelled`,
      metadata: {
        userId: user.id.toString(),
        cognitoId: user.cognitoId,
        tier: tier
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          cognitoId: user.cognitoId,
          tier: tier
        }
      }
    });

    // Log the upgrade attempt
    console.log(`Upgrade attempt: User ${user.id} (${user.email}) requesting ${tier} tier`);

    return createAuthResponse(200, {
      message: 'Checkout session created successfully',
      sessionId: session.id,
      sessionUrl: session.url,
      tier: tier,
      priceId: priceId
    });

  } catch (error) {
    console.error('Subscription upgrade error:', error);

    if (error instanceof AuthError) {
      return createAuthResponse(error.statusCode, {
        error: {
          code: 'AUTH_ERROR',
          message: error.message
        }
      });
    }

    if (error instanceof z.ZodError) {
      return createAuthResponse(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors
        }
      });
    }

    if (error.type === 'StripeError') {
      return createAuthResponse(400, {
        error: {
          code: 'STRIPE_ERROR',
          message: error.message
        }
      });
    }

    return createAuthResponse(500, {
      error: {
        code: 'UPGRADE_FAILED',
        message: 'Failed to create checkout session'
      }
    });
  }
}