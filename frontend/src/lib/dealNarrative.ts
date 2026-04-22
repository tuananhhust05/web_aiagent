// Derives narrative content from CompanyDeal data — single source of truth
// for the strategic briefing banner, narrative deal cards, pattern detection,
// smart empty state, scenario guides, why-behind-action and avoid-moves.
//
// Pure functions, no side effects, no schema changes — everything is computed
// from existing CompanyDeal fields.

import type { CompanyDeal } from '@/data/mockStrategyData';
import { getCognitiveState } from '@/data/mockStrategyData';
import { calculateUrgencyScore } from '@/lib/urgencyEngine';

// ─── Urgency tier (drives left-border color on cards) ───
export type UrgencyTier = 'critical' | 'active' | 'passive' | 'won' | 'lost';

export function getUrgencyTier(deal: CompanyDeal): UrgencyTier {
  if (deal.status === 'closed_won') return 'won';
  if (deal.status === 'closed_lost') return 'lost';
  const hasCritical = deal.actionItems.some((a) => a.priority === 'Critical');
  if (hasCritical || deal.daysAtCurrentLevel > 7 || deal.interestVelocity < 0) return 'critical';
  if (deal.interestVelocity > 0 || deal.status === 'ongoing_negotiation') return 'active';
  return 'passive';
}

export const urgencyBorder: Record<UrgencyTier, string> = {
  critical: 'border-l-destructive',
  active: 'border-l-orange-500',
  passive: 'border-l-muted-foreground/40',
  won: 'border-l-[hsl(var(--status-great))]',
  lost: 'border-l-muted',
};

export const urgencyDot: Record<UrgencyTier, string> = {
  critical: 'bg-destructive',
  active: 'bg-orange-500',
  passive: 'bg-muted-foreground/50',
  won: 'bg-[hsl(var(--status-great))]',
  lost: 'bg-muted-foreground/30',
};

// ─── One-line situation summary per deal (narrative card subtitle) ───
export function getDealSituationLine(deal: CompanyDeal): string {
  const cog = getCognitiveState(deal.interestLevel).name;
  const stalled = deal.daysAtCurrentLevel > 7;
  const dropping = deal.interestVelocity < 0;
  const blockedStakeholder = deal.stakeholders.find((s) => s.priority);
  const critical = deal.actionItems.find((a) => a.priority === 'Critical');

  if (deal.status === 'closed_won') return 'Deal won. Use as a reference pattern.';
  if (deal.status === 'closed_lost') return 'Deal lost. Capture lessons and re-engage in 90 days.';

  if (dropping) return `Interest dropping ${deal.interestVelocity}%/day. Re-engagement window closing fast.`;
  if (stalled) return `Silent for ${deal.daysAtCurrentLevel} days at ${deal.interestLevel}%. Re-engagement opportunity.`;
  if (blockedStakeholder) return `${blockedStakeholder.title} is blocking momentum. Act within 48 hours.`;
  if (critical) return `${critical.title}. ${critical.interestImpact || ''}`.trim();
  if (cog === 'Attention' || cog === 'Curiosity') return 'Early curiosity is growing. Discovery call is critical.';
  return `${cog} stage. ${deal.nextAction}.`;
}

// ─── Strategic briefing narrative for the top banner ───
export interface BannerSummaryPill {
  label: string;
  tone: 'critical' | 'warning' | 'info' | 'positive';
}

export interface StrategicBriefingBanner {
  narrative: string;
  pills: BannerSummaryPill[];
}

