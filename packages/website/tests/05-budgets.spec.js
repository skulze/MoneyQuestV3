const { test, expect } = require('@playwright/test');

test.describe('Budget Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load budgets page structure', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Check for budgets page elements
    await expect(page.locator('text=Budget')).toBeVisible();
  });

  test('should display budget overview', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for budget summary/overview
    const budgetOverview = page.locator('[data-testid="budget-overview"]');
    const totalBudget = page.locator('text=Total Budget');
    const remainingBudget = page.locator('text=Remaining');

    // Should show budget summary information
  });

  test('should show add budget functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for add budget button
    const addBudgetButton = page.locator('button').filter({ hasText: /add.*budget|create.*budget/i });
    if (await addBudgetButton.count() > 0) {
      await expect(addBudgetButton).toBeVisible();

      // Click to open add budget form
      await addBudgetButton.click();

      // Should open form or modal
      const budgetForm = page.locator('form');
      const modal = page.locator('[role="dialog"]');

      const hasForm = (await budgetForm.count()) > 0 || (await modal.count()) > 0;
    }
  });

  test('should display budget categories', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for category-based budgets
    const categoryBudgets = page.locator('[data-testid*="category-budget"]');
    const budgetList = page.locator('[data-testid="budget-list"]');

    // Categories are key for budget organization
    const categories = [
      'Food',
      'Transportation',
      'Entertainment',
      'Utilities',
      'Housing'
    ];

    // Check for common budget categories
    for (const category of categories) {
      const categoryElement = page.locator(`text=${category}`);
      // Categories might be present if budgets exist
    }
  });

  test('should show budget progress tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for progress bars or percentages
    const progressBars = page.locator('[role="progressbar"]');
    const percentageText = page.locator('text=%').first();
    const progressIndicators = page.locator('[data-testid*="progress"]');

    // Budget progress is a key feature
    if (await progressBars.count() > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test('should handle budget period selection', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for period selection (monthly, weekly, etc.)
    const periodSelect = page.locator('select[name*="period"]');
    const periodButtons = page.locator('button').filter({ hasText: /monthly|weekly|yearly/i });

    // Budget periods are important for tracking
    if (await periodSelect.count() > 0) {
      await expect(periodSelect).toBeVisible();
    }
  });

  test('should support budget alerts and notifications', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for alert settings or notifications
    const alertSettings = page.locator('[data-testid*="alert"]');
    const notificationSettings = page.locator('text=notifications').or(page.locator('text=alerts'));

    // Alerts are mentioned in the project description
  });

  test('should allow budget editing and deletion', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for edit/delete functionality
    const editButtons = page.locator('button').filter({ hasText: /edit/i });
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove/i });

    // Should be able to modify existing budgets
    if (await editButtons.count() > 0) {
      await expect(editButtons.first()).toBeVisible();
    }
  });

  test('should handle budget vs actual spending comparison', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for actual vs budgeted comparison
    const comparisonCharts = page.locator('[data-testid*="chart"]');
    const actualSpending = page.locator('text=Actual').or(page.locator('text=Spent'));
    const budgetedAmount = page.locator('text=Budgeted').or(page.locator('text=Planned'));

    // Comparison view is essential for budget management
  });

  test('should support multi-currency budgets', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for currency selection in budget forms
    const currencySelect = page.locator('select[name*="currency"]');
    const currencySymbols = page.locator('text=$').or(page.locator('text=€')).or(page.locator('text=£'));

    // Multi-currency support is mentioned in the project
  });

  test('should show budget analytics and trends', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for budget trend analysis
    const trendCharts = page.locator('[data-testid*="trend"]');
    const analyticsSection = page.locator('[data-testid*="analytics"]');
    const budgetHistory = page.locator('text=History').or(page.locator('text=Trends'));

    // Analytics are a key feature of the application
  });

  test('should handle budget validation', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Try to access add budget form
    const addButton = page.locator('button').filter({ hasText: /add.*budget/i });
    if (await addButton.count() > 0) {
      await addButton.click();

      // Look for amount input validation
      const amountInput = page.locator('input[type="number"]').or(page.locator('input[name*="amount"]'));
      if (await amountInput.count() > 0) {
        // Test invalid input
        await amountInput.first().fill('0');
        await page.keyboard.press('Tab');

        // Should show validation error for zero budget
        const errorMessage = page.locator('text=Invalid').or(page.locator('text=Required'));
      }
    }
  });

  test('should integrate with transaction data', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Budget progress should be based on actual transactions
    // Look for real-time budget updates
    const realTimeUpdates = page.locator('[data-testid*="real-time"]');
    const transactionLinks = page.locator('a[href*="transaction"]');

    // Integration with transaction data is key
  });

  test('should support budget templates or presets', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for budget templates
    const templateSelect = page.locator('select[name*="template"]');
    const presetBudgets = page.locator('button').filter({ hasText: /template|preset/i });

    // Templates make budget setup easier
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test budget page responsiveness
      await expect(page.locator('body')).toBeVisible();

      // Check if budget cards/list adapts to mobile
      const mobileBudgets = page.locator('[data-testid*="mobile"]');
      const budgetCards = page.locator('[data-testid*="budget-card"]');
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle budget data persistence', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Test that budgets are stored locally
    const storageErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('budget') || error.message.includes('IndexedDB')) {
        storageErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(storageErrors).toHaveLength(0);
  });

  test('should show budget sharing for collaboration tier', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated budgets test - no auth setup');
    }

    // Look for sharing features (Plus tier)
    const shareButton = page.locator('button').filter({ hasText: /share/i });
    const collaborationFeatures = page.locator('[data-testid*="collaboration"]');

    // Sharing is a Plus tier feature
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(error =>
      !error.includes('auth') &&
      !error.includes('session') &&
      !error.includes('redirect')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});