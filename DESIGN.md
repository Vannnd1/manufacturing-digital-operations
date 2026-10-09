# UI/UX and Visual Design Rules

This document defines the visual identity, component usage, and structural patterns for the Manufacturing Digital Operations System.

**Implementation Foundation:** Tailwind CSS + shadcn/ui.
**Important:** Do NOT use the default shadcn/ui or Tailwind aesthetic. The UI must be overridden to match the explicit identity defined below.

## 1. Product Visual Identity
**Industrial Enterprise Software**
*Functional · Precise · Restrained · Operational · Information-first*

The visual identity is deliberately quiet and structured. It exists to present operational data clearly without visual interference. The interface should feel like a reliable, high-precision industrial tool.

## 2. Design Tokens

### 2.1 Palette
- **Primary:** High-contrast neutral (e.g., Slate 900 / almost black) for primary actions.
- **Backgrounds:** Clean whites and very subtle cool grays (e.g., Slate 50) to separate sections without heavy borders.
- **Borders:** Thin, low-contrast grays (e.g., Slate 200/300) for structural division.
- **Semantic Colors:**
  - **Success:** Muted green (e.g., Emerald 600) — use sparingly, only for actual success states (e.g., "Pass").
  - **Error/Danger:** Restrained red (e.g., Red 600) — for alerts, destructive actions, or "Fail" states.
  - **Warning:** Ochre/Amber (e.g., Amber 500) — for low stock or pending states.
  - **Information:** Muted blue (e.g., Blue 600) — for neutral indicators.
- **Rule:** Do not use vibrant purples, indigos, or neon colors.

### 2.2 Typography
- **Font Family:** A highly legible, structured sans-serif (e.g., Inter, Roboto, or system fonts). Monospace (e.g., JetBrains Mono, Fira Code) for IDs, SKUs, and data tables.
- **Hierarchy:** Flat hierarchy. Avoid massive headings. Use font weight and subtle size differences to establish hierarchy, not extreme scale.

### 2.3 Spacing & Component Density
- **Density:** High density. Operational software requires data density. Use compact spacing (e.g., `p-2`, `p-3`, `gap-2`).
- **Rule:** Avoid decorative, airy whitespace typical of marketing SaaS.

### 2.4 Radius
- **Radius:** Sharp or barely rounded (e.g., `rounded-sm` or `rounded-none`).
- **Rule:** No pill-shaped buttons or heavily rounded cards (`rounded-xl` or `rounded-full` are forbidden unless strictly necessary for semantic UI like avatars).

### 2.5 Elevation / Shadow
- **Shadows:** Minimal to none. Rely on borders to separate containers. Use a single, hard shadow only for floating elements (dropdowns, modals, drawers).
- **Rule:** No soft, diffuse, colored, or layered shadows.

### 2.6 Icon Style
- **Icons:** Sharp, stroke-based, functional icons (e.g., Lucide with a consistent 1.5px stroke weight).
- **Rule:** No emojis used as UI icons. No two-tone or illustrated icons.

### 2.7 Motion & Liveliness Dials
- **ENERGY:** 1 (Static, calm, focused)
- **RHYTHM:** 2 (Structured, predictable)
- **MOTION:** 1 (Instant or nearly instant transitions)
- **Rule:** All motion must be less than 150ms. No bouncy spring animations.

## 3. Layout Strategy
- **Structure:** Edge-to-edge layouts or wide max-width containers. Use a persistent sidebar or dense top navigation for routing.
- **Hierarchy:** The main work area should occupy the vast majority of screen real estate.
- **Alignment:** Strict grid alignment. Forms and data should align cleanly on the left axis. Numbers align right.

## 4. Component Usage Rules
- **Buttons:** Primary buttons should be solid dark neutrals. Secondary buttons should be outline or ghost.
- **Cards:** Use cards only to group genuinely distinct sections, not to wrap every piece of content. Prefer simple dividers.
- **Badges:** Use solid or subtle-background badges for statuses. Keep them small.

## 5. Structural Patterns
- **Data Tables:** The primary view for any collection. Must support dense rows, sticky headers, and monospaced data columns where appropriate. No alternating row colors unless density demands it; prefer subtle borders.
- **Forms:** Single column for narrow contexts, multi-column for dense data entry. Labels above fields. Clear validation feedback inline.
- **Filters:** Placed above or beside tables in a compact strip. Avoid hiding essential filters behind menus.
- **Detail Drawers:** Use side-drawers (slide-overs) for item details, editing, or secondary workflows to keep the user in context of the main data table, rather than navigating to a new page for everything.

## 6. Responsive Behavior
- Desktop-first, but strictly usable on tablets and smaller screens.
- Tables should allow horizontal scrolling on small screens rather than collapsing into unreadable stacked cards.
- Sidebars collapse into hamburger menus on mobile.

## 7. Accessibility Expectations
- Strict WCAG AA compliance minimum.
- Focus rings must be highly visible (e.g., `ring-2 ring-slate-900 ring-offset-1`). No `outline-none` without a custom focus state.
- Forms must have explicit `<label>` elements.
- Semantic HTML must be used for tables, buttons, and navigation.

## 8. State Design
- **Loading:** Use skeleton loaders that match the exact shape of the incoming data, or subtle inline spinners. No massive overlay spinners.
- **Empty:** Clean, text-based empty states explaining why it is empty and the primary action to populate it. No decorative illustrations.
- **Error:** Clear, actionable error banners with red borders. Explain exactly what failed and how to fix it.
- **Success:** Subtle toast notifications or inline green text. Do not hijack the screen.
- **Disabled:** Visually distinct (opacity reduced, grayed out) and un-clickable. Forms should explain *why* an action is disabled if not obvious.

## 9. Anti-Slop Rules & Explicit Avoids
Explicitly avoid the following generic, decorative, or "AI-slop" patterns:
- Default shadcn/ui visual language (must be restyled to be sharper and denser).
- Purple/indigo "AI" gradients.
- Gradient hero text.
- Glassmorphism (blurred backgrounds).
- Excessive rounded containers or "bento grids" used purely as decoration.
- Emojis as UI icons.
- Decorative glow, blur, or "aurora" effects.
- Generic SaaS marketing hero layouts.
- Meaningless KPI cards or fake metrics on dashboards.
- Hover animation everywhere (buttons shouldn't grow or bounce on hover).
- Fake terminal or demo UI.
- Non-functional buttons.
- Decorative, airy whitespace.
- Generic AI marketing copy ("Supercharge your workflow", etc.).

## 10. Rules for Visual Techniques
Every gradient, animation, decoration, color treatment, or unusual layout **must have a clear product or usability purpose**.
- *Example:* A background color change is allowed to indicate a selected row. A gradient is NOT allowed just to make a button "pop".
- *Example:* An animation is allowed to slide in a drawer (max 150ms). An animation is NOT allowed to make a card bounce on load.

## 11. Pre-Release Visual/Anti-Slop Review Checklist
Before any feature is marked complete, it must pass this review:
- [ ] Are all UI elements functional (no fake buttons/metrics)?
- [ ] Is the spacing dense enough for operational data?
- [ ] Are border radiuses sharp (`sm` or `none`)?
- [ ] Have all unnecessary shadows and glows been removed?
- [ ] Is the color palette restrained (grays/monochromes for structure, semantic colors only for state)?
- [ ] Are animations instant or near-instant (Motion: 1)?
- [ ] Is the focus state clearly visible on all interactive elements?
- [ ] Does the UI avoid bento grids, glassmorphism, and gradient text?
- [ ] Are tables used instead of cards for operational records?
