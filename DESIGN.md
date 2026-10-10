# DESIGN.md — Manufacturing Digital Operations System
# UI/UX Design System

**Version:** 2.0 (Phase 11 Audit — October 2026)
**Stack:** React 19 + TypeScript + Tailwind CSS v4 + Lucide React
**No external UI library** — design system lives in `apps/frontend/src/components/ui.tsx`

---

## 1. Product Design Principles

> These principles are **specific design decisions for this manufacturing application**, not generic guidelines.

1. **Operational clarity first.** Every element on screen must earn its place by helping an operator understand system state or take an action. Decoration is not a valid reason for an element to exist.
2. **Industrial precision, not industrial brutalism.** The interface is structured and serious, but not hostile. Use restraint, not austerity.
3. **Information density over whitespace.** Users of this system are looking at it for hours. Airy, marketing-style spacing wastes their time and attention.
4. **Status drives visual weight.** Color and emphasis should be proportional to operational urgency — a low stock alert deserves more visual weight than a healthy status badge.
5. **Actions must be reachable without hunting.** Primary actions must be visible without scrolling on the relevant page. Secondary actions belong in modals or contextual rows.
6. **Never lie.** Do not show a number, a metric, or a status that is not backed by a real database value. Zero is acceptable. A fake number is not.

---

## 2. Design Reference Attribution

The following references were reviewed during this audit:

- **`DESIGN.md` (v1.0, existing in repo):** Provided the original design token baseline (graphite sidebar, amber accent, zero-radius borders, table density rules). These carry over to this version with corrections noted below.
- **`docs/architecture.md`:** Confirmed the stack — Tailwind v4 `@theme` blocks, no shadcn/ui in use (contrary to the v1.0 DESIGN.md claim). All components are hand-written in `ui.tsx`.
- **Referenced GitHub repos (`anti-ai-slop-ui`, `anti-slop`, `ponytail`):** Could not be accessed directly from this environment. The anti-slop principles already captured in the existing `DESIGN.md` v1.0 (section 9) are presumed to reflect those sources. No claims are made about specific content from those repos.
- **JetBrains blog post on Ponytail:** Could not be accessed. Not cited further.

---

## 3. Color Palette

### 3.1 Current Tokens (defined in `apps/frontend/src/index.css`)

```css
--color-background:   #F9FAF8;  /* Warm off-white — page background */
--color-surface:      #FFFFFF;  /* Card/panel surface */
--color-foreground:   #1A1C23;  /* Primary text — graphite */
--color-sidebar:      #13151A;  /* Sidebar background — near-black */
--color-primary:      #1A1C23;  /* Primary button fill */
--color-accent:       #EA580C;  /* Amber/orange — active nav, warnings, CTAs */
--color-border:       #E5E7EB;  /* Default border — slate-200 equivalent */
--color-muted:        #F3F4F6;  /* Muted backgrounds */
--color-muted-foreground: #6B7280; /* Secondary text */
```

### 3.2 Semantic Color Roles

| Role | Color | Tailwind Utility | Usage |
|---|---|---|---|
| Danger / Fail | Red 600 `#DC2626` | `text-red-600`, `bg-red-50`, `border-red-500` | QC failures, destructive actions, error states |
| Warning / Low Stock | Amber 600 `#D97706` | `text-amber-600`, `bg-amber-50`, `border-amber-500` | Low stock alerts, pending states |
| Success / Pass | Emerald 600 `#059669` | `text-emerald-600`, `bg-emerald-50`, `border-emerald-200` | Healthy stock, approved states, pass results |
| Info / Neutral | Blue 600 `#2563EB` | `text-blue-700`, `bg-blue-50` | Production active state, informational badges |
| Accent / Active | Orange 600 `#EA580C` | `text-amber-700`, `border-amber-500` | Active nav indicator, primary CTA |

### 3.3 Rules

- **Do not use** purple, indigo, or gradient backgrounds for any structural or decorative purpose.
- **Do not mix** amber and blue as competing accent colors on the same page without a functional reason (currently the dashboard uses amber for Low Stock cards and blue for Active Production — this is acceptable because they represent different operational domains).
- Background color changes for row selection or hover are allowed. Gradients are not.

---

## 4. Typography

### 4.1 Font Stack

