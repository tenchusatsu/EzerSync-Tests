import { test, expect } from './fixtures/auth.fixture';

test.describe('Calendar Scenarios', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // We must navigate to the Calendar tab first
    await page.getByRole('button', { name: /Calendar/i }).first().click({ force: true });
    await page.waitForTimeout(500);
  });

  test('Switch between Month, Week, and Day views', async ({ authenticatedPage: page }) => {
    // Wait for the tab to render
    await expect(page.locator('h2').first()).toBeVisible();
    await page.locator('button:has-text("Week")').first().click({ force: true });
    await expect(page.locator('text=Sun').first()).toBeVisible();
    await page.locator('button:has-text("Day")').first().click({ force: true });
    await expect(page.locator('text=AM').first()).toBeVisible();
    await page.locator('button:has-text("Month")').first().click({ force: true });
  });

  test('Create, Edit, and Delete single event', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Temp Event');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Temp Event').filter({ visible: true }).first()).toBeAttached();
    
    await page.getByText('Temp Event').filter({ visible: true }).first().click({ force: true });
    await page.fill('input[placeholder="Add title"]', 'Updated Event');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Updated Event').filter({ visible: true }).first()).toBeAttached();

    await page.getByText('Updated Event').filter({ visible: true }).first().click({ force: true });
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Updated Event')).toHaveCount(0);
  });

  test('Create and Edit Series Repeating Events', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder="Add title"]', 'Weekly Sync');
    await page.locator('select').nth(1).selectOption('WEEKLY_CURRENT');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.locator('text=Weekly Sync').first()).toBeAttached();
    
    await page.locator('text=Weekly Sync').first().click({ force: true });
    await page.locator('button:has-text("Edit ENTIRE series")').click({ force: true });
    await page.fill('input[placeholder="Add title"]', 'Team Sync');
    await page.locator('button:has-text("Save Event Changes")').click({ force: true });
    await expect(page.getByText('Team Sync').filter({ visible: true }).first()).toBeAttached();
  });

  test('Calendar Edge Cases: All-Day Snapping and Time Picker', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder="Add title"]', 'All Day Check');
    const allDayToggle = page.locator('input[type="checkbox"]').first();
    await allDayToggle.click({ force: true });
    await expect(page.locator('input[type="time"]')).toHaveCount(0);
    await allDayToggle.click({ force: true });
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
  });

  
});
