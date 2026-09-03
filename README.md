# 🎭 EzerSync E2E Test Suite (Playwright)

Automated end-to-end regression and integration test suite for the **EzerSync Family Calendar & Sync Hub**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install --with-deps
```

### 3. Run the Tests
Make sure your local or staging EzerSync application is running on `http://localhost:5173` (or set `baseURL` in `playwright.config.ts`).

```bash
# Run all tests headlessly
npm test

# Run tests with visible browser window
npm run test:headed

# Open interactive Playwright UI Runner
npm run test:ui

# View HTML Test Report after a run
npm run report
```

---

## 📂 Test Architecture & Catalog

| Spec File | Area | Key Scenarios Covered |
| :--- | :--- | :--- |
| **`tests/01_auth.spec.ts`** | **Authentication & Household Setup** | Registration, PIN verification, login, session persistence, invalid PIN rejection. |
| **`tests/02_calendar.spec.ts`** | **Calendar & Google Sync** | Month/Week/Day view switching, single event CRUD, repeating series creation & editing, "Edit ONLY this instance", time picker flow, date range validation. |
| **`tests/03_tasks_chores.spec.ts`** | **Chores & Task Management** | Task creation, completion toggling, view switching ("Today" vs "All Tasks"), custom recurrence day bubbles, one-time task completion indicator. |
| **`tests/04_meals_groceries.spec.ts`** | **Meal Planning & Groceries** | Recipe planning, 1-click ingredient push to groceries, auto-categorization (Produce, Meat, Dairy, Pantry), staging multi-item additions, checkoff & clear completed. |
| **`tests/05_settings.spec.ts`** | **Household Settings & Members** | Light/Dark mode, color palette themes, adding family members, duplicate member name rejection, member removal. |
| **`tests/06_cookbook_recipes.spec.ts`** | **Cookbook & Recipe Hub** | AI Recipe Search, custom recipe creation/edit, share code generation, recipe deletion with custom modal. |
| **`tests/dashboard.spec.ts`** | **Dashboard Smoke Tests** | End-to-end sanity tests across all core modules. |
| **`tests/overflow.spec.ts`** | **Responsive & Layout Constraints** | Viewport stability, mobile portrait/landscape tabs, modal viewport limits. |