export function buildStrategicBriefingBanner(userName: string, deals: CompanyDeal[]): StrategicBriefingBanner {
  const active = deals.filter((d) => d.status === 'ongoing_negotiation' || d.status === 'first_meeting');

  // Group patterns
  const noChampion = active.filter((d) => d.stakeholders.some((s) => s.priority && s.status === 'Not Yet Met'));
  const earlyStage = active.filter((d) => d.interestLevel < 40);
  const stalled = active.filter((d) => d.daysAtCurrentLevel > 5 && d.interestVelocity <= 0.5);
  const fastMoving = active.filter((d) => d.interestVelocity >= 1.5);
  const procurement = active.filter((d) =>
    d.lossRisks?.some((r) => /procurement|legal/i.test(r)) ||
    d.objections?.some((o) => /procurement|legal/i.test(o.objection))
  );

  const fragments: string[] = [];

  if (noChampion.length >= 2) {
    fragments.push(`${noChampion.slice(0, 2).map((d) => d.company).join(' and ')} both need internal champions before momentum disappears.`);
  } else if (noChampion.length === 1) {
    fragments.push(`${noChampion[0].company} needs an internal champion this week.`);
  }

  if (earlyStage.length >= 2) {
    fragments.push(`${earlyStage.length} deals are still in attention mode — focus on curiosity, not pricing.`);
  } else if (earlyStage.length === 1) {
    fragments.push(`${earlyStage[0].company} is early but curiosity is rising.`);
  }

  if (stalled.length > 0 && noChampion.length === 0) {
    fragments.push(`${stalled[0].company} has been silent for ${stalled[0].daysAtCurrentLevel} days — re-engagement window matters.`);
  }

  if (procurement.length >= 2) {
    fragments.push(`Procurement is slowing momentum across ${procurement.length} deals.`);
  }

  if (fastMoving.length > 0 && fragments.length < 2) {
    fragments.push(`${fastMoving[0].company} has strong velocity (+${fastMoving[0].interestVelocity}%/day) — capitalize this week.`);
  }

  fragments.push('One strong discovery call this week could meaningfully shift the quarter.');

  const narrative = `${userName}, ${fragments.slice(0, 3).join(' ')}`;

  const pills: BannerSummaryPill[] = [];
  if (noChampion.length > 0) pills.push({ label: `${noChampion.length} need champion development`, tone: 'critical' });
  if (earlyStage.length > 0) pills.push({ label: `${earlyStage.length} need discovery focus`, tone: 'info' });
  if (stalled.length > 0) pills.push({ label: `${stalled.length} at risk this week`, tone: 'warning' });
  if (fastMoving.length > 0) pills.push({ label: `${fastMoving.length} accelerating`, tone: 'positive' });

  return { narrative, pills };
}

export const pillStyles: Record<BannerSummaryPill['tone'], string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  info: 'bg-[hsl(var(--forskale-cyan)/0.12)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.25)]',
  positive: 'bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))] border-[hsl(var(--status-great)/0.25)]',
};

// ─── Cross-deal pattern detection ───
export interface DetectedPattern {
  id: string;
  insight: string;
  cta: string;
  matchedDealIds: string[];
}

export function detectCrossDealPatterns(deals: CompanyDeal[]): DetectedPattern[] {
  const active = deals.filter((d) => d.status === 'ongoing_negotiation' || d.status === 'first_meeting');
  const patterns: DetectedPattern[] = [];

  const noChampion = active.filter((d) => d.stakeholders.some((s) => s.priority && s.status === 'Not Yet Met'));
  if (noChampion.length >= 2) {
    patterns.push({
      id: 'no-champion',
      insight: `${noChampion.map((d) => d.company).join(' and ')} both need internal champions.`,
      cta: 'Apply champion-building playbook',
      matchedDealIds: noChampion.map((d) => d.id),
    });
  }

  const earlyForPricing = active.filter((d) => d.interestLevel < 40);
  if (earlyForPricing.length >= 2) {
    patterns.push({
      id: 'too-early-pricing',
      insight: `${earlyForPricing.map((d) => d.company).join(' and ')} are still too early for pricing discussions.`,
      cta: 'Switch focus to curiosity & discovery',
      matchedDealIds: earlyForPricing.map((d) => d.id),
    });
  }

  const procurementRisk = active.filter((d) =>
    d.lossRisks?.some((r) => /procurement/i.test(r)) || d.objections?.some((o) => /procurement/i.test(o.objection))
  );
  if (procurementRisk.length >= 2) {
    patterns.push({
      id: 'procurement-risk',
      insight: `${procurementRisk.length} deals have procurement risk.`,
      cta: 'Map procurement timeline early',
      matchedDealIds: procurementRisk.map((d) => d.id),
    });
  }

  const cfoRisk = active.filter((d) =>
    d.lossRisks?.some((r) => /cfo|budget|pricing/i.test(r)) || d.objections?.some((o) => /pricing|budget/i.test(o.objection))
  );
  if (cfoRisk.length >= 2) {
    patterns.push({
      id: 'cfo-risk',
      insight: `${cfoRisk.length} deals are blocked by budget or CFO concerns.`,
      cta: 'Prepare ROI-focused materials',
      matchedDealIds: cfoRisk.map((d) => d.id),
    });
  }

  return patterns;
}

