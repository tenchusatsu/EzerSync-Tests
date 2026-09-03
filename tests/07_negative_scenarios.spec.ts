import { test, expect } from '@playwright/test';

test.describe('Negative Scenarios & Validation Gates', () => {

  test.beforeEach(async ({ page }) => {
    // Ensure clean unauthenticated state for negative tests
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Invalid PIN Login Rejection: Shows error banner and blocks dashboard access', async ({ page }) => {
    const uniqueHub = 'authneg' + Date.now();
    
    // 1. Create a real household with PIN 1234
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Attempt login with wrong PIN 9999
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await page.fill('input[placeholder="****"]', '9999');
    await page.click('button:has-text("Access Dashboard")');

    // 4. Assert error banner appears and dashboard is NOT accessed
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Incorrect PIN/i);
    await expect(page.locator('button[aria-label="Open Settings"]')).not.toBeAttached();
  });

  test('Non-Existent Household Login: Rejects unknown hub ID', async ({ page }) => {
    // Switch to login if on register
    const switchLogin = page.locator('button:has-text("Already have a hub? Log In")');
    if (await switchLogin.isVisible()) {
      await switchLogin.click();
    }

    // Attempt login with a random ghost hub
    await page.fill('input[placeholder*="smithfamily"]', 'ghosthub_' + Date.now());
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Access Dashboard")');

    // Assert error banner appears
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Household not found/i);
    await expect(page.locator('button[aria-label="Open Settings"]')).not.toBeAttached();
  });

  test('Registration Validation Rejection: Duplicate Hub ID rejects creation', async ({ page }) => {
    const existingHub = 'dupereg' + Date.now();

    // 1. Create first household
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', existingHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Original Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin 1');
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Attempt registering another household with the EXACT same hub ID
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', existingHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Duplicate Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin 2');
    await page.fill('input[placeholder="****"]', '5678');
    await page.click('button:has-text("Create Household")');

    // 4. Assert error banner rejects duplicate creation
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Household ID already exists/i);
    await expect(page.locator('button[aria-label="Open Settings"]')).not.toBeAttached();
  });

  test('Invalid Master Recovery Code: Rejects unauthorized PIN reset', async ({ page }) => {
    const uniqueHub = 'recovneg' + Date.now();
    
    // 1. Create household
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1111');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Initiate Forgot PIN flow
    await page.click('button:has-text("Forgot PIN?")');
    await expect(page.locator('button:has-text("Reset PIN")')).toBeVisible();

    // 4. Fill Recovery Form with invalid master code
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await page.fill('input[placeholder="Enter admin code"]', 'wrong-bogus-code');
    await page.fill('input[placeholder="****"]', '55555555');
    await page.click('button:has-text("Reset PIN")');

    // 5. Assert error banner appears and PIN was NOT updated
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Recovery failed|Invalid/i);
  });

  test('Bogus Recipe Import Code Rejection: Shows failure alert', async ({ page }) => {
    // 1. Register and login
    const uniqueHub = 'recipeneg' + Date.now();
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Open Cookbook tab
    const cookbookNav = page.locator('nav button, aside button, button').filter({ hasText: /📖.*Cookbook|Cookbook/i }).filter({ visible: true }).first();
    await cookbookNav.click({ force: true });
    await page.waitForTimeout(500);

    // 3. Open Import Modal
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    await page.locator('button:has-text("📥 Import Shared Recipe")').click();
    await expect(page.locator('h3:has-text("Import Shared Recipe")')).toBeVisible();

    // 4. Set up dialog expectation for failure alert
    let dialogTriggered = false;
    page.on('dialog', async dialog => {
      dialogTriggered = true;
      expect(dialog.message()).toMatch(/failed|not found|invalid/i);
      await dialog.accept();
    });

    // 5. Attempt importing bogus code
    await page.fill('input[placeholder="RCP-XXXX-XXXX"]', 'RCP-0000-0000');
    await page.locator('button:has-text("Import")').click();
    await page.waitForTimeout(1000);

    expect(dialogTriggered).toBe(true);
    await expect(page.locator('h4:has-text("RCP-0000-0000")')).toHaveCount(0);
  });

  test('Form Validation Negatives: Empty Event and Chore titles are prevented', async ({ page }) => {
    // 1. Register and login
    const uniqueHub = 'formneg' + Date.now();
    await page.waitForSelector('text="Create a new hub"');
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
    await page.fill('input[placeholder="****"]', '1234');
    await page.click('button:has-text("Create Household")');
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });

    // 2. Switch to Calendar tab
    await page.locator('nav button, aside button, button').filter({ hasText: /📅.*Calendar|Calendar/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Open + Event modal
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    const eventModalTitle = page.locator('h3').filter({ hasText: /Add Calendar Event|Add Event|New Event/i });
    await expect(eventModalTitle).toBeVisible();

    // Leave title blank and attempt save
    await page.locator('button:has-text("Save")').locator('visible=true').first().click({ force: true });
    // Event modal should NOT close because title is required
    await expect(eventModalTitle).toBeVisible();
    
    // Close modal
    await page.locator('.fixed button:has-text("✕")').first().click({ force: true });

    // 3. Switch to Tasks tab
    await page.locator('nav button, aside button, button').filter({ hasText: /📋.*Tasks|Tasks/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Open + Task modal
    await page.locator('button:has-text("+ Task")').locator('visible=true').first().click({ force: true });
    const choreModalTitle = page.locator('h3').filter({ hasText: /Schedule Chore|Add Task|Add New Task/i });
    await expect(choreModalTitle).toBeVisible();

    // Leave title blank and attempt save
    await page.locator('button:has-text("Save Task Schedule")').locator('visible=true').first().click({ force: true });
    // Chore modal should NOT close
    await expect(choreModalTitle).toBeVisible();
  });

});
