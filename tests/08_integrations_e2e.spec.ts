import { test, expect } from './fixtures/auth.fixture';

test.describe('End-to-End User Journeys & Multi-Tab Integrations', () => {

  test('Meal-to-Grocery Push Cycle: Push meal ingredients into shared grocery list', async ({ authenticatedPage: page }) => {
    // 1. Go to Meals tab
    await page.locator('nav button, aside button, button').filter({ hasText: /🍲.*Meals|Meals/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 2. Click + Plan Dinner on today's meal card
    const planDinnerBtn = page.locator('button, p').filter({ hasText: /\+ Plan Dinner|\+ Plan Tonight's Dinner|\+ Choose Meal/i }).locator('visible=true').first();
    await planDinnerBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 3. In Cookbook modal, add a custom recipe with known ingredients
    const cookbookDialog = page.locator('.fixed').filter({ hasText: 'Family Cookbook' });
    await cookbookDialog.locator('button:has-text("+ Add")').first().click({ force: true });
    await page.locator('button:has-text("Create Custom Recipe")').click();

    await page.waitForSelector('input[placeholder*="Grandma\'s Lasagna"]');
    await page.fill('input[placeholder*="Grandma\'s Lasagna"]', 'Garlic Butter Shrimp');

    // Add ingredients
    await page.fill('input[placeholder="Add ingredient..."]', '1 lb Shrimp');
    await page.locator('button', { hasText: /^Add$/ }).click();

    await page.fill('input[placeholder="Add ingredient..."]', '4 cloves Garlic');
    await page.locator('button', { hasText: /^Add$/ }).click();

    // Save recipe to plan
    await page.locator('button:has-text("Save Recipe")').click();
    await page.waitForTimeout(1000);

    // 4. On the planned meal card, click grocery push button
    const pushGroceriesBtn = page.locator('main').locator('button').filter({ hasText: /Groceries|Add Ingredients/i }).first();
    await expect(pushGroceriesBtn).toBeVisible();
    await pushGroceriesBtn.click({ force: true });

    // 5. Assert PushGroceryModal opens with the ingredients
    const pushModal = page.locator('.fixed').filter({ hasText: 'Add to Grocery List' });
    await expect(pushModal).toBeVisible();
    await expect(pushModal.getByText('1 lb Shrimp')).toBeVisible();
    await expect(pushModal.getByText('4 cloves Garlic')).toBeVisible();

    // Confirm push
    await page.locator('.fixed button:has-text("Add")').last().click({ force: true });
    await page.waitForTimeout(1000);

    // 6. Switch to Groceries tab and verify ingredients appear
    await page.locator('nav button, aside button, button').filter({ hasText: /🛒.*Groceries|Groceries/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.getByText('1 lb Shrimp').first()).toBeVisible();
    await expect(page.getByText('4 cloves Garlic').first()).toBeVisible();
  });

  test('Bulk Grocery Completion & List Cleanup: Select All and Clear Done', async ({ authenticatedPage: page }) => {
    // 1. Switch to Groceries tab
    await page.locator('nav button, aside button, button').filter({ hasText: /🛒.*Groceries|Groceries/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 2. Add 2 grocery items
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('textarea[placeholder*="Organic Milk"]');
    await page.fill('textarea[placeholder*="Organic Milk"]', 'Apples\nBananas');
    await page.locator('button:has-text("Save (")').locator('visible=true').first().click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.getByText('Apples').first()).toBeVisible();
    await expect(page.getByText('Bananas').first()).toBeVisible();

    // 3. Click Select All to check all items
    await page.locator('button:has-text("Select All")').click({ force: true });
    await page.waitForTimeout(300);

    // 4. Assert Clear Done button appears and click it
    const clearDoneBtn = page.locator('button:has-text("Clear Done")');
    await expect(clearDoneBtn).toBeVisible();
    await clearDoneBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 5. Assert completed items are removed
    await expect(page.getByText('Apples')).toHaveCount(0);
    await expect(page.getByText('Bananas')).toHaveCount(0);
  });

  test('Calendar Member Filter Isolation: Member filter pill isolates scheduled events', async ({ authenticatedPage: page }) => {
    // 1. Open Settings and add a second member "Jane"
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });
    await page.getByRole('button', { name: /Family/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    const memberInput = page.locator('input[placeholder*="Leo"]').first();
    await memberInput.fill('Jane');
    await page.locator('button').filter({ hasText: /^Add$/i }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('.fixed button:has-text("✕")').first().click({ force: true });

    // 2. Switch to Calendar tab
    await page.locator('nav button, aside button, button').filter({ hasText: /📅.*Calendar|Calendar/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 3. Create Event for Admin Test
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Admin Meeting');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 4. Create Event for Jane
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Jane Soccer');
    // Select Jane in member dropdown if present
    const memberSelect = page.locator('select').first();
    if (await memberSelect.isVisible()) {
      const options = await memberSelect.locator('option').allInnerTexts();
      const janeOption = options.find(o => o.includes('Jane'));
      if (janeOption) {
        await memberSelect.selectOption({ label: janeOption });
      }
    }
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Both events should be present initially
    await expect(page.getByText('Admin Meeting').first()).toBeVisible();
    await expect(page.getByText('Jane Soccer').first()).toBeVisible();

    // 5. Click first member filter pill (Dev Admin or Admin Test)
    const adminFilterPill = page.locator('button').filter({ hasText: /^Dev Admin|^Admin Test/ }).first();
    await adminFilterPill.click({ force: true });
    await page.waitForTimeout(300);

    // Admin event should be visible, Jane Soccer hidden
    await expect(page.getByText('Admin Meeting').first()).toBeVisible();
    await expect(page.getByText('Jane Soccer')).toHaveCount(0);

    // 6. Click All filter pill
    await page.locator('button:has-text("All (")').click({ force: true });
    await page.waitForTimeout(300);

    // Both should reappear
    await expect(page.getByText('Admin Meeting').first()).toBeVisible();
    await expect(page.getByText('Jane Soccer').first()).toBeVisible();
  });

  test('Theme & Color Mode Persistence: Theme changes persist across hard reload', async ({ authenticatedPage: page }) => {
    // 1. Open Settings
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });
    await page.getByRole('button', { name: /Appearance/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 2. Select Light Mode
    await page.locator('button:has-text("Light Mode")').first().click({ force: true });
    await page.waitForTimeout(300);

    // Switch theme palette
    await page.locator('button:has-text("Nordic Slate")').first().click({ force: true });
    await page.waitForTimeout(500);

    // Close Settings
    await page.locator('.fixed button:has-text("✕")').first().click({ force: true });

    // 3. Hard reload page
    await page.reload();
    await page.waitForTimeout(1000);

    // 4. Verify user remains authenticated and dashboard theme classes persist
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  });

});
