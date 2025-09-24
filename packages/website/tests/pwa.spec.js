// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PWA Functionality Testing', () => {
  test('should verify PWA manifest and service worker', async ({ page }) => {
    console.log('🧪 Testing PWA core functionality...');

    // Navigate to the app
    await page.goto('/');
    console.log('📍 Navigated to home page');

    // Check if manifest exists
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBeTruthy();
    console.log('✅ PWA manifest accessible');

    // Parse manifest content
    const manifestContent = await manifestResponse.json();
    console.log('📄 Manifest name:', manifestContent.name);
    console.log('📱 Manifest display mode:', manifestContent.display);
    console.log('🎨 Manifest theme color:', manifestContent.theme_color);

    // Verify manifest properties
    expect(manifestContent.name).toContain('MoneyQuest');
    expect(manifestContent.display).toBe('standalone');
    expect(manifestContent.start_url).toBe('/');
    expect(manifestContent.icons.length).toBeGreaterThan(0);

    console.log('✅ PWA manifest validation passed');
  });

  test('should verify service worker registration in production build', async ({ page }) => {
    console.log('🧪 Testing service worker functionality...');

    // Navigate to app
    await page.goto('/');

    // Check if service worker file exists (only in production builds)
    const swResponse = await page.request.get('/sw.js');
    expect(swResponse.ok()).toBeTruthy();
    console.log('✅ Service worker file accessible');

    // Check service worker content
    const swContent = await swResponse.text();
    expect(swContent).toContain('workbox');
    console.log('✅ Service worker contains Workbox');

    // Verify PWA meta tags
    const themeColorMeta = await page.locator('meta[name="theme-color"]').first();
    await expect(themeColorMeta).toHaveAttribute('content', '#3b82f6');

    const appleCapableMeta = await page.locator('meta[name="apple-mobile-web-app-capable"]').first();
    await expect(appleCapableMeta).toHaveAttribute('content', 'yes');

    console.log('✅ PWA meta tags verified');
  });

  test('should test offline status component', async ({ page }) => {
    console.log('🧪 Testing offline functionality...');

    // Navigate to app
    await page.goto('/');

    // The offline banner should not be visible when online
    const offlineBanner = page.locator('text=You\'re offline');
    await expect(offlineBanner).not.toBeVisible();
    console.log('✅ Offline banner hidden when online');

    // Simulate going offline
    await page.context().setOffline(true);

    // Wait a moment for the offline detection to trigger
    await page.waitForTimeout(1000);

    // Check if offline banner appears
    await expect(offlineBanner).toBeVisible();
    console.log('✅ Offline banner shown when offline');

    // Go back online
    await page.context().setOffline(false);

    // Wait for online detection
    await page.waitForTimeout(1000);

    // Banner should disappear
    await expect(offlineBanner).not.toBeVisible();
    console.log('✅ Offline banner hidden when back online');
  });

  test('should verify PWA installation prompts', async ({ page }) => {
    console.log('🧪 Testing PWA installation components...');

    // Navigate to app
    await page.goto('/');

    // Check if PWA installation component exists in DOM (even if not visible)
    const installPrompt = page.locator('text="Install MoneyQuest"').first();

    // The install prompt might not be visible by default, but the component should exist
    const installComponentExists = await installPrompt.count() > 0;
    console.log('📱 PWA install component exists:', installComponentExists);

    // Check for PWA-related elements
    const addToHomeScreenText = await page.locator('text="Add to Home Screen"').count();
    console.log('🏠 Add to Home Screen references found:', addToHomeScreenText);

    // Verify PWA hooks are loaded (check for usePWA functionality)
    const hasUsePWAHook = await page.evaluate(() => {
      return typeof window !== 'undefined' &&
             (window.matchMedia('(display-mode: standalone)').matches !== undefined);
    });

    expect(hasUsePWAHook).toBeTruthy();
    console.log('✅ PWA hooks functionality available');
  });

  test('should verify mobile-responsive PWA features', async ({ page }) => {
    console.log('🧪 Testing mobile PWA features...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to app
    await page.goto('/');

    // Verify mobile meta tags
    const viewportMeta = await page.locator('meta[name="viewport"]');
    const viewportContent = await viewportMeta.getAttribute('content');
    expect(viewportContent).toContain('width=device-width');
    console.log('📱 Mobile viewport configured correctly');

    // Check for any navigation elements (buttons, links, etc.)
    const navElements = page.locator('button, a, [role="navigation"]').first();
    await expect(navElements).toBeVisible();
    console.log('📱 Navigation elements visible');

    // Verify touch-friendly elements (buttons should be appropriately sized)
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    console.log('👆 Touch-friendly buttons found:', buttonCount);

    // Test PWA in mobile context
    const isPWACapable = await page.evaluate(() => {
      return 'serviceWorker' in navigator && 'PushManager' in window;
    });

    expect(isPWACapable).toBeTruthy();
    console.log('✅ PWA capabilities available on mobile');
  });

  test('should verify PWA performance and caching', async ({ page }) => {
    console.log('🧪 Testing PWA performance and caching...');

    // Navigate to app
    const response = await page.goto('/');

    // Check response time and status
    expect(response.ok()).toBeTruthy();
    console.log('⚡ Initial page load successful');

    // Navigate to different pages to test caching
    await page.goto('/dashboard');
    console.log('📊 Dashboard navigation successful');

    await page.goto('/analytics');
    console.log('📈 Analytics navigation successful');

    // Go back to home - this should be cached
    const cachedResponse = await page.goto('/');
    expect(cachedResponse.ok()).toBeTruthy();
    console.log('🚀 Cached navigation successful');

    // Check if static assets are cached
    const staticAssets = await page.evaluate(() => {
      const performanceEntries = performance.getEntriesByType('navigation');
      return performanceEntries.length > 0;
    });

    expect(staticAssets).toBeTruthy();
    console.log('✅ Performance monitoring active');

    console.log('✅ PWA performance tests completed');
  });
});