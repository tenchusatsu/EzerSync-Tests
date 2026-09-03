# 🧪 EzerSync Family Calendar — Regression Test Suite Catalog

This reference document outlines all automated end-to-end and regression test specifications across the EzerSync Family Calendar project.

---

## 📂 Test Suites Overview

| Spec File | Area | Key Scenarios Covered |
| :--- | :--- | :--- |
| **`tests/01_auth.spec.ts`** | **Authentication & Household Setup** | Registration, PIN verification, login, session persistence, invalid PIN rejection. |
| **`tests/02_calendar.spec.ts`** | **Calendar & Google Sync** | Month/Week/Day view switching, single event CRUD, repeating series creation & editing, "Edit ONLY this instance", time picker flow (Hour → Minute + AM/PM → Save Time), date validation (invalid end date blocking). |
| **`tests/03_tasks_chores.spec.ts`** | **Chores & Task Management** | Task creation, completion toggling, view switching ("Today" vs "All Tasks"), custom recurrence day bubbles (no crash), one-time task lifecycle & "Done (clears tomorrow)" badge. |
| **`tests/04_meals_groceries.spec.ts`** | **Meal Planning & Groceries** | Preset recipe planning, 1-click recipe ingredient push to groceries, auto-categorization (Produce, Meat, Dairy, Pantry), staging multi-item grocery additions, checkoff & clear completed. |
| **`tests/05_settings.spec.ts`** | **Household Settings & Members** | Light/Dark mode switching, color palette themes, adding family members (sub-calendar & separate Google), duplicate member name rejection, member removal. |
| **`tests/dashboard.spec.ts`** | **Quick Dashboard Smoke Tests** | End-to-end sanity tests for groceries, chores, calendar events, meals, and household settings. |
| **`tests/overflow.spec.ts`** | **UI Layout & Responsive Constraints** | Mobile portrait/landscape viewport stability, tab scrolling, modal viewport limits. |

---

## 🔍 Detailed Test Cases by Suite

### 1. `tests/01_auth.spec.ts` (Authentication & Security)
* `Register a new household hub`: Tests full onboarding flow with invite code, hub ID, admin name, and 4-digit PIN.
* `Log into an existing household`: Verifies sign out and subsequent authentication with stored credentials.
* `Validate invalid PIN rejection`: Verifies that incorrect 4-digit PINs are rejected with error feedback and access is denied.

---

### 2. `tests/02_calendar.spec.ts` (Calendar & Recurrence)
* `Switch between Month, Week, and Day views`: Asserts responsive grid adjustments across all 3 view modes.
* `Create, Edit, and Delete single event`: Verifies native event modal inputs, date pickers, title updating, and deletion.
* `Create and Edit Series Repeating Events`: Tests recurring rules (`DAILY`, `WEEKDAYS`, `WEEKLY`, `CUSTOM`) and series-wide edits.
* `Repeating Event: Edit ONLY this instance`: Verifies that clicking "Edit ONLY this instance" opens the single-instance edit window rather than closing.
* `Calendar Edge Cases: All-Day Snapping and Time Picker`:
  * Verifies that checking "All day" snaps the end date to the start date.
  * Verifies the 2-step custom grid time picker: selects hour (1–12), selects minute (:00, :15, :30, :45), toggles AM/PM, and confirms with **Save Time**.
* `Calendar Validation: Reject Invalid End Date Range with Error Highlight`:
  * Asserts that setting an end date earlier than the start date shows a red error border, displays a warning banner, and disables the **Save** button.
* `Calendar Week View: Toggle between 2x4 Grid and Classic Strip Views`:
  * Verifies switching to Week view displays the sub-toggle buttons (**🔲 Grid** and **📊 Classic**).
  * Asserts that Grid mode renders the 8-box split layout with the **🗓️ Next Week** overview card.
  * Asserts that Classic mode renders the 7-column header strip and hides the Next Week card.

---

### 3. `tests/03_tasks_chores.spec.ts` (Chores & Tasks)
* `Add, Toggle, Switch Views, and Delete Chore`: Basic daily chore lifecycle.
* `Custom Recurrence Chore: Day Bubbles without Crash`:
  * Verifies opening the task modal, selecting **Custom**, and toggling day bubbles (Mon, Wed, Fri) without throwing component crashes.
* `One-Time Task Lifecycle: Completion and Next-Day Prune Indicator`:
  * Tests creating a task with schedule **Once** (for today).
  * Verifies that completing it marks it done on "Today" and displays **`✓ Done (clears tomorrow)`** on "All Tasks".

---

### 4. `tests/04_meals_groceries.spec.ts` (Meals & Groceries Integration)
* `Integration Flow: Push Meals to Groceries, Categorize, Clear Done`:
  * Plans a dinner from the recipe catalog (e.g. *Sinigang na Baboy*).
  * Pushes recipe ingredients into the grocery list using the 1-click modal.
  * Asserts auto-categorization into *Meat & Seafood*, *Produce*, etc.
  * Stages custom grocery items and commits them.
  * Checks off grocery items and clears completed items.
* `Mobile Executive Brief: Grocery List Visibility & Correct Section Order`:
  * Simulates a mobile viewport (390x844).
  * Asserts that the Grocery List is visible on the Mobile Home brief.
  * Verifies strict top-to-bottom bounding box order: **Calendar Agenda ➔ Tasks ➔ Groceries ➔ Meal Planner**.

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

---

## 🏃 How to Run Tests Manually

When you wish to execute the test suite manually:

```powershell
# Run all regression tests
npx playwright test

# Run a specific test suite
npx playwright test tests/02_calendar.spec.ts
npx playwright test tests/04_meals_groceries.spec.ts
npx playwright test tests/05_settings.spec.ts

# Run with interactive UI mode
npx playwright test --ui
```
