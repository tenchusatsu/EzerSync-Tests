# EzerSync Project Guidelines & Documentation Workflow

## 📚 Master Documentation Workflow
Whenever changes, new features, bug fixes, or architectural updates are made to the codebase, they must be documented across the **3 trimmed master documents**:

1. **`CHANGELOG.md`**
   - Maintain chronological release versioning following Keep a Changelog format.
   - Record user-facing and technical changes categorized under: `Added`, `Changed`, `Fixed`, `Security`.

2. **`README.md`**
   - Keep current release version tag and badges updated.
   - Maintain user-facing feature overviews, setup/run instructions, and high-level architectural highlights.

3. **`EZERSYNC_MASTER_DOCUMENTATION.md`**
   - The authoritative reference and feature directory for the entire system (compiled for Google NotebookLM / LLM ingestion).
   - Document comprehensive system capabilities, security/crypto mechanics, recurrence engine details, and updated roadmaps.

> [!IMPORTANT]
> Do NOT create or maintain redundant release documentation files (e.g. `RELEASE_NOTES.md` has been deprecated and trimmed). All change documentation goes directly into the 3 master files above.

## 🏗️ Planning & Hand-off Workflow
1. **The Documentation Gate:** Decisions are only added to official documentation after explicit user confirmation.
2. **The Implementation Brief:** Finalized plans must culminate in an [Implementation Brief] containing explicit file paths, schemas, and logic to feed to the Dev chat.
3. **Hardware Emulation Rule:** Assertions must account for touch-only interfaces (no hover-dependent elements). All bugs found must be output as a structured [Bug Ticket] to feed back to Dev.
4. **Pre-Flight Rule:** Code must pass strict ESLint/Prettier checks (no `any` types, no leftover console logs) before the `npm run build` step. Generate a `[QA Request]` list of `data-testid`s when handing off features.
5. **Deployment Exclusivity Rule:** QA will never deploy or run deployment scripts (e.g. `deploy_nas.ps1`). Deployment is strictly handled by the developer after all testing verification and explicit user confirmations are completed.

### 📋 [Bug Ticket] Format
When defects or regressions are discovered during testing, report them using this structure:
```markdown
### 🐛 [Bug Ticket] <Concise Title>
- **Component / View:** <e.g., MealsTab 2x4 Grid, CookbookModal, Calendar Week View>
- **Severity:** <Critical | Major | Minor | Cosmetic>
- **Touch / Hardware Constraint:** <e.g., Requires touch tap, Hover-dependent action not reachable on wall display>
- **Steps to Reproduce:**
  1. ...
  2. ...
- **Expected Behavior:** ...
- **Actual Behavior:** ...
- **Relevant Code Paths / Files:** <File paths and line numbers>
- **Suggested Fix / Context:** ...
```

### 🧪 [QA Request] Format
When handing off features or bug fixes for test automation, provide this structured hand-off:
```markdown
### 🧪 [QA Request] <Feature / Module Title>
- **Target Views:** <e.g., Mobile Home Brief, CookbookModal, Weekly Meal Grid>
- **Testing Hooks (`data-testid`):**
  - `data-testid="<name>"`: <Purpose and target DOM element>
- **Critical Assertions / Flows to Test:**
  1. <Specific user journey or touch assertion>
  2. <Edge cases, e.g. empty states or boundary conditions>
- **Touch / Viewport Constraints:** <e.g. Foldable (852x1024), Mobile Phone (390x844), Wall Display (1920x1080)>
```
