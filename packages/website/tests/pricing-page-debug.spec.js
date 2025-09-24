const { test, expect } = require('@playwright/test');

test.describe('Pricing Page Debug', () => {
  test('Debug what is actually rendered on pricing page', async ({ page }) => {
    // Go to pricing page without auth first
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    console.log('=== UNAUTHENTICATED USER ===');

    // Check what buttons exist
    const allButtons = await page.locator('button').all();
    console.log('Total buttons found:', allButtons.length);

    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
      const isVisible = await allButtons[i].isVisible();
      const isEnabled = await allButtons[i].isEnabled();
      console.log(`Button ${i}: "${buttonText}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }

    // Take screenshot
    await page.screenshot({ path: 'pricing-unauthenticated.png' });

    // Now sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Go to pricing page again
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    console.log('=== AUTHENTICATED FREE USER ===');

    // Check what buttons exist after auth
    const allButtonsAuth = await page.locator('button').all();
    console.log('Total buttons found after auth:', allButtonsAuth.length);

    for (let i = 0; i < allButtonsAuth.length; i++) {
      const buttonText = await allButtonsAuth[i].textContent();
      const isVisible = await allButtonsAuth[i].isVisible();
      const isEnabled = await allButtonsAuth[i].isEnabled();
      const className = await allButtonsAuth[i].getAttribute('class');
      console.log(`Button ${i}: "${buttonText}" - Visible: ${isVisible}, Enabled: ${isEnabled}, Class: ${className}`);
    }

    // Check if session data is loading
    const sessionData = await page.evaluate(() => {
      return window.__NEXT_DATA__ || 'No Next.js data';
    });
    console.log('Session data available:', typeof sessionData);

    // Take screenshot
    await page.screenshot({ path: 'pricing-authenticated.png' });

    // Check the actual HTML content of pricing cards
    const pricingContent = await page.locator('[data-tier]').count().catch(() => 0);
    console.log('Pricing cards with data-tier:', pricingContent);

    const cardContent = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], .card');
      return Array.from(cards).map(card => ({
        innerHTML: card.innerHTML.substring(0, 200) + '...',
        hasButtons: card.querySelectorAll('button').length
      }));
    });

    console.log('Card analysis:', JSON.stringify(cardContent.slice(0, 3), null, 2));
  });

  test('Check pricing page API calls', async ({ page }) => {
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Go to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    console.log('API Requests made:', JSON.stringify(requests, null, 2));
    console.log('API Responses:', JSON.stringify(responses, null, 2));

    // Check if subscription status API was called
    const subscriptionStatusCall = requests.find(req => req.url.includes('/subscriptions/status'));
    console.log('Subscription status API called:', !!subscriptionStatusCall);
  });
});