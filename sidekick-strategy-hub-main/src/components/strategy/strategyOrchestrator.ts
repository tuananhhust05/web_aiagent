import { DealContext, LoaderStep, StrategyAnalysisResult } from './types';
import { recommendMethodologies } from './strategyMethodologies';

export const analysisLoaderSteps: LoaderStep[] = [
  { id: 'crm-sync', label: 'Syncing CRM, meeting history and open actions', icon: 'database', tint: 'from-sky-500 via-cyan-400 to-emerald-400', durationMs: 650 },
  { id: 'search-web', label: 'Scanning web methodologies and market context', icon: 'globe', tint: 'from-blue-500 via-indigo-500 to-violet-500', durationMs: 700 },
  { id: 'social-signals', label: 'Reviewing social, email and stakeholder signals', icon: 'sparkles', tint: 'from-fuchsia-500 via-pink-500 to-rose-500', durationMs: 650 },
  { id: 'compose-plan', label: 'Building strategic branches and action plan', icon: 'wand-2', tint: 'from-emerald-500 via-teal-400 to-cyan-500', durationMs: 900 }
];

function stageWeight(stage: DealContext['stage']) {
  switch (stage) {
    case 'attention': return 28;
    case 'curiosity': return 42;
    case 'trust': return 58;
    case 'validation': return 68;
    case 'commitment': return 80;
    case 'decision': return 92;
    case 'lost': return 8;
    default: return 40;
  }
}

export async function runStrategyAnalysis(deal: DealContext): Promise<StrategyAnalysisResult> {
  const methodology = recommendMethodologies(deal);

  // Simulate analysis time
  await new Promise((resolve) => setTimeout(resolve, 100));

  const score = Math.max(
    5,
    Math.min(
      98,
      stageWeight(deal.stage)
        + (deal.hasChampion ? 8 : -6)
        + (deal.hasEconomicBuyer ? 6 : -8)
        + Math.round((deal.painClarity - 50) / 4)
        + Math.round((deal.urgencyScore - 50) / 6)
        - deal.objections.length * 4
    )
  );

  const verdict = score >= 75
    ? 'Strong momentum, but keep control of the next commitment.'
    : score >= 55
      ? 'Promising deal, but progression depends on tighter stakeholder alignment.'
      : 'Fragile deal state. Discovery and value reframing are still required.';

  const summary = `${deal.companyName} is currently in ${deal.stage} stage. The biggest levers are ${deal.hasChampion ? 'champion activation' : 'finding a champion'}, ${deal.hasEconomicBuyer ? 'economic-buyer alignment' : 'economic-buyer access'}, and objection handling around ${deal.objections.slice(0, 2).join(', ') || 'deal progress'}.`;

  const nextActions = [
    methodology.primary.id === 'spin'
      ? 'Run a short implication-based discovery follow-up and quantify the cost of inaction.'
      : 'Map the decision path, confirm buyer roles, and validate the required proof for progression.',
    deal.hasEconomicBuyer
      ? 'Send a stakeholder-specific recap tied to the economic outcome.'
      : 'Secure access to the economic buyer through the current sponsor or champion.',
    'Push the highest-confidence task into Action Ready with deadline and owner.'
  ];

  const futureBranches = [
    {
      if: 'The buyer accepts a follow-up meeting this week',
      then: 'Prepare an evidence-backed agenda and route the task to Meeting Intelligence for readiness.'
    },
    {
      if: 'Pricing or risk objections continue',
      then: 'Pull the matching approved answer from QnA Engine and create a challenger-style reframing note.'
    },
    {
      if: 'No reply within 48 hours',
      then: 'Create a reminder in Action Ready and prepare a concise value-led follow-up message.'
    }
  ];

  return {
    score,
    verdict,
    summary,
    methodology,
    nextActions,
    futureBranches,
    deeperLinks: [
      { label: 'Review meeting prep signals', productArea: 'Meeting Intelligence' },
      { label: 'Review latest call evidence', productArea: 'Meeting Insight' },
      { label: 'Review coaching and execution trends', productArea: 'Performance' },
      { label: 'Review recurring objections and approved answers', productArea: 'QnA Engine' },
      { label: 'Convert into executable tasks', productArea: 'Action Ready' }
    ]
  };
}
