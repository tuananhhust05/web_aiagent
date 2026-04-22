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

function buildCompanyContext(deal: CompanyDeal): string {
  return `${deal.company} is interested,`;
}

function buildEmotionalState(deal: CompanyDeal): string {
  const blocker = deal.biggestBlocker.replace(/not yet engaged/i, 'still has concerns');
  return ` but the ${blocker} and holds final approval.`;
}

function buildSituationAssessment(deal: CompanyDeal): string {
  const parts: string[] = [];
  
  const competitorRisk = deal.lossRisks.find(r => r.toLowerCase().includes('competitor'));
  if (competitorRisk) {
    parts.push("A competitor is also under evaluation.");
  }

  if (deal.actionItems.length > 0) {
    let topAction = deal.actionItems[0].title;
    if (!topAction.toLowerCase().includes('turning')) {
      topAction = 'turning ' + topAction.charAt(0).toLowerCase() + topAction.slice(1);
    }
    parts.push(`Your biggest opportunity is ${topAction}.`);
  }

  return parts.join(' ');
}

function buildActionGuidance(deal: CompanyDeal): string {
  const cogState = getCognitiveState(deal.interestLevel);
  
  if (cogState.name === 'Validation') {
    return "If that works, push toward commitment; if not, reduce risk with a pilot approach.";
  }

  const guidance: Record<string, string> = {
    'Trust': 'If they engage with peer references, they\'re ready for validation. If not, continue building emotional connection.',
    'Evaluation': 'Provide competitive differentiation. Ensure your champion has the ammunition to defend your solution internally.',
    'Commitment Intent': 'Remove remaining friction. Simplify the contract process and ensure all stakeholders have signed off.',
    'Problem Recognition': 'Deepen the pain quantification. Help them calculate the cost of inaction.',
    'Curiosity': 'Shift from features to outcomes. Connect your solution to their specific business challenges.',
  };

  return guidance[cogState.name] ||
    'Maintain engagement and monitor for signals indicating readiness to advance.';
}

export function generateStrategicBriefing(deal: CompanyDeal): StrategicBriefing {
  const cogState = getCognitiveState(deal.interestLevel);

  const narrative = [
    buildCompanyContext(deal),
    buildEmotionalState(deal),
    " " + buildSituationAssessment(deal),
    " " + buildActionGuidance(deal),
  ].join('').replace(/\s+/g, ' ').trim();


  const topPriorities = deal.actionItems
    .filter(a => a.priority === 'Critical' || a.priority === 'High')
    .slice(0, 3)
    .map(a => a.title);

  const riskWarnings = deal.lossRisks.slice(0, 3);

  const nextTarget = deal.interestLevel < 80 ? 80 : 90;
  const adaptationStrategy = `Move from ${cogState.name} (${deal.interestLevel}%) toward ${nextTarget}% by addressing the top friction points and leveraging stakeholder momentum.`;

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
