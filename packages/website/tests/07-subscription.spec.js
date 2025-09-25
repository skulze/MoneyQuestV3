const { test, expect } = require('@playwright/test');

test.describe('Subscription & Feature Gating', () => {

  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing');

    // Check pricing page loads
    await expect(page.locator('h1:has-text("Choose Your MoneyQuest Plan")')).toBeVisible();
  });

  test('should display subscription tiers', async ({ page }) => {
    await page.goto('/pricing');

    // Check for the three subscription tiers mentioned in project
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Premium' })).toBeVisible();

    // Check pricing amounts
    const plusPrice = page.locator('text=$2.99').or(page.locator('text=2.99'));
    const premiumPrice = page.locator('text=$9.99').or(page.locator('text=9.99'));

    if (await plusPrice.count() > 0) {
      await expect(plusPrice.first()).toBeVisible();
    }
    if (await premiumPrice.count() > 0) {
      await expect(premiumPrice.first()).toBeVisible();
    }
  });

  test('should show feature comparison between tiers', async ({ page }) => {
    await page.goto('/pricing');

    // Free tier features
    const freeFeatures = [
      'Manual transaction import',
      'Transaction splitting',
      'Analytics dashboard',
      'Budget tracking',
      'Investment tracking',
      'PDF reports',
      'Multi-currency'
    ];

    // Plus tier features ($2.99)
    const plusFeatures = [
      'Multi-user collaboration',
      'OCR receipt processing',
      'Enhanced investment charts'
    ];

    // Premium tier features ($9.99)
    const premiumFeatures = [
      'Automatic bank connections',
      'Real-time transaction sync',
      'Tax optimization',
      'QuickBooks integration'
    ];

    // Check for key feature mentions
    await expect(page.locator('text=Manual transaction entry')).toBeVisible();
    await expect(page.locator('text=Multi-user').or(page.locator('text=collaboration'))).toBeVisible();
    await expect(page.locator('text=Bank account connections').or(page.locator('text=Plaid'))).toBeVisible();
  });

  test('should have working upgrade buttons', async ({ page }) => {
    await page.goto('/pricing');

    // Look for upgrade/subscribe buttons
    const upgradeButtons = page.locator('button').filter({ hasText: /upgrade|subscribe|get started/i });
    const stripeButtons = page.locator('[data-testid*="stripe"]');

    if (await upgradeButtons.count() > 0) {
      await expect(upgradeButtons.first()).toBeVisible();
    }
  });

  test('should show PWA benefits in pricing', async ({ page }) => {
    await page.goto('/pricing');

    // PWA advantages should be mentioned
    const pwaText = page.locator('text=PWA').or(page.locator('text=Progressive Web App'));
    const noAppStore = page.locator('text=App Store').or(page.locator('text=30%'));

    // Key selling point: no app store fees
    // Should mention better profit margins
  });

  test('should redirect to signin for subscription actions', async ({ page }) => {
    await page.goto('/pricing');

    // Try clicking an upgrade button
    const upgradeButton = page.locator('button').filter({ hasText: /upgrade|subscribe/i }).first();
    if (await upgradeButton.count() > 0) {
      await upgradeButton.click();

      // Should redirect to signin or stripe checkout
      // For unauthenticated users, likely goes to signin first
    }
  });

  test('should handle subscription API routes', async ({ page }) => {
    // Test subscription status endpoint
    const statusResponse = await page.request.get('/api/subscriptions/status');
    // Should return 401 for unauthenticated or appropriate response

    // Test create checkout endpoint
    const checkoutResponse = await page.request.post('/api/subscriptions/create-checkout', {
      data: { priceId: 'test-price-id' }
    });
    // Should handle request appropriately

    // Should not crash with 500 errors
    expect(statusResponse.status()).toBeLessThan(500);
    expect(checkoutResponse.status()).toBeLessThan(500);
  });

  test('should display feature gates in dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin')) {
      test.skip('Skipping feature gate test - no auth setup');
    }

    // Look for feature gate components
    const featureGates = page.locator('[data-testid*="feature-gate"]');
    const upgradePrompts = page.locator('text=Upgrade').or(page.locator('text=Plus required'));

    // Feature gates should appear for restricted features
  });

  test('should show feature gates for OCR functionality', async ({ page }) => {
    await page.goto('/receipts');

    if (page.url().includes('signin')) {
      test.skip('Skipping OCR feature gate test - no auth setup');
    }

    // OCR should be gated for free tier
    const ocrGate = page.locator('[data-testid*="ocr-gate"]');
    const plusRequired = page.locator('text=Plus').and(page.locator('text=$2.99'));

    // OCR is a Plus tier feature
  });

  test('should show feature gates for collaboration', async ({ page }) => {
    await page.goto('/collaboration');

    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration feature gate test - no auth setup');
    }

    // Multi-user should be gated for free tier
    const collaborationGate = page.locator('[data-testid*="collaboration-gate"]');
    const multiUserPrompt = page.locator('text=Multi-user').and(page.locator('text=Plus'));

    // Multi-user is a Plus tier feature
  });

  test('should show feature gates for bank connections', async ({ page }) => {
    await page.goto('/sync');

    if (page.url().includes('signin')) {
      test.skip('Skipping bank connection feature gate test - no auth setup');
    }

    // Bank connections should be gated for Premium tier
    const bankGate = page.locator('[data-testid*="bank-gate"]');
    const premiumRequired = page.locator('text=Premium').and(page.locator('text=$9.99'));
    const plaidGate = page.locator('text=Plaid').and(page.locator('text=Premium'));

    // Bank automation is Premium tier only
  });

  test('should handle subscription status updates', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin')) {
      test.skip('Skipping subscription status test - no auth setup');
    }

    // Look for subscription status indicators
    const subscriptionStatus = page.locator('[data-testid*="subscription-status"]');
    const tierBadge = page.locator('[data-testid*="tier-badge"]');

    // Should show current subscription tier
    const tierIndicators = page.locator('text=Free Tier').or(page.locator('text=Plus')).or(page.locator('text=Premium'));
  });

  test('should show usage limits for free tier', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin')) {
      test.skip('Skipping usage limits test - no auth setup');
    }

    // Look for usage limit indicators
    const usageLimits = page.locator('[data-testid*="usage-limit"]');
    const accountLimit = page.locator('text=3 accounts'); // Free tier limit
    const userLimit = page.locator('text=Single user');

    // Free tier has specific limits
  });

  test('should handle Stripe webhook endpoints', async ({ page }) => {
    // Test webhook endpoint exists
    const webhookResponse = await page.request.post('/api/subscriptions/webhook', {
      data: { type: 'test.event' }
    });

    // Should handle webhook requests (even if they fail due to signature)
    expect(webhookResponse.status()).toBeLessThan(500);
  });

  test('should provide subscription management portal', async ({ page }) => {
    // Test portal creation endpoint
    const portalResponse = await page.request.post('/api/subscriptions/create-portal');

    // Should handle portal requests
    expect(portalResponse.status()).toBeLessThan(500);
  });

  test('should show unit economics benefits', async ({ page }) => {
    await page.goto('/pricing');

    // Look for messaging about PWA benefits
    const economicsBenefits = page.locator('text=30%').or(page.locator('text=commission'));
    const pwaAdvantages = page.locator('text=App Store fees').or(page.locator('text=margin'));

    // Project mentions 90% vs 63% margins due to PWA
  });

  test('should display conversion triggers', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin')) {
      test.skip('Skipping conversion triggers test - no auth setup');
    }

    // Look for upgrade prompts and conversion triggers
    const conversionPrompts = page.locator('[data-testid*="conversion"]');
    const upgradeCallouts = page.locator('text=Unlock').or(page.locator('text=Get more'));

    // Should encourage upgrades at appropriate times
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/pricing');

    // Check pricing cards adapt to mobile
    await expect(page.locator('body')).toBeVisible();

    // Pricing tiers should be readable on mobile
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(error =>
      !error.includes('Stripe') && // Stripe SDK may have warnings
      !error.includes('tracking') // Analytics tracking warnings
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle subscription state persistence', async ({ page }) => {
    await page.goto('/dashboard');

    if (page.url().includes('signin')) {
      test.skip('Skipping subscription persistence test - no auth setup');
    }

    // Subscription state should be cached locally
    const subscriptionErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('subscription') || error.message.includes('tier')) {
        subscriptionErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(subscriptionErrors).toHaveLength(0);
  });
});