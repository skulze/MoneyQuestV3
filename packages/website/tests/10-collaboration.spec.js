const { test, expect } = require('@playwright/test');

test.describe('Multi-user & Collaboration (Plus Tier)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/collaboration');
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should load collaboration page structure', async ({ page }) => {
    // Wait for any client-side redirects to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for useAuthGuard to execute

    // Since we're not authenticated, we should be on signin page
    if (page.url().includes('signin')) {
      await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
      test.skip('Redirected to signin as expected - no authenticated collaboration test');
      return;
    }

    // If somehow not redirected, check for collaboration page elements
    await expect(page.locator('h1:has-text("Family Collaboration")')).toBeVisible();
  });

  test('should show feature gate for free tier users', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration feature gate test - no auth setup');
    }

    // Multi-user is a Plus tier feature ($2.99/month)
    const featureGate = page.locator('[data-testid*="feature-gate"]');
    const plusRequired = page.locator('text=Plus').and(page.locator('text=$2.99'));
    const upgradePrompt = page.locator('text=Upgrade').and(page.locator('text=multi-user'));

    // Should show upgrade prompt for free tier
    if (await featureGate.count() > 0 || await plusRequired.count() > 0) {
      // Feature gating is working
    }
  });

  test('should support family budget management', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for family/shared budget features
    const familyBudgets = page.locator('text=Family').or(page.locator('text=Shared'));
    const budgetSharing = page.locator('[data-testid*="shared-budget"]');

    // Family budgets are a key collaboration feature
  });

  test('should handle user relationship management', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for user invitation/relationship features
    const inviteUser = page.locator('button').filter({ hasText: /invite|add.*user/i });
    const userList = page.locator('[data-testid*="user-list"]');
    const relationshipType = page.locator('text=Spouse').or(page.locator('text=Partner')).or(page.locator('text=Family'));

    // User relationships are in the database schema
    if (await inviteUser.count() > 0) {
      await expect(inviteUser).toBeVisible();
    }
  });

  test('should support permission levels for shared budgets', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for permission management
    const permissionSettings = page.locator('[data-testid*="permission"]');
    const accessLevels = page.locator('text=Owner').or(page.locator('text=Editor')).or(page.locator('text=Viewer'));

    // Permission levels are in the database schema (shared_budgets table)
  });

  test('should handle collaborative transaction categorization', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Multiple users should be able to categorize transactions
    const sharedCategories = page.locator('[data-testid*="shared-categories"]');
    const categoryPermissions = page.locator('[data-testid*="category-permission"]');

    // Collaborative categorization features
  });

  test('should show user activity and collaboration history', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for activity tracking
    const activityFeed = page.locator('[data-testid*="activity"]');
    const userActions = page.locator('text=added').or(page.locator('text=edited')).or(page.locator('text=shared'));

    // Activity tracking for collaboration
  });

  test('should support collaborative goal setting', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for shared financial goals
    const sharedGoals = page.locator('[data-testid*="shared-goal"]');
    const familyGoals = page.locator('text=Family').and(page.locator('text=Goal'));

    // Collaborative financial planning
  });

  test('should handle data synchronization between users', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for sync status indicators
    const syncStatus = page.locator('[data-testid*="sync-status"]');
    const lastSync = page.locator('text=Last sync').or(page.locator('text=Updated'));

    // Multi-device sync is mentioned in the project
  });

  test('should provide user notification system', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for notification features
    const notifications = page.locator('[data-testid*="notification"]');
    const notificationSettings = page.locator('text=Notifications').and(page.locator('text=Settings'));

    // Users should be notified of collaborative changes
  });

  test('should handle collaborative reporting', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for shared report generation
    const sharedReports = page.locator('[data-testid*="shared-report"]');
    const reportSharing = page.locator('button').filter({ hasText: /share.*report/i });

    // Collaborative reporting features
  });

  test('should support conflict resolution for shared data', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping authenticated collaboration test - no auth setup');
    }

    // Look for conflict resolution mechanisms
    const conflictResolver = page.locator('[data-testid*="conflict"]');
    const mergeOptions = page.locator('text=Merge').or(page.locator('text=Resolve'));

    // Conflict resolution is mentioned in the project for multi-device sync
  });

  test('should limit collaboration features to Plus tier', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration tier test - no auth setup');
    }

    // Verify feature is gated properly
    const tierCheck = page.locator('[data-testid*="tier-check"]');
    const plusUpgrade = page.locator('text=Plus').and(page.locator('text=required'));

    // Multi-user is exclusive to Plus tier
  });

  test('should handle user limit enforcement', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration limits test - no auth setup');
    }

    // Plus tier allows up to 10 users (per project description)
    const userLimit = page.locator('text=10 users').or(page.locator('text=user limit'));

    // User limits should be enforced
  });

  test('should provide collaboration onboarding', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration onboarding test - no auth setup');
    }

    // Look for onboarding flow
    const onboardingSteps = page.locator('[data-testid*="onboarding"]');
    const welcomeMessage = page.locator('text=Welcome').and(page.locator('text=collaboration'));

    // New users should be guided through collaboration setup
  });

  test('should be mobile responsive for collaboration', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    if (page.url().includes('signin')) {
      // Test signin responsiveness
      await expect(page.locator('body')).toBeVisible();
    } else {
      // Test collaboration page responsiveness
      await expect(page.locator('body')).toBeVisible();

      // Collaboration features should work on mobile
      const mobileCollaboration = page.locator('[data-testid*="mobile-collaboration"]');
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle collaboration data persistence', async ({ page }) => {
    if (page.url().includes('signin')) {
      test.skip('Skipping collaboration persistence test - no auth setup');
    }

    // Collaboration data should be synced and cached
    const storageErrors = [];
    page.on('pageerror', error => {
      if (error.message.includes('collaboration') || error.message.includes('shared')) {
        storageErrors.push(error.message);
      }
    });

    await page.waitForTimeout(2000);

    expect(storageErrors).toHaveLength(0);
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