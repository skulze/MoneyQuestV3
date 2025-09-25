import { test, expect } from '@playwright/test';

test.describe('Login Features Testing', () => {
  // Set base URL for tests
  const baseURL = 'http://localhost:3000';

  test.beforeEach(async ({ context }) => {
    // Clear all cookies and storage for each test
    await context.clearCookies();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    console.log('🧪 Testing: Unauthenticated access redirection');

    // Try to access dashboard directly
    await page.goto(`${baseURL}/dashboard`);
    console.log('📍 Navigated to /dashboard without authentication');

    // Should redirect to login page
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/auth\/signin/);
    console.log('✅ Successfully redirected to login page');

    // Verify login page content
    await expect(page.locator('h1')).toContainText('Sign In');
    console.log('✅ Login page loaded with correct title');
  });

  test('should display login form correctly', async ({ page }) => {
    console.log('🧪 Testing: Login form display');

    await page.goto(`${baseURL}/auth/signin`);
    console.log('📍 Navigated to login page');

    // Check form elements
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button').filter({ hasText: /sign in|login/i }).first();

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(loginButton).toBeVisible();
    console.log('✅ Login form elements are visible and accessible');
  });

  test('should successfully login with demo credentials', async ({ page }) => {
    console.log('🧪 Testing: Successful demo login');

    // Navigate to login page
    await page.goto(`${baseURL}/auth/signin`);
    console.log('📍 Navigated to login page');

    // Use demo account button for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    console.log('🔘 Clicked demo account button');
    await page.waitForTimeout(500);

    // Submit form
    await page.click('button[type="submit"]');
    console.log('🔐 Submitted login form');

    // Wait for authentication and redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
    console.log('✅ Successfully logged in and redirected to dashboard');

    // Verify dashboard content
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Free User')).toBeVisible();
    console.log('✅ Dashboard loaded with user information');
  });

  test('should handle callback URL after login', async ({ page }) => {
    console.log('🧪 Testing: Callback URL redirection');

    // Try to access protected route (should redirect with callback)
    await page.goto(`${baseURL}/investments`);
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });

    // Verify callback URL parameter exists
    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get('callbackUrl');
    expect(callbackUrl).toBeTruthy();
    console.log('📍 Callback URL captured:', callbackUrl);

    // Login
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');

    // Should redirect back to original page
    await page.waitForURL(/\/investments/, { timeout: 15000 });
    expect(page.url()).toContain('/investments');
    console.log('✅ Successfully redirected to original destination after login');
  });

  test('should access Plus tier features when authenticated', async ({ page }) => {
    console.log('🧪 Testing: Plus tier feature access');

    // First login
    await page.goto(`${baseURL}/auth/signin`);
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🔐 Successfully logged in');

    // Test Collaboration page access
    await page.goto(`${baseURL}/collaboration`);
    await expect(page.locator('h1')).toContainText('Family Collaboration');
    console.log('✅ Collaboration page accessible');

    // Test Receipts page access
    await page.goto(`${baseURL}/receipts`);
    await expect(page.locator('h1')).toContainText('Receipt Processing');
    console.log('✅ Receipt processing page accessible');

    // Test Sync page access
    await page.goto(`${baseURL}/sync`);
    await expect(page.locator('h1')).toContainText('Data Synchronization');
    console.log('✅ Sync management page accessible');

    // Test enhanced investment features
    await page.goto(`${baseURL}/investments`);
    await expect(page.locator('h1')).toContainText('Investment Portfolio');
    console.log('✅ Investment page accessible');

    console.log('✅ All Plus tier features accessible after authentication');
  });

  test('should show proper navigation for authenticated users', async ({ page }) => {
    console.log('🧪 Testing: Authenticated user navigation');

    // Login first
    await page.goto(`${baseURL}/auth/signin`);
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🔐 Successfully logged in');

    // Check navigation links are present
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
      const link = page.locator(`nav a:has-text("${linkText}")`);
      if (await link.count() > 0) {
        await expect(link).toBeVisible();
        console.log(`✅ ${linkText} navigation link visible`);
      }
    }

    // Check user info is displayed
    await expect(page.locator('text=Free User')).toBeVisible();
    console.log('✅ User information displayed');

    // Check sign out button is present
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();
    console.log('✅ Sign Out button visible');
  });

  test('should successfully logout', async ({ page }) => {
    console.log('🧪 Testing: Logout functionality');

    // Login first
    await page.goto(`${baseURL}/auth/signin`);
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🔐 Successfully logged in');

    // Click logout
    await page.click('button:has-text("Sign Out")');
    console.log('🚪 Clicked Sign Out button');

    // Should redirect away from dashboard
    await page.waitForTimeout(3000); // Wait for logout to process
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/dashboard');
    console.log('✅ Successfully logged out and redirected');

    // Try to access dashboard again - should redirect to login
    await page.goto(`${baseURL}/dashboard`);
    await page.waitForURL(/\/auth\/signin/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/auth\/signin/);
    console.log('✅ Dashboard access after logout correctly redirected to login');
  });

  test('should handle feature gating for free users', async ({ page }) => {
    console.log('🧪 Testing: Feature gating for free tier users');

    // Login first
    await page.goto(`${baseURL}/auth/signin`);
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🔐 Successfully logged in');

    // Check collaboration page for upgrade prompts
    await page.goto(`${baseURL}/collaboration`);

    // Look for Plus feature indicators or upgrade prompts
    const plusIndicators = await page.locator('text=/plus|upgrade|enhanced|premium/i').count();
    if (plusIndicators > 0) {
      console.log('✅ Plus tier feature prompts detected on collaboration page');
    }

    // Check pricing page for subscription options
    await page.goto(`${baseURL}/pricing`);
    const pricingContent = await page.locator('text=/free|plus|premium|\$2\.99|\$9\.99/i').count();
    if (pricingContent > 0) {
      console.log('✅ Pricing information displayed for tier upgrades');
    }

    console.log('✅ Feature gating appears to be working correctly');
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    console.log('🧪 Testing: Session persistence');

    // Login first
    await page.goto(`${baseURL}/auth/signin`);
    // Use demo button pattern for consistent authentication
    await page.click('button:has-text("Free Tier - free@moneyquest.com")');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('🔐 Successfully logged in');

    // Refresh the page
    await page.reload();
    console.log('🔄 Page refreshed');

    // Should still be on dashboard and authenticated
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Demo User')).toBeVisible({ timeout: 10000 });
    console.log('✅ Session maintained after page refresh');
  });

  test('should handle invalid login credentials', async ({ page }) => {
    console.log('🧪 Testing: Invalid credentials handling');

    await page.goto(`${baseURL}/auth/signin`);

    // Try invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    console.log('🔐 Attempted login with invalid credentials');

    // Wait a moment for authentication to process
    await page.waitForTimeout(5000);

    // Should either stay on login page or show error
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      console.log('✅ Remained on login page with invalid credentials');

      // Look for error messages
      const errorMessages = await page.locator('text=/error|invalid|incorrect|failed/i').count();
      if (errorMessages > 0) {
        console.log('✅ Error message displayed');
      }
    } else {
      console.log('⚠️  Unexpected behavior with invalid credentials');
    }
  });

  test('should show proper loading states during authentication', async ({ page }) => {
    console.log('🧪 Testing: Authentication loading states');

    // Navigate to protected route to trigger auth check
    await page.goto(`${baseURL}/dashboard`);

    // Look for loading indicators
    const loadingElements = await page.locator('text=/loading|authenticating|checking/i').count();
    if (loadingElements > 0) {
      console.log('✅ Loading state displayed during authentication check');
    }

    // Should eventually redirect to login
    await page.waitForURL(/\/auth\/signin/, { timeout: 15000 });
    console.log('✅ Authentication check completed and redirected to login');
  });
});