# ForSkale – Complete Frontend Specification Document

> **Purpose**: This document describes every screen, component, interaction, data model, and visual behavior in the ForSkale Meeting Insight frontend application. A backend developer should be able to fully understand what data is needed, what APIs to build, and how every UI element behaves.

---

## Table of Contents

1. [Application Architecture Overview](#1-application-architecture-overview)
2. [Routing & Navigation](#2-routing--navigation)
3. [Data Models & TypeScript Interfaces](#3-data-models--typescript-interfaces)
4. [Global Layout: AppLayout](#4-global-layout-applayout)
5. [Left Navigation Sidebar (AppNavSidebar)](#5-left-navigation-sidebar-appnavsidebar)
6. [Meeting Insight Dashboard](#6-meeting-insight-dashboard)
7. [Call Insights Detail View](#7-call-insights-detail-view)
8. [Tab System](#8-tab-system)
9. [Evaluation Tab](#9-evaluation-tab)
10. [Enablement Tab](#10-enablement-tab)
11. [Smart Summary Tab](#11-smart-summary-tab)
12. [Meeting Templates Page](#12-meeting-templates-page)
13. [Transcript Panel](#13-transcript-panel)
14. [Strategy Modal](#14-strategy-modal)
15. [Reminder Modal](#15-reminder-modal)
16. [Internationalization (i18n)](#16-internationalization-i18n)
17. [Cognitive State & Interest Scoring](#17-cognitive-state--interest-scoring)
18. [Design System & Theming](#18-design-system--theming)
19. [State Management Summary](#19-state-management-summary)
20. [Required API Endpoints (Backend Recommendations)](#20-required-api-endpoints-backend-recommendations)

---

## 1. Application Architecture Overview

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui components

**Layout Structure**:
- The app has two primary views: **Meeting Insight Dashboard** (overview/list) and **Call Insights Detail** (single meeting analysis).
- A persistent left navigation sidebar (`AppNavSidebar`) is always visible.
- The detail view has an optional right-side Transcript Panel.

```
┌──────────┬──────────────────────────────────────────┐
│  App Nav │   Meeting Insight Dashboard              │
│  Sidebar │   OR                                     │
│  (240px) │   Call Detail (Header+Tabs) + Transcript │
└──────────┴──────────────────────────────────────────┘
```

All panels use `h-screen` with `overflow-hidden` — each panel manages its own scrolling.

**Current Data Source**: All data is **mock/hardcoded** in:
- `src/data/mockData.ts` – Call items, transcripts, playbook rules, templates, evaluation data
- `src/data/mockMeetings.ts` – Meeting list for the dashboard (uses `MeetingCall` type)
- `src/data/playbookAnalysisData.ts` – Multi-LLM analysis mock data

The backend needs to replace these with real API calls.

---

## 2. Routing & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Navigate` → `/call-insights` | Auto-redirect to main page |
| `/call-insights` | `CallInsights` | Main page: dashboard overview → call detail |
| `/meeting-templates` | `MeetingTemplates` | Template management page |
| `*` | `NotFound` | 404 page |

---

## 3. Data Models & TypeScript Interfaces

### Meeting List Model (`src/types/meeting.ts`)

```typescript
type EvalStatus = 'Evaluated' | 'Pending' | 'Processing';
type SourceType = 'Call' | 'CRM' | 'Both';
type CognitiveState =
  | 'Lost' | 'Attention' | 'Curiosity' | 'Interest'
  | 'Problem Recognition' | 'Trust' | 'Evaluation'
  | 'Validation' | 'Hard Commitment' | 'Decision'
  | 'Not Scored';

interface MeetingCall {
  id: string;
  title: string;
  company: string;
  date: string;              // ISO date string
  duration: string;           // e.g. "4:02"
  interestScore: number | null; // 0-100, null = not scored
  evalStatus: EvalStatus;
  sourceType: SourceType;
  actionCount: number;
  keyMoments: KeyMoment[];
  insightUnread: boolean;
  strategizeNotDone: boolean;
  freshlyCompleted?: boolean;
  freshInsight?: boolean;     // true = insight ready & user hasn't viewed yet
}

interface DateGroup {
  label: string;
  dateKey: string;
  meetings: MeetingCall[];
  expanded: boolean;
  freshInsightCount: number;
}
```

### Call Detail Models (`src/data/mockData.ts`)

- **CallItem**: Call metadata (id, title, date, duration, company, product, negotiationStage, dataSource, dataCompleteness)
- **TranscriptEntry**: Transcript lines (speaker, timestamp, text, color)
- **PlaybookRule**: Playbook evaluation rules with pass/fail, weights, and coaching suggestions
- **PerformanceMetric**: Performance ratings (Great!/Okay/Needs work)
- **CoachFeedback**: Coaching feedback items (title + description)
- **PlaybookTemplate**: Meeting templates with sections (id, name, category, sections[], isBuiltIn)

### Evaluation Models
- **MeetingEvaluation**: Full evaluation including outcome, strategic insights, and recommended actions
- **DealStage**: Pipeline stages (intro → discovery → demo → proposal → negotiation → closed)

### Smart Summary Models
- **DealEvolutionMeeting**: Timeline nodes showing meeting progression
- **ThenVsNow**: Comparison cards showing changes across meetings
- **ChangeAlert**: Strategic shift detection with severity levels and recommended actions
- **EnhancedTopic**: Discussion topics with evolution badges and sentiment trends
- **StrategicRecommendation**: Prioritized recommendations (critical/important/opportunity)
- **DealHealthMetrics**: Engagement, momentum, risk, and win probability scores

---

## 4. Global Layout: AppLayout

**Component**: `src/components/atlas/AppLayout.tsx`

Wraps every page. Renders the `AppNavSidebar` on the left and child content on the right.

---

## 5. Left Navigation Sidebar (AppNavSidebar)

**Component**: `src/components/call-insights/AppNavSidebar.tsx`

### Navigation Items (top to bottom):
1. **Home** – External link (premium capsule button)
2. **Meeting Intelligence** – External link
3. **Meeting Insight** – Active page indicator
4. **Strategy** – Opens "Coming Soon" modal (no navigation)
5. **Action Ready** – External link
6. **QnA Engine** – External link
7. **Performance** – External link
8. **Settings** – Hover-triggered submenu with:
   - Knowledge (external link)
   - Record (external link)
   - Meeting Templates (internal route `/meeting-templates`)
9. **Invite** – Placeholder button
10. **User profile** – Shows avatar, name, email

### Features:
- Collapsible sidebar (72px collapsed / 240px expanded)
- Collapse toggle appears on hover
- Settings submenu rendered via React Portal for z-index isolation

---

## 6. Meeting Insight Dashboard

**Component**: `src/pages/MeetingInsightDashboard.tsx`

The main overview screen shown when no specific meeting is selected. Displays all meetings with filtering and browsing capabilities.

### Top Bar:
- Title: "MEETING INSIGHT" (translatable)
- Language toggle (IT/EN) — controls all UI labels

### Personalisation Card:
**Component**: `src/components/meetInsight/PersonalisationCard.tsx`
- Shows the user's name with a personalized message
- If there's a fresh insight ready: shows the meeting card with a CTA
- If all caught up: shows a green "all clear" state

### Browse Navigation:
**Component**: `src/components/meetInsight/BrowseNav.tsx`

**Row A — Browse Mode + Search:**
- Browse mode pills: `This week` | `This month` | `All history`
- `Unviewed insights` pill with animated red dot and count
- Search bar (expandable, searches by title, company, date, score)

**Row B — Company Filter:**
- "All Companies" pill + per-company pills
- Company pills are **color-coded by average interest score**:
  - **80%+ (Green)**: `#639922` background `#EAF3DE`
  - **50-80% (Teal)**: `#1D9E75` background `#E1F5EE`
  - **30-50% (Amber)**: `#BA7517` background `#FAEEDA`
  - **20-30% (Orange)**: `#E97B1E` background `#FEF0E0`
  - **0-20% / Lost (Red)**: `#EF4444` background `red-500/10`
- Paginated (5 per page) with arrow navigation

### Date Group Accordion:
**Component**: `src/components/meetInsight/DateGroupAccordion.tsx`
- Groups meetings by date (Today, Yesterday, Mar 5 2026, etc.)
- Date labels are translated (Today→Oggi, Yesterday→Ieri in Italian)
- Shows fresh insight count badge per group
- Collapsible/expandable per group

### Meeting Card:
**Component**: `src/components/meetInsight/MeetingCard.tsx`
- Shows: title, company avatar, duration, cognitive state badge, eval status, source type icons
- Cognitive state is derived from interest score (see Section 17)
- Click opens the call detail view

### Company Timeline:
**Component**: `src/components/meetInsight/CompanyTimeline.tsx`
- Shown when a specific company is selected (not "All")
- Displays all meetings for that company in chronological order
- Date range header

---

## 7. Call Insights Detail View

**Component**: `src/pages/CallInsights.tsx` (same component, `selectedCall !== null` state)

### Header:
- "← Overview" back button (returns to dashboard)
- Meeting title (e.g., "Lavazza A Modo Mio – Introductory Commercial Discussion")
- Playbook execution badge (e.g., "79% of sales playbook executed")
- Date and speaker count
- Tab navigation

---

## 8. Tab System

Three tabs managed by state in `CallInsights.tsx`:

| Tab | Label (EN) | Label (IT) | Icon | Component |
|-----|-----------|-----------|------|-----------|
| `evaluation` | Evaluation | Valutazione | Target | `EvaluationTab` |
| `enablement` | Enablement | Formazione | GraduationCap | `EnablementTab` |
| `summary` | Smart Summary | Sintesi Intelligente | Sparkles ✨ | `SummaryTab` |

The Smart Summary tab has a tooltip: *"Cross-meeting intelligence that tracks deal evolution and detects strategic shifts"*

---

## 9. Evaluation Tab

**Component**: `src/components/call-insights/EvaluationTab.tsx`

### Card Order:
1. **Call Summary** – Outcome status (Successful/Neutral/Needs Attention), deal progression arrow, key moments timeline
2. **Next Actions** – Prioritized action items with timing badges, action buttons (Send Email / Add to Tasks), Set Reminder triggers, and Strategy integration card
3. **Why These Actions Matter** – Strategic insights with category badges, confidence bars, and AI confidence tooltips

### Integrated Components:
- **ReminderModal** (`src/components/call-insights/ReminderModal.tsx`) – Schedule reminders via in-app/email/Slack with timing presets
- **StrategyModal** – "Strategize Next Meeting" button opens the Strategy Coming Soon modal

---

## 10. Enablement Tab

**Component**: `src/components/call-insights/EnablementTab.tsx`

Header shows title "Enablement & Skills Development" left-aligned. Two sub-tab buttons are **centered** below the header:

1. **Feedback** (`FeedbackContent`, inline) – Performance metrics grid, AI coaching feedback (Strengths / Areas for Improvement), progress tracking with time-range filter
2. **Analyze Meeting** (`PlaybookTab`) – Automatically starts multi-LLM analysis on mount (no manual trigger button)

### Analyze Meeting Flow:
- Clicking the "Analyze Meeting" tab immediately launches the analysis modal (`AdvancedAnalysisModal`)
- States: `analyzing` → `complete` (no intermediate "initial" state)
- On completion: shows Deal Health Score card with semi-circle gauge, top methodology badge, coach summary, and top-3 methodology scores
- Action buttons: "View Full Coaching Report" (opens `DetailedAnalysisDashboard`), "Re-analyze", "Export Report"
- **DetailedAnalysisDashboard**: 7 sections including Deal Health Header, Action Plan, Key Behaviors, Sales Approaches, Unique Techniques, Conversation Effectiveness, Benchmarking
- **Model Consensus Panel**: Defaults collapsed, shows methodology and agreement level

---

## 11. Smart Summary Tab

**Component**: `src/components/call-insights/SummaryTab.tsx`

Cross-meeting intelligence engine with:

### Deal Health Dashboard:
- Horizontal progress bars: Engagement, Momentum, Risk Level, Win Probability
- Trend arrows (↗ up / → stable / ↘ down)

### Section 1: Deal Evolution
- Horizontal timeline of last 3-4 meetings
- "Then vs Now" comparison cards (Budget, Authority, Implementation)

### Section 2: Change Detection
- Strategic shift alerts with severity levels (critical/warning/info/positive)
- Previous vs current state comparison

### Section 3: Discussion Topics (Enhanced)
- Evolution badges: 🆕 NEW, 🔄 REVISITED, ✅ RESOLVED, ⚠️ SHIFTED, 📈 TRENDING
- Sentiment trend (improving/declining/stable)

### Section 4: Current Meeting Context
- Collapsed by default ("Raw data")
- Contains: Summary text, Key Takeaways, Next Steps, Questions & Objections

### Section 5: Strategic Direction
- 3 prioritized recommendations: 🔴 CRITICAL, 🟡 IMPORTANT, 🟢 OPPORTUNITY
- Each includes: Why, Impact, Timeline, Confidence score

---

## 12. Meeting Templates Page

**Component**: `src/pages/MeetingTemplates.tsx`

Standalone page at `/meeting-templates` accessible from Settings submenu.

Features:
- Category tabs (Sales, HR/Recruiting, Marketing, Strategy)
- Template grid with cards (name, creator, sections preview)
- Create, customize, and upload template modals
- Built-in vs custom template (personal/team) differentiation
- Search by name or section

---

## 13. Transcript Panel

**Component**: `src/components/call-insights/TranscriptPanel.tsx`

- Collapsible right panel (defaults collapsed)
- Speaker-color-coded entries with timestamps
- Search within transcript
- **TranscriptSuccessModal**: Shown on new transcripts with "View Transcript" CTA

---

## 14. Strategy Modal

**Component**: `src/components/call-insights/StrategyModal.tsx`

- "Coming Soon" preview modal
- Gradient header (forskale-green → forskale-teal → forskale-blue)
- Accessible: ESC, backdrop click, scroll lock
- Triggered from: Sidebar "Strategy" item + Evaluation tab "Strategize Next Meeting"

---

## 15. Reminder Modal

**Component**: `src/components/call-insights/ReminderModal.tsx`

- Schedule reminders for action items
- Channel selection: In-app, Email, Slack
- Timing presets: Tomorrow morning, In 2 hours, etc.
- Custom date/time option
- Triggered from Next Actions "Set Reminder" buttons

---

## 16. Internationalization (i18n)

**Files**: `src/i18n/translations.ts`, `src/i18n/LanguageContext.tsx`

### Supported Languages:
- **IT** (Italian) — default
- **EN** (English)

### How it works:
- Language is stored in React state in `CallInsights.tsx` and passed via `LanguageProvider` context
- Toggle switch in the top bar (IT/EN pills)
- Translation function `t(key, language)` looks up keys from a flat dictionary
- Components use `useT()` hook from `LanguageContext` to access translations

### Translated UI elements include:
- Top bar title, tab labels, evaluation section labels, enablement labels, summary labels
- Browse navigation (This week, This month, All history, Unviewed insights, Search)
- Company filter labels, date group labels (Today, Yesterday)
- Meeting card details, status labels, action buttons
- Personalisation card messages

### Backend implication:
- API responses should ideally support `Accept-Language` header or `?lang=` query param
- Alternatively, the frontend can handle translation of backend data

---

## 17. Cognitive State & Interest Scoring

**File**: `src/lib/meetingUtils.ts`

Interest scores (0-100) map to cognitive states displayed throughout the UI:

| Score Range | Cognitive State | Color |
|------------|----------------|-------|
| 0% | Lost | #EF4444 (Red) |
| 1-20% | Attention | #F97316 (Orange) |
| 21-30% | Curiosity | #FB923C (Light Orange) |
| 31-40% | Interest | #F59E0B (Amber) |
| 41-50% | Problem Recognition | #FBBF24 (Yellow-Amber) |
| 51-60% | Trust | #14B8A6 (Teal) |
| 61-70% | Evaluation | #0D9488 (Dark Teal) |
| 71-80% | Validation | #0F766E (Deep Teal) |
| 81-90% | Hard Commitment | #22C55E (Green) |
| 91-100% | Decision | #16A34A (Dark Green) |

These states are shown on:
- Meeting cards (badge with state label and score)
- Company pills (color-coded by average score)
- Company timeline nodes

---

## 18. Design System & Theming

### Brand Colors (HSL CSS variables):
- `--forskale-green`: Primary brand green
- `--forskale-teal`: Primary brand teal
- `--forskale-cyan`: Accent cyan
- `--forskale-blue`: Accent blue

### Status Colors:
- `--status-great`: Success/positive (maps to forskale-green)
- `destructive`: Error/negative (built-in)

### Company Pill Colors (by interest score):
- Green band (80%+): bg `#EAF3DE`, text `#27500A`, border `rgba(59,109,17,0.4)`
- Teal band (50-80%): bg `#E1F5EE`, text `#085041`, border `rgba(15,110,86,0.4)`
- Amber band (30-50%): bg `#FAEEDA`, text `#633806`, border `rgba(186,117,23,0.4)`
- Orange band (20-30%): bg `#FEF0E0`, text `#7A3D06`, border `rgba(233,123,30,0.4)`
- Red band (0-20%): bg `red-500/10`, text `red-700`, border `red-500/40`

### Typography:
- Font family: `font-heading` for titles, system sans-serif for body
- Heading hierarchy: `text-2xl` → `text-xl` → `text-base` → `text-sm` → `text-xs`

### Shadows:
- `shadow-card`: Standard card shadow
- `shadow-card-md`: Enhanced card shadow on hover

### Animations:
- `animate-fade-in`: Content reveal
- `animate-scale-in`: Submenu/modal entry
- `forskale-gradient-bg`: Brand gradient for active states

---

## 19. State Management Summary

All state is **local React state** (useState) within components. No global state management library.

Key state in `CallInsights.tsx`:
- `selectedCall`: Currently selected call ID (null = show dashboard)
- `activeTab`: Current tab (evaluation/enablement/summary)
- `transcriptCollapsed`: Transcript panel visibility
- `showTranscriptModal`: Transcript success modal state
- `strategyModalOpen`: Strategy modal state
- `language`: Current UI language (IT/EN)

Key state in `MeetingInsightDashboard.tsx`:
- `browseMode`: Current filter mode (week/month/all/unviewed)
- `readIds` / `strategizedIds` / `viewedIds`: Sets tracking user interactions
- `selectedCompany`: Company filter (string or 'all')
- `searchQuery`: Search text
- `groups`: Date-grouped meeting list with expand/collapse state

---

## 20. Required API Endpoints (Backend Recommendations)

### Meeting List & Dashboard
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/meetings` | GET | List meetings with filtering (date range, company, unviewed). Query params: `period=week\|month\|all`, `company=`, `unviewed=true`, `search=`, `lang=IT\|EN` |
| `/api/meetings/:id` | GET | Get full meeting detail |
| `/api/meetings/:id/mark-viewed` | POST | Mark meeting insight as viewed |

### Call Analysis
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calls/:id/transcript` | GET | Get transcript entries |
| `/api/calls/:id/evaluation` | GET | Get evaluation (outcome, insights, actions) |
| `/api/calls/:id/summary` | GET | Get smart summary data |
| `/api/calls/:id/deal-evolution` | GET | Get cross-meeting evolution data |
| `/api/calls/:id/change-detection` | GET | Get contradiction/shift alerts |
| `/api/calls/:id/strategic-direction` | GET | Get AI recommendations |
| `/api/calls/:id/deal-health` | GET | Get deal health metrics |
| `/api/calls/:id/playbook` | GET | Get playbook evaluation rules |
| `/api/calls/:id/playbook/analyze` | POST | Trigger multi-LLM analysis |
| `/api/calls/:id/feedback` | GET | Get performance metrics + coaching |

### Templates
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/templates` | GET | List playbook templates (filter by category) |
| `/api/templates` | POST | Create custom template |
| `/api/templates/:id` | PUT | Update template |
| `/api/templates/:id` | DELETE | Delete custom template |

### Actions & Reminders
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/actions/:id/remind` | POST | Schedule a reminder (channel: in-app/email/slack, timing) |
| `/api/actions/:id/complete` | PUT | Mark action as done |

### User Preferences
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/user/preferences` | GET/PUT | Language preference, default template, etc. |

---

## File Structure

```
src/
├── components/
│   ├── atlas/
│   │   └── AppLayout.tsx              # Global layout wrapper
│   ├── call-insights/
│   │   ├── AppNavSidebar.tsx          # Left navigation sidebar
│   │   ├── CallListSidebar.tsx        # Call list with filters (detail view)
│   │   ├── EvaluationTab.tsx          # Evaluation tab
│   │   ├── EnablementTab.tsx          # Enablement tab (feedback + playbook)
│   │   ├── FeedbackTab.tsx            # Performance feedback sub-tab
│   │   ├── PlaybookTab.tsx            # Playbook analysis sub-tab
│   │   ├── SummaryTab.tsx             # Smart Summary tab
│   │   ├── TranscriptPanel.tsx        # Right transcript panel
│   │   ├── TranscriptSuccessModal.tsx # New transcript CTA modal
│   │   ├── StrategyModal.tsx          # Strategy "Coming Soon" modal
│   │   ├── ReminderModal.tsx          # Reminder scheduling modal
│   │   ├── AdvancedAnalysisModal.tsx  # Multi-LLM analysis trigger
│   │   ├── AnalyzingPlaybookModal.tsx # Analysis loading state
│   │   ├── DetailedAnalysisDashboard.tsx # Full analysis results
│   │   ├── CreateTemplateDialog.tsx   # Quick template creation
│   │   └── TemplateEditor.tsx         # Template section editor
│   ├── meetInsight/
│   │   ├── BrowseNav.tsx              # Browse mode + company filter + search
│   │   ├── CompanyTimeline.tsx        # Company-filtered timeline view
│   │   ├── DateGroupAccordion.tsx     # Date-grouped meeting list
│   │   ├── MeetingCard.tsx            # Individual meeting card
│   │   └── PersonalisationCard.tsx    # Welcome/status personalisation
│   ├── templates/
│   │   ├── CreateTemplateModal.tsx    # Full template creation modal
│   │   ├── CustomizeTemplateModal.tsx # Template customization modal
│   │   └── UploadTemplateModal.tsx    # Template upload modal
│   └── ui/                            # shadcn/ui component library
├── data/
│   ├── mockData.ts                    # Call detail mock data + interfaces
│   ├── mockMeetings.ts                # Dashboard meeting list mock data
│   └── playbookAnalysisData.ts        # Multi-LLM analysis mock data
├── i18n/
│   ├── LanguageContext.tsx            # React context for language
│   └── translations.ts               # IT/EN translation dictionary
├── types/
│   └── meeting.ts                     # MeetingCall, DateGroup, etc. interfaces
├── pages/
│   ├── CallInsights.tsx               # Main page (dashboard + detail)
│   ├── MeetingInsightDashboard.tsx    # Dashboard overview component
│   ├── MeetingTemplates.tsx           # Template management page
│   └── NotFound.tsx                   # 404 page
├── hooks/
│   ├── use-mobile.tsx                 # Mobile detection
│   ├── use-toast.ts                   # Toast notifications
│   └── useFrameworkScoring.ts         # Playbook scoring logic
└── lib/
    ├── meetingUtils.ts                # Utility functions (date grouping, cognitive states, company colors)
    └── utils.ts                       # General utilities (cn, etc.)
```
