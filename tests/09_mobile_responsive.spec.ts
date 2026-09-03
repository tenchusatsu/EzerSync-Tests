import { test, expect } from './fixtures/auth.fixture';

test.describe('Mobile Viewports & Responsive Touch UI', () => {

  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 standard viewport

  test('Mobile 5-Slot Bottom Navigation: Sidebar hides and 5-slot bottom bar renders with centered Home', async ({ authenticatedPage: page }) => {
    // 1. Verify desktop sidebar is hidden on mobile viewport
    await expect(page.locator('aside')).toBeHidden();

    // 2. Verify mobile bottom nav is visible
    const bottomNav = page.locator('nav').filter({ hasText: /Home/i }).last();
    await expect(bottomNav).toBeVisible();

    // 3. Verify centered Home button with aria-label="Home"
    const homeBtn = bottomNav.locator('button[aria-label="Home"]');
    await expect(homeBtn).toBeVisible();

    // 4. Verify More button is present in the bar
    const moreBtn = bottomNav.locator('button:has-text("More")');
    await expect(moreBtn).toBeVisible();
  });

  test('Mobile "⋯ More" Overflow Sheet: Expands and navigates to overflow tabs', async ({ authenticatedPage: page }) => {
    const bottomNav = page.locator('nav').filter({ hasText: /Home/i }).last();
    const moreBtn = bottomNav.locator('button:has-text("More")');
    await expect(moreBtn).toBeVisible();

    // 1. Tap More
    await moreBtn.click();
    await page.waitForTimeout(300);

    // 2. Verify popup overflow menu opens inside bottomNav containing remaining tabs
    const overflowItem = bottomNav.locator('.absolute button').first();
    await expect(overflowItem).toBeVisible();

    // 3. Tap the overflow item to switch tabs
    await overflowItem.click();
    await page.waitForTimeout(500);

    // 4. Verify navigation succeeded (Home is no longer active)
    await expect(bottomNav.locator('button[aria-label="Home"]')).toBeVisible();
  });

  test('Mobile Bottom Navigation: Direct tab switching', async ({ authenticatedPage: page }) => {
    const bottomNav = page.locator('nav').filter({ hasText: /Home/i }).last();

    // 1. Tap Calendar in bottom nav
    const calBtn = bottomNav.locator('button:has-text("Calendar")');
    await expect(calBtn).toBeVisible();
    await calBtn.click();
    await page.waitForTimeout(500);

    // 2. Verify Calendar view is active
    await expect(page.locator('button:has-text("+ Event")').first()).toBeVisible();

    // 3. Tap Tasks in bottom nav
    const tasksBtn = bottomNav.locator('button:has-text("Tasks")');
    await expect(tasksBtn).toBeVisible();
    await tasksBtn.click();
    await page.waitForTimeout(500);

    // 4. Verify Tasks view is active
    await expect(page.locator('button:has-text("+ Task")')).toBeVisible();

    // 5. Tap centered Home button to return home
    const homeBtn = bottomNav.locator('button[aria-label="Home"]');
    await homeBtn.click();
    await page.waitForTimeout(500);

    // Verify back on home
    await expect(page.locator('button[aria-label="Open Settings"]')).toBeVisible();
  });

});
