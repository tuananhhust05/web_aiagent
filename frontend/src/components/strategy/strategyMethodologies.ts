import { DealContext, MethodologyDefinition, MethodologyRecommendation, SalesMethodologyId } from './types';

export const methodologyRegistry: MethodologyDefinition[] = [
  {
    id: 'meddic',
    name: 'MEDDIC',
    shortDescription: 'Qualification framework for complex B2B deals with strong focus on metrics, buyer access, decision criteria, decision process, pain, and champion.',
    bestFor: ['multi-stakeholder enterprise deals', 'forecast discipline', 'late discovery and validation'],
    useWhen: ['stakeholders are numerous', 'you need to map the buying process', 'forecast confidence matters'],
    avoidWhen: ['the deal is very transactional', 'you have almost no deal context yet'],
    keyQuestions: ['What measurable outcome matters most?', 'Who is the economic buyer?', 'Who is your champion?'],
    motionLabel: 'Complex qualification',
    source: 'external',
    sourceUrl: 'https://www.salesforce.com/blog/bant-vs-meddic/'
  },
  {
    id: 'meddpicc',
    name: 'MEDDPICC',
    shortDescription: 'Extended MEDDIC adding Paper Process and Competition for modern enterprise selling.',
    bestFor: ['procurement-heavy deals', 'competitive deals', 'late-stage enterprise cycles'],
    useWhen: ['legal/procurement are involved', 'competitive pressure is high', 'paper process can delay close'],
    avoidWhen: ['deal size is small', 'sales cycle is short and direct'],
    keyQuestions: ['What is the paper process?', 'Who are we competing against?', 'What proof will the buyer need internally?'],
    motionLabel: 'Enterprise close control',
    source: 'external',
    sourceUrl: 'https://meddicc.com/meddpicc-sales-methodology-and-process'
  },
  {
    id: 'spin',
    name: 'SPIN',
    shortDescription: 'Discovery methodology centered on Situation, Problem, Implication and Need-Payoff questions.',
    bestFor: ['discovery calls', 'early trust building', 'consultative conversations'],
    useWhen: ['the rep needs to uncover business pain', 'the buyer problem is still vague'],
    avoidWhen: ['the deal is already procurement-led', 'the conversation is only about contracting'],
    keyQuestions: ['What is the current situation?', 'What problem is blocking progress?', 'What happens if this stays unsolved?', 'What value comes from fixing it?'],
    motionLabel: 'Discovery and need creation',
    source: 'external',
    sourceUrl: 'https://www.huthwaiteinternational.com/blog/complete-guide-to-spin-selling'
  },
  {
    id: 'bant',
    name: 'BANT',
    shortDescription: 'Simple qualification framework using Budget, Authority, Need and Timeline.',
    bestFor: ['SMB qualification', 'fast triage', 'junior seller workflows'],
    useWhen: ['speed matters', 'lead volume is high', 'deal complexity is low or medium'],
    avoidWhen: ['stakeholder webs are complex', 'buying process is political'],
    keyQuestions: ['Is there budget?', 'Who has authority?', 'Is the need urgent and real?', 'What is the timeline?'],
    motionLabel: 'Fast qualification',
    source: 'external',
    sourceUrl: 'https://www.salesforce.com/blog/what-is-bant-lead-generation/'
  },
  {
    id: 'challenger',
    name: 'Challenger',
    shortDescription: 'Teach, tailor and take control by bringing commercial insight and constructive tension.',
    bestFor: ['status-quo buyers', 'competitive markets', 'value-selling'],
    useWhen: ['the buyer undervalues change', 'you must differentiate with insight'],
    avoidWhen: ['trust is fragile and rep lacks credibility', 'the team has weak commercial insight'],
    keyQuestions: ['What costly assumption is the buyer making?', 'What new insight can reframe the problem?', 'What commitment should be secured next?'],
    motionLabel: 'Insight-led persuasion',
    source: 'external',
    sourceUrl: 'https://challengerinc.com/what-is-challenger-sales-methodology/'
  },
  {
    id: 'champ',
    name: 'CHAMP',
    shortDescription: 'Challenges, Authority, Money, Prioritization framework focused on pain-first qualification.',
    bestFor: ['pain-led qualification', 'mid-market SaaS', 'strong urgency discovery'],
    useWhen: ['need is visible but budget clarity is weak'],
    avoidWhen: ['procurement complexity dominates'],
    keyQuestions: ['What challenge hurts most?', 'How urgent is it?', 'Who can sponsor action?'],
    motionLabel: 'Pain-first qualification',
    source: 'internal'
  },
  {
    id: 'neat',
    name: 'NEAT',
    shortDescription: 'Need, Economic impact, Access to authority, Timeline.',
    bestFor: ['buyer-centric qualification', 'economic storytelling', 'decision alignment'],
    useWhen: ['you need to quantify business impact quickly'],
    avoidWhen: ['you need detailed procurement mapping'],
    keyQuestions: ['What need is most urgent?', 'What is the economic impact?', 'Who needs to be aligned?'],
    motionLabel: 'Buyer-centric qualification',
    source: 'internal'
  },
  {
    id: 'sandler',
    name: 'Sandler',
    shortDescription: 'Mutual qualification process emphasizing pain, budget, decision and equal business stature.',
    bestFor: ['trust building', 'rep discipline', 'avoiding unpaid consulting'],
    useWhen: ['the rep needs stronger control and cleaner qualification'],
    avoidWhen: ['a highly prescriptive enterprise map is needed immediately'],
    keyQuestions: ['What pain is compelling enough to act?', 'What happens if nothing changes?', 'How will the decision be made?'],
    motionLabel: 'Mutual qualification',
    source: 'internal'
  }
];

