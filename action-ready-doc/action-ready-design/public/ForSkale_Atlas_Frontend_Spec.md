# ForSkale Atlas — Frontend Architecture & Interaction Specification

> **Purpose**: This document describes every component, data model, user interaction, state flow, and visual behavior of the ForSkale Atlas "Action Ready" dashboard. A backend developer reading this should be able to fully understand the frontend logic and re-implement it on any platform.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Page Layout & Component Tree](#2-page-layout--component-tree)
3. [Data Models & Types](#3-data-models--types)
4. [State Management (ActionsContext)](#4-state-management-actionscontext)
5. [Component Deep Dives](#5-component-deep-dives)
   - 5.1 [AtlasSidebar](#51-atlassidebar)
   - 5.2 [StrategyComingSoonModal](#52-strategycomingsoonmodal)
   - 5.3 [DashboardTopBar](#53-dashboardtopbar)
   - 5.4 [ActionReadyHeader](#54-actionreadyheader)
   - 5.5 [ActionFilterSidebar](#55-actionfiltersidebar)
   - 5.6 [ActionReadyContent](#56-actionreadycontent)
   - 5.7 [ActionCard (Container)](#57-actioncard-container)
   - 5.8 [ActionCardFront (Compact View)](#58-actioncardfront-compact-view)
   - 5.9 [ActionCardExpanded (Modal Detail View)](#59-actioncardexpanded-modal-detail-view)
   - 5.10 [NeurosciencePrinciples](#510-neuroscienceprinciples)
   - 5.11 [InteractionSummary](#511-interactionsummary)
   - 5.12 [GmailRichTextEditor](#512-gmailrichtexteditor)
   - 5.13 [ToneSelector & ToneBadge](#513-toneselector--tonebadge)
   - 5.14 [UnsavedChangesDialog](#514-unsavedchangesdialog)
6. [User Interaction Flows](#6-user-interaction-flows)
7. [Mock Data Reference](#7-mock-data-reference)
8. [Visual Design Tokens](#8-visual-design-tokens)
9. [API Contract Recommendations](#9-api-contract-recommendations)

---

## 1. Application Overview

**ForSkale Atlas** is a sales enablement dashboard that surfaces AI-generated follow-up actions for sales reps. The primary view is called **"Action Ready"** — an execution queue where each card represents one pending sales task (email reply, call follow-up, demo scheduling, or resource sharing).

### Core Concept
- Actions are presented as **compact cards** in a grid layout.
- Clicking a card opens a **premium centered modal** (glassmorphism, backdrop blur) displaying the full AI analysis and generated draft.
- The modal acts as a **focused execution workspace** — not a small card flip, but a dedicated action review screen.
- Users can review AI-generated drafts in multiple tones (Formal, Professional, Conversational), then **send**, **edit**, **save draft**, or mark as **completed**.
- Cards are filtered by status: **Needs Review**, **Overdue** (>5 days), or **Completed**.
- Cards can be further filtered by **category** and **channel** (Email, Meeting).

### Tech Stack
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom HSL-based design tokens
- **React Router** (single page at `/`)
- **TanStack React Query** (available but not yet used for data fetching)
- **shadcn/ui** component library
- **Radix UI Dialog** for modal interaction
- **i18n** via custom LanguageContext (EN/IT)

---

## 2. Page Layout & Component Tree

```
<LanguageProvider>                   ← i18n context (EN/IT)
  <ActionsProvider>                  ← Global state (context)
    <div className="flex h-screen overflow-hidden">
      ├── <AtlasSidebar />           ← Left nav (collapsible, 240px / 72px)
      └── <div className="flex-1 flex flex-col">
            ├── <DashboardTopBar />  ← Top utility bar
            ├── <ActionReadyHeader />← Sticky header (search, filters, channel dropdown)
            └── <div className="flex flex-1 overflow-hidden">
                  ├── <ActionFilterSidebar />  ← Filter rail (250px / 60px)
                  └── <ActionReadyContent />   ← Scrollable card grid
                </div>
          </div>
    </div>
  </ActionsProvider>
</LanguageProvider>
```

### Layout Behavior
| Breakpoint | AtlasSidebar | FilterSidebar | Content |
|------------|--------------|---------------|---------|
| < 1024px (mobile) | Hidden | Horizontal bar above content | Full width |
| ≥ 1024px (desktop) | Visible (240px expanded / 72px collapsed) | Vertical rail (250px / 60px) | Remaining space |

### Scrolling Behavior
- The root container is `h-screen overflow-hidden` — no page-level scroll.
- The **header** is `sticky top-0 z-20 shrink-0` — always visible.
- Only the **ActionReadyContent** area scrolls (`flex-1 overflow-y-auto`).
- The sidebar and filter rail remain fixed in place.

---

## 3. Data Models & Types

### 3.1 ActionCardData (Primary Entity)

```typescript
interface ActionCardData {
  id: string;
  type: ActionType;                    // "email_response" | "call_followup" | "schedule_demo" | "send_resources"
  title: string;
  prospect: string;                    // Company name
  sentiment: SentimentBadge;
  triggeredFrom: Channel;              // "Email" | "Meeting"
  dueLabel: string;                    // "Due today", "6 days overdue", etc.
  isOverdue?: boolean;
  status: TaskStatus;                  // "needs_review" | "overdue" | "completed"
  category: SentimentBadge;            // Used for category filtering
  strategicStep?: string;
  objective?: string;
  keyTopics?: string[];
  whyThisStep?: string;
  draftContent: string;                // Default AI-generated draft
  toneOptions?: string[];
  toneDrafts?: Partial<Record<"professional" | "formal" | "conversational", string>>;
  detectedTone?: "formal" | "professional" | "conversational";
  decisionFactors?: { label: string; value: string }[];
  alternativeOptions?: AlternativeOption[];
  interactionSummary?: string;
  interactionHistory?: InteractionHistoryItem[];
  neurosciencePrinciples?: NeurosciencePrinciple[];
}
```

### 3.2 Supporting Types

```typescript
type ActionType = "email_response" | "call_followup" | "schedule_demo" | "send_resources";
type SentimentBadge = "interested" | "not_interested" | "not_now" | "meeting_intent" | "forwarded" | "personal";
type Channel = "Email" | "Meeting";
type TaskStatus = "needs_review" | "overdue" | "completed";

interface NeurosciencePrinciple {
  title: string;
  explanation: string;
  highlightedPhrase: string;
}

interface AlternativeOption {
  label: string;
  confidence: number;  // 0-100 percentage
  actionType?: "email" | "call" | "meeting" | "whatsapp" | "proposal";
}

interface InteractionHistoryItem {
  type: "email" | "call" | "meeting";
  timeAgo: string;
  summary: string;
}

interface CategoryItem {
  key: SentimentBadge | "all";
  label: string;
  count: number;
}
```

### 3.3 Filter Types

```typescript
type FilterType = "needs_review" | "overdue" | "completed";
```

---

## 4. State Management (ActionsContext)

The entire application state is managed via a single React Context (`ActionsContext`).

### State Shape

```typescript
interface ActionsContextType {
  allActions: ActionCardData[];
  filteredActions: ActionCardData[];
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  activeCategory: SentimentBadge | "all";
  setActiveCategory: (cat: SentimentBadge | "all") => void;
  activeChannel: Channel | "all";
  setActiveChannel: (ch: Channel | "all") => void;
  resolveAction: (id: string) => void;
  clearFilters: () => void;
  counts: {
    total: number;
    needsReview: number;
    overdue: number;
    completed: number;
    filtered: number;
  };
  categoryCounts: { key: string; label: string; count: number }[];
}
```

### Derived Data Logic

```
Source data: mockActions[] (50 action cards across 6 categories)

allActions = mockActions with completedIds applied (status → "completed", isOverdue → false)

needsReviewActions = allActions where status !== "completed" AND isOverdue !== true
overdueActions     = allActions where isOverdue === true AND overdueDays > 5 AND status !== "completed"
completedActions   = allActions where status === "completed" OR id IN completedIds

baseByStatus =
  if activeFilter === "completed"    → completedActions
  if activeFilter === "overdue"      → overdueActions
  if activeFilter === "needs_review" → needsReviewActions

filteredActions = baseByStatus
  → filtered by activeCategory (if not "all")
  → filtered by activeChannel (if not "all")
```

### resolveAction Flow

```
User clicks "Mark Complete" button
  → resolveAction(cardId)
  → cardId added to completedIds Set
  → Card disappears from "Needs Review" / "Overdue"
  → Card appears in "Completed" queue (greyed out, 60% opacity)
```

---

## 5. Component Deep Dives

### 5.1 AtlasSidebar

**File**: `src/components/atlas/AtlasSidebar.tsx`
**Purpose**: Primary navigation sidebar for the Atlas application.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `collapsed` | `boolean` | `false` | Whether sidebar is minimized |
| `strategyModalOpen` | `boolean` | `false` | Whether the Strategy Coming Soon modal is open |

#### Navigation Items (8 items, in order)

| Icon | Label | Behavior |
|------|-------|----------|
| CalendarDays | Meeting Intelligence | External link |
| Video | Meeting Insight | External link |
| Target | Strategy | Opens "Coming Soon" modal |
| ClipboardCheck | Action Ready | **Active** (highlighted with gradient) |
| HelpCircle | QnA Engine | External link |
| BarChart3 | Performance | External link |
| BookOpen | Knowledge | External link |
| RecordIcon | Record | External link |

#### Width Values
- Expanded: `w-60` (240px)
- Collapsed: `w-[72px]`
- Hidden below `lg` breakpoint

---

### 5.2 StrategyComingSoonModal

**File**: `src/components/atlas/StrategyComingSoonModal.tsx`
**Purpose**: Modal dialog shown when clicking the "Strategy" navigation item.

- Gradient header with ForSkale branding
- Feature preview list
- "Got it" button to close
- Closes via X, backdrop click, or ESC

---

### 5.3 DashboardTopBar

**File**: `src/components/atlas/DashboardTopBar.tsx`
**Purpose**: Top utility bar above the action header.

---

### 5.4 ActionReadyHeader

**File**: `src/components/atlas/ActionReadyHeader.tsx`
**Purpose**: Sticky top header bar with page title, search, channel dropdown, and action buttons.

#### Layout (left to right)

**Left side:**
- Eyebrow: "ACTION READY" (uppercase, tracked)
- Title: "Execution flashcards for sales follow-up"
- Subtitle with task count when filters active

**Right side:**
- Search input
- Filters button
- Channel dropdown (All / Email / Meeting)
- Analyze New button
- Paste Email button (green gradient CTA)

#### Active Filter Pills
When category or channel filters are active, pills appear below with X buttons and "Clear all" link.

---

### 5.5 ActionFilterSidebar

**File**: `src/components/atlas/ActionFilterSidebar.tsx`
**Purpose**: Left filter rail to switch between status queues and categories.

#### Two Display Modes

**Expanded Mode** (250px):
- Three status filter cards: Needs Review, Overdue, Completed
- Categories list with count badges

**Collapsed Mode** (60px):
- Icon-only filter buttons

---

### 5.6 ActionReadyContent

**File**: `src/components/atlas/ActionReadyContent.tsx`
**Purpose**: Main scrollable content area displaying the action card grid.

- Queue header with icon, title, card count
- Card grid: `grid gap-4 lg:grid-cols-2`
- Empty state with contextual message

---

### 5.7 ActionCard (Container)

**File**: `src/components/atlas/ActionCard.tsx`
**Purpose**: Container component that manages the modal-based interaction between compact card and expanded detail view.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the detail modal is open |
| `selectedTone` | `string` | `"professional"` | Currently selected tone for draft |
| `resolving` | `boolean` | `false` | Animation state during resolve |

#### Modal Behavior
- Clicking the compact card opens a **Radix UI Dialog** modal
- Modal uses `max-h-[80vh]`, `max-w-[1100px]`, `backdrop-blur-2xl`
- Glassmorphism effect: `bg-card/80`, `border-border/40`, soft shadow
- Scale-in animation on open, scale-out on close
- Closes via X button, backdrop click, or ESC
- `DialogTitle` hidden with `VisuallyHidden` for accessibility

#### Resolve Animation
```
handleResolve() called
  → resolving = true (immediately)
  → Card gets: opacity-0, translate-y-3, pointer-events-none (300ms CSS transition)
  → After 320ms timeout: onResolve(id) fires → modal closes, card removed from pending list
```

---

### 5.8 ActionCardFront (Compact View)

**File**: `src/components/atlas/action-card/ActionCardFront.tsx`
**Purpose**: The compact card face shown in the grid.

#### Visual Structure

```
┌──────────────────────────────────────┐
│█ [TYPE BADGE] [OVERDUE badge]  [✓]  │  ← Priority bar + type + resolve icon
│  PROSPECT NAME                       │  ← Uppercase, 10px, muted
│  Card Title Text                     │  ← 14px, bold, max 30ch
│  Objective (italic)                  │  ← Optional objective text
│  ⏰ Due in 18h                       │  ← Clock icon + due label
│  [Email] channel badge               │  ← Channel source badge
│  ─────────────────────────────────   │  ← Border separator
│  [  ✓ Complete  ]                    │  ← Full-width button (only if not resolved)
└──────────────────────────────────────┘
```

#### Type Configuration
| ActionType | Icon | Label | Color Variable |
|------------|------|-------|----------------|
| email_response | Mail | "Email Response" | `--forskale-blue` |
| call_followup | Phone | "Call Follow-up" | `--forskale-green` |
| schedule_demo | Calendar | "Schedule Demo" | `--forskale-teal` |
| send_resources | Share2 | "Send Resources" | `--forskale-cyan` |

#### Interactions
| Action | Result |
|--------|--------|
| Click anywhere on card body | Opens modal with `ActionCardExpanded` |
| Click "Complete" button | Triggers resolve animation → card moves to completed queue |
| Hover (non-resolved) | Shows "Click to see" tooltip |

---

### 5.9 ActionCardExpanded (Modal Detail View)

**File**: `src/components/atlas/action-card/ActionCardExpanded.tsx`
**Purpose**: The full detail view inside the modal — a focused execution workspace with sticky header and scrollable body.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `showOptions` | `boolean` | `false` | Whether alternative options section is expanded |
| `draftHtml` | `string` | `""` | Current HTML content from the rich text editor |
| `isEditing` | `boolean` | `false` | Whether the user is actively editing the draft |
| `savedContent` | `string` | `""` | Last saved version of the draft (initialized from toneDraft) |
| `showUnsavedDialog` | `boolean` | `false` | Whether the unsaved changes confirmation is visible |

#### Layout Architecture
- **Sticky Header**: Title + objective pinned at the top with `sticky top-0 z-20`, semi-transparent `bg-card/95 backdrop-blur-sm`, border-bottom separator. Always visible during scroll.
- **Scrollable Body**: `flex-1 overflow-y-auto` container holding all content sections.
- **Bottom Bar**: Mark Complete button inside the scrollable area at the end.

#### Section Order (strict vertical hierarchy)

```
┌──────────────────────────────────────────────────────┐
│  ═══ STICKY HEADER ═══                               │
│  Card Title (lg, bold)                               │
│  Objective (xs, italic, muted)                       │
│──────────────────────────────────────────────────────│
│  ═══ SCROLLABLE BODY ═══                             │
│                                                      │
│  ┌─ 1. INTERACTION SUMMARY ───────────────────────┐  │
│  │  🧠 Interaction Summary  [AI badge]            │  │
│  │  "Recent activity with Company suggests..."     │  │
│  │  ▸ See Complete Chronology                      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  COMPANY: Legacy Systems Co    DEAL: Newsletter      │
│                                                      │
│  ┌─ 3. DRAFT READY TO SEND (HERO) ───────────────┐  │
│  │  📧 Draft Ready to Send                        │  │
│  │  🤖 Tone detected: Professional                │  │
│  │  [Formal] [Professional•] [Conversational]      │  │
│  │  (tabs hidden during editing → ToneBadge shown) │  │
│  │  ┌────────────────────────────────────────┐     │  │
│  │  │ Gmail-style Rich Text Editor           │     │  │
│  │  │ [Undo][Redo] | [Font▾][Size▾] | B I U  │     │  │
│  │  │ | Color | Align | Lists | Quote | 📎   │     │  │
│  │  │ ──────────────────────────────────────  │     │  │
│  │  │ Dear [Contact Name],                   │     │  │
│  │  │ Thank you for your time...             │     │  │
│  │  │ ──────────────────────────────────────  │     │  │
│  │  │ [file1.pdf (2.3KB)] [img.png (45KB)]   │     │  │
│  │  └────────────────────────────────────────┘     │  │
│  │  [Send] [Save Draft •]                          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ 4. NEUROSCIENCE PRINCIPLES ───────────────────┐  │
│  │  Loss Aversion · Social Proof                   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ 5. KEY TOPICS ────────────────────────────────┐  │
│  │  [App Design] [Budget] [CFO] [Urgency]          │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ 6. VIEW OTHER OPTIONS (collapsed) ────────────┐  │
│  │  ▾ View Other Options                           │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ───────────────────── bottom bar ─────────────────  │
│                              [✓ Mark Complete]       │
└──────────────────────────────────────────────────────┘
```

#### Tone System
- **Three tones**: Formal, Professional, Conversational
- **AI Detection**: Tone is auto-detected from prospect's communication style. A dot indicator (●) marks the AI-recommended tone in the tab bar.
- **Detection Label**: Static `"🤖 Tone detected automatically: [tone]"` line above the tabs — never changes when user switches tones.
- User can switch manually via tab bar; active tab has accent underline.
- **Editing Context Switch**: When user focuses the editor (`isEditing = true`), the full `ToneSelector` tabs hide and a compact `ToneBadge` is shown instead, maximizing editor space.
- Draft content updates reactively per tone selection.

#### Tone Draft Resolution
```typescript
// Priority: data.toneDrafts[selectedTone] → data.draftContent → hardcoded default
const toneDraft = data.toneDrafts?.[selectedTone] ?? data.draftContent ?? defaultDrafts[activeToneKey];
```

#### Gmail-style Rich Text Editor (`GmailRichTextEditor`)
- **Architecture**: `contentEditable` div with `document.execCommand` for formatting
- **Toolbar Features**: Undo/Redo, Font Family (12 fonts with live preview), Font Size, Bold/Italic/Underline/Strikethrough, Text Color (20 colors), Alignment (4 options), Lists (ordered/unordered), Indent/Outdent, Blockquote, Remove formatting, File attachments
- **Font Dropdown**: Scrollable list (`max-h-48 overflow-y-auto`) with gradient fade hint, fonts rendered in their own typeface, active font highlighted with accent border and dot indicator
- **Attachments**: File chips with type-specific icons, file size display, remove button. Supports multiple files.
- **Content managed as HTML strings**

#### Unsaved Changes Protection
- `isDirty` = `draftHtml !== savedContent && draftHtml !== ""`
- Click-outside detection via `mousedown` listener on `document`
- When dirty + editing + click outside card → `UnsavedChangesDialog` overlay appears
- Dialog offers: **Save Draft** (primary) or **Discard** (destructive outline)
- Frosted glass overlay with `backdrop-blur-sm bg-background/80`

#### Draft Action Buttons (inside Draft section)
| Button | Style | Action |
|--------|-------|--------|
| Send | Primary (filled bg-primary) | Saves content + placeholder |
| Save Draft | Secondary (outlined border) | Persists `draftHtml` to `savedContent`, exits editing mode. Shows amber dot when `isDirty`. |

#### Bottom Bar
- Only contains "Mark Complete" button (right-aligned)
- Shows completed state badge when resolved

#### Neuroscience Principles
- Dynamically generated based on meeting/negotiation context (backend/AI logic)
- Compact pill-based layout
- Expandable on click for explanation details
- Each principle includes: title, explanation, highlighted phrase from draft

---

### 5.10 NeurosciencePrinciples

**File**: `src/components/atlas/action-card/NeurosciencePrinciples.tsx`
**Purpose**: Displays AI-generated neuroscientific principles applied in the draft.

- Compact card with expandable details
- Each principle shows title, explanation, and highlighted phrase
- Dynamic based on meeting context

---

### 5.11 InteractionSummary

**File**: `src/components/atlas/action-card/InteractionSummary.tsx`
**Purpose**: Reusable component displaying the AI-generated interaction summary with expandable chronology timeline.

- Shows summary text with Brain icon and AI badge
- Optional expandable history timeline with type-specific icons (email, call, meeting)
- Each history item shows: icon, time ago, summary text
- Toggle between "See Complete Chronology" / "Hide history"

---

### 5.12 GmailRichTextEditor

**File**: `src/components/editor/GmailRichTextEditor.tsx`
**Purpose**: Gmail-style rich text editor built on `contentEditable` with comprehensive formatting toolbar and file attachment support.

#### Features
- **Formatting Toolbar**: Undo/Redo, Font Family (12 fonts), Font Size (8-36px), Bold/Italic/Underline/Strikethrough, Text Color (20 colors), Alignment (4 modes), Ordered/Unordered lists, Indent/Outdent, Blockquote, Remove formatting
- **Font Dropdown**: Scrollable with live typeface preview, gradient fade scroll hint, active font highlighted with accent border + dot indicator
- **File Attachments**: Multi-file support via hidden `<input type="file">`, displayed as chips with type-specific icons (Image, Film, Music, Archive, Code, FileText), file size, and remove button
- **Content**: Managed as HTML strings via `onChange` callback

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Initial HTML content |
| `onChange` | `(html: string) => void` | Fires on every content change |
| `onAttachmentsChange` | `(files: AttachedFile[]) => void` | Fires when files added/removed |
| `placeholder` | `string` | Placeholder text (default: "Compose your message...") |
| `minHeight` | `number` | Minimum editor height in px (default: 120) |
| `className` | `string` | Additional CSS classes |

---

### 5.13 ToneSelector & ToneBadge

**Files**: `src/components/action-ready/ToneSelector.tsx`, `src/components/action-ready/ToneBadge.tsx`

#### ToneSelector
- Displays three tone tabs: Formal, Professional, Conversational
- Static AI detection label: `"🤖 Tone detected automatically: [tone]"` — never changes
- AI-detected tone gets a dot indicator (●) in its tab
- Active tab has accent underline
- Shown when user is NOT editing the draft

#### ToneBadge
- Compact single-line display: `"Tone: [selected tone]"` with accent dot
- Shown when user IS editing the draft (replaces full ToneSelector to save space)
- Fade-in animation on mount

---

### 5.14 UnsavedChangesDialog

**File**: `src/components/action-ready/UnsavedChangesDialog.tsx`
**Purpose**: Frosted glass confirmation overlay shown when user tries to leave with unsaved draft edits.

- Overlays the entire card with `backdrop-blur-sm bg-background/80`
- Warning icon (amber) with "Unsaved changes" title and description
- Two buttons: **Save Draft** (primary) and **Discard** (destructive outline)
- Animated entrance: `fade-in zoom-in-95`

---

## 6. User Interaction Flows

### Flow 1: Reviewing and Completing an Action

```
1. User lands on "/"
   → Page loads with ActionsProvider + LanguageProvider
   → Default filter: "needs_review", category: "all", channel: "all"
   → Matching action cards shown in 2-column grid

2. User sees compact card (ActionCardFront)
   → Shows: type badge, prospect name, title, objective, due time, channel badge, "Complete" button

3. User clicks card body (not on button)
   → Modal opens with glassmorphism effect and backdrop blur
   → ActionCardExpanded renders inside Dialog

4. User reads modal content (title + objective sticky at top)
   → Sees (in order): Interaction Summary (with AI badge), Company & Deal info,
     Gmail-style Rich Text Draft (hero section), Neuroscience Principles, Key Topics, Other Options

5. User sees tone tabs in Draft section
   → "professional" selected by default (auto-detected)
   → AI detection dot (●) marks the recommended tone
   → Can switch to "formal" or "conversational"

6. User clicks into the draft editor
   → isEditing = true → ToneSelector tabs hide → ToneBadge shown
   → User edits with rich text toolbar (fonts, colors, formatting, attachments)
   → isDirty tracks unsaved changes (amber dot on Save Draft button)

7. User clicks "Send" or "Save Draft"
   → Send: saves content + placeholder action
   → Save Draft: persists draftHtml to savedContent, exits editing mode

8. User clicks outside card while editing with unsaved changes
   → UnsavedChangesDialog appears (frosted glass overlay)
   → "Save Draft" persists changes, "Discard" reverts to savedContent

9. User clicks "Mark Complete" (bottom bar)
   → resolving = true → Card fades out (300ms)
   → Modal closes → card moves to completed queue
```

### Flow 2: Filtering by Category and Channel

```
1. User clicks "Interested" in ActionFilterSidebar categories
   → setActiveCategory("interested")
   → filteredActions recalculated
   → Filter pill appears in header

2. User selects "Email" from channel dropdown
   → setActiveChannel("Email")
   → Further filtering applied

3. User clicks "Clear all" in header
   → clearFilters() → resets to "all"
```

### Flow 3: Switching Status Filters

```
1. User clicks "Overdue" in ActionFilterSidebar
   → Shows only overdue cards (>5 days)

2. User clicks "Completed"
   → Shows resolved cards with 60% opacity
   → Cards cannot be opened (modal disabled)
```

### Flow 4: Strategy Modal

```
1. User clicks "Strategy" in AtlasSidebar
   → StrategyComingSoonModal opens
2. User closes via "Got it" / X / backdrop / ESC
```

### Flow 5: Sidebar Collapse

```
1. User hovers over AtlasSidebar → toggle button appears
2. Click → collapsed = true → 240px → 72px (icons only)
3. Click again → expands back
```

---

## 7. Mock Data Reference

### 7.1 Action Cards (~50 total)

| Category | Companies | Status Distribution |
|----------|-----------|---------------------|
| Interested | 21 | 60% review, 20% overdue, 20% completed |
| Not interested | 16 | 50% review, 25% completed, 25% overdue |
| Non in target | 6 | 67% review, 33% completed |
| Meeting intent | 3 | 100% review |
| Not now | 2 | 50% review, 50% completed |
| Forwarded | 2 | 100% review |

### 7.2 Categories (9 total)

All, Interested, Not interested, Non in target, Meeting intent, Not now, Forwarded, No categories, Do not contact

### 7.3 Card Type Assignment (automatic by title keywords)

| Keywords | Assigned Type |
|----------|---------------|
| schedule, book, set up, call | schedule_demo |
| follow up, check-in | call_followup |
| share, send, refer, suggest, provide | send_resources |
| Other | email_response |

---

## 8. Visual Design Tokens

### Color System (HSL-based CSS variables)

| Token | Usage |
|-----------------------|----------------------------|
| `--background` | Page background |
| `--foreground` | Primary text |
| `--card` | Card backgrounds |
| `--primary` | Primary accent |
| `--muted` | Muted backgrounds |
| `--muted-foreground` | Secondary text |
| `--accent` | Accent highlights, active states |
| `--border` | Borders |
| `--destructive` | Error/overdue states |
| `--forskale-green` | Success, completion, gradient start |
| `--forskale-teal` | Teal accent, gradient middle |
| `--forskale-blue` | Blue accent, gradient end |
| `--forskale-cyan` | send_resources type |
| `--sidebar-background` | Sidebar gradient end |
| `--sidebar-accent` | Sidebar gradient start |
| `--secondary` | Content area background |

### Typography Scale

| Element | Size | Weight |
|-----------------------|----------------|---------|
| Page title (H1) | text-2xl (24px) | Bold |
| Modal title | text-lg (18px) | Bold |
| Card title (compact) | text-sm (14px) | Bold |
| Body text | text-sm (14px) | Normal |
| Draft text | text-[13px] | Normal (mono) |
| Labels & metadata | text-xs (12px) | Semibold |
| Eyebrow text | text-[11px] / text-[10px] | Bold, uppercase, tracked |
| Tiny labels | text-[10px] / text-[9px] | Bold |

---

## 9. API Contract Recommendations

When replacing mock data with real API calls, the backend should provide these endpoints:

### GET /api/actions
Returns list of action cards for the current user.

**Response**: `ActionCardData[]`

**Query Parameters**:
| Param | Type | Description |
|-----------|----------------------------------------------|----------------------|
| `status` | `"pending" \| "overdue" \| "completed"` | Filter by status |
| `category` | `SentimentBadge` | Filter by category |
| `channel` | `Channel` | Filter by channel |
| `search` | `string` | Full-text search |

### PATCH /api/actions/:id/resolve
Marks an action as completed.

**Response**: Updated `ActionCardData`

### GET /api/actions/:id/draft
Returns AI-generated drafts for all tones.

**Response**:
```json
{
  "formal": "...",
  "professional": "...",
  "conversational": "..."
}
```

### POST /api/actions/:id/send
Sends the selected draft.

**Request Body**:
```json
{
  "tone": "professional",
  "content": "...",
  "channel": "email"
}
```
