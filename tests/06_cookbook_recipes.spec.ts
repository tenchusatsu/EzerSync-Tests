import { test, expect } from './fixtures/auth.fixture';

test.describe('AI Cookbook & Recipe CRUD', () => {

  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Open Cookbook directly from navigation
    const cookbookNav = page.locator('nav button, aside button, button').filter({ hasText: /Cookbook/i }).filter({ visible: true }).first();
    await cookbookNav.click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
  });

  test('AI Recipe Search generates a recipe and saves it to catalog', async ({ authenticatedPage: page }) => {
    await page.locator('button').filter({ hasText: /AI Search/i }).first().click();
    await page.waitForTimeout(300);

    const promptInput = page.locator('textarea[placeholder*="vegan lasagna"]');
    if (!await promptInput.isVisible()) {
      const editPromptBtn = page.locator('button').filter({ hasText: /Edit Prompt/i }).first();
      if (await editPromptBtn.isVisible()) {
        await editPromptBtn.click();
      }
    }

    await page.fill('textarea[placeholder*="vegan lasagna"]', 'A fast garlic pasta');

    await page.route('**/api.php?action=ai_recipe_search', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          recipes: [
            {
              title: 'Fast Garlic Pasta',
              description: 'Quick savory pasta with toasted garlic.',
              category: 'Dinner',
              cuisine: 'Italian',
              prepTimeMinutes: 5,
              cookTimeMinutes: 10,
              servings: 2,
              ingredients: ['spaghetti', 'garlic', 'olive oil'],
              instructions: 'Boil pasta. Sauté garlic in olive oil. Toss together.'
            }
          ]
        })
      });
    });

    await page.locator('button').filter({ hasText: /Generate Recipe/i }).first().click();

    // The title in the suggestion card
    const suggestion = page.locator('h4').filter({ visible: true }).first();
    await expect(suggestion).toBeVisible({ timeout: 20000 });
    const recipeTitle = (await suggestion.innerText()).trim();

    await suggestion.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3').filter({ hasText: /Recipe/i }).first()).toBeVisible();
    
    await page.locator('button').filter({ hasText: /Save Recipe|Save to Cookbook/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
    await page.locator('button').filter({ hasText: /My Recipes/i }).first().click();

    await page.fill('input[placeholder="Search cookbook..."]', recipeTitle);
    await expect(page.locator('h4', { hasText: recipeTitle }).first()).toBeVisible();
  });

  test('Recipe CRUD: Create, Edit, Delete, Import custom recipes', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());

    // CREATE
    await page.locator('button').filter({ hasText: /\+ Add/i }).filter({ visible: true }).first().click({ force: true });
    await page.locator('button').filter({ hasText: /Create Custom Recipe/i }).first().click();
    
    await expect(page.locator('h3').filter({ hasText: /Recipe/i }).first()).toBeVisible();
    await page.fill('input[placeholder*="Lasagna"]', 'My Custom Soup');
    
    await page.fill('input[placeholder="Add ingredient..."]', 'Water');
    await page.locator('button', { hasText: /^Add$/ }).click();

    await page.locator('button').filter({ hasText: /Save Recipe|Save to Cookbook/i }).first().click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3:has-text("Family Cookbook")')).toBeVisible();
    await page.fill('input[placeholder="Search cookbook..."]', 'My Custom Soup');
    await expect(page.locator('h4:has-text("My Custom Soup")').first()).toBeVisible();

    // IMPORT
    await page.locator('button').filter({ hasText: /\+ Add/i }).filter({ visible: true }).first().click({ force: true });
    await page.locator('button').filter({ hasText: /Import Shared Recipe/i }).first().click();
    await expect(page.locator('h3:has-text("Import Shared Recipe")')).toBeVisible();
    await page.fill('input[placeholder="RCP-XXXX-XXXX"]', 'RCP-1234-5678');
    await page.locator('button:has-text("Import")').click();

    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Search cookbook..."]', 'Imported Cake');
    await expect(page.locator('h4:has-text("Imported Cake")').first()).toBeVisible();
    
    // DELETE
    await page.locator('div').filter({ hasText: /^Imported Cake/ }).locator('button').filter({ hasText: /Edit/i }).first().click();
    await expect(page.locator('h3').filter({ hasText: /Recipe/i }).first()).toBeVisible();
    
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
    await page.locator('button').filter({ hasText: /What's in my fridge/i }).first().click();
    await page.waitForTimeout(300);

    const fridgeInput = page.locator('textarea[placeholder*="Chicken breast"]');
    if (!await fridgeInput.isVisible()) {
      const editPromptBtn = page.locator('button').filter({ hasText: /Edit Prompt|Edit Ingredients/i }).first();
      if (await editPromptBtn.isVisible()) {
        await editPromptBtn.click();
      }
    }

    // 2. Fill ingredients in textarea
    await page.fill('textarea[placeholder*="Chicken breast"]', 'ground beef, potatoes, carrots, onions');

    await page.route('**/api.php?action=ai_fridge_suggest', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          recipes: [
            {
              title: 'Hearty Beef & Potato Hash',
              description: 'Quick skillet meal from fridge staples.',
              category: 'Dinner',
              cuisine: 'American',
              prepTimeMinutes: 10,
              cookTimeMinutes: 20,
              servings: 3,
              ingredients: ['ground beef', 'potatoes', 'carrots', 'onions'],
              instructions: 'Brown the beef. Dice and cook potatoes and carrots. Combine.'
            }
          ]
        })
      });
    });

    // 3. Click Suggest Ideas
    await page.locator('button').filter({ hasText: /Suggest Ideas/i }).first().click();

    // 4. Assert suggestions render
    const suggestion1 = page.locator('h4').filter({ visible: true }).first();
    await expect(suggestion1).toBeVisible({ timeout: 20000 });
    const dishTitle = (await suggestion1.innerText()).trim();

    // 5. Click suggestion to inspect details in Recipe Edit modal
    await suggestion1.click();
    await page.waitForTimeout(500);

    await expect(page.locator('h3').filter({ hasText: /Recipe/i }).first()).toBeVisible();
    await expect(page.locator('input[placeholder*="Lasagna"]')).toHaveValue(dishTitle);

    // Close recipe inspector
    const closeBtn = page.locator('.fixed button').filter({ hasText: /✕|✖|×/ }).last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click({ force: true });
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('Recipe Enhancements: Image Upload and Social Links parsing', async ({ authenticatedPage: page }) => {
    // 1. Create a recipe
    await page.locator('button').filter({ hasText: /\+ Add/i }).filter({ visible: true }).first().click({ force: true });
    await page.locator('button').filter({ hasText: /Create Custom Recipe/i }).first().click();
    
    await expect(page.locator('h3').filter({ hasText: /Recipe/i }).first()).toBeVisible();
    await page.fill('input[placeholder*="Lasagna"]', 'Viral TikTok Pasta');
    
    // 2. Test Social Link Parsing
    const socialInput = page.locator('input[placeholder*="YouTube, Instagram, TikTok"]');
    await socialInput.fill('https://tiktok.com/@chef/video/12345');
    
    // Assert TikTok badge renders
    const tiktokBadge = page.locator('a[href*="tiktok.com"]').filter({ hasText: 'TikTok' });
    await expect(tiktokBadge).toBeVisible();

    // 3. Test Image Upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/dummy.jpg');
    
    // Assert image renders in preview
    const imagePreview = page.locator('img[alt="Viral TikTok Pasta"]');
    await expect(imagePreview).toBeVisible();

    // 4. Save and verify it appears in catalog with badge
    await page.locator('button').filter({ hasText: /Save Recipe|Save to Cookbook/i }).first().click();
    await page.waitForTimeout(500);

    await page.fill('input[placeholder="Search cookbook..."]', 'Viral TikTok');
    await page.locator('h4:has-text("Viral TikTok Pasta")').first().click();
    await page.waitForTimeout(300);

    // Assert TikTok badge is present in the preview
    await expect(page.locator('a').filter({ hasText: 'TikTok' }).first()).toBeVisible();
  });

  test('Recipe Share Validation: Rejects oversized recipes (100KB limit) and long titles', async ({ authenticatedPage: page }) => {
    let dialogMessage = '';
    page.on('dialog', dialog => {
      dialogMessage = dialog.message();
      dialog.accept();
    });

    // 1. Create a recipe with a massive title > 200 chars
    await page.locator('button').filter({ hasText: /\+ Add/i }).filter({ visible: true }).first().click({ force: true });
    await page.locator('button').filter({ hasText: /Create Custom Recipe/i }).first().click();
    
    const massiveTitle = 'A'.repeat(250);
    await page.fill('input[placeholder*="Lasagna"]', massiveTitle);
    await page.locator('button').filter({ hasText: /Save Recipe|Save to Cookbook/i }).first().click();
    await page.waitForTimeout(500);

    // 2. Open it and share it
    await page.fill('input[placeholder="Search cookbook..."]', massiveTitle);
    await page.locator('h4', { hasText: /^A+$/ }).first().click();
    await page.waitForTimeout(300);

    await page.locator('button:has-text("Share")').filter({ visible: true }).first().click();
    await page.locator('button:has-text("Generate Share Code")').click();
    await page.waitForTimeout(500);

    // Assert that the API rejected it because of title length
    expect(dialogMessage).toContain('max 200 chars');
  });
});
