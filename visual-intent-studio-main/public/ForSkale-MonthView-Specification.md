# ForSkale – Month View: Technical Specification

> **Purpose**: Documents the current implementation of the Month View calendar component, its data model, grid generation logic, visual design, and interaction patterns.  
> **Last Updated**: March 13, 2026

---

## 1. Overview

The Month View is one of two calendar display modes (alongside the Week View) in the Meeting Intelligence page. It renders a mathematically precise 6-week grid (42 cells) for any given month, with dynamic date calculation, event indicators, hover tooltips, a slide-in Day Detail Panel, and ForSkale's signature premium styling.

**Source File**: `src/components/atlas/CalendarView.tsx`

---

## 2. Data Model

### 2.1 Meeting Interface

```typescript
interface Meeting {
  id: string;
  title: string;
  time: string;        // e.g. "1:00 PM - 2:00 PM"
  startHour: number;   // 24h format, e.g. 13
  duration: number;    // in hours, e.g. 1.5
  dayIndex: number;    // abstract index used for mapping
  type?: "discovery" | "renewal" | "internal";
}
```

### 2.2 CalendarDay Interface

```typescript
interface CalendarDay {
  date: number;                                    // Day of month (1-31)
  monthOffset: 'previous' | 'current' | 'next';   // Which month this day belongs to
  isCurrentMonth: boolean;                         // Quick boolean for styling
  isToday: boolean;                                // Matches the hard-coded "today" date
  fullDate: Date;                                  // Full JS Date object
  dayIndex: number;                                // Sequential index in the 42-cell grid (0-41)
}
```

### 2.3 Meeting-to-Date Mapping

Meetings use an abstract `dayIndex` that maps to specific March 2026 dates via `MEETING_DATE_MAP`:

```typescript
const MEETING_DATE_MAP: Record<number, number> = {
  0: 2,   1: 3,   2: 4,   3: 5,   4: 6,
  8: 10,  10: 12, 12: 14, 15: 17, 17: 19,
  19: 21, 22: 24, 24: 26, 26: 28,
};
```

**Lookup function**:
```typescript
function getMeetingsForDate(fullDate: Date): Meeting[] {
  const dateNum = fullDate.getDate();
  const month = fullDate.getMonth();
  if (month !== 2) return []; // Only March has meetings
  return MOCK_MEETINGS.filter(m => MEETING_DATE_MAP[m.dayIndex] === dateNum);
}
```

### 2.4 Mock Meetings (16 total)

| ID | Title | Time | Date (March) | Type |
|----|-------|------|-------------|------|
| 1 | Lavazza A Modo Mio — Discussion and Pricing Review | 1:00–2:00 PM | 2nd | renewal |
| 2 | Nova Consulting — Discovery Call | 10:00–11:00 AM | 3rd | discovery |
| 3 | Barilla Group — Product Demo | 2:00–3:30 PM | 4th | discovery |
| 4 | Ferrero SpA — Contract Negotiation | 11:00 AM–12:00 PM | 5th | internal |
| 5 | Pirelli — Q1 Strategy Sync | 3:00–4:00 PM | 6th | renewal |
| 6 | Marco Verdi — Freelance Consultation | 9:00–10:00 AM | 6th | discovery |
| 7 | UniCredit — Annual Review | 9:30–10:30 AM | 10th | renewal |
| 8 | Campari Group — Brand Strategy | 2:00–3:00 PM | 12th | discovery |
| 9 | Prada — Partnership Call | 11:00 AM–12:00 PM | 14th | discovery |
| 10 | Enel — Sustainability Sync | 3:00–4:00 PM | 17th | internal |
| 11 | Generali — Q1 Pipeline | 10:00–11:00 AM | 19th | renewal |
| 12 | Luxottica — Lens Innovation | 1:00–2:00 PM | 21st | discovery |
| 13 | Team Standup | 9:00–9:30 AM | 3rd | internal |
| 14 | Benetton — Retail Expansion | 4:00–5:00 PM | 24th | renewal |
| 15 | Illy Coffee — New Markets | 11:00 AM–12:00 PM | 26th | discovery |
| 16 | Maserati — Fleet Deal | 2:00–3:30 PM | 28th | renewal |

