# UI/UX Audit Report — Manufacturing Digital Operations System
# Phase 11 Audit

**Date:** October 2026  
**Auditor:** Phase 11 Automated Audit  
**Scope:** All frontend pages in `apps/frontend/src/`  
**Stack:** React 19 + TypeScript + Tailwind CSS v4 + Lucide React  
**Build status at audit:** ✅ 0 errors, 1 warning (lint) — `npm run build` passes

---

## 1. Current UI Assessment

The application has a solid functional foundation. The most recent redesign (Phase 10) introduced a coherent dark sidebar, consistent `ui.tsx` component primitives, and amber/graphite design tokens that align well with the "Industrial Precision" visual language documented in `DESIGN.md`.

**What is working well:**
- The dark sidebar with amber active-indicator is visually distinctive and appropriate for an enterprise application.
- The `ui.tsx` design system enforces consistent `Button`, `Badge`, `Card`, `Table`, `Th`, `Td`, `Input`, and `Label` components across all pages.
- CSS design tokens in `index.css` use Tailwind v4 `@theme` blocks correctly.
- Error and empty states are implemented on all pages.
- The dashboard KPI cards use real API data (not fabricated).
- Loading states exist on all pages.
- Build and TypeScript compile cleanly.

**What needs improvement:**
- Several pages use `alert()` for operation errors (Procurement approve, Production reserve/record, Quality details) — this is a P0 accessibility and UX issue.
- `PRD.md` does not exist in the repository, making direct requirement tracing impossible.
- The top header bar repeats "Manufacturing Digital Operations MVP" on every page with no contextual information (breadcrumbs, current page name, etc.)
- The Procurement page has no way to create a PR or PO from the UI — management-only approval workflow with no input path.
- Production page shows no "Completed" or "Cancelled" orders — no historical visibility.
- KPI label "ACTIVE PROD" is opaque; it means Ready + In_Progress orders combined, which is not obvious from the label.
- `new Date()` is used for the current year in `Login.tsx` which triggers a lint warning about impure function calls in render.
- No confirmation dialogs for destructive or irreversible actions (Approve PR, Reject PR).
- Font loading not confirmed — Inter and JetBrains Mono declared in tokens but not verified in `index.html`.

---

## 2. Page-by-Page Audit

### 2.1 Login (`pages/Login.tsx`)

**Strengths:**
- Professional dark background using `--color-sidebar` token.
- Factory icon (Lucide `Factory`) with amber background is distinctive.
- Form validation uses required attributes and shows API errors inline.
- Loading state on the submit button is correct.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P2 | `new Date()` called directly in render — 1 lint warning | Login.tsx:94 |
| P2 | Abstract circular blur decorations (`blur-3xl`, `blur-2xl`) violate DESIGN.md anti-slop rules — glassmorphism-adjacent | Login.tsx:37-40 |
| P2 | Pre-filled credentials (`admin@mfg.com` / `admin123`) left in default state — acceptable for portfolio demo but should be noted | Login.tsx:8-9 |

**Recommendations:**
- Move `new Date().getFullYear()` to a `const` outside the JSX or in a `useMemo`.
- Remove the blur decoration divs — they contradict DESIGN.md `section 9` anti-patterns.
- The copyright text at the bottom is fine but "MfgOps Inc." is a fabricated company name — consider removing or replacing with a neutral label.

**Priority:** P2

---

### 2.2 Application Shell (`App.tsx`)

**Strengths:**
- Clean sidebar structure with `slate-950` background and amber active border.
- User profile at bottom shows name and role — role shown in amber is a good hierarchy decision.
- `ProtectedRoute` correctly redirects to `/login` when token is absent.
- Logout button with tooltip (`title="Sign out"`) is accessible.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P1 | Top header bar shows only "Manufacturing Digital Operations MVP" — no page context, no breadcrumbs | App.tsx:55-57 |
| P1 | Sidebar has no visual separation between nav groups — "Operations" label exists but all 6 items are in one group with no sub-labeling | App.tsx:47-54 |
| P1 | On mobile, sidebar is `w-full` at top which stacks above content — no hamburger menu, no collapsing. All 6 nav items appear above the page on every mobile load | App.tsx:37-38 |
| P2 | Nav item "Command Center" maps to `/` (root) — a slightly abstract label; "Dashboard" would be more standard | App.tsx:48 |
| P2 | Header bar has no secondary content right-side (could show current user role or quick status) | App.tsx:55 |

