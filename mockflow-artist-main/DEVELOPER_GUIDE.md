# ForSkale – Meeting Intelligence: Developer Reference Guide

> **Purpose**: This document describes every UI component, interaction flow, and design specification for the **Meeting Intelligence** page so a developer can faithfully rebuild it in production.

---

## 1. Global Layout

```
┌──────────┬──────────────────────────────────────────────┐
│          │                                              │
│ Sidebar  │              Main Content Area               │
│ (fixed)  │  ┌────────────────────┬───────────────────┐  │
│          │  │   Calendar View    │  Contact Card      │  │
│          │  │   (scrollable)     │  (slide-in panel)  │  │
│          │  │                    │                    │  │
│          │  └────────────────────┴───────────────────┘  │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

- **Full viewport height** (`h-screen`), no page scroll — internal panels scroll independently.
- Sidebar + main area use `flex` row layout.
- Contact Card overlays/slides in from the right when a meeting is clicked.

---

## 2. Sidebar

### 2.1 Dimensions & Theme
| Property | Expanded | Collapsed |
|----------|----------|-----------|
| Width | `w-60` (240px) | `w-[72px]` (72px) |
| Background | Vertical gradient: `from-sidebar-accent` → `to-sidebar-background` |
| Text | `text-sidebar-foreground` (light grey on dark) |
| Transition | `transition-all duration-300 ease-in-out` |

### 2.2 CSS Design Tokens (from `index.css`)
```css
--sidebar-background: 224 100% 10%;    /* Deep navy */
--sidebar-foreground: 200 33% 93%;     /* Light grey */
--sidebar-primary: 174 56% 55%;        /* Teal accent */
--sidebar-accent: 224 60% 15%;         /* Slightly lighter navy */
--sidebar-accent-foreground: 174 56% 55%;
--forskale-green: 97 72% 48%;
--forskale-teal: 174 56% 55%;
--forskale-blue: 213 88% 31%;
```

### 2.3 Structure (top → bottom)

#### Header Zone
- **Logo**: `forskale-logo.png` — `h-9 w-9 rounded-lg`
- **Brand text** (expanded only): "ForSkale" — `text-sm font-bold text-white tracking-wide`
- **Collapse toggle**: `ChevronLeft` / `ChevronRight` icon — `h-4 w-4`, hover brightens

#### Record Button (Primary CTA)
- Full-width gradient button: `from-forskale-green via-forskale-teal to-forskale-blue`
- Shadow: `0 4px 12px hsl(var(--forskale-green) / 0.3)`
- Hover: lift `-translate-y-0.5`, shadow intensifies to `0.4` opacity
- Icon: `Radio` (lucide) — always visible; label "Record" hidden when collapsed
- `text-sm font-semibold text-white`

#### Gradient Divider
```css
h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent
```

#### Navigation Links
| Label | Icon (lucide) | Notes |
|-------|---------------|-------|
| Meeting Intelligence | `CalendarDays` | **Active by default** on this page |
| Meeting Insights | `Video` | |
| Performance | `BarChart3` | |
| Action Ready | `ClipboardCheck` | |
| Q&A Engine | `HelpCircle` | |
| Knowledge | `BookOpen` | |

**Active state styling:**
- Background: `bg-sidebar-accent`
- Text: `text-sidebar-accent-foreground font-medium`
- Left accent bar: `w-[3px] h-[60%]` — gradient `from-forskale-green to-forskale-teal`, positioned `left-0`, vertically centered

**Inactive state styling:**
- Text: `text-sidebar-foreground/70`
- Hover: `bg-forskale-teal/0.08`, `text-sidebar-accent-foreground`

**All items:** `rounded-lg px-3 py-2.5 text-sm`, icon `h-5 w-5`

#### Gradient Divider (repeated)

#### Bottom Zone
- **Invite button**: `UserPlus` icon, same hover style as nav items
- **User card**: Avatar circle with gradient `from-forskale-green to-forskale-teal`, initials "U" — `h-8 w-8 text-xs font-bold text-white`. Name + email shown when expanded.

---

## 3. Calendar View (Main Panel)

### 3.1 Header Bar
- **View toggles**: "week" / "month" — tab-style buttons
- **Date navigator**: `< Mar 2–8, 2026 >` with left/right chevron arrows
- **Sync button**: "Sync Calendar" — top-right action

### 3.2 Calendar Grid
- **Weekly view** (default): 7 columns (Mon–Sun), rows for each hour slot (7 AM – 6 PM visible)
- **Dark theme** using `--cal-*` tokens:
  ```css
  --cal-dark: 224 75% 10%;        /* Grid background */
  --cal-dark-blue: 220 100% 16%;  /* Cell alternate */
  --cal-slate: 215 30% 17%;       /* Row stripes */
  --cal-mid: 213 30% 26%;         /* Borders */
  --cal-border: 174 56% 55%;      /* Accent borders (teal) */
  --cal-text-primary: 0 0% 100%;  /* White */
  --cal-text-secondary: 200 33% 93%;
  --cal-cyan: 197 80% 65%;        /* Highlighted text */
  ```
- **Meeting blocks**: Rounded cards within time slots showing meeting title + time range
- **Click behavior**: Clicking a meeting block opens the Contact Card panel

### 3.3 Calendar Refresh Popup
- Dismissible tooltip/popup near Sync button
- "Refresh tip" — can be permanently dismissed

---

## 4. Contact Card (Right Panel — Slide-in)

Opens when a calendar meeting is clicked. Contains these sections:

### 4.1 Header
- **Meeting title** (e.g., "Lavazza A Modo Mio")
- **Time**: "1:00 PM – 2:00 PM"
- **Action buttons**:
  - `Join Meeting` — redirects to Google Meet link
  - `Bot Join` — opens Recording Consent dialog

### 4.2 Primary Contact
- **Name**: e.g., "Luca Bianchi"
- **Title**: e.g., "Head of Operations and Procurement"
- **Email**: e.g., `luca.bianchi@novaconsulting.it`

### 4.3 Participants List
Table/list of all participants:
| Avatar | Name | Action | Email |
|--------|------|--------|-------|
| `LB` | Luca Bianchi | `Enrich` button | luca.bianchi@novaconsulting.it |
| `MR` | Maria Rossi | `Enrich` button | maria.rossi@novaconsulting.it |

- **Enrich button**: Triggers the Enrichment Loading Modal, then opens the Enriched Profile Card
- **Add Profile**: Shown instead of Enrich when participant uses personal email (auto-enrich unavailable)

### 4.4 Company Profile
| Field | Example Value |
|-------|--------------|
| Company | Nova Consulting |
| Industry | Professional Services – Management Consulting |
| Size & Revenue | 48 employees · €6–8M |
| Location | Milan, Italy |
| Founded | 2016 |
| Website | www.novaconsulting.it |
| Description | "Milan-based management consulting firm supporting mid-sized enterprises..." |

- When participant has personal email → all fields show "Unknown", description: "Company information unavailable — participant registered with a personal email address."

### 4.5 Before You Join (Pre-meeting Intelligence)
Expandable sections (accordion):
- **Key Points** — summary bullets
- **Risks & Open Questions** — flagged concerns
- **Suggested Angle** — recommended approach

### 4.6 Deal Context
- Pipeline stage badge (e.g., "Discovery")

### 4.7 Interaction History
Chronological list:
| Type | Date | Summary |
|------|------|---------|
| Meeting | Feb 9, 2026 | Initial discovery call — discussed pain points... |
| Email | Jan 28, 2026 | Outreach email with case study... |
| Meeting | Dec 12, 2025 | Previous Atlas intelligence review... |

Each meeting entry has an "Open meeting page" link.

---

## 5. Recording Consent Dialog

**Trigger**: Clicking "Bot Join" on a meeting's Contact Card.

### Content
- **Title**: "Recording Consent Required"
- **Body**: "Recording and AI processing to be enabled."
- **Bullet points** (user responsibilities):
  - Informing ALL participants that recording is active
  - Obtaining valid consent from ALL participants
  - Ensuring compliance with applicable privacy laws
- **Disclaimer**: "Responsibility for consent lies entirely with you. ForSkale is not responsible."

### Actions
| Button | Style | Behavior |
|--------|-------|----------|
| Do Not Proceed | Secondary/cancel (outline/ghost) | Closes dialog, shows toast: "Left meeting" |
| I Understand — Continue | Primary (gradient) | Closes dialog, shows toast: "Recording consent acknowledged" |

---

## 6. Enrichment Flow

### 6.1 Enrichment Loading Modal
**Trigger**: Clicking "Enrich" on a participant row.

**Header**: "Prospect Intelligence"
**Subtitle**: "Basic intelligence is free. Deeper psychological insights use premium credits."

**Progress stages** (sequential animation 0% → 76% → 100%):
1. "Connecting to LinkedIn.."
2. "Extracting profile data.."
3. "Analyzing behavioral patterns..."
4. "Generating insights..."

**Premium teaser** (visible during loading):
- "Communication Strategy — Premium" accordion (locked)
- "Expand to view sales-specific do's and don'ts powered by 1 free credit."

**On completion**: Modal closes → Enriched Profile Card opens

### 6.2 Add Profile Dialog (Personal Email Fallback)
**Trigger**: When participant has personal email (e.g., `marco.verdi92@gmail.com`), "Add Profile" button appears instead of "Enrich".

**Fields**:
- LinkedIn Profile URL — text input with placeholder `https://linkedin.com/in/username`
- Submit triggers the same enrichment flow as above

