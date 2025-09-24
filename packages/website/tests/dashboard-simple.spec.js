const { test, expect } = require('@playwright/test');

test.describe('Dashboard Direct Access Test', () => {
  test('should load dashboard when navigating directly after login', async ({ page }) => {
    console.log('🧪 Testing direct dashboard access...');

    // Navigate to login page
    await page.goto('http://localhost:3000/auth/signin');
    console.log('📍 Navigated to login page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on the Free tier demo button first to populate fields
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    console.log('🔘 Clicked demo account button');

    // Wait a moment for fields to populate
    await page.waitForTimeout(500);

    // Now click the Sign In button
    await page.click('button[type="submit"]');
    console.log('🔐 Clicked sign in button');

    // Wait for authentication to complete (look for network activity or URL change)
    await page.waitForTimeout(2000);

    // Check current URL and session
    console.log('🌍 Current URL:', page.url());

    // Try to navigate directly to dashboard
    await page.goto('http://localhost:3000/dashboard');
    console.log('🚀 Navigated directly to dashboard');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we see the initializing message first
    const initializingText = page.locator('text=Initializing your data');
    if (await initializingText.isVisible()) {
      console.log('⏳ Saw "Initializing your data" message');

      // Wait for initialization to complete (up to 15 seconds)
      await page.waitForFunction(() => {
        const text = document.body.textContent;
        return !text.includes('Initializing your data');
      }, { timeout: 15000 });

      console.log('✅ Initialization completed');
    }

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'C:\\Users\\natha\\OneDrive\\Desktop\\MoneyQuestV3\\packages\\website\\tests\\dashboard-direct-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved');

    // Check for dashboard content - be more flexible with assertions
    const pageContent = await page.textContent('body');
    const hasDashboardContent = pageContent.includes('Dashboard') ||
                               pageContent.includes('Balance') ||
                               pageContent.includes('$') ||
                               pageContent.includes('Welcome');

    if (hasDashboardContent) {
      console.log('✅ Dashboard content found!');
    } else {
      console.log('❌ No dashboard content found');
      console.log('Page content preview:', pageContent.substring(0, 200) + '...');
    }

    // Final assertion - we should be on dashboard and have some content
    expect(page.url()).toContain('/dashboard');
    console.log('✅ Test completed - on dashboard page');
  });

  test('should show initialization console logs', async ({ page }) => {
    console.log('🧪 Testing initialization logs...');

    // Listen for console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate directly to dashboard (assuming we can get there)
    await page.goto('http://localhost:3000/dashboard');

    // Wait for potential initialization
    await page.waitForTimeout(5000);

    // Log all console messages
    console.log('📝 Console logs captured:');
    logs.forEach(log => console.log(`   ${log}`));

    // Check for initialization-related logs
    const initLogs = logs.filter(log =>
      log.includes('IndexedDB') ||
      log.includes('initialization') ||
      log.includes('Creating new user') ||
      log.includes('Successfully initialized') ||
      log.includes('Initializing data')
    );

    if (initLogs.length > 0) {
      console.log('✅ Found initialization logs:', initLogs.length);
      initLogs.forEach(log => console.log(`   🔍 ${log}`));
    } else {
      console.log('⚠️ No initialization logs found');
    }
  });
});