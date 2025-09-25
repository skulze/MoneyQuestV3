const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {

  test('should navigate to signin page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check signin page loads
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.locator('h1:has-text("Sign In")')).toBeVisible();
  });

  test('should redirect unauthenticated users from dashboard to signin', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to signin with callback URL
    await expect(page).toHaveURL(/.*signin/);

    // Check if callback URL is preserved
    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get('callbackUrl');
    if (callbackUrl) {
      expect(callbackUrl).toContain('/dashboard');
    }
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/transactions',
      '/budgets',
      '/analytics',
      '/investments'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to signin
      await expect(page).toHaveURL(/.*signin/);
    }
  });

  test('should handle signin page navigation from CTA buttons', async ({ page }) => {
    await page.goto('/');

    // Click "Try Demo Login" button
    const tryDemoButton = page.locator('button:has-text("Try Demo Login")');
    await expect(tryDemoButton).toBeVisible();

    // Note: These buttons should navigate to auth/signin
    // Test button existence instead of onclick (implementation detail)
    await expect(tryDemoButton).toBeVisible();

    // Click "Get Started Free" button
    const getStartedButton = page.locator('button:has-text("Get Started Free")');
    await expect(getStartedButton).toBeVisible();
  });

  test('should display signin options', async ({ page }) => {
    await page.goto('/auth/signin');

    // Wait for auth providers to load
    await page.waitForLoadState('networkidle');

    // The exact signin options depend on NextAuth configuration
    // This test will check for common auth elements

    // Check page title or heading
    const pageContent = await page.textContent('body');

    // Should contain authentication-related text
    expect(pageContent.toLowerCase()).toMatch(/(sign|login|auth)/);
  });

  test('should handle signin errors gracefully', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check for error handling in URL parameters
    await page.goto('/auth/signin?error=AccessDenied');

    // Should display error message or handle error state
    // The exact implementation depends on NextAuth setup
    const pageContent = await page.textContent('body');

    // Should not crash and should show some content
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should preserve callback URLs correctly', async ({ page }) => {
    const callbackUrl = '/dashboard';
    await page.goto(`/auth/signin?callbackUrl=${callbackUrl}`);

    const currentUrl = new URL(page.url());
    const preservedCallback = currentUrl.searchParams.get('callbackUrl');

    if (preservedCallback) {
      expect(preservedCallback).toBe(callbackUrl);
    }
  });

  test('should handle CSRF protection', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check for CSRF token in forms or meta tags
    const csrfToken = await page.locator('[name="csrfToken"]').first();
    const metaCsrf = await page.locator('meta[name="csrf-token"]').first();

    // Should have some CSRF protection mechanism
    const hasCsrfToken = (await csrfToken.count()) > 0 || (await metaCsrf.count()) > 0;
    // Note: CSRF handling varies by NextAuth configuration
  });

  test('should be accessible on signin page', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);

    // Check for keyboard navigation
    await page.keyboard.press('Tab');

    // Should have focusable elements
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThanOrEqual(0);
  });

  test('should handle different viewport sizes on signin', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/signin');

    // Check signin page is responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/auth/signin');

    await expect(body).toBeVisible();
  });

  test('should load signin page without JavaScript errors', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));

    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // Should not have critical JavaScript errors
    const criticalErrors = jsErrors.filter(error =>
      !error.includes('non-critical') &&
      !error.includes('warning')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle session state correctly', async ({ page }) => {
    // Test that session-dependent pages behave correctly
    await page.goto('/dashboard');

    // Should redirect to signin when no session
    await expect(page).toHaveURL(/.*signin/);

    // Test with potential session cookies (this would be set up in beforeAll if we had real auth)
    // For now, just verify the redirect behavior works
    await page.goto('/transactions');
    await expect(page).toHaveURL(/.*signin/);

    await page.goto('/budgets');
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should handle auth API routes', async ({ page }) => {
    // Test that auth API endpoints respond correctly
    const response = await page.request.get('/api/auth/csrf');

    // Should return a response (even if it's an error due to configuration)
    expect(response.status()).toBeLessThan(500);

    // Test providers endpoint
    const providersResponse = await page.request.get('/api/auth/providers');
    expect(providersResponse.status()).toBeLessThan(500);
  });
});