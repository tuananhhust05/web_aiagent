// Mock data for the Strategy screen — Interest Level intelligence system

export type DealStatus = 'closed_won' | 'closed_lost' | 'ongoing_negotiation' | 'first_meeting';

// ─── Cognitive State (Interest Level mapping) ───
export interface CognitiveState {
  level: number; // 10-90
  name: string;
  description: string;
  signals: string[];
  timeInStage: string;
}

export const COGNITIVE_STATES: CognitiveState[] = [
  { level: 10, name: 'Attention', description: 'They notice you exist', signals: ['Listening politely', 'No emotional engagement'], timeInStage: '1-3 days' },
  { level: 20, name: 'Curiosity', description: 'They want to learn more', signals: ['Asking technical questions', 'Want deep dives'], timeInStage: '3-7 days' },
  { level: 30, name: 'Interest', description: 'They see potential value', signals: ['Mention using it', 'Discuss with colleagues'], timeInStage: '7-14 days' },
  { level: 40, name: 'Problem Recognition', description: 'They admit the problem exists', signals: ['Share real pain/numbers', 'Vulnerability shown'], timeInStage: '5-10 days' },
  { level: 50, name: 'Trust', description: 'They believe you can help', signals: ['Collaborative tone', 'Ask "how would you"'], timeInStage: '7-14 days' },
  { level: 60, name: 'Evaluation', description: 'Seriously considering you', signals: ['Technical team engaged', 'Multiple stakeholders'], timeInStage: '7-14 days' },
  { level: 70, name: 'Validation', description: 'Validating fit & consensus', signals: ['Budget approved', 'Discussing T&Cs'], timeInStage: '5-10 days' },
  { level: 80, name: 'Commitment Intent', description: 'Intending to commit', signals: ['"Let\'s get started"', 'Asking about timelines'], timeInStage: '3-7 days' },
  { level: 90, name: 'Decision', description: 'Decided, contracts signing', signals: ['No more what-ifs', 'Only logistics'], timeInStage: '1-3 days' },
];

export function getCognitiveState(interestLevel: number): CognitiveState {
  const rounded = Math.floor(interestLevel / 10) * 10;
  return COGNITIVE_STATES.find(s => s.level === Math.max(10, Math.min(90, rounded))) || COGNITIVE_STATES[0];
}

// ─── Interest Journey Point ───
export interface InterestJourneyPoint {
  date: string;
  interestLevel: number;
  cognitiveState: string;
  change: number;
  event: string;
  detail: string;
  meetingTitle?: string;
  participants?: string[];
}

// ─── Interest Signal ───
export interface InterestSignal {
  date: string;
  event: string;
  type: 'positive' | 'neutral' | 'negative';
  signalType: string;
  behavior: string;
  meaning: string;
  impactPercent: number;
}

// ─── Decision Friction ───
export interface DecisionFriction {
  title: string;
  frictionLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  blockingPercent: number;
  whyItMatters: string;
  currentState: string;
  effectOnInterest: string;
  howToRemove: string[];
  timeline: string;
  successIndicator: string;
}

// ─── CRM Mapping ───
export interface CRMMapping {
  interestLevel: number;
  cognitiveState: string;
  crmStage: string;
  inSync: boolean;
  lastSynced: string;
}

// ─── Interest Monitoring Alert ───
export interface InterestAlert {
  type: 'plateau' | 'drop' | 'acceleration' | 'healthy' | 'predictive';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action: string;
  isActive: boolean;
}

// ─── Friction Removal Roadmap ───
export interface FrictionRoadmapWeek {
  weekLabel: string;
  tasks: { task: string; frictionRemoved: string; done: boolean }[];
  expectedInterestMove: string;
}

// ─── Interaction History ───
export interface Interaction {
  date: string;
  type: 'Call' | 'Email' | 'Demo' | 'Meeting';
  attendees: string;
  outcome: string;
}

// ─── Stakeholder ───
export interface Stakeholder {
  name: string;
  title: string;
  role: string;
  status: 'Engaged' | 'Impressed' | 'Approved' | 'Not Yet Met';
  statusColor: 'green' | 'cyan' | 'orange' | 'red';
  notes: string;
  priority: boolean;
}

// ─── Objection ───
export interface DealObjection {
  objection: string;
  whenRaised: string;
  howAddressed: string;
  status: 'Resolved' | 'Partially Resolved' | 'Open';
  riskLevel?: 'Low' | 'Medium' | 'High';
}

// ─── Commitment ───
export interface Commitment {
  promise: string;
  deadline: string;
  status: 'Completed' | 'Pending' | 'Overdue';
}

// ─── Strategy ───
export interface StrategyItem {
  title: string;
  priority: 'Critical' | 'High' | 'Medium';
  why: string;
  howSteps: string[];
  timeline: string;
}

// ─── Action Item (Interest-based) ───
export interface StrategyActionItem {
  id: number;
  title: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  priorityColor: string;
  owner: string;
  deadline: string;
  expectedOutcome: string;
  interestImpact: string; // e.g., "+6-8%"
  frictionRemoved: string; // e.g., "removes 40% decision friction"
  details?: string[];
  actionReadyLink?: string;
}

// ─── Similar Win ───
export interface SimilarWin {
  company: string;
  timeline: string;
  similarities: string[];
  whatWorked: string[];
  suggestedAction: string;
}

// ─── Weekly Plan ───
export interface WeekPlan {
  weekLabel: string;
  tasks: { day: string; task: string; done: boolean }[];
  expectedResult?: string;
}

// ─── Red Flag ───
export interface RedFlag {
  signal: string;
  meaning: string;
  response: string;
}

// ─── Emotional Trigger ───
export interface EmotionalTrigger {
  icon: string;
  title: string;
  description: string;
  whatToDo: string[];
  whyItWorks: string;
  timing: string;
}

// ─── Objection Psychology ───
export interface ObjectionPsychology {
  objection: string;
  type: 'Practical' | 'Psychological';
  rootCause: string;
  response: string;
}

// ─── Interest Pattern Analysis ───
export interface InterestPattern {
  company: string;
  timeline: string;
  comparison: string;
  pattern: string;
  lesson: string;
  application: string;
}

// ─── Company Card (Dashboard) ───
export interface CompanyDeal {
  id: string;
  company: string;
  industry: string;
  dealValue: string;
  status: DealStatus;
  // Interest Level system
  interestLevel: number;
  previousInterestLevel: number;
  interestChange: number;
  daysAtCurrentLevel: number;
  interestVelocity: number; // % per day
  // Cognitive state derived
  currentStage: string; // cognitive state name
  // CRM mapping
  crmStage: string;
  crmMapping: CRMMapping;
  // Legacy fields
  lastContact: number;
  primaryContact: string;
  primaryTitle: string;
  stakeholderStatus: { label: string; met: boolean }[];
  biggestBlocker: string;
  nextAction: string;
  // Detail fields
  estimatedCloseDate: string;
  dealAssessment: string;
  situationSummary: string;
  whyThisStage: string[];
  winFactors: string[];
  lossRisks: string[];
  // Interest journey
  interestJourney: InterestJourneyPoint[];
  interestSignals: InterestSignal[];
  decisionFriction: DecisionFriction[];
  frictionRoadmap: FrictionRoadmapWeek[];
  interestAlerts: InterestAlert[];
  interestPatterns: InterestPattern[];
  // Existing sections
  interactions: Interaction[];
  stakeholders: Stakeholder[];
  objections: DealObjection[];
  commitments: Commitment[];
  strategies: StrategyItem[];
  actionItems: StrategyActionItem[];
  similarWins: SimilarWin[];
  weeklyPlan: WeekPlan[];
  redFlags: RedFlag[];
  emotionalTriggers: EmotionalTrigger[];
  objectionPsychology: ObjectionPsychology[];
  decisionProfile: { label: string; active: boolean }[];
  decisionProfileNote: string;
  progressionNote: string;
}

