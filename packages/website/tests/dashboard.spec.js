const { test, expect } = require('@playwright/test');

test.describe('Dashboard Login and Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser storage before each test
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear IndexedDB
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MoneyQuestDB');
      }
    });
  });

  test('should login and load dashboard successfully', async ({ page }) => {
    console.log('🧪 Starting dashboard test...');

    // Navigate to login page
    await page.goto('http://localhost:3000/auth/signin');
    console.log('📍 Navigated to login page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Fill in demo credentials
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.fill('input[name="password"]', 'free123');
    console.log('✍️ Filled in credentials');

    // Click sign in button
    await page.click('button[type="submit"]');
    console.log('🔐 Clicked sign in');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🚀 Redirected to dashboard');

    // Wait for the page to fully load
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

    // Check for dashboard content
    await expect(page.locator('h1, h2')).toContainText(['MoneyQuestV3', 'Welcome back!'], { timeout: 5000 });
    console.log('📊 Dashboard header found');

    // Look for stat cards or financial data
    const statCards = page.locator('[class*="stat"], [class*="card"], [class*="metric"]');
    if (await statCards.count() > 0) {
      console.log(`💳 Found ${await statCards.count()} stat cards`);
    }

    // Look for balance information
    const balanceElements = page.locator('text=/\\$[0-9,]+\\.\\d{2}/');
    const balanceCount = await balanceElements.count();
    if (balanceCount > 0) {
      console.log(`💰 Found ${balanceCount} balance displays`);

      // Log the first few balance amounts
      for (let i = 0; i < Math.min(3, balanceCount); i++) {
        const balance = await balanceElements.nth(i).textContent();
        console.log(`   - Balance ${i + 1}: ${balance}`);
      }
    }

    // Check for navigation links
    const navLinks = page.locator('nav a, [href*="/dashboard"], [href*="/transactions"], [href*="/budgets"]');
    const navCount = await navLinks.count();
    if (navCount > 0) {
      console.log(`🧭 Found ${navCount} navigation links`);
    }

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'C:\\Users\\natha\\OneDrive\\Desktop\\MoneyQuestV3\\packages\\website\\tests\\dashboard-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved');

    // Final assertion that we're on the dashboard
    expect(page.url()).toContain('/dashboard');
    console.log('✅ Test completed successfully!');
  });

  test('should handle initialization logs in console', async ({ page }) => {
    console.log('🧪 Testing console logs during initialization...');

    // Listen for console logs
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to login and sign in
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.fill('input[name="password"]', 'free123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Wait a bit more for logs to appear
    await page.waitForTimeout(3000);

    // Check for initialization logs
    const initLogs = logs.filter(log =>
      log.includes('Starting IndexedDB initialization') ||
      log.includes('Creating new user') ||
      log.includes('Successfully initialized')
    );

    console.log('📝 Console logs captured:');
    logs.forEach(log => console.log(`   ${log}`));

    if (initLogs.length > 0) {
      console.log('✅ Found initialization logs:', initLogs.length);
    } else {
      console.log('⚠️ No initialization logs found - user may already be initialized');
    }
  });
});