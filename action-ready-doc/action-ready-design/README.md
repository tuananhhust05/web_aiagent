# ForSkale Atlas — Action Ready Dashboard

> AI-powered sales execution dashboard that surfaces follow-up actions as flashcards.

## Overview

ForSkale Atlas is a sales enablement frontend built around the **Action Ready** module — a flashcard-style execution queue where each card represents a pending sales task (email reply, call follow-up, demo scheduling, or resource sharing).

### Key Features

- **Flashcard UI** — Compact front face with 3D flip to reveal AI-generated drafts
- **Multi-tone drafts** — Each action offers Professional, Friendly, and Direct tone variants
- **Smart filtering** — Filter by status (Needs Review / Overdue / Completed), category, channel, and due date
- **Bilingual support** — EN/IT language toggle for the main content area
- **Collapsible sidebars** — Navigation sidebar and filter sidebar both collapse for more workspace

## Tech Stack

- **React 18** + **TypeScript 5** + **Vite 5**
- **Tailwind CSS v3** with custom HSL-based design tokens
- **shadcn/ui** component library
- **React Router** (single-page at `/`)
- **TanStack React Query** (available for future data fetching)

## Project Structure

```
src/
├── components/atlas/          # Atlas dashboard components
│   ├── action-card/           # ActionCard system (front, expanded, types)
│   ├── AtlasSidebar.tsx       # Main navigation sidebar
│   ├── ActionFilterSidebar.tsx # Status & category filter panel
│   ├── ActionReadyHeader.tsx  # Top header with search & channel filter
│   ├── ActionReadyContent.tsx # Card grid with due-date filter bar
│   ├── DashboardTopBar.tsx    # Language toggle bar
│   ├── DueDateFilterBar.tsx   # Due date filter pills
│   └── StrategyComingSoonModal.tsx
├── context/
│   ├── ActionsContext.tsx      # Global state: filters, sorting, resolution
│   └── LanguageContext.tsx     # i18n context (EN/IT translations)
├── data/
│   └── mockActions.ts         # Mock data generator (48 cards)
├── pages/
│   └── Index.tsx              # Root page layout
└── components/ui/             # shadcn/ui primitives
```

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## Documentation

Detailed frontend specs for backend integration are available in:

- `public/ForSkale_Atlas_Frontend_Spec.md` — Full architecture, data models, interactions, and API contracts
- `public/ForSkale_Sidebar_Spec.md` — Sidebar system specification

## Design Tokens

All colors use HSL-based CSS custom properties defined in `src/index.css`. Brand colors: `--forskale-green`, `--forskale-teal`, `--forskale-blue`, `--forskale-cyan`. See `tailwind.config.ts` for the full token map.