---

## 3. Grid Generation Algorithm

### 3.1 Core Function: `generateCalendarGrid(year, month, todayDate)`

Returns an array of exactly **42 `CalendarDay` objects** (6 rows × 7 columns, Monday-first).

**Steps**:
1. Calculate days in current month: `new Date(year, month + 1, 0).getDate()`
2. Calculate days in previous month (for trailing fill)
3. Get first day of month (converted from Sunday-first to Monday-first): `day === 0 ? 6 : day - 1`
4. Fill previous-month trailing days (right-to-left from end of previous month)
5. Fill all current-month days (1 through `daysInCurrentMonth`)
6. Fill next-month leading days (to reach 42 total cells)

### 3.2 March 2026 Specifics

| Property | Value |
|----------|-------|
| Days in February 2026 | 28 (non-leap year) |
| Days in March 2026 | 31 |
| March 1 falls on | Sunday → Monday-first index = 6 |
| Previous month fill | Feb 23–28 (6 cells) |
| Next month fill | Apr 1–5 (5 cells) |
| Today marker | March 13, 2026 |

### 3.3 Constants

```typescript
const DISPLAY_YEAR = 2026;
const DISPLAY_MONTH = 2;  // 0-indexed: 2 = March
const TODAY = new Date(2026, 2, 13);
```

---

## 4. Visual Design

### 4.1 Grid Layout

- **Container**: `grid grid-cols-7` for the 7-day columns
- **Rows**: `grid-rows-6` for 6 weeks
- **Cell minimum height**: `min-h-[100px]`
- **Day header row**: Sticky (`sticky top-0 z-10`), shows Mon–Sun in `text-[11px] font-semibold uppercase tracking-widest`

### 4.2 Day Cell Styling

| State | Background | Text | Border/Shadow |
|-------|-----------|------|--------------|
| **Today** | `bg-gradient-to-br from-forskale-green/[0.08] via-forskale-teal/[0.06] to-forskale-blue/[0.04]` | Bold white on gradient circle | `shadow-[inset_0_0_0_1px_hsl(var(--forskale-green)/0.2)]` |
| **Current month** | `bg-card` | `font-semibold text-foreground` | Hover: `-translate-y-[1px]`, `shadow-[0_8px_25px_rgba(0,0,0,0.06)]` |
| **Other month** | `bg-muted/30` | `font-normal text-muted-foreground` | None |

### 4.3 Today Indicator

The today date number is displayed inside a **gradient circle**:
```
h-7 w-7 rounded-full
bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue
font-bold text-white
shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)]
animate-[pulse-glow_2s_ease-in-out_infinite_alternate]
```

Plus a bottom accent line:
```
h-[2px] w-8 rounded-full
bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue
```

### 4.4 Event Dots

- Max 3 dots shown per cell, each `h-[6px] w-[6px] rounded-full`
- Overflow shown as a pill badge: `+N` in gradient
- Color by meeting type:
  - `discovery` → `bg-forskale-teal`
  - `renewal` → `bg-forskale-green`
  - `internal` → `bg-cal-cyan`
- Hover animation: `scale-125` with glow shadow

### 4.5 Event Count Badge

Appears on hover (top-right of cell):
```
h-4 min-w-[16px] rounded-full
bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue
text-[9px] font-bold text-white
opacity-0 → group-hover:opacity-100
```

---

## 5. Interaction Patterns

### 5.1 Hover → Event Tooltip

**Trigger**: Mouse enters a day cell that has events (current month only).

**Component**: `EventTooltip`
- Position: `absolute bottom-full left-1/2 -translate-x-1/2`
- Background: `bg-card/95 backdrop-blur-xl`
- Border: `border-forskale-teal/30`
- Shadow: `shadow-xl`
- Animation: `animate-[tooltip-appear_200ms_ease-out]`
- Content: List of meetings with colored dots, truncated title, and time

**Dismiss**: Mouse leaves cell or clicks outside.

### 5.2 Click → Day Detail Panel

**Trigger**: Click any day cell.

