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
  await page.waitForTimeout(1000); // Wait for React hydration
  return uniqueHub;
}
