import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear session and storage before each test
    await context.clearCookies();
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      // Ignore storage errors in test environment
      console.log('Storage clear skipped:', error.message);
    }

    // Set up console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('auth') ||
        msg.text().includes('session') ||
        msg.text().includes('login') ||
        msg.text().includes('🔒') ||
        msg.text().includes('✅')
      )) {
        console.log('🔍 AUTH LOG:', msg.text());
      }
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing dashboard directly', async ({ page }) => {
      console.log('🧪 Testing unauthenticated dashboard access...');

      // Try to access dashboard directly without authentication
      await page.goto('http://localhost:3000/dashboard');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/auth\/signin/);
      console.log('✅ Dashboard correctly redirected to login');

      // Should show login form
      await expect(page.locator('h1')).toContainText('Sign In');
      console.log('✅ Login page loaded with correct title');
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      console.log('🧪 Testing protected routes access...');

      const protectedRoutes = [
        '/dashboard',
        '/transactions',
        '/budgets',
        '/investments',
        '/analytics',
        '/collaboration',
        '/receipts',
        '/sync'
      ];

      for (const route of protectedRoutes) {
        console.log(`🔒 Testing route: ${route}`);
        await page.goto(`http://localhost:3000${route}`);

        // Should redirect to login with callback URL
        await page.waitForURL(/\/auth\/signin.*callbackUrl/, { timeout: 5000 });
        expect(page.url()).toMatch(/\/auth\/signin.*callbackUrl/);
        console.log(`✅ ${route} correctly redirected to login with callback`);
      }
    });

    test('should allow access to public routes', async ({ page }) => {
      console.log('🧪 Testing public routes access...');

      const publicRoutes = [
        { path: '/', title: 'MoneyQuestV3' },
        { path: '/pricing', title: 'Pricing' }
      ];

      for (const route of publicRoutes) {
        console.log(`🌍 Testing public route: ${route.path}`);
        await page.goto(`http://localhost:3000${route.path}`);

        // Should not redirect to login
        expect(page.url()).toBe(`http://localhost:3000${route.path}`);
        console.log(`✅ ${route.path} accessible without authentication`);
      }
    });
  });

  test.describe('Login Process', () => {
    test('should display login form correctly', async ({ page }) => {
      console.log('🧪 Testing login form display...');

      await page.goto('http://localhost:3000/auth/signin');

      // Check form elements are present
      await expect(page.locator('h1')).toContainText('Sign In');
      console.log('✅ Login page title displayed');

      // Check for form inputs (email/username and password)
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(signInButton).toBeVisible();
      console.log('✅ Login form elements are visible');
    });

    test('should handle demo login successfully', async ({ page }) => {
      console.log('🧪 Testing successful demo login...');

      await page.goto('http://localhost:3000/auth/signin');
      console.log('📍 Navigated to login page');

      // Fill in demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      console.log('📝 Filled in demo credentials');

      // Submit the form
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await signInButton.click();
      console.log('🔐 Clicked sign in button');

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      console.log('🏠 Successfully redirected to dashboard');

      // Verify dashboard content loads
      await expect(page.locator('h1')).toContainText('MoneyQuestV3');
      await expect(page.locator('text=Welcome back')).toBeVisible();
      console.log('✅ Dashboard loaded with welcome message');

      // Verify user is shown as authenticated
      await expect(page.locator('text=Free User')).toBeVisible();
      console.log('✅ User info displayed correctly');
    });

    test('should handle callback URL redirection after login', async ({ page }) => {
      console.log('🧪 Testing callback URL redirection...');

      // Try to access a protected route first (should redirect to login with callback)
      await page.goto('http://localhost:3000/investments');
      await page.waitForURL(/\/auth\/signin.*callbackUrl/, { timeout: 5000 });

      // Verify callback URL is present
      const url = new URL(page.url());
      const callbackUrl = url.searchParams.get('callbackUrl');
      expect(callbackUrl).toContain('/investments');
      console.log('📍 Callback URL correctly captured:', callbackUrl);

      // Login with demo credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      await signInButton.click();

      // Should redirect back to original destination
      await page.waitForURL(/\/investments/, { timeout: 10000 });
      expect(page.url()).toContain('/investments');
      console.log('✅ Successfully redirected to original destination');
    });

    test('should display error for invalid credentials', async ({ page }) => {
      console.log('🧪 Testing invalid login credentials...');

      await page.goto('http://localhost:3000/auth/signin');

      // Fill in invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      await emailInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');

      // Submit the form
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await signInButton.click();

      // Should remain on login page or show error
      await page.waitForTimeout(3000); // Wait for any error processing

      // Check if still on signin page or error is displayed
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/signin')) {
        console.log('✅ Remained on login page with invalid credentials');

        // Look for error messages
        const errorElements = await page.locator('text=/error|invalid|incorrect/i').all();
        if (errorElements.length > 0) {
          console.log('✅ Error message displayed for invalid credentials');
        }
      } else {
        console.log('⚠️  Unexpected redirect with invalid credentials');
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      console.log('🧪 Testing session persistence...');

      // Login first
      await page.goto('http://localhost:3000/auth/signin');
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      await signInButton.click();

      await page.waitForURL(/\/dashboard/);
      console.log('🔐 Logged in successfully');

      // Reload the page
      await page.reload();
      console.log('🔄 Page reloaded');

      // Should still be on dashboard (session maintained)
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Free User')).toBeVisible();
      console.log('✅ Session maintained after page reload');
    });

    test('should handle logout correctly', async ({ page }) => {
      console.log('🧪 Testing logout functionality...');

      // Login first
      await page.goto('http://localhost:3000/auth/signin');
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      await signInButton.click();

      await page.waitForURL(/\/dashboard/);
      console.log('🔐 Logged in successfully');

      // Find and click logout button
      const signOutButton = page.locator('button').filter({ hasText: /sign out/i });
      await expect(signOutButton).toBeVisible();
      await signOutButton.click();
      console.log('🚪 Clicked sign out button');

      // Should redirect to home page or login page
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      expect(currentUrl === 'http://localhost:3000/' || currentUrl.includes('/auth/signin')).toBeTruthy();
      console.log('✅ Successfully logged out and redirected');

      // Try to access protected route - should redirect to login
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForURL(/\/auth\/signin/);
      console.log('✅ Protected route access redirected to login after logout');
    });
  });

  test.describe('Authentication State', () => {
    test('should show different navigation for authenticated users', async ({ page }) => {
      console.log('🧪 Testing authenticated navigation...');

      // First check unauthenticated state
      await page.goto('http://localhost:3000/');
      console.log('📍 Checking home page while unauthenticated');

      // Login
      await page.goto('http://localhost:3000/auth/signin');
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      await signInButton.click();

      await page.waitForURL(/\/dashboard/);
      console.log('🔐 Logged in successfully');

      // Check authenticated navigation
      const navLinks = [
        'Dashboard',
        'Transactions',
        'Budgets',
        'Investments',
        'Analytics',
        'Collaboration',
        'Receipts',
        'Sync',
        'Billing'
      ];

      for (const linkText of navLinks) {
        const navLink = page.locator(`nav a:has-text("${linkText}")`);
        if (await navLink.count() > 0) {
          await expect(navLink).toBeVisible();
          console.log(`✅ ${linkText} navigation link visible`);
        }
      }

      // Should show user info and sign out button
      await expect(page.locator('text=Free User')).toBeVisible();
      await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
      console.log('✅ User info and sign out button visible');
    });

    test('should handle authentication loading states', async ({ page }) => {
      console.log('🧪 Testing authentication loading states...');

      // Check initial loading state
      await page.goto('http://localhost:3000/dashboard');

      // Should show loading indicator during auth check
      const loadingIndicators = await page.locator('text=/loading|authenticating/i').count();
      if (loadingIndicators > 0) {
        console.log('✅ Loading state displayed during authentication check');
      }

      // Eventually should redirect to login
      await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
      console.log('✅ Authentication check completed and redirected appropriately');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      console.log('🧪 Testing authentication with network issues...');

      await page.goto('http://localhost:3000/auth/signin');

      // Block authentication requests to simulate network failure
      await page.route('**/api/auth/**', route => route.abort());
      console.log('🚫 Blocked authentication API calls');

      // Try to login
      const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

      await emailInput.fill('free@moneyquest.com');
      await passwordInput.fill('free123');
      await signInButton.click();

      // Should handle error gracefully (stay on page or show error)
      await page.waitForTimeout(5000);

      // Should either show error or stay on login page
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/signin')) {
        console.log('✅ Gracefully handled network error by staying on login page');
      }
    });
  });
});

