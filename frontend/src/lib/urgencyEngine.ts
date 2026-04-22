import type { CompanyDeal } from '@/data/mockStrategyData';
import { getCognitiveState } from '@/data/mockStrategyData';

const stateScores: Record<string, number> = {
  'Validation': 40,
  'Commitment Intent': 35,
  'Decision': 30,
  'Trust': 25,
  'Evaluation': 20,
  'Problem Recognition': 15,
  'Interest': 12,
  'Curiosity': 10,
  'Attention': 5,
};

export function calculateUrgencyScore(deal: CompanyDeal): number {
  const cogState = getCognitiveState(deal.interestLevel);
  let score = stateScores[cogState.name] ?? 0;

  // Plateau penalty
  if (deal.daysAtCurrentLevel > 3) {
    score += deal.daysAtCurrentLevel * 3;
  }

  // Velocity adjustments
  if (deal.interestVelocity < 0) score += 30;
  else if (deal.interestVelocity === 0) score += 15;
  else if (deal.interestVelocity > 2) score -= 5;

  // Critical actions
  const criticalActions = deal.actionItems.filter(a => a.priority === 'Critical');
  score += criticalActions.length * 20;

  // High-value deals
  const numericValue = parseInt(deal.dealValue.replace(/[^0-9]/g, '')) || 0;
  if (numericValue > 100000) score += 15;
  else if (numericValue > 50000) score += 10;

  // Competitor / loss risks
  if (deal.lossRisks.length > 2) score += 25;

  return Math.max(0, score);
}

export function sortDealsByUrgency(deals: CompanyDeal[]): CompanyDeal[] {
  return [...deals].sort((a, b) => {
    const scoreA = calculateUrgencyScore(a);
    const scoreB = calculateUrgencyScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    const valA = parseInt(a.dealValue.replace(/[^0-9]/g, '')) || 0;
    const valB = parseInt(b.dealValue.replace(/[^0-9]/g, '')) || 0;
    if (valA !== valB) return valB - valA;
    return b.interestLevel - a.interestLevel;
  });
}
