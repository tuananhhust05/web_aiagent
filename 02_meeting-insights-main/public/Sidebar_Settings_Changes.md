# Sidebar Settings – Change Log

## Overview

The **Settings** item in the left navigation sidebar uses a hover-triggered submenu (rendered via React Portal) to expose configuration-related pages. Below is a summary of the current settings sub-items and all changes made during development.

---

## Current Settings Sub-Items

| # | Label               | Icon         | Navigation Type       | Destination                          |
|---|---------------------|--------------|-----------------------|--------------------------------------|
| 1 | **Knowledge**       | `BookOpen`   | External link (`href`) | Knowledge base app (opens in new tab) |
| 2 | **Record**          | `RecordIcon` | None (placeholder)     | –                                    |
| 3 | **Meeting Templates** | `FileText` | Internal route (`route`) | `/meeting-templates`               |

---

## Submenu Behavior

- **Trigger**: Hover over the "Settings" nav item.
- **Implementation**: Portal-based floating submenu positioned to the right of the Settings button.
- **Hide delay**: 200 ms timeout to allow cursor movement from the button to the submenu.
- **Keyboard support**: `Enter`/`Space` toggles, `Escape` closes.
- **Active state**: If any sub-item's route matches the current page, the parent Settings button shows the active gradient style.
- **Visual style**: Dark border matching the page theme, with individual borders within each submenu button. No glow effect.

---

## Changes Made

### 1. Settings Submenu – Portal-Based Hover Menu
- Replaced inline dropdown with a **React `createPortal`** approach so the submenu renders at `document.body` level, avoiding `overflow: hidden` clipping from the sidebar.
- Position is calculated from the Settings button's `getBoundingClientRect()` and offset 8 px to the right.
- A `hideTimeoutRef` (200 ms) prevents flicker when moving the cursor between the button and the submenu.

### 2. Sub-Item: Knowledge (External Link)
- Added the **Knowledge** sub-item with a `BookOpen` icon.
- Navigates to an external Knowledge base app via `href` (opens in a new tab with `target="_blank"`).

### 3. Sub-Item: Record (Placeholder)
- Added the **Record** sub-item with a custom `RecordIcon` (SVG circle with a red filled dot).
- Currently a placeholder with no navigation action.

### 4. Sub-Item: Meeting Templates (Internal Route)
- Added the **Meeting Templates** sub-item with a `FileText` icon.
- Uses `react-router-dom`'s `useNavigate` to route to `/meeting-templates`.
- Closes the submenu on click.

### 5. Active State Detection for Settings
- The Settings button checks all `settingsSubItems` to determine if any child is active (`isSettingsActive`).
- If active, it renders the full brand gradient background (`from-forskale-green via-forskale-teal to-forskale-blue`).

### 6. Visual Polish (Updated)
- Submenu card uses `bg-card` with a dark `border-border` matching the page theme.
- Each submenu button has individual borders for visual separation.
- Removed previous glow/blur effects for a cleaner look.
- Entry animation: `animate-scale-in` with staggered `animationDelay` (`idx * 50ms`).

---

## Full Sidebar Navigation Order

| # | Label                | Icon          | Behavior                                |
|---|----------------------|---------------|-----------------------------------------|
| 1 | **Meeting Intelligence** | `Brain`    | Active state indicator (current page)   |
| 2 | **Meeting Insight**  | `BarChart2`   | Route to `/call-insights`               |
| 3 | **Strategy**         | `Target`      | Opens "Coming Soon" modal (no route)    |
| 4 | **Action Ready**     | `Zap`         | External link placeholder               |
| 5 | **QnA Engine**       | `MessageSquare` | External link placeholder             |
| 6 | **Performance**      | `TrendingUp`  | External link placeholder               |
| 7 | **Settings** (hover) | `Settings`    | Hover submenu with Knowledge, Record, Meeting Templates |

---

## File Reference

- **Component**: `src/components/call-insights/AppNavSidebar.tsx`
- **Strategy Modal**: `src/components/call-insights/StrategyModal.tsx`
