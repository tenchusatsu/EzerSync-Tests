# ðŸ§ª EzerSync Family Calendar â€” Regression Test Suite Catalog

This reference document outlines all automated end-to-end and regression test specifications across the EzerSync Family Calendar project.

---

## ðŸ“‚ Test Suites Overview

| Spec File | Area | Key Scenarios Covered |
| :--- | :--- | :--- |
| **`tests/01_auth.spec.ts`** | **Authentication & Household Setup** | Registration, PIN verification, login, session persistence, invalid PIN rejection. |
| **`tests/02_calendar.spec.ts`** | **Calendar & Google Sync** | Month/Week/Day view switching, single event CRUD, repeating series creation & editing, "Edit ONLY this instance", time picker flow (Hour â†’ Minute + AM/PM â†’ Save Time), date validation (invalid end date blocking). |
| **`tests/03_tasks_chores.spec.ts`** | **Chores & Task Management** | Task creation, completion toggling, view switching ("Today" vs "All Tasks"), custom recurrence day bubbles (no crash), one-time task lifecycle & "Done (clears tomorrow)" badge. |
| **`tests/04_meals_groceries.spec.ts`** | **Meal Planning & Groceries** | Preset recipe planning, 1-click recipe ingredient push to groceries, auto-categorization (Produce, Meat, Dairy, Pantry), staging multi-item grocery additions, checkoff & clear completed. |
| **`tests/05_settings.spec.ts`** | **Household Settings & Members** | Light/Dark mode switching, color palette themes, adding family members (sub-calendar & separate Google), duplicate member name rejection, member removal. |
| **`tests/06_cookbook_recipes.spec.ts`** | **Cookbook & Recipe Hub** | AI Recipe Search, custom recipe creation/edit, share code generation, recipe deletion with custom modal. |
| **`tests/07_negative_scenarios.spec.ts`** | **Negative Testing & Validation** | Invalid PIN rejection, non-existent hub rejection, duplicate registration rejection, invalid recovery code, bogus recipe import code, empty form validation. |
| **`tests/08_integrations_e2e.spec.ts`** | **E2E Multi-Tab Integrations** | Direct meal-to-grocery push flow, bulk grocery select/clear, calendar member filter isolation, theme & mode persistence. |
| **`tests/09_mobile_responsive.spec.ts`** | **Mobile Touch UI & Viewports** | Mobile 5-slot bottom bar with centered Home on iPhone 12, "â‹¯ More" overflow popup navigation, direct tab switching. |
| **`tests/10_e2ee_security.spec.ts`** | **v1.1.4 E2EE & Security Boundaries** | Web Crypto password strength validator (5 rules), AES-256-GCM key wrapping & wrong PIN rejection, PIN/Password toggle, live password checklist, Forgot Password recovery navigation. |
| **`tests/dashboard.spec.ts`** | **Quick Dashboard Smoke Tests** | End-to-end sanity tests for groceries, chores, calendar events, meals, and household settings. |
| **`tests/overflow.spec.ts`** | **UI Layout & Responsive Constraints** | Mobile portrait/landscape viewport stability, tab scrolling, modal viewport limits. |

---

## ðŸ” Detailed Test Cases by Suite

### 1. `tests/01_auth.spec.ts` (Authentication & Security)
* `Register a new household hub`: Tests full onboarding flow with invite code, hub ID, admin name, and 4-digit PIN.
* `Log into an existing household`: Verifies sign out and subsequent authentication with stored credentials.
* `Validate invalid PIN rejection`: Verifies that incorrect 4-digit PINs are rejected with error feedback and access is denied.

---

### 2. `tests/02_calendar.spec.ts` (Calendar & Recurrence)
* `Switch between Month, Week, and Day views`: Asserts responsive grid adjustments across all 3 view modes.
* `Create, Edit, and Delete single event (via Day Overview inspection gate)`: Verifies full event CRUD through the Day Overview pop-out.
* `Calendar Event Click Flow: Inspection Gate opens Day Overview before Edit Modal`:
  * Asserts clicking an event opens the Day Overview Summary pop-out (`schedule entries`, `Tap to edit âœï¸`) first.
  * Asserts edit modal is not directly displayed until tapping the event inside the overview card.
* `Calendar Validation: Reject Invalid End Date Range with Error Highlight & Disabled Save`:
  * Asserts that setting an end date earlier than the start date shows the `âš ï¸ End date cannot be earlier than start date` warning banner and disables the **Save** button.