// ─── Smart empty state insights (right side when no deal selected) ───
export interface EmptyStateInsight {
  label: string;
  dealId: string;
  company: string;
  insight: string;
  tone: 'critical' | 'warning' | 'positive';
}

export function buildEmptyStateInsights(deals: CompanyDeal[]): EmptyStateInsight[] {
  const active = deals.filter((d) => d.status === 'ongoing_negotiation' || d.status === 'first_meeting');
  if (active.length === 0) return [];

  const byUrgency = [...active].sort((a, b) => calculateUrgencyScore(b) - calculateUrgencyScore(a));
  const topPriority = byUrgency[0];

  const byRisk = [...active].sort((a, b) => (b.lossRisks?.length || 0) - (a.lossRisks?.length || 0));
  const biggestRisk = byRisk[0];

  const byMomentum = [...active].sort((a, b) => b.interestVelocity - a.interestVelocity);
  const fastest = byMomentum[0];

  const out: EmptyStateInsight[] = [];
  if (topPriority) {
    out.push({
      label: 'Top priority',
      dealId: topPriority.id,
      company: topPriority.company,
      insight: `${topPriority.company} is your most urgent opportunity.`,
      tone: 'critical',
    });
  }
  if (biggestRisk && biggestRisk.id !== topPriority?.id) {
    out.push({
      label: 'Biggest risk',
      dealId: biggestRisk.id,
      company: biggestRisk.company,
      insight: `${biggestRisk.company} may require re-engagement soon.`,
      tone: 'warning',
    });
  }
  if (fastest && fastest.id !== topPriority?.id && fastest.id !== biggestRisk?.id) {
    out.push({
      label: 'Fastest growing',
      dealId: fastest.id,
      company: fastest.company,
      insight: `${fastest.company} has the highest momentum increase this week (+${fastest.interestVelocity}%/day).`,
      tone: 'positive',
    });
  }
  return out.slice(0, 3);
}

// ─── Strategy framework (Situation → Friction → Move → Timing) ───
export interface StrategyFrameworkData {
  situation: string;
  friction: string;
  approach: string;
  action: string;
  timing: string;
  expectedResult: string;
  avoid: string[];
}

export function buildStrategyFramework(deal: CompanyDeal): StrategyFrameworkData {
  const cog = getCognitiveState(deal.interestLevel).name;
  const topFriction = [...deal.decisionFriction].sort((a, b) => {
    const r = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
    return r[b.frictionLevel] - r[a.frictionLevel];
  })[0];
  const topAction = deal.actionItems.find((a) => a.priority === 'Critical') || deal.actionItems[0];

  return {
    situation: deal.situationSummary || `${deal.company} is in ${cog} stage at ${deal.interestLevel}% interest.`,
    friction: topFriction
      ? `${topFriction.title} — ${topFriction.whyItMatters}`
      : 'No major friction detected. Maintain momentum.',
    approach: topFriction
      ? topFriction.effectOnInterest
      : 'Reinforce trust, expand stakeholder coverage, and validate next milestone.',
    action: topAction?.title || deal.nextAction,
    timing: getTimingRecommendation(deal),
    expectedResult: topAction?.interestImpact
      ? `${topAction.interestImpact} interest movement if executed cleanly.`
      : `Move from ${cog} toward the next cognitive state.`,
    avoid: getAvoidMoves(deal),
  };
}

