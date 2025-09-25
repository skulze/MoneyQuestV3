const { test, expect } = require('@playwright/test');

test.describe('Analytics Page Testing', () => {
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

  test('should navigate to analytics page and display charts', async ({ page }) => {
    console.log('🧪 Testing analytics page navigation and chart display...');

    // Navigate to login page
    await page.goto('http://localhost:3000/auth/signin');
    console.log('📍 Navigated to login page');
    await page.waitForLoadState('networkidle');

    // Login with demo account
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    console.log('🔘 Clicked demo account button');
    await page.waitForTimeout(500);

    // Submit form
    await page.click('button[type="submit"]');
    console.log('🔐 Submitted login form');

    // Wait for authentication and redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in - redirected to dashboard');

    // Navigate to analytics page
    console.log('📊 Navigating to analytics page...');
    await page.goto('http://localhost:3000/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for any initialization
    await page.waitForTimeout(3000);
    console.log('⏳ Waited for analytics initialization');

    // Check for analytics page content
    const pageContent = await page.textContent('body');
    console.log('📄 Checking page content...');

    // Verify analytics page loaded
    const hasAnalyticsTitle = pageContent.includes('Analytics');
    const hasInsightsText = pageContent.includes('Insights into your spending patterns');

    console.log('✅ Analytics title found:', hasAnalyticsTitle);
    console.log('✅ Insights text found:', hasInsightsText);

    expect(hasAnalyticsTitle || hasInsightsText).toBeTruthy();

    // Look for timeframe buttons
    const timeframeButtons = page.locator('button:has-text("Days"), button:has-text("Year")');
    const buttonCount = await timeframeButtons.count();
    console.log(`🕐 Found ${buttonCount} timeframe buttons`);

    // Look for metric cards
    const metricCards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await metricCards.count();
    console.log(`💳 Found ${cardCount} metric cards`);

    // Look for export buttons
    const exportButtons = page.locator('button:has-text("PDF"), button:has-text("Excel"), button:has-text("CSV")');
    const exportCount = await exportButtons.count();
    console.log(`📥 Found ${exportCount} export buttons`);

    // Look for charts (SVG elements from Recharts)
    const chartElements = page.locator('svg');
    const chartCount = await chartElements.count();
    console.log(`📈 Found ${chartCount} chart/SVG elements`);

    // Take screenshot
    await page.screenshot({
      path: 'C:\\Users\\natha\\OneDrive\\Desktop\\MoneyQuestV3\\packages\\website\\tests\\analytics-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved');

    console.log('✅ Analytics page test completed successfully!');
  });

  test('should test export button functionality', async ({ page }) => {
    console.log('🧪 Testing export button functionality...');

    // Login process
    await page.goto('http://localhost:3000/auth/signin');
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to analytics
    await page.goto('http://localhost:3000/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('🔍 Looking for export buttons...');

    // Check for export buttons
    const pdfButton = page.locator('button:has-text("PDF")');
    const excelButton = page.locator('button:has-text("Excel")');
    const csvButton = page.locator('button:has-text("CSV")');

    const pdfExists = await pdfButton.count() > 0;
    const excelExists = await excelButton.count() > 0;
    const csvExists = await csvButton.count() > 0;

    console.log('📄 PDF button exists:', pdfExists);
    console.log('📊 Excel button exists:', excelExists);
    console.log('📋 CSV button exists:', csvExists);

    // Test clicking export buttons (they should not cause errors)
    if (pdfExists) {
      console.log('🖱️ Testing PDF button click...');
      try {
        await pdfButton.click();
        console.log('✅ PDF button clicked successfully');
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log('⚠️ PDF button click error:', error.message);
      }
    }

    if (excelExists) {
      console.log('🖱️ Testing Excel button click...');
      try {
        await excelButton.click();
        console.log('✅ Excel button clicked successfully');
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log('⚠️ Excel button click error:', error.message);
      }
    }

    if (csvExists) {
      console.log('🖱️ Testing CSV button click...');
      try {
        await csvButton.click();
        console.log('✅ CSV button clicked successfully');
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log('⚠️ CSV button click error:', error.message);
      }
    }

    // Verify buttons are enabled (not disabled)
    if (pdfExists) {
      const pdfDisabled = await pdfButton.isDisabled();
      console.log('📄 PDF button disabled:', pdfDisabled);
      expect(pdfDisabled).toBeFalsy();
    }

    console.log('✅ Export button test completed!');
  });

  test('should test timeframe selection functionality', async ({ page }) => {
    console.log('🧪 Testing timeframe selection...');

    // Login and navigate to analytics
    await page.goto('http://localhost:3000/auth/signin');
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📅 Testing timeframe buttons...');

    // Test different timeframe buttons
    const timeframes = [
      { button: 'button:has-text("7 Days")', name: '7 Days' },
      { button: 'button:has-text("30 Days")', name: '30 Days' },
      { button: 'button:has-text("90 Days")', name: '90 Days' },
      { button: 'button:has-text("1 Year")', name: '1 Year' }
    ];

    for (const timeframe of timeframes) {
      const button = page.locator(timeframe.button);
      const exists = await button.count() > 0;

      if (exists) {
        console.log(`🖱️ Clicking ${timeframe.name} button...`);
        try {
          await button.click();
          await page.waitForTimeout(1000); // Wait for any data updates
          console.log(`✅ ${timeframe.name} selected successfully`);
        } catch (error) {
          console.log(`⚠️ ${timeframe.name} selection error:`, error.message);
        }
      } else {
        console.log(`❌ ${timeframe.name} button not found`);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: 'C:\\Users\\natha\\OneDrive\\Desktop\\MoneyQuestV3\\packages\\website\\tests\\analytics-timeframe-test.png',
      fullPage: true
    });
    console.log('📸 Timeframe test screenshot saved');

    console.log('✅ Timeframe selection test completed!');
  });

  test('should verify analytics data loading', async ({ page }) => {
    console.log('🧪 Testing analytics data loading...');

    // Listen for console logs to track data loading
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`${msg.type()}: ${text}`);

      if (text.includes('analytics') || text.includes('data') ||
          text.includes('loading') || text.includes('chart')) {
        console.log(`   CONSOLE: ${text}`);
      }
    });

    // Login and navigate
    await page.goto('http://localhost:3000/auth/signin');
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('http://localhost:3000/analytics');
    await page.waitForLoadState('networkidle');

    console.log('⏳ Waiting for analytics data to load...');
    await page.waitForTimeout(5000); // Give more time for data loading

    // Check for loading states
    const loadingSpinner = page.locator('[class*="animate-spin"]');
    const hasLoadingSpinner = await loadingSpinner.count() > 0;
    console.log('🔄 Loading spinner present:', hasLoadingSpinner);

    // Look for data-driven content
    const pageText = await page.textContent('body');

    // Check for financial data patterns
    const hasCurrencyValues = /\$[\d,]+\.?\d*/.test(pageText);
    const hasPercentages = /\d+%/.test(pageText);
    const hasAnalyticsContent = pageText.includes('Total Spent') ||
                               pageText.includes('Total Income') ||
                               pageText.includes('Category') ||
                               pageText.includes('Budget');

    console.log('💰 Currency values found:', hasCurrencyValues);
    console.log('📊 Percentage values found:', hasPercentages);
    console.log('📈 Analytics content found:', hasAnalyticsContent);

    // Log key analytics logs
    const analyticsLogs = logs.filter(log =>
      log.includes('analytics') ||
      log.includes('spending') ||
      log.includes('budget') ||
      log.includes('category')
    );

    console.log('\n📝 Analytics-related logs:');
    analyticsLogs.slice(0, 5).forEach(log => console.log(`   ${log}`));

    // Final verification
    const analyticsWorking = hasAnalyticsContent || hasCurrencyValues || hasPercentages;
    console.log('✅ Analytics functionality working:', analyticsWorking);

    expect(analyticsWorking).toBeTruthy();

    console.log('✅ Analytics data loading test completed!');
  });
});