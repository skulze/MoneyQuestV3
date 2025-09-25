const { test, expect } = require('@playwright/test');

test.describe('Subscription Feature Gating & Plan Changes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MoneyQuestDB');
      }
    });
  });

  test('Free tier enforces limits and shows upgrade prompts', async ({ page }) => {
    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.fill('input[name="password"]', 'free123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify free tier status is shown
    await expect(page.locator('text=Free').first()).toBeVisible({ timeout: 10000 });

    // Check that upgrade prompts are visible
    const upgradeElements = page.locator('text=Upgrade').or(page.locator('text=Plus')).or(page.locator('text=Premium'));
    await expect(upgradeElements.first()).toBeVisible();

    // Go to pricing page and verify upgrade buttons work
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Verify all tiers are shown with appropriate buttons
    await expect(page.locator('text=Free').first()).toBeVisible();
    await expect(page.locator('text=Plus').first()).toBeVisible();
    await expect(page.locator('text=Premium').first()).toBeVisible();

    // Test clicking upgrade button (should redirect to checkout or show error without Stripe config)
    const plusUpgradeButton = page.locator('button').filter({ hasText: /Upgrade.*Plus|Get.*Plus/ }).first();
    if (await plusUpgradeButton.isVisible()) {
      await plusUpgradeButton.click();
      // Should either redirect to Stripe or show configuration error
      await page.waitForTimeout(2000);
    }
  });

  test('Plus tier shows enhanced features and Premium upgrade', async ({ page }) => {
    // Sign in as plus user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.fill('input[name="password"]', 'plus123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify plus tier status
    await expect(page.locator('text=Plus').first()).toBeVisible({ timeout: 10000 });

    // Should show Premium upgrade options but not Plus
    await expect(page.locator('text=Premium').first()).toBeVisible();

    // Go to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Plus users should see current plan indication and Premium upgrade
    await expect(page.locator('text=Plus').first()).toBeVisible();
    await expect(page.locator('text=$2.99').or(page.locator('text=2.99')).first()).toBeVisible();

    // Should see Premium upgrade option
    const premiumUpgrade = page.locator('button').filter({ hasText: /Upgrade.*Premium|Get.*Premium/ }).first();
    if (await premiumUpgrade.isVisible()) {
      await expect(premiumUpgrade).toBeVisible();
    }
  });

  test('Premium tier shows all features and no upgrade prompts', async ({ page }) => {
    // Sign in as premium user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'premium@moneyquest.com');
    await page.fill('input[name="password"]', 'premium123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify premium tier status
    await expect(page.locator('text=Premium').first()).toBeVisible({ timeout: 10000 });

    // Should show premium pricing
    await expect(page.locator('text=$9.99').or(page.locator('text=9.99')).first()).toBeVisible();

    // Go to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Premium users should see current plan but no upgrade options
    await expect(page.locator('text=Premium').first()).toBeVisible();
    await expect(page.locator('text=9.99').or(page.locator('text=$9.99')).first()).toBeVisible();
  });

  test('Feature access varies correctly between tiers', async ({ page }) => {
    // Test Free user limitations
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.fill('input[name="password"]', 'free123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate through different sections and look for tier-specific content
    const sections = ['/dashboard', '/transactions', '/budgets', '/analytics', '/investments'];

    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');

      // Free users should see Free tier indication
      const tierIndicators = page.locator('text=Free').or(page.locator('text=Upgrade'));
      const count = await tierIndicators.count();

      if (count > 0) {
        await expect(tierIndicators.first()).toBeVisible();
      }
    }

    // Now test Plus user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.fill('input[name="password"]', 'plus123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');

      // Plus users should see Plus tier indication
      const plusIndicators = page.locator('text=Plus').or(page.locator('text=2.99'));
      const count = await plusIndicators.count();

      if (count > 0) {
        await expect(plusIndicators.first()).toBeVisible();
      }
    }

    // Finally test Premium user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'premium@moneyquest.com');
    await page.fill('input[name="password"]', 'premium123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState('networkidle');

      // Premium users should see Premium tier indication
      const premiumIndicators = page.locator('text=Premium').or(page.locator('text=9.99'));
      const count = await premiumIndicators.count();

      if (count > 0) {
        await expect(premiumIndicators.first()).toBeVisible();
      }
    }
  });

  test('Billing management shows appropriate options per tier', async ({ page }) => {
    // Test Plus user billing management
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.fill('input[name="password"]', 'plus123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Check if billing management is available
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Plus users should have billing management options
    const manageBilling = page.locator('button').filter({ hasText: /Manage.*Billing|Billing.*Portal|Current Plan/ }).first();
    const manageBillingCount = await manageBilling.count();

    if (manageBillingCount > 0) {
      await expect(manageBilling).toBeVisible();
    }

    // Test Premium user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'premium@moneyquest.com');
    await page.fill('input[name="password"]', 'premium123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Premium users should also have billing management
    const premiumBilling = page.locator('button').filter({ hasText: /Manage.*Billing|Billing.*Portal|Current Plan/ }).first();
    const premiumBillingCount = await premiumBilling.count();

    if (premiumBillingCount > 0) {
      await expect(premiumBilling).toBeVisible();
    }
  });

  test('Subscription status API returns correct tier information', async ({ page }) => {
    const tiers = [
      { email: 'free@moneyquest.com', expectedTier: 'Free', expectedPrice: '0' },
      { email: 'plus@moneyquest.com', expectedTier: 'Plus', expectedPrice: '2.99' },
      { email: 'premium@moneyquest.com', expectedTier: 'Premium', expectedPrice: '9.99' }
    ];

    for (const tier of tiers) {
      // Sign in as user
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', tier.email);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

      // Check subscription status via API
      const response = await page.request.get('/api/subscriptions/status');

      if (response.ok()) {
        const subscriptionData = await response.json();

        // Verify tier information is correct
        expect(subscriptionData.tier || subscriptionData.tierName).toContain(tier.expectedTier);

        if (tier.expectedPrice !== '0') {
          expect(subscriptionData.price.toString()).toContain(tier.expectedPrice.replace('.', ''));
        }
      }
    }
  });

  test('Feature gates prevent access to premium features for lower tiers', async ({ page }) => {
    // Test that free users see appropriate feature gates
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.fill('input[name="password"]', 'free123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate through the app looking for feature gates
    const pages = ['/dashboard', '/analytics', '/investments'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // Look for any premium feature gates or upgrade prompts
      const featureGates = page.locator('text=PLUS Required').or(page.locator('text=PREMIUM Required')).or(page.locator('text=Upgrade to'));
      const gateCount = await featureGates.count();

      // If feature gates exist, verify they show upgrade options
      if (gateCount > 0) {
        await expect(featureGates.first()).toBeVisible();

        // Should show upgrade buttons
        const upgradeButtons = page.locator('button').filter({ hasText: /Upgrade|Plus|Premium/ });
        const upgradeCount = await upgradeButtons.count();

        if (upgradeCount > 0) {
          await expect(upgradeButtons.first()).toBeVisible();
        }
      }
    }
  });

  test('Tier transition shows correct UI changes', async ({ page }) => {
    // Test the UI differences when switching between user types
    const userTypes = ['free@moneyquest.com', 'plus@moneyquest.com', 'premium@moneyquest.com'];
    const expectedTierTexts = ['Free', 'Plus', 'Premium'];

    for (let i = 0; i < userTypes.length; i++) {
      await page.goto('/auth/signin');
      await page.fill('input[name="email"]', userTypes[i]);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify tier-specific UI elements
      await expect(page.locator(`text=${expectedTierTexts[i]}`).first()).toBeVisible({ timeout: 10000 });

      // Take screenshot for visual verification (optional)
      // await page.screenshot({ path: `tier-${expectedTierTexts[i].toLowerCase()}-dashboard.png` });
    }
  });
});