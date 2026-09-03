import { test as base, Page, expect } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  householdId: string;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    if (await page.locator('text="Create a new hub"').isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.click('text="Create a new hub"');
      await page.waitForSelector('input[placeholder="e.g. EZER-SYNC-2026"]');

      const uniqueHub = 'regression' + Date.now() + Math.floor(Math.random() * 10000);
      await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
      await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
      await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
      await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
      await page.fill('input[placeholder="****"]', '1234');
      
      await page.click('button:has-text("Create Household")', { force: true });
      await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
      await page.waitForTimeout(1000);
    }
    await use(page);
  },
  householdId: async ({}, use) => {
    await use('regression' + Date.now() + Math.floor(Math.random() * 10000));
  }
});
export { expect } from '@playwright/test';
