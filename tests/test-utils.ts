import { Page, expect } from '@playwright/test';

export async function setupDummyHousehold(page: Page) {
  await page.goto('/');
  await page.waitForSelector('text="Create a new hub"');
  await page.click('text="Create a new hub"');

  const uniqueHub = 'regression' + Date.now() + Math.floor(Math.random() * 10000);
  await page.fill('input[placeholder="e.g. EZER-SYNC-2026"]', 'EZER-SYNC-2026');
  await page.fill('input[placeholder="e.g. smith-family"]', uniqueHub);
  await page.fill('input[placeholder="The Smith Family"]', 'Test Family');
  await page.fill('input[placeholder="e.g. John"]', 'Admin Test');
  await page.fill('input[type="password"]', '1234');
  
  await page.click('button:has-text("Create Household")');
  await expect(page.locator('button[aria-label="Open Settings"]')).toBeAttached({ timeout: 10000 });
  await page.waitForTimeout(1000); // Wait for React hydration
  return uniqueHub;
}
