# ForSkale – Complete Frontend Specification Document

> **Purpose**: This document describes every screen, component, interaction, data model, and visual behavior in the ForSkale Call Insights frontend application. A backend developer should be able to fully understand what data is needed, what APIs to build, and how every UI element behaves.

---

## Table of Contents

1. [Application Architecture Overview](#1-application-architecture-overview)
2. [Routing & Navigation](#2-routing--navigation)
3. [Data Models & TypeScript Interfaces](#3-data-models--typescript-interfaces)
4. [Global Layout: AppLayout](#4-global-layout-applayout)
5. [Left Navigation Sidebar (AppNavSidebar)](#5-left-navigation-sidebar-appnavsidebar)
6. [Call List Sidebar (CallListSidebar)](#6-call-list-sidebar-calllistsidebar)
7. [Main Content Area Header](#7-main-content-area-header)
8. [Tab System](#8-tab-system)
9. [Evaluation Tab](#9-evaluation-tab)
10. [Enablement Tab](#10-enablement-tab)
11. [Smart Summary Tab](#11-smart-summary-tab)
12. [Meeting Templates Page](#12-meeting-templates-page)
13. [Transcript Panel](#13-transcript-panel)
14. [Strategy Modal](#14-strategy-modal)
15. [Reminder Modal](#15-reminder-modal)
16. [Design System & Theming](#16-design-system--theming)
17. [State Management Summary](#17-state-management-summary)
18. [Required API Endpoints (Backend Recommendations)](#18-required-api-endpoints-backend-recommendations)

---

## 1. Application Architecture Overview

**Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui components

**Layout Structure** (left to right):
```
┌──────────┬────────────┬──────────────────────────────┬─────────────┐
│  App Nav │  Call List  │      Main Content Area       │  Transcript │
│  Sidebar │  Sidebar   │  (Header + Tabs + Content)   │   Panel     │
│  (240px) │  (280px)   │       (flex-1)               │  (340px)    │
└──────────┴────────────┴──────────────────────────────┴─────────────┘
```

All four panels are **independently collapsible**. The app uses `h-screen` with `overflow-hidden` to prevent body scrolling – each panel manages its own scrolling.

**Current Data Source**: All data is **mock/hardcoded** in `src/data/mockData.ts` and `src/data/playbookAnalysisData.ts`. The backend needs to replace these with real API calls.

---

## 2. Routing & Navigation

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Navigate` → `/call-insights` | Auto-redirect to main page |
| `/call-insights` | `CallInsights` | Main application page |
| `/meeting-templates` | `MeetingTemplates` | Template management page |
| `*` | `NotFound` | 404 page |

---

## 3. Data Models & TypeScript Interfaces

All interfaces are defined in `src/data/mockData.ts`.

### Core Models
- **CallItem**: Call metadata (id, title, date, duration, company, product, negotiationStage, dataSource, dataCompleteness)
- **TranscriptEntry**: Transcript lines (speaker, timestamp, text, color)
- **PlaybookRule**: Playbook evaluation rules with pass/fail, weights, and coaching suggestions
- **PerformanceMetric**: Performance ratings (Great!/Okay/Needs work)
- **CoachFeedback**: Coaching feedback items (title + description)
- **PlaybookTemplate**: Meeting templates with sections

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
1. **Meeting Intelligence** – Active state indicator
2. **Meeting Insight** – Routes to `/call-insights`
3. **Strategy** – Opens "Coming Soon" modal (no navigation)
4. **Action Ready** – External link placeholder
5. **QnA Engine** – External link placeholder
6. **Performance** – External link placeholder
7. **Settings** – Hover-triggered submenu (see `Sidebar_Settings_Changes.md`)

### Strategy Modal
- Triggered by clicking "Strategy" nav item OR "Strategize Next Meeting" button in Evaluation tab
- Displays a "Coming Soon" preview with feature list
- Full accessibility: ESC close, backdrop click, focus management
- Component: `src/components/call-insights/StrategyModal.tsx`

---

## 6. Call List Sidebar (CallListSidebar)

**Component**: `src/components/call-insights/CallListSidebar.tsx`

Features:
- Search bar with text filtering
- Flowchart-style timeline with negotiation stage nodes
- Filter panel (2-column grid) for Company, Product, Stage, Data Source
- Evaluation status badges per call
- Collapsible with smooth transitions

---

## 7. Main Content Area Header

Displays:
- "← Calls" back button (toggles call list)
- Meeting title
- Playbook execution badge (e.g., "79% of sales playbook executed")
- Date and speaker count
- Tab navigation

---

## 8. Tab System

Three tabs managed by state in `CallInsights.tsx`:

| Tab | Label | Icon | Component |
|-----|-------|------|-----------|
| `evaluation` | Evaluation | Target | `EvaluationTab` |
| `enablement` | Enablement | GraduationCap | `EnablementTab` |
| `summary` | Smart Summary | Sparkles ✨ | `SummaryTab` |

The Smart Summary tab has a tooltip on hover: *"Cross-meeting intelligence that tracks deal evolution and detects strategic shifts"*

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

Two sub-sections toggled by internal tabs:
1. **Feedback** (`FeedbackTab`) – Performance metrics grid, coaching feedback (What went well / Where to improve)
2. **Playbook** (`PlaybookTab`) – Template selection, rule-by-rule analysis, multi-LLM analysis engine

### Playbook Analysis Flow:
- "Analyze this meeting" button triggers multi-LLM consensus engine
- States: Loading → Compact results → Minimized
- **DetailedAnalysisDashboard**: 7 sections including Deal Health Header, Action Plan, Key Behaviors, Sales Approaches, Unique Techniques, Conversation Effectiveness, Benchmarking
- **Model Consensus Panel**: Defaults collapsed, shows methodology and agreement level

---

## 11. Smart Summary Tab

**Component**: `src/components/call-insights/SummaryTab.tsx`

Transformed from a static recap into the "brain of the system" – cross-meeting intelligence engine.

### Header:
- Title: "Smart Summary" with ✨ Sparkles icon and "Smart S" badge
- Subtitle: "Multi-layered deal intelligence"
- CRM sync status indicator: "Synced with CRM • Last updated: 2 min ago"

### Deal Health Dashboard:
- Horizontal progress bars: Engagement, Momentum, Risk Level, Win Probability
- Trend arrows (↗ up / → stable / ↘ down)
- Color-coded by health status

### Section 1: Deal Evolution
- Horizontal timeline of last 3-4 meetings with numbered nodes
- Current meeting highlighted with forskale-teal accent
- "Then vs Now" comparison cards for key topics (Budget, Authority, Implementation)
- Visual indicators: ✅ Green (positive), ⚠️ Amber (concerning), 🔄 Blue (evolution), ❌ Red (negative)

### Section 2: Change Detection
- Strategic shift alerts with severity levels (critical/warning/info/positive)
- Previous vs current state comparison
- Impact analysis text
- Recommended actions list

### Section 3: Discussion Topics (Enhanced)
- Evolution badges per topic: 🆕 NEW, 🔄 REVISITED, ✅ RESOLVED, ⚠️ SHIFTED, 📈 TRENDING
- Meeting frequency count
- Sentiment trend (improving/declining/stable)
- Expandable timeline with cross-meeting quotes and resolution status

### Section 4: Current Meeting Context
- Collapsed by default (labeled "Raw data")
- Contains original summary data: Summary text, Key Takeaways, Next Steps, Questions & Objections

### Section 5: Strategic Direction
- Compass icon with gradient border card
- 3 prioritized recommendations: 🔴 CRITICAL, 🟡 IMPORTANT, 🟢 OPPORTUNITY
- Each includes: Why, Impact, Timeline, Confidence score with progress bar

---

## 12. Meeting Templates Page

**Component**: `src/pages/MeetingTemplates.tsx`

Standalone page at `/meeting-templates` accessible from Settings submenu.

Features:
- Category tabs (Sales, HR/Recruiting, Marketing, Strategy)
- Template grid with cards
- Create, customize, and upload template modals
- Built-in vs custom template differentiation

---

## 13. Transcript Panel

**Component**: `src/components/call-insights/TranscriptPanel.tsx`

- Collapsible right panel (defaults collapsed)
- Speaker-color-coded entries with timestamps
- Search within transcript
- Click timestamps to reference
- **TranscriptSuccessModal**: Shown on new transcripts with "View Transcript" CTA

---

## 14. Strategy Modal

**Component**: `src/components/call-insights/StrategyModal.tsx`

- "Coming Soon" preview modal
- Gradient header (forskale-green → forskale-blue)
- Feature preview list with Sparkles icons
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

## 16. Design System & Theming

### Brand Colors (HSL CSS variables):
- `--forskale-green`: Primary brand green
- `--forskale-teal`: Primary brand teal
- `--forskale-cyan`: Accent cyan
- `--forskale-blue`: Accent blue

### Status Colors:
- `--status-great`: Success/positive (maps to forskale-green)
- `destructive`: Error/negative (built-in)

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

## 17. State Management Summary

All state is **local React state** (useState) within components. No global state management library.

Key state in `CallInsights.tsx`:
- `selectedCall`: Currently selected call ID
- `activeTab`: Current tab (evaluation/enablement/summary)
- `callListCollapsed` / `transcriptCollapsed`: Panel visibility
- `strategyModalOpen`: Strategy modal state (shared between sidebar + evaluation tab)

---

## 18. Required API Endpoints (Backend Recommendations)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/calls` | GET | List calls with filtering/pagination |
| `/api/calls/:id` | GET | Get call details + metadata |
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
| `/api/templates` | GET | List playbook templates |
| `/api/templates` | POST | Create custom template |
| `/api/templates/:id` | PUT | Update template |
| `/api/templates/:id` | DELETE | Delete custom template |
| `/api/actions/:id/remind` | POST | Schedule a reminder |
| `/api/actions/:id/complete` | PUT | Mark action as done |

---

## File Structure

```
src/
├── components/
│   ├── atlas/
│   │   └── AppLayout.tsx              # Global layout wrapper
│   ├── call-insights/
│   │   ├── AppNavSidebar.tsx          # Left navigation sidebar
│   │   ├── CallListSidebar.tsx        # Call list with filters
│   │   ├── EvaluationTab.tsx          # Evaluation tab (actions + insights)
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
│   │   ├── PlaybookTemplateManager.tsx   # In-call template selector
│   │   ├── CreateTemplateDialog.tsx      # Quick template creation
│   │   └── TemplateEditor.tsx            # Template section editor
│   ├── templates/
│   │   ├── CreateTemplateModal.tsx     # Full template creation modal
│   │   ├── CustomizeTemplateModal.tsx  # Template customization modal
│   │   └── UploadTemplateModal.tsx     # Template upload modal
│   └── ui/                            # shadcn/ui component library
├── data/
│   ├── mockData.ts                    # All mock data + interfaces
│   └── playbookAnalysisData.ts        # Multi-LLM analysis mock data
├── pages/
│   ├── CallInsights.tsx               # Main page
│   ├── MeetingTemplates.tsx           # Template management page
│   └── NotFound.tsx                   # 404 page
├── hooks/
│   ├── use-mobile.tsx                 # Mobile detection
│   ├── use-toast.ts                   # Toast notifications
│   └── useFrameworkScoring.ts         # Playbook scoring logic
└── lib/
    └── utils.ts                       # Utility functions (cn, etc.)
```