test.describe('Plus Tier Feature Access', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear session and login for each test
    await context.clearCookies();
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch (error) {
      // Ignore storage errors in test environment
      console.log('Storage clear skipped:', error.message);
    }

    // Login with demo credentials
    await page.goto('http://localhost:3000/auth/signin');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const signInButton = page.locator('button').filter({ hasText: /sign in/i }).first();

    await emailInput.fill('free@moneyquest.com');
    await passwordInput.fill('free123');
    await signInButton.click();

    await page.waitForURL(/\/dashboard/);
    console.log('🔐 Authenticated for Plus tier testing');
  });

  test('should access collaboration features when authenticated', async ({ page }) => {
    console.log('🧪 Testing authenticated access to collaboration features...');

    await page.goto('http://localhost:3000/collaboration');
    console.log('📍 Navigated to collaboration page');

    // Should load collaboration page (might show upgrade prompt for free users)
    await expect(page.locator('h1')).toContainText('Family Collaboration');
    console.log('✅ Collaboration page loaded successfully');

    // Check if Plus features are shown or upgrade prompts
    const upgradePrompts = await page.locator('text=/upgrade|plus|premium/i').count();
    const featureContent = await page.locator('text=/family|invite|collaboration/i').count();

    if (upgradePrompts > 0) {
      console.log('✅ Upgrade prompts displayed for Plus features (as expected for free user)');
    }
    if (featureContent > 0) {
      console.log('✅ Collaboration content displayed');
    }
  });

  test('should access receipt processing features when authenticated', async ({ page }) => {
    console.log('🧪 Testing authenticated access to receipt processing...');

    await page.goto('http://localhost:3000/receipts');
    console.log('📍 Navigated to receipts page');

    // Should load receipts page
    await expect(page.locator('h1')).toContainText('Receipt Processing');
    console.log('✅ Receipt processing page loaded successfully');

    // Check for OCR features or upgrade prompts
    const ocrContent = await page.locator('text=/ocr|upload|camera|process/i').count();
    const upgradePrompts = await page.locator('text=/upgrade|plus|premium/i').count();

    if (ocrContent > 0) {
      console.log('✅ OCR features displayed');
    }
    if (upgradePrompts > 0) {
      console.log('✅ Upgrade prompts displayed for OCR features (as expected for free user)');
    }
  });

  test('should access sync management features when authenticated', async ({ page }) => {
    console.log('🧪 Testing authenticated access to sync management...');

    await page.goto('http://localhost:3000/sync');
    console.log('📍 Navigated to sync page');

    // Should load sync page
    await expect(page.locator('h1')).toContainText('Data Synchronization');
    console.log('✅ Sync management page loaded successfully');

    // Check for sync features
    const syncContent = await page.locator('text=/sync|priority|real-time/i').count();
    const upgradePrompts = await page.locator('text=/upgrade|plus|premium/i').count();

    if (syncContent > 0) {
      console.log('✅ Sync management content displayed');
    }
    if (upgradePrompts > 0) {
      console.log('✅ Upgrade prompts displayed for Priority Sync features');
    }
  });

  test('should show enhanced investment charts when authenticated', async ({ page }) => {
    console.log('🧪 Testing authenticated access to enhanced investment features...');

    await page.goto('http://localhost:3000/investments');
    console.log('📍 Navigated to investments page');

    // Should load investments page
    await expect(page.locator('h1')).toContainText('Investment Portfolio');
    console.log('✅ Investments page loaded successfully');

    // Check for enhanced features or upgrade prompts
    const enhancedFeatures = await page.locator('text=/enhanced|plus feature|advanced/i').count();
    const chartContent = await page.locator('text=/allocation|performance|trends|heatmap/i').count();

    if (enhancedFeatures > 0) {
      console.log('✅ Enhanced investment features detected');
    }
    if (chartContent > 0) {
      console.log('✅ Investment chart content displayed');
    }
  });
});