* `Create and Edit Series Repeating Events`: Tests recurring rules (`DAILY`, `WEEKDAYS`, `WEEKLY`, `CUSTOM`) and series-wide edits.
* Non-Google Recurring Events: Expand to future dates and Delete Entire Series: Expands local offline recurrence rules to future weeks and deletes all instances.
* Non-Google Recurring Events: Delete ONLY this instance preserves other instances: Deletes a single occurrence of a local repeating event using exdates without affecting the rest.
* Non-Google Recurring Events: Edit ONLY this instance updates single occurrence: Edits the title of a specific date in a local offline recurring series, verifying the exception is handled properly.
* Single Event: Edit Date/Time, Toggle All-Day, Reassign Member, and Upgrade to Recurring: Verifies an existing single event can be converted to an all-day recurring event.
* Calendar Edge Cases: All-Day Snapping and Time Picker:
  * Verifies that checking "All day" snaps the end date to the start date and removes time pickers.
* `Calendar Celebrations: Birthday filter and Celebration indicator`:
  * Verifies birthday indicator and isolation using the celebration filter.

---

### 3. `tests/03_tasks_chores.spec.ts` (Chores & Tasks)
* `Add, Toggle, Switch Views, and Delete Chore`: Basic daily chore lifecycle.
* `Custom Recurrence Chore: Day Bubbles without Crash`:
  * Verifies opening the task modal, selecting **Custom**, and toggling day bubbles (Mon, Wed, Fri) without throwing component crashes.
* `One-Time Task Lifecycle: Completion and Next-Day Prune Indicator`:
  * Tests creating a task with schedule **Once** (for today).
  * Verifies that completing it marks it done on "Today" and displays **`âœ“ Done (clears tomorrow)`** on "All Tasks".

---

### 4. 	ests/04_meals_groceries.spec.ts (Meals & Groceries Integration)
* Bug Fix: Items strictly mapped to "Pantry & Dry" render correctly: Verifies category assignment and rendering in the grocery board.
* AI Grocery Optimization: Verifies consolidation of duplicate ingredients (e.g. 1 onion + 2 onions -> 3 onions) via AI endpoint.
* Meal Planner: 2x4 Pagination (Next/Prev/Current Week navigation): Verifies forward and backward paginated calendar boundaries for the 7-day meal planner.
* Direct-to-Cookbook Meal Planning Flow:
  * Clicking "+ Plan Dinner" or "+ Plan Tonight's Dinner" opens Family Cookbook with the banner: `ðŸ“Œ Planning [Day]'s dinner â€” tap a recipe`.
  * Opening a recipe preview and closing it with `âœ•` dismisses only the preview while maintaining planning mode.
  * Saving the recipe commits it to the target day and updates the meal board.

---

### 5. `tests/05_settings.spec.ts` (Settings & Members)
* `Settings: Member Management & Theme Change`:
  * Toggles Light / Dark mode.
  * Switches color theme palette to *Nordic Slate*.
  * Adds a family member.
* `Settings: Prevent Duplicate Family Member Name`:
  * Tests that adding a member with an existing name (case-insensitive) triggers an error alert and prevents duplicate entries.
* `Settings: Member Color Auto-Selection & Duplicate Color Prevention`:
  * Verifies that opening the Add Member card displays the color swatch picker with an auto-selected unused color.
  * Asserts that colors already assigned to existing members are disabled and cannot be selected.
  * Verifies that newly added members are saved with their unique color.
* `Settings: Navigation Order Customization & Dynamic Tab Reordering`:
  * Verifies the `ðŸ—‚ï¸ Navigation` tab renders the reorder list with `â–²` and `â–¼` buttons.
  * Asserts `Home` remains anchored as center while top 3 items display `Bar` and remaining items display `More`.

---

### 6. 	ests/06_cookbook_recipes.spec.ts (Cookbook & AI Recipe Management)
* Cookbook: Browse, Search, and Create Custom Recipe:
  * Navigates to Cookbook tab and tests text filtering.
  * Creates custom recipe with ingredients and instructions.
* Cookbook: Edit Existing Recipe & Share Code Generation:
  * Updates recipe name/ingredients and generates 6-character recipe import code.
* Cookbook: Delete Recipe with Custom Modal Confirmation:
  * Verifies custom modal prompt appears and confirms deletion.
