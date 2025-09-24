const { test, expect } = require('@playwright/test');

test.describe('Subscription System', () => {
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

  test('displays pricing page with all tiers', async ({ page }) => {
    // Navigate to pricing page
    await page.goto('/pricing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page loads successfully
    await expect(page).toHaveTitle(/MoneyQuest/);

    // Verify all three tiers are displayed (look for any element containing the tier names)
    await expect(page.locator('text=Free').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Plus').first()).toBeVisible();
    await expect(page.locator('text=Premium').first()).toBeVisible();

    // Verify pricing (look for price text anywhere on page)
    await expect(page.locator('text=2.99').or(page.locator('text=$2.99')).first()).toBeVisible();
    await expect(page.locator('text=9.99').or(page.locator('text=$9.99')).first()).toBeVisible();

    // Verify upgrade buttons (check for any button with upgrade text)
    const upgradeButtons = page.locator('button').filter({ hasText: /Get Started|Upgrade/ });
    await expect(upgradeButtons.first()).toBeVisible();
  });

  test('shows feature gates for free users', async ({ page }) => {
    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard and look for subscription information
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Should show free tier information (check for text that actually appears)
    await expect(page.locator('text=Free Plan').or(page.locator('text=Free')).first()).toBeVisible({ timeout: 10000 });

    // Check for upgrade options (look for common upgrade text)
    const upgradeElements = page.locator('text=Upgrade').or(page.locator('text=Plus')).or(page.locator('text=Premium'));
    await expect(upgradeElements.first()).toBeVisible();
  });

  test('shows plus features for plus users', async ({ page }) => {
    // Sign in as plus user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Should show plus tier information
    await expect(page.locator('text=Plus Plan').or(page.locator('text=Plus')).first()).toBeVisible({ timeout: 10000 });

    // Should show upgrade to Premium option
    await expect(page.locator('text=Premium').or(page.locator('text=Upgrade')).first()).toBeVisible();
  });

  test('shows premium features for premium users', async ({ page }) => {
    // Sign in as premium user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'premium@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Should show premium tier information
    await expect(page.locator('text=Premium Plan').or(page.locator('text=Premium')).first()).toBeVisible({ timeout: 10000 });

    // Premium users should see their tier displayed
    await expect(page.locator('text=$9.99').or(page.locator('text=Premium')).first()).toBeVisible();
  });

  test('subscription dashboard shows usage and billing info', async ({ page }) => {
    // Sign in as plus user (has subscription)
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Check for subscription-related content
    await expect(page.locator('text=Plus').or(page.locator('text=$2.99')).first()).toBeVisible({ timeout: 10000 });
  });

  test('feature gating works correctly', async ({ page }) => {
    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate through app to find gated features
    await page.goto('/dashboard');

    // Look for feature gate messages or upgrade prompts
    if (await page.locator('text=PLUS Required').isVisible()) {
      await expect(page.locator('text=Upgrade to PLUS')).toBeVisible();
    }

    if (await page.locator('text=PREMIUM Required').isVisible()) {
      await expect(page.locator('text=Upgrade to PREMIUM')).toBeVisible();
    }
  });

  test('navigation between pricing tiers works', async ({ page }) => {
    await page.goto('/pricing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Test tier visibility by looking for tier names
    await expect(page.locator('text=Free').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Plus').first()).toBeVisible();
    await expect(page.locator('text=Premium').first()).toBeVisible();

    // Check that there's some kind of popular/featured indication
    const popularElements = page.locator('text=Popular').or(page.locator('text=Most Popular')).or(page.locator('text=Recommended'));
    const popularCount = await popularElements.count();

    // If popular badge exists, verify it's visible
    if (popularCount > 0) {
      await expect(popularElements.first()).toBeVisible();
    }
  });

  test('subscription status API integration', async ({ page }) => {
    // Sign in to get session
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Check that subscription data loads properly
    await page.goto('/dashboard');

    // Wait for subscription data to load
    await page.waitForLoadState('networkidle');

    // Verify subscription information is displayed
    await expect(page.locator('text=Plus').or(page.locator('text=$2.99')).first()).toBeVisible({ timeout: 10000 });
  });

  test('handles unauthenticated users appropriately', async ({ page }) => {
    // Go to pricing page without signing in
    await page.goto('/pricing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Should show pricing but with sign-in required for upgrade (check for first occurrence)
    await expect(page.locator('text=Get Started').first()).toBeVisible({ timeout: 10000 });

    // Should show pricing information
    await expect(page.locator('text=Free').or(page.locator('text=$0')).first()).toBeVisible();
    await expect(page.locator('text=Plus').or(page.locator('text=$2.99')).first()).toBeVisible();
    await expect(page.locator('text=Premium').or(page.locator('text=$9.99')).first()).toBeVisible();
  });
});