---

## 7. Enriched Profile Card

Full prospect intelligence view after enrichment completes.

### 7.1 Profile Header
- **Name**: "Luca Bianchi"
- **Headline**: Full LinkedIn headline (e.g., "CTIO @ MESA | AWS Serverless Hero | Cursor Ambassador...")
- **Location**: "Pavia, IT"
- **Company**: "MESA"
- **Tenure**: "~1 year"

### 7.2 Basic Intelligence (Free)
| Section | Content |
|---------|---------|
| Languages | English, Italian |
| Personal Interests (count) | Serverless Technologies, Teaching, Podcasting, Community Building, Blockchain Technologies |
| Traits | Label: "GO-GETTER \| DISC: Id" — Tags: Energetic, Expressive, Visionary, Confident, Fast-Moving |

### 7.3 Premium Sections (Accordion, cost credits)

#### Communication Strategy (1 credit)
- **Badge**: "Premium insight unlocked with unlimited access on paid plan"
- **Do / Don't table**:

| Do | Don't |
|----|-------|
| Propose next steps while excitement is high | Delay momentum to follow up later |
| Actively steer the conversation back when it drifts | Let enthusiasm derail progress |
| Use expressive language that still points to outcomes | Use purely technical or dry language |

- Footer: "This helps teams move faster without added friction."