**Recommendations:**
- P1: Add current page title to the top header bar (read from the current route).
- P1: Implement mobile hamburger/collapse for the sidebar. The current full-width stacked behavior is unusable on phones.
- P2: Rename "Command Center" to "Dashboard" in the nav for clarity, or keep it but add a sub-label.

**Priority:** P1 (mobile nav), P1 (header context)

---

### 2.3 Dashboard / Command Center (`pages/Dashboard.tsx`)

**Strengths:**
- Four KPI cards use real API data from `/dashboard/summary`.
- Left-border color coding (amber/slate/blue/red) communicates priority hierarchy effectively.
- Low Stock and QC Failure detail tables show actual database records.
- Correct empty states: "Stock levels are healthy." and "No recent failures."
- Loading and error states implemented correctly.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P1 | KPI label "ACTIVE PROD" is ambiguous — it counts `Ready + In_Progress` orders but the label and description "Orders in queue or processing" don't make the distinction explicit | Dashboard.tsx:81-88 |
| P1 | KPI label "QC DEFECTS" counts `recent_failed_inspections.length` (number of failed inspection *records*) not the total *number of failed units* — could be misleading | Dashboard.tsx:100 |
| P1 | KPI cards are `text-4xl font-bold` — very large numbers dominate the card but units are missing (e.g., "3 materials", "5 orders"). A number alone without context requires reading the subtitle | Dashboard.tsx:68 |
| P1 | KPI card for "PENDING PRs" uses a neutral slate accent bar — visually indistinct from a normal card. Pending PRs requiring manager action should be visually elevated, especially when count > 0 | Dashboard.tsx:71 |
| P2 | Date formatting in QC table uses `toLocaleDateString()` without locale/options — produces locale-dependent output (e.g., "10/10/2026" vs "10 October 2026" depending on browser) | Dashboard.tsx:151 |
| P2 | "Available" quantity in Low Stock table shows raw decimal number (e.g., "150.00") without formatting — should trim trailing zeros for readability | Dashboard.tsx:136 |
| P2 | The dashboard has no visible link or quick-action for the "Pending PRs" card CTA ("Review Requests") to filter directly to Pending status — navigates to the full unfiltered Procurement page | Dashboard.tsx:79 |

**Recommendations:**
- P1: Rename "ACTIVE PROD" → "Active Orders" with subtitle "Ready + In Progress"
- P1: Add the count of *failed units* (sum of `fail_quantity`) to the QC card, not just the count of inspections.
- P1: Add a subtle amber background tint to the Pending PRs card when count > 0.
- P2: Use `toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })` for consistent Indonesian locale date formatting across all pages.
- P2: Format quantities with `.toLocaleString()` to trim trailing zeros.

**Priority:** P1

---

### 2.4 Material Master (`pages/Materials.tsx`)

**Strengths:**
- Full CRUD (Create + Read + Edit) is implemented.
- Search by SKU or name works client-side correctly.
- Form shows existing values when editing (pre-fill).
- `is_active` boolean is exposed in the form.
- Error handling in both page-level and form-level.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P1 | `is_active` toggle in the form is a bare `<input type="checkbox">` with no styling — inconsistent with the design system | Materials.tsx (form section) |
| P1 | Unit field is a plain text input (`<Input type="text" />`) — risk of inconsistent free-text values (e.g., "KG" vs "kg" vs "Kilogram"). Should be a `<select>` with predefined units | Materials.tsx (form section) |
| P1 | Material table does not show the `unit` column — users cannot see at a glance what unit a material is measured in | Materials.tsx (table section) |
| P2 | Page header action button "New Material" uses `mb-6` bottom margin which conflicts with the flex row layout — slight alignment issue | Materials.tsx:79 |
| P2 | Inactive materials (`is_active: false`) are included in the default API response (via `getMaterials()`) but there is no UI filter to show/hide inactive materials. If many are inactive, they clutter the view | Materials.tsx:23-29 |

