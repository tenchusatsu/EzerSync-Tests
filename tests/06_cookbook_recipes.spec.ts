import { test, expect } from './fixtures/auth.fixture';

test.describe('AI Cookbook & Recipe CRUD', () => {

  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Open Cookbook directly from navigation
    const cookbookNav = page.locator('nav button, aside button, button').filter({ hasText: /📖.*Cookbook|Cookbook/i }).filter({ visible: true }).first();
    await cookbookNav.click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
  });

  test('AI Recipe Search generates a recipe and saves it to catalog', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("✨ AI Search")').click();
    await page.waitForTimeout(300);

    const promptInput = page.locator('textarea[placeholder*="vegan lasagna"]');
    if (!await promptInput.isVisible()) {
      const editPromptBtn = page.locator('button:has-text("✏️ Edit Prompt")');
      if (await editPromptBtn.isVisible()) {
        await editPromptBtn.click();
      }
    }

    await page.fill('textarea[placeholder*="vegan lasagna"]', 'A fast garlic pasta');
    await page.locator('button:has-text("Generate Recipe ✨")').click();

    // The title in the suggestion card
    const suggestion = page.locator('h4').filter({ visible: true }).first();
    await expect(suggestion).toBeVisible({ timeout: 20000 });
    const recipeTitle = (await suggestion.innerText()).trim();

    await suggestion.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Edit Recipe")').or(page.locator('h3:has-text("New Recipe")'))).toBeVisible();
    
    await page.locator('button:has-text("Save Recipe")').click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
    await page.locator('button:has-text("📖 My Recipes")').click();

    await page.fill('input[placeholder="Search cookbook..."]', recipeTitle);
    await expect(page.locator('h4', { hasText: recipeTitle }).first()).toBeVisible();
  });

  test('Recipe CRUD: Create, Edit, Delete, Import custom recipes', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());

    // CREATE
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
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
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
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
    
    await page.locator('button:has-text("Delete")').click();
    await page.waitForTimeout(300);
    const confirmDelete = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
    if (await confirmDelete.isVisible()) {
      await confirmDelete.click({ force: true });
    }
    
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
  });

  test('AI Fridge Assistant: "What\'s in my fridge?" suggests dishes from ingredients', async ({ authenticatedPage: page }) => {
    // 1. Switch to fridge tab
    await page.locator('button:has-text("🧊 What\'s in my fridge?")').click();
    await page.waitForTimeout(300);

    const fridgeInput = page.locator('textarea[placeholder*="Chicken breast"]');
    if (!await fridgeInput.isVisible()) {
      const editPromptBtn = page.locator('button:has-text("✏️ Edit Prompt")');
      if (await editPromptBtn.isVisible()) {
        await editPromptBtn.click();
      }
    }

    // 2. Fill ingredients in textarea
    await page.fill('textarea[placeholder*="Chicken breast"]', 'ground beef, potatoes, carrots, onions');

    // 3. Click Suggest Ideas ✨
    await page.locator('button:has-text("Suggest Ideas ✨")').click();

    // 4. Assert suggestions render
    const suggestion1 = page.locator('h4').filter({ visible: true }).first();
    await expect(suggestion1).toBeVisible({ timeout: 20000 });
    const dishTitle = (await suggestion1.innerText()).trim();

    // 5. Click suggestion to inspect details in Recipe Edit modal
    await suggestion1.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Edit Recipe")').or(page.locator('h3:has-text("New Recipe")'))).toBeVisible();
    await expect(page.locator('input[placeholder*="Grandma\'s Lasagna"]')).toHaveValue(dishTitle);

    // Close recipe inspector
    const closeBtn = page.locator('.fixed button:has-text("✕")').last();
    await closeBtn.click({ force: true });
  });
});
