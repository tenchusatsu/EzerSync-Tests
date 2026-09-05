import { test, expect } from '@playwright/test';

// Helper function to register and login a fresh dummy household for each test
async function setupDummyHousehold(page) {
  await page.route('**/api.php*', async (route) => {
    const headers = route.request().headers();
    headers['X-Playwright-Test'] = 'true';
    await route.continue({ headers });
  });

  await page.goto('/');
  await page.waitForSelector('text="Create a new hub"');
  await page.click('text="Create a new hub"');

  const uniqueHub = 'test' + Date.now() + Math.floor(Math.random() * 10000);
  await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
  await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
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

  const pinInput = page.locator('input[maxLength="8"]');
  await pinInput.fill('1234');
  
  await page.click('button:has-text("Create Household")');
  await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
}

test.describe('Dashboard Features', () => {

  test('Groceries Flow: Add an item', async ({ page }) => {
    await setupDummyHousehold(page);
    
    // Click + Add button for groceries
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    
    // Wait for the textarea
    await page.waitForSelector('textarea[placeholder*="Organic Milk"]');
    await page.fill('textarea[placeholder*="Organic Milk"]', 'Playwright Apples');
    
    // The button says "Save (1)" because it dynamically counts
    await page.locator('button:has-text("Save (")').filter({ visible: true }).first().click({ force: true });

    // Verify it appears in the list
    await expect(page.getByText('Playwright Apples').filter({ visible: true }).first()).toBeAttached();
  });

  test('Chores Flow: Complete a chore', async ({ page }) => {
    await setupDummyHousehold(page);

    // Click + Task
    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    
    // Fill the chore modal
    await page.waitForSelector('input[placeholder*="Water plants"]');
    await page.fill('input[placeholder*="Water plants"]', 'Playwright Test Chore');
    await page.locator('button:has-text("Save Task Schedule")').filter({ visible: true }).first().click({ force: true });

    // Verify it appears
    await expect(page.getByText('Playwright Test Chore').filter({ visible: true }).first()).toBeAttached();

    // Click the chore to complete it
    await page.getByText('Playwright Test Chore').filter({ visible: true }).first().click({ force: true });
  });

  test('Calendar Flow: Add an event', async ({ page }) => {
    await setupDummyHousehold(page);

    // Click + Event
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    
    // Fill event details
    await page.waitForSelector('input[placeholder*="Dental"], input[placeholder*="Leo"], input[placeholder*="title"], input[placeholder="Add title"]');
    await page.fill('input[placeholder*="Dental"], input[placeholder*="Leo"], input[placeholder*="title"], input[placeholder="Add title"]', 'Playwright Appointment');
    
    // Save Event (Using specific form submit button)
    await page.locator('button[type="submit"][form="eventFormSubmit"]').click({ force: true });
    await page.waitForTimeout(800);

    // Verify it appears
    await expect(page.getByText('Playwright Appointment').first()).toBeAttached();
  });

  test('Meals Flow: Plan a dinner', async ({ page }) => {
    await setupDummyHousehold(page);

    // Click + Plan Tonight's Dinner (in v1.1.3 opens Cookbook directly in planning mode)
    const planDinnerBtn = page.locator('p:has-text("+ Plan Tonight\'s Dinner")').or(page.locator('text="+ Plan Dinner"')).filter({ visible: true }).first();
    await planDinnerBtn.click({ force: true });
    await page.waitForTimeout(500);
    
    // Pick a recipe from the open Cookbook modal
    const cookbookDialog = page.locator('.fixed').filter({ hasText: 'Family Cookbook' });
    const recipeCard = cookbookDialog.locator('h4').filter({ visible: true }).first();
    if (await recipeCard.isVisible()) {
      const title = (await recipeCard.innerText()).trim();
      await recipeCard.click({ force: true });
      await page.waitForTimeout(500);
      await expect(page.getByText(title).filter({ visible: true }).first()).toBeAttached();
    } else {
      // Create custom recipe in planning mode
      await cookbookDialog.locator('button').filter({ hasText: /\+ Add/i }).first().click({ force: true });
      await page.locator('button').filter({ hasText: /Create Custom Recipe/i }).first().click();
      await page.waitForSelector('input[placeholder*="Lasagna"]');
      await page.fill('input[placeholder*="Lasagna"]', 'Playwright Dinner');
      await page.locator('button').filter({ hasText: /Save Recipe|Save to Cookbook/i }).first().click();
      await page.waitForTimeout(500);
      await expect(page.getByText('Playwright Dinner').filter({ visible: true }).first()).toBeAttached();
    }
  });

  test('Settings Flow: Update household name', async ({ page }) => {
    await setupDummyHousehold(page);

    // Open Settings
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });

    // Click Rename
    await page.locator('button:has-text("Rename")').filter({ visible: true }).first().click({ force: true });

    // Change hub name
    await page.waitForSelector('input[placeholder*="EzerSync"]');
    await page.fill('input[placeholder*="EzerSync"]', 'Playwright Family Updated');
    
    // Save Settings
    await page.locator('button:has-text("Save Name")').filter({ visible: true }).first().click({ force: true });

    // Wait for modal to close
    await page.waitForTimeout(500);
  });

});
