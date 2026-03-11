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
   - 5.2 [ActionReadyHeader](#52-actionreadyheader)
   - 5.3 [ActionFilterSidebar](#53-actionfiltersidebar)
   - 5.4 [ActionReadyContent](#54-actionreadycontent)
   - 5.5 [ActionCard (Container)](#55-actioncard-container)
   - 5.6 [ActionCardFront (Compact View)](#56-actioncardfront-compact-view)
   - 5.7 [ActionCardExpanded (Detail View)](#57-actioncardexpanded-detail-view)
   - 5.8 [InteractionSummary](#58-interactionsummary)
   - 5.9 [AttentionRequiredSection](#59-attentionrequiredsection)
   - 5.10 [AttentionRequiredCard](#510-attentionrequiredcard)
   - 5.11 [UrgentBanner](#511-urgentbanner)
6. [User Interaction Flows](#6-user-interaction-flows)
7. [Mock Data Reference](#7-mock-data-reference)
8. [Visual Design Tokens](#8-visual-design-tokens)
9. [API Contract Recommendations](#9-api-contract-recommendations)

---

## 1. Application Overview

**ForSkale Atlas** is a sales enablement dashboard that surfaces AI-generated follow-up actions for sales reps. The primary view is called **"Action Ready"** — a flashcard-style execution queue where each card represents one pending sales task (email reply, call follow-up, or demo scheduling).

### Core Concept
- Actions are presented as **flashcards** with a compact front face and a detailed back face.
- Users review one card at a time, flip it to see AI-generated drafts, then either **send**, **edit**, or mark as **completed**.
- Cards are filtered by status: **Needs Review**, **Overdue** (>5 days), or **Completed**.

### Tech Stack
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** with custom design tokens
- **React Router** (single page at `/`)
- **TanStack React Query** (available but not yet used for data fetching)
- **shadcn/ui** component library

---

## 2. Page Layout & Component Tree

```
<ActionsProvider>                    ← Global state (context)
  <div className="flex min-h-screen">
    ├── <AtlasSidebar />             ← Left nav (collapsible, 240px / 72px)
    └── <div className="flex-1 flex flex-col">
          ├── <ActionReadyHeader />  ← Top bar (search, filters, CTAs)
          └── <div className="flex flex-1">
                ├── <ActionFilterSidebar />  ← Filter rail (240px / 60px)
                └── <ActionReadyContent />   ← Main card grid
              </div>
        </div>
  </div>
</ActionsProvider>
```

### Layout Behavior
| Breakpoint | AtlasSidebar | FilterSidebar | Content |
|------------|--------------|---------------|---------|
| < 1024px (mobile) | Hidden | Horizontal bar above content | Full width |
| ≥ 1024px (desktop) | Visible (240px expanded / 72px collapsed) | Vertical rail (240px / 60px) | Remaining space |

---

## 3. Data Models & Types

### 3.1 ActionCardData (Primary Entity)

```typescript
interface ActionCardData {
  id: string;                          // Unique identifier
  type: ActionType;                    // "email_response" | "call_followup" | "schedule_demo"
  title: string;                       // Card title (e.g., "Reply to: How to write the perfect prompt")
  prospect: string;                    // Company/person name
  sentiment: SentimentBadge;           // "interested" | "not_interested" | "not_now"
  triggeredFrom: string;               // Source that triggered the action ("Email", "Meeting")
  dueLabel: string;                    // Human-readable due text ("Due in 18h", "6 days overdue")
  isOverdue?: boolean;                 // Whether this action is overdue
  strategicStep?: string;              // AI-recommended next strategic step
  objective?: string;                  // Goal of this action
  keyTopics?: string[];                // List of discussion topics
  whyThisStep?: string;                // AI explanation for why this action was chosen
  draftContent: string;                // Default AI-generated email/message draft
  toneOptions?: string[];              // Available tone options (default: ["Professional", "Warm", "Direct"])
  toneDrafts?: Partial<Record<        // Tone-specific draft variations
    "Professional" | "Warm" | "Direct",
    string
  >>;
  decisionFactors?: {                  // AI decision factors
    label: string;                     //   e.g., "Intent"
    value: string;                     //   e.g., "not interested"
  }[];
  alternativeOptions?: AlternativeOption[];  // Other suggested actions with confidence %
  interactionSummary?: string;         // AI-generated narrative of past interactions
  interactionHistory?: InteractionHistoryItem[];  // Chronological interaction list
}
```

### 3.2 Supporting Types

```typescript
type ActionType = "email_response" | "call_followup" | "schedule_demo";
type SentimentBadge = "interested" | "not_interested" | "not_now";

interface AlternativeOption {
  label: string;       // e.g., "Send email with design tips and case studies"
  confidence: number;  // 0-100 percentage
}

interface InteractionHistoryItem {
  type: "email" | "call" | "meeting";
  timeAgo: string;     // e.g., "2d ago", "1w ago"
  summary: string;     // e.g., "Asked about pricing tiers"
}
```

### 3.3 AttentionRequiredItem (Overdue Entity)

```typescript
interface AttentionRequiredItem {
  id: string;
  title: string;
  type: "email" | "call";
  prospect: string;
  overdueLabel: string;                // e.g., "0 days overdue"
  tags: string[];                      // Warning tags (e.g., "Pricing clarification promised 2 days ago")
  decisionEngine: {
    detectedSituation: string;         // AI-detected scenario
    primaryRecommendation: string;     // e.g., "Send Email"
    confidence: number;                // 0-100
    decisionFactors: string[];         // List of factor descriptions
    whyThis: string[];                 // Reasons for this recommendation
    objective: string;                 // Goal
  };
  generatedDraft: string;             // Pre-generated response draft
}
```

### 3.4 Filter Types

```typescript
type FilterType = "needs_review" | "overdue" | "completed";
```

---

## 4. State Management (ActionsContext)

The entire application state is managed via a single React Context (`ActionsContext`).

### State Shape

```typescript
interface ActionsContextType {
  pendingActions: ActionCardData[];     // Cards in "needs_review" queue
  completedActions: ActionCardData[];   // Cards marked as done
  filteredActions: ActionCardData[];    // Currently visible cards (based on filter)
  activeFilter: FilterType;            // Current filter selection
  setActiveFilter: (filter: FilterType) => void;
  resolveAction: (id: string) => void; // Mark a card as completed
}
```

### Internal State

| State Variable | Type | Initial Value | Description |
|----------------|------|---------------|-------------|
| `completedIds` | `Set<string>` | Empty set | Tracks which action IDs have been completed |
| `activeFilter` | `FilterType` | `"needs_review"` | Current queue filter |

### Derived Data Logic

```
Source data: mockActions[] (all 5 action cards)

pendingActions = mockActions where id NOT IN completedIds
overdueActions = pendingActions where isOverdue === true AND dueLabel matches "> 5 days overdue"
reviewActions  = pendingActions where id NOT IN overdueActions
completedActions = mockActions where id IN completedIds

filteredActions =
  if activeFilter === "completed"    → completedActions
  if activeFilter === "overdue"      → overdueActions
  if activeFilter === "needs_review" → reviewActions
```

### Overdue Detection Logic

```typescript
// Extracts number of days from dueLabel string
function getOverdueDays(dueLabel: string): number {
  const match = dueLabel.match(/(\d+)\s+days?\s+overdue/i);
  return match ? Number(match[1]) : 0;
}

// A card appears in "Overdue" filter only if:
//   1. isOverdue === true
//   2. getOverdueDays(dueLabel) > 5
```

### resolveAction Flow

```
User clicks "Complete" button
  → resolveAction(cardId) called
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

#### Layout Sections (top to bottom)
1. **Collapse Toggle**: White circular button (8×8) at right edge, only visible on hover (`group-hover/sidebar:visible`). Chevron rotates 180° when collapsed.
2. **Logo & Brand**: ForSkale logo (64×64px) with white glow drop-shadow. Brand name hidden when collapsed.
3. **Gradient Divider**: Horizontal line fading from transparent → primary/20 → transparent.
4. **Record CTA**: Green-to-blue gradient button. Shows only icon when collapsed.
5. **Navigation Items** (6 items):
   | Icon | Label | Active |
   |------|-------|--------|
   | CalendarDays | Meeting Intelligence | No |
   | Video | Meeting Insights | No |
   | BarChart3 | Performance | No |
   | ClipboardCheck | Action Ready | **Yes** (hardcoded) |
   | HelpCircle | Q&A Engine | No |
   | BookOpen | Knowledge | No |
6. **Invite Button**: UserPlus icon + "Invite" text.
7. **User Card**: Avatar circle "JD" with gradient background, name "John Doe", email "john@forskale.ai".

#### Interactions
| Action | Result |
|--------|--------|
| Hover over sidebar | Collapse toggle button becomes visible |
| Click collapse toggle | Sidebar width toggles between 240px ↔ 72px. Labels hide, only icons remain. Chevron rotates. |
| Click nav item | Currently no routing (all `href="#"`) |

#### Width Values
- Expanded: `w-60` (240px)
- Collapsed: `w-[72px]`
- Hidden below `lg` breakpoint

---

### 5.2 ActionReadyHeader

**File**: `src/components/atlas/ActionReadyHeader.tsx`
**Purpose**: Top header bar with page title, search, and action buttons.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `searchQuery` | `string` | `""` | Search input value (currently not wired to filtering) |

#### Layout (left to right)

**Left side:**
- Eyebrow: "ACTION READY" (11px, forskale-blue, uppercase)
- Title: "Execution flashcards for sales follow-up" (H1, 2xl, bold)
- Subtitle: Description text (xs, muted)

**Right side (button row):**
| Button | Icon | Style | Click Action |
|--------|------|-------|--------------|
| Search input | Search | Text input, 180px wide | Updates `searchQuery` state (no filtering yet) |
| Filters | SlidersHorizontal | Outlined | **No action** (placeholder) |
| Analyze New | Sparkles | Outlined | **No action** (placeholder) |
| Paste Email | Mail | Green gradient, filled | **No action** (placeholder) |

---

### 5.3 ActionFilterSidebar

**File**: `src/components/atlas/ActionFilterSidebar.tsx`
**Purpose**: Left filter rail to switch between action queues.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `selectedCategory` | `string` | `"interested"` | Active sentiment category (no filtering implemented) |
| `collapsed` | `boolean` | `false` | Whether filter sidebar is minimized |

#### Two Display Modes

**Expanded Mode** (240px):
- Collapse button (PanelLeftClose icon, top-right)
- Three status filter cards:

| Filter | Icon | Count Source | Active Indicator |
|--------|------|-------------|-----------------|
| Needs Review | Circle | `pendingActions.length` | Green dot + gradient bg |
| Overdue | AlertTriangle | Cards with `isOverdue && >5 days` | Green dot + gradient bg |
| Completed | CheckCircle2 | `completedActions.length` | Green dot + gradient bg |

- Category section (below filters):

| Category | Count Logic |
|----------|-------------|
| Interested | Actions where `sentiment === "interested"` |
| Not now | Actions where `sentiment === "not_now"` |
| Not interested | Actions where `sentiment === "not_interested"` |

**Collapsed Mode** (60px):
- Expand button (PanelLeft icon)
- Three icon-only filter buttons (10×10 rounded squares)
- Active filter has a small dot indicator

#### Interactions
| Action | Result |
|--------|--------|
| Click a status filter | Sets `activeFilter` in context → content area updates to show matching cards |
| Click category pill | Updates local `selectedCategory` (visual only, no filtering on content grid yet) |
| Click collapse/expand | Toggles between 240px and 60px width |

---

### 5.4 ActionReadyContent

**File**: `src/components/atlas/ActionReadyContent.tsx`
**Purpose**: Main content area displaying the action card grid.

#### No Local State (reads from context)

#### Layout
1. **Queue Header**:
   - Icon in colored circle (varies by filter)
   - Eyebrow text (uppercase, e.g., "EXECUTION QUEUE")
   - Title text (changes per filter)
   - Card count badge (e.g., "5 cards")

2. **Card Grid**: `grid gap-4 lg:grid-cols-2` — 2 columns on desktop, 1 on mobile.

3. **Empty State**: Dashed border box with contextual message when no cards match.

#### Filter-specific display:

| Filter | Icon | Eyebrow | Title | Cards Shown |
|--------|------|---------|-------|-------------|
| needs_review | Circle (primary) | "EXECUTION QUEUE" | "One task. One action. Next card." | Non-overdue pending cards |
| overdue | AlertTriangle (cyan) | "OVERDUE" | "One task. One action. Next card." | Overdue cards (>5 days) |
| completed | CheckCircle2 (green) | "COMPLETED" | "Recently shipped actions" | Resolved cards |

#### How Cards Render
```
filteredActions.map(action =>
  <ActionCard
    data={action}
    onResolve={isCompleted ? undefined : resolveAction}  // No resolve in completed view
    resolved={isCompleted}                                // Visual indicator
  />
)
```

---

### 5.5 ActionCard (Container)

**File**: `src/components/atlas/ActionCard.tsx`
**Purpose**: Manages the 3D flip animation between compact and expanded views.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `expanded` | `boolean` | `false` | Whether card is flipped to show back |
| `showDraft` | `boolean` | `false` | Whether AI draft section is open (in expanded view) |
| `showFullDraft` | `boolean` | `false` | Whether full draft text is shown (vs truncated) |
| `selectedTone` | `string` | `"Professional"` | Currently selected tone for draft |
| `resolving` | `boolean` | `false` | Animation state during resolve |

#### 3D Flip Animation
- Container has `perspective: 1200px`
- Inner div uses `transform-style: preserve-3d`
- Front face: `rotateY(0deg)` when not expanded, hidden via `display: none` when expanded
- Back face: `rotateY(180deg)` always, shown via `display: block` when expanded
- Transition: `600ms` with `cubic-bezier(0.4, 0.2, 0.2, 1)` easing

#### Resolve Animation
```
handleResolve() called
  → resolving = true (immediately)
  → Card gets: opacity-0, translate-y-3, pointer-events-none (300ms CSS transition)
  → After 320ms timeout: onResolve(id) fires → card removed from pending list
```

#### Open/Close Logic
```
handleOpen():
  if already expanded → do nothing
  reset showDraft = false, showFullDraft = false
  set expanded = true

handleClose():
  if not expanded OR resolved → do nothing
  reset showDraft = false, showFullDraft = false
  set expanded = false
```

---

### 5.6 ActionCardFront (Compact View)

**File**: `src/components/atlas/action-card/ActionCardFront.tsx`
**Purpose**: The compact flashcard face showing key info at a glance.

#### No Local State

#### Visual Structure (top to bottom)

```
┌──────────────────────────────────────┐
│█ [TYPE BADGE]              [✓ icon]  │  ← Priority bar (left edge, colored by type)
│  PROSPECT NAME                       │  ← Uppercase, 10px, muted
│  Card Title Text                     │  ← 14px (sm), bold, max 30 characters
│  ⏰ Due in 18h                       │  ← Clock icon + due label (red if overdue)
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

#### Interactions
| Action | Result |
|--------|--------|
| Click anywhere on card body | Triggers `onOpen()` → card flips to expanded view |
| Click on any `<button>` inside | Click does NOT propagate to card body (prevented via `.closest("button")` check) |
| Click "Complete" button | Triggers resolve animation → card moves to completed queue |

#### Conditional Rendering
- **Resolved state**: Shows green CheckCircle2 icon in top-right. No "Complete" button.
- **Overdue state**: Clock icon turns red (`text-destructive`), due label text turns red + bold.

---

### 5.7 ActionCardExpanded (Detail View)

**File**: `src/components/atlas/action-card/ActionCardExpanded.tsx`
**Purpose**: The detailed back face of the flashcard with full AI analysis and draft.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `showOptions` | `boolean` | `false` | Whether alternative options section is expanded |

#### Visual Structure (top to bottom)

```
┌──────────────────────────────────────────────┐
│  PROSPECT NAME                    [✓ resolve]│
│  Card Title (large)                          │
│                                              │
│  ┌─ INTERACTION SUMMARY ──────────────────┐  │  ← AI badge, narrative text
│  │  🧠 AI: "Prospect showed initial...   │  │
│  │  ▸ View full history                   │  │  ← Toggleable timeline
│  └────────────────────────────────────────┘  │
│                                              │
│  💡 STRATEGIC NEXT STEP                      │
│  "Schedule follow-up call to check-in..."    │
│                                              │
│  🎯 OBJECTIVE                                │
│  "Re-establish interest"                     │
│                                              │
│  ┌─ DRAFT & OPTIONS PANEL ────────────────┐  │  ← Grey background section
│  │                                        │  │
│  │  ┌─ AI GENERATED DRAFT ─────────────┐  │  │  ← Collapsible
│  │  │  ▾ Click to expand               │  │  │
│  │  │  TONE: [Professional] [Warm] [Dir]│  │  │  ← Tone selector
│  │  │  "Hi there, Thank you for..."     │  │  │  ← Draft text (6-line clamp)
│  │  │  [✏ Edit] [▶ Send]               │  │  │  ← Action buttons
│  │  │  Show Full Draft ↓                │  │  │  ← Expand/collapse link
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  ┌─ VIEW OTHER OPTIONS ─────────────┐  │  │  ← Collapsible
│  │  │  ▾ Click to expand               │  │  │
│  │  │  📞 Send email with tips    [60%] │  │  │
│  │  │  📞 Share success story     [40%] │  │  │
│  │  │  📞 Set a meeting          [20%] │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │                                        │  │
│  │  📋 KEY TOPICS                         │  │
│  │  [1] Current project status            │  │
│  │  [2] Potential pain points             │  │
│  │                                        │  │
│  │  WHY THIS STEP                         │  │
│  │  "Since the intent is not_interested..." │  │
│  │                                        │  │
│  │  DECISION FACTORS                      │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐           │  │
│  │  │Intent│ │Source│ │Stage │           │  │
│  │  │not...│ │email │ │aware.│           │  │
│  │  └──────┘ └──────┘ └──────┘           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [ ✓ Completed ] ← full-width green button   │
└──────────────────────────────────────────────┘
```

#### Tone Draft Logic

```typescript
// If toneDrafts has a variant for the selected tone, use it
// Otherwise, fall back to a prefix + draftContent
const toneDraft = data.toneDrafts?.[selectedTone] 
  ?? `${draftPrefixes[selectedTone]}\n\n${data.draftContent}`;

// Default prefixes:
// Professional: "Hi there,\n\nThank you for reaching out."
// Warm:         "Hi there,\n\nReally appreciate your note."
// Direct:       "Hi there,\n\nQuick follow-up on this."
```

#### Alternative Options Fallback
If `data.alternativeOptions` is empty or undefined, defaults to:
```
[
  { label: "Send email with design tips and case studies", confidence: 60 },
  { label: "Share a relevant app development success story", confidence: 40 },
  { label: "Set a meeting", confidence: 20 },
]
```

#### Interactions
| Action | Result |
|--------|--------|
| Click card body (not on button/input) | Flips card back to compact view (only if not resolved) |
| Click ✓ icon (top-right) | Triggers resolve animation |
| Click "AI Generated Draft" header | Toggles draft section open/closed |
| Click tone button (Professional/Warm/Direct) | Switches draft text to that tone's version |
| Click "Show Full Draft" | Removes 6-line clamp, shows full text |
| Click "Collapse Draft" | Re-applies 6-line clamp |
| Click "Edit" button | **No action** (placeholder for future) |
| Click "Send" button | **No action** (placeholder for future) |
| Click "View other options" header | Toggles alternative options list |
| Click "Completed" (bottom button) | Triggers resolve animation |

#### Conditional Rendering
| Condition | Effect |
|-----------|--------|
| `data.interactionSummary` exists | Shows InteractionSummary component |
| `data.strategicStep` OR `data.objective` exists | Shows strategic step section |
| `data.objective` exists | Shows objective section |
| `data.keyTopics` has items | Shows key topics grid |
| `data.whyThisStep` exists | Shows rationale section |
| `data.decisionFactors` has items | Shows decision factors grid (3 columns on sm+) |
| `resolved === true` | Shows green checkmark, hides resolve buttons, prevents flip-back |
| `onResolve` is provided | Shows resolve button (top-right) and "Completed" button (bottom) |

---

### 5.8 InteractionSummary

**File**: `src/components/atlas/action-card/InteractionSummary.tsx`
**Purpose**: AI-generated interaction narrative with expandable timeline.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `showHistory` | `boolean` | `false` | Whether full history timeline is visible |

#### Visual Structure
```
┌─ INTERACTION SUMMARY (rounded border, muted bg) ─┐
│  🧠 Interaction Summary  [AI badge]               │
│  "Prospect showed initial curiosity about..."      │
│                                                    │
│  ▸ View full history   ← toggle link              │
│    📧 2d ago — Asked about pricing tiers           │
│    📧 5d ago — Downloaded prompt guide             │
│    📅 1w ago — Initial discovery call — positive   │
└────────────────────────────────────────────────────┘
```

#### History Item Icons
| Type | Icon |
|------|------|
| email | Mail |
| call | Phone |
| meeting | Calendar |

#### Interactions
| Action | Result |
|--------|--------|
| Click "View full history" | Expands chronological timeline below summary |
| Click "Hide history" | Collapses timeline. ChevronRight rotates 90° when open |

---

### 5.9 AttentionRequiredSection

**File**: `src/components/atlas/AttentionRequiredSection.tsx`
**Purpose**: Banner showing overdue items requiring attention (uses static `attentionRequiredItems` data).

> **Note**: This component is defined but **not currently rendered** in the page layout.

#### No State

#### Visual Structure
- Warning icon + "Attention Required" header + count badge
- Description text
- Horizontal row of pill buttons, each showing truncated title + overdue label
- Clicking pills: **No action** (placeholder)

---

### 5.10 AttentionRequiredCard

**File**: `src/components/atlas/AttentionRequiredCard.tsx`
**Purpose**: Detailed card for an attention-required item with decision engine breakdown.

> **Note**: This component is defined but **not currently rendered** in any parent.

#### State
| Variable | Type | Initial | Description |
|----------|------|---------|-------------|
| `expanded` | `boolean` | `false` | Whether generated draft is visible |

#### Sections
1. **Header**: Warning icon + "Attention Required (Today)"
2. **Tags**: Horizontal pills with warning descriptions
3. **Decision Engine** (always visible):
   - Detected Situation
   - Primary Recommendation + Confidence %
   - Decision Factors (bulleted list)
   - "Why this recommendation?" (bulleted list)
   - Objective
   - Action buttons: "Generate Script" + "View Other Options" (both placeholder)
4. **Generated Draft** (collapsible): Pre-written response text
5. **Footer**: Email/Phone icon + title + overdue label

---

### 5.11 UrgentBanner

**File**: `src/components/atlas/UrgentBanner.tsx`
**Purpose**: Compact warning banner with hardcoded urgent items.

> **Note**: This component is defined but **not currently rendered** in any parent.

#### No State (static data)

Displays 4 hardcoded urgent items as pill buttons + "Show more" link. All interactions are placeholders.

---

## 6. User Interaction Flows

### Flow 1: Reviewing and Completing an Action

```
1. User lands on "/"
   → Page loads with ActionsProvider
   → Default filter: "needs_review"
   → All 5 mock actions shown in 2-column grid

2. User sees compact card (ActionCardFront)
   → Shows: type badge, prospect name, title, due time, "Complete" button

3. User clicks card body (not on button)
   → ActionCard.handleOpen() fires
   → expanded = true, showDraft/showFullDraft reset to false
   → 3D flip animation (600ms) reveals ActionCardExpanded

4. User reads expanded card
   → Sees: interaction summary, strategic step, objective
   → Draft section is collapsed by default

5. User clicks "AI Generated Draft" header
   → showDraft toggles to true
   → Draft text appears (truncated to 6 lines)
   → Tone selector visible: Professional (selected), Warm, Direct

6. User clicks "Warm" tone button
   → selectedTone = "Warm"
   → Draft text switches to warm variant

7. User clicks "Show Full Draft"
   → showFullDraft = true
   → Full draft text visible (no line clamp)

8. User clicks "Completed" (bottom button)
   → resolving = true
   → Card fades out + slides down (300ms)
   → After 320ms: resolveAction(id) called
   → Card removed from pendingActions
   → Card added to completedActions
   → Card count updates in filter sidebar

9. Card disappears from grid. Remaining cards reflow.
```

### Flow 2: Switching Filters

```
1. User clicks "Overdue" in ActionFilterSidebar
   → setActiveFilter("overdue")
   → filteredActions recalculated: only cards where isOverdue=true AND >5 days overdue
   → Content header changes to "OVERDUE" eyebrow + AlertTriangle icon
   → Grid shows matching cards (or empty state)

2. User clicks "Completed"
   → Shows only resolved cards with 60% opacity
   → No "Complete" buttons visible
   → Cards cannot be flipped back (click does nothing)
```

### Flow 3: Sidebar Collapse

```
1. User hovers over AtlasSidebar
   → White circular button appears at right edge (ChevronLeft)

2. User clicks the button
   → collapsed = true
   → Sidebar width: 240px → 72px (300ms transition)
   → All text labels hide, only icons remain
   → Chevron rotates 180°

3. User hovers and clicks again
   → collapsed = false → sidebar expands back to 240px
```

### Flow 4: Filter Sidebar Collapse

```
1. User clicks PanelLeftClose icon (top-right of filter sidebar)
   → collapsed = true
   → Width: 240px → 60px
   → Filter cards become icon-only squares

2. User clicks PanelLeft icon in collapsed view
   → collapsed = false → expands back
```

### Flow 5: Viewing Alternative Options

```
1. In expanded card, user clicks "View other options"
   → showOptions = true
   → List of alternatives appears with confidence percentages
   → Each alternative shows a Phone icon + label + percentage badge

2. User clicks header again
   → showOptions = false → list collapses
```

### Flow 6: Viewing Interaction History

```
1. In expanded card's InteractionSummary section
   → AI narrative is always visible
   → "View full history" link appears if history items exist

2. User clicks "View full history"
   → showHistory = true
   → Chronological list appears: icon + time + summary
   → ChevronRight rotates to 90°

3. User clicks "Hide history"
   → showHistory = false → timeline collapses
```

---

## 7. Mock Data Reference

### 7.1 Action Cards (5 total)

| ID | Type | Prospect | Sentiment | Due | Overdue? | Has Tones? | Has History? |
|----|------|----------|-----------|-----|----------|------------|--------------|
| 1  | email_response | Lovable | not_interested | Due in 18h | No | Yes (3) | Yes (3 items) |
| 2  | email_response | Lovable | not_interested | 6 days overdue | Yes | Yes (3) | Yes (2 items) |
| 3  | call_followup | Acme Corp | interested | Due in 19h | No | No | Yes (3 items) |
| 4  | call_followup | TechStart Inc | interested | Due in 18h | No | No | No |
| 5  | schedule_demo | Enterprise Co | interested | Due in 2 days | No | No | Yes (2 items) |

### 7.2 Attention Required Items (5 total)

| ID  | Type  | Prospect       | Confidence |
|------|-------|----------------|------------|
| ar1  | email | Marco Bianchi  | 82%        |
| ar2  | email | Sara Rossi     | 75%        |
| ar3  | email | Luca Ferretti  | 88%        |
| ar4  | email | Ritam Pramanik | 70%        |
| ar5  | call  | Elena Marchetti| 79%        |

---

## 8. Visual Design Tokens

### Color System (HSL-based CSS variables)

| Token                 | Usage                      |
|-----------------------|----------------------------|
| `--background`        | Page background            |
| `--foreground`        | Primary text               |
| `--card`              | Card backgrounds           |
| `--primary`           | Primary accent             |
| `--muted`             | Muted backgrounds          |
| `--muted-foreground`  | Secondary text             |
| `--accent`            | Accent highlights          |
| `--border`            | Borders                    |
| `--destructive`       | Error/overdue states       |
| `--forskale-green`    | Success, completion, call_followup type |
| `--forskale-teal`     | Teal accent, schedule_demo type |
| `--forskale-blue`     | Blue accent, email_response type |
| `--forskale-cyan`     | Overdue/attention indicators |
| `--sidebar-background`| Sidebar gradient end       |
| `--sidebar-accent`    | Sidebar gradient start     |
| `--sidebar-foreground`| Sidebar text               |
| `--atlas-urgent`      | Attention required states  |

### Typography Scale

| Element               | Size           | Weight  |
|-----------------------|----------------|---------|
| Page title (H1)       | text-2xl (24px)| Bold    |
| Section heading (H2)  | text-lg (18px) | Bold    |
| Card title (compact)  | text-sm (14px) | Bold    |
| Card title (expanded) | text-lg (18px) | Bold    |
| Body text             | text-sm (14px) | Normal  |
| Labels & metadata     | text-xs (12px) | Semibold|
| Eyebrow text          | text-[11px] or text-[10px] | Bold, uppercase, tracked |
| Tiny labels           | text-[10px] or text-[9px]  | Bold    |

---

## 9. API Contract Recommendations

When replacing mock data with real API calls, the backend should provide these endpoints:

### GET /api/actions
Returns list of action cards for the current user.

**Response**: `ActionCardData[]`

**Query Parameters**:
| Param     | Type                                         | Description          |
|-----------|----------------------------------------------|----------------------|
| `status`  | `"pending" | "overdue" | "completed"`         | Filter by status     |
| `sentiment` | `SentimentBadge`                            | Filter by sentiment  |
| `search`  | `string`                                     | Full-text search on title/prospect |

### PATCH /api/actions/:id/resolve
Marks an action as completed.

**Request Body**: None (or `{ resolvedAt: ISO8601 }`)
**Response**: Updated `ActionCardData`

### GET /api/actions/:id/draft
Returns AI-generated drafts for all tones.

**Response**:
```json
{
  "Professional": "...",
  "Warm": "...",
  "Direct": "..."
}
```

### POST /api/actions/:id/send
Sends the selected draft.

**Request Body**:
```json
{
  "tone": "Professional",
  "content": "...",   // Possibly edited by user
  "channel": "email"
}
```

### GET /api/attention-required
Returns overdue items needing intervention.

**Response**: `AttentionRequiredItem[]`

---

*End of specification. Generated from ForSkale Atlas frontend codebase.*
