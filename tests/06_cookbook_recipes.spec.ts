import { test, expect } from './fixtures/auth.fixture';

test.describe('AI Cookbook & Recipe CRUD', () => {

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Meals/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    const planBtn = page.locator('p:has-text("+ Plan Tonight\'s Dinner")').first();
    if (await planBtn.isVisible()) {
      await planBtn.click({ force: true });
    } else {
      await page.locator('div:has-text("Monday")').locator('button:has-text("+")').first().click({ force: true });
    }
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Open Cookbook")').filter({ visible: true }).first().click({ force: true });
    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
  });

  test('AI Recipe Search generates a recipe and saves it to catalog', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("✨ AI Search")').click();
    await page.waitForTimeout(300);

    await page.route('**/api.php?action=ai_recipe_search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          recipes: [{
            id: 'ai-123',
            name: 'AI Generated Pasta',
            title: 'AI Generated Pasta',
            ingredients: ['Pasta', 'Tomato Sauce'],
            instructions: 'Boil pasta. Add sauce.',
            cuisine: 'Italian'
          }]
        })
      });
    });

    await page.fill('textarea', 'Make me a pasta dish'); // There's only one textarea in the modal
    await page.locator('button:has-text("Generate Recipe ✨")').click();

    // The title in the suggestion card might be h4
    const suggestion = page.locator('h4', { hasText: 'AI Generated Pasta' });
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Edit Recipe")').or(page.locator('h3:has-text("New Recipe")'))).toBeVisible();
    
    await page.locator('button:has-text("Save Recipe")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
    // Revert to my_recipes tab if it didn't auto-switch (it should based on UI, but wait, CookbookModal doesn't auto-switch activeTab. We must click "📖 My Recipes")
    await page.locator('button:has-text("📖 My Recipes")').click();

    await page.fill('input[placeholder="Search cookbook..."]', 'AI Generated Pasta');
    await expect(page.locator('h4:has-text("AI Generated Pasta")').first()).toBeVisible();
  });

  test('Recipe CRUD: Create, Edit, Delete, Import custom recipes', async ({ authenticatedPage: page }) => {
    // CREATE
    await page.locator('button:has-text("+ Add Recipe")').click();
    await page.locator('button:has-text("📝 Create Custom Recipe")').click();
    
    await expect(page.locator('h3:has-text("New Recipe")')).toBeVisible();
    await page.fill('input[placeholder*="Grandma\'s Lasagna"]', 'My Custom Soup');
    
    await page.fill('input[placeholder="Add ingredient..."]', 'Water');
    await page.locator('button', { hasText: /^Add$/ }).click();

    await page.locator('button:has-text("Save Recipe")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
    await page.fill('input[placeholder="Search cookbook..."]', 'My Custom Soup');
    await expect(page.locator('h4:has-text("My Custom Soup")').first()).toBeVisible();

    // IMPORT
    await page.route('**/api.php?action=import_recipe', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          recipe: {
            id: 'imported-999',
            name: 'Imported Cake',
            title: 'Imported Cake',
            ingredients: ['Flour', 'Sugar'],
            instructions: 'Bake it.',
            isCustom: true
          }
        })
      });
    });

    await page.locator('button:has-text("+ Add Recipe")').click();
    await page.locator('button:has-text("📥 Import Shared Recipe")').click();
    await expect(page.locator('h3:has-text("Import Shared Recipe")')).toBeVisible();
    await page.fill('input[placeholder="RCP-XXXX-XXXX"]', 'RCP-1234-5678');
    await page.locator('button:has-text("Import")').click();

    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Search cookbook..."]', 'Imported Cake');
    await expect(page.locator('h4:has-text("Imported Cake")').first()).toBeVisible();
    
    // DELETE
    await page.locator('div').filter({ hasText: /^Imported Cake/ }).locator('button:has-text("📝 Edit")').click();
    await expect(page.locator('h3:has-text("Edit Recipe")')).toBeVisible();
    
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("Delete")').click();
    
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
  });
});