// ─── CRM Conversion Table ───
export const CRM_CONVERSION_TABLE = [
  { interestRange: '10-20%', cognitiveState: 'Attention', crmStage: 'Lead/Prospect' },
  { interestRange: '20-30%', cognitiveState: 'Curiosity', crmStage: 'Qualified Lead' },
  { interestRange: '30-40%', cognitiveState: 'Interest', crmStage: 'Discovery' },
  { interestRange: '40-50%', cognitiveState: 'Problem Recognition', crmStage: 'Discovery/Demo' },
  { interestRange: '50-60%', cognitiveState: 'Trust', crmStage: 'Demo' },
  { interestRange: '60-70%', cognitiveState: 'Evaluation', crmStage: 'Proposal' },
  { interestRange: '70-80%', cognitiveState: 'Validation', crmStage: 'Negotiation' },
  { interestRange: '80-90%', cognitiveState: 'Commitment', crmStage: 'Closing/Won' },
  { interestRange: '90%+', cognitiveState: 'Decision', crmStage: 'Closed Won' },
];

// =========================================================================
// MOCK DATA
// =========================================================================

const lavazza: CompanyDeal = {
  id: 'lavazza',
  company: 'Lavazza A Modo Mio',
  industry: 'Food & Beverage',
  dealValue: '€45K annual',
  status: 'ongoing_negotiation',
  interestLevel: 72,
  previousInterestLevel: 60,
  interestChange: 12,
  daysAtCurrentLevel: 5,
  interestVelocity: 1.2,
  currentStage: 'Validation',
  crmStage: 'Negotiation',
  crmMapping: {
    interestLevel: 72,
    cognitiveState: 'Validation',
    crmStage: 'Negotiation',
    inSync: true,
    lastSynced: 'May 3, 2:45 PM',
  },
  lastContact: 2,
  primaryContact: 'Marco Rossi',
  primaryTitle: 'Head of Operations',
  estimatedCloseDate: 'May 10, 2026',
  stakeholderStatus: [
    { label: 'Budget', met: true },
    { label: 'CTO', met: true },
    { label: 'VP Ops', met: false },
  ],
  biggestBlocker: 'VP Operations still has concerns',
  nextAction: 'Turn VP Ops into an internal champion',

  dealAssessment:
    'Lavazza is at 72% interest (Validation stage). Budget is approved, CTO is excited, but VP Operations is not yet engaged — the critical friction point. A competitor is in the mix creating urgency. The deal is winnable if we remove decision friction this week.',

  situationSummary:
    'The deal is currently in Validation stage. Trust has been established — CTO is excited, budget is approved, and implementation questions are being asked. However, the VP of Operations has not yet been engaged and holds final sign-off authority. A competitor is actively evaluating, creating both urgency and decision paralysis. Momentum is positive but at risk of stalling if friction isn\'t removed this week.',

  whyThisStage: [
    'Trust increased because the CTO explicitly validated the product during the demo, saying "This solves exactly what we need."',
    'Budget approval by the CFO signaled organizational commitment to solving the problem.',
    'The deal hasn\'t moved to Commitment because the VP Operations — who holds final approval — hasn\'t been engaged yet.',
    'Competitor evaluation is creating decision paralysis, preventing the prospect from moving forward.',
    'Interest velocity is healthy (+1.2%/day) but has plateaued for 5 days at 72%.',
  ],

  winFactors: [
    'Budget already approved (€45K annually)',
    'CTO very enthusiastic about API integration',
    'Clear pain point match — manual reporting costs 15h/week',
    'Timeline aligned — want to start Q2',
    'No implementation blockers identified',
  ],

  lossRisks: [
    'Competitor actively evaluating (likely CompetitorX)',
    'VP Operations not yet sold — holds final sign-off',
    'Procurement timeline unclear',
    'Decision-maker fatigue — lots of meetings',
  ],

  interestJourney: [
    { date: 'Mar 22', interestLevel: 18, cognitiveState: 'Attention', change: 0, event: 'First discovery call', detail: 'Initial outreach, listening politely', meetingTitle: 'Discovery Call', participants: ['Marco Rossi (Procurement Lead)'] },
    { date: 'Mar 22', interestLevel: 28, cognitiveState: 'Curiosity', change: 10, event: 'Prospect asked questions', detail: 'Marco asked 7 technical questions about API', meetingTitle: 'Technical Q&A Follow-up', participants: ['Marco Rossi', 'Luca Bianchi (Tech Lead)'] },
    { date: 'Apr 5', interestLevel: 48, cognitiveState: 'Problem Recognition', change: 20, event: 'Demo with CTO engaged', detail: 'CTO said "This solves exactly what we need"', meetingTitle: 'Product Demo', participants: ['Marco Rossi', 'Luca Bianchi', 'Andrea Conti (CTO)', '2 Developers'] },
    { date: 'Apr 18', interestLevel: 60, cognitiveState: 'Evaluation', change: 12, event: 'Proposal sent, budget OK', detail: 'CFO formally approved 45K budget allocation', meetingTitle: 'Proposal Review', participants: ['Marco Rossi', 'Luca Bianchi', 'Andrea Conti', 'Giulia Moretti (CFO)'] },
    { date: 'Apr 28', interestLevel: 72, cognitiveState: 'Validation', change: 12, event: 'Terms & implementation discussed', detail: 'Asked about: timeline, support, SLA, training', meetingTitle: 'Terms & Implementation', participants: ['Marco Rossi', 'Andrea Conti', 'Giulia Moretti', 'Legal Team'] },
    { date: 'May 3', interestLevel: 72, cognitiveState: 'Validation', change: 0, event: 'Plateau — waiting', detail: 'No progress, waiting for VP Ops engagement', meetingTitle: 'Status Sync (VP Ops absent)', participants: ['Marco Rossi'] },
  ],

  interestSignals: [
    { date: 'Mar 22', event: 'Prospect asked detailed questions', type: 'positive', signalType: 'Curiosity increasing', behavior: 'Marco asked 7 technical questions about API', meaning: 'Moved from Attention → Curiosity', impactPercent: 4 },
    { date: 'Mar 22', event: 'Prospect shared specific pain', type: 'positive', signalType: 'Trust building', behavior: 'Shared "we spend 15 hrs/week on manual reports"', meaning: 'Willing to be vulnerable = trust emerging', impactPercent: 6 },
    { date: 'Apr 5', event: 'Internal team engaged', type: 'positive', signalType: 'Problem recognition', behavior: 'CTO, Marco, 2 devs attended. CTO said "This solves exactly what we need"', meaning: 'Problem clearly recognized by team', impactPercent: 20 },
    { date: 'Apr 18', event: 'Budget approved by CFO', type: 'positive', signalType: 'Evaluation proceeding', behavior: 'CFO formally approved 45K budget allocation', meaning: 'Organization believes in value', impactPercent: 10 },
    { date: 'Apr 28', event: 'Discussed terms & implementation', type: 'positive', signalType: 'Validation happening', behavior: 'Asked about: timeline, support, SLA, training', meaning: 'Validating fit before committing', impactPercent: 4 },
    { date: 'Apr 28', event: 'Mentioned competitor evaluation', type: 'neutral', signalType: 'Objection/hesitation', behavior: '"We\'re also looking at CompetitorX"', meaning: 'Decision friction introduced', impactPercent: 0 },
    { date: 'May 2', event: 'VP Operations went quiet', type: 'negative', signalType: 'Stakeholder disengagement', behavior: 'Hasn\'t been in last 2 calls, no responses to email', meaning: 'Validation stage stalled', impactPercent: 0 },
  ],

  decisionFriction: [
    {
      title: 'VP Operations Not Engaged',
      frictionLevel: 'HIGH',
      blockingPercent: 40,
      whyItMatters: 'She has final sign-off authority. Until she\'s committed, no one else will commit.',
      currentState: 'Not yet met us. Hasn\'t seen implementation plan.',
      effectOnInterest: 'Can\'t move to 80% without her buy-in',
      howToRemove: ['Marco intro this week', '15-min implementation overview call', 'Address her specific concern (team adoption)'],
      timeline: '5 days',
      successIndicator: 'VP Ops says "Yes, let\'s move forward"',
    },
    {
      title: 'Competitor In Mix',
      frictionLevel: 'MEDIUM',
      blockingPercent: 35,
      whyItMatters: 'They\'re comparing us. Until we win comparison, they won\'t commit.',
      currentState: 'CompetitorX also in evaluation. Same timeline.',
      effectOnInterest: 'Decision paralysis (waiting to compare)',
      howToRemove: ['Create feature comparison doc', 'Emphasize our faster onboarding', 'Offer risk-free guarantee vs competitor'],
      timeline: '3 days',
      successIndicator: 'Prospect says "Clearly better on speed" or "We\'re eliminating them"',
    },
    {
      title: 'Procurement Process Unclear',
      frictionLevel: 'MEDIUM',
      blockingPercent: 25,
      whyItMatters: 'They can\'t commit until they know HOW to commit.',
      currentState: 'CFO approved budget, but procurement timeline not mapped.',
      effectOnInterest: 'Can\'t move to commitment without clarity',
      howToRemove: ['Ask explicitly: "What\'s your procurement timeline?"', 'Offer: "We can expedite if needed"', 'Provide contract template early'],
      timeline: '2 days',
      successIndicator: 'Procurement timeline mapped & clear',
    },
  ],

  frictionRoadmap: [
    {
      weekLabel: 'This Week (May 1-3)',
      tasks: [
        { task: 'VP Ops intro + 15-min call', frictionRemoved: 'removes 40% friction', done: false },
        { task: 'Send competitor comparison', frictionRemoved: 'removes 15% friction', done: false },
        { task: 'Clarify procurement timeline', frictionRemoved: 'removes 10% friction', done: false },
      ],
      expectedInterestMove: '72% → 78-80%',
    },
    {
      weekLabel: 'Week of May 6',
      tasks: [
        { task: 'Final pricing alignment', frictionRemoved: 'removes last 5% friction', done: false },
        { task: 'Executive sponsor call', frictionRemoved: 'confirms commitment', done: false },
      ],
      expectedInterestMove: '80% → 88-90%',
    },
  ],

  interestAlerts: [
    { type: 'plateau', severity: 'warning', title: 'Interest Plateau Approaching', description: 'At 72% for 5 days (alert threshold: 7 days)', action: 'Execute VP Ops & competitor actions by May 2', isActive: true },
    { type: 'drop', severity: 'info', title: 'Interest Drop > 5%', description: 'Not currently happening', action: 'Investigate immediately if triggered', isActive: false },
    { type: 'acceleration', severity: 'info', title: 'Interest Acceleration > 15%', description: 'Not currently happening', action: 'Act fast to capture close', isActive: false },
    { type: 'healthy', severity: 'success', title: 'Velocity: +1.2%/day', description: 'Healthy growth rate', action: 'Keep current trajectory', isActive: true },
    { type: 'predictive', severity: 'warning', title: 'VP Ops doesn\'t respond by May 3', description: 'Interest will plateau at 72%', action: 'Marco should call her directly', isActive: true },
    { type: 'predictive', severity: 'warning', title: 'Competitor sends proposal this week', description: 'Interest will drop 3-5%', action: 'Pre-emptively send our comparison doc', isActive: true },
    { type: 'predictive', severity: 'info', title: 'Procurement not mapped by May 4', description: 'Interest stuck at 75-80% for 2+ weeks', action: 'Reach out to CFO/Procurement TODAY', isActive: true },
  ],

  interestPatterns: [
    { company: 'Ferrero SpA', timeline: '45 days (FASTER by 15 days)', comparison: 'Won January 2026', pattern: 'Similar plateau at 70%, moved faster by getting CFO involvement earlier', lesson: 'Get economic buyer engaged at 60%, not 70%', application: 'Need to get VP Ops involved THIS WEEK' },
    { company: 'Barilla Group', timeline: '65 days (SIMILAR)', comparison: 'Won March 2026', pattern: 'Slower 40-50% phase, faster 60-80% phase (strong champion)', lesson: 'Quality of champion matters more than timeline', application: 'Marco is good. CTO can be champion. Need VP Ops as exec sponsor.' },
    { company: 'Unilever', timeline: '75 days (SLOWER by 15 days)', comparison: 'Won May 2026', pattern: 'Stuck at 70-75% for 15 days due to procurement', lesson: 'Procurement delays are common at validation stage', application: 'Proactively map procurement process NOW' },
  ],

  interactions: [
    { date: 'Apr 28', type: 'Call', attendees: 'Marco, CTO, Andrea', outcome: 'Budget approved — CFO joining next call' },
    { date: 'Apr 25', type: 'Call', attendees: 'Marco, Andrea', outcome: 'Pricing objection — showed ROI' },
    { date: 'Apr 18', type: 'Email', attendees: 'Marco', outcome: 'Proposal sent — waiting for feedback' },
    { date: 'Apr 5', type: 'Demo', attendees: 'Marco, CTO, 2 devs', outcome: 'Very positive — asked for pricing' },
    { date: 'Mar 22', type: 'Call', attendees: 'Marco, 1 peer', outcome: 'Discovery — main pain = reporting' },
    { date: 'Mar 20', type: 'Email', attendees: 'Marco', outcome: 'Initial outreach' },
  ],

  stakeholders: [
    { name: 'Marco Rossi', title: 'Head of Operations', role: 'Primary Contact', status: 'Engaged', statusColor: 'green', notes: 'Wants implementation ASAP, strong champion', priority: false },
    { name: 'Dr. Luca Bianchi', title: 'CTO', role: 'Technical Validator', status: 'Impressed', statusColor: 'green', notes: 'Wants API docs, excited about integration', priority: false },
    { name: 'Sofia Marchetti', title: 'CFO', role: 'Budget Holder', status: 'Approved', statusColor: 'cyan', notes: 'Approved budget, wants ROI justification', priority: false },
    { name: 'Maria Rossi', title: 'VP Operations', role: 'Final Approval', status: 'Not Yet Met', statusColor: 'red', notes: 'Holds final sign-off authority — HIGH PRIORITY', priority: true },
  ],

  objections: [
    { objection: 'Implementation seems too complex for our team', whenRaised: 'Apr 5 (during demo)', howAddressed: 'Showed phased rollout plan, provided case study', status: 'Resolved' },
    { objection: 'Pricing feels high', whenRaised: 'Apr 25 (call)', howAddressed: 'Showed ROI model based on their metrics', status: 'Partially Resolved', riskLevel: 'Medium' },
    { objection: 'Need to evaluate competitors', whenRaised: 'Apr 28', howAddressed: 'Acknowledged — competitor also in evaluation', status: 'Open', riskLevel: 'Medium' },
  ],

  commitments: [
    { promise: 'Send ROI analysis by Apr 30', deadline: 'Apr 30', status: 'Pending' },
    { promise: 'Schedule CFO meeting', deadline: 'May 2', status: 'Completed' },
    { promise: 'Provide implementation timeline', deadline: 'May 1', status: 'Pending' },
  ],

  strategies: [
    {
      title: 'Create Internal Champion (Marco → CTO → VP Ops)',
      priority: 'Critical',
      why: 'Social proof. When peers advocate, it reduces perceived risk. Validation complete → Commitment.',
      howSteps: [
        'Get Marco to advocate internally',
        'Get CTO to share enthusiasm with VP Ops',
        'Get one person saying "I want this to happen"',
        'Show VP Ops the ROI from ops perspective',
      ],
      timeline: 'Before May 2 CFO call',
    },
    {
      title: 'Create Scarcity (without being pushy)',
      priority: 'High',
      why: 'Loss aversion. When they realize delay costs them (missed Q2 goal), urgency increases.',
      howSteps: [
        '"To meet your Q2 goal, we need vendor selection by May 10"',
        '"Our next onboarding slot is June 1, after that June 15"',
        'Frame as their loss, not our pressure',
      ],
      timeline: 'During May 2 call',
    },
    {
      title: 'Eliminate Competitor Anxiety',
      priority: 'High',
      why: 'Removes decision anxiety. They stop comparing and start committing.',
      howSteps: [
        'Prepare comparison showing objective advantage on speed',
        '"We\'ll beat their implementation time by 30%"',
        'Risk reversal: "If we don\'t deliver on time, 50% refund"',
      ],
      timeline: 'Before May 5',
    },
    {
      title: 'Make Commitment Easy',
      priority: 'Medium',
      why: 'Removes friction from saying yes. People commit when it feels on their terms.',
      howSteps: [
        'Provide draft contract early',
        'Offer multiple start dates so they choose',
        'Suggest payment terms that ease cash flow',
        'Ask: "What would make this easy for you to say yes to?"',
      ],
      timeline: 'Final stages',
    },
  ],

  actionItems: [
    { id: 1, title: 'turning the VP Operations into an internal champion', priority: 'Critical', priorityColor: 'destructive', owner: 'You (with Marco)', deadline: 'May 1', expectedOutcome: 'VP Ops agrees "Yes, let\'s move forward"', interestImpact: '+6-8%', frictionRemoved: 'removes 40% decision friction', details: ['Marco makes intro (personal relationship power)', 'Prep 15-min overview (implementation plan)', 'In call, address HER concerns (team adoption, change mgmt)', 'Get her to say: "I\'m on board"'], actionReadyLink: 'Schedule call with VP Ops' },
    { id: 2, title: 'Eliminate Competitor from Consideration', priority: 'High', priorityColor: 'orange-500', owner: 'You + Product Marketing', deadline: 'May 2', expectedOutcome: 'Prospect says "CompetitorX doesn\'t have this"', interestImpact: '+5-8%', frictionRemoved: 'removes 35% decision friction', details: ['Create feature-by-feature comparison', 'Emphasize OUR advantages (speed, support, guarantee)', 'Send to Marco + CTO', 'Offer: "We guarantee faster onboarding or 50% refund"'], actionReadyLink: 'Send comparison doc to Marco' },
    { id: 3, title: 'Map Procurement Process', priority: 'High', priorityColor: 'orange-500', owner: 'You + Marco', deadline: 'May 2', expectedOutcome: 'Full procurement timeline documented', interestImpact: '+3-5%', frictionRemoved: 'removes 25% decision friction', details: ['Ask CFO/Procurement: "Walk me through the process"', 'Document: Legal review, approval chain, signature req', 'Provide contract template early'], actionReadyLink: 'Schedule procurement call' },
    { id: 4, title: 'Prepare Implementation Plan', priority: 'Medium', priorityColor: 'forskale-cyan', owner: 'You + Implementation team', deadline: 'May 3', expectedOutcome: 'Plan addresses implementation, training, support', interestImpact: '+4-6%', frictionRemoved: 'makes saying "yes" feel easy', details: ['Map team onboarding journey (week-by-week)', 'Show: Training dates, support hours, success metrics', 'Share reference from Ferrero'], actionReadyLink: 'Send implementation plan to Marco' },
    { id: 5, title: 'Schedule Executive Sponsor Call', priority: 'Medium', priorityColor: 'forskale-cyan', owner: 'Your manager or CEO', deadline: 'May 5', expectedOutcome: 'Executive alignment confirmed', interestImpact: '+5-10%', frictionRemoved: 'removes authority doubt', details: ['Only if interest plateaus after Actions 1-4', 'Arrange CEO-to-CFO or SVP-to-VP Ops call', 'Not a sales pitch, a business conversation'] },
  ],

  similarWins: [
    {
      company: 'Ferrero SpA',
      timeline: '45 days from first call to close',
      similarities: ['Budget concerns initially', 'Introduced CFO late in process', 'Had competitive eval'],
      whatWorked: ['Scheduled peer call with CEO of similar company (Barilla)', 'Provided implementation guarantee', 'Offered risk-free 30-day trial'],
      suggestedAction: 'Schedule peer call with Ferrero\'s Marco with Lavazza\'s Marco',
    },
    {
      company: 'Nestlé Professional',
      timeline: '60 days',
      similarities: ['Similar company size & structure', 'Multi-stakeholder approval process', 'Procurement delays'],
      whatWorked: ['Assigned dedicated implementation partner early', 'Created internal champion with CTO', 'Provided weekly executive updates'],
      suggestedAction: 'Assign our best implementation partner and introduce before close',
    },
  ],

  weeklyPlan: [
    {
      weekLabel: 'Week of May 1',
      tasks: [
        { day: 'Monday', task: 'Execute Trigger 1: Get Marco to advocate internally', done: false },
        { day: 'Tuesday', task: 'Execute Trigger 3: Send competitor comparison doc', done: false },
        { day: 'Wednesday', task: 'Prep Trigger 4: Draft contract ready', done: false },
        { day: 'Thursday', task: 'Execute Trigger 2: Create scarcity in VP Ops call', done: false },
        { day: 'Friday', task: 'Measure: Did interest move to 78-82%?', done: false },
      ],
      expectedResult: 'Interest 72% → 78-82%',
    },
    {
      weekLabel: 'Week of May 6',
      tasks: [
        { day: 'Monday', task: 'Final pricing/terms alignment (Trigger 4)', done: false },
        { day: 'Tuesday', task: 'Get final sign-offs (Trigger 1 complete)', done: false },
        { day: 'Wednesday', task: 'Commitment call: "Can we move forward?"', done: false },
        { day: 'Thursday', task: 'Close if 90%+, exec call if stalled', done: false },
        { day: 'Friday', task: 'Close! 🎉', done: false },
      ],
      expectedResult: 'Interest 80%+ → Ready to close',
    },
  ],

  redFlags: [
    { signal: 'VP Operations says "we need more time to evaluate"', meaning: 'Competitor gaining ground', response: 'Schedule decision date NOW' },
    { signal: 'CTO suddenly goes quiet', meaning: 'Someone overruled their enthusiasm', response: 'Call them directly, ask what changed' },
    { signal: 'Budget suddenly questioned again', meaning: 'CFO may not be truly committed', response: 'Marco (not us) should get CFO clarity' },
    { signal: 'They ask for price reduction', meaning: 'Smokescreen for real objection', response: '"What\'s the real concern here?" — dig deeper' },
  ],

  emotionalTriggers: [
    { icon: '🛡️', title: 'Create Internal Champion', description: 'Social proof. When peers advocate, perceived risk drops.', whatToDo: ['Get Marco to advocate internally', 'Get CTO to share enthusiasm with VP Ops', 'Get one person saying "I want this to happen"'], whyItWorks: 'Validation complete → Commitment', timing: 'Before May 2 CFO call' },
    { icon: '⏳', title: 'Create Scarcity', description: 'Loss aversion. Delay costs them their Q2 goal.', whatToDo: ['"To meet your Q2 goal, we need vendor selection by May 10"', '"Our next onboarding slot is June 1, after that June 15"'], whyItWorks: 'When they realize delay costs them, urgency increases', timing: 'During May 2 call' },
    { icon: '🏆', title: 'Eliminate Competitor Anxiety', description: 'Remove decision anxiety so they stop comparing.', whatToDo: ['Show objective advantage on speed', '"We\'ll beat their implementation time by 30%"', 'Risk reversal: "If we don\'t deliver on time, 50% refund"'], whyItWorks: 'Removes decision anxiety. They stop comparing and start committing.', timing: 'Before May 5' },
    { icon: '🤝', title: 'Make Commitment Easy', description: 'People commit when it feels on their terms.', whatToDo: ['Provide draft contract early', 'Offer multiple start dates', 'Ask: "What would make this easy for you to say yes to?"'], whyItWorks: 'Removes friction from saying yes.', timing: 'Final stages' },
  ],

  objectionPsychology: [
    { objection: 'Pricing feels high', type: 'Psychological', rootCause: 'Value not yet fully connected to their specific pain points', response: 'Show hour-by-hour savings. Make the value tangible.' },
    { objection: 'We need to evaluate competitors', type: 'Practical', rootCause: 'Not confident enough to commit yet', response: 'Offer proof. References, trials, guarantees.' },
    { objection: 'Implementation seems too complex', type: 'Psychological', rootCause: 'Fear of change and disruption to existing workflows', response: 'Show phased rollout. Make change feel safe and reversible.' },
  ],

  decisionProfile: [
    { label: 'Collaborative', active: true },
    { label: 'Deliberate', active: true },
    { label: 'Risk Averse', active: true },
    { label: 'Consensus-Driven', active: true },
  ],
  decisionProfileNote: 'At 72% (Validation stage), they\'re asking: Can we really do this? Are you better than alternatives? Will our organization approve? Does everyone agree? Our job: Answer each question so clearly that friction disappears.',
  progressionNote: 'Both sides want this. Focus on making the decision feel low-risk and reversible. Emphasize partnership language over transaction language. Remove friction, don\'t push.',
};