const find = (id: SalesMethodologyId) => {
  const methodology = methodologyRegistry.find((item) => item.id === id);
  if (!methodology) throw new Error(`Unknown methodology: ${id}`);
  return methodology;
};

export function recommendMethodologies(deal: DealContext): MethodologyRecommendation {
  const rationale: string[] = [];
  const executionPlan: string[] = [];

  let primary: SalesMethodologyId = 'spin';
  let secondary: SalesMethodologyId[] = ['bant'];

  if (deal.complexity === 'enterprise' || deal.stakeholders >= 5) {
    primary = deal.hasEconomicBuyer && deal.hasChampion ? 'meddpicc' : 'meddic';
    secondary = ['challenger', 'spin'];
    rationale.push('Complex multi-stakeholder deal needs process mapping, buyer access, and champion validation.');
  }

  if (deal.stage === 'attention' || deal.stage === 'curiosity') {
    primary = 'spin';
    secondary = ['bant', 'champ'];
    rationale.push('Early-stage deal needs sharper discovery, implication building, and need-payoff articulation.');
  }

  if (deal.stage === 'validation' || deal.stage === 'commitment') {
    primary = deal.complexity === 'enterprise' ? 'meddpicc' : 'meddic';
    secondary = ['challenger', 'sandler'];
    rationale.push('Validation and commitment stages require buyer-process control and stronger progression discipline.');
  }

  if (deal.objections.length >= 2 && deal.stage !== 'lost') {
    secondary = Array.from(new Set([...secondary, 'challenger']));
    rationale.push('Multiple objections suggest adding an insight-led challenger motion to reframe the value case.');
  }

  if (deal.complexity === 'low' && deal.urgencyScore > 70 && deal.stage === 'attention') {
    primary = 'bant';
    secondary = ['spin'];
    rationale.push('Fast-moving lower-complexity deal can be triaged efficiently with BANT before deeper discovery.');
  }

  executionPlan.push(
    '1. Confirm the active methodology and explain why it fits this deal.',
    '2. Pull evidence from Meeting Intelligence, Meeting Insight, Performance, and QnA Engine.',
    '3. Produce a concise verdict, next action, and branch-based follow-up plan.',
    '4. Push executable tasks to Action Ready and add reminder logic for external actions.'
  );

  const primaryMethod = find(primary);
  const secondaryMethods = secondary.map(find);

  return {
    primary: primaryMethod,
    secondary: secondaryMethods,
    rationale,
    executionPlan,
    copyReadyMessage: `Recommended motion for ${deal.companyName}: lead with ${primaryMethod.name}, supported by ${secondaryMethods.map((item) => item.name).join(' + ')}. Focus on the buyer pain, the stakeholder path, and the next commitment.`
  };
}