#### Personality Traits (1 credit)
- **DISC Profile**: "Influential-Dominant"
- **Badge**: "Advanced behavioral intelligence available now via your free credits."
- **Numbered trait list**:

| # | Trait | Description |
|---|-------|-------------|
| 01 | Energetic | radiates intensity and drive |
| 02 | Expressive | openly shares thoughts and feelings |
| 03 | Visionary | sees the big picture |
| 04 | Confident | shows self-belief in speech |
| 05 | Fast-Moving | moves quickly in decision-making |
| 06 | Persuasive | influences others by combining vision and confidence |

### 7.4 Credits System
- Header shows: "5 free credits"
- Each premium section costs 1 credit
- Paid plan = unlimited access

---

## 8. Design System Summary

### 8.1 Interactive Element Patterns

| Pattern | Gradient | Shadow | Hover |
|---------|----------|--------|-------|
| **Primary CTA** (Record, Grant Permissions) | `from-forskale-green via-forskale-teal to-forskale-blue` | `0 4px 12px hsl(forskale-green / 0.3)` | `-translate-y-0.5`, shadow `0.4` |
| **Secondary** (Invite, nav links) | None | None | `bg-forskale-teal/0.08` or `bg-sidebar-accent` |
| **Enrich button** | Teal outline | None | Teal fill |
| **Destructive/Cancel** | None | None | Standard ghost hover |