* Cookbook: Image Upload and Social Links parsing:
  * Uploads an image using WebP compression and verifies preview rendering.
  * Inputs TikTok/YouTube URLs and asserts platform-specific badges (e.g. `▶ YouTube`) render automatically.
* Cookbook: Recipe Share Validation (Rate/Size limits):
  * Creates an oversized recipe title (> 200 chars).
  * Validates the server intercepts a 400 Bad Request and displays the security alert to the user.
* AI Fridge Assistant: "What's in my fridge?" suggests dishes from ingredients:
  * Passes fridge ingredients into the assistant and mocks `api.php?action=ai_fridge_suggest`.
  * Verifies generated recipe suggestion cards render with prep/cook times.
  * Opens recipe inspector and verifies ingredient details are populated.

---

### 7. `tests/07_negative_scenarios.spec.ts` (Error Handling & Input Validation)
* `Invalid PIN Login Rejection`: Verifies submitting wrong PIN displays `"Incorrect PIN."` error banner without unlocking dashboard.
* `Non-Existent Household Login`: Verifies submitting unregistered hub ID displays `"Household not found."`.
* `Registration Validation Rejection`: Verifies registering duplicate hub ID displays `"Household ID already exists."`.
* `Invalid Master Recovery Code`: Verifies wrong recovery code fails without updating PIN.
* `Bogus Recipe Import Code Rejection`: Verifies fake code `RCP-0000-0000` is rejected with failure alert.
* `Form Validation Negatives`: Verifies empty event and chore titles are blocked from saving.

---

### 8. `tests/08_integrations_e2e.spec.ts` (Multi-Tab User Journeys)
* `Meal-to-Grocery Push Cycle`: Verifies planning dinner, pushing ingredients to the shared grocery list, and confirming items appear in Groceries.
* `Bulk Grocery Completion & List Cleanup`: Verifies selecting all grocery items and bulk-clearing completed items.
* `Calendar Member Filter Isolation`: Verifies creating events for multiple family members and isolating them via member filter pills.
* `Theme & Color Mode Persistence`: Verifies switching theme palette and light/dark mode persists across page reloads.

---

### 9. `tests/09_mobile_responsive.spec.ts` (Mobile Viewports & Touch UI)
* `Mobile 5-Slot Bottom Navigation`: Verifies desktop sidebar is hidden and 5-slot bottom bar renders with centered Home on iPhone 12 viewport.
* `Mobile "â‹¯ More" Overflow Sheet`: Verifies tapping More opens the popup overflow menu and navigates to overflow tabs.
* `Mobile Bottom Navigation: Direct tab switching`: Verifies switching across Calendar, Tasks, and Home using bottom navigation.

---

### 10. `tests/10_e2ee_security.spec.ts` (v1.1.4 Zero-Knowledge E2EE & Security Boundaries)
* `Crypto Engine (Negative & Positive): Password strength rule validator`: Evaluates client-side 5-rule password complexity validator against too short, missing upper, lower, number, and symbol variations.
* `Crypto Engine: AES-256-GCM Key Wrapping & Wrong PIN Decryption Failure (Negative)`: Verifies key wrapping of Master Encryption Key and cryptographic tag mismatch error on incorrect PIN.
* `Login UI: Interactive toggle between Quick Convenience PIN and Master Password`: Asserts seamless mode switching, placeholder updates, and disabled submit states.
* `Registration UI (Negative): Incomplete password requirements keep checklist unfulfilled`: Asserts partial passwords leave badges unfulfilled (`âšª`) and disable submission.
* `Registration UI (Positive): Strong password fulfills all 5 checklist badges`: Verifies all 5 badges switch to `âœ…` on strong password.
* `Recovery UI (Navigation & Negative): Forgot Password screen and mode switching`: Verifies Forgot Password form validation, switching to offline Admin Recovery Code form, and returning to Login.

---

## ðŸƒ How to Run Tests Manually

When you wish to execute the test suite manually:

```powershell
# Run all 50 regression tests
npx playwright test --project=chromium

# Run all tests across 5 browser/device profiles (250 executions)
npx playwright test

# Run a specific test suite
npx playwright test tests/10_e2ee_security.spec.ts --project=chromium
npx playwright test tests/07_negative_scenarios.spec.ts --project=chromium
npx playwright test tests/08_integrations_e2e.spec.ts --project=chromium
npx playwright test tests/09_mobile_responsive.spec.ts --project=chromium

# Run with interactive UI mode
npx playwright test --ui
```




