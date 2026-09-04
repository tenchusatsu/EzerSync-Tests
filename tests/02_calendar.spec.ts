import { test, expect } from './fixtures/auth.fixture';

test.describe('Calendar Scenarios', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Calendar/i }).first().click({ force: true });
    await page.waitForTimeout(500);
  });

  test('Switch between Month, Week, and Day views', async ({ authenticatedPage: page }) => {
    await expect(page.locator('h2').first()).toBeVisible();
    await page.locator('button', { hasText: /^Week$/ }).first().click({ force: true });
    await expect(page.locator('text=Sun').first()).toBeVisible();
    await page.locator('button', { hasText: /^Day$/ }).first().click({ force: true });
    await expect(page.locator('text=GMT').or(page.locator('text=AM')).first()).toBeVisible();
    await page.locator('button', { hasText: /^Month$/ }).first().click({ force: true });
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

  test('Non-Google Recurring Events: Expand to future dates and Delete Entire Series', async ({ authenticatedPage: page }) => {
    // 1. Create a repeating weekly event
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder="Add title"]', 'Future Recurrence Test');
    await page.locator('select').nth(1).selectOption('WEEKLY_CURRENT');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Future Recurrence Test').first()).toBeAttached();

    // 2. Switch to Week View to verify recurrence across dates
    await page.locator('button', { hasText: /^Week$/ }).first().click({ force: true });
    await page.waitForTimeout(400);
    await expect(page.getByText('Future Recurrence Test').first()).toBeVisible();

    // 3. Navigate forward to NEXT week (▶)
    await page.locator('button:has-text("▶")').first().click({ force: true });
    await page.waitForTimeout(500);

    // Assert that the recurring event expanded and renders on the next week
    await expect(page.getByText('Future Recurrence Test').first()).toBeVisible();

    // 4. Click event on next week to inspect Day Overview & open Edit Modal
    await page.getByText('Future Recurrence Test').first().click({ force: true });
    await page.waitForTimeout(400);
    const tapToEdit = page.locator('text="Tap to edit ✏️"').first();
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
      await page.waitForTimeout(300);
    }

    // If edit recurring prompt modal appears, choose Edit ENTIRE series
    const editSeriesBtn = page.locator('button:has-text("Edit ENTIRE series")');
    if (await editSeriesBtn.isVisible()) {
      await editSeriesBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    // 5. Delete the event
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);

    // If prompt appears asking single vs series, choose Delete ENTIRE series
    const deleteEntireSeriesBtn = page.locator('button:has-text("Delete ENTIRE series")');
    if (await deleteEntireSeriesBtn.isVisible()) {
      await deleteEntireSeriesBtn.click({ force: true });
    } else {
      // Fallback confirm modal
      const confirmBtn = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click({ force: true });
      }
    }
    await page.waitForTimeout(800);

    // 6. Verify event is completely gone from the future week
    await expect(page.getByText('Future Recurrence Test')).toHaveCount(0);

    // 7. Navigate back to previous week (◀) and verify it's gone from current week too
    await page.locator('button:has-text("◀")').first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Future Recurrence Test')).toHaveCount(0);
  });

  test('Non-Google Recurring Events: Delete ONLY this instance preserves other instances', async ({ authenticatedPage: page }) => {
    // 1. Create a repeating weekly event
    await page.locator('button:has-text("+ Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);
    await page.fill('input[placeholder="Add title"]', 'Single Instance Delete Test');
    await page.locator('select').nth(1).selectOption('WEEKLY_CURRENT');
    await page.locator('button:has-text("Save")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Single Instance Delete Test').first()).toBeAttached();

    // 2. Switch to Week View
    await page.locator('button', { hasText: /^Week$/ }).first().click({ force: true });
    await page.waitForTimeout(400);

    // 3. Navigate forward to NEXT week (▶)
    await page.locator('button:has-text("▶")').first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Single Instance Delete Test').first()).toBeVisible();

    // 4. Click the event on the next week
    await page.getByText('Single Instance Delete Test').first().click({ force: true });
    await page.waitForTimeout(400);
    const tapToEdit = page.locator('text="Tap to edit ✏️"').first();
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
      await page.waitForTimeout(300);
    }

    // If edit prompt appears asking how to edit, select "Edit ONLY this instance"
    const editSinglePrompt = page.locator('button:has-text("Edit ONLY this instance")');
    if (await editSinglePrompt.isVisible()) {
      await editSinglePrompt.click({ force: true });
      await page.waitForTimeout(300);
    }

    // 5. Click Delete Event
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(400);

    // If prompt appears asking single vs series, choose "Delete ONLY this instance"
    const deleteSingleInstanceBtn = page.locator('button:has-text("Delete ONLY this instance")');
    if (await deleteSingleInstanceBtn.isVisible()) {
      await deleteSingleInstanceBtn.click({ force: true });
    } else {
      const confirmBtn = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click({ force: true });
      }
    }
    await page.waitForTimeout(800);

    // 6. Verify that this specific occurrence is removed from the visible week days (not counting preview of following weeks)
    const currentWeekDays = page.locator('.grid.grid-cols-2.md\\:grid-cols-4 > div').filter({ hasNotText: 'Next Week' });
    await expect(currentWeekDays.getByText('Single Instance Delete Test')).toHaveCount(0);

    // 7. Navigate back to previous week (◀) and verify the original occurrence is STILL present
    await page.locator('button:has-text("◀")').first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(currentWeekDays.getByText('Single Instance Delete Test').first()).toBeVisible();

    // Cleanup: Delete the remaining event
    await page.getByText('Single Instance Delete Test').first().click({ force: true });
    if (await tapToEdit.isVisible()) {
      await tapToEdit.click({ force: true });
    }
    const editSeriesBtn = page.locator('button:has-text("Edit ENTIRE series")');
    if (await editSeriesBtn.isVisible()) {
      await editSeriesBtn.click({ force: true });
    }
    await page.locator('button:has-text("Delete Event")').filter({ visible: true }).first().click({ force: true });
    const deleteEntireSeriesBtn = page.locator('button:has-text("Delete ENTIRE series")');
    if (await deleteEntireSeriesBtn.isVisible()) {
      await deleteEntireSeriesBtn.click({ force: true });
    } else {
      const confirmBtn = page.locator('.fixed.z-\\[100\\] button:has-text("Delete")').or(page.locator('button:has-text("Delete")').filter({ hasText: /^Delete$/ })).last();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click({ force: true });
      }
    }
    await page.waitForTimeout(500);
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
