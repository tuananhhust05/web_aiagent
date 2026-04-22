# ForSkale — Strategy Command Center

A client-side React + Vite + Tailwind + TypeScript app that helps sales teams reason about deals through an **Interest Level (10–90%)** psychology model instead of traditional CRM stages. The Strategy page is designed to feel like a senior sales advisor, not a reporting dashboard.

## Core Concept

Deals are tracked as **cognitive states** along an interest journey:

`Attention → Curiosity → Interest → Problem Recognition → Trust → Evaluation → Validation → Commitment Intent → Decision`

Each state maps to an interest %, a recommended motion, and CRM-stage equivalents. All narrative content (briefings, patterns, framework, guardrails, scenarios) is **derived from existing `CompanyDeal` mock data** — no schema changes.

## Strategy Page Anatomy

### 1. Strategic Briefing Banner (top)
Replaces the generic greeting. A dynamic AI narrative grouped by deal patterns:
- *"Andrea, Lavazza and Nestlé both need internal champions before momentum disappears…"*
- Below the narrative, colored summary pills (e.g. *"2 need champion development"*, *"1 needs discovery focus"*).
- Subtle animated aurora gradient + ForSkale AI badge.
- Logic in `lib/dealNarrative.ts → buildStrategicBriefingBanner`.

### 2. Pattern Detection Card
Cross-deal intelligence module that surfaces recurring themes:
- *"Lavazza and Nestlé both need internal champions"*
- *"3 deals have procurement risk"*
- Clicking a pattern highlights the matched deals in the rail (cyan ring).
- Logic in `lib/dealNarrative.ts → detectCrossDealPatterns`.

### 3. Narrative Deal Rail (left)
Each row is a strategic story, not a CRM line:
- Company name + cognitive state badge
- One-line situation summary (e.g. *"VP Ops is blocking momentum. Act within 48 hours."*)
- Small metadata: interest %, meeting count, days at stage
- **Left border = urgency tier** — red (critical), orange (active), gray (passive), green (won)
- Hover expands the row and reveals the full SVG **interest journey** card; click opens the strategy overlay.
- Header sort: Urgency · Interest · Recent.
- Logic in `lib/dealNarrative.ts → getDealSituationLine`, `getUrgencyTier`.

### 4. Smart Empty State (center)
Replaces a blank panel before any deal is selected. Three premium insight cards:
- **Top priority** — most urgent active deal
- **Biggest risk** — most loss-risks
- **Fastest growing** — highest velocity
- Each card opens the strategy overlay on click. Logic: `buildEmptyStateInsights`.

### 5. Strategy Overlay (right drawer, click a deal)
Plays a ~7s multi-step orbital loader on first open per deal, then renders:
- **Strategic Briefing** narrative card
- **Situation → Friction → Move → Timing framework** (`StrategyFramework.tsx`) — six-row scannable card. Each "Recommended Action" includes a *"Why?"* line derived via `getWhyForAction`.
- **Avoid These Moves** (`AvoidMoves.tsx`) — red AI-guardrail box with 2-4 stage-aware do-nots derived via `getAvoidMoves`.
- **Use-Case Scenario Tabs** (`ScenarioTabs.tsx`) — one tab per cognitive state. For each scenario: when it applies, do this, avoid, common mistakes, positive signals, and next milestone. Default tab = the deal's current state.
- Cognitive state explainer, top priorities & risk warnings.
- Action items, interest signals, decision friction, deal context (collapsible).

## Dynamic Timing Logic
`getTimingRecommendation(deal)` returns context-aware timing:
- Velocity < 0 → *"Act within 24 hours — momentum is dropping"*
- Days at stage > 10 → *"Re-engagement needed — silent for 10+ days"*
- High velocity → *"Capitalize fast — book the next step today"*
- etc.

## Key Files

| Concern | File |
|---|---|
| Interest → cognitive state mapping | `src/data/mockStrategyData.ts` |
| Stage color tokens | `src/lib/stageColors.ts` |
| Urgency ranking | `src/lib/urgencyEngine.ts` |
| **Narrative derivation (banner, patterns, framework, scenarios, why, avoid, timing)** | `src/lib/dealNarrative.ts` |
| Briefing generator | `src/lib/strategicBriefing.ts` |
| Methodology selector (MEDDIC, SPIN, BANT…) | `src/components/strategy/strategyMethodologies.ts` |
| Analysis orchestrator | `src/components/strategy/strategyOrchestrator.ts` |
| Briefing cache | `src/hooks/useAnalysisCache.ts` |

## Design System

- Dark theme, ForSkale teal/green palette, dark gradient sidebar.
- All colors are HSL semantic tokens defined in `src/index.css` and `tailwind.config.ts`. Components must use semantic tokens, never hardcoded hex.
- shadcn/ui customized via variants.
- Subtle motion only: aurora gradients on banner & empty state, orbital loader in overlay.

## Tech Stack

React 18 · Vite 5 · Tailwind v3 · TypeScript 5 · shadcn/ui · Lucide icons. Client-side only.

## Develop

```bash
npm install
npm run dev
```
