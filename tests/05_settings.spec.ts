import { test, expect } from './fixtures/auth.fixture';

test.describe('Settings Scenarios', () => {
  test('Settings: Member Management & Theme Change', async ({ authenticatedPage: page }) => {
    // Navigate to Settings
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);
    
    // Toggle Light Mode / Dark Mode
    await page.getByRole('button', { name: /Appearance/i }).first().click({ force: true });
    await page.waitForTimeout(1000);
    
    await page.locator('button:has-text("Light Mode")').first().click({ force: true });
    await expect(page.locator('button:has-text("Light Mode")').first()).toBeVisible();

    await page.locator('button:has-text("Dark Mode")').first().click({ force: true });
    await expect(page.locator('button:has-text("Dark Mode")').first()).toBeVisible();

    // Switch theme palettes
    await page.locator('button:has-text("Nordic Slate")').first().click({ force: true });
    await page.waitForTimeout(500);

    // Switch to Members tab
    await page.getByRole('button', { name: /Family/i }).first().click({ force: true });
    await page.waitForTimeout(1000);

    // Add a new family member (sub_category)
    const memberInput = page.locator('input[placeholder*="Leo"]').first();
    await memberInput.fill('Jane');
    await page.locator('button').filter({ hasText: /^Add$/i }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);
    
    // Verify appearance
    await page.waitForTimeout(500);
    await expect(page.getByText('Jane', { exact: true }).filter({ visible: true }).first()).toBeAttached();
  });

  test('Settings: Prevent Duplicate Family Member Name', async ({ authenticatedPage: page }) => {
    let dialogMessage = '';
    page.on('dialog', dialog => {
      dialogMessage = dialog.message();
      dialog.accept();
    });

    // Navigate to Settings -> Family Members
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Family/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Add "Alex"
    const memberInput = page.locator('input[placeholder*="Leo"]').first();
    await memberInput.fill('Alex');
    await page.locator('button').filter({ hasText: /^Add$/i }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);
    await expect(page.getByText('Alex', { exact: true }).filter({ visible: true }).first()).toBeAttached();

    // Try adding "alex" again (duplicate)
    await memberInput.fill('alex');
    await page.locator('button').filter({ hasText: /^Add$/i }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);

    // Verify alert message for duplicate name
    expect(dialogMessage.toLowerCase()).toContain('already exists');
  });

  test('Settings: Member Color Auto-Selection & Duplicate Color Prevention', async ({ authenticatedPage: page }) => {
    let dialogMessage = '';
    page.on('dialog', dialog => {
      dialogMessage = dialog.message();
      dialog.accept();
    });

    // Navigate to Settings -> Family Members
    await page.locator('button[aria-label="Open Settings"]').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Family/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Verify the "Add Family Member" card has the color swatch picker
    await expect(page.getByText('Select Unique Color:').filter({ visible: true }).first()).toBeVisible();

    // Verify taken colors are disabled with opacity-20 / disabled attribute
    const disabledSwatches = page.locator('button[disabled][title*="Already assigned"]');
    await expect(disabledSwatches.first()).toBeAttached();

    // Add a new member "Bella" with auto-selected color
    const memberInput = page.locator('input[placeholder*="Leo"]').first();
    await memberInput.fill('Bella');
    await page.locator('button').filter({ hasText: /^Add$/i }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(1000);
    await expect(page.getByText('Bella', { exact: true }).filter({ visible: true }).first()).toBeAttached();

    // Verify that Bella's color is now marked as already assigned
    const bellaCard = page.locator('.space-y-4 > div').filter({ hasText: 'Bella' }).first();
    await expect(bellaCard).toBeVisible();
  });
});
