import { test, expect } from '@playwright/test';

test.describe('Authentication & Master PIN Recovery', () => {

  test('Register a new household hub (tests 8-digit PIN limit & placeholder fix)', async ({ page }) => {
    const uniqueHub = 'authreg' + Date.now();
    await page.goto('/');
    await page.waitForSelector('text="Create a new hub"'); // Updated label
    await page.click('text="Create a new hub"');

    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    
    // Assert Bug Fix: maxLength is now 8, placeholder is **** (not ????)
    const pinInput = page.locator('input[placeholder="****"]');
    await expect(pinInput).toBeVisible();
    await expect(pinInput).toHaveAttribute('maxLength', '8');
    
    await pinInput.fill('12345678'); // Testing 8 digits
    
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  });

  test('Log into an existing household', async ({ page }) => {
    const uniqueHub = 'authlogin' + Date.now();
    
    // Register
    await page.goto('/');
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });
    
    // Login with matching hub ID
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Access Dashboard")');
    
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  });

  test('Hybrid PIN Reset & Admin Recovery Flow', async ({ page }) => {
    const uniqueHub = 'authrecovery' + Date.now();
    
    // 1. Register with initial PIN
    await page.goto('/');
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1111'); // Initial PIN
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });
    
    // 3. Initiate Forgot PIN flow
    await page.click('button:has-text("Forgot PIN?")');
    
    // Assert Recovery UI is visible
    await expect(page.locator('button:has-text("Reset PIN")')).toBeVisible();
    await expect(page.locator('label:has-text("Master Recovery Code")')).toBeVisible();

    // Set up dialog handler to catch the successful reset alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('PIN successfully reset!');
      await dialog.accept();
    });

    // 4. Fill Recovery Form
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await page.fill('input[placeholder="Enter admin code"]', 'whenlifegivesyoulemons');
    await page.fill('input[placeholder="****"]', '99998888'); // New 8-digit PIN
    
    // Submit Reset
    await page.click('button:has-text("Reset PIN")');
    
    // 5. Assert Bug Fix: Form state is completely cleared and we are back to login
    await expect(page.locator('button:has-text("Access Dashboard")')).toBeVisible();
    const loginPinInput = page.locator('input[placeholder="****"]');
    await expect(loginPinInput).toHaveValue(''); // Asserts state isn't ghost-filling
    
    // 6. Assert Bug Fix: Successfully log in with NEW PIN (proves backend pin_hash override works)
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await loginPinInput.fill('99998888');
    await page.click('button:has-text("Access Dashboard")');
    
    // Dashboard should load
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  });

});
