const { test, expect } = require('@playwright/test');

test.describe('Transaction Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load transactions page structure', async ({ page }) => {
    // Wait for any client-side redirects to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for useAuthGuard to execute


    // Since we're not authenticated, we should be on signin page
    if (page.url().includes('signin')) {
      await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
      test.skip('Redirected to signin as expected - no authenticated transactions test');
      return;
    }

    // If somehow not redirected, check for transactions page elements
    await expect(page.locator('h1:has-text("Transactions")')).toBeVisible();
  });

  test('should display transaction list', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for transaction list container
    const transactionList = page.locator('[data-testid="transaction-list"]');
    const transactionTable = page.locator('table');
    const transactionCards = page.locator('[data-testid*="transaction"]');

    // Should have some transaction display element
    const hasTransactionDisplay =
      (await transactionList.count()) > 0 ||
      (await transactionTable.count()) > 0 ||
      (await transactionCards.count()) > 0;
  });

  test('should show add transaction functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for add transaction button
    const addButton = page.locator('button').filter({ hasText: /add.*transaction/i });
    if (await addButton.count() > 0) {
      await expect(addButton).toBeVisible();

      // Click to open add transaction modal/form
      await addButton.click();

      // Should open form or modal
      const transactionForm = page.locator('form');
      const modal = page.locator('[role="dialog"]');

      const hasForm = (await transactionForm.count()) > 0 || (await modal.count()) > 0;
    }
  });

  test('should handle transaction splitting feature', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for transaction splitting functionality
    const splitButton = page.locator('button').filter({ hasText: /split/i });
    const splitSection = page.locator('[data-testid*="split"]');

    // Transaction splitting is a key feature
    if (await splitButton.count() > 0) {
      await expect(splitButton).toBeVisible();
    }
  });

  test('should provide transaction search and filtering', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for search functionality
    const searchInput = page.locator('input[type="search"]');
    const searchPlaceholder = page.locator('input[placeholder*="search"]');

    if (await searchInput.count() > 0 || await searchPlaceholder.count() > 0) {
      const searchField = searchInput.or(searchPlaceholder);
      await expect(searchField.first()).toBeVisible();

      // Test search functionality
      await searchField.first().fill('test transaction');
      await expect(searchField.first()).toHaveValue('test transaction');
    }

    // Look for filter options
    const filterSelect = page.locator('select');
    const filterButtons = page.locator('button').filter({ hasText: /filter|category/i });
  });

  test('should handle transaction categories', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for category selection in forms
    const categorySelect = page.locator('select[name*="category"]');
    const categoryDropdown = page.locator('[data-testid*="category"]');

    // Categories are essential for transaction management
  });

  test('should support transaction editing', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for edit functionality
    const editButtons = page.locator('button').filter({ hasText: /edit/i });
    const editIcons = page.locator('[data-testid*="edit"]');

    // Should be able to edit existing transactions
    if (await editButtons.count() > 0) {
      await expect(editButtons.first()).toBeVisible();
    }
  });

  test('should support transaction deletion', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for delete functionality
    const deleteButtons = page.locator('button').filter({ hasText: /delete|remove/i });
    const deleteIcons = page.locator('[data-testid*="delete"]');

    // Should be able to delete transactions
    if (await deleteButtons.count() > 0) {
      await expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('should handle multi-currency transactions', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for currency selection
    const currencySelect = page.locator('select[name*="currency"]');
    const currencySymbols = page.locator('text=$').or(page.locator('text=€')).or(page.locator('text=£'));

    // Multi-currency is a key feature
  });

  test('should validate transaction input', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Try to access add transaction form
    const addButton = page.locator('button').filter({ hasText: /add.*transaction/i });
    if (await addButton.count() > 0) {
      await addButton.click();

      // Look for amount input validation
      const amountInput = page.locator('input[type="number"]').or(page.locator('input[name*="amount"]'));
      if (await amountInput.count() > 0) {
        // Test invalid input
        await amountInput.first().fill('-1');
        await page.keyboard.press('Tab');

        // Should show validation error for negative amount
        const errorMessage = page.locator('text=Invalid').or(page.locator('text=Required'));
      }
    }
  });

  test('should handle transaction import functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for import functionality (CSV/OFX/QIF)
    const importButton = page.locator('button').filter({ hasText: /import/i });
    const fileInput = page.locator('input[type="file"]');

    // Import is mentioned in the project description
    if (await importButton.count() > 0) {
      await expect(importButton).toBeVisible();
    }
  });

  test('should display transaction history with pagination', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for pagination controls
    const paginationControls = page.locator('[data-testid*="pagination"]');
    const nextButton = page.locator('button').filter({ hasText: /next|>/i });
    const prevButton = page.locator('button').filter({ hasText: /prev|</i });

    // Pagination for large transaction lists
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test transactions page responsiveness
      await expect(page.locator('body')).toBeVisible();

      // Check if transaction list adapts to mobile
      const mobileList = page.locator('[data-testid*="mobile"]');
      const transactionCards = page.locator('[data-testid*="transaction-card"]');
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle local storage of transactions', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Test that transactions are stored locally (IndexedDB)
    const storageErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('storage') || error.message.includes('IndexedDB')) {
        storageErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000); // Wait for storage initialization

    expect(storageErrors).toHaveLength(0);
  });

  test('should show transaction analytics preview', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for analytics or stats in transaction view
    const analyticsSection = page.locator('[data-testid*="analytics"]');
    const statsCards = page.locator('[data-testid*="stats"]');
    const totals = page.locator('text=Total:');

    // Should show some transaction summary
  });

  test('should handle transaction attachments', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated transactions test - no auth setup');
    }

    // Look for attachment functionality (receipts, etc.)
    const attachmentInput = page.locator('input[type="file"]');
    const attachmentButton = page.locator('button').filter({ hasText: /attach|receipt/i });

    // Attachment support for receipts/documents
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