**Recommendations:**
- P1: Add `unit` column to the materials table.
- P1: Replace unit `<Input>` with a `<select>` containing common units (kg, pcs, lembar, liter, m, set, box) — aligns with how units are stored in seed data.
- P1: Replace checkbox with a styled toggle or labeled `<select>` for `is_active`.
- P2: Add "Show Inactive" filter toggle (similar to the Low Stock filter in Inventory).

**Priority:** P1

---

### 2.5 Inventory Management (`pages/Inventory.tsx`)

**Strengths:**
- Search + Low Stock filter combination is well implemented.
- `available_stock` + unit shown together in the table.
- Stock status badge (Healthy/Low Stock) is correct and uses semantic colors.
- Manual Receipt modal shows current stock and minimum threshold for context before submitting.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P1 | No way to create a Goods Receipt from a PO (formal receiving workflow) — the "Receive" button in the inventory table creates a manual adjustment, not a GR. The GR API endpoint (`createGR`) exists but is not surfaced in any UI | Inventory.tsx, procurement.ts |
| P1 | `reserved_stock` column shown in table but no unit label — hard to compare against `available_stock` which has unit shown | Inventory.tsx |
| P1 | `min_stock_threshold` column shows no unit label — ambiguous | Inventory.tsx |
| P2 | Transaction type is hardcoded to `"Receipt"` in the manual receipt modal — the API supports `Adjustment` type but the UI does not expose it | Inventory.tsx |
| P2 | No transaction history view — users cannot see when and how stock changed. The `INVENTORY_TRANSACTION` table exists in the schema but is not queried in any frontend page | inventory.ts, ERD |

**Recommendations:**
- P1: Add unit labels to `reserved_stock` and `min_stock_threshold` columns.
- P2: Add a "View History" button per row that shows `INVENTORY_TRANSACTION` records for that material.
- P2 (Phase 12+): Surface the GR workflow from the Procurement PO tab.

**Priority:** P1 (unit labels), P2 (history view)

---

### 2.6 Procurement (`pages/Procurement.tsx`)

**Strengths:**
- Tab navigation between PR / PO / Supplier is clear and uses amber underline active state consistently.
- PR approval uses RBAC check (`user?.role === "Admin" || user?.role === "Manager"`) before showing Approve/Reject buttons.
- Status badges use correct semantic variants (warning for Pending, success for Approved, error for Rejected).

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P0 | `handleApprovePR` uses `alert()` on error — browser alert is inaccessible, blocks the page, and is explicitly forbidden by DESIGN.md | Procurement.tsx:36 |
| P1 | No "Create PR" button or form in the UI — users cannot submit a new purchase request through the web application. The API endpoint `createPR` exists in `procurement.ts` but is unused | Procurement.tsx, procurement.ts |
| P1 | No "Create PO" button or form in the UI — the `createPO` API function exists but is unused | Procurement.tsx, procurement.ts |
| P1 | PR table does not show what items are being requested — clicking a PR row does nothing. There is no PR detail view | Procurement.tsx |
| P1 | PO table does not show linked PR ID or total cost — the PO detail is minimal | Procurement.tsx |
| P2 | Supplier table has no "Add Supplier" button — `createSupplier` exists in the API but is not surfaced | Procurement.tsx, procurement.ts |
| P2 | PR `requester_name` shown instead of linking to a user — the name is a string field, acceptable for MVP |  |

**Recommendations:**
- P0: Replace `alert()` with inline error state (set state variable, display as error banner below table).
- P1: Add "Create Purchase Request" button and form — the most critical missing workflow for non-Admin users.
- P1: Add PR detail expansion or modal showing line items.

**Priority:** P0 (alert), P1 (missing Create PR)

---

### 2.7 Production (`pages/Production.tsx`)

