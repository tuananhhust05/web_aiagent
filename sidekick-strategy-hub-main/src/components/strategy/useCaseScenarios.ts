import type { CompanyDeal } from '@/data/mockStrategyData';

export interface Scenario {
  id: string;            // S1..S9
  code: string;          // SCENARIO 1
  range: string;         // 10-20%
  minInterest: number;   // inclusive lower bound
  maxInterest: number;   // exclusive upper bound (S9 uses Infinity)
  title: string;         // ATTENTION → CURIOSITY
  headline: (deal: CompanyDeal) => string;
  subline: string;
  whenApplies: string;
  goal: string;
  wrongMoves: string[];
  approach: string[];
  guardrails: string[];
  successSignal: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'S1',
    code: 'SCENARIO 1',
    range: '10-20%',
    minInterest: 0,
    maxInterest: 20,
    title: 'ATTENTION → CURIOSITY',
    headline: d => `${d.company}: spark curiosity before they become passive`,
    subline: 'They noticed you, but the spark hasn’t turned into curiosity yet.',
    whenApplies:
      'The prospect has shown minimal awareness — opened a message, attended a brief call, or accepted a first touch. No real engagement yet.',
    goal: 'Trigger an emotional “I want to know more” moment without selling anything.',
    wrongMoves: [
      'Sending product decks or pricing this early',
      'Booking a demo before any real interest exists',
      'Following up too aggressively — it kills curiosity',
    ],
    approach: [
      'Share a single sharp insight about their market or category',
      'Ask one open question that makes them think, not decide',
      'Stay light, stay curious — your job is to earn a second look',
    ],
    guardrails: [
      'No pressure, no pitch, no calendar links',
      'Avoid “just checking in” — bring a reason every time',
    ],
    successSignal: 'They reply with a question, not a polite acknowledgement.',
  },
  {
    id: 'S2',
    code: 'SCENARIO 2',
    range: '20-30%',
    minInterest: 20,
    maxInterest: 30,
    title: 'CURIOSITY → INTEREST',
    headline: d => `${d.company}: convert curiosity into a real conversation`,
    subline: 'Curiosity is there — now it needs a reason to grow.',
    whenApplies:
      'They’ve responded once or twice and shown mild interest, but haven’t asked for anything concrete yet.',
    goal: 'Move from “interesting” to “let’s talk” by anchoring relevance to their world.',
    wrongMoves: [
      'Generic follow-ups with no new value',
      'Talking about your product before they ask',
      'Treating curiosity as commitment',
    ],
    approach: [
      'Share a peer story or pattern that mirrors their situation',
      'Offer a 15-min discovery instead of a demo',
      'Make every touch feel earned, not scheduled',
    ],
    guardrails: [
      'Don’t confuse politeness with intent',
      'Resist the urge to over-explain capabilities',
    ],
    successSignal: 'They proactively suggest a time to talk.',
  },
  {
    id: 'S3',
    code: 'SCENARIO 3',
    range: '30-40%',
    minInterest: 30,
    maxInterest: 40,
    title: 'INTEREST → PROBLEM RECOGNITION',
    headline: d => `${d.company}: uncover hidden blockers before demo stage`,
    subline: 'They’re interested — but haven’t admitted the real problem yet.',
    whenApplies:
      'Conversations are happening, but the prospect hasn’t fully articulated the pain or cost of inaction.',
    goal: 'Help them name and own the problem before you propose anything.',
    wrongMoves: [
      'Jumping into solutioning before pain is clear',
      'Accepting vague problem statements',
      'Letting the conversation drift into features',
    ],
    approach: [
      'Ask diagnostic questions about cost, friction, and stakes',
      'Mirror their words back — make the problem visible',
      'Quantify the cost of staying still',
    ],
    guardrails: [
      'Never sell on top of an undefined problem',
      'Avoid leading questions — let them surface the truth',
    ],
    successSignal: 'They start describing the problem in their own words, with urgency.',
  },
  {
    id: 'S4',
    code: 'SCENARIO 4',
    range: '40-50%',
    minInterest: 40,
    maxInterest: 50,
    title: 'PROBLEM RECOGNITION → TRUST',
    headline: d => `${d.company}: earn trust before showing the solution`,
    subline: 'They see the problem — now they’re evaluating whether you’re the right partner.',
    whenApplies:
      'The problem is named. Now they’re quietly testing your credibility, judgment, and fit.',
    goal: 'Demonstrate competence and care without performing — trust is earned in small moments.',
    wrongMoves: [
      'Overselling expertise or name-dropping',
      'Pushing for next steps too quickly',
      'Showing the deck before showing understanding',
    ],
    approach: [
      'Reflect their context with precision',
      'Share how you’ve helped similar teams — briefly, specifically',
      'Be the calmest person in the conversation',
    ],
    guardrails: [
      'Trust is built in tone, not tactics',
      'Don’t confuse rapport with alignment',
    ],
    successSignal: 'They start sharing internal context they didn’t share before.',
  },
  {
    id: 'S5',
    code: 'SCENARIO 5',
    range: '50-60%',
    minInterest: 50,
    maxInterest: 60,
    title: 'TRUST → EVALUATION',
    headline: d => `${d.company}: build trust before discussing pricing`,
    subline: 'Too much pressure now could reduce trust.',
    whenApplies:
      'They trust you enough to evaluate seriously, but pricing or commercial talk too early will collapse the momentum.',
    goal: 'Co-build the evaluation criteria with them — own the frame before they ask for a quote.',
    wrongMoves: [
      'Sending pricing before value is anchored',
      'Letting procurement enter the conversation prematurely',
      'Discounting to keep momentum',
    ],
    approach: [
      'Define success criteria together, in writing',
      'Map the decision process and stakeholders explicitly',
      'Stage value before stage price',
    ],
    guardrails: [
      'Price is the last conversation, not the first',
      'Never negotiate against yourself',
    ],
    successSignal: 'They ask how to involve other stakeholders or formalize evaluation.',
  },
  {
    id: 'S6',
    code: 'SCENARIO 6',
    range: '60-70%',
    minInterest: 60,
    maxInterest: 70,
    title: 'EVALUATION → VALIDATION',
    headline: d => `${d.company}: help them validate the decision internally`,
    subline: 'They need validation, not another product pitch.',
    whenApplies:
      'They believe in the solution — now they need ammunition to defend the choice internally.',
    goal: 'Equip your champion with the proof, language, and confidence to win the room.',
    wrongMoves: [
      'Sending more product content',
      'Letting the champion walk in alone',
      'Assuming silence means alignment',
    ],
    approach: [
      'Build a one-page internal business case with them',
      'Provide proof-points tailored to each stakeholder',
      'Rehearse objections before the internal meeting',
    ],
    guardrails: [
      'Sell with your champion, not through them',
      'Don’t confuse validation with commitment',
    ],
    successSignal: 'They ask for materials they can forward to leadership.',
  },
  {
    id: 'S7',
    code: 'SCENARIO 7',
    range: '70-80%',
    minInterest: 70,
    maxInterest: 80,
    title: 'VALIDATION → COMMITMENT INTENT',
    headline: d => `${d.company}: turn ${d.stakeholders[0]?.role ?? 'the executive sponsor'} into an internal champion`,
    subline: 'Internal alignment is growing, but momentum depends on one executive sponsor.',
    whenApplies:
      'Validation is done. Now one key person needs to become the internal owner of the decision.',
    goal: 'Convert your strongest sponsor into the visible owner of the change.',
    wrongMoves: [
      'Going wide instead of deep on the sponsor',
      'Letting the deal sit in “waiting for feedback” mode',
      'Skipping a clear next step in writing',
    ],
    approach: [
      'Make the sponsor look great — supply quotes, slides, ROI lines',
      'Co-author the internal narrative with them',
      'Lock the next milestone in the calendar before the call ends',
    ],
    guardrails: [
      'Don’t ask for the close — engineer the close',
      'No surprises for the sponsor, ever',
    ],
    successSignal: 'The sponsor starts using “we” when describing the project.',
  },
  {
    id: 'S8',
    code: 'SCENARIO 8',
    range: '80-90%',
    minInterest: 80,
    maxInterest: 90,
    title: 'COMMITMENT INTENT → DECISION',
    headline: d => `${d.company}: push procurement forward without creating pressure`,
    subline: 'The decision is emotional already — now make it operational.',
    whenApplies:
      'Intent is clear, but procurement, legal, or scheduling friction is slowing the close.',
    goal: 'Remove friction silently — make saying yes the easiest path.',
    wrongMoves: [
      'Adding urgency that feels manufactured',
      'Renegotiating terms at the last mile',
      'Going dark while waiting on legal',
    ],
    approach: [
      'Pre-fill paperwork, pre-align legal, pre-book kickoff',
      'Stay visible without pressuring — weekly micro-updates',
      'Anchor a kickoff date to pull the close forward',
    ],
    guardrails: [
      'Pressure breaks trust at this stage',
      'Never let silence stretch beyond 72 hours',
    ],
    successSignal: 'They ask onboarding or kickoff questions before signing.',
  },
  {
    id: 'S9',
    code: 'SCENARIO 9',
    range: '90%+',
    minInterest: 90,
    maxInterest: Infinity,
    title: 'DECISION → EXPANSION',
    headline: d => `${d.company}: protect the win and prepare the next expansion`,
    subline: 'The deal is won — the relationship now decides the next one.',
    whenApplies:
      'Contract signed or about to sign. The next 90 days define the lifetime value.',
    goal: 'Convert the win into momentum: reference, expansion, advocacy.',
    wrongMoves: [
      'Disappearing after signature',
      'Treating onboarding as someone else’s job',
      'Asking for expansion before delivering value',
    ],
    approach: [
      'Hand off with context, not a ticket',
      'Define a 90-day success plan together',
      'Identify the next pain before they do',
    ],
    guardrails: [
      'Earned trust now compounds; broken trust now never recovers',
      'Don’t confuse signature with success',
    ],
    successSignal: 'They introduce you to a peer team or new business unit.',
  },
];

/** Returns the scenario whose interest range contains the given level. */
export function getScenarioForInterestLevel(interestLevel: number): Scenario {
  return (
    SCENARIOS.find(s => interestLevel >= s.minInterest && interestLevel < s.maxInterest) ??
    SCENARIOS[SCENARIOS.length - 1]
  );
}

export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