const ferreroClosedWon: CompanyDeal = {
  id: 'ferrero',
  company: 'Ferrero SpA',
  industry: 'Food & Beverage',
  dealValue: '€62K annual',
  status: 'closed_won',
  interestLevel: 95,
  previousInterestLevel: 90,
  interestChange: 5,
  daysAtCurrentLevel: 12,
  interestVelocity: 0,
  currentStage: 'Decision',
  crmStage: 'Closed Won',
  crmMapping: { interestLevel: 95, cognitiveState: 'Decision', crmStage: 'Closed Won', inSync: true, lastSynced: 'Jan 15, 2:00 PM' },
  lastContact: 5,
  primaryContact: 'Alessandro Ferrero',
  primaryTitle: 'VP Digital Transformation',
  estimatedCloseDate: 'Jan 15, 2026',
  stakeholderStatus: [
    { label: 'Budget', met: true },
    { label: 'CTO', met: true },
    { label: 'CEO', met: true },
  ],
  biggestBlocker: 'None — Deal closed',
  nextAction: 'Kick-off implementation meeting',

  dealAssessment:
    'Interest peaked at 95% (Decision). Alessandro was our internal champion who built consensus internally. Peer call with Barilla\'s CEO at 70% interest was the turning point that moved us to 85% overnight. Contract signed at €62K annually with 2-year commitment.',

  situationSummary:
    'Deal closed successfully at 95% interest. Alessandro Ferrero was the internal champion who built consensus across CTO, CFO, and leadership. The decisive moment was a peer reference call with Barilla\'s CEO when interest was at 70% — it jumped to 85% overnight. Total timeline was 75 days from first contact to contract signing.',

  whyThisStage: [
    'Alessandro acted as an internal champion who drove interest from 60% to 85% by advocating across departments.',
    'The peer call with Barilla\'s CEO removed the remaining validation friction — proof that similar companies trust us.',
    'The implementation guarantee removed the last commitment friction at 80%.',
    'A risk-free 30-day trial eased procurement concerns at 75%.',
  ],

  winFactors: [
    'Strong internal champion (Alessandro) — drove interest from 60% to 85%',
    'Peer reference call with Barilla CEO was decisive (+15% interest jump)',
    'Implementation guarantee removed last friction at 80%',
    'Risk-free 30-day trial eased procurement at 75%',
    'CTO became advocate after API demo at 55%',
  ],
  lossRisks: [],

  interestJourney: [
    { date: 'Nov 1', interestLevel: 20, cognitiveState: 'Curiosity', change: 0, event: 'First discovery call', detail: 'Strong initial interest', meetingTitle: 'Discovery Call', participants: ['Alessandro Ferrero (VP)'] },
    { date: 'Nov 15', interestLevel: 55, cognitiveState: 'Trust', change: 35, event: 'Demo — CTO impressed', detail: 'CTO became API advocate', meetingTitle: 'Technical Demo', participants: ['Alessandro Ferrero', 'CTO', 'Engineering Team'] },
    { date: 'Nov 25', interestLevel: 65, cognitiveState: 'Evaluation', change: 10, event: 'Proposal sent', detail: 'Budget initially questioned', meetingTitle: 'Proposal Walkthrough', participants: ['Alessandro Ferrero', 'CFO'] },
    { date: 'Dec 10', interestLevel: 70, cognitiveState: 'Validation', change: 5, event: 'Negotiation started', detail: 'Peer call was turning point', meetingTitle: 'Negotiation Kickoff', participants: ['Alessandro Ferrero', 'CFO', 'Procurement'] },
    { date: 'Dec 20', interestLevel: 85, cognitiveState: 'Commitment Intent', change: 15, event: 'Peer call breakthrough', detail: 'Barilla CEO reference call', meetingTitle: 'Reference Call', participants: ['Alessandro Ferrero', 'Barilla CEO'] },
    { date: 'Jan 10', interestLevel: 92, cognitiveState: 'Decision', change: 7, event: 'Final terms agreed', detail: 'All stakeholders aligned', meetingTitle: 'Final Terms', participants: ['Alessandro Ferrero', 'CTO', 'Legal'] },
    { date: 'Jan 15', interestLevel: 95, cognitiveState: 'Decision', change: 3, event: 'Contract signed', detail: '€62K/yr, 2-year commitment', meetingTitle: 'Contract Signing', participants: ['Alessandro Ferrero', 'CFO', 'Legal'] },
  ],

  interestSignals: [],
  decisionFriction: [
    {
      title: 'Implementation kickoff not yet scheduled',
      frictionLevel: 'LOW',
      blockingPercent: 100,
      whyItMatters: 'Deal is signed, but momentum after contract signing fades fast. The first 30 days set the tone for renewal and expansion.',
      currentState: 'Contract signed Jan 15, but no kickoff date confirmed yet with Alessandro and the implementation team.',
      effectOnInterest: 'Risk of cooling enthusiasm before value is delivered.',
      howToRemove: [
        'Send 3 proposed kickoff slots to Alessandro this week',
        'Introduce dedicated Customer Success Manager by Jan 20',
      ],
      timeline: 'This week',
      successIndicator: 'Kickoff meeting on calendar with all stakeholders',
    },
  ],
  frictionRoadmap: [],
  interestAlerts: [],
  interestPatterns: [],

  interactions: [
    { date: 'Jan 15', type: 'Meeting', attendees: 'Alessandro, CFO, Legal', outcome: 'Contract signed' },
    { date: 'Jan 10', type: 'Call', attendees: 'Alessandro, CTO', outcome: 'Final terms agreed' },
    { date: 'Dec 20', type: 'Call', attendees: 'Alessandro, Barilla CEO', outcome: 'Peer call — decisive moment' },
    { date: 'Nov 25', type: 'Email', attendees: 'Alessandro', outcome: 'Proposal sent' },
    { date: 'Nov 15', type: 'Demo', attendees: 'Alessandro, CTO, 3 devs', outcome: 'Very positive demo' },
    { date: 'Nov 1', type: 'Call', attendees: 'Alessandro', outcome: 'First discovery call' },
  ],

  stakeholders: [
    { name: 'Alessandro Ferrero', title: 'VP Digital Transformation', role: 'Champion', status: 'Engaged', statusColor: 'green', notes: 'Our strongest advocate', priority: false },
    { name: 'Dr. Roberto Conti', title: 'CTO', role: 'Technical Sponsor', status: 'Impressed', statusColor: 'green', notes: 'Became API advocate after demo', priority: false },
    { name: 'Giulia Romano', title: 'CFO', role: 'Budget Holder', status: 'Approved', statusColor: 'green', notes: 'Approved after ROI presentation', priority: false },
  ],

  objections: [
    { objection: 'Budget seemed high for initial scope', whenRaised: 'Nov 25', howAddressed: 'ROI model showed 3x return in Year 1', status: 'Resolved' },
    { objection: 'Concerned about data migration', whenRaised: 'Dec 10', howAddressed: 'Offered dedicated migration support at no cost', status: 'Resolved' },
  ],

  commitments: [
    { promise: 'Implementation kick-off by June 1', deadline: 'Jun 1', status: 'Pending' },
    { promise: 'Dedicated support manager assigned', deadline: 'Jan 20', status: 'Completed' },
  ],

  strategies: [],
  actionItems: [
    { id: 1, title: 'Schedule implementation kick-off', priority: 'High', priorityColor: 'orange-500', owner: 'You', deadline: 'Feb 1', expectedOutcome: 'Kick-off meeting scheduled', interestImpact: 'N/A', frictionRemoved: 'N/A' },
    { id: 2, title: 'Introduce dedicated support manager', priority: 'Medium', priorityColor: 'forskale-cyan', owner: 'Customer Success', deadline: 'Jan 20', expectedOutcome: 'Relationship established', interestImpact: 'N/A', frictionRemoved: 'N/A' },
  ],

  similarWins: [],
  weeklyPlan: [],
  redFlags: [],
  emotionalTriggers: [],
  objectionPsychology: [],
  decisionProfile: [],
  decisionProfileNote: '',
  progressionNote: '',
};

