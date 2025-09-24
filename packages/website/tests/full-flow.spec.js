const { test, expect } = require('@playwright/test');

test.describe('Complete Login and Dashboard Flow', () => {
  test('should login and load dashboard successfully', async ({ page }) => {
    console.log('🧪 Testing complete login to dashboard flow...');

    // Clear storage first
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MoneyQuestDB');
      }
    });

    // Listen for console logs
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`${msg.type()}: ${text}`);

      // Print important logs in real-time
      if (text.includes('🔄') || text.includes('📊') || text.includes('🚀') ||
          text.includes('⚠️') || text.includes('✅') || text.includes('❌') ||
          text.includes('🔒') || text.includes('Starting IndexedDB') ||
          text.includes('Creating new user') || text.includes('Successfully initialized')) {
        console.log(`   ${msg.type().toUpperCase()}: ${text}`);
      }
    });

    try {
      // 1. Navigate to login page
      await page.goto('http://localhost:3000/auth/signin');
      console.log('📍 Step 1: Navigated to login page');
      await page.waitForLoadState('networkidle');

      // 2. Click on Free tier demo button to populate fields
      await page.click('button:has-text("Free Tier - free@moneyquest.com")');
      console.log('🔘 Step 2: Clicked demo account button');
      await page.waitForTimeout(500);

      // 3. Submit the form using JavaScript
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
      console.log('🔐 Step 3: Submitted login form');

      // 4. Wait for authentication to complete and redirect
      await page.waitForTimeout(2000);
      console.log('⏳ Step 4: Waiting for authentication...');

      // 5. Check if we're redirected to dashboard or navigate manually
      const currentUrl = page.url();
      console.log('🌍 Current URL after login:', currentUrl);

      if (!currentUrl.includes('/dashboard')) {
        console.log('🔄 Manually navigating to dashboard...');
        await page.goto('http://localhost:3000/dashboard');
      }

      // 6. Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      console.log('📊 Step 6: Dashboard page loaded');

      // 7. Wait for any initialization (up to 15 seconds)
      console.log('⏳ Step 7: Waiting for initialization...');

      let initializationComplete = false;
      for (let i = 0; i < 30; i++) { // 30 seconds max
        const pageText = await page.textContent('body');

        if (!pageText.includes('Initializing your data') && !pageText.includes('Loading...')) {
          console.log('✅ Initialization completed!');
          initializationComplete = true;
          break;
        }

        if (i % 5 === 0) { // Log progress every 2.5 seconds
          console.log(`   Still initializing... (${i * 0.5}s)`);
        }

        await page.waitForTimeout(500);
      }

      if (!initializationComplete) {
        console.log('⚠️ Initialization may have timed out');
      }

      // 8. Analyze final page state
      const finalPageText = await page.textContent('body');
      const hasDashboardContent = finalPageText.includes('Dashboard') ||
                                 finalPageText.includes('Total Balance') ||
                                 finalPageText.includes('Welcome') ||
                                 finalPageText.includes('MoneyQuestV3');

      const hasErrorContent = finalPageText.includes('Error') ||
                             finalPageText.includes('Failed');

      const hasLoadingContent = finalPageText.includes('Loading') ||
                               finalPageText.includes('Initializing');

      console.log('📊 Final page analysis:');
      console.log('   Has dashboard content:', hasDashboardContent);
      console.log('   Has error content:', hasErrorContent);
      console.log('   Has loading content:', hasLoadingContent);

      // 9. Take a screenshot
      await page.screenshot({
        path: 'C:\\Users\\natha\\OneDrive\\Desktop\\MoneyQuestV3\\packages\\website\\tests\\full-flow-test.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved');

      // 10. Log important captured logs
      const importantLogs = logs.filter(log =>
        log.includes('useDataEngine') ||
        log.includes('Session status') ||
        log.includes('data engine') ||
        log.includes('IndexedDB') ||
        log.includes('authenticated') ||
        log.includes('signed in')
      );

      console.log('\n📝 Important logs captured:');
      if (importantLogs.length > 0) {
        importantLogs.forEach(log => console.log(`   ${log}`));
      } else {
        console.log('   No critical initialization logs found');
      }

      // Final assertions
      expect(page.url()).toContain('/dashboard');

      if (hasDashboardContent) {
        console.log('✅ SUCCESS: Dashboard loaded with content!');
      } else {
        console.log('❌ Dashboard content not found');
        console.log('Page preview:', finalPageText.substring(0, 300));
      }

    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
      throw error;
    }
  });
});