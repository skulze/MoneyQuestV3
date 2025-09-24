const { test, expect } = require('@playwright/test');

test.describe('Billing Page Upgrade Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MoneyQuestDB');
      }
    });

    // Enable console logging to catch any JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // Listen for any failed network requests
    page.on('requestfailed', request => {
      console.log('Failed Request:', request.url(), request.failure()?.errorText);
    });
  });

  test('Free user upgrade buttons should trigger checkout or show error', async ({ page }) => {
    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    console.log('Current URL:', page.url());

    // Find and test Plus upgrade button
    const plusUpgradeButtons = page.locator('button').filter({ hasText: /Upgrade.*Plus|Get.*Plus/ });
    const plusButtonCount = await plusUpgradeButtons.count();

    console.log('Found Plus upgrade buttons:', plusButtonCount);

    if (plusButtonCount > 0) {
      const plusButton = plusUpgradeButtons.first();
      await expect(plusButton).toBeVisible();

      // Check if button is enabled
      const isEnabled = await plusButton.isEnabled();
      console.log('Plus button is enabled:', isEnabled);

      // Listen for network requests during button click
      const requestPromise = page.waitForRequest(request =>
        request.url().includes('/api/subscriptions/create-checkout'),
        { timeout: 5000 }
      ).catch(() => null);

      const responsePromise = page.waitForResponse(response =>
        response.url().includes('/api/subscriptions/create-checkout'),
        { timeout: 5000 }
      ).catch(() => null);

      // Click the button
      await plusButton.click();

      // Wait a moment for any async operations
      await page.waitForTimeout(2000);

      // Check what happened
      const request = await requestPromise;
      const response = await responsePromise;

      if (request) {
        console.log('Checkout request made:', request.url());

        if (response) {
          const status = response.status();
          console.log('Checkout response status:', status);

          if (status === 200) {
            const responseData = await response.json().catch(() => null);
            console.log('Checkout response data:', responseData);

            // Should either redirect to checkout URL or show error
            if (responseData?.checkoutUrl) {
              // Should redirect to Stripe
              await page.waitForTimeout(1000);
              const currentUrl = page.url();
              console.log('URL after click:', currentUrl);

              // If we have a real Stripe checkout URL, it should redirect
              expect(currentUrl).not.toBe('http://localhost:3000/pricing');
            }
          } else {
            console.log('Checkout request failed with status:', status);
            // Should show error message to user
          }
        }
      } else {
        console.log('No checkout request was made - this is the bug!');

        // Let's check for JavaScript errors
        const errors = await page.evaluate(() => {
          return window.console.errors || [];
        });
        console.log('JavaScript errors:', errors);
      }
    }
  });

  test('Free user Premium upgrade button should work', async ({ page }) => {
    // Sign in as free user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Find and test Premium upgrade button
    const premiumUpgradeButtons = page.locator('button').filter({ hasText: /Upgrade.*Premium|Get.*Premium/ });
    const premiumButtonCount = await premiumUpgradeButtons.count();

    console.log('Found Premium upgrade buttons:', premiumButtonCount);

    if (premiumButtonCount > 0) {
      const premiumButton = premiumUpgradeButtons.first();
      await expect(premiumButton).toBeVisible();

      // Listen for network requests
      const requestPromise = page.waitForRequest(request =>
        request.url().includes('/api/subscriptions/create-checkout'),
        { timeout: 5000 }
      ).catch(() => null);

      // Click the button
      await premiumButton.click();
      await page.waitForTimeout(2000);

      const request = await requestPromise;

      if (request) {
        console.log('Premium checkout request made successfully');
      } else {
        console.log('Premium upgrade button not working - no request made');
      }
    }
  });

  test('Plus user Premium upgrade button should work', async ({ page }) => {
    // Sign in as plus user
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Plus users should be able to upgrade to Premium
    const premiumUpgradeButtons = page.locator('button').filter({ hasText: /Upgrade.*Premium/ });
    const premiumButtonCount = await premiumUpgradeButtons.count();

    console.log('Found Premium upgrade buttons for Plus user:', premiumButtonCount);

    if (premiumButtonCount > 0) {
      const premiumButton = premiumUpgradeButtons.first();
      await expect(premiumButton).toBeVisible();

      // Listen for network requests
      const requestPromise = page.waitForRequest(request =>
        request.url().includes('/api/subscriptions/create-checkout'),
        { timeout: 5000 }
      ).catch(() => null);

      await premiumButton.click();
      await page.waitForTimeout(2000);

      const request = await requestPromise;

      if (request) {
        console.log('Plus to Premium upgrade request made successfully');
      } else {
        console.log('Plus to Premium upgrade button not working');
      }
    }
  });

  test('Billing management buttons should work for paid users', async ({ page }) => {
    // Test Plus user billing management
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'plus@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });

    // Navigate to pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for billing management buttons
    const billingButtons = page.locator('button').filter({ hasText: /Manage.*Billing|Billing.*Portal|Current.*Plan/ });
    const billingButtonCount = await billingButtons.count();

    console.log('Found billing management buttons:', billingButtonCount);

    if (billingButtonCount > 0) {
      const billingButton = billingButtons.first();
      await expect(billingButton).toBeVisible();

      // Listen for network requests to billing portal
      const requestPromise = page.waitForRequest(request =>
        request.url().includes('/api/subscriptions/create-portal'),
        { timeout: 5000 }
      ).catch(() => null);

      await billingButton.click();
      await page.waitForTimeout(2000);

      const request = await requestPromise;

      if (request) {
        console.log('Billing portal request made successfully');
      } else {
        console.log('Billing management button not working');
      }
    }
  });

  test('Debug upgrade button click handlers', async ({ page }) => {
    // This test specifically debugs what happens when upgrade buttons are clicked
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'free@moneyquest.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Inspect the actual button elements and their event handlers
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(button => ({
        text: button.textContent?.trim(),
        disabled: button.disabled,
        onclick: button.onclick ? 'has click handler' : 'no click handler',
        classList: Array.from(button.classList),
        hasEventListener: button.addEventListener ? 'can add listeners' : 'no event capability'
      })).filter(info =>
        info.text?.includes('Upgrade') ||
        info.text?.includes('Plus') ||
        info.text?.includes('Premium')
      );
    });

    console.log('Button analysis:', JSON.stringify(buttonInfo, null, 2));

    // Check if there are any React event handlers
    const reactHandlers = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(button => {
        const props = Object.keys(button).filter(key => key.startsWith('__react'));
        return {
          text: button.textContent?.trim(),
          reactProps: props.length > 0 ? 'has react props' : 'no react props'
        };
      }).filter(info =>
        info.text?.includes('Upgrade') ||
        info.text?.includes('Plus') ||
        info.text?.includes('Premium')
      );
    });

    console.log('React handler analysis:', JSON.stringify(reactHandlers, null, 2));

    // Try to trigger click events manually and see what happens
    const upgradeButton = page.locator('button').filter({ hasText: /Upgrade.*Plus/ }).first();

    if (await upgradeButton.isVisible()) {
      // Check the button's attributes
      const buttonAttributes = await upgradeButton.evaluate(el => ({
        type: el.type,
        disabled: el.disabled,
        className: el.className,
        innerHTML: el.innerHTML
      }));

      console.log('Button attributes:', buttonAttributes);

      // Try different ways to trigger the click
      await upgradeButton.click({ force: true });
      await page.waitForTimeout(1000);

      // Check if anything changed in the DOM or network
      const afterClickUrl = page.url();
      console.log('URL after forced click:', afterClickUrl);
    }
  });
});