const nestleClosedLost: CompanyDeal = {
  id: 'nestle-lost',
  company: 'Nestlé Beverage Division',
  industry: 'Food & Beverage',
  dealValue: '€85K annual',
  status: 'closed_lost',
  interestLevel: 0,
  previousInterestLevel: 68,
  interestChange: -68,
  daysAtCurrentLevel: 8,
  interestVelocity: 0,
  currentStage: 'Lost',
  crmStage: 'Closed Lost',
  crmMapping: { interestLevel: 0, cognitiveState: 'Lost', crmStage: 'Closed Lost', inSync: true, lastSynced: 'Mar 8, 10:00 AM' },
  lastContact: 15,
  primaryContact: 'Pierre Dumont',
  primaryTitle: 'Director of Procurement',
  estimatedCloseDate: 'N/A',
  stakeholderStatus: [
    { label: 'Budget', met: true },
    { label: 'CTO', met: true },
    { label: 'Procurement', met: false },
  ],
  biggestBlocker: 'Procurement wanted 90-day trial',
  nextAction: 'Monitor for re-engagement opportunity',

  dealAssessment:
    'Interest peaked at 68% (Evaluation) but never broke through to Validation (70%). Procurement required 90-day trial — we offered 30 days. By the time we agreed to extend, CompetitorX had already captured commitment. CTO was at 80% interest individually, but procurement held veto.',

  situationSummary:
    'The deal was lost at 68% interest — it never broke through Evaluation into Validation. Procurement required a 90-day trial period, but we only offered 30 days. While we debated internally for 3 weeks, the competitor offered the full 90 days and captured the commitment. The CTO was individually at 80% interest, but procurement held a veto.',

  whyThisStage: [
    'Procurement friction at 68% stalled momentum — the 90-day trial requirement was non-negotiable for them.',
    'A 3-week internal delay in approving the trial extension killed interest velocity entirely.',
    'CompetitorX removed the exact friction we created by immediately offering the 90-day trial.',
    'We failed to escalate to executive sponsor when procurement went silent for 2 weeks.',
    'The CTO\'s enthusiasm wasn\'t enough to override organizational procurement policy.',
  ],

  winFactors: [],
  lossRisks: [
    'Procurement friction at 68% — trial period dispute stalled interest',
    'CompetitorX offered full 90-day trial immediately — removed their friction',
    'Slow internal approval on trial extension — 3-week gap killed momentum',
    'Interest velocity dropped to 0% for 21 days at 65-68% range',
  ],

  interestJourney: [
    { date: 'Jan 5', interestLevel: 22, cognitiveState: 'Curiosity', change: 0, event: 'First discovery', detail: 'Strong initial interest', meetingTitle: 'Discovery Call', participants: ['Pierre Dumont (Procurement Dir)'] },
    { date: 'Jan 20', interestLevel: 55, cognitiveState: 'Trust', change: 33, event: 'CTO loved demo', detail: 'Technical evaluation very positive', meetingTitle: 'Technical Demo', participants: ['Pierre Dumont', 'Dr. Alain Moreau (CTO)', '4 Developers'] },
    { date: 'Feb 1', interestLevel: 62, cognitiveState: 'Evaluation', change: 7, event: 'Proposal sent', detail: 'Good reception', meetingTitle: 'Proposal Review', participants: ['Pierre Dumont', 'Dr. Alain Moreau'] },
    { date: 'Feb 15', interestLevel: 68, cognitiveState: 'Evaluation', change: 6, event: 'Negotiation started', detail: 'Trial period dispute began', meetingTitle: 'Negotiation Call', participants: ['Pierre Dumont', 'Dr. Alain Moreau'] },
    { date: 'Mar 1', interestLevel: 65, cognitiveState: 'Evaluation', change: -3, event: 'Interest dropping', detail: 'Requested 90-day trial, we countered 45', meetingTitle: 'Trial Terms Discussion', participants: ['Pierre Dumont', 'Procurement Board'] },
    { date: 'Mar 8', interestLevel: 0, cognitiveState: 'Lost', change: -65, event: 'Chose CompetitorX', detail: 'Decision friction not removed in time', meetingTitle: 'Loss Notification', participants: ['Pierre Dumont'] },
  ],

  interestSignals: [],
  decisionFriction: [
    {
      title: 'Procurement 90-day trial requirement never resolved',
      frictionLevel: 'HIGH',
      blockingPercent: 100,
      whyItMatters: 'Procurement held veto power over the CTO. Their 90-day trial policy was non-negotiable, and our 30-day counter created a gap that CompetitorX immediately filled.',
      currentState: 'Deal lost — Pierre informed us on Mar 8 that they chose CompetitorX, who agreed to the full 90-day trial upfront.',
      effectOnInterest: 'Interest collapsed from 68% to 0% once the competitor removed the friction we had created.',
      howToRemove: [
        'For future deals: surface procurement policies in discovery, not negotiation',
        'Pre-approve flexible trial terms before procurement engages',
        'Escalate to executive sponsor when procurement goes silent >7 days',
      ],
      timeline: 'Lessons for next opportunity',
      successIndicator: 'Procurement aligned before pricing discussion',
    },
  ],
  frictionRoadmap: [],
  interestAlerts: [],
  interestPatterns: [],

  interactions: [
    { date: 'Mar 8', type: 'Email', attendees: 'Pierre', outcome: 'Informed us they chose CompetitorX' },
    { date: 'Mar 1', type: 'Call', attendees: 'Pierre, Procurement', outcome: 'Requested 90-day trial — we countered 45' },
    { date: 'Feb 15', type: 'Call', attendees: 'Pierre, CTO', outcome: 'Pricing agreed, trial period unresolved' },
    { date: 'Feb 1', type: 'Email', attendees: 'Pierre', outcome: 'Proposal sent' },
    { date: 'Jan 20', type: 'Demo', attendees: 'Pierre, CTO, 4 devs', outcome: 'Very positive technical evaluation' },
    { date: 'Jan 5', type: 'Call', attendees: 'Pierre', outcome: 'Initial discovery — large opportunity' },
  ],

  stakeholders: [
    { name: 'Pierre Dumont', title: 'Director of Procurement', role: 'Primary Contact', status: 'Engaged', statusColor: 'green', notes: 'Was supportive but procurement rules overrode', priority: false },
    { name: 'Dr. Alain Moreau', title: 'CTO', role: 'Technical Champion', status: 'Impressed', statusColor: 'green', notes: 'Loved our API — tried to push for us', priority: false },
    { name: 'Procurement Board', title: 'Committee', role: 'Final Approval', status: 'Not Yet Met', statusColor: 'red', notes: 'Required 90-day trial per policy', priority: true },
  ],

  objections: [
    { objection: '30-day trial is insufficient for enterprise evaluation', whenRaised: 'Mar 1', howAddressed: 'Countered with 45-day trial — rejected', status: 'Open', riskLevel: 'High' },
  ],

  commitments: [],
  strategies: [],
  actionItems: [
    { id: 1, title: 'Monitor for re-engagement signals', priority: 'Low', priorityColor: 'forskale-cyan', owner: 'You', deadline: 'Ongoing', expectedOutcome: 'Ready to re-engage when opportunity arises', interestImpact: 'N/A', frictionRemoved: 'N/A' },
  ],

  similarWins: [],
  weeklyPlan: [],

  redFlags: [
    { signal: 'Procurement went silent for 2 weeks', meaning: 'They were already talking to competitor', response: 'Should have escalated to exec sponsor immediately' },
    { signal: 'Interest velocity dropped to 0% for 21 days', meaning: 'Friction not being addressed', response: 'Should have offered 90-day trial immediately' },
  ],

  emotionalTriggers: [],
  objectionPsychology: [],
  decisionProfile: [],
  decisionProfileNote: '',
  progressionNote: '',
};