// ─── Dynamic timing logic ───
export function getTimingRecommendation(deal: CompanyDeal): string {
  if (deal.interestVelocity < 0) return 'Act within 24 hours — momentum is dropping.';
  if (deal.daysAtCurrentLevel > 10) return 'Re-engagement needed — silent for 10+ days. Send a value-led nudge.';
  if (deal.daysAtCurrentLevel > 7) return 'Momentum window closing — act within 48 hours.';
  if (deal.interestVelocity >= 2) return 'Capitalize fast — strike while velocity is high. Book the next step today.';
  if (deal.interestLevel >= 70) return 'Act within 2 business days to keep validation alive.';
  if (deal.interestLevel < 30) return 'No rush — focus on curiosity. Follow up within the week.';
  return 'Act within 3-5 business days.';
}

// ─── Avoid moves (AI guardrails) — derived from cognitive state + friction ───
export function getAvoidMoves(deal: CompanyDeal): string[] {
  const cog = getCognitiveState(deal.interestLevel).name;
  const moves: string[] = [];

  if (deal.interestLevel < 40) {
    moves.push('Avoid pricing or contract talk — they are not ready.');
    moves.push('Avoid technical deep dives before the problem is acknowledged.');
  }
  if (cog === 'Trust' || cog === 'Evaluation') {
    moves.push('Avoid reopening pricing if the real issue is trust.');
  }
  if (cog === 'Validation' || cog === 'Commitment Intent') {
    moves.push('Avoid pushing for contract before champion alignment is secured.');
    moves.push('Avoid surprise stakeholders — pre-align before any group call.');
  }
  if (deal.daysAtCurrentLevel > 7) {
    moves.push('Avoid pressure follow-ups — the prospect needs space and a fresh angle.');
  }
  if (deal.lossRisks?.some((r) => /competitor/i.test(r))) {
    moves.push('Avoid attacking the competitor directly — frame around your own proof.');
  }
  if (moves.length === 0) {
    moves.push('Avoid breaking momentum with low-value updates.');
  }
  return moves.slice(0, 4);
}

// ─── Why-behind-action explanations ───
export function getWhyForAction(deal: CompanyDeal, actionTitle: string): string {
  const lower = actionTitle.toLowerCase();
  if (/champion|vp|stakeholder|sponsor/.test(lower)) {
    return 'Because no internal advocate currently exists to defend the deal when you are not in the room.';
  }
  if (/roi|pricing|budget/.test(lower)) {
    const seen = deal.objections?.filter((o) => /pric|budget/i.test(o.objection)).length || 0;
    return seen > 0
      ? `Because pricing concerns appeared ${seen} time${seen === 1 ? '' : 's'} in recent conversations.`
      : 'Because economic justification is the unlock at this stage.';
  }
  if (/follow[-\s]?up|reach out|nudge/.test(lower)) {
    return deal.daysAtCurrentLevel > 7
      ? `Because the deal has been silent for ${deal.daysAtCurrentLevel} days — re-engagement matters now.`
      : 'Because momentum needs a small, well-timed push.';
  }
  if (/discovery|implication|pain/.test(lower)) {
    return 'Because problem recognition is still incomplete — quantify the cost of inaction.';
  }
  if (/procurement|legal|contract/.test(lower)) {
    return 'Because procurement clarity is the gating step before commitment can happen.';
  }
  return 'Because this directly removes the highest-impact friction blocking progression.';
}

// ─── Scenario guides per cognitive state (Use-Case Tabs) ───
export interface ScenarioGuide {
  state: string;
  whenItApplies: string;
  doThis: string[];
  avoid: string[];
  commonMistakes: string[];
  nextMilestone: string;
  positiveSignals: string[];
}

