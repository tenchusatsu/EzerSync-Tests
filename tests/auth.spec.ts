import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully register, log out, and log back in', async ({ page }) => {
    
    await page.route('**/api.php*', async (route) => {
      const headers = route.request().headers();
      headers['X-Playwright-Test'] = 'true';
      await route.continue({ headers });
    });

    await page.goto('/');
    
    await page.click('text="Create a new hub"');

    const uniqueHub = 'test' + Date.now();
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[type="password"]', '1234');
    
    await page.click('button:has-text("Create Household")');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Open Settings"]', { force: true });
    await page.click('button:has-text("Sign Out")', { force: true });

    await expect(page.getByText('Log in or create a new household hub')).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder="e.g. smithfamily"]', uniqueHub);
    await page.fill('input[type="password"]', '1234');
    await page.click('button:has-text("Access Dashboard")');

    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  });
});
