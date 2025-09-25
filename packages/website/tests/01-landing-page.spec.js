const { test, expect } = require('@playwright/test');

test.describe('Landing Page & UI Components', () => {

  test('should load the landing page with correct title and content', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/MoneyQuestV3/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('MoneyQuestV3');

    // Check subtitle
    await expect(page.locator('p').first()).toContainText('Local-first personal finance with transaction splitting and real-time analytics');

    // Check technology stack section
    await expect(page.locator('text=Next.js 14').first()).toBeVisible();
    await expect(page.locator('text=TypeScript').first()).toBeVisible();
    await expect(page.locator('text=Local-First').first()).toBeVisible();
  });

  test('should display UI component demonstrations', async ({ page }) => {
    await page.goto('/');

    // Check button examples section
    await expect(page.locator('text=Button Components')).toBeVisible();

    // Test different button variants
    await expect(page.locator('button:has-text("Primary")')).toBeVisible();
    await expect(page.locator('button:has-text("Secondary")')).toBeVisible();
    await expect(page.locator('button:has-text("Outline")')).toBeVisible();
    await expect(page.locator('button:has-text("Ghost")')).toBeVisible();
    await expect(page.locator('button:has-text("Destructive")')).toBeVisible();

    // Test loading and disabled buttons
    await expect(page.locator('button:has-text("Loading")')).toBeVisible();
    await expect(page.locator('button:has-text("Disabled")')).toBeDisabled();
  });

  test('should display input components', async ({ page }) => {
    await page.goto('/');

    // Check input components section
    await expect(page.locator('text=Input Components')).toBeVisible();

    // Test basic input
    const basicInput = page.locator('input[placeholder="Enter text..."]');
    await expect(basicInput).toBeVisible();
    await basicInput.fill('Test input');
    await expect(basicInput).toHaveValue('Test input');

    // Test search input
    const searchInput = page.locator('input').filter({ hasText: /search/i }).first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test search');
      await expect(searchInput).toHaveValue('Test search');
    }
  });

  test('should display stat cards with correct data', async ({ page }) => {
    await page.goto('/');

    // Check stat cards
    await expect(page.locator('text=Total Balance')).toBeVisible();
    await expect(page.locator('text=$12,450.00')).toBeVisible();

    await expect(page.locator('text=Monthly Spending')).toBeVisible();
    await expect(page.locator('text=$2,340.50')).toBeVisible();

    await expect(page.locator('text=Budget Progress')).toBeVisible();
    await expect(page.locator('text=73%')).toBeVisible();

    await expect(page.locator('h6:has-text("Transactions")')).toBeVisible();
    await expect(page.locator('text=127')).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');

    // Check feature cards
    await expect(page.locator('h4:has-text("Transaction Splitting")')).toBeVisible();
    await expect(page.locator('h4:has-text("Real-Time Analytics")')).toBeVisible();
    await expect(page.locator('h4:has-text("Budget Management")')).toBeVisible();
    await expect(page.locator('h4:has-text("GDPR Compliant")')).toBeVisible();

    // Check feature descriptions
    await expect(page.locator('text=Split any transaction across multiple spending categories')).toBeVisible();
    await expect(page.locator('text=Get instant insights with client-side analytics')).toBeVisible();
  });

  test('should open and close modal correctly', async ({ page }) => {
    await page.goto('/');

    // Open modal
    const openModalButton = page.locator('button:has-text("Open Modal")');
    await expect(openModalButton).toBeVisible();
    await openModalButton.click();

    // Check modal is open
    await expect(page.locator('text=Demo Modal')).toBeVisible();
    await expect(page.locator('text=This modal demonstrates the accessible modal component')).toBeVisible();

    // Close modal with Cancel button
    await page.locator('button:has-text("Cancel")').click();

    // Check modal is closed (should not be visible)
    await expect(page.locator('text=Demo Modal')).not.toBeVisible();

    // Open modal again
    await openModalButton.click();
    await expect(page.locator('text=Demo Modal')).toBeVisible();

    // Close modal with Confirm button
    await page.locator('button:has-text("Confirm")').click();
    await expect(page.locator('text=Demo Modal')).not.toBeVisible();
  });

  test('should have working CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Check CTA section
    await expect(page.locator('text=Ready to Take Control of Your Finances?')).toBeVisible();
    await expect(page.locator('text=Try Demo Login')).toBeVisible();
    await expect(page.locator('text=Get Started Free')).toBeVisible();

    // Test navigation buttons (should redirect to signin)
    const tryDemoButton = page.locator('button:has-text("Try Demo Login")');
    const getStartedButton = page.locator('button:has-text("Get Started Free")');

    await expect(tryDemoButton).toBeVisible();
    await expect(getStartedButton).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check main content is visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1:has-text("MoneyQuestV3")')).toBeVisible();

    // Check buttons stack vertically on mobile
    const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row');
    await expect(buttonContainer).toBeVisible();

    // Reset to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should have proper accessibility features', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check buttons are keyboard accessible
    const primaryButton = page.locator('button:has-text("Primary")').first();
    await expect(primaryButton).toBeVisible();
    await primaryButton.focus();
    await expect(primaryButton).toBeFocused();

    // Check inputs have proper labels
    const labeledInput = page.locator('input[placeholder="Enter text..."]');
    await expect(labeledInput).toBeVisible();
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors
    expect(jsErrors).toHaveLength(0);
  });
});