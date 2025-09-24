const { test, expect } = require('@playwright/test');

test('should show detailed initialization logs', async ({ page }) => {
  console.log('🧪 Testing dashboard initialization with detailed logs...');

  // Listen for console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`${msg.type()}: ${text}`);

    // Print logs in real-time for debugging
    if (text.includes('🔄') || text.includes('📊') || text.includes('🚀') || text.includes('⚠️') || text.includes('✅') || text.includes('❌')) {
      console.log(`   ${msg.type().toUpperCase()}: ${text}`);
    }
  });

  try {
    // Navigate to dashboard directly
    await page.goto('http://localhost:3000/dashboard');
    console.log('📍 Navigated to dashboard');

    // Wait for initialization to potentially complete
    await page.waitForTimeout(10000);

    // Check what's on the page
    const pageText = await page.textContent('body');
    const hasInitializingText = pageText.includes('Initializing your data');
    const hasDashboardContent = pageText.includes('Dashboard') || pageText.includes('Welcome');

    console.log('📄 Page content analysis:');
    console.log('   Has "Initializing" text:', hasInitializingText);
    console.log('   Has dashboard content:', hasDashboardContent);

    // Print summary of important logs
    const importantLogs = logs.filter(log =>
      log.includes('useDataEngine') ||
      log.includes('Session status') ||
      log.includes('data engine') ||
      log.includes('IndexedDB') ||
      log.includes('Starting IndexedDB')
    );

    console.log('\n📝 Important logs captured:');
    if (importantLogs.length > 0) {
      importantLogs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('   No important initialization logs found');
    }

    // Show a few lines of page content for debugging
    console.log('\n📋 Page content preview:');
    console.log(pageText.substring(0, 300) + '...');

  } catch (error) {
    console.error('Test error:', error);
  }
});