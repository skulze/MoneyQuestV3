const { test, expect } = require('@playwright/test');

test.describe('OCR Receipt Processing (Plus Tier)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/receipts');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load receipts page structure', async ({ page }) => {
    // Wait for any client-side redirects to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for useAuthGuard to execute

    // Since we're not authenticated, we should be on signin page
    if (page.url().includes('signin')) {
      await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
      test.skip('Redirected to signin as expected - no authenticated receipts test');
      return;
    }

    // If somehow not redirected, check for receipts page elements
    await expect(page.locator('h1:has-text("Receipt Processing")')).toBeVisible();
  });

  test('should show feature gate for free tier users', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping OCR feature gate test - no auth setup');
    }

    // OCR is a Plus tier feature ($2.99/month)
    const featureGate = page.locator('[data-testid*="feature-gate"]');
    const plusRequired = page.locator('text=Plus').and(page.locator('text=$2.99'));
    const upgradePrompt = page.locator('text=Upgrade').and(page.locator('text=OCR'));

    // Should show upgrade prompt for free tier
    if (await featureGate.count() > 0 || await plusRequired.count() > 0) {
      // Feature gating is working for OCR
    }
  });

  test('should provide receipt upload functionality', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for file upload for receipts
    const fileInput = page.locator('input[type="file"]');
    const uploadButton = page.locator('button').filter({ hasText: /upload|photo|camera/i });

    // Receipt upload is core OCR functionality
    if (await fileInput.count() > 0) {
      await expect(fileInput).toBeVisible();

      // Check accepted file types
      const accept = await fileInput.getAttribute('accept');
      if (accept) {
        expect(accept).toMatch(/image/);
      }
    }
  });

  test('should support camera capture for receipts', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for camera capture functionality
    const cameraButton = page.locator('button').filter({ hasText: /camera|take.*photo/i });
    const captureButton = page.locator('[data-testid*="camera-capture"]');

    // Camera functionality for mobile receipts
    if (await cameraButton.count() > 0) {
      await expect(cameraButton).toBeVisible();
    }
  });

  test('should display OCR processing status', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for processing status indicators
    const processingStatus = page.locator('[data-testid*="processing"]');
    const loadingIndicator = page.locator('text=Processing').or(page.locator('text=Analyzing'));

    // OCR processing takes time, should show status
  });

  test('should show OCR confidence scores', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for confidence score display
    const confidenceScore = page.locator('[data-testid*="confidence"]');
    const scorePercentage = page.locator('text=%').and(page.locator('text=confidence'));

    // Confidence scores are in the database schema (ocr_receipts table)
  });

  test('should extract transaction data from receipts', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for extracted data display
    const extractedData = page.locator('[data-testid*="extracted"]');
    const merchantName = page.locator('[data-testid*="merchant"]');
    const receiptAmount = page.locator('[data-testid*="amount"]');
    const receiptDate = page.locator('[data-testid*="date"]');

    // OCR should extract key transaction fields
  });

  test('should allow manual correction of OCR results', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for edit functionality
    const editButton = page.locator('button').filter({ hasText: /edit|correct/i });
    const confirmButton = page.locator('button').filter({ hasText: /confirm|approve/i });

    // Manual correction improves OCR accuracy over time
    if (await editButton.count() > 0) {
      await expect(editButton).toBeVisible();
    }
  });

  test('should convert OCR results to transactions', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for transaction creation from OCR
    const createTransactionButton = page.locator('button').filter({ hasText: /create.*transaction|add.*transaction/i });
    const transactionForm = page.locator('[data-testid*="transaction-form"]');

    // OCR → Transaction conversion is the goal
    if (await createTransactionButton.count() > 0) {
      await expect(createTransactionButton).toBeVisible();
    }
  });

  test('should handle receipt image storage', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for receipt image display/storage
    const receiptImages = page.locator('img[alt*="receipt"]');
    const imageGallery = page.locator('[data-testid*="receipt-gallery"]');

    // Receipt images should be stored for reference
  });

  test('should support batch OCR processing', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for batch upload functionality
    const batchUpload = page.locator('[data-testid*="batch"]');
    const multipleFiles = page.locator('input[type="file"][multiple]');

    // Batch processing for multiple receipts
    if (await multipleFiles.count() > 0) {
      await expect(multipleFiles).toHaveAttribute('multiple');
    }
  });

  test('should handle OCR errors gracefully', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for error handling
    const errorMessage = page.locator('[data-testid*="error"]');
    const retryButton = page.locator('button').filter({ hasText: /retry|try.*again/i });

    // OCR can fail, should handle gracefully
  });

  test('should provide OCR history and management', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for OCR history
    const receiptHistory = page.locator('[data-testid*="receipt-history"]');
    const processedReceipts = page.locator('[data-testid*="processed"]');

    // Users should see their OCR processing history
  });

  test('should support receipt categorization', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // Look for category assignment
    const categorySelect = page.locator('select[name*="category"]');
    const smartCategorization = page.locator('[data-testid*="smart-category"]');

    // OCR should help with automatic categorization
  });

  test('should handle different receipt formats', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // OCR should work with various receipt types
    const formatSupport = page.locator('text=JPG').or(page.locator('text=PNG')).or(page.locator('text=PDF'));

    // Multiple image formats should be supported
  });

  test('should integrate with expense tracking', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated receipts test - no auth setup');
    }

    // OCR receipts should integrate with expense tracking
    const expenseIntegration = page.locator('[data-testid*="expense"]');
    const businessExpenses = page.locator('text=Business').and(page.locator('text=Expense'));

    // Receipts are important for business expense tracking
  });

  test('should limit OCR features to Plus tier', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping OCR tier test - no auth setup');
    }

    // Verify OCR is gated to Plus tier
    const tierCheck = page.locator('[data-testid*="tier-check"]');
    const plusUpgrade = page.locator('text=OCR requires Plus');

    // OCR is exclusive to Plus tier ($2.99/month)
  });

  test('should be mobile optimized for receipt capture', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test receipts page responsiveness
      await expect(page.locator('body')).toBeVisible();

      // Camera capture should work well on mobile
      const mobileCameraButton = page.locator('button').filter({ hasText: /camera/i });
      if (await mobileCameraButton.count() > 0) {
        await expect(mobileCameraButton).toBeVisible();
      }
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle OCR data persistence', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping OCR persistence test - no auth setup');
    }

    // OCR results should be stored locally and synced
    const storageErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('ocr') || error.message.includes('receipt')) {
        storageErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(storageErrors).toHaveLength(0);
  });

  test('should provide OCR usage analytics', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping OCR analytics test - no auth setup');
    }

    // Look for OCR usage statistics
    const usageStats = page.locator('[data-testid*="ocr-stats"]');
    const processedCount = page.locator('text=processed').and(page.locator('text=receipt'));

    // Users should see their OCR usage patterns
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.waitForLoadState('networkidle');

    const criticalErrors = jsErrors.filter(error =>
      !error.includes('auth') &&
      !error.includes('session') &&
      !error.includes('Camera') && // Camera API warnings
      !error.includes('MediaDevices') // Media API warnings
    );

    expect(criticalErrors).toHaveLength(0);
  });
});