**Strengths:**
- Material availability check before reservation is implemented and shows per-material status.
- `CheckCircle` / `AlertTriangle` icons in the availability modal are semantically correct.
- Status badges are defined for Planned, Ready, In_Progress, Completed, Cancelled.
- `actualQty` pre-fills with `planned_quantity` as a sensible default.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P0 | `handleReserve` and `handleRecord` use `alert()` on error | Production.tsx:48, 64 |
| P0 | `openCheck` uses `alert()` if availability check fails | Production.tsx:40 |
| P1 | No "Create Production Order" button or form — users cannot create new orders from the UI. This is a major gap in the workflow | Production.tsx |
| P1 | Completed and Cancelled orders are not shown — the table only shows active/actionable orders (`Planned`, `Ready`). There is no historical view of completed production | Production.tsx |
| P1 | BOM table in the availability modal shows material IDs truncated to 8 characters — not human-readable. Material names should be shown instead | Production.tsx:119 |
| P2 | `In_Progress` status has no corresponding action button in the table — orders in this state show no actions, making their presence in the list confusing | Production.tsx |
| P2 | No visible link from Production to Quality — after completing a production record, no indication that the item is now pending QC inspection | Production.tsx |

**Recommendations:**
- P0: Replace all three `alert()` calls with inline modal error states.
- P1: Add "Create Production Order" form (select product, enter planned quantity).
- P1: Show material names instead of truncated IDs in the BOM availability table.
- P1: Add a "Show Completed" toggle or separate tab for historical orders.
- P2: Add a note after "Complete Output" that the batch is now pending QC.

**Priority:** P0 (alerts), P1 (create form + history)

---

### 2.8 Quality Control (`pages/Quality.tsx`)

**Strengths:**
- Two-tab layout (Pending / Inspection Records) clearly separates the workflow.
- Pass/Fail quantity inputs are linked — adjusting one updates the other automatically.
- Defect reason dropdown appears conditionally only when `failQty > 0`.
- Submit button disabled correctly via `Math.abs()` float comparison (fixed in recent commit).
- Inspection details modal shows defect records and finished goods confirmation.

**Problems:**

| Severity | Problem | File / Line |
|---|---|---|
| P0 | `openDetails` uses `alert()` on error | Quality.tsx |
| P1 | Pass Qty input label has a green border color class (`border-emerald-200`) and Fail Qty has red (`border-red-200`) — these are hardcoded on the `Input` component via `className` prop. The colors are a good UX hint but could cause confusion if the border is subtle and the user doesn't notice them | Quality.tsx (inspect form) |
| P1 | Only 5 hardcoded defect reasons — no "Other with text input" fallback. If the real defect doesn't fit, users are forced to pick an inaccurate category | Quality.tsx:142-149 |
| P2 | Inspection Records tab shows inspections but columns (Date, Product, Pass Qty, Fail Qty) do not include the inspector name in the list view — must open Details modal to see it | Quality.tsx |
| P2 | Date formatting in inspection table uses `toLocaleDateString()` without locale options — same issue as Dashboard | Quality.tsx |

**Recommendations:**
- P0: Replace `alert()` with inline error state in the details modal.
- P1: Add "Other" defect reason with a free-text input field.
- P2: Add inspector name column to the Inspection Records table.
- P2: Standardize date formatting with locale options.

**Priority:** P0 (alert), P1 (defect reasons)

---

## 3. Prioritized Issue List

### P0 — Must Fix (Functional / Accessibility Blockers)

| # | Issue | Pages | Risk |
|---|---|---|---|
| P0-1 | `alert()` used for errors in Procurement, Production (×3), Quality | Procurement, Production, Quality | Blocks keyboard users; incompatible with web standards; test environments can't catch these |

### P1 — Important (Workflow / Visual Hierarchy)

| # | Issue | Pages | Impact |
|---|---|---|---|
| P1-1 | No "Create Purchase Request" form in UI | Procurement | Core workflow completely missing for non-Admin roles |
| P1-2 | No "Create Production Order" form in UI | Production | Core workflow completely missing |
| P1-3 | Mobile sidebar stacks vertically — unusable on phones | App.tsx | Entire application is broken on mobile |
| P1-4 | KPI label "ACTIVE PROD" is ambiguous | Dashboard | Managers misread operational state |
| P1-5 | Material table missing `unit` column | Materials | Data incompleteness; users can't verify unit without opening edit form |
| P1-6 | Unit field is free-text — inconsistency risk | Materials | Bad data entry leads to broken inventory quantities |
| P1-7 | BOM availability modal shows UUID fragments not material names | Production | Users cannot identify which materials are short |
| P1-8 | Top header bar provides no page context | App.tsx | Orientation loss, especially on operational sub-pages |
| P1-9 | Inventory reserved/threshold columns missing unit labels | Inventory | Ambiguous numbers |
| P1-10 | No Goods Receipt workflow surfaced in UI | Inventory / Procurement | PO → GR → Inventory flow is invisible to warehouse staff |