### 8.2 Typography
- **Headings**: `font-bold` or `font-semibold`, white on dark backgrounds
- **Body**: `text-sm` (14px)
- **Muted**: `text-sidebar-foreground/50` or `text-muted-foreground`
- **Tiny labels**: `text-[10px]` or `text-xs`

### 8.3 Spacing & Radius
- Section padding: `px-3 py-3` or `px-4 py-5`
- Card radius: `rounded-lg` (8px via `--radius: 0.5rem`)
- Avatar radius: `rounded-full`
- Nav item radius: `rounded-lg`

### 8.4 Animations (defined in `index.css`)
| Animation | Use |
|-----------|-----|
| `pulse-glow` | Record button glow effect |
| `pulseRing` | Active recording indicator |
| `iconFloat` | Floating icon in loading states |
| `shimmer` | Loading skeleton shimmer |
| `iconPulse` | Subtle icon breathing |

### 8.5 Toasts (Sonner)
| Event | Type | Message |
|-------|------|---------|
| Calendar sync | `success` | "Calendar synced successfully" |
| Consent accepted | `success` | "Recording consent acknowledged" |
| Consent declined | `info` | "Left meeting" |

---

## 9. Registration Wizard (First-time Modal)

Opens automatically on page load.

- **Icon**: `CalendarDays` in a branded circle
- **Title**: "Connect your calendar"
- **Description**: "Plus needs access to your Google Calendar to auto-record meetings and share insights."
- **Benefits** (checkmark list):
  - See all your upcoming meetings automatically
  - Start AI capture by adding the meeting bot
  - Turn every meeting into organized insights
- **Trust badge**: Shield icon + "We request only the minimum permissions necessary."
- **CTA**: "Grant Permissions & Continue" — full-width primary button

---

## 10. Component File Map

| Component | File Path | Purpose |
|-----------|-----------|---------|
| `AtlasSidebar` | `src/components/atlas/Sidebar.tsx` | Collapsible sidebar navigation |
| `CalendarView` | `src/components/atlas/CalendarView.tsx` | Weekly/monthly calendar grid |
| `ContactCard` | `src/components/atlas/ContactCard.tsx` | Meeting detail slide-in panel |
| `EnrichedProfileCard` | `src/components/atlas/EnrichedProfileCard.tsx` | Full prospect intelligence view |
| `EnrichmentLoadingModal` | `src/components/atlas/EnrichmentLoadingModal.tsx` | Enrichment progress animation |
| `AddProfileDialog` | `src/components/atlas/AddProfileDialog.tsx` | LinkedIn URL input for personal emails |
| `RecordingConsent` | `src/components/atlas/RecordingConsent.tsx` | Bot join consent dialog |
| `RegistrationWizard` | `src/components/atlas/RegistrationWizard.tsx` | First-time calendar connect modal |
| `CalendarRefreshPopup` | `src/components/atlas/CalendarRefreshPopup.tsx` | Sync reminder tooltip |

---

## 11. User Flows Summary

```
Page Load → Registration Wizard (first time)
         → Calendar View (default: weekly)

Click meeting block → Contact Card opens
  → "Join Meeting" → redirect to Google Meet
  → "Bot Join" → Recording Consent Dialog
      → "I Understand" → toast success
      → "Do Not Proceed" → toast info, close
  → "Enrich" (company email) → Enrichment Loading → Enriched Profile Card
      → Communication Strategy (1 credit) → Do/Don't table
      → Personality Traits (1 credit) → DISC breakdown
  → "Add Profile" (personal email) → LinkedIn URL Dialog → Enrichment Loading → Enriched Profile Card

"Sync Calendar" → toast success
Sidebar nav → route to other pages (same sidebar layout)
```
