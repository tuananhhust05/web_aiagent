# Memory: index.md
Updated: now

# Project Memory

## Core
ForSkale (user-facing: Plus): AI calendar meeting intelligence.
Brand: Liquid light gradients (green #7ED321, teal #4ECDC4, sapphire #0B5394). Plus Jakarta Sans headings, Inter body. Glassmorphism.
Use standard HTML `<label>`, never Radix UI primitive.
Use `src/components/atlas/Sidebar.tsx` for sidebar, never `src/components/ui/sidebar.tsx`.
Calendar is dynamic, always based on current date. No hardcoded dates.

## Memories
- [Branding Styles](mem://style/branding) — Brand identity, gradients, typography, and interactive element styling
- [Calendar View Styles](mem://style/calendar-view) — Visual design of Week View and Month View, portal approach for hover cards
- [Intelligence Actions Style](mem://style/intelligence-actions) — Specific gradients (purple-to-indigo) for AI enrichment buttons
- [Calendar Visibility Rules](mem://style/calendar/visibility-rules) — Exclusions and visibility constraints for event cards and hover tooltips
- [Contact Card Actions](mem://features/contact-card/actions) — Join Meeting and Bot Join button behaviors
- [Recording Consent](mem://features/recording-consent) — Mandatory legal consent modal triggered by Bot Join
- [Onboarding](mem://features/onboarding) — Registration Wizard trigger logic
- [Personal Emails Enrichment](mem://features/enrichment/personal-emails) — Manual profile addition for personal domains
- [Developer Guide Docs](mem://technical/documentation/developer-guide) — References to comprehensive frontend and design specifications
- [Sales Assistant Bot](mem://features/sales-assistant-bot) — Floating root-level 'Atlas' AI bot for sales strategy
- [Month View Specifics](mem://features/calendar/month-view) — Dynamic month view with current date, grab-scroll
- [Navigation Structure](mem://navigation/structure) — Sidebar components, hover menus, active states, and sub-app links
- [Strategy Hub](mem://features/strategy-hub) — 'Coming Soon' modal implementation for Strategy sidebar item
- [Multi-Participant Intelligence](mem://features/contact-card/multi-participant-intelligence) — Group dynamics engine, cognitive profiles, and transitions
- [Participant Indicators](mem://features/calendar/participant-indicators) — Overlapping avatar stacks in Week View
- [Prospect Intelligence Design](mem://features/prospect-intelligence/visual-design) — Enriched Profile Card visuals, NeuroGauges, and risk icons
- [AI Sales Coach](mem://features/contact-card/ai-sales-coach) — Deep links and action cards in the Contact Card
- [Company Profile](mem://features/contact-card/company-profile) — Layout and content of the Company Profile section
- [Floating Panels Architecture](mem://technical/architecture/floating-panels) — Absolute positioning and layout shifting for Contact and Enriched Profile cards
- [Intelligence Architecture](mem://features/contact-card/intelligence) — Snapshot vs Deep Dive data distribution
- [Multi-Source Intelligence](mem://features/enrichment/multi-source-intelligence) — 7-step, 3.5s animated enrichment process
- [Data Persistence](mem://technical/architecture/data-persistence) — `useCalendarEvents` hook and localStorage
- [Meeting Management](mem://features/calendar/meeting-management) — Status tracking and action-item checkboxes
- [Interest Mapping](mem://features/calendar/interest-mapping) — Scoring system (0-100%) mapped to cognitive states and colors
- [i18n System](mem://technical/architecture/i18n-system) — EN/IT language support via LanguageContext
- [Data Schema](mem://features/meeting-intelligence/data-schema) — Cognitive Influence schema structure
- [Meeting Sequence](mem://features/calendar/meeting-sequence) — Meeting count (M1/M2) badges replacing interest percentages, velocity system
