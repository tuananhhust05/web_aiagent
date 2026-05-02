# ForSkale Meeting Intelligence — Complete Frontend Specification

> **Purpose**: This document describes every UI component, user interaction, state change, data flow, and conditional logic in the ForSkale Meeting Intelligence frontend. A backend developer reading this should be able to understand exactly what data the frontend needs, what API endpoints to build, and what happens on every user action.

---

## Table of Contents

1. [Application Architecture](#1-application-architecture)
2. [Page Load Sequence](#2-page-load-sequence)
3. [Sidebar — Navigation & Actions](#3-sidebar--navigation--actions)
4. [Calendar View — Main Panel](#4-calendar-view--main-panel)
5. [Calendar Refresh Popup](#5-calendar-refresh-popup)
6. [Contact Card — Meeting Detail Panel](#6-contact-card--meeting-detail-panel)
7. [Recording Consent Dialog](#7-recording-consent-dialog)
8. [Enrichment Flow](#8-enrichment-flow)
9. [Add Profile Dialog (Personal Email Fallback)](#9-add-profile-dialog-personal-email-fallback)
10. [Enriched Profile Card](#10-enriched-profile-card)
11. [Registration Wizard](#11-registration-wizard)
12. [Complete Data Models](#12-complete-data-models)
13. [State Management Summary](#13-state-management-summary)
14. [API Endpoints Needed](#14-api-endpoints-needed)
15. [User Flow Diagrams](#15-user-flow-diagrams)

---

## 1. Application Architecture

### Layout Structure

```
┌──────────────┬──────────────────────────────────────────────────┐
│              │                                                  │
│   Sidebar    │              Main Content Area                   │
│   (fixed,    │  ┌─────────────────┬──────────┬───────────────┐  │
│   collapsible│  │  Calendar View  │ Contact  │  Enriched     │  │
│   240px /    │  │  (scrollable    │ Card     │  Profile Card  │  │
│   72px)      │  │   grid)         │ (380px)  │  (420px)      │  │
│              │  └─────────────────┴──────────┴───────────────┘  │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

- **Full viewport height** (`100vh`), no page-level scroll
- Sidebar + main area in a horizontal flex layout
- Contact Card slides in from right when a meeting is clicked (380px wide)
- Enriched Profile Card appears beside Contact Card (additional 420px panel)
- All panels scroll independently

### Component Hierarchy

```
Index (page)
├── AppLayout (wrapper)
│   ├── AtlasSidebar (left sidebar)
│   ├── CalendarView (main calendar grid)
│   ├── CalendarRefreshPopup (floating tooltip, dismissible)
│   └── ContactCard (right panel, conditional)
│       ├── EnrichmentLoadingModal (fullscreen overlay, conditional)
│       ├── EnrichedProfileCard (additional right panel, conditional)
│       └── AddProfileDialog (modal dialog, conditional)
├── RegistrationWizard (modal overlay, first-time)
└── RecordingConsent (modal dialog, conditional)
```

### File Map

| Component | File | Purpose |
|-----------|------|---------|
| `Index` | `src/pages/Index.tsx` | Page orchestrator — manages all top-level state |
| `AppLayout` | `src/components/atlas/AppLayout.tsx` | Layout wrapper (sidebar + content) |
| `AtlasSidebar` | `src/components/atlas/Sidebar.tsx` | Collapsible navigation sidebar |
| `CalendarView` | `src/components/atlas/CalendarView.tsx` | Weekly/monthly calendar grid |
| `ContactCard` | `src/components/atlas/ContactCard.tsx` | Meeting details + participants + intelligence |
| `EnrichedProfileCard` | `src/components/atlas/EnrichedProfileCard.tsx` | Full prospect intelligence after enrichment |
| `EnrichmentLoadingModal` | `src/components/atlas/EnrichmentLoadingModal.tsx` | Animated loading during enrichment |
| `AddProfileDialog` | `src/components/atlas/AddProfileDialog.tsx` | LinkedIn URL input for personal-email participants |
| `RecordingConsent` | `src/components/atlas/RecordingConsent.tsx` | Legal consent before bot recording |
| `RegistrationWizard` | `src/components/atlas/RegistrationWizard.tsx` | First-time calendar connection modal |
| `CalendarRefreshPopup` | `src/components/atlas/CalendarRefreshPopup.tsx` | Sync reminder tooltip |

---

## 2. Page Load Sequence

### What happens when the page loads:

1. **`Index` component mounts** → immediately sets `showRegistration = true`
2. **Registration Wizard modal opens** (blocks interaction with calendar)
3. **Calendar View renders** behind the modal with mock meeting data
4. **Calendar Refresh Popup appears** (floating tooltip at top-center)
5. User clicks "Grant Permissions & Continue" → wizard closes → calendar is fully interactive

### State initialized on mount:

| State Variable | Initial Value | Purpose |
|---------------|---------------|---------|
| `selectedMeeting` | `null` | Currently clicked meeting |
| `showRegistration` | `false` → `true` (via useEffect) | Controls Registration Wizard visibility |
| `showConsent` | `false` | Controls Recording Consent dialog |
| `showRefreshTip` | `true` | Controls Calendar Refresh Popup |

---

## 3. Sidebar — Navigation & Actions

### Structure (top to bottom):

#### 3.1 Logo Header
- ForSkale logo image (64×64px) with white glow drop-shadow
- Brand text "ForSkale" (hidden when collapsed)

#### 3.2 Collapse/Expand Toggle
- **Location**: Floating white circle at right edge of sidebar (`absolute top-16 -right-4`)
- **Visibility**: Only visible when sidebar is hovered (`invisible` → `visible` on group hover)
- **Click action**: Toggles `collapsed` state between `true`/`false`
- **Visual**: ChevronLeft icon, rotates 180° when collapsed
- **Expanded width**: 240px (`w-60`)
- **Collapsed width**: 72px (`w-[72px]`)
- **Transition**: 300ms ease-in-out

#### 3.3 Record Button (Primary CTA)
- **Click action**: Currently no handler (placeholder for future recording feature)
- **Visual**: Full-width gradient button (green → teal → blue)
- **Icon**: `Radio` (always visible)
- **Label**: "Record" (hidden when collapsed)
- **Backend need**: Start recording session API

#### 3.4 Navigation Links

| # | Icon | Label | Active? | Click Action |
|---|------|-------|---------|--------------|
| 1 | `CalendarDays` | Meeting Intelligence | ✅ Default active | Navigate to Meeting Intelligence page |
| 2 | `Video` | Meeting Insights | ❌ | Navigate to Meeting Insights page |
| 3 | `BarChart3` | Performance | ❌ | Navigate to Performance page |
| 4 | `ClipboardCheck` | Action Ready | ❌ | Navigate to Action Ready page |
| 5 | `HelpCircle` | Q&A Engine | ❌ | Navigate to Q&A Engine page |
| 6 | `BookOpen` | Knowledge | ❌ | Navigate to Knowledge page |

**Active item indicators**:
- Background highlight (`bg-sidebar-accent`)
- Text color change (`text-sidebar-accent-foreground`)
- Left accent bar: 3px wide vertical gradient stripe (green → teal)

**Currently**: Navigation items are buttons with no routing — only "Meeting Intelligence" is styled as active.

#### 3.5 Bottom Section
- **Invite button**: `UserPlus` icon + "Invite" label
  - **Click action**: Currently no handler (needs invite flow)
  - **Backend need**: Team invitation API
- **User card**: Avatar circle with user initials + name + email
  - **Currently hardcoded**: "U", "User", "user@example.com"
  - **Backend need**: Current user profile endpoint

---

## 4. Calendar View — Main Panel

### 4.1 Header Bar Controls

#### View Toggle (week/month)
- **State**: `view` — `"week"` (default) or `"month"`
- **Click "week"**: Sets `view = "week"`, active button gets gradient styling
- **Click "month"**: Sets `view = "month"`, active button gets gradient styling
- **Currently**: Only week view is implemented; month view renders same grid

#### Date Navigator
- **Display**: "Mar 2 – 8, 2026" (currently hardcoded)
- **Left arrow click**: Currently no handler (needs date navigation logic)
- **Right arrow click**: Currently no handler (needs date navigation logic)
- **Backend need**: Fetch meetings for a given date range

#### Sync Calendar Button
- **Click action**:
  1. Sets `syncing = true` (shows spinner animation on RefreshCw icon, text changes to "Syncing…")
  2. Calls `onSyncClick()` → parent triggers `toast.success("Calendar synced successfully")`
  3. After 2000ms timeout, sets `syncing = false` (spinner stops, text returns to "Sync Calendar")
  4. Button is disabled while syncing
- **Backend need**: Calendar sync API endpoint (Google Calendar OAuth)

### 4.2 Calendar Grid

#### Grid Structure
- **Time gutter**: Left column (80px wide) showing hours 7:00 AM – 8:00 PM
- **Day columns**: 7 columns (Mon–Sun), each with a header showing day abbreviation + date number
- **Row height**: 64px per hour slot
- **Today indicator**: Tuesday (index 1) has special styling — gradient background on date circle, teal-colored day label

#### Meeting Blocks

Each meeting renders as an absolutely-positioned card within its day column:
- **Position**: `top = (startHour - 7) * 64px`
- **Height**: `duration * 64 - 4px`
- **Left border color** by meeting type:
  - `discovery` → teal (`border-l-forskale-teal`)
  - `renewal` → green (`border-l-forskale-green`)
  - `internal` → cyan (`border-l-cal-cyan`)
- **Content**: Meeting title (truncated, first part before "—") + time range
- **Selected state**: Ring highlight + shadow when this meeting's Contact Card is open

#### Click Action on Meeting Block
1. Calls `onMeetingClick(meeting)` → parent sets `selectedMeeting = meeting`
2. Contact Card panel slides in from the right
3. Meeting block gets selected styling (ring + shadow)

### 4.3 Mock Meeting Data (Currently Hardcoded)

| ID | Title | Time | Day | Type |
|----|-------|------|-----|------|
| 1 | Lavazza A Modo Mio — Discussion and Pricing Review | 1:00 PM - 2:00 PM | Mon | renewal |
| 2 | Nova Consulting — Discovery Call | 10:00 AM - 11:00 AM | Tue | discovery |
| 3 | Barilla Group — Product Demo | 2:00 PM - 3:30 PM | Wed | discovery |
| 4 | Ferrero SpA — Contract Negotiation | 11:00 AM - 12:00 PM | Thu | internal |
| 5 | Pirelli — Q1 Strategy Sync | 3:00 PM - 4:00 PM | Fri | renewal |
| 6 | Marco Verdi — Freelance Consultation | 9:00 AM - 10:00 AM | Fri | discovery |

**Backend need**: `GET /meetings?start=<date>&end=<date>` → returns array of meetings with id, title, time, startHour, duration, dayIndex, type

---

## 5. Calendar Refresh Popup

### Visibility Logic
- Shown when `showRefreshTip = true` (default on page load)
- Positioned: Absolutely centered at top of main content, below header

### User Actions

| Action | What Happens |
|--------|-------------|
| Click "I got it, don't show this again" | Hides popup permanently — sets both local `visible = false` AND calls `onDismissPermanent()` which sets parent `showRefreshTip = false` |
| Click X (close) button | Hides popup for this session only (`visible = false`) — does NOT call `onDismissPermanent`, so it will reappear on next page load |

**Backend need**: User preference storage to persist "don't show again" across sessions

---

## 6. Contact Card — Meeting Detail Panel

### When it appears
- Opens when any meeting block is clicked in the calendar
- Width: 380px, slides in from right
- Closes when X button is clicked → `selectedMeeting = null`

### 6.1 Header Section

**Displays**:
- Meeting title (text before "—" in the full title)
- Time range (e.g., "1:00 PM - 2:00 PM")

**Action Buttons**:

| Button | Style | Click Action |
|--------|-------|-------------|
| **Join Meeting** | Primary gradient (green→teal→blue) | Currently no handler. **Backend need**: Return Google Meet link for the meeting |
| **Bot Join** | Outlined teal border | Calls `onBotJoin()` → parent sets `showConsent = true` → Recording Consent dialog opens |

### 6.2 Data Selection Logic

The Contact Card uses **different mock data based on meeting ID**:

```
if (meeting.id === "6")  →  Use GMAIL_MOCK_DATA (personal email participant)
else                     →  Use MOCK_DATA (corporate email participants)
```

This distinction is critical — it drives different UI behaviors for enrichment.

### 6.3 Primary Contact Section

Displays:
- **Name**: e.g., "Luca Bianchi"
- **Job Title**: e.g., "Head of Operations and Procurement"
- **Email**: e.g., "luca.bianchi@novaconsulting.it"

**Backend need**: `GET /meetings/{id}/primary-contact`

### 6.4 Participants Section

Each participant row shows:
- **Avatar**: Circle with initials (first letter of each name part)
- **Name**: Full name
- **Email**: Full email
- **Warning** (conditional): "Personal email — auto-enrich unavailable" shown when `participant.isGmail === true` AND not yet enriched

**Action buttons per participant** (conditional logic):

```
if (participant is enriched) →  Show "View" button (teal outline)
    Click: Opens EnrichedProfileCard panel

else if (participant.isGmail === true) →  Show disabled "Enrich" button + "Add Profile" button
    Disabled Enrich: Shows tooltip "Cannot auto-enrich personal email. Use 'Add Profile' instead."
    Add Profile click: Opens AddProfileDialog modal

else →  Show "Enrich" button (primary gradient)
    Click: Starts enrichment flow (see Section 8)
```

**Backend need**: `GET /meetings/{id}/participants` → returns array with name, email, isGmail flag

### 6.5 Company Profile Section

| Field | Example | Gmail Fallback |
|-------|---------|---------------|
| Company Name | Nova Consulting | "Unknown" |
| Industry | Professional Services – Management Consulting | "Unknown" |
| Size | 48 employees | "Unknown" |
| Revenue | €6-8M | "Unknown" |
| Location | Milan, Italy | "Unknown" |
| Founded | 2016 | "Unknown" |
| Website | www.novaconsulting.it | "N/A" |
| Description | "Milan-based management consulting firm..." | "Company information unavailable — participant registered with a personal email address." |

**Backend need**: `GET /companies/{domain}` → returns company profile data, or "Unknown" values for personal emails

### 6.6 Before You Join — AI Intelligence (Collapsible Sections)

Three collapsible accordion sections (all **open by default**):

#### Key Points
- Color theme: Primary (teal)
- Icon: `Lightbulb`
- Content: Bullet list of intelligence points
- Example: "Prospect mentioned budget freeze in last interaction"

#### Risks & Open Questions
- Color theme: Warning (amber)
- Icon: `AlertTriangle`
- Content: Bullet list of risks
- Example: "Budget constraints may delay procurement decision"

#### Suggested Angle
- Color theme: Success (green)
- Icon: `Sparkles`
- Content: Single paragraph of suggested approach
- Example: "Focus on ROI and cost-saving narrative..."

**Click action on each section header**: Toggles open/closed (local state per section)

**Backend need**: `GET /meetings/{id}/intelligence` → returns keyPoints[], risks[], suggestedAngle

### 6.7 Deal Context

- **Displays**: Current pipeline stage as a dropdown button (e.g., "Discovery")
- **Click**: Opens a dropdown menu with 6 stage options:
  1. Discovery
  2. Demo
  3. Proposal
  4. Negotiation
  5. Closed Won
  6. Closed Lost
- **Select a stage**: Updates local `dealStage` state, closes dropdown
- **Backend need**: `GET /deals/{meetingId}/stage` and `PUT /deals/{meetingId}/stage`

### 6.8 Interaction History

Chronological list of past interactions:

| Field | Example |
|-------|---------|
| Type badge | "Meeting" or "Email" |
| Date | "Feb 9, 2026" |
| Summary | "Initial discovery call — discussed pain points..." |
| Link (optional) | "Open meeting page" → opens URL in new tab |

**Backend need**: `GET /contacts/{email}/interactions` → returns array with type, date, summary, link?

### 6.9 Internal State Management

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| `dealStage` | `string` | From data | Current pipeline stage |
| `showStageDropdown` | `boolean` | `false` | Controls deal stage dropdown visibility |
| `enrichingParticipant` | `string \| null` | `null` | Name of participant currently being enriched |
| `enrichedProfiles` | `Set<string>` | `new Set()` | Set of participant names that have been enriched |
| `viewingProfile` | `string \| null` | `null` | Name of participant whose enriched profile is being viewed |
| `addProfileTarget` | `string \| null` | `null` | Name of participant for Add Profile dialog |

---

## 7. Recording Consent Dialog

### Trigger
- User clicks "Bot Join" button on Contact Card header
- Parent sets `showConsent = true`

### Content (Non-dismissible — cannot close by pressing Escape)
- **Icon**: AlertTriangle in red circle
- **Title**: "Recording Consent Required"
- **Body**: Legal disclaimer box with:
  - "Recording and AI processing to be enabled."
  - User responsibilities (3 bullet points):
    1. Informing ALL participants that recording is active
    2. Obtaining valid consent from ALL participants
    3. Ensuring compliance with applicable privacy laws
  - "Responsibility for consent lies entirely with you."
  - "ForSkale is not responsible." (bold)

### Actions

| Button | Style | Click Action |
|--------|-------|-------------|
| **Do Not Proceed** | Red outline/cancel | 1. Sets `showConsent = false` 2. Shows toast: `toast.info("Left meeting")` |
| **I Understand — Continue** | Primary solid | 1. Sets `showConsent = false` 2. Shows toast: `toast.success("Recording consent acknowledged")` |

**Backend need**: `POST /meetings/{id}/bot-join` — only called after consent is accepted. Should initiate bot joining the meeting.

---

## 8. Enrichment Flow

### 8.1 Trigger
User clicks "Enrich" button on a participant row in the Contact Card.

### 8.2 Sequence of Events

```
1. User clicks "Enrich" on participant "Luca Bianchi"
2. ContactCard sets enrichingParticipant = "Luca Bianchi"
3. EnrichmentLoadingModal opens (fullscreen dark overlay)
4. Animated progress bar runs 0% → 100% over ~3 seconds
5. Four sequential stages animate:
   - Stage 1: "Connecting to LinkedIn..." (0% → 25%)
   - Stage 2: "Extracting profile data..." (25% → 45%)
   - Stage 3: "Analyzing behavioral patterns..." (45% → 80%)
   - Stage 4: "Generating insights..." (80% → 100%)
6. On reaching 100%: isCompleted = true
7. After 800ms delay: onComplete() fires
8. ContactCard receives onComplete:
   a. Adds participant name to enrichedProfiles Set
   b. Sets enrichingParticipant = null (closes modal)
   c. Sets viewingProfile = participant name (opens EnrichedProfileCard)
9. EnrichedProfileCard panel appears beside the Contact Card
```

### 8.3 Loading Modal Details

- **Header**: 3 animated progress dots (active dot is wider with gradient)
- **Close button**: X button in top-right (calls `onClose` → sets `enrichingParticipant = null`)
- **Center animation**: LinkedIn logo with pulsing ring animations
- **Progress bar**: Gradient bar (green → teal → blue) with shimmer effect
- **Progress text**: "0%" / "{current}%" / "100%"
- **Step list**: 4 steps shown vertically with icons:
  1. `Link2` — "Connecting to LinkedIn..."
  2. `User` — "Extracting profile data..."
  3. `Brain` — "Analyzing behavioral patterns..."
  4. `Sparkles` — "Generating insights..."
- **Step states**:
  - Active: Gradient circle icon with pulse animation, bold white text
  - Completed: Green circle with checkmark, green text
  - Pending: Muted circle and text
- **Animation**: easeInOutCubic easing over 3000ms total duration

**Backend need**: `POST /participants/{email}/enrich` → triggers LinkedIn scraping + AI analysis. Could return a job ID for polling, or use websockets for progress updates.

---

## 9. Add Profile Dialog (Personal Email Fallback)

### Trigger
User clicks "Add Profile" button on a participant with a personal email (isGmail = true).

### Dialog Content
- **Title**: "Add Profile for {participantName}" with LinkedIn icon
- **Description**: Explains why manual addition is needed (personal email → can't auto-find LinkedIn)
- **Input field**: "LinkedIn Profile URL" with placeholder `https://linkedin.com/in/username`
- **Validation**: URL must contain `linkedin.com/in/` to enable submit button

### Actions

| Button | Click Action |
|--------|-------------|
| **Cancel** | Closes dialog, sets `addProfileTarget = null` |
| **Add Profile** (disabled until valid URL) | 1. Shows toast: `"LinkedIn profile linked for {name}"` 2. Closes dialog (`addProfileTarget = null`) 3. Immediately starts enrichment: sets `enrichingParticipant = participantName` 4. Enrichment flow proceeds as in Section 8 |

**Backend need**: `POST /participants/{email}/linkedin` with body `{ linkedinUrl: string }` → stores the LinkedIn URL, then triggers enrichment.

---

## 10. Enriched Profile Card

### When it appears
- After enrichment completes, the EnrichedProfileCard panel (420px wide) opens beside the Contact Card
- Also opens when clicking "View" on an already-enriched participant

### 10.1 Profile Header
- **Avatar**: Large circle (80×80px) with gradient background and initials
- **Name**: Displayed in primary color (teal)
- **Headline**: Full LinkedIn headline text
- **LinkedIn link**: "LinkedIn Profile" clickable link

### 10.2 Profile Details

| Field | Example |
|-------|---------|
| Location | Pavia, IT |
| Company | MESA |
| Tenure | 1 year |
| Languages | English, Italian (as badges) |
| Personal Interests (count) | Serverless Technologies, Teaching, Podcasting, etc. (as badges) |

### 10.3 DISC Personality Assessment (Free)

| Field | Example |
|-------|---------|
| Type label | "GO-GETTER" |
| DISC code | "Id" (shown in colored circle) |
| Trait badges | Energetic, Expressive, Visionary, Confident, Fast-Moving |

### 10.4 Compatibility Score
- Displays: "{level}: {percentage}%" (e.g., "High: 75%")
- Color: Green if ≥70%, amber/warning if <70%

### 10.5 Credits System
- Header banner: "Prospect Intelligence" with "{N} free credits" badge
- Description: "Basic intelligence is free. Deeper psychological insights use premium credits."
- **Currently**: 5 free credits (hardcoded)
- **Backend need**: `GET /user/credits` → returns remaining credits count

### 10.6 Premium Sections (Accordion)

Both sections use a single-select accordion (only one can be open at a time).
Default open: "communication" (Communication Strategy)

#### Communication Strategy (1 credit)
- **Trigger**: Click accordion header to expand
- **Header**: MessageSquare icon + "Communication Strategy" + "Premium" badge
- **Subtitle**: "Expand to view sales-specific do's and don'ts powered by 1 free credit."
- **Content** (when expanded):
  - "Premium insight unlocked with free credit" label
  - "Unlimited access on paid plan" note
  - **Do/Don't table** (3 rows, 2 columns):

  | Do | Don't |
  |----|-------|
  | Action text + example quote | Action text + example quote |
  | Action text + example quote | Action text + example quote |
  | Action text + example quote | Action text + example quote |

#### Personality Traits (1 credit)
- **Trigger**: Click accordion header to expand
- **Header**: Brain icon + "Personality Traits" + "Premium" badge
- **Subtitle**: "Expand to view deeper psychological analysis and buying behavior cues."
- **Content** (when expanded):
  - Archetype label (e.g., "Influential-Dominant")
  - "Advanced behavioral intelligence available now via your free credits."
  - "Paid after trial" badge
  - **Trait grid** (2 columns, 6 items):

  | # | Trait | Description |
  |---|-------|-------------|
  | 01 | Energetic | radiates intensity and drive |
  | 02 | Expressive | openly shares thoughts and feelings |
  | 03 | Visionary | sees the big picture |
  | 04 | Confident | shows self-belief in speech |
  | 05 | Fast-Moving | moves quickly in decision-making |
  | 06 | Persuasive | influences others by combining vision and confidence |

### 10.7 Close Action
- X button in header → calls `onClose()` → parent sets `viewingProfile = null` → panel disappears

**Backend need**: `GET /participants/{email}/enriched-profile` → returns full EnrichedProfileData object (see Section 12)

---

## 11. Registration Wizard

### Trigger
- Opens automatically on page load (`useEffect` → `setShowRegistration(true)`)
- Currently opens every time (no persistence check)

### Content
- **Icon**: CalendarDays in branded circle
- **Title**: "Connect your calendar"
- **Description**: "Plus needs access to your Google Calendar to auto-record meetings and share insights."
- **Benefits checklist** (3 items with green checkmarks):
  1. See all your upcoming meetings automatically
  2. Start AI capture by adding the meeting bot
  3. Turn every meeting into organized insights
- **Trust badge**: Shield icon + "We request only the minimum permissions necessary."

### Actions

| Button | Click Action |
|--------|-------------|
| **Grant Permissions & Continue** | Calls `onClose()` → parent sets `showRegistration = false` → modal closes |
| Click outside modal / press Escape | Also closes the modal |

**Backend need**:
- `POST /auth/google-calendar/connect` — initiates Google Calendar OAuth flow
- `GET /user/onboarding-status` — check if user has already connected calendar (to skip wizard)

---

## 12. Complete Data Models

### Meeting

```typescript
interface Meeting {
  id: string;
  title: string;           // Full title, e.g., "Lavazza A Modo Mio — Discussion and Pricing Review"
  time: string;            // Display string, e.g., "1:00 PM - 2:00 PM"
  startHour: number;       // 24h format, e.g., 13 for 1:00 PM
  duration: number;        // In hours, e.g., 1.5
  dayIndex: number;        // 0 = Monday, 6 = Sunday
  type?: "discovery" | "renewal" | "internal";
}
```

### Participant

```typescript
interface Participant {
  name: string;            // Full name
  email: string;           // Email address
  isGmail: boolean;        // true if personal email (gmail, yahoo, etc.)
}
```

### Primary Contact

```typescript
interface PrimaryContact {
  name: string;
  email: string;
  jobTitle: string;
}
```

### Company Profile

```typescript
interface CompanyProfile {
  industry: string;
  size: string;            // e.g., "48 employees"
  revenue: string;         // e.g., "€6-8M"
  location: string;        // e.g., "Milan, Italy"
  founded: string;         // e.g., "2016"
  website: string;         // e.g., "www.novaconsulting.it"
  description: string;     // Free text paragraph
}
```

### Meeting Intelligence

```typescript
interface MeetingIntelligence {
  keyPoints: string[];          // Array of bullet points
  risks: string[];              // Array of risk/question bullets
  suggestedAngle: string;       // Single paragraph
}
```

### Interaction History Item

```typescript
interface InteractionHistoryItem {
  date: string;            // e.g., "Feb 9, 2026"
  type: "Meeting" | "Email";
  summary: string;
  link?: string;           // Optional URL to meeting page
}
```

### Enriched Profile Data

```typescript
interface EnrichedProfileData {
  name: string;
  title: string;                 // LinkedIn headline
  company: string;
  tenure: string;                // e.g., "~1 year"
  location: string;              // e.g., "Pavia, IT"
  linkedinUrl: string;
  languages: string[];
  interests: string[];
  disc: {
    type: string;                // e.g., "GO-GETTER"
    label: string;               // e.g., "Id"
    color: string;               // CSS class, e.g., "bg-amber-500"
    traits: string[];            // e.g., ["Energetic", "Expressive", ...]
  };
  compatibility: {
    level: string;               // "High", "Medium", "Low"
    percentage: number;          // 0-100
  };
  communicationStrategy: {
    dos: { action: string; example: string }[];
    donts: { action: string; example: string }[];
  };
  personalityTraits: {
    archetype: string;           // e.g., "Influential-Dominant"
    traits: { name: string; description: string }[];
  };
}
```

### Meeting Card Data (Full Contact Card payload)

```typescript
interface MeetingCardData {
  companyName: string;
  primaryContact: PrimaryContact;
  participants: Participant[];
  company: CompanyProfile;
  intelligence: MeetingIntelligence;
  dealStage: string;             // One of: "Discovery", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"
  interactionHistory: InteractionHistoryItem[];
}
```

---

## 13. State Management Summary

### Page-Level State (Index.tsx)

| State | Type | Controls |
|-------|------|----------|
| `selectedMeeting` | `Meeting \| null` | Which meeting's Contact Card is open |
| `showRegistration` | `boolean` | Registration Wizard visibility |
| `showConsent` | `boolean` | Recording Consent dialog visibility |
| `showRefreshTip` | `boolean` | Calendar Refresh Popup visibility |

### CalendarView Internal State

| State | Type | Controls |
|-------|------|----------|
| `view` | `"week" \| "month"` | Calendar view mode |
| `syncing` | `boolean` | Sync button loading state |

### ContactCard Internal State

| State | Type | Controls |
|-------|------|----------|
| `dealStage` | `string` | Current deal pipeline stage |
| `showStageDropdown` | `boolean` | Deal stage dropdown open/closed |
| `enrichingParticipant` | `string \| null` | Participant currently being enriched (triggers loading modal) |
| `enrichedProfiles` | `Set<string>` | Participants that have been enriched (persists within session) |
| `viewingProfile` | `string \| null` | Which enriched profile card is open |
| `addProfileTarget` | `string \| null` | Participant for LinkedIn URL dialog |

### EnrichmentLoadingModal Internal State

| State | Type | Controls |
|-------|------|----------|
| `progress` | `number` (0-100) | Progress bar percentage |
| `currentStep` | `number` (0-3) | Which loading step is active |
| `isCompleted` | `boolean` | Whether animation has finished |

### EnrichedProfileCard Internal State

| State | Type | Controls |
|-------|------|----------|
| `openSection` | `string` | Which accordion section is expanded ("communication" default) |

### Sidebar Internal State

| State | Type | Controls |
|-------|------|----------|
| `collapsed` | `boolean` | Sidebar expanded/collapsed |

---

## 14. API Endpoints Needed

### Authentication & Onboarding

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/auth/google-calendar/connect` | Initiate Google Calendar OAuth | — | `{ redirectUrl: string }` |
| GET | `/user/onboarding-status` | Check if calendar is connected | — | `{ calendarConnected: boolean, showWizard: boolean }` |
| GET | `/user/profile` | Current user info for sidebar | — | `{ name, email, initials, avatarUrl? }` |
| GET | `/user/credits` | Remaining enrichment credits | — | `{ remaining: number, plan: "free" \| "paid" }` |

### Calendar

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/meetings?start=<date>&end=<date>` | Fetch meetings for date range | Query params | `Meeting[]` |
| POST | `/calendar/sync` | Trigger calendar refresh | — | `{ success: boolean, newMeetingsCount: number }` |

### Meeting Details

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/meetings/{id}/details` | Full meeting card data | — | `MeetingCardData` |
| GET | `/meetings/{id}/intelligence` | AI pre-meeting intelligence | — | `MeetingIntelligence` |
| POST | `/meetings/{id}/bot-join` | Send recording bot to meeting | — | `{ success: boolean, botId: string }` |
| GET | `/meetings/{id}/meet-link` | Google Meet URL for joining | — | `{ url: string }` |

### Deal Management

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/deals/{meetingId}/stage` | Get current deal stage | — | `{ stage: string }` |
| PUT | `/deals/{meetingId}/stage` | Update deal stage | `{ stage: string }` | `{ success: boolean }` |

### Enrichment

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/participants/{email}/enrich` | Start LinkedIn enrichment | — | `{ jobId: string }` or full `EnrichedProfileData` |
| GET | `/participants/{email}/enriched-profile` | Get enriched profile data | — | `EnrichedProfileData` |
| POST | `/participants/{email}/linkedin` | Manually link LinkedIn URL | `{ linkedinUrl: string }` | `{ success: boolean }` |

### Contact History

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| GET | `/contacts/{email}/interactions` | Past interaction history | — | `InteractionHistoryItem[]` |

### User Preferences

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| PUT | `/user/preferences` | Save preferences (e.g., dismiss refresh tip) | `{ key: string, value: any }` | `{ success: boolean }` |

### Team

| Method | Endpoint | Purpose | Request | Response |
|--------|----------|---------|---------|----------|
| POST | `/team/invite` | Send team invitation | `{ email: string }` | `{ success: boolean }` |

---

## 15. User Flow Diagrams

### Flow 1: First-Time User

```
Page Load
  └→ Registration Wizard opens
      └→ User clicks "Grant Permissions & Continue"
          └→ [BACKEND: POST /auth/google-calendar/connect]
          └→ Wizard closes
          └→ Calendar View is now interactive
          └→ Calendar Refresh Popup visible at top
```

### Flow 2: View Meeting Details

```
User clicks a meeting block on calendar
  └→ selectedMeeting = meeting
  └→ Contact Card slides in (380px panel)
      ├→ Shows: meeting title, time, primary contact, participants, company profile
      ├→ Shows: AI intelligence (Key Points, Risks, Suggested Angle)
      ├→ Shows: Deal Context dropdown
      └→ Shows: Interaction History
```

### Flow 3: Enrich a Corporate-Email Participant

```
In Contact Card → Participant row → Click "Enrich"
  └→ enrichingParticipant = "Luca Bianchi"
  └→ [BACKEND: POST /participants/luca.bianchi@novaconsulting.it/enrich]
  └→ EnrichmentLoadingModal opens (fullscreen overlay)
      └→ 3-second animated progress: LinkedIn → Extract → Analyze → Generate
      └→ On 100%: 800ms delay → onComplete()
          └→ enrichedProfiles.add("Luca Bianchi")
          └→ Modal closes
          └→ viewingProfile = "Luca Bianchi"
          └→ EnrichedProfileCard opens (420px panel beside Contact Card)
              ├→ Profile header (name, headline, location, company)
              ├→ DISC assessment + traits
              ├→ Compatibility score
              ├→ Communication Strategy accordion (default open)
              └→ Personality Traits accordion
```

### Flow 4: Enrich a Personal-Email Participant

```
In Contact Card → Participant row (Gmail) → "Enrich" is DISABLED
  └→ User clicks "Add Profile" instead
  └→ addProfileTarget = "Marco Verdi"
  └→ AddProfileDialog opens
      └→ User enters LinkedIn URL: "https://linkedin.com/in/marcoverdi"
      └→ Validation: URL must contain "linkedin.com/in/"
      └→ Click "Add Profile"
          └→ [BACKEND: POST /participants/marco.verdi92@gmail.com/linkedin]
          └→ toast.success("LinkedIn profile linked for Marco Verdi")
          └→ Dialog closes
          └→ enrichingParticipant = "Marco Verdi"
          └→ Enrichment Loading Modal opens → same flow as Flow 3
```

### Flow 5: Bot Join with Recording Consent

```
In Contact Card → Click "Bot Join"
  └→ showConsent = true
  └→ RecordingConsent dialog opens (non-dismissible via Escape)

  Option A: User clicks "I Understand — Continue"
    └→ showConsent = false
    └→ [BACKEND: POST /meetings/{id}/bot-join]
    └→ toast.success("Recording consent acknowledged")

  Option B: User clicks "Do Not Proceed"
    └→ showConsent = false
    └→ toast.info("Left meeting")
    └→ No backend call
```

### Flow 6: Change Deal Stage

```
In Contact Card → Deal Context section → Click dropdown
  └→ showStageDropdown = true
  └→ 6 options shown: Discovery, Demo, Proposal, Negotiation, Closed Won, Closed Lost
  └→ User clicks a stage
      └→ dealStage = selected stage
      └→ showStageDropdown = false
      └→ [BACKEND: PUT /deals/{meetingId}/stage]
```

### Flow 7: Sync Calendar

```
In Calendar Header → Click "Sync Calendar"
  └→ syncing = true (button shows spinner + "Syncing…", disabled)
  └→ [BACKEND: POST /calendar/sync]
  └→ toast.success("Calendar synced successfully")
  └→ After 2000ms → syncing = false (button returns to normal)
```

### Flow 8: Dismiss Refresh Tip

```
Calendar Refresh Popup visible

  Option A: Click "I got it, don't show this again"
    └→ Popup hidden permanently
    └→ [BACKEND: PUT /user/preferences { key: "hideRefreshTip", value: true }]

  Option B: Click X (close)
    └→ Popup hidden for this session only
    └→ Will reappear on next page load
```

### Flow 9: View Previously Enriched Profile

```
In Contact Card → Participant row (already enriched) → Click "View"
  └→ viewingProfile = participant name
  └→ EnrichedProfileCard opens with cached data
  └→ No new backend call needed (data already in memory)
```

---

## 16. Toast Notifications Summary

| Event | Toast Type | Message |
|-------|-----------|---------|
| Calendar sync completed | `success` | "Calendar synced successfully" |
| Recording consent accepted | `success` | "Recording consent acknowledged" |
| Recording consent declined | `info` | "Left meeting" |
| LinkedIn profile manually linked | `success` | "LinkedIn profile linked for {name}" |

---

## 17. Current Limitations (Hardcoded / Mock)

These items are currently using mock data and need backend integration:

1. **All meeting data** — hardcoded array of 6 meetings
2. **Contact card data** — two hardcoded data objects (corporate vs Gmail)
3. **Enriched profile data** — three hardcoded profile records (Luca, Maria, Marco)
4. **Calendar dates** — hardcoded to "Mar 2-8, 2026", no navigation
5. **User profile** — hardcoded "User" / "user@example.com" in sidebar
6. **Credits count** — hardcoded to 5
7. **Deal stage changes** — local state only, not persisted
8. **Registration wizard** — always shows, no persistence check
9. **Refresh tip** — always shows, no persistence check
10. **"Join Meeting" button** — no handler, needs Google Meet URL
11. **"Record" button** — no handler, needs recording session API
12. **Date navigation** — left/right arrows have no handler
13. **Month view** — renders same as week view
14. **"Invite" button** — no handler, needs team invite flow
15. **Sidebar navigation** — buttons only, no routing to other pages

---

*Document generated from ForSkale Meeting Intelligence frontend codebase.*
*Last updated: March 9, 2026*
