import { test as base, Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type AuthFixtures = {
  authenticatedPage: Page;
  householdId: string;
};

// Ensure devtest is always initialized from base snapshot
export function ensureDevtestReady() {
  const dataDir = 'c:/Users/janlu/Desktop/family_calendar_data';
  const snapshot = path.join(dataDir, 'devtest.json.base_snapshot');
  const target = path.join(dataDir, 'devtest.json');
  if (fs.existsSync(snapshot)) {
    fs.copyFileSync(snapshot, target);
  }
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    ensureDevtestReady();
    await page.goto('/');

    // Check if already authenticated
    if (await page.locator('button[aria-label="Open Settings"]').isVisible({ timeout: 1500 }).catch(() => false)) {
      await use(page);
      return;
    }

    // If on registration view, switch back to login
    const backToLoginBtn = page.locator('button:has-text("Already have a household? Log in")')
      .or(page.locator('button:has-text("Back to Login")'))
      .first();
    if (await backToLoginBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backToLoginBtn.click();
    }

    // Log into devtest using PIN 1234
    const hubInput = page.locator('input[placeholder*="smithfamily"]');
    if (await hubInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hubInput.fill('devtest');
      const pinInput = page.locator('input[maxLength="8"]');
      await pinInput.fill('1234');
      await page.click('button:has-text("Access Dashboard")');

      // If legacy upgrade modal appears, dismiss with Remind Me Later
      const remindLaterBtn = page.locator('button:has-text("Remind Me Later")');
      try {
        await remindLaterBtn.waitFor({ state: 'visible', timeout: 3000 });
        await remindLaterBtn.click({ force: true });
        await remindLaterBtn.waitFor({ state: 'hidden', timeout: 3000 });
      } catch (e) {
        // Modal may not appear if already encrypted or dismissed
      }

      await expect(page.locator('button[aria-label="Open Settings"]')).toBeVisible({ timeout: 10000 });
    }

    await use(page);
  },
  householdId: async ({}, use) => {
    await use('devtest');
  }
});

export { expect } from '@playwright/test';
