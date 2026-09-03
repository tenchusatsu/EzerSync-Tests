import { test, expect } from './fixtures/auth.fixture';

test.describe('Calendar Scenarios', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Calendar/i }).first().click({ force: true });
    await page.waitForTimeout(500);
  });

  test('Switch between Month, Week, and Day views', async ({ authenticatedPage: page }) => {
    await expect(page.locator('h2').first()).toBeVisible();
    await page.locator('button:has-text("Week")').first().click({ force: true });
    await expect(page.locator('text=Sun').first()).toBeVisible();
    await page.locator('button:has-text("Day")').first().click({ force: true });
    await expect(page.locator('text=AM').first()).toBeVisible();
    await page.locator('button:has-text("Month")').first().click({ force: true });
  });

  test('Create, Edit, and Delete single event (via Day Overview inspection gate)', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Temp Event');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Temp Event').filter({ visible: true }).first()).toBeAttached();
    
    // Click event pill — triggers Day Overview pop-out
    await page.getByText('Temp Event').filter({ visible: true }).first().click({ force: true });
    
    // In Day Overview, tap the event card to open edit modal
    const tapToEdit = page.locator('text="Tap to edit ✏️"').first();
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
    }
    
    await page.fill('input[placeholder="Add title"]', 'Updated Event');
    await page.locator('button:has-text("Save Event Changes"), button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Updated Event').filter({ visible: true }).first()).toBeAttached();

    // Click updated event to delete
    await page.getByText('Updated Event').filter({ visible: true }).first().click({ force: true });
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
    }
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(300);
    const confirmBtn1 = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
    if (await confirmBtn1.isVisible()) {
      await confirmBtn1.click({ force: true });
    }
    await page.waitForTimeout(500);
    await expect(page.getByText('Updated Event')).toHaveCount(0);
  });

  test('Calendar Event Click Flow: Inspection Gate opens Day Overview before Edit Modal', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());
    // Create an event for testing inspection gate
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Gate Inspection Event');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Gate Inspection Event').filter({ visible: true }).first()).toBeAttached();

    // Click event pill
    await page.getByText('Gate Inspection Event').filter({ visible: true }).first().click({ force: true });

    // Assert Day Overview pop-out is visible with "Tap to edit ✏️"
    const dayOverview = page.locator('text="schedule entries"').or(page.locator('text="Tap to edit ✏️"'));
    await expect(dayOverview.first()).toBeVisible();

    // Verify edit modal is NOT directly open yet
    await expect(page.locator('button:has-text("Save Event Changes")')).toHaveCount(0);

    // Now tap to edit
    await page.locator('text="Tap to edit ✏️"').first().click({ force: true });
    await expect(page.locator('input[placeholder="Add title"]')).toHaveValue('Gate Inspection Event');

    // Clean up
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(300);
    const confirmBtn2 = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
    if (await confirmBtn2.isVisible()) {
      await confirmBtn2.click({ force: true });
    }
    await page.waitForTimeout(500);
  });

  test('Calendar Validation: Reject Invalid End Date Range with Error Highlight & Disabled Save', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder="Add title"]');
    await page.fill('input[placeholder="Add title"]', 'Invalid Range Event');

    // Set end date earlier than start date
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-09-15');
    await dateInputs.nth(1).fill('2026-09-10');

    // Verify error banner appears
    await expect(page.getByText('End date cannot be earlier than start date')).toBeVisible();

    // Verify save button is disabled
    const saveBtn = page.locator('button[type="submit"]').filter({ hasText: /^Save/ });
    await expect(saveBtn).toBeDisabled();

    // Fix end date
    await dateInputs.nth(1).fill('2026-09-15');
    await expect(page.getByText('End date cannot be earlier than start date')).toHaveCount(0);
    await expect(saveBtn).toBeEnabled();

    // Close modal without saving
    await page.locator('button:has-text("Cancel")').first().click({ force: true });
  });

  test('Create and Edit Series Repeating Events', async ({ authenticatedPage: page }) => {
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder="Add title"]', 'Weekly Sync');
    await page.locator('select').nth(1).selectOption('WEEKLY_CURRENT');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await expect(page.locator('text=Weekly Sync').first()).toBeAttached();
    
    await page.locator('text=Weekly Sync').first().click({ force: true });
    const tapToEdit = page.locator('text="Tap to edit ✏️"').first();
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
    }
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

  test('Calendar Celebrations: Birthday filter and Celebration indicator', async ({ authenticatedPage: page }) => {
    const memberFilters = page.locator('.flex.items-center.gap-1.overflow-x-auto');
    await expect(memberFilters).toBeVisible();

    const birthdayPill = page.locator('button:has-text("Birthdays")');
    if (await birthdayPill.isVisible()) {
      await birthdayPill.click();
      await expect(birthdayPill).toHaveClass(/shadow|bg-/);
      await page.locator('button:has-text("All")').first().click();
    }
  });
});
