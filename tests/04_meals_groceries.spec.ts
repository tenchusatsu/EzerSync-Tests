import { test, expect } from './fixtures/auth.fixture';

test.describe('Meals & Groceries: AI & Category Fixes', () => {

  test('Bug Fix: Items strictly mapped to "Pantry & Dry" render correctly', async ({ authenticatedPage: page }) => {
    await page.locator('nav button, aside button').filter({ hasText: 'Groceries' }).filter({ visible: true }).first().click({ force: true });
    
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    
    // Select the category first!
    await page.locator('button').filter({ hasText: /^Pantry & Dry$/ }).first().click();
    
    await page.fill('textarea[placeholder*="Milk"]', 'Soy Sauce');
    await page.locator('button:has-text("+ Add to Staging")').click({ force: true });
    await page.locator('.fixed button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    
    await page.waitForTimeout(1000);
    await expect(page.getByText('Pantry & Dry').filter({ visible: true }).first()).toBeVisible();
    
    const soySauceItem = page.locator('.group').filter({ hasText: 'Soy Sauce' }).first();
    await expect(soySauceItem).toBeVisible();
  });

  test('AI Grocery Optimization (Batches correctly, disables math errors)', async ({ authenticatedPage: page }) => {
    await page.locator('nav button, aside button').filter({ hasText: 'Groceries' }).filter({ visible: true }).first().click({ force: true });
    
    if (await page.locator('button:has-text("Clear Done")').isVisible()) {
      await page.locator('button:has-text("Clear Done")').click();
    }

    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    await page.fill('textarea[placeholder*="Milk"]', '1 onion\n2 onions');
    await page.locator('button:has-text("+ Add to Staging")').click({ force: true });
    await page.locator('.fixed button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);

    await expect(page.locator('.group').filter({ hasText: '1 onion' }).first()).toBeVisible();
    await expect(page.locator('.group').filter({ hasText: '2 onions' }).first()).toBeVisible();

    await page.route('**/api.php?action=ai_consolidate_groceries', async route => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      expect(postData.items).toContain('1 onion');
      expect(postData.items).toContain('2 onions');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ consolidated: ['3 onions'] })
      });
    });

    await page.locator('button:has-text("Optimize List")').click();
    await page.waitForTimeout(1500);

    await expect(page.locator('.group').filter({ hasText: '1 onion' })).toHaveCount(0);
    await expect(page.locator('.group').filter({ hasText: '2 onions' })).toHaveCount(0);
    await expect(page.locator('.group').filter({ hasText: '3 onions' }).first()).toBeVisible();
  });
});