### P2 — Polish

| # | Issue | Pages |
|---|---|---|
| P2-1 | `new Date()` in Login render — lint warning | Login.tsx |
| P2-2 | Blur decorations on Login background violate anti-slop rules | Login.tsx |
| P2-3 | Date formatting inconsistent across pages | Dashboard, Quality |
| P2-4 | Quantity decimals not formatted (shows "150.00" instead of "150") | Dashboard, Inventory |
| P2-5 | No "Add Supplier" button in Procurement | Procurement |
| P2-6 | Production Completed/Cancelled orders not visible | Production |
| P2-7 | Inventory transaction history not accessible | Inventory |
| P2-8 | Only 5 hardcoded QC defect reasons — no free-text "Other" | Quality |
| P2-9 | Inspector name missing from Inspection Records list | Quality |
| P2-10 | No font loading confirmed in index.html | Global |
| P2-11 | PRD.md is missing from repository | Repo root |

---

## 4. Functional and Visual Regression Risks

| Change | Risk | Mitigation |
|---|---|---|
| Replacing `alert()` with inline state | Low — purely additive UI change | Test all error paths manually after |
| Adding "Create PR" form | Medium — calls `createPR` API which exists but is untested in UI | Verify against live API endpoint before shipping |
| Adding "Create Production Order" | Medium — must validate product selection and BOM setup | Test with and without BOM data |
| Changing mobile sidebar behavior | Low-Medium — pure CSS layout change | Test on actual mobile viewport |
| Standardizing date formatting | Very Low — display only | Verify date columns look correct with real data |
| Adding unit labels to columns | Very Low — display only | None |
| Replacing Unit free-text with select | Low — requires existing materials to have valid unit values | Seed data already uses "kg", "pcs", "lembar" etc. |

---

## 5. Phase 12 Implementation Plan

Implement in this order to maximize impact with minimum regression risk.

### Step 1: P0 — Fix `alert()` calls (Est: 1-2 hours)

Replace all `alert()` error handling with inline error states.

Files: `Procurement.tsx`, `Production.tsx`, `Quality.tsx`

Pattern:
```tsx
// Before
} catch (err: any) {
  alert(err.response?.data?.error || "Failed");
}

// After
} catch (err: any) {
  setModalError(err.response?.data?.error || "Failed");
}
// Render inside modal footer or body:
{modalError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{modalError}</div>}
```

Verify: Trigger each error path manually. Confirm no `alert()` appears.

---

### Step 2: P1 — Add unit column to Materials table (Est: 30 min)

Add `<Th>Unit</Th>` and `<Td>{m.unit}</Td>` to `Materials.tsx` table.

---

### Step 3: P1 — Replace Unit free-text with select (Est: 30 min)

In the Materials form, replace:
```tsx
<Input type="text" value={formData.unit} ... />
```
with:
```tsx
<select value={formData.unit} ...>
  <option>kg</option><option>pcs</option><option>lembar</option>
  <option>liter</option><option>m</option><option>set</option><option>box</option>
</select>
```

---

### Step 4: P1 — Add unit labels to Inventory table columns (Est: 30 min)

Append `{m.unit}` to `reserved_stock` and `min_stock_threshold` display cells.

---

### Step 5: P1 — Clarify Dashboard KPI labels (Est: 1 hour)

- "ACTIVE PROD" → "Active Orders" with subtitle "Ready + In Progress"
- Add conditional amber tint to Pending PRs card when count > 0
- Standardize date format across both detail tables

---

### Step 6: P1 — Fix BOM table to show material names (Est: 1 hour)

The availability check returns `material_id`. Either:
- (a) Update the backend endpoint to JOIN and return `material_name`, or
- (b) Maintain a local material map in the frontend by fetching materials on mount.

Option (a) is cleaner. File: `apps/backend/src/services/production.service.ts` (or relevant route).

---

### Step 7: P1 — Add header page context (Est: 1 hour)

