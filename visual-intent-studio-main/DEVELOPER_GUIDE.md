# ForSkale – Developer Reference Guide

> **Last updated:** 2026-03-24  
> Single source of truth for architecture, components, and design system.

---

## 1. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + CSS custom properties (HSL) |
| UI Library | shadcn/ui (Radix primitives) |
| Routing | React Router DOM v6 |
| State | React useState/useEffect (local) + React Query |
| Icons | Lucide React |
| Dates | date-fns |
| Charts | Recharts |
| Toasts | Sonner + shadcn Toast |

---

## 2. Project Structure

```
src/
├── App.tsx                  # Root – providers, router
├── main.tsx                 # Entry point
├── index.css                # Design tokens, global styles, animations
├── pages/
│   ├── Index.tsx            # Main page – orchestrates all panels
│   └── NotFound.tsx         # 404 catch-all
├── components/
│   ├── atlas/               # Core application components
│   │   ├── AppLayout.tsx           # Shell layout (sidebar + content area)
│   │   ├── Sidebar.tsx             # Left navigation sidebar
│   │   ├── CalendarView.tsx        # Week/month calendar with meetings
│   │   ├── DealStageIndicator.tsx  # Circular deal-stage badges (week view only)
│   │   ├── ContactCard.tsx         # Meeting contact panel (floating overlay)
│   │   ├── EnrichedProfileCard.tsx # Prospect Intelligence deep-dive panel
│   │   ├── EnrichmentModal.tsx     # Multi-source enrichment animation
│   │   ├── AddProfileDialog.tsx    # LinkedIn URL input for manual enrichment
│   │   ├── SalesAssistantBot.tsx   # AI Sales Coach floating bot
│   │   ├── VoiceStrategySession.tsx# Voice strategy orb interface
│   │   ├── CalendarRefreshPopup.tsx# Sync reminder tooltip
│   │   ├── RecordingConsent.tsx    # Meeting recording consent dialog
│   │   └── RegistrationWizard.tsx  # Calendar permissions onboarding
│   └── ui/                  # shadcn/ui primitives (do not edit directly)
├── hooks/
│   ├── use-mobile.tsx       # Responsive breakpoint hook
│   └── use-toast.ts         # Toast hook
└── lib/
    └── utils.ts             # cn() utility for Tailwind class merging
```

---

## 3. Component Architecture & Data Flow

```
Index.tsx
 ├── AppLayout (Sidebar + content wrapper)
 │   ├── CalendarView ──────────── week/month toggle, meeting grid
 │   │   └── DealStageIndicator ── per-event deal stage badges (week only)
 │   ├── CalendarRefreshPopup ──── dismissable sync tip
 │   └── ContactCard (floating) ── meeting details, cognitive profile
 │       ├── EnrichmentModal ───── 5-source enrichment animation
 │       ├── EnrichedProfileCard ─ full prospect intelligence panel
 │       └── AddProfileDialog ──── manual LinkedIn URL entry
 ├── SalesAssistantBot (floating) ─ AI coach with meeting briefs
 │   └── VoiceStrategySession ──── voice strategy interface
 ├── RegistrationWizard ─────────── onboarding modal
 └── RecordingConsent ───────────── recording permission dialog
```

### Key User Interactions

| User Action | Result |
|------------|--------|
| Click a meeting event | `ContactCard` opens as floating overlay on right |
| Click "View Full Neuro-Profile" | `EnrichmentModal` plays → `EnrichedProfileCard` opens |
| Click participant without LinkedIn | `AddProfileDialog` opens |
| Click ForSkale bot icon | `SalesAssistantBot` expands |
| Click "Strategy" in sidebar | Coming Soon modal (no navigation) |
| Click "Bot Join" | `RecordingConsent` dialog opens |

---

## 4. Panel Architecture (Floating Overlays)

ContactCard and EnrichedProfileCard use **absolute positioning** to float over the calendar:

```
┌──────────────────────────────────────────────────┐
│ Sidebar │          Calendar (full width)          │
│         │                                         │
│         │    ┌─────────────┐ ┌─────────────────┐  │
│         │    │ ContactCard │ │ EnrichedProfile  │  │
│         │    │  (z-30)     │ │  (z-40)          │  │
│         │    │ right:420px │ │  right:0          │  │
│         │    └─────────────┘ └─────────────────┘  │
└──────────────────────────────────────────────────┘
```

- Calendar always renders at full width (never compressed)
- `ContactCard`: `absolute inset-y-0 z-30`, shifts to `right-[420px]` when profile is open
- `EnrichedProfileCard`: `absolute inset-y-0 right-0 z-40`

---

## 5. Enrichment Flow

