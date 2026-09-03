import { test, expect } from '@playwright/test';
import { setupDummyHousehold } from './test-utils';

test.describe('Volume & Overflow Scenarios', () => {
  test('Should handle UI overflow for Chores gracefully', async ({ page }) => {
    await setupDummyHousehold(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Tasks/i }).first().click({ force: true });
    await page.waitForTimeout(500);

    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder*="Clean grill"]');

    for (let i = 1; i <= 8; i++) {
      await page.fill('input[placeholder*="Clean grill"]', `Dummy Chore ${i}`);
      await page.locator('button[form="choreFormSubmit"]').click({ force: true });
      await page.waitForTimeout(200);
      if (i < 8) {
         await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
         await page.waitForSelector('input[placeholder*="Clean grill"]');
      }
    }
    
    await page.waitForTimeout(500);

    const choresList = page.locator('div.custom-scrollbar').first();
    await expect(choresList).toBeVisible();

    for (let i = 1; i <= 8; i++) {
      await expect(page.getByText(`Dummy Chore ${i}`).first()).toBeAttached();
    }
  });

  test('Should handle bulk Grocery addition gracefully', async ({ page }) => {
    await setupDummyHousehold(page);
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Groceries/i }).first().click({ force: true });
    await page.waitForTimeout(500);
    
    await page.locator('button:has-text("+ Add")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('textarea[placeholder*="Organic Milk"]');
    
    let bulkText = '';
    for (let i = 1; i <= 15; i++) {
      bulkText += `Bulk Item ${i}\n`;
    }
    await page.fill('textarea[placeholder*="Organic Milk"]', bulkText);
    
    // First stage it
    await page.locator('button:has-text("+ Add to Staging")').click({ force: true });
    await page.waitForTimeout(200);

    // Then commit it
    await page.locator('button:has-text("Save (")').click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.getByText('Bulk Item 1').first()).toBeAttached();
    await expect(page.getByText('Bulk Item 15').first()).toBeAttached();
  });

  test('Should handle multiple Family Members gracefully', async ({ page }) => {
    await setupDummyHousehold(page);
    await page.waitForTimeout(500);

    await page.locator('button[aria-label="Open Settings"]').locator('visible=true').first().click({ force: true });
    await page.waitForTimeout(1000);
    await page.locator('button').filter({ hasText: 'Family' }).locator('visible=true').first().click({ force: true });
    await page.waitForTimeout(1000);

    for (let i = 1; i <= 6; i++) {
      await page.waitForSelector('input[placeholder*="Member name"]');
      await page.fill('input[placeholder*="Member name"]', `User ${i}`);
      await page.waitForSelector('.w-6.h-6.rounded-full');
      await page.locator('.w-6.h-6.rounded-full').nth(i).click({ force: true });
      await page.getByRole('button', { name: 'Add', exact: true }).locator('visible=true').first().click({ force: true });
      await expect(page.getByText(`User ${i}`).locator('visible=true').first()).toBeAttached();
    }
  });
});