```css
--font-sans: "Inter", sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

> **Note (assumption requiring validation):** Inter and JetBrains Mono are declared in CSS tokens but not confirmed loaded via a `<link>` or `@import` in the HTML. If not loaded, the system will fall back to the OS sans-serif. Verify in `apps/frontend/index.html` and add the appropriate font imports if missing.

### 4.2 Type Scale (implemented in practice)

| Element | Size | Weight | Notes |
|---|---|---|---|
| Page title (`PageHeader`) | `text-2xl` (24px) | `font-semibold` | One per page |
| Page description | `text-sm` (14px) | normal | Slate-500 |
| Section header (CardHeader) | `text-sm` / `font-medium` | 500 | Slate-800 |
| Table header (`Th`) | `text-xs` (12px) | `font-medium` | Uppercase + tracking-wider |
| Table cell (`Td`) | `text-sm` (14px) | normal | Slate-700 |
| KPI number | `text-4xl` | `font-bold` | Slate-900 |
| Badge | `text-xs` | `font-semibold` | Uppercase + tracking-wider |
| Monospace data (IDs, SKUs) | `text-xs` | `font-mono` | Slate-500 |

### 4.3 Rules

- **Heading scale is flat.** Avoid `text-3xl` or larger except for KPI numbers on the dashboard.
- **Monospace for data, sans-serif for labels.** IDs, SKUs, quantities, and dates shown inline with other data use `font-mono`.
- **No gradient text, no italics for emphasis.** Use font weight instead.

---

## 5. Spacing and Layout

### 5.1 Page Layout

```
Sidebar: 256px (w-64), fixed on desktop, full-width on mobile
Top header: 64px (h-16), decorative/branding only  
Main content padding: p-8 (32px)
Content max-width: max-w-7xl (1280px)
Between sections: space-y-6 or space-y-8
Between cards in a grid: gap-5 or gap-6
```

### 5.2 Density Rules

> **Specific decision:** This application targets operational users who read dense data. Spacing is compact, not comfortable.

- Table rows: `px-5 py-3` — not more than `py-4`
- Card padding: `p-5` interior, `p-4` for filter bars
- Form field groups: `space-y-4` or `space-y-5`
- Modal max-width: `max-w-sm` for simple forms, `max-w-xl` for data-heavy dialogs
- Grid columns: 4-column KPI row, 2-column for detail tables below

### 5.3 Rules

- Numbers align **right**. All quantity, price, and count columns use `text-right`.
- Labels align **left**. Status, name, and identifier columns are left-aligned.
- Do not use `gap-8` or larger between sibling cards — it wastes operational screen real estate.

---

## 6. Borders, Radius, Elevation

### 6.1 Radius

```
All cards, buttons, inputs, badges, modals: border-radius 0px (--radius-sm: 0px)
Avatar/icon containers only: 2px (--radius-md: 2px)
```

**Rule:** `rounded-lg`, `rounded-xl`, `rounded-full` are forbidden for UI containers. Only avatars and circular icon buttons may use `rounded-full`.

### 6.2 Borders

- Structural borders: `border border-slate-200` (thin, low-contrast)
- Active/focus borders: `border-amber-500` or `border-emerald-500` depending on context
- Table row dividers: `border-b border-slate-100` (lighter than structural borders)
- Section dividers inside modals: `border-t border-slate-200`
- Error state borders: `border-l-4 border-red-500` on error banners

### 6.3 Elevation / Shadows

- Cards: `shadow-sm` (barely perceptible) — avoid `shadow-md` or larger
- Modals: `shadow-xl` — floating elements are the only case for strong shadows
- Sidebar: `shadow-xl` — acceptable as it is always floating over content
- **Rule:** No colored shadows, no layered multiple shadows, no `drop-shadow` effects.

---

## 7. Navigation and Page Headers

### 7.1 Sidebar

- **Background:** `bg-slate-950` (near-black)
- **Active state:** `bg-white/10 text-white border-l-2 border-amber-500` — left amber bar is the primary active indicator.
- **Inactive:** `text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200`
- **Desktop Behavior (Collapsible):** 
  - Must include an accessible toggle button to expand/collapse.
  - **Expanded:** Displays navigation icons and labels (`w-64`).
  - **Collapsed:** Displays icons only (`w-16` or similar) with accessible tooltips for labels. Active state must remain clearly identifiable (e.g., maintaining the amber border).
  - Main content must resize smoothly on toggle without causing horizontal overflow.
  - State persistence (e.g., localStorage via Zustand) should be evaluated to remember user preference.
- **Mobile Behavior:** 
  - Must use a drawer interaction (slide-over with backdrop) triggered by a hamburger menu in the top header, rather than stacking above content or using the desktop collapsed layout.
- **Logo area:** amber square + bold uppercase product name (hidden or abbreviated in collapsed mode).
- **User profile at bottom:** name + role label in amber-500 (hidden in collapsed mode, leaving only the avatar/icon).

### 7.2 Page Header Component

```tsx
<PageHeader title="..." description="..." />
```

The `PageHeader` is always the first element on any page. It renders:
- `text-2xl font-semibold text-slate-900 tracking-tight` for the title
- `text-sm text-slate-500 mt-1` for description

**Rule:** Primary action buttons (e.g., "New Material") should appear at the same level as `PageHeader`, right-aligned, within a flex container. Do not bury primary actions in filter bars.

### 7.3 Top Header Bar

Currently contains only "Manufacturing Digital Operations MVP" text. This is acceptable as a space holder, but in Phase 12 this could include breadcrumbs for deeper page hierarchy.

---

## 8. Component Patterns

### 8.1 Buttons

Defined in `ui.tsx`:

| Variant | Use case | Style |
|---|---|---|
| `primary` | Primary submit, confirm | `bg-slate-900 text-white hover:bg-slate-800` |
| `secondary` | Contextual table actions | `bg-white text-slate-700 border border-slate-300` |
| `accent` | Highlighted filter toggle when active | `bg-amber-600 text-white hover:bg-amber-700` |
| `danger` | Destructive actions (Reject, Delete) | `bg-red-600 text-white hover:bg-red-700` |
| `ghost` | Dialog cancel, low-priority actions | `bg-transparent text-slate-600 hover:bg-slate-100` |

**Rules:**
- Disabled state: `opacity-50 cursor-not-allowed` — always visually distinct
- Button size in table rows: `px-3 py-1.5 text-xs`
- Icons in buttons: `w-4 h-4 mr-2` or `mr-1.5` for smaller buttons

### 8.2 Badges

```tsx
<Badge variant="success|warning|error|info|default">text</Badge>
```

All badges are: `inline-flex text-xs font-semibold uppercase tracking-wider border` with variant-appropriate background/border.

**Rule:** Status badges must only use the 5 defined variants. Do not inline new colors per page.

### 8.3 Forms and Inputs

- Label: `block text-sm font-medium text-slate-700 mb-1.5` — always above the field
- Input: `w-full px-3 py-2 border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500`
- Form errors: `p-3 bg-red-50 border border-red-200 text-red-700 text-sm` inside the form
- All `<input>` elements must have an explicit `<label>` associated via `htmlFor`/`id`

### 8.4 Tables

```
Table > thead > tr > Th (column header)
Table > tbody > tr > Td (data cell)
```

- `Th`: `px-5 py-3 font-medium text-slate-500 bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-xs`
- `Td`: `px-5 py-3 border-b border-slate-100 text-slate-700`
- Row hover: `hover:bg-slate-50/50 transition-colors` on the `<tr>`
- `Td` supports all native HTML `<td>` attributes including `colSpan`

### 8.5 Modals / Dialogs

Pattern used consistently across pages:

```
Backdrop: fixed inset-0 bg-slate-900/60 backdrop-blur-sm
Panel: bg-white shadow-xl border border-slate-200 rounded-sm
Header: p-5 border-b border-slate-200 bg-slate-50/50 — title + X button
Body: p-6 overflow-y-auto
Footer: p-5 border-t border-slate-200 bg-slate-50/50 — action buttons right-aligned
```

---

## 9. States

### 9.1 Loading

**Current implementation (acceptable for MVP):**
```tsx
<div className="p-8 text-slate-500 animate-pulse">Loading...</div>
```

**Target for Phase 12 (P2):** Replace full-page loading with a skeleton that matches the table shape to prevent layout shift.

### 9.2 Empty

**Current implementation:**
```tsx
<tr><Td colSpan={n} className="text-center py-8 text-slate-500 italic">No records found.</Td></tr>
```

This is acceptable. Italic text is permitted here as a visual differentiator for empty state prose (not for emphasis).

### 9.3 Error

**Current implementation:**
```tsx
<div className="p-4 bg-red-50 text-red-700 text-sm border-l-4 border-red-500">{error}</div>
```

This is correct and should remain consistent across all pages.

### 9.4 Success Feedback

**Current implementation:** No toast notifications. After a successful action, the form closes and the table refreshes.

**Rule:** This is acceptable for MVP. Do not add toast libraries without a concrete usability reason. A silent refresh is not confusing for operational workflows.

---

## 10. Accessibility Requirements

- All interactive elements must have visible focus states. Do not use `outline-none` without a replacement.
- Current `Input` component uses `focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500` — acceptable.
- All form inputs must have associated `<label>` elements — currently enforced via the `Label` component.
- Tables must use `<thead>`, `<tbody>`, `<th>` semantically — currently correct.
- Buttons must never be implemented as `<div onClick>` or `<span onClick>`.
- Color alone must not convey meaning — badges use both color and text label.

---

## 11. Responsive Behavior

- Sidebar: Full-width on mobile (`w-full`), `w-64` fixed on `md:` breakpoint
- Page grid: Single column on mobile, 4-column on `lg:` breakpoint for KPI cards
- Tables: `overflow-x-auto` wrapper to enable horizontal scroll on small screens — do NOT collapse into stacked cards
- Modals: Full-width on mobile with `p-4` margin

---

## 12. Icon Usage

- **Library:** Lucide React (currently `lucide-react@^1.53.0`)
- **Default size:** `w-4 h-4` in buttons and inline contexts, `w-5 h-5` in modal headers
- **Stroke weight:** Default Lucide stroke (1.5px)
- **Semantic icon assignments:**
  - `AlertTriangle` — Low stock warning
  - `ShoppingCart` — Procurement / Purchase Requests
  - `Target` — Production Orders
  - `ShieldAlert` — Quality Control / QC Defects
  - `TrendingDown` — Inventory shortages
  - `PackagePlus` — Receive stock
  - `CheckCircle` — Material availability OK
  - `LogOut` / `User` — Authentication
  - `Factory` — Login page branding
  - `Plus` — Create new record
  - `Edit` — Edit existing record
  - `Search` — Search filter
  - `X` — Close modal

**Rule:** Do not use emoji as icons. Do not use two-tone, illustrated, or filled icons alongside the Lucide stroke set.

---

## 13. Anti-Patterns — Explicit Avoids

The following patterns are **forbidden** in this codebase:

- `rounded-xl`, `rounded-2xl`, `rounded-full` on cards, panels, or buttons
- Purple/indigo backgrounds (`bg-purple-*`, `bg-indigo-*`) anywhere
- Gradient text (`bg-clip-text text-transparent bg-gradient-to-r`)
- `backdrop-blur` for anything other than modal backdrops
- Glow effects (`shadow-[0_0_*]`, `drop-shadow-*` with color)
- Bento grid layouts (decorative asymmetric card grids)
- Fake metrics or `Math.random()` in any displayed value
- `alert()` for user-facing errors — use inline error states in forms/banners
- Any animation over 150ms duration
- `bounce`, `spin`, `ping` Tailwind animations except `animate-pulse` for loading

---

## 14. Dashboard-Specific Visual Hierarchy

The Command Center follows this priority stack (top = highest visual weight):

1. **Red / danger indicators** — QC failures with fail_quantity > 0
2. **Amber / warning indicators** — Low stock items below threshold
3. **Active counts** — Production orders in Ready or In_Progress state
4. **Neutral operational data** — Pending PRs awaiting manager action

The KPI card left-border color reinforces this hierarchy: red > amber > blue > slate.

Empty states on the dashboard (`"Stock levels are healthy."`, `"No recent failures."`) must remain text-only — do not add illustrations or icons in the table cell empty states.

---

## 15. Acceptance Checklist (Pre-Release)

Before any feature or page change is marked done:

- [ ] All interactive elements are functional — no placeholder buttons
- [ ] Table rows display real API data, not mock arrays
- [ ] Empty, loading, and error states are implemented
- [ ] Numbers are right-aligned, text labels are left-aligned
- [ ] No `rounded-xl` or larger border-radius used
- [ ] No gradient backgrounds or text
- [ ] Focus states are visible on all interactive elements
- [ ] Associated `<label>` exists for every form input
- [ ] Modal pattern (header / body / footer) is consistent
- [ ] Build passes with `npm run build --workspace=frontend` without errors
- [ ] Lint passes with `npm run lint --workspace=frontend` without new errors