export const scenarioGuides: Record<string, ScenarioGuide> = {
  Attention: {
    state: 'Attention',
    whenItApplies: 'They notice you exist but have no emotional engagement yet.',
    doThis: ['Lead with relevant industry insight', 'Earn 10 minutes, not 60', 'Reference a peer they respect'],
    avoid: ['Sending a deck', 'Asking for budget', 'Pitching features'],
    commonMistakes: ['Treating polite listening as buying intent', 'Skipping discovery to "save time"'],
    nextMilestone: 'A second meeting with a specific question they want answered.',
    positiveSignals: ['They reply within 24h', 'They ask one curious question'],
  },
  Curiosity: {
    state: 'Curiosity',
    whenItApplies: 'They want to learn more and are asking technical or how-it-works questions.',
    doThis: ['Answer with examples, not specs', 'Surface 1-2 customer stories', 'Ask what would make this real for them'],
    avoid: ['Pricing conversations', 'Contract templates', 'Competitor bashing'],
    commonMistakes: ['Mistaking interest for intent', 'Overloading with information'],
    nextMilestone: 'A discovery call with at least one peer or technical owner present.',
    positiveSignals: ['They invite a colleague', 'They share an internal context'],
  },
  Interest: {
    state: 'Interest',
    whenItApplies: 'They see potential value and mention using it or discussing internally.',
    doThis: ['Quantify the problem', 'Ask about decision criteria', 'Set up a working session, not a pitch'],
    avoid: ['Sending a proposal too early', 'Skipping pain quantification'],
    commonMistakes: ['Confirming features instead of confirming pain'],
    nextMilestone: 'Mutual agreement on the problem worth solving.',
    positiveSignals: ['They share metrics', 'They book a follow-up themselves'],
  },
  'Problem Recognition': {
    state: 'Problem Recognition',
    whenItApplies: 'They admit the problem exists and share real numbers.',
    doThis: ['Map cost of inaction', 'Identify the economic buyer', 'Co-build a success picture'],
    avoid: ['Solutioning before the problem is fully owned'],
    commonMistakes: ['Jumping to a demo before pain is real'],
    nextMilestone: 'A demo scoped to their specific pain.',
    positiveSignals: ['They use the word "we" not "you"', 'They share confidential context'],
  },
  Trust: {
    state: 'Trust',
    whenItApplies: 'They believe you can help and ask "how would you do this?"',
    doThis: ['Show a tailored solution path', 'Bring a similar customer reference', 'Reduce perceived risk'],
    avoid: ['Reopening pricing if trust is the real issue', 'Surprise stakeholders'],
    commonMistakes: ['Talking instead of demonstrating fit'],
    nextMilestone: 'A formal evaluation owned by their team.',
    positiveSignals: ['Collaborative tone', 'Forward-looking language'],
  },
  Evaluation: {
    state: 'Evaluation',
    whenItApplies: 'Multiple stakeholders are seriously considering you.',
    doThis: ['Run a stakeholder map', 'Provide an evaluation rubric', 'Pre-handle competitor comparisons'],
    avoid: ['Letting them evaluate alone', 'Discount-led negotiation'],
    commonMistakes: ['Assuming the loudest voice is the decision-maker'],
    nextMilestone: 'A scoped proposal with clear success criteria.',
    positiveSignals: ['Tech team engaged', 'They request references'],
  },
  Validation: {
    state: 'Validation',
    whenItApplies: 'Prospect is validating fit internally and comparing options.',
    doThis: ['Build an internal champion', 'Map procurement', 'Reduce risk with a guarantee or pilot'],
    avoid: ['Pricing pressure', 'Aggressive follow-up', 'Bypassing the champion'],
    commonMistakes: ['Selling instead of de-risking', 'Ignoring procurement until it is too late'],
    nextMilestone: 'Verbal commitment from the economic buyer.',
    positiveSignals: ['Budget approved', 'Timelines discussed', 'T&Cs requested'],
  },
  'Commitment Intent': {
    state: 'Commitment Intent',
    whenItApplies: 'They intend to commit and are asking about timelines.',
    doThis: ['Make saying yes easy', 'Provide draft contract early', 'Lock the start date'],
    avoid: ['Adding new product talk', 'Slowing down the process'],
    commonMistakes: ['Letting legal stall without a champion'],
    nextMilestone: 'Signed contract or formal verbal yes.',
    positiveSignals: ['"Let\'s get started"', 'Onboarding questions'],
  },
  Decision: {
    state: 'Decision',
    whenItApplies: 'Decided — only logistics remain.',
    doThis: ['Confirm the win in writing', 'Set kickoff date', 'Introduce CSM early'],
    avoid: ['Last-minute changes', 'Disappearing post-signature'],
    commonMistakes: ['Treating signature as the end'],
    nextMilestone: 'A successful kickoff and first value moment.',
    positiveSignals: ['No more what-ifs', 'Logistics-only conversations'],
  },
};