**Component**: `DayDetailPanel`
- Slides in from right: `animate-[slide-in-right_300ms_cubic-bezier(0.4,0,0.2,1)]`
- Width: `w-[380px]`, full height
- Background: `bg-card/95 backdrop-blur-xl`
- Header shows formatted date (e.g., "Mar 13, 2026")
- Close button: circular with border, hover highlights to teal

**Content when meetings exist**:
- Meeting count label
- Cards for each meeting with:
  - Colored dot (by type)
  - Title (split on "—": company name + subtitle)
  - Time with Clock icon
  - Type badge (colored pill)
- Hover: `-translate-y-0.5`, border glow, shadow

**Content when empty**:
- Clock icon in muted circle
- "No meetings scheduled" / "This day is wide open"

**Click a meeting card** → triggers `onMeetingClick` → opens Contact Card.

### 5.3 View Toggle

Header contains tab-style toggle between "week" and "month":
```
Active:  bg-primary text-primary-foreground shadow-sm
Inactive: text-muted-foreground hover:text-foreground
```

### 5.4 Date Navigation

- Left/right chevrons for week/month navigation (visual only in current mock)
- Date range label: "Mar 2–8, 2026" (week) or "March 2026" (month)

---

## 6. Component Architecture

```
CalendarView (main export)
├── view === "week" → Week Grid (inline)
│   └── Meeting blocks (clickable)
└── view === "month" → MonthGridView
    ├── Day Headers (Mon–Sun)
    ├── Weeks Grid (6 rows × 7 cols)
    │   └── Day Cells
    │       ├── Day Number (with today gradient)
    │       ├── Event Dots (max 3 + overflow)
    │       └── EventTooltip (on hover)
    └── DayDetailPanel (on click, slide-in)
        └── Meeting Cards (clickable → ContactCard)
```

---

## 7. CSS Design Tokens Used

| Token | CSS Variable | Usage |
|-------|-------------|-------|
| ForSkale Green | `--forskale-green: 97 72% 48%` | Today glow, event dots (renewal), gradients |
| ForSkale Teal | `--forskale-teal: 174 56% 55%` | Event dots (discovery), hover states, borders |
| ForSkale Blue | `--forskale-blue: 213 88% 31%` | Gradient endpoints |
| Cal Cyan | `--cal-cyan: 197 80% 65%` | Internal meeting dots |
| Foreground | `--foreground` | Current month text |
| Muted Foreground | `--muted-foreground` | Other month text, labels |
| Card | `--card` | Cell backgrounds |
| Border | `--border` | Grid lines |

---

## 8. Animations

| Animation | Keyframes | Usage |
|-----------|-----------|-------|
| `pulse-glow` | Alternates shadow opacity 0.3 ↔ 0.5 | Today date circle |
| `tooltip-appear` | `opacity: 0 → 1`, `translateY: 4px → 0` | Event tooltip entrance |
| `slide-in-right` | `translateX: 100% → 0` | Day Detail Panel |

---

## 9. Backend Integration Requirements

For production, the backend must provide:

### 9.1 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/calendar/meetings?year=2026&month=3` | GET | Fetch all meetings for a given month |
| `GET /api/calendar/meetings/:id` | GET | Fetch single meeting details |
| `POST /api/calendar/sync` | POST | Trigger calendar sync with Google Calendar |

### 9.2 Meeting Response Schema

```json
{
  "id": "uuid",
  "title": "Company Name — Meeting Purpose",
  "startTime": "2026-03-02T13:00:00Z",
  "endTime": "2026-03-02T14:00:00Z",
  "type": "discovery | renewal | internal",
  "participants": [...],
  "googleMeetLink": "https://meet.google.com/...",
  "calendarId": "primary"
}
```

### 9.3 Key Considerations

- The frontend currently uses `MOCK_MEETINGS` with a `MEETING_DATE_MAP` — replace with API calls
- `getMeetingsForDate(fullDate)` should query by date range from the API
- `generateCalendarGrid()` is purely client-side math and needs no backend support
- The `TODAY` constant should be replaced with `new Date()` for production
- View toggle state and selected day are client-only state

---

## 10. Future Enhancements

- Dynamic month navigation (currently displays March 2026 only)
- Drag-to-create meeting blocks
- Multi-day event spanning
- Week number column
- Mini-calendar for quick date jumping
- Real-time sync via WebSocket for calendar updates
