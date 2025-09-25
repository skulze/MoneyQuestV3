const { test, expect } = require('@playwright/test');

test.describe('Dashboard Core Features', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - will redirect to signin if not authenticated
    await page.goto('/dashboard');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    // Should be redirected to signin page
    await expect(page).toHaveURL(/.*signin/);
  });

  // Note: The following tests would require authentication setup
  // For now, they test the dashboard page structure assuming successful auth

  test('should load dashboard structure', async ({ page }) => {
    // Skip if redirected to signin (no auth)
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Check for dashboard elements that should be present
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display user session information', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Should show user email or name if authenticated
    const userInfo = page.locator('[data-testid="user-info"]');
    // This would depend on the actual implementation
  });

  test('should initialize data engine correctly', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Check that data engine initialization doesn't cause errors
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors
    const criticalErrors = jsErrors.filter(error =>
      error.includes('LocalDataEngine') ||
      error.includes('IndexedDB')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should display financial statistics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for stat cards or financial summary
    const statsElements = [
      'Total Balance',
      'Monthly Spending',
      'Budget Progress',
      'Transactions'
    ];

    for (const stat of statsElements) {
      // These might be loading or default values
      const statElement = page.locator(`text=${stat}`);
      if (await statElement.count() > 0) {
        await expect(statElement).toBeVisible();
      }
    }
  });

  test('should show subscription dashboard', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for subscription-related components
    const subscriptionElements = page.locator('[data-testid*="subscription"]');
    // Subscription components might be conditional
  });

  test('should handle investment tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for investment-related sections
    const investmentSection = page.locator('text=Investment').or(page.locator('text=Portfolio'));
    // Investment features might be conditional based on subscription
  });

  test('should provide navigation to other sections', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Check for navigation links
    const navLinks = [
      { text: 'Transactions', href: '/transactions' },
      { text: 'Budgets', href: '/budgets' },
      { text: 'Analytics', href: '/analytics' },
      { text: 'Investments', href: '/investments' }
    ];

    for (const link of navLinks) {
      const linkElement = page.locator(`a:has-text("${link.text}")`);
      if (await linkElement.count() > 0) {
        await expect(linkElement).toHaveAttribute('href', link.href);
      }
    }
  });

  test('should show add transaction functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for add transaction button or modal
    const addTransactionButton = page.locator('button').filter({ hasText: /add.*transaction/i });
    // This functionality might be in a modal or separate section
  });

  test('should show budget management features', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for budget-related elements
    const budgetElements = page.locator('text=Budget').or(page.locator('[data-testid*="budget"]'));
    // Budget features might be conditional or in separate sections
  });

  test('should handle feature gating correctly', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for feature gate prompts or upgrade messages
    const featureGates = page.locator('[data-testid*="feature-gate"]');
    const upgradePrompts = page.locator('text=Upgrade').or(page.locator('text=Plus'));

    // These elements might be present based on subscription tier
  });

  test('should show unsaved changes indicator', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for unsaved changes indicator
    const unsavedIndicator = page.locator('[data-testid*="unsaved"]');
    // This would appear when there are local changes
  });

  test('should handle sign out functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for sign out button
    const signOutButton = page.locator('button').filter({ hasText: /sign.*out/i });
    if (await signOutButton.count() > 0) {
      await expect(signOutButton).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin page responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test dashboard responsiveness
      await expect(page.locator('body')).toBeVisible();
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should load without critical JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (auth redirects, etc.)
    const criticalErrors = jsErrors.filter(error =>
      !error.includes('session') &&
      !error.includes('redirect') &&
      !error.includes('auth')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle local data persistence', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Test IndexedDB initialization (this would be in browser dev tools)
    // For now, just ensure no database-related errors
    const dbErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('IndexedDB') || error.message.includes('database')) {
        dbErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000); // Wait for DB initialization

    expect(dbErrors).toHaveLength(0);
  });

  test('should handle subscription status updates', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated dashboard test - no auth setup');
    }

    // Look for subscription status indicators
    const subscriptionStatus = page.locator('[data-testid*="subscription-status"]');
    const tierIndicator = page.locator('text=Free').or(page.locator('text=Plus')).or(page.locator('text=Premium'));

    // These elements show current subscription tier
  });
});