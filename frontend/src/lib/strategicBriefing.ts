import type { CompanyDeal } from '@/data/mockStrategyData';
import { getCognitiveState } from '@/data/mockStrategyData';

export interface StrategicBriefing {
  dealId: string;
  narrative: string;
  cognitiveStateExplanation: string;
  topPriorities: string[];
  riskWarnings: string[];
  adaptationStrategy: string;
  generatedAt: string;
}

const stateExplanations: Record<string, string> = {
  'Attention': 'The prospect has just noticed your solution. There is no emotional engagement yet, they are politely listening but uncommitted.',
  'Curiosity': 'The prospect wants to learn more. They are asking technical questions and requesting deeper information, but haven\'t connected it to their own problems.',
  'Interest': 'The prospect sees potential value and may be discussing your solution with colleagues. They\'re beginning to imagine using it.',
  'Problem Recognition': 'The prospect has admitted their problem exists and is sharing real pain points and numbers. This is a critical vulnerability moment.',
  'Trust': 'The prospect believes you can help. Conversations have shifted to collaborative "how would you" discussions. They\'re becoming an internal advocate.',
  'Evaluation': 'The prospect is actively comparing your solution against alternatives. Technical teams are engaged and multiple stakeholders are involved.',
  'Validation': 'The prospect is validating fit and building internal consensus. Budget discussions are happening and terms are being reviewed.',
  'Commitment Intent': 'The prospect intends to commit. They\'re asking about timelines and saying "let\'s get started." Internal approval is in progress.',
  'Decision': 'The prospect has decided. Only logistics remain — contracts, signatures, and onboarding planning.',
};

function getTopFriction(deal: CompanyDeal) {
  const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  return [...deal.decisionFriction].sort((a, b) => {
    const byLevel = (rank[b.frictionLevel] ?? 0) - (rank[a.frictionLevel] ?? 0);
    if (byLevel !== 0) return byLevel;
    return (b.blockingPercent ?? 0) - (a.blockingPercent ?? 0);
  })[0];
}

function buildNarrative(deal: CompanyDeal): string {
  const state = getCognitiveState(deal.interestLevel);
  const topFriction = getTopFriction(deal);
  const topAction = deal.actionItems.find((a) => a.priority === 'Critical') || deal.actionItems[0];
  const timing = topFriction?.timeline || (deal.interestLevel >= 70 ? 'Within 2 days' : 'Within this week');

  const situation = `${deal.company} is in ${state.name} stage at ${deal.interestLevel}% interest. ${deal.situationSummary || deal.dealAssessment}`;
  const friction = topFriction
    ? `${topFriction.title}${topFriction.blockingPercent ? ` (blocking ${topFriction.blockingPercent}% progression)` : ''}.`
    : `${deal.biggestBlocker}.`;
  const approach = topFriction?.effectOnInterest || topFriction?.currentState || 'Maintain momentum while expanding stakeholder alignment.';
  const action = topAction?.title || deal.nextAction;

  return [
    `Current Situation: ${situation}`,
    `Friction: ${friction}`,
    `Suggested Approach: ${approach}`,
    `Specific Action: ${action}.`,
    `Timing: ${timing}.`,
  ].join(' ');
}

export function generateStrategicBriefing(deal: CompanyDeal): StrategicBriefing {
  const cogState = getCognitiveState(deal.interestLevel);
  const topFriction = getTopFriction(deal);

  const narrative = buildNarrative(deal);

  const topPriorities = deal.actionItems
    .filter((a) => a.priority === 'Critical' || a.priority === 'High')
    .slice(0, 3)
    .map((a) => a.title);

  const riskWarnings = [
    ...(topFriction ? [topFriction.whyItMatters] : []),
    ...deal.lossRisks,
  ].slice(0, 3);

  const nextTarget = Math.min(90, (Math.floor(deal.interestLevel / 10) + 1) * 10);
  const adaptationStrategy = `Move from ${cogState.name} (${deal.interestLevel}%) toward ${nextTarget}% by removing the highest-impact blocker first.`;

  return {
    dealId: deal.id,
    narrative,
    cognitiveStateExplanation: stateExplanations[cogState.name] || '',
    topPriorities,
    riskWarnings,
    adaptationStrategy,
    generatedAt: new Date().toISOString(),
  };
}