In `App.tsx`, read `location.pathname` and map to a human-readable page title. Render in the top header bar.

---

### Step 8: P1 — Mobile sidebar collapse (Est: 2-3 hours)

Add hamburger button on mobile. Use React state to toggle sidebar open/closed. Sidebar should overlay content on mobile rather than stacking above it.

---

### Step 9: P1 — "Create Purchase Request" form (Est: 3-4 hours)

Add a `+` button on the PR tab. Build a modal with material select + quantity. Call `createPR` API. This is the highest-value missing feature for the operational workflow.

---

### Step 10: P2 — Fix Login page polish (Est: 30 min)

- Move `new Date().getFullYear()` to a const
- Remove background blur decorations

---

### Step 11: P2 — Standardize date formatting (Est: 1 hour)

Create a shared `formatDate(dateStr: string): string` utility in `src/utils/format.ts`. Use consistent locale and options across all pages.

---

### Step 12: P2 — "Create Production Order" form (Est: 3-4 hours)

Build modal with product select + planned quantity. Call `createProductionOrder`. This completes the production workflow.

---

## 6. Files Inspected During This Audit

| File | Purpose |
|---|---|
| `AGENTS.md` | Engineering rules |
| `DESIGN.md` (v1) | Existing design tokens |
| `docs/architecture.md` | Technical architecture |
| `docs/erd.md` | Data model (read in prior session) |
| `docs/business-process.md` | Business workflows (read in prior session) |
| `apps/frontend/src/index.css` | Design tokens (Tailwind v4 `@theme`) |
| `apps/frontend/src/App.tsx` | Shell layout, sidebar, routing |
| `apps/frontend/src/components/ui.tsx` | Design system primitives |
| `apps/frontend/src/pages/Login.tsx` | Authentication page |
| `apps/frontend/src/pages/Dashboard.tsx` | Command Center |
| `apps/frontend/src/pages/Materials.tsx` | Material Master |
| `apps/frontend/src/pages/Inventory.tsx` | Inventory Management |
| `apps/frontend/src/pages/Procurement.tsx` | Procurement |
| `apps/frontend/src/pages/Production.tsx` | Production Orders |
| `apps/frontend/src/pages/Quality.tsx` | Quality Control |
| `apps/frontend/src/api/client.ts` | Axios config |
| `apps/frontend/src/api/dashboard.ts` | Dashboard API |
| `apps/frontend/src/api/inventory.ts` | Inventory + Materials API |
| `apps/frontend/src/api/procurement.ts` | Procurement API |
| `apps/frontend/src/api/production.ts` | Production API |
| `apps/frontend/src/api/quality.ts` | Quality API |
| `apps/frontend/src/store/useAuthStore.ts` | Auth state |
| `apps/frontend/package.json` | Dependencies and scripts |
| `PRD.md` | **Does not exist** — noted as missing |

---

## 7. Checks Actually Run

| Check | Command | Result |
|---|---|---|
| TypeScript + Vite build | `npm run build --workspace=frontend` | ✅ Exit code 0, no errors |
| Lint | `npm run lint --workspace=frontend` | ✅ Exit code 0, 1 warning (Login.tsx `new Date()`) |

No browser rendering tests, no E2E tests, and no backend tests were run during this phase.

---

## 8. Limitations and Unresolved Questions

1. **PRD.md is missing.** The primary requirements document does not exist in the repository. This audit was conducted against `docs/business-process.md`, `docs/erd.md`, and `docs/architecture.md` as proxies.
2. **Design references not accessible.** The four GitHub/blog URLs listed in the Phase 11 prompt could not be accessed from this environment. Design decisions in this audit are based on the existing `DESIGN.md` v1 and direct code inspection.
3. **Font loading unverified.** `index.html` was not inspected. Inter and JetBrains Mono may or may not be loaded via a CDN or self-hosted. Recommend checking `apps/frontend/index.html`.
4. **Backend test coverage unknown.** No backend test files were inspected. Testing section of AGENTS.md rules (#8) could not be verified.
5. **Deployed version vs. repository.** The deployed Vercel application may differ from the repository state if the latest commits are still building. All findings in this report are based on the repository source code, not the running deployment.
