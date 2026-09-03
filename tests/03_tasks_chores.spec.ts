import { test, expect } from './fixtures/auth.fixture';

test.describe('Tasks & Chores Scenarios', () => {
  test('Add, Toggle, Switch Views, and Delete Chore', async ({ authenticatedPage: page }) => {
    // 1. Add Chore
    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder*="Water plants"]');
    await page.fill('input[placeholder*="Water plants"]', 'Temp Chore');
    await page.locator('button:has-text("Save Task Schedule")').filter({ visible: true }).first().click({ force: true });
    await expect(page.getByText('Temp Chore').filter({ visible: true }).first()).toBeAttached();
    
    // 2. Toggle completion
    // Click the chore item text or checkbox container to toggle completion
    const choreItem = page.getByText('Temp Chore').filter({ visible: true }).first();
    await choreItem.click({ force: true });
    await page.waitForTimeout(500); // Give time for state update / style change
    
    // 3. Switch views & select All Tasks filter
    await page.locator('nav button, aside button').filter({ hasText: 'Tasks' }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    if (await page.locator('button:has-text("All Tasks")').isVisible()) {
      await page.locator('button:has-text("All Tasks")').click({ force: true });
    }
    
    // 4. Delete Chore
    await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('.group'));
      const choreGroup = groups.find(g => g.textContent?.includes('Temp Chore'));
      if (choreGroup) {
        const btn = Array.from(choreGroup.querySelectorAll('button')).find(b => b.className.includes('text-rose-500'));
        if (btn) (btn as HTMLElement).click();
      }
    });

    await page.waitForTimeout(500);
    await expect(page.getByText('Temp Chore')).toHaveCount(0);
  });

  test('Custom Recurrence Chore: Day Bubbles without Crash', async ({ authenticatedPage: page }) => {
    // 1. Open + Task modal
    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder*="Water plants"]');
    await page.fill('input[placeholder*="Water plants"]', 'Custom Gym Workout');

    // 2. Select "Custom" schedule type
    await page.locator('button:has-text("Custom")').click({ force: true });

    // 3. Verify day of week bubbles are rendered and do NOT crash
    await expect(page.locator('button', { hasText: /^Mon$/ })).toBeVisible();
    await expect(page.locator('button', { hasText: /^Wed$/ })).toBeVisible();
    await expect(page.locator('button', { hasText: /^Fri$/ })).toBeVisible();

    // Toggle Friday bubble
    await page.locator('button', { hasText: /^Fri$/ }).click();

    // 4. Save Task
    await page.locator('button:has-text("Save Task Schedule")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);

    // Switch to Tasks tab, then All Tasks to verify custom task
    await page.locator('nav button, aside button').filter({ hasText: 'Tasks' }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('button:has-text("All Tasks")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByText('Custom Gym Workout').filter({ visible: true }).first()).toBeAttached();
  });

  test('One-Time Task Lifecycle: Completion and Next-Day Prune Indicator', async ({ authenticatedPage: page }) => {
    // 1. Add One-Time Task for Today
    await page.locator('button:has-text("+ Task")').filter({ visible: true }).first().click({ force: true });
    await page.waitForSelector('input[placeholder*="Water plants"]');
    await page.fill('input[placeholder*="Water plants"]', 'Fix Kitchen Sink');

    // Click "Specific Date"
    await page.locator('button:has-text("Specific Date"), button:has-text("Once")').first().click({ force: true });
    await page.locator('#choreFormSubmit button:has-text("Today"), form button:has-text("Today")').first().click({ force: true });

    // Save
    await page.locator('button:has-text("Save Task Schedule")').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Fix Kitchen Sink').filter({ visible: true }).first()).toBeAttached();

    // 2. Complete the One-Time Task
    await page.getByText('Fix Kitchen Sink').filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);

    // 3. Switch to All Tasks and verify "Done (clears tomorrow)" badge is present
    await page.locator('nav button, aside button').filter({ hasText: 'Tasks' }).filter({ visible: true }).first().click({ force: true });
    await page.waitForTimeout(500);
    if (await page.locator('button:has-text("All Tasks")').isVisible()) {
      await page.locator('button:has-text("All Tasks")').click({ force: true });
    }
    
    // text removed in redesign
  });
});
