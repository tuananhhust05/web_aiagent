# ForSkale Atlas — Sidebar System: Complete Frontend Specification

> **Purpose**: This document provides an exhaustive specification of both sidebars (Navigation Sidebar + Action Filter Sidebar) so a backend developer or new frontend developer can fully understand and re-implement the UI, state, interactions, and visual design.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Navigation Sidebar (AtlasSidebar)](#2-navigation-sidebar-atlassidebar)
3. [Action Filter Sidebar (ActionFilterSidebar)](#3-action-filter-sidebar-actionfiltersidebar)
4. [Design Tokens & Color System](#4-design-tokens--color-system)
5. [Responsive Behavior](#5-responsive-behavior)
6. [Interaction Flow Diagrams](#6-interaction-flow-diagrams)
7. [API Contracts for Backend](#7-api-contracts-for-backend)

---

## 1. Architecture Overview

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Root Layout (flex, min-h-screen)                       │
│ ┌──────────┬──────────────────────────────────────────┐ │
│ │ AtlasSide│  Main Content Area (flex-1, flex-col)    │ │
│ │ bar      │ ┌──────────────────────────────────────┐ │ │
│ │ (w-60 or │ │ ActionReadyHeader                    │ │ │
│ │  w-[72px]│ ├──────────┬───────────────────────────┤ │ │
│ │  when    │ │ Action   │ ActionReadyContent        │ │ │
│ │ collapsed│ │ Filter   │ (scrollable card grid)    │ │ │
│ │ )        │ │ Sidebar  │                           │ │ │
│ │          │ │ (w-240   │                           │ │ │
│ │          │ │  or 60px)│                           │ │ │
│ └──────────┴─┴──────────┴───────────────────────────┘ │ │
└─────────────────────────────────────────────────────────┘
```

### Component Tree

```
<ActionsProvider>            ← Global state (filter, actions, resolve)
  <div className="flex">
    <AtlasSidebar />         ← Left navigation (file: AtlasSidebar.tsx)
    <div className="flex-1 flex flex-col">
      <ActionReadyHeader />  ← Top bar
      <div className="flex flex-1 overflow-hidden">
        <ActionFilterSidebar />  ← Filter panel (file: ActionFilterSidebar.tsx)
        <ActionReadyContent />   ← Card grid
      </div>
    </div>
  </div>
</ActionsProvider>
```

### State Management

- **AtlasSidebar**: Local `useState<boolean>` for `collapsed` (no global state needed)
- **ActionFilterSidebar**: 
  - Local `useState<boolean>` for `collapsed`
  - Local `useState<string>` for `selectedCategory`
  - Reads from `ActionsContext`: `pendingActions`, `completedActions`, `activeFilter`
  - Writes to `ActionsContext`: `setActiveFilter(filter)`

---

## 2. Navigation Sidebar (AtlasSidebar)

### File: `src/components/atlas/AtlasSidebar.tsx`

### 2.1 State

| State Variable | Type | Default | Description |
|---|---|---|---|
| `collapsed` | `boolean` | `false` | Controls expanded (w-60 / 240px) vs collapsed (w-[72px]) mode |

### 2.2 Data Model

```typescript
// Static navigation items — no backend data needed currently
const navItems = [
  { icon: CalendarDays, label: "Meeting Intelligence", href: "#" },
  { icon: Video,        label: "Meeting Insights",     href: "#" },
  { icon: BarChart3,    label: "Performance",           href: "#" },
  { icon: ClipboardCheck, label: "Action Ready",        href: "#", active: true },
  { icon: HelpCircle,  label: "Q&A Engine",             href: "#" },
  { icon: BookOpen,     label: "Knowledge",             href: "#" },
];
```

**Future backend need**: `active` should be determined by current route, not hardcoded. The backend may need to provide user permissions to show/hide nav items.

### 2.3 Visual Structure (Top to Bottom)

#### Section 1: Collapse Toggle Button

```
┌─────────────────────────────┐
│                        [◀]  │ ← White circle, appears on hover
└─────────────────────────────┘
```

| Property | Value |
|---|---|
| **Position** | `absolute`, `-right-4`, `top-16`, `z-50` |
| **Size** | `h-8 w-8` (32×32px) |
| **Shape** | `rounded-full` (circle) |
| **Background** | `bg-white` |
| **Shadow** | `0 2px 8px rgba(0,0,0,0.15)` → hover: `0 4px 12px rgba(0,0,0,0.2)` |
| **Visibility** | `invisible` by default, `visible` on sidebar hover (`group-hover/sidebar:visible`) |
| **Icon** | `ChevronLeft` (h-4 w-4), color: `text-sidebar` |
| **Icon rotation** | When `collapsed === true`: `rotate-180` (points right →) |
| **Transition** | `duration-200` on button, `duration-300` on icon rotation |

**On Click**:
```
collapsed = !collapsed
→ If was false (expanded): sidebar animates from w-60 → w-[72px], all labels hide
→ If was true (collapsed): sidebar animates from w-[72px] → w-60, all labels show
→ Icon rotates 180° to indicate direction
```

#### Section 2: Logo & Brand

```
Expanded:                    Collapsed:
┌─────────────────────┐      ┌────────┐
│ [LOGO]  ForSkale    │      │ [LOGO] │
└─────────────────────┘      └────────┘
```

| Property | Value |
|---|---|
| **Container** | `flex items-center gap-3 px-4 py-5` |
| **Logo image** | `src/assets/forskale-logo.png` |
| **Logo size** | `h-16 w-16` (64×64px), `shrink-0`, `rounded-lg`, `object-contain` |
| **Logo glow** | `drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]` (white glow effect) |
| **Brand text** | "ForSkale" — `text-base font-semibold tracking-wide text-sidebar-foreground` |
| **Collapsed behavior** | Brand text hidden via `{!collapsed && <p>...</p>}` |

#### Section 3: Gradient Divider (repeated 3 times in sidebar)

```
──────────────────────
```

| Property | Value |
|---|---|
| **Height** | `h-px` (1px) |
| **Margin** | `mx-4` |
| **Background** | `bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent` |
| **Effect** | Subtle horizontal line that fades at edges |

#### Section 4: Record CTA Button

```
Expanded:                    Collapsed:
┌─────────────────────┐      ┌────────┐
│   ◉  Record         │      │   ◉    │
└─────────────────────┘      └────────┘
```

| Property | Value |
|---|---|
| **Container** | `px-3 py-3` |
| **Button width** | `w-full` |
| **Layout** | `flex items-center justify-center gap-2.5` |
| **Border radius** | `rounded-xl` (12px) |
| **Background** | `bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue` |
| **Text** | `text-sm font-semibold text-white` |
| **Shadow** | `0 4px 12px hsl(var(--forskale-green)/0.3)` |
| **Hover** | `translateY(-2px)`, shadow → `0 6px 16px hsl(var(--forskale-green)/0.4)` |
| **Icon** | `Radio` (lucide), `h-4.5 w-4.5 shrink-0` |
| **Collapsed behavior** | Text "Record" hidden, only icon shown. Padding changes to `px-0` |

**On Click**: Currently no action. Backend should trigger meeting recording start.

#### Section 5: Navigation Items

```
Expanded:                          Collapsed:
┌─────────────────────────────┐    ┌──────────┐
│ ▎ 📅 Meeting Intelligence   │    │    📅    │
│   🎥 Meeting Insights       │    │    🎥    │
│   📊 Performance            │    │    📊    │
│ ▎ ☑  Action Ready  ← ACTIVE │    │  ▎ ☑    │
│   ❓ Q&A Engine              │    │    ❓    │
│   📖 Knowledge               │    │    📖    │
└─────────────────────────────┘    └──────────┘
```

| Property | Value |
|---|---|
| **Container** | `nav`, `flex-1 space-y-1 px-2 py-4` |
| **Item layout** | `relative flex items-center gap-3 rounded-lg px-3 py-2.5` |
| **Text** | `text-sm` |
| **Icon size** | `h-5 w-5 shrink-0` |
| **Collapsed behavior** | Label text hidden via `{!collapsed && <span>...</span>}` |

**Active item styling** (currently "Action Ready"):

| Property | Value |
|---|---|
| **Background** | `bg-sidebar-accent` |
| **Text** | `font-medium text-sidebar-accent-foreground` |
| **Icon strokeWidth** | `2` (vs `1.6` for inactive) |
| **Active indicator** | Absolute positioned bar on left edge |

**Active indicator bar**:
| Property | Value |
|---|---|
| **Position** | `absolute left-0 top-1/2 -translate-y-1/2` |
| **Size** | `h-6 w-[3px]` |
| **Shape** | `rounded-r-full` |
| **Background** | `bg-gradient-to-b from-forskale-green to-forskale-teal` |

**Inactive item styling**:

| Property | Value |
|---|---|
| **Text color** | `text-sidebar-foreground/70` |
| **Hover background** | `hsl(var(--forskale-teal)/0.08)` |
| **Hover text** | `text-sidebar-foreground` |

**On Click (any nav item)**:
```
Currently: href="#" — no navigation
Future: Should route to respective page via react-router
Backend need: None for navigation itself, but each page may require its own API
```

#### Section 6: Invite Button

```
Expanded:                    Collapsed:
┌─────────────────────┐      ┌────────┐
│ 👤+ Invite          │      │  👤+   │
└─────────────────────┘      └────────┘
```

| Property | Value |
|---|---|
| **Container** | `px-3 py-2` |
| **Layout** | `flex w-full items-center gap-3 rounded-lg px-3 py-2.5` |
| **Text** | `text-sm text-sidebar-foreground/70` |
| **Icon** | `UserPlus`, `h-5 w-5`, `strokeWidth={1.6}` |
| **Hover** | Same as inactive nav items |
| **Collapsed** | Text hidden, button gets `justify-center` |

**On Click**: Currently no action. Backend should open invite modal/flow.

#### Section 7: User Card

```
Expanded:                         Collapsed:
┌───────────────────────────┐     ┌────────┐
│ (JD)  John Doe            │     │  (JD)  │
│       john@forskale.ai    │     └────────┘
└───────────────────────────┘
```

| Property | Value |
|---|---|
| **Avatar** | `h-9 w-9 rounded-full`, gradient: `from-forskale-green to-forskale-teal` |
| **Avatar text** | `text-sm font-bold text-white`, initials "JD" |
| **Name** | `text-sm font-medium text-sidebar-foreground`, truncated |
| **Email** | `text-xs text-sidebar-foreground/50`, truncated |
| **Collapsed** | Only avatar shown, centered |

**Backend data needed**:
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;  // If provided, show image instead of initials
}
```

### 2.4 Overall Sidebar Container

| Property | Expanded | Collapsed |
|---|---|---|
| **Width** | `w-60` (240px) | `w-[72px]` |
| **Display** | `hidden lg:flex` (desktop only) | Same |
| **Direction** | `flex-col` | Same |
| **Height** | `min-h-screen` | Same |
| **Background** | `bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))]` | Same |
| **Text color** | `text-sidebar-foreground` | Same |
| **Transition** | `transition-all duration-300 ease-in-out` | Same |
| **Group** | `group/sidebar` (enables child hover detection) | Same |

---

## 3. Action Filter Sidebar (ActionFilterSidebar)

### File: `src/components/atlas/ActionFilterSidebar.tsx`

### 3.1 State

| State Variable | Type | Default | Source |
|---|---|---|---|
| `collapsed` | `boolean` | `false` | Local useState |
| `selectedCategory` | `string` | `"interested"` | Local useState |
| `activeFilter` | `FilterType` | `"needs_review"` | ActionsContext (global) |
| `pendingActions` | `ActionCardData[]` | — | ActionsContext (read-only) |
| `completedActions` | `ActionCardData[]` | — | ActionsContext (read-only) |

### 3.2 Derived Data

```typescript
// Overdue detection logic
const getOverdueDays = (dueLabel: string) => {
  const match = dueLabel.match(/(\d+)\s+days?\s+overdue/i);
  return match ? Number(match[1]) : 0;
};

// Only actions overdue by MORE than 5 days AND not completed
const overdueCards = [...pendingActions, ...completedActions].filter(
  (a) => a.isOverdue && getOverdueDays(a.dueLabel) > 5 
         && !completedActions.some((c) => c.id === a.id)
);
```

### 3.3 Status Filters (Queue Navigation)

Three filter buttons that control which action cards are displayed in the main content area:

| Filter | Label | Count Source | Count Suffix | Icon | Color Class | FilterType |
|---|---|---|---|---|---|---|
| 1 | "Needs Review" | `pendingActions.length` | " Actions" | `Circle` (16px) | `bg-accent/10 text-accent` | `"needs_review"` |
| 2 | "Overdue" | `overdueCards.length` | " min" | `AlertTriangle` (16px) | `bg-forskale-cyan/10 text-forskale-cyan` | `"overdue"` |
| 3 | "Completed" | `completedActions.length` | " tasks" | `CheckCircle2` (16px) | `bg-forskale-green/10 text-forskale-green` | `"completed"` |

### 3.4 Categories

Sentiment-based sub-filters (currently local state only, not connected to main filtering):

```typescript
const categories = [
  { key: "interested",     label: `${count} Interested` },
  { key: "not_now",        label: `${count} Not now` },
  { key: "not_interested", label: `${count} Not interested` },
];
```

Counts are derived from: `pendingActions.filter(a => a.sentiment === key).length`

### 3.5 Expanded View (w-[240px])

```
┌──────────────────────────┐
│                    [◀▌]  │ ← PanelLeftClose icon (collapse button)
│                          │
│ ┌──────────────────────┐ │
│ │ ○ Needs Review       │ │ ← Active: green gradient border + dot
│ │   5 Actions          │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ⚠ Overdue            │ │
│ │   2 min              │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ✓ Completed          │ │
│ │   0 tasks            │ │
│ └──────────────────────┘ │
│                          │
│ CATEGORIES               │
│ ┌──────────────────────┐ │
│ │ 3 Interested         │ │ ← Dark pill (selected)
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 1 Not now            │ │ ← Light pill (unselected)
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 1 Not interested     │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

#### Collapse Button (Expanded → Collapsed)

| Property | Value |
|---|---|
| **Position** | Top-right corner, `hidden lg:flex lg:justify-end` |
| **Size** | `h-8 w-8` |
| **Shape** | `rounded-lg` |
| **Icon** | `PanelLeftClose` (16px) |
| **Colors** | `text-muted-foreground`, hover: `bg-muted text-foreground` |

**On Click**: `setCollapsed(true)` → switches to collapsed rail view

#### Status Filter Button (Expanded)

| Property | Active | Inactive |
|---|---|---|
| **Layout** | `flex w-full items-center gap-2.5 rounded-xl border p-2.5` | Same |
| **Border** | `border-accent` | `border-border` |
| **Background** | `bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06]` | `bg-card` |
| **Shadow** | `shadow-md` | None, hover: `shadow-md` |
| **Hover** | — | `translateY(-2px)`, `border-accent` |
| **Icon container** | `h-7 w-7 rounded-full` with color class | Same |
| **Active dot** | `h-2 w-2 rounded-full bg-accent` with glow ring `shadow-[0_0_0_4px_hsl(var(--accent)/0.2)]` | ChevronRight (14px), opacity-0 → opacity-100 on group hover |

**On Click**: `setActiveFilter(filter.filter)` → Updates global context → ActionReadyContent re-renders with filtered cards

#### Category Button

| Property | Selected | Unselected |
|---|---|---|
| **Layout** | `rounded-lg border px-3 py-2` | Same |
| **Text** | `text-xs font-semibold` | Same |
| **Border** | `border-foreground` | `border-border` |
| **Background** | `bg-foreground` | `bg-muted/40` |
| **Text color** | `text-card` (inverted) | `text-muted-foreground` |
| **Hover** | — | `border-accent text-foreground` |

**On Click**: `setSelectedCategory(cat.key)` → Currently local state only (UI highlight changes, no filtering effect on cards yet)

### 3.6 Collapsed View (w-[60px])

```
┌────────┐
│  [▐▶]  │ ← PanelLeft icon (expand button)
│        │
│  [○]   │ ← Status filter icon buttons
│  [⚠]   │
│  [✓]   │
└────────┘
```

#### Expand Button (Collapsed → Expanded)

| Property | Value |
|---|---|
| **Position** | Top, centered, `mb-4` |
| **Size** | `h-8 w-8` |
| **Shape** | `rounded-lg` |
| **Icon** | `PanelLeft` (16px) |
| **Colors** | `text-muted-foreground`, hover: `bg-muted text-foreground` |

**On Click**: `setCollapsed(false)` → switches to expanded view

#### Status Filter Button (Collapsed)

| Property | Active | Inactive |
|---|---|---|
| **Layout** | `relative flex h-10 w-10 items-center justify-center rounded-xl border` | Same |
| **Border** | `border-accent` | `border-border` |
| **Background** | `bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06]` | `bg-card` |
| **Shadow** | `shadow-md` | hover: `shadow-md` |
| **Icon container** | `h-6 w-6 rounded-full` with color class | Same |
| **Active indicator** | `absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent` with glow `shadow-[0_0_0_3px_hsl(var(--accent)/0.2)]` | None |
| **Tooltip** | `title={label (count suffix)}` | Same |

**On Click**: Same as expanded — `setActiveFilter(filter.filter)`

#### Container (Collapsed)

| Property | Value |
|---|---|
| **Width** | `w-[60px]` |
| **Display** | `hidden lg:flex lg:flex-col lg:items-center lg:py-4` |
| **Background** | `bg-card` |
| **Border** | `border-r border-border` |
| **Shrink** | `shrink-0` |

### 3.7 Container (Expanded)

| Property | Value |
|---|---|
| **Width (mobile)** | `w-full`, horizontal layout with `border-b` |
| **Width (desktop)** | `lg:w-[240px] lg:shrink-0 lg:border-r` |
| **Background** | `bg-card` |
| **Padding** | `p-4` |
| **Border** | Mobile: `border-b border-border`, Desktop: `border-r border-border` |
| **Transition** | `transition-all duration-200` |
| **Sticky** | Inner content: `lg:sticky lg:top-0` |

---

## 4. Design Tokens & Color System

### 4.1 Sidebar-Specific Tokens (HSL values in index.css `:root`)

| Token | HSL Value | Usage |
|---|---|---|
| `--sidebar-background` | `224 100% 10%` | Dark navy base of nav sidebar |
| `--sidebar-foreground` | `200 33% 93%` | Light text on dark sidebar |
| `--sidebar-primary` | `174 56% 55%` | Teal accent for dividers |
| `--sidebar-primary-foreground` | `0 0% 100%` | White text on primary |
| `--sidebar-accent` | `224 60% 15%` | Slightly lighter navy for active bg & gradient start |
| `--sidebar-accent-foreground` | `174 56% 55%` | Teal text for active items |
| `--sidebar-border` | `224 40% 18%` | Subtle border color |
| `--sidebar-ring` | `174 56% 55%` | Focus ring color |

### 4.2 Brand Colors

| Token | HSL Value | Visual | Usage |
|---|---|---|---|
| `--forskale-green` | `97 72% 48%` | 🟢 Bright green | Success, active indicators, gradients |
| `--forskale-teal` | `174 56% 55%` | 🟦 Teal | Primary accent, hover states |
| `--forskale-blue` | `213 88% 31%` | 🔵 Deep blue | CTA gradients, info |
| `--forskale-cyan` | `197 82% 65%` | 🔷 Light cyan | Overdue badges |
| `--forskale-lime` | `97 60% 63%` | 🟩 Light green | Secondary success |

### 4.3 General Tokens Used in Filter Sidebar

| Token | HSL Value | Usage |
|---|---|---|
| `--background` | `200 33% 98%` | Page background |
| `--foreground` | `213 33% 16%` | Primary text, selected category bg |
| `--card` | `0 0% 100%` | Card/sidebar backgrounds |
| `--border` | `216 18% 90%` | Default borders |
| `--muted` | `210 20% 96%` | Hover backgrounds |
| `--muted-foreground` | `215 16% 47%` | Secondary text |
| `--accent` | `174 52% 55%` | Active filter borders, dots |

### 4.4 Typography

| Element | Font Family | Weight | Size |
|---|---|---|---|
| Body text | `Inter` | 400-700 | — |
| Headings | `Plus Jakarta Sans` | 400-800 | — |
| Nav labels | Inter | 400 (inactive) / 500 (active) | `text-sm` (14px) |
| Brand name | Inter | 600 | `text-base` (16px) |
| CTA button | Inter | 600 | `text-sm` (14px) |
| Category header | Plus Jakarta Sans | 700 | `text-xs` (12px) |
| Filter labels | Inter | 600 | `text-sm` (14px) |
| Filter counts | Inter | 400 | `text-xs` (12px) |
| User name | Inter | 500 | `text-sm` (14px) |
| User email | Inter | 400 | `text-xs` (12px) |

---

## 5. Responsive Behavior

### Breakpoint: `lg` (1024px)

| Component | Below 1024px | At/Above 1024px |
|---|---|---|
| **AtlasSidebar** | `hidden` (not rendered) | `flex` (visible) |
| **ActionFilterSidebar (expanded)** | `w-full`, horizontal, `border-b` | `w-[240px]`, vertical, `border-r` |
| **ActionFilterSidebar (collapsed)** | `hidden` | `flex` as 60px rail |
| **Collapse buttons** | Hidden (`hidden lg:flex`) | Visible |

### Mobile Layout

On mobile (`< 1024px`), the AtlasSidebar is completely hidden. The ActionFilterSidebar renders as a full-width horizontal strip at the top of the content area with `border-b` instead of `border-r`.

---

## 6. Interaction Flow Diagrams

### 6.1 Navigation Sidebar Collapse/Expand

```
USER hovers over AtlasSidebar
  → White circular button appears at right edge (group-hover/sidebar:visible)

USER clicks collapse button (ChevronLeft)
  ├─ IF currently expanded (collapsed === false):
  │   → setCollapsed(true)
  │   → Sidebar animates: w-60 → w-[72px] (duration-300, ease-in-out)
  │   → All text labels fade/hide (conditional rendering)
  │   → ChevronLeft icon rotates 180° (now points right →)
  │   → Only icons remain visible (centered in 72px rail)
  │   → Main content area expands to fill freed space
  │
  └─ IF currently collapsed (collapsed === true):
      → setCollapsed(false)
      → Sidebar animates: w-[72px] → w-60 (duration-300, ease-in-out)
      → Text labels appear next to icons
      → ChevronLeft icon rotates back to 0° (points left ←)
      → Main content area shrinks

USER moves mouse away from sidebar
  → Collapse button becomes invisible again
```

### 6.2 Filter Sidebar Collapse/Expand

```
USER clicks PanelLeftClose icon (top-right of expanded sidebar)
  → setCollapsed(true)
  → Expanded view unmounts, collapsed rail mounts
  → Rail shows: expand button + 3 icon-only filter buttons
  → Categories section hidden entirely
  → Content area expands

USER clicks PanelLeft icon (top of collapsed rail)
  → setCollapsed(false)
  → Collapsed rail unmounts, expanded view mounts
  → Full filter buttons with labels + categories visible
  → Content area shrinks
```

### 6.3 Filter Selection Flow

```
USER clicks a status filter button (e.g., "Overdue")
  → setActiveFilter("overdue") — updates ActionsContext
  → ActionsContext recalculates filteredActions:
  │
  ├─ "needs_review": pendingActions minus overdue (>5 days)
  ├─ "overdue": pendingActions where isOverdue && overdueDays > 5
  └─ "completed": actions in completedIds set
  │
  → ActionReadyContent re-renders with new filteredActions
  → Clicked button gets active styling (gradient bg, accent border, dot)
  → Previously active button loses active styling
```

### 6.4 Category Selection Flow

```
USER clicks a category button (e.g., "Not now")
  → setSelectedCategory("not_now") — LOCAL state only
  → Clicked button gets dark inverted style (bg-foreground text-card)
  → Previously selected button returns to muted style
  → NOTE: Currently does NOT filter the action cards
  → Backend TODO: Connect category selection to card filtering
```

### 6.5 Nav Item Click Flow

```
USER clicks a nav item (e.g., "Meeting Insights")
  → Currently: navigates to href="#" (no-op)
  → Future: Should use react-router navigation
  → Active indicator (green-teal gradient bar) should move to clicked item
  → Previous active item loses active styling
```

---

## 7. API Contracts for Backend

### 7.1 User Profile (for sidebar user card)

```
GET /api/user/me

Response:
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@forskale.ai",
  "avatarUrl": "https://...",   // optional
  "initials": "JD"              // derived from first+last name
}
```

### 7.2 Navigation Permissions

```
GET /api/user/navigation

Response:
{
  "items": [
    { "key": "meeting_intelligence", "label": "Meeting Intelligence", "enabled": true },
    { "key": "meeting_insights", "label": "Meeting Insights", "enabled": true },
    { "key": "performance", "label": "Performance", "enabled": false },
    { "key": "action_ready", "label": "Action Ready", "enabled": true },
    { "key": "qa_engine", "label": "Q&A Engine", "enabled": true },
    { "key": "knowledge", "label": "Knowledge", "enabled": true }
  ]
}
```

### 7.3 Action Counts (for filter sidebar badges)

```
GET /api/actions/counts

Response:
{
  "needsReview": 5,
  "overdue": 2,
  "completed": 12,
  "byCategory": {
    "interested": 3,
    "not_now": 1,
    "not_interested": 1
  }
}
```

### 7.4 Team Invite

```
POST /api/team/invite
Body: { "email": "colleague@company.com", "role": "member" }

Response:
{ "success": true, "inviteId": "uuid" }
```

### 7.5 Start Recording

```
POST /api/meetings/record/start

Response:
{ "sessionId": "uuid", "status": "recording" }
```

---

## 8. File Download

This specification is available at:
```
/ForSkale_Sidebar_Spec.md
```

To download: Navigate to `{your-app-url}/ForSkale_Sidebar_Spec.md` in your browser.