1. User clicks "View Full Neuro-Profile" on a participant
2. `EnrichmentModal` opens – full-screen overlay with sequential source animation
3. Sources process in order: **LinkedIn → Google News → Forbes → Crunchbase → Wikipedia**
4. Each source transitions: pending → active (pulse animation) → complete (green checkmark)
5. Progress bar fills with gradient shimmer effect over ~3.5s
6. On completion, modal auto-closes and `EnrichedProfileCard` opens

---

## 6. Sidebar Navigation

Items in order:
1. **Meeting Intelligence** – active page indicator
2. **Meeting Insight** – route link
3. **Strategy** – modal trigger (Coming Soon, no navigation)
4. **Action Ready** – route link
5. **QnA Engine** – route link
6. **Performance** – route link
7. **Knowledge** – route link
8. **Record** – route link

---

## 7. Design System

### Color Tokens (HSL in `index.css`)

**Never use raw color values in components** – always reference tokens via `hsl(var(--token))`.

| Token | Purpose |
|-------|---------|
| `--background`, `--foreground` | Base surfaces |
| `--primary`, `--primary-foreground` | Brand primary |
| `--forskale-green` | Brand green |
| `--forskale-teal` | Brand teal |
| `--forskale-blue` | Brand blue |
| `--sidebar-background` | Deep navy sidebar |
| `--sidebar-primary` | Teal sidebar accent |
| `--cal-*` tokens | Calendar grid colors |

### Usage

```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground" />
<div className="bg-[hsl(var(--forskale-teal))]" />

// ❌ Wrong
<div className="bg-blue-500 text-white" />
```

### Interactive Patterns

| Pattern | Gradient | Hover |
|---------|----------|-------|
| Primary CTA | `from-forskale-green via-forskale-teal to-forskale-blue` | `-translate-y-0.5`, shadow intensifies |
| Nav link (inactive) | None | `bg-forskale-teal/0.08` |
| Nav link (active) | Left accent bar gradient | `bg-sidebar-accent` |

### Custom Animations (in `index.css`)

- `.animate-shimmer` – progress bar shine
- `.animate-ping` – pulsing ring on active enrichment
- `pulse-glow` – Record button glow
- `iconFloat` – floating icon in loading states

---

## 8. ContactCard Sections

| Section | Description |
|---------|-------------|
| Header | Meeting title, time, Join/Bot Join buttons |
| Primary Contact | Name, title, email |
| Cognitive Snapshot | DISC type, decision style, key triggers |
| Opening Script | First-30s script with copy button + "Why This Works" |
| AI Sales Coach | Quick-action buttons for objections, closing, rapport |
| Company Profile | Company details, industry, size, revenue |
| Deal Context | Pipeline stage badge |
| Before You Join | Accordion: Key Points, Risks, Suggested Angle |
| Interaction History | Chronological meeting/email timeline |

---

## 9. Enriched Profile (Prospect Intelligence)

| Section | Cost |
|---------|------|
| Basic profile (name, headline, location) | Free |
| Languages, Interests | Free |
| Traits & DISC type | Free |
| Communication Strategy (Do/Don't) | 1 credit |
| Personality Traits (detailed breakdown) | 1 credit |
| Cognitive Influence Map | Free |
| Approach Strategy | Free |

---

## 10. Mock Data

All data is currently mocked inline. Key locations:

| File | Mock Data |
|------|-----------|
| `CalendarView.tsx` | Meeting events |
| `ContactCard.tsx` | Participant profiles, cognitive data, neuro profiles |
| `EnrichedProfileCard.tsx` | Detailed intelligence data |
| `SalesAssistantBot.tsx` | Meeting briefs, AI responses |

---

## 11. User Flows

```
Page Load → Registration Wizard
         → Calendar View (default: weekly)

Click meeting → ContactCard opens
  → "Join Meeting" → redirect to Google Meet
  → "Bot Join" → Recording Consent → toast
  → "View Full Neuro-Profile" → Enrichment Modal → Enriched Profile Card
  → "Add Profile" (personal email) → LinkedIn URL → Enrichment → Profile

Sidebar "Strategy" → Coming Soon modal
"Sync Calendar" → toast success
ForSkale bot icon → SalesAssistantBot → VoiceStrategySession
```

---

## 12. Development Rules

1. **Colors**: Always use design tokens, never hardcoded values
2. **Components**: Place app components in `src/components/atlas/`
3. **Conditionals**: Use `cn()` from `@/lib/utils` for class merging
4. **Panels**: Follow floating overlay pattern (absolute positioning, z-index layering)
5. **shadcn/ui**: Don't edit files in `src/components/ui/` directly
6. **Responsive**: Use Tailwind breakpoints (`sm:`, `md:`, `lg:`)

---

## 13. Specification Documents

Additional specs in `public/`:
- `ForSkale-Frontend-Specification.md` – Full frontend spec
- `ForSkale-MonthView-Specification.md` – Month view calendar details
- `ForSkale-Sidebar-Design.md` – Sidebar navigation design
