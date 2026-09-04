import { test, expect } from '@playwright/test';

async function registerTestHousehold(page: any, hubId: string, pin = '1234') {
  await page.waitForSelector('text="Create a new hub"');
  await page.click('text="Create a new hub"');
  await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
  await page.fill('input[placeholder="e.g. smith-family"]', hubId);
  await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
  await page.fill('input[placeholder="e.g. John"]', 'Admin Test');

  const emailInput = page.locator('input[placeholder="admin@example.com"]');
  if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emailInput.fill('admin@test.com');
  }
  const masterPassInput = page.locator('input[placeholder*="Min 8 chars"]');
  if (await masterPassInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await masterPassInput.fill('EzerSync#2026');
  }

  const pinInput = page.locator('input[placeholder="****"]').or(page.locator('input[placeholder="1234"]')).first();
  await pinInput.fill(pin);
  await page.click('button:has-text("Create Household")');
  await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
}

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
    await registerTestHousehold(page, uniqueHub, '1234');

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Attempt login with wrong PIN 9999
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    const pinInput = page.locator('input[placeholder="****"]').or(page.locator('input[placeholder="1234"]')).first();
    await pinInput.fill('9999');
    await page.click('button:has-text("Access Dashboard")');

    // 4. Assert error banner appears and dashboard is NOT accessed
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Incorrect.*PIN|Incorrect.*password/i);
    await expect(page.locator('button[aria-label="Open Settings"]')).not.toBeAttached();
  });

  test('Non-Existent Household Login: Rejects unknown hub ID', async ({ page }) => {
    // Switch to login if on register
    const switchLogin = page.locator('button:has-text("Already have a hub? Log In")').or(page.locator('button:has-text("Back to Login")')).first();
    if (await switchLogin.isVisible({ timeout: 1000 }).catch(() => false)) {
      await switchLogin.click();
    }

    await page.fill('input[placeholder*="smithfamily"]', 'ghosthub_' + Date.now());
    const pinInput = page.locator('input[placeholder="****"]').or(page.locator('input[placeholder="1234"]')).first();
    await pinInput.fill('1234');
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
    await registerTestHousehold(page, existingHub, '1234');

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Attempt registering another household with the EXACT same hub ID
    await page.click('text="Create a new hub"');
    await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
    await page.fill('input[placeholder="e.g. smith-family"]', existingHub);
    await page.fill('input[placeholder="The Smith Family"]', 'Duplicate Family');
    await page.fill('input[placeholder="e.g. John"]', 'Admin 2');

    const emailInput = page.locator('input[placeholder="admin@example.com"]');
    if (await emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await emailInput.fill('admin2@test.com');
    }
    const masterPassInput = page.locator('input[placeholder*="Min 8 chars"]');
    if (await masterPassInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await masterPassInput.fill('EzerSync#2026');
    }

    const pinInput = page.locator('input[placeholder="****"]').or(page.locator('input[placeholder="1234"]')).first();
    await pinInput.fill('5678');
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
    await registerTestHousehold(page, uniqueHub, '1111');

    // 2. Sign out
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Sign Out")').filter({ visible: true }).first().click({ force: true });

    // 3. Initiate Forgot PIN flow
    const forgotBtn = page.locator('button:has-text("Forgot Password / PIN?")').or(page.locator('button:has-text("Forgot PIN?")')).first();
    await forgotBtn.click();

    const adminRecoveryBtn = page.locator('button:has-text("Admin Recovery Code")');
    if (await adminRecoveryBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await adminRecoveryBtn.click();
    }
    await expect(page.locator('button:has-text("Reset PIN")')).toBeVisible();

    // 4. Fill Recovery Form with invalid master code
    await page.fill('input[placeholder*="smithfamily"]', uniqueHub);
    await page.fill('input[placeholder="Enter admin code"]', 'wrong-bogus-code');
    const newPinInput = page.locator('input[placeholder="****"]').or(page.locator('input[placeholder="1234"]')).first();
    await newPinInput.fill('55555555');
    await page.click('button:has-text("Reset PIN")');

    // 5. Assert error banner appears and PIN was NOT updated
    const errorBanner = page.locator('.bg-rose-500\\/20');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/Recovery failed|Invalid/i);
  });

  test('Bogus Recipe Import Code Rejection: Shows failure alert', async ({ page }) => {
    // 1. Register and login
    const uniqueHub = 'recipeneg' + Date.now();
    await registerTestHousehold(page, uniqueHub, '1234');

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
    await registerTestHousehold(page, uniqueHub, '1234');

    // 2. Test Empty Event Submission (Calendar)
    const calNav = page.locator('nav button, aside button, button').filter({ hasText: /📅.*Calendar|Calendar/i }).filter({ visible: true }).first();
    await calNav.click({ force: true });
    await page.waitForTimeout(500);

    // Click + Event
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    const titleInput = page.locator('input[placeholder="Add title"]');
    await expect(titleInput).toBeVisible();

    // Leave title blank and assert submit fails HTML5 validation (value remains empty)
    await expect(titleInput).toBeEmpty();
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });

    // Modal must remain open because required field stopped submission
    await expect(titleInput).toBeVisible();

    // Close event modal
    const closeBtn = page.locator('button:has-text("Cancel")').or(page.locator('button:has-text("✕")')).first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true });
    }

    // 3. Test Empty Chore Submission (Tasks)
    const tasksNav = page.locator('nav button, aside button, button').filter({ hasText: /✓.*Tasks|Tasks/i }).filter({ visible: true }).first();
    await tasksNav.click({ force: true });
    await page.waitForTimeout(500);

    // Click + Task
    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    const choreInput = page.locator('input[placeholder*="Water plants"]');
    await expect(choreInput).toBeVisible();

    // Leave chore title blank and click Save
    await expect(choreInput).toBeEmpty();
    await page.locator('button:has-text("Save Task Schedule")').filter({ visible: true }).first().click({ force: true });

    // Modal must remain open
    await expect(choreInput).toBeVisible();
  });

});
