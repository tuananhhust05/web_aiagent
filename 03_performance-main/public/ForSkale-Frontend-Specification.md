# ForSkale Frontend — Complete Specification for Backend Developers

> **Generated**: 2026-03-09  
> **Purpose**: Exhaustive reference so a backend developer can fully understand and re-implement the frontend logic, component structure, interactions, state management, and data flow.

---

## Table of Contents

1. [Application Architecture](#1-application-architecture)
2. [Routing](#2-routing)
3. [Layout Structure](#3-layout-structure)
4. [Sidebar Component](#4-sidebar-component)
5. [Performance Page](#5-performance-page)
6. [Design System & Theming](#6-design-system--theming)
7. [Data Structures (Static / Mock)](#7-data-structures-static--mock)
8. [Interaction Map — Click-by-Click](#8-interaction-map--click-by-click)
9. [State Management](#9-state-management)
10. [Future Backend Integration Points](#10-future-backend-integration-points)

---

## 1. Application Architecture

### Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with HSL-based CSS custom properties (design tokens)
- **Charting**: Recharts (AreaChart)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **State**: React `useState` (local component state only — no global store)
- **UI Library**: shadcn/ui (Radix-based component primitives)

### Entry Point

```
main.tsx → App.tsx → BrowserRouter → Routes
```

### Global Providers (App.tsx)

The root `<App>` wraps everything in:

1. `QueryClientProvider` — TanStack React Query (currently unused, ready for API calls)
2. `TooltipProvider` — Radix tooltip context
3. `Toaster` (shadcn) — Toast notification container
4. `Sonner` — Alternative toast/notification container
5. `BrowserRouter` — Client-side routing

---

## 2. Routing

| Path | Component      | Description                                         |
| ---- | -------------- | --------------------------------------------------- |
| `/`  | `<Index />`    | Main dashboard — renders sidebar + Performance page |
| `*`  | `<NotFound />` | 404 catch-all                                       |

**Note**: There is currently only one functional route. All sidebar navigation items point to `href="#"` (no-op). In a full implementation, each nav item would route to its own page.

---

## 3. Layout Structure

### Index Page (`src/pages/Index.tsx`)

The root layout is a horizontal flex container filling the viewport:

```
┌─────────────────────────────────────────────────┐
│ flex w-screen h-screen overflow-hidden          │
│ ┌──────────┬────────────────────────────────────┤
│ │ Sidebar  │  Performance Page                  │
│ │ (w-60 or │  (flex-1, scrollable)              │
│ │  w-[72px])│                                   │
│ │          │                                    │
│ └──────────┴────────────────────────────────────┘
```

- The sidebar is a fixed-width `<aside>` that shrinks/expands
- The main content area (`Performance`) fills remaining space with `flex-1` and has its own vertical scroll

---

## 4. Sidebar Component

**File**: `src/components/AppSidebar.tsx`  
**State**: `collapsed: boolean` (default: `false`)

### Visual Structure (top to bottom)

#### 4.1 Collapse Toggle Button

- **Position**: Absolutely positioned, `top-[18px] -right-3.5`, overlapping sidebar edge
- **Appearance**: 28×28px rounded-lg, white background, subtle border & shadow
- **Icon**: `ChevronLeft` when expanded, `ChevronRight` when collapsed
- **On Click**: Toggles `collapsed` state → sidebar width animates between `w-60` (240px) and `w-[72px]` (72px)
- **Animation**: `transition-all duration-300`

#### 4.2 Logo Section

- **Container**: Horizontal flex, `px-4 py-4`, bottom border
- **Logo Image**: `src/assets/forskale-logo.png` in a 40×40px rounded container with white background
- **Text**: "ForSkale" in bold, tracking-wider — **hidden when collapsed**

#### 4.3 Gradient Divider

- A 1px-height `<div>` with a horizontal gradient: transparent → teal/20% → transparent

#### 4.4 Record CTA Button

- **Width**: Full sidebar width minus padding
- **Style**: Gradient background `from-forskale-green via-forskale-teal to-forskale-blue`
- **Icon**: `Radio` (lucide)
- **Text**: "Record" — **hidden when collapsed**
- **Hover**: Translates up 0.5px, shadow intensifies
- **On Click**: Currently no action (placeholder for future recording feature)

#### 4.5 Navigation Items

Six items rendered from a static array:

| #   | Name                 | Icon             | Active              |
| --- | -------------------- | ---------------- | ------------------- |
| 1   | Meeting Intelligence | `CalendarDays`   | No                  |
| 2   | Call Insights        | `PhoneCall`      | No                  |
| 3   | Performance          | `BarChart3`      | **Yes** (hardcoded) |
| 4   | Action Ready         | `ClipboardCheck` | No                  |
| 5   | Q&A Engine           | `HelpCircle`     | No                  |
| 6   | Knowledge            | `BookOpen`       | No                  |

**Active Item Styling**:

- Background: `bg-sidebar-accent`
- Text color: `text-sidebar-accent-foreground` (teal)
- Left indicator: 3px wide vertical gradient bar (`from-forskale-green via-forskale-teal to-forskale-blue`)
- Subtle box shadow for depth

**Inactive Item Styling**:

- Text: `text-muted-foreground`
- Hover: teal-tinted background (`forskale-teal/10`), text brightens

**On Click (any nav item)**: Currently navigates to `href="#"` — no-op. In production, each should route to its respective page.

**Collapsed Behavior**: Only icons shown, text labels hidden.

#### 4.6 Bottom Section

**Invite Teammate Button**:

- Icon: `UserPlus`
- Text: "Invite teammate" — hidden when collapsed
- On Click: No action (placeholder)

**User Profile Card**:

- Avatar: 32×32px circle with gradient background, displays letter "R"
- Name: "Andrea Marino"
- Email: "andrea@forskale.com"
- When collapsed: Only avatar shown, centered

---

## 5. Performance Page

**File**: `src/pages/Performance.tsx`  
**State**:

- `activeTab: string` (default: `'Sales Playbook'`)
- `activeMetric: string` (default: `''`)

### 5.1 Page Header

**Left Side**:

- Title: "Performance across calls" (`text-2xl font-bold`)
- Description: Dynamic text that changes based on `activeTab` (see `tabDescriptions` object below)

**Right Side — Date Filter Button**:

- Icon: `Calendar` (teal colored)
- Text: "Last week"
- Trailing icon: `ChevronDown`
- On Click: **No action currently** — placeholder for a date range picker

### 5.2 Tab Navigation

Three tabs rendered as a horizontal nav with bottom border:

| Tab                | Description Text                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Sales Playbook     | "The graph below measures your playbook performance for each call, over time. Click a metric card to change the graph." |
| Speaking Skills    | "The graph below measures speaking skills for each call, over time. Click a metric card to change the graph."           |
| Objection Handling | "Below is a list of the questions and objections you've been asked most often across your calls, grouped by topic."     |

**Active Tab Styling**:

- Text: `text-foreground` (full contrast)
- Bottom indicator: 2px gradient bar (`from-forskale-green to-forskale-teal`) with teal glow shadow

**Inactive Tab Styling**:

- Text: `text-muted-foreground/60` (very subtle)
- Hover: slightly brighter

**On Click (tab)**:

1. Sets `activeTab` to clicked tab name
2. Resets `activeMetric` to `''` (so the first metric in the new tab becomes active by default)
3. Page content below tabs changes based on which tab is active

---

### 5.3 Tab Content — Sales Playbook (default)

Layout: Two-column flex — metric cards on left, chart on right.

#### 5.3a Metric Cards (Left Column, `w-36`)

Vertical stack of 6 cards:

| #   | Title              | Value | Subtext |
| --- | ------------------ | ----- | ------- |
| 1   | Overall            | 0%    | Avg.    |
| 2   | Handled objections | 0%    | Avg.    |
| 3   | Personalized demo  | 0%    | Avg.    |
| 4   | Intro Banter       | 0%    | Avg.    |
| 5   | Set Agenda         | 0%    | Avg.    |
| 6   | Demo told a story  | 0%    | Avg.    |

**Each MetricCard Component**:

- **Layout**: Vertical flex, `rounded-xl`, glass-morphism style
- **Info icon**: Small `Info` icon next to title — decorative only, no tooltip yet
- **Progress bar**: At bottom — full width gradient when active, expands to 25% on hover when inactive
- **Active state**: Teal border glow, value text shows gradient color, progress bar fully filled
- **Inactive state**: Subtle border, muted value text, empty progress bar
- **On Click**: Sets `activeMetric` to this card's title → chart title updates, card becomes "active"

**Default Selection Logic**: If `activeMetric` is empty or doesn't match any metric in the current tab, the **first metric** is auto-selected.

#### 5.3b Chart Panel (Right Column, `flex-1`)

**Container**: `rounded-3xl`, glass border, heavy backdrop blur, `shadow-2xl`

**Chart Header**:

- Small teal gradient checkbox icon
- Title: Dynamic based on `activeTab`:
  - Sales Playbook → "Average % of playbook completed across calls (last 5 days)"
  - Speaking Skills → "Words per minute across calls"

**Chart (Recharts AreaChart)**:

- Height: 400px
- Data points (static mock):
  ```
  Mar 4: 0, Mar 5: 0, Mar 6: 0, Mar 7: 0, Mar 8: 0
  ```
- Area fill: Teal gradient (20% opacity → 0%)
- Stroke: Solid teal, 2px
- Grid: Dashed horizontal lines only (dark blue)
- X-axis: Date labels, no axis line
- Y-axis: Percentage format (`0%`), no axis line

**Action Buttons (below chart)**:
Three buttons aligned right:

1. **Filter** (`Filter` icon) — No action
2. **Download** (`Download` icon) — No action
3. **Add** (`Plus` icon, gradient background) — No action

All are placeholders for future functionality.

---

### 5.4 Tab Content — Speaking Skills

Same two-column layout as Sales Playbook, but:

#### Metric Cards (5 cards):

| #   | Title                      | Value | Subtext   |
| --- | -------------------------- | ----- | --------- |
| 1   | Speech pace                | 0     | wpm Avg.  |
| 2   | Talk ratio                 | 0%    | Avg.      |
| 3   | Longest customer monologue | 0     | sec. Avg. |
| 4   | Questions asked            | 0     | Avg.      |
| 5   | Filler words               | 0     | Avg.      |

#### Chart Panel — Empty State

Instead of showing the chart, displays:

- `TrendingUp` icon (40×40px, teal)
- Title: "No speaking metrics yet"
- Description: "Analyze feedback in Calls to see Speech pace, Talk ratio, and more here."

**Note**: The empty state is hardcoded (`showEmptyState = activeTab === 'Speaking Skills'`). In production, this should be driven by whether data exists.

---

### 5.5 Tab Content — Objection Handling

Completely different layout — **no metric cards or chart**.

#### Header Row

- Left: Uppercase label "% of calls in which prospects raised questions about each topic"
- Right: "Analyze last 5 days" button with sparkle icon — **No action** (placeholder for AI analysis)

#### Topic List

Two items (static mock data):

| Topic           | Percentage | Calls | Questions |
| --------------- | ---------- | ----- | --------- |
| Other questions | 100%       | 2     | 13        |
| Pricing and ROI | 50%        | 1     | 2         |

Each row:

- **Layout**: Horizontal flex, `rounded-xl`, glass background
- **Left**: Green percentage badge + topic name
- **Right**: "{n} calls · {n} questions" + `ChevronDown` icon
- **On Click (ChevronDown)**: **No action** — placeholder for expanding to show individual questions
- **Hover**: Background slightly brightens

---

## 6. Design System & Theming

### Color Tokens (HSL format, defined in `index.css`)

All colors use CSS custom properties with HSL values. Tailwind maps them via `tailwind.config.ts`.

#### Core Tokens

| Token                | Light Mode      | Dark Mode       | Purpose            |
| -------------------- | --------------- | --------------- | ------------------ |
| `--background`       | `0 0% 100%`     | `224 100% 10%`  | Page bg            |
| `--foreground`       | `224 30% 15%`   | `0 0% 100%`     | Primary text       |
| `--primary`          | `174 56% 45%`   | `174 56% 55%`   | Brand teal         |
| `--secondary`        | `220 20% 95%`   | `224 60% 15%`   | Secondary surfaces |
| `--muted-foreground` | `215 16% 47%`   | `215 20% 65%`   | Subtle text        |
| `--border`           | `220 13% 88%`   | `224 30% 20%`   | Borders            |
| `--destructive`      | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Errors             |

#### Brand Palette

| Token              | Value         | Usage        |
| ------------------ | ------------- | ------------ |
| `--forskale-green` | `97 72% 48%`  | Accent green |
| `--forskale-teal`  | `174 56% 45%` | Primary teal |
| `--forskale-blue`  | `213 88% 31%` | Deep blue    |

#### Sidebar Tokens

| Token                         | Value               |
| ----------------------------- | ------------------- |
| `--sidebar-background`        | `224 100% 10%`      |
| `--sidebar-foreground`        | `200 33% 93%`       |
| `--sidebar-accent`            | `224 60% 15%`       |
| `--sidebar-accent-foreground` | `174 56% 55%`       |
| `--sidebar-border`            | `174 56% 55% / 0.1` |

### Typography

| Role            | Font Stack                          |
| --------------- | ----------------------------------- |
| Display/Heading | Plus Jakarta Sans, Inter, system-ui |
| Body            | Inter, system-ui                    |

### Border Radius

Base `--radius`: `0.75rem` (12px)

---

## 7. Data Structures (Static / Mock)

All data is currently hardcoded. Below are the exact structures for backend API design.

### Chart Data

```typescript
type ChartDataPoint = {
  name: string;   // e.g. "Mar 4"
  value: number;  // e.g. 0, 75, 100
};
// Array of 5 data points for "last 5 days"
```

### Tab Metrics

```typescript
type Metric = {
  title: string;   // "Overall", "Speech pace", etc.
  value: string;   // "0%", "0", "142"
  subtext: string;  // "Avg.", "wpm Avg.", "sec. Avg."
};
// Keyed by tab name: Record<string, Metric[]>
```

### Objection Topics

```typescript
type ObjectionTopic = {
  topic: string;       // "Pricing and ROI"
  percentage: number;  // 0-100
  calls: number;       // number of calls
  questions: number;   // total questions in topic
};
```

### Navigation Items

```typescript
type NavItem = {
  name: string;     // display label
  icon: LucideIcon; // icon component
  active: boolean;  // currently active page
};
```

### User Profile

```typescript
type UserProfile = {
  initials: string;  // "A"
  name: string;      // "Andrea Marino"
  email: string;     // "andrea@forskale.com"
};
```

---

## 8. Interaction Map — Click-by-Click

### Sidebar Interactions

| Element                | Action | What Happens                                                                              | State Change        |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- | ------------------- |
| Collapse toggle button | Click  | Sidebar width transitions from 240px ↔ 72px. Text labels hide/show. Icons remain visible. | `collapsed` toggles |
| Record button          | Click  | **Nothing** (future: start recording a call)                                              | None                |
| Nav item (any)         | Click  | **Nothing** (future: navigate to page, set as active)                                     | None                |
| Invite teammate        | Click  | **Nothing** (future: open invite modal/flow)                                              | None                |
| User profile card      | Click  | **Nothing** (future: open profile menu)                                                   | None                |

### Performance Page Interactions

| Element                          | Action      | What Happens                                                                                                                  | State Change                                            |
| -------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Date filter button ("Last week") | Click       | **Nothing** (future: open date range picker popover)                                                                          | None                                                    |
| Tab ("Sales Playbook")           | Click       | Tab highlights, description updates, metric cards & chart show for Sales Playbook                                             | `activeTab = 'Sales Playbook'`, `activeMetric = ''`     |
| Tab ("Speaking Skills")          | Click       | Tab highlights, description updates, metric cards show, chart shows empty state                                               | `activeTab = 'Speaking Skills'`, `activeMetric = ''`    |
| Tab ("Objection Handling")       | Click       | Tab highlights, description updates, entire content area switches to objection topic list                                     | `activeTab = 'Objection Handling'`, `activeMetric = ''` |
| Metric card (any)                | Click       | Card becomes "active" (teal glow, gradient text, full progress bar). Previously active card deactivates. Chart title updates. | `activeMetric = card.title`                             |
| Info icon (on metric card)       | Hover       | **Nothing** (future: show tooltip with metric explanation)                                                                    | None                                                    |
| Filter button (below chart)      | Click       | **Nothing** (future: open filter popover)                                                                                     | None                                                    |
| Download button (below chart)    | Click       | **Nothing** (future: download chart as image/CSV)                                                                             | None                                                    |
| Plus button (below chart)        | Click       | **Nothing** (future: add custom metric/annotation)                                                                            | None                                                    |
| "Analyze last 5 days" button     | Click       | **Nothing** (future: trigger AI analysis of objections)                                                                       | None                                                    |
| Objection topic row              | Click/Hover | Row background brightens on hover. **No expand action** (future: expand to show individual questions)                         | None                                                    |
| ChevronDown on topic row         | Click       | **Nothing** (future: expand/collapse topic details)                                                                           | None                                                    |

---

## 9. State Management

### Component-Level State (React useState)

| Component     | State Variable | Type      | Default            | Purpose                          |
| ------------- | -------------- | --------- | ------------------ | -------------------------------- |
| `AppSidebar`  | `collapsed`    | `boolean` | `false`            | Controls sidebar width           |
| `Performance` | `activeTab`    | `string`  | `'Sales Playbook'` | Which tab content to show        |
| `Performance` | `activeMetric` | `string`  | `''`               | Which metric card is highlighted |

### Derived/Computed Values

| Variable                | Logic                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | --- | -------------------------------------- |
| `metrics`               | `tabMetrics[activeTab]                                                                                       |     | []` — get metric array for current tab |
| `activeMetricResolved`  | If `activeMetric` matches a metric title in current tab, use it; otherwise fall back to first metric's title |
| `showEmptyState`        | `activeTab === 'Speaking Skills'` — hardcoded, should be data-driven                                         |
| `showObjectionHandling` | `activeTab === 'Objection Handling'`                                                                         |

### No Global State

- No Redux, Zustand, or Context API is used
- TanStack React Query is initialized but not yet used (ready for API integration)
- No localStorage or sessionStorage is used

---

## 10. Future Backend Integration Points

These are the features that currently have no functionality and will need backend APIs:

### 10.1 Authentication & User Management

- **User profile**: Currently hardcoded "Andrea Marino / andrea@forskale.com"
- **Invite teammate**: Needs invitation flow (email, role assignment)
- **Login/signup**: No auth system exists yet

### 10.2 Call Recording & Analysis

- **Record button**: Needs audio/video capture → transcription → analysis pipeline
- **Meeting Intelligence page**: Not implemented
- **Call Insights page**: Not implemented

### 10.3 Performance Data APIs

**Suggested Endpoints**:

```
GET /api/performance/metrics?tab={sales_playbook|speaking_skills}&date_range={start,end}
→ Returns: Metric[] (title, value, subtext for each metric)

GET /api/performance/chart?metric={metric_title}&date_range={start,end}
→ Returns: ChartDataPoint[] (name: date string, value: number)

GET /api/performance/objections?date_range={start,end}
→ Returns: ObjectionTopic[] (topic, percentage, calls, questions)

GET /api/performance/objections/{topic_id}/questions
→ Returns: Question[] (for expanding topic rows)

POST /api/performance/analyze
→ Triggers AI analysis of objection patterns
→ Body: { date_range: { start, end } }
```

### 10.4 Data Export

- **Download button**: Export chart data as CSV or chart as PNG
- **Filter button**: Apply filters to chart data (by rep, team, call type, etc.)

### 10.5 Knowledge & Q&A

- **Knowledge page**: Not implemented — likely a content/document management system
- **Q&A Engine page**: Not implemented — likely AI-powered search over call transcripts
- **Action Ready page**: Not implemented — likely action items extracted from calls

### 10.6 Date Range Filtering

- The "Last week" button needs a date picker (popover with calendar)
- Selected range should propagate to all data fetching on the page

---

## Appendix: File Map

```
src/
├── App.tsx                          # Root: providers + routing
├── main.tsx                         # Entry point
├── index.css                        # Design tokens (CSS custom properties)
├── pages/
│   ├── Index.tsx                    # Layout: sidebar + performance
│   ├── Performance.tsx              # Main dashboard page
│   └── NotFound.tsx                 # 404 page
├── components/
│   ├── AppSidebar.tsx               # Sidebar navigation
│   └── atlas/
│       ├── AppLayout.tsx            # Alternative layout wrapper (unused in Index)
│       └── Sidebar.tsx              # Alternative sidebar (unused in Index)
├── assets/
│   ├── forskale-logo.png            # Original logo
│   └── forskale-logo-2.png          # Updated logo
└── design-tokens.md                 # Design token documentation
```

---

_End of specification. This document should be sufficient for a backend developer to understand every visual element, interaction, state change, and data requirement of the ForSkale frontend._
