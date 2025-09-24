# Stripe Integration Setup Guide

This guide will help you set up Stripe integration for the MoneyQuestV3 subscription system.

## Prerequisites

1. Create a Stripe account at https://dashboard.stripe.com
2. Complete your Stripe account setup (business details, etc.)

## Step 1: Get API Keys

1. Go to your Stripe Dashboard
2. Navigate to **Developers > API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Create Product and Prices

### Create Products

1. Go to **Products** in your Stripe Dashboard
2. Click **Add product**

**Plus Tier Product:**
- Name: `MoneyQuest Plus`
- Description: `Multi-user collaboration, OCR receipts, enhanced analytics`

**Premium Tier Product:**
- Name: `MoneyQuest Premium`
- Description: `Bank connections, automatic sync, advanced automation`

### Create Recurring Prices

For each product, add a recurring price:

**Plus Tier Price:**
- Price: `$2.99`
- Billing period: `Monthly`
- Copy the Price ID (starts with `price_`)

**Premium Tier Price:**
- Price: `$9.99`
- Billing period: `Monthly`
- Copy the Price ID (starts with `price_`)

## Step 3: Set up Webhooks

1. Go to **Developers > Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/subscriptions/webhook`
   - For local development: `https://your-ngrok-url.ngrok.io/api/subscriptions/webhook`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
   - `invoice.upcoming`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Update Environment Variables

Update your `.env.local` file with the values you copied:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Stripe Price IDs
STRIPE_PLUS_PRICE_ID=price_your_actual_plus_price_id
STRIPE_PREMIUM_PRICE_ID=price_your_actual_premium_price_id
```

## Step 5: Test the Integration

### Testing Checkout Flow

1. Start your development server: `npm run dev`
2. Navigate to `/pricing`
3. Click "Upgrade to Plus" or "Upgrade to Premium"
4. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any postal code

### Testing Webhooks (Local Development)

1. Install ngrok: `npm install -g ngrok`
2. Expose your local server: `ngrok http 3000`
3. Update your webhook endpoint URL to use the ngrok URL
4. Complete a test checkout to trigger webhooks
5. Check your server console for webhook processing logs

### Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0000 0000 3220`

## Step 6: Production Setup

When ready for production:

1. Switch to live mode in Stripe Dashboard
2. Create new products and prices in live mode
3. Update webhook endpoint to production URL
4. Update environment variables with live keys:
   - `pk_live_...` for publishable key
   - `sk_live_...` for secret key
   - New webhook secret from live webhook endpoint
   - Live price IDs

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Check that STRIPE_WEBHOOK_SECRET matches your webhook endpoint secret
   - Ensure raw body is being passed to verification (not JSON parsed)

2. **Price not found**
   - Verify STRIPE_PLUS_PRICE_ID and STRIPE_PREMIUM_PRICE_ID are correct
   - Make sure you're using the right mode (test/live)

3. **Invalid API key**
   - Check that STRIPE_SECRET_KEY is correct and matches your mode
   - Ensure no extra spaces or characters

### Debug Mode

Add this to see Stripe logs:
```env
STRIPE_LOG_LEVEL=debug
```

## Security Notes

- Never expose secret keys in client-side code
- Always use HTTPS for webhook endpoints in production
- Verify webhook signatures to ensure events come from Stripe
- Store sensitive data securely and encrypt user information

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)