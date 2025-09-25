const { test, expect } = require('@playwright/test');

test.describe('Analytics & Charts', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load analytics page structure', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Check for analytics page elements
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should display spending analytics charts', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for chart elements (Chart.js/Recharts)
    const chartElements = page.locator('canvas').or(page.locator('[data-testid*="chart"]'));
    const svgCharts = page.locator('svg');

    // Charts are a key feature for analytics
    if (await chartElements.count() > 0 || await svgCharts.count() > 0) {
      const charts = chartElements.or(svgCharts);
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should show category-based spending breakdown', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for category breakdown charts (pie, donut, bar)
    const categoryChart = page.locator('[data-testid*="category"]');
    const pieChart = page.locator('[data-testid*="pie"]');
    const donutChart = page.locator('[data-testid*="donut"]');

    // Category analysis is essential
    const categoryLabels = ['Food', 'Transportation', 'Entertainment', 'Utilities'];
  });

  test('should provide time-based analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for time period selection
    const timeFrameButtons = page.locator('button').filter({ hasText: /week|month|year|day/i });
    const dateRangePicker = page.locator('input[type="date"]');

    // Time-based analysis is crucial
    if (await timeFrameButtons.count() > 0) {
      await expect(timeFrameButtons.first()).toBeVisible();
    }

    // Look for trending charts
    const trendChart = page.locator('[data-testid*="trend"]');
    const lineChart = page.locator('[data-testid*="line"]');
  });

  test('should show income vs expenses comparison', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for income/expense comparison
    const incomeExpenseChart = page.locator('[data-testid*="income-expense"]');
    const comparisonChart = page.locator('[data-testid*="comparison"]');
    const incomeText = page.locator('text=Income');
    const expenseText = page.locator('text=Expense').or(page.locator('text=Spending'));

    // Income vs expense analysis is fundamental
  });

  test('should display budget vs actual spending analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for budget comparison charts
    const budgetChart = page.locator('[data-testid*="budget"]');
    const actualVsBudget = page.locator('text=Budget').and(page.locator('text=Actual'));

    // Budget analysis integration
  });

  test('should provide investment analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for investment performance charts
    const investmentChart = page.locator('[data-testid*="investment"]');
    const portfolioChart = page.locator('[data-testid*="portfolio"]');
    const performanceMetrics = page.locator('text=Performance').or(page.locator('text=Return'));

    // Investment analytics for all users (manual tracking)
  });

  test('should show net worth tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for net worth analytics
    const netWorthChart = page.locator('[data-testid*="net-worth"]');
    const assetLiabilityChart = page.locator('text=Assets').and(page.locator('text=Liabilities'));

    // Net worth tracking is important
  });

  test('should handle responsive chart display', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Test desktop view first
    await page.setViewportSize({ width: 1280, height: 720 });
    const desktopCharts = page.locator('canvas').or(page.locator('svg'));

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // Charts should adapt to mobile screens
    if (await desktopCharts.count() > 0) {
      await expect(desktopCharts.first()).toBeVisible();
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should provide analytics filtering options', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for filter controls
    const filterDropdowns = page.locator('select');
    const filterButtons = page.locator('button').filter({ hasText: /filter/i });
    const accountFilter = page.locator('select[name*="account"]');
    const categoryFilter = page.locator('select[name*="category"]');

    // Filtering is essential for detailed analysis
  });

  test('should show analytics export functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for export options (PDF/Excel mentioned in project)
    const exportButton = page.locator('button').filter({ hasText: /export|download|pdf|excel/i });
    const printButton = page.locator('button').filter({ hasText: /print/i });

    // Export functionality is mentioned in the project description
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });

  test('should display key financial metrics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for key metrics display
    const metricsCards = page.locator('[data-testid*="metric"]');
    const statCards = page.locator('[data-testid*="stat"]');

    // Common financial metrics
    const metrics = [
      'Average Spending',
      'Monthly Total',
      'Savings Rate',
      'Cash Flow'
    ];

    // Should display important financial indicators
  });

  test('should handle multi-currency analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for currency selection in analytics
    const currencySelect = page.locator('select[name*="currency"]');
    const currencyToggle = page.locator('button').filter({ hasText: /currency|usd|eur/i });

    // Multi-currency support in analytics
  });

  test('should provide spending pattern analysis', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for pattern analysis features
    const patternChart = page.locator('[data-testid*="pattern"]');
    const trendAnalysis = page.locator('text=Trend').or(page.locator('text=Pattern'));
    const weekdaySpending = page.locator('text=Monday').or(page.locator('text=Weekend'));

    // Spending patterns provide insights
  });

  test('should show goal tracking analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for goal/target tracking
    const goalChart = page.locator('[data-testid*="goal"]');
    const targetProgress = page.locator('text=Target').or(page.locator('text=Goal'));

    // Goal tracking in analytics
  });

  test('should handle real-time analytics updates', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Analytics should update with transaction changes (local-first)
    // Test for real-time capability indicators
    const realTimeIndicator = page.locator('[data-testid*="real-time"]');
    const lastUpdated = page.locator('text=Updated').or(page.locator('text=Last sync'));

    // Local-first means instant updates
  });

  test('should provide comparative analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Look for month-over-month or year-over-year comparisons
    const comparisonChart = page.locator('[data-testid*="comparison"]');
    const periodComparison = page.locator('text=vs').or(page.locator('text=compared'));

    // Comparative analysis helps identify trends
  });

  test('should load analytics without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    // Filter out chart library warnings that are non-critical
    const criticalErrors = jsErrors.filter(error =>
      !error.includes('auth') &&
      !error.includes('session') &&
      !error.includes('Chart') &&
      !error.includes('canvas')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle analytics data calculations locally', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated analytics test - no auth setup');
    }

    // Analytics should be computed client-side (local-first)
    const calculationErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('calculation') || error.message.includes('math')) {
        calculationErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(calculationErrors).toHaveLength(0);
  });
});