const barillaFirstMeeting: CompanyDeal = {
  id: 'barilla',
  company: 'Barilla Group',
  industry: 'Food & Beverage',
  dealValue: 'TBD',
  status: 'first_meeting',
  interestLevel: 18,
  previousInterestLevel: 10,
  interestChange: 8,
  daysAtCurrentLevel: 2,
  interestVelocity: 4.0,
  currentStage: 'Attention',
  crmStage: 'Lead/Prospect',
  crmMapping: { interestLevel: 18, cognitiveState: 'Attention', crmStage: 'Lead/Prospect', inSync: true, lastSynced: 'Apr 28, 4:00 PM' },
  lastContact: 1,
  primaryContact: 'Elena Barilla',
  primaryTitle: 'VP Operations',
  estimatedCloseDate: 'TBD',
  stakeholderStatus: [
    { label: 'Champion', met: false },
    { label: 'Budget', met: false },
    { label: 'Technical', met: false },
  ],
  biggestBlocker: 'No pain point validated yet',
  nextAction: 'Conduct thorough discovery call',

  dealAssessment:
    'Interest at 18% (Attention stage). Elena reached out after seeing our Ferrero case study. She\'s listening, but no emotional engagement yet. We need to move from Attention → Curiosity by asking good questions and uncovering specific pain points.',

  situationSummary:
    'This is a new opportunity at the Attention stage. Elena reached out after seeing our Ferrero case study — she\'s aware of us but hasn\'t shown emotional engagement yet. No specific pain points have been validated, and the decision-making process is unknown. The priority is to move from Attention to Curiosity by asking good discovery questions.',

  whyThisStage: [
    'The prospect came inbound, which means initial attention is higher than cold outreach.',
    'No specific pain points have been shared yet — Elena is still in "listening politely" mode.',
    'The Ferrero case study created social proof, but it hasn\'t translated to personal relevance yet.',
    'We need to uncover a specific, quantifiable problem to move from Attention to Curiosity.',
  ],

  winFactors: [
    'Inbound inquiry — they came to us (+initial interest)',
    'Already aware of Ferrero case study (social proof starting)',
    'Similar industry profile to past wins (pattern match)',
  ],
  lossRisks: [
    'No validated pain point yet — still at Attention stage',
    'Unknown budget situation',
    'Unknown decision-making process',
    'Early stage — long road from 18% to 90%',
  ],

  interestJourney: [
    { date: 'Apr 27', interestLevel: 10, cognitiveState: 'Attention', change: 0, event: 'Inbound inquiry', detail: 'Saw Ferrero case study on website', meetingTitle: 'Inbound Inquiry', participants: ['Elena Barilla (VP Operations)'] },
    { date: 'Apr 28', interestLevel: 18, cognitiveState: 'Attention', change: 8, event: 'Intro call', detail: 'Interested but no specific pain shared yet', meetingTitle: 'Intro Call', participants: ['Elena Barilla'] },
  ],

  interestSignals: [
    { date: 'Apr 27', event: 'Inbound inquiry via website', type: 'positive', signalType: 'Initial attention', behavior: 'Found us through Ferrero case study', meaning: 'Social proof already working', impactPercent: 10 },
    { date: 'Apr 28', event: 'Intro call completed', type: 'positive', signalType: 'Engagement beginning', behavior: 'Asked about our approach, timeline', meaning: 'Moving from Attention toward Curiosity', impactPercent: 8 },
  ],

  decisionFriction: [
    {
      title: 'No specific pain point validated yet',
      frictionLevel: 'MEDIUM',
      blockingPercent: 100,
      whyItMatters: 'Without a quantifiable problem tied to Elena\'s priorities, the conversation stays polite but never moves from Attention to Curiosity. Social proof from Ferrero opened the door — it won\'t close the deal.',
      currentState: 'Elena is listening politely after the intro call, but hasn\'t shared an internal initiative, KPI, or pain that we can anchor to.',
      effectOnInterest: 'Interest will plateau at 18-25% until a personal, measurable pain is uncovered.',
      howToRemove: [
        'Schedule a 30-min discovery call focused on her top operational priority for 2026',
        'Ask 3 open-ended questions about current bottlenecks — let her talk 80% of the time',
        'Connect a Ferrero outcome metric to a Barilla-specific scenario',
      ],
      timeline: 'Within 1 week',
      successIndicator: 'Elena names a specific problem and a number attached to it',
    },
  ],
  frictionRoadmap: [],
  interestAlerts: [
    { type: 'healthy', severity: 'success', title: 'New Opportunity — Strong Start', description: 'Inbound inquiry = higher initial interest than cold outreach', action: 'Focus on deep discovery to move to 30%+', isActive: true },
  ],
  interestPatterns: [],

  interactions: [
    { date: 'Apr 28', type: 'Call', attendees: 'Elena', outcome: 'Intro call — interested after Ferrero case study' },
    { date: 'Apr 27', type: 'Email', attendees: 'Elena', outcome: 'Inbound inquiry via website' },
  ],

  stakeholders: [
    { name: 'Elena Barilla', title: 'VP Operations', role: 'Initial Contact', status: 'Engaged', statusColor: 'cyan', notes: 'Interested but early stage — at Attention level', priority: false },
  ],

  objections: [],
  commitments: [
    { promise: 'Send company overview deck', deadline: 'Apr 30', status: 'Pending' },
    { promise: 'Schedule discovery call', deadline: 'May 2', status: 'Pending' },
  ],

  strategies: [
    {
      title: 'Move from Attention (18%) → Curiosity (30%)',
      priority: 'Critical',
      why: 'Need to spark genuine curiosity by connecting to their specific problems.',
      howSteps: [
        'Prepare industry-specific discovery questions',
        'Research their current tech stack',
        'Ask probing questions about pain points',
        'Get them to share specific numbers ("how many hours do you spend on...")',
      ],
      timeline: 'This week',
    },
  ],

  actionItems: [
    { id: 1, title: 'Research Barilla\'s current operations stack', priority: 'High', priorityColor: 'orange-500', owner: 'You', deadline: 'Apr 30', expectedOutcome: 'Background research complete', interestImpact: '+5-10%', frictionRemoved: 'preparation for discovery' },
    { id: 2, title: 'Prepare discovery questions based on Ferrero learnings', priority: 'High', priorityColor: 'orange-500', owner: 'You', deadline: 'May 1', expectedOutcome: 'Question list ready', interestImpact: '+8-12%', frictionRemoved: 'unlocks curiosity' },
    { id: 3, title: 'Schedule deep discovery call', priority: 'Critical', priorityColor: 'destructive', owner: 'You', deadline: 'May 2', expectedOutcome: 'Discovery meeting booked', interestImpact: '+15-20%', frictionRemoved: 'moves to Problem Recognition' },
  ],

  similarWins: [
    {
      company: 'Ferrero SpA',
      timeline: '45 days from first call to close',
      similarities: ['Same industry', 'Similar company size', 'VP-level initial contact'],
      whatWorked: ['Started with thorough discovery', 'Built CTO relationship early', 'Used peer reference'],
      suggestedAction: 'Follow Ferrero playbook — focus on deep discovery first',
    },
  ],

  weeklyPlan: [],
  redFlags: [],
  emotionalTriggers: [],
  objectionPsychology: [],
  decisionProfile: [],
  decisionProfileNote: '',
  progressionNote: '',
};

export const companyDeals: CompanyDeal[] = [lavazza, ferreroClosedWon, nestleClosedLost, barillaFirstMeeting];

export function getDealById(id: string): CompanyDeal | undefined {
  return companyDeals.find((d) => d.id === id);
}
