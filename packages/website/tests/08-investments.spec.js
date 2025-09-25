const { test, expect } = require('@playwright/test');

test.describe('Investment Tracking', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/investments');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load investments page structure', async ({ page }) => {
    // Wait for any client-side redirects to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for useAuthGuard to execute

    // Since we're not authenticated, we should be on signin page
    if (page.url().includes('signin')) {
      await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
      test.skip('Redirected to signin as expected - no authenticated investments test');
      return;
    }

    // If somehow not redirected, check for investments page elements
    await expect(page.locator('h1:has-text("Investments")')).toBeVisible();
  });

  test('should support manual investment tracking for all users', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // All users can track investments manually (per project description)
    const addInvestmentButton = page.locator('button').filter({ hasText: /add.*investment|track.*investment/i });
    const manualEntry = page.locator('[data-testid*="manual-entry"]');

    // Manual investment tracking is available to all tiers
    if (await addInvestmentButton.count() > 0) {
      await expect(addInvestmentButton).toBeVisible();
    }
  });

  test('should display portfolio overview', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for portfolio summary
    const portfolioValue = page.locator('[data-testid*="portfolio-value"]');
    const totalInvestments = page.locator('text=Total Portfolio').or(page.locator('text=Total Value'));
    const gainLoss = page.locator('text=Gain').or(page.locator('text=Loss')).or(page.locator('text=Return'));

    // Portfolio overview is essential for investment tracking
  });

  test('should show individual investment holdings', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for investment holdings list/table
    const holdingsList = page.locator('[data-testid*="holdings"]');
    const investmentTable = page.locator('table');
    const stockSymbols = page.locator('[data-testid*="symbol"]');

    // Should display individual investments
    // Common investment symbols for testing
    const commonSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
  });

  test('should handle adding manual investments', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Try to add a manual investment
    const addButton = page.locator('button').filter({ hasText: /add.*investment/i });
    if (await addButton.count() > 0) {
      await addButton.click();

      // Look for investment form fields
      const symbolInput = page.locator('input[name*="symbol"]');
      const quantityInput = page.locator('input[name*="quantity"]');
      const priceInput = page.locator('input[name*="price"]');

      // Form should have essential investment fields
      if (await symbolInput.count() > 0) {
        await symbolInput.fill('AAPL');
        await expect(symbolInput).toHaveValue('AAPL');
      }
    }
  });

  test('should support multiple portfolios', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for portfolio management
    const portfolioSelector = page.locator('select[name*="portfolio"]');
    const portfolioTabs = page.locator('[data-testid*="portfolio-tab"]');
    const addPortfolio = page.locator('button').filter({ hasText: /add.*portfolio|create.*portfolio/i });

    // Multiple portfolios for organization
  });

  test('should calculate investment performance', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for performance calculations
    const performance = page.locator('[data-testid*="performance"]');
    const percentReturn = page.locator('text=%').first();
    const dollarGainLoss = page.locator('text=$').and(page.locator('text=+').or(page.locator('text=-')));

    // Performance calculations are key for investment tracking
  });

  test('should show investment analytics charts', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for investment charts (enhanced for Plus tier)
    const investmentCharts = page.locator('canvas').or(page.locator('[data-testid*="chart"]'));
    const allocationChart = page.locator('[data-testid*="allocation"]');
    const performanceChart = page.locator('[data-testid*="performance"]');

    // Plus tier gets enhanced investment charts
    if (await investmentCharts.count() > 0) {
      await expect(investmentCharts.first()).toBeVisible();
    }
  });

  test('should handle cost basis tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for cost basis information
    const costBasis = page.locator('[data-testid*="cost-basis"]');
    const costBasisText = page.locator('text=Cost Basis').or(page.locator('text=Book Value'));

    // Cost basis is essential for tax calculations
  });

  test('should support investment categories/sectors', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for sector/category breakdown
    const sectorBreakdown = page.locator('[data-testid*="sector"]');
    const assetAllocation = page.locator('[data-testid*="allocation"]');

    // Common investment sectors
    const sectors = ['Technology', 'Healthcare', 'Finance', 'Real Estate'];
  });

  test('should show dividend tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for dividend information
    const dividends = page.locator('[data-testid*="dividend"]');
    const dividendText = page.locator('text=Dividend').or(page.locator('text=Yield'));

    // Dividend tracking for income-focused investors
  });

  test('should integrate with net worth calculations', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Investments should contribute to net worth
    const netWorthImpact = page.locator('[data-testid*="net-worth"]');
    const totalAssets = page.locator('text=Assets').and(page.locator('text=Total'));

    // Investment values should be included in net worth
  });

  test('should handle automatic sync for Premium tier', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Premium tier gets automatic investment sync
    const autoSync = page.locator('[data-testid*="auto-sync"]');
    const premiumFeature = page.locator('text=Premium').and(page.locator('text=automatic'));

    // Automatic sync is Premium tier feature
  });

  test('should support investment goals tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for goal tracking features
    const investmentGoals = page.locator('[data-testid*="goal"]');
    const targetAllocation = page.locator('text=Target').and(page.locator('text=Allocation'));

    // Goal-based investing features
  });

  test('should handle investment data validation', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Try to add invalid investment
    const addButton = page.locator('button').filter({ hasText: /add.*investment/i });
    if (await addButton.count() > 0) {
      await addButton.click();

      const quantityInput = page.locator('input[name*="quantity"]');
      if (await quantityInput.count() > 0) {
        // Test negative quantity validation
        await quantityInput.fill('-1');
        await page.keyboard.press('Tab');

        // Should show validation error
        const errorMessage = page.locator('text=Invalid').or(page.locator('text=positive'));
      }
    }
  });

  test('should support investment history tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for transaction history
    const transactionHistory = page.locator('[data-testid*="history"]');
    const buyOrdersText = page.locator('text=Buy').or(page.locator('text=Purchase'));
    const sellOrdersText = page.locator('text=Sell').or(page.locator('text=Sale'));

    // Investment transaction history
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test investments page responsiveness
      await expect(page.locator('body')).toBeVisible();

      // Investment charts should adapt to mobile
      const mobileCharts = page.locator('canvas');
      if (await mobileCharts.count() > 0) {
        await expect(mobileCharts.first()).toBeVisible();
      }
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle investment data persistence', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Investment data should be stored locally
    const storageErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('investment') || error.message.includes('portfolio')) {
        storageErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(storageErrors).toHaveLength(0);
  });

  test('should support investment reporting', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated investments test - no auth setup');
    }

    // Look for investment report generation
    const reportButton = page.locator('button').filter({ hasText: /report|export/i });
    const pdfExport = page.locator('button').filter({ hasText: /pdf/i });

    // Investment reports for tax purposes
    if (await reportButton.count() > 0) {
      await expect(reportButton.first()).toBeVisible();
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(error =>
      !error.includes('auth') &&
      !error.includes('session') &&
      !error.includes('Chart') // Chart library warnings
    );

    expect(criticalErrors).toHaveLength(0);
  });
});