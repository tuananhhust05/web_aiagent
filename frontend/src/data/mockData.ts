export type NegotiationStage = "Discovery" | "Demo" | "Proposal" | "Negotiation" | "Closing";
export type DataSource = "call" | "crm" | "both";

export interface CallItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  company: string;
  product: string;
  negotiationStage: NegotiationStage;
  dataSource: DataSource;
  dataCompleteness?: number; // 0-100
}

export interface TranscriptEntry {
  speaker: string;
  timestamp: string;
  text: string;
  color: "blue" | "red";
}

export interface PlaybookRule {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
  isKeyDriver: boolean;
  whatYouSaid: string;
  whatYouShouldSay: string;
  timestamp?: string;
}

export interface PerformanceMetric {
  label: string;
  rating: "Great!" | "Okay" | "Needs work";
  value: string;
  description: string;
}

export interface CoachFeedback {
  title: string;
  description: string;
}

export interface PlaybookTemplate {
  id: string;
  name: string;
  category: string;
  sections: { title: string; description: string }[];
  isBuiltIn: boolean;
}

export const mockCalls: CallItem[] = [
  { id: "1", title: "Lavazza A Modo Mio – Intro", date: "Mar 24, 2026", duration: "4:02", company: "Lavazza", product: "A Modo Mio", negotiationStage: "Discovery", dataSource: "call", dataCompleteness: 85 },
  { id: "2", title: "ForSkale Workflow Overview", date: "Mar 24, 2026", duration: "12:30", company: "ForSkale Corp", product: "ForSkale Platform", negotiationStage: "Demo", dataSource: "both", dataCompleteness: 92 },
  { id: "3", title: "ForSkale Demo – Security Deep Dive", date: "Mar 23, 2026", duration: "18:45", company: "ForSkale Corp", product: "ForSkale Platform", negotiationStage: "Demo", dataSource: "call", dataCompleteness: 78 },
  { id: "4", title: "ForSkale Demo – Q&A Follow-up", date: "Mar 23, 2026", duration: "8:15", company: "ForSkale Corp", product: "ForSkale Platform", negotiationStage: "Proposal", dataSource: "call", dataCompleteness: 65 },
  { id: "5", title: "Nestlé Supply Chain Review", date: "Mar 22, 2026", duration: "22:10", company: "Nestlé", product: "Supply Chain Suite", negotiationStage: "Negotiation", dataSource: "both", dataCompleteness: 95 },
  { id: "6", title: "Nestlé – Pricing Discussion", date: "Mar 22, 2026", duration: "15:00", company: "Nestlé", product: "Supply Chain Suite", negotiationStage: "Negotiation", dataSource: "crm", dataCompleteness: 70 },
  { id: "7", title: "Unilever First Contact", date: "Mar 21, 2026", duration: "6:30", company: "Unilever", product: "Distribution Hub", negotiationStage: "Discovery", dataSource: "call", dataCompleteness: 55 },
  { id: "8", title: "Ferrero – Closing Call", date: "Mar 20, 2026", duration: "30:00", company: "Ferrero", product: "Retail Analytics", negotiationStage: "Closing", dataSource: "both", dataCompleteness: 98 },
];

export const mockTranscript: TranscriptEntry[] = [
  { speaker: "Ritam Pramanik", timestamp: "00:08", text: "Thank you for your time, Marco.", color: "blue" },
  { speaker: "Ritam Pramanik", timestamp: "00:13", text: "The objective of this call is to understand your current commercial operations setup and see whether there could be alignment for optimization initiatives.", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "00:22", text: "Thanks, Ritam.", color: "red" },
  { speaker: "Marco Verdi", timestamp: "00:26", text: "Yes, we are currently reviewing several internal processes, especially around distribution efficiency and demand forecasting for the A Modo Mio line.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "00:42", text: "Could you briefly describe the main operational challenges you are facing?", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "00:54", text: "The main issue is visibility.", color: "red" },
  { speaker: "Marco Verdi", timestamp: "00:57", text: "We have strong sell-in numbers, but downstream retail tracking is fragmented.", color: "red" },
  { speaker: "Marco Verdi", timestamp: "01:02", text: "We also operate across multiple regions with slightly different distribution models.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "01:09", text: "Is this a recent priority?", color: "blue" },
  { speaker: "Ritam Pramanik", timestamp: "01:25", text: "Who else is typically involved in decisions of this type?", color: "blue" },
  { speaker: "Ritam Pramanik", timestamp: "02:32", text: "Are you currently evaluating other vendors?", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "02:42", text: "We had preliminary conversations with two providers, but nothing formal yet.", color: "red" },
  { speaker: "Marco Verdi", timestamp: "02:47", text: "One concern I have is implementation complexity. We already operate at scale, so any disruption could be costly.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "03:03", text: "That makes sense.", color: "blue" },
  { speaker: "Ritam Pramanik", timestamp: "03:04", text: "Would a phased rollout reduce that concern?", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "03:11", text: "Potentially, yes.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "03:19", text: "As a next step, would it make sense to schedule a more detailed session where we quantify the potential ROI?", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "03:24", text: "Yes, but I would prefer to bring someone from finance into that discussion.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "03:33", text: "Perfect. Shall we aim for early next month?", color: "blue" },
  { speaker: "Marco Verdi", timestamp: "03:41", text: "Yes, that works.", color: "red" },
  { speaker: "Ritam Pramanik", timestamp: "03:50", text: "Thank you for your time, Marco.", color: "blue" },
  { speaker: "Ritam Pramanik", timestamp: "03:52", text: "I look forward to seeing you again in the next meeting.", color: "blue" },
];

export const mockPlaybookRules: PlaybookRule[] = [
  {
    id: "1",
    label: "Engaged in introductory banter",
    passed: false,
    weight: 10,
    isKeyDriver: true,
    whatYouSaid: "No relevant quote found in transcript.",
    whatYouShouldSay: "Hi Marco, thanks for taking the time to speak with me today. I'm excited to learn more about your current commercial operations and see if there's an opportunity for us to help.",
    timestamp: "00:08",
  },
  {
    id: "2",
    label: "Set a clear agenda",
    passed: true,
    weight: 25,
    isKeyDriver: false,
    whatYouSaid: "The objective of this call is to understand your current commercial operations, set up and see whether there could be alignment for optimization initiatives.",
    whatYouShouldSay: "The main goal of our call today is to discuss your current commercial operations and explore potential opportunities for optimization.",
    timestamp: "00:13",
  },
  {
    id: "3",
    label: "Handled objections effectively",
    passed: true,
    weight: 25,
    isKeyDriver: false,
    whatYouSaid: "We had preliminary conversations with two providers but nothing formal yet, one concern I have with implementation complexity, we already operated at scale any disruption could be costly.",
    whatYouShouldSay: "I understand you're concerned about implementation complexity, but we've worked with similar clients and found that a phased rollout can help minimize disruption.",
    timestamp: "02:42",
  },
  {
    id: "4",
    label: "Booked the next meeting / agreed clear next steps",
    passed: true,
    weight: 25,
    isKeyDriver: false,
    whatYouSaid: "As a next step, would it make sense to schedule a more detailed session where we quantify potential R O I? Yes, but I would prefer to bring someone from the finance into that discussion. Perfect, shall we aim for early next month?",
    whatYouShouldSay: "Let's schedule a follow-up meeting for early next month to discuss the potential ROI in more detail, and I'll make sure to bring someone from the finance team along.",
    timestamp: "03:19",
  },
  {
    id: "5",
    label: "Personalized demo",
    passed: false,
    weight: 5,
    isKeyDriver: false,
    whatYouSaid: "No personalized demonstration was provided during this call.",
    whatYouShouldSay: "Let me show you how our solution specifically handles Lavazza's distribution challenges across multiple regions.",
  },
  {
    id: "6",
    label: "Demo told a story",
    passed: false,
    weight: 5,
    isKeyDriver: false,
    whatYouSaid: "No narrative-driven demonstration was observed.",
    whatYouShouldSay: "Let me walk you through a scenario similar to yours — a FMCG brand that reduced forecast errors by 30% in 3 months.",
  },
];

export const mockMetrics: PerformanceMetric[] = [
  { label: "Speech pace", rating: "Great!", value: "120 words per minute", description: "" },
  { label: "Rapport building", rating: "Great!", value: "", description: "Established a connection with the customer" },
  { label: "Clarity of objective", rating: "Great!", value: "", description: "Clearly stated the objective of the call" },
  { label: "Active listening", rating: "Okay", value: "", description: "Listened to the customer's concerns, but could have asked more probing questions" },
  { label: "Handling objections", rating: "Needs work", value: "", description: "Did not address the customer's concern about implementation complexity effectively" },
  { label: "Closing the call", rating: "Great!", value: "", description: "Scheduled a next step and ended the call on a positive note" },
];

export const mockCoachWell: CoachFeedback[] = [
  { title: "Building rapport and demonstrating personal interest", description: "The seller established a connection with the customer and showed genuine interest in their operational challenges." },
  { title: "Clearly stating the objective of the call", description: "The seller clearly stated the objective of the call, which helped to set the tone for the conversation." },
  { title: "Active listening and responding to customer concerns", description: "The seller listened to the customer's concerns and responded thoughtfully, which helped to build trust and credibility." },
];

export const mockCoachImprove: CoachFeedback[] = [
  { title: "Improve objection handling", description: "The seller should work on addressing customer concerns more effectively, such as providing solutions or alternatives to mitigate risks." },
  { title: "Ask more probing questions", description: "The seller should ask more probing questions to gather more information about the customer's needs and concerns." },
  { title: "Provide more specific examples and case studies", description: "The seller should provide more specific examples and case studies to demonstrate the value and effectiveness of their solution." },
];

export const mockSummary = {
  text: "Introductory commercial discussion with Lavazza regarding their A Modo Mio product line. The conversation focused on understanding current operational challenges around distribution efficiency and demand forecasting. Key issues identified include fragmented downstream retail tracking and multi-regional distribution complexity. The prospect expressed concern about implementation complexity at scale. A follow-up meeting was agreed upon for early next month to quantify potential ROI, with finance team participation.",
  keyTakeaways: [
    "Lavazza is reviewing internal processes around distribution efficiency and demand forecasting for A Modo Mio line",
    "Main challenge: fragmented downstream retail tracking despite strong sell-in numbers",
    "Operations span multiple regions with different distribution models",
    "CFO approval required for decisions of this type",
    "Preliminary conversations with two other providers, nothing formal yet",
    "Concern about implementation complexity and disruption at scale",
  ],
  discussionTopics: [
    { title: "Introduction and overview", summary: "Call objectives and initial context setting" },
    { title: "Current Challenges", summary: "Distribution visibility, fragmented retail tracking, multi-regional complexity" },
    { title: "Product Fit & Capabilities", summary: "Alignment between Lavazza's needs and proposed optimization solutions" },
  ],
  nextSteps: [
    { assignee: "Ritam Pramanik", action: "Schedule a more detailed session to quantify potential ROI with someone from finance", dueDate: "" },
    { assignee: "Ritam Pramanik", action: "Follow up meeting with Marko and someone from finance", dueDate: "early next month" },
  ],
  questionsAndObjections: [
    { question: "Could you briefly describe the main operational challenges you are facing?", answer: "The main issue is visibility, with downstream retail tracking being fragmented.", timestamp: "00:42" },
    { question: "Is this a recent priority?", answer: "Yes, margin pressure has increased due to raw material volatility.", timestamp: "01:09" },
    { question: "Who else is typically involved in decision of this type?", answer: "Depends, but CFO approval will be required before final commitment.", timestamp: "01:25" },
    { question: "Are you currently evaluating other vendors?", answer: "We had preliminary conversations with two providers but nothing formal yet.", timestamp: "02:32" },
    { question: "Would a phase to roll out reduce the concern of implementation complexity?", answer: "Potentially yes.", timestamp: "03:04" },
  ],
};

export const mockPlaybookMetrics = [
  { label: "Handled objections", value: "80%" },
  { label: "Personalized demo", value: "0%" },
  { label: "Intro Banter", value: "20%" },
  { label: "Set Agenda", value: "90%" },
  { label: "Demo told a story", value: "0%" },
];

export const mockPlaybookTemplates: PlaybookTemplate[] = [
  {
    id: "demo",
    name: "Demo call",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Personal user information", description: "Basic information about the user participating in the demo call." },
      { title: "Open questions", description: "Questions, doubts or unresolved issues" },
      { title: "Problems", description: "Issues or challenges faced by the user that may need to be addressed during the demo." },
      { title: "Bugs", description: "Technical glitches or errors encountered by the user during the demo." },
      { title: "Feature requests", description: "Suggestions for new features or improvements based on the user's feedback." },
      { title: "Ideas/suggestions", description: "Innovative ideas or suggestions for product enhancement." },
      { title: "Demonstration", description: "Showcase of the product/service features and functionalities." },
      { title: "Next steps", description: "Actionable steps or follow-ups after the demo call." },
    ],
  },
  {
    id: "meddic",
    name: "MEDDIC",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Metrics", description: "Quantifiable measures of value the customer expects." },
      { title: "Economic Buyer", description: "The person who has the authority to approve the purchase." },
      { title: "Decision Criteria", description: "The formal criteria used by the organization to evaluate vendors." },
      { title: "Decision Process", description: "The steps and stakeholders involved in making the purchase decision." },
      { title: "Identify Pain", description: "The core business problems or challenges the customer faces." },
      { title: "Champion", description: "An internal advocate who supports and promotes your solution." },
    ],
  },
  {
    id: "spiced",
    name: "SPICED",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Situation", description: "Current state and context of the prospect." },
      { title: "Pain", description: "Key challenges and problems they face." },
      { title: "Impact", description: "Business impact of not solving the problem." },
      { title: "Critical Event", description: "Timeline or event driving urgency." },
      { title: "Decision", description: "How the decision will be made and by whom." },
    ],
  },
  {
    id: "bant",
    name: "BANT",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Budget", description: "Does the prospect have the budget for this solution?" },
      { title: "Authority", description: "Who is the decision maker?" },
      { title: "Need", description: "What is the business need or pain point?" },
      { title: "Timeline", description: "When do they plan to make a decision?" },
    ],
  },
  {
    id: "discovery",
    name: "Discovery call",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Company overview", description: "Current company situation and background." },
      { title: "Challenges", description: "Main pain points and challenges discussed." },
      { title: "Goals", description: "What the prospect wants to achieve." },
      { title: "Current tools", description: "Existing tools and processes in place." },
      { title: "Next steps", description: "Agreed follow-up actions." },
    ],
  },
  {
    id: "gpct",
    name: "GPCT",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Goals", description: "What goals does the prospect want to achieve?" },
      { title: "Plans", description: "What plans do they have to achieve these goals?" },
      { title: "Challenges", description: "What challenges might prevent them from succeeding?" },
      { title: "Timeline", description: "What is their timeline for achieving these goals?" },
    ],
  },
  {
    id: "champ",
    name: "CHAMP",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Challenges", description: "What challenges does the prospect face?" },
      { title: "Authority", description: "Who has decision-making authority?" },
      { title: "Money", description: "What is the budget situation?" },
      { title: "Prioritization", description: "How urgent is solving this problem?" },
    ],
  },
  {
    id: "spin",
    name: "SPIN",
    category: "Sales",
    isBuiltIn: true,
    sections: [
      { title: "Situation", description: "Questions about the prospect's current situation." },
      { title: "Problem", description: "Questions about problems and difficulties." },
      { title: "Implication", description: "Questions about the consequences of problems." },
      { title: "Need-Payoff", description: "Questions about the value of solving the problem." },
    ],
  },
  {
    id: "job-interview",
    name: "Job interview",
    category: "HR/Recruiting",
    isBuiltIn: true,
    sections: [
      { title: "Personal background", description: "Information about the candidate's personal history and background." },
      { title: "Professional experience", description: "Candidate's work experience and qualifications." },
      { title: "Motivation to apply", description: "Why the candidate is interested in the job opportunity." },
      { title: "Candidate skills", description: "Candidate's skills and competencies relevant to the job." },
      { title: "Personal strengths", description: "Candidate's personal strengths or attributes." },
      { title: "Personal growth opportunities", description: "Potential growth or development opportunities for the candidate." },
      { title: "Candidate's future aspirations", description: "Candidate's career goals or aspirations." },
      { title: "Candidate's questions", description: "Questions, doubts or unresolved issues." },
      { title: "Next steps", description: "Next steps in the interview process or post-interview actions." },
    ],
  },
  {
    id: "entry-interview",
    name: "Entry interview",
    category: "HR/Recruiting",
    isBuiltIn: true,
    sections: [
      { title: "Personal Background", description: "Information about the new employee's personal background, such as their education, previous work experience, and relevant skills." },
      { title: "Role expectations", description: "Specific responsibilities and expectations of the new employee's role within the organization, including key tasks, goals, and performance metrics." },
      { title: "Company culture and values", description: "Introduction of company's culture, values, mission, and vision to help the new employee understand the organization's ethos and work environment." },
      { title: "Onboarding Process Overview", description: "Overview of the onboarding process, including training programs, orientation sessions, and resources available to support the new employee's integration into the company." },
      { title: "Feedback and expectations", description: "New employee's expectations, concerns and questions about their role, the team and the company overall." },
    ],
  },
  {
    id: "campaign-planning",
    name: "Campaign planning",
    category: "Marketing",
    isBuiltIn: true,
    sections: [
      { title: "Campaign objectives", description: "Goals and KPIs for the campaign." },
      { title: "Target audience", description: "Audience segments and personas." },
      { title: "Channels & tactics", description: "Marketing channels and execution tactics." },
      { title: "Budget & timeline", description: "Resource allocation and key milestones." },
      { title: "Measurement", description: "How success will be tracked and reported." },
    ],
  },
  {
    id: "marketing-sync",
    name: "Marketing sync",
    category: "Marketing",
    isBuiltIn: true,
    sections: [
      { title: "Updates", description: "Status updates on ongoing campaigns and projects." },
      { title: "Metrics review", description: "Key performance metrics and trends." },
      { title: "Blockers", description: "Issues or bottlenecks slowing progress." },
      { title: "Action items", description: "Tasks and owners for the next period." },
    ],
  },
  {
    id: "marketing-performance-review",
    name: "Performance review",
    category: "Marketing",
    isBuiltIn: true,
    sections: [
      { title: "Campaign results", description: "Performance data against targets." },
      { title: "Learnings", description: "Key insights and takeaways." },
      { title: "Optimization opportunities", description: "Areas for improvement." },
      { title: "Recommendations", description: "Suggested changes for future campaigns." },
    ],
  },
  {
    id: "strategic-planning",
    name: "Strategic planning",
    category: "Strategy",
    isBuiltIn: true,
    sections: [
      { title: "Vision & goals", description: "Long-term vision and strategic objectives." },
      { title: "Market analysis", description: "Competitive landscape and market trends." },
      { title: "Initiatives", description: "Key strategic initiatives and priorities." },
      { title: "Resources", description: "Resource allocation and capability gaps." },
      { title: "Risks", description: "Potential risks and mitigation strategies." },
    ],
  },
  {
    id: "leadership-sync",
    name: "Leadership sync",
    category: "Strategy",
    isBuiltIn: true,
    sections: [
      { title: "Business updates", description: "High-level updates across departments." },
      { title: "Key decisions", description: "Decisions required from leadership." },
      { title: "Cross-functional alignment", description: "Inter-team dependencies and coordination." },
      { title: "Priorities", description: "Focus areas for the upcoming period." },
    ],
  },
  {
    id: "quarterly-planning",
    name: "Quarterly planning",
    category: "Strategy",
    isBuiltIn: true,
    sections: [
      { title: "Quarter review", description: "Results and achievements from the previous quarter." },
      { title: "OKRs", description: "Objectives and key results for the new quarter." },
      { title: "Resource planning", description: "Team capacity and resource allocation." },
      { title: "Milestones", description: "Key dates and deliverables." },
    ],
  },
];

// === Meeting Evaluation Data ===

export type DealStage = "intro" | "discovery" | "demo" | "proposal" | "negotiation" | "closed-won" | "closed-lost";

export interface MeetingEvaluation {
  meetingId: string;
  evaluatedAt: Date;
  outcome: {
    status: "successful" | "neutral" | "needs-attention";
    summary: string;
    dealProgression: {
      from: DealStage;
      to: DealStage;
      likelihood: "high" | "medium" | "low";
    };
    keyMoments: Array<{
      timestamp: string;
      type: "positive" | "negative" | "neutral";
      description: string;
    }>;
  };
  strategicInsights: Array<{
    category: "pain-point" | "budget" | "decision-maker" | "timeline" | "competition";
    insight: string;
    confidence: number;
    icon: string;
  }>;
  recommendedActions: Array<{
    id: string;
    priority: 1 | 2 | 3;
    title: string;
    description: string;
    timing: "immediate" | "within-24h" | "this-week" | "this-month";
    actionType: "follow-up" | "send-material" | "schedule-meeting";
    status: "pending" | "completed" | "dismissed";
  }>;
}

export const mockEvaluation: MeetingEvaluation = {
  meetingId: "lavazza-001",
  evaluatedAt: new Date("2026-03-02T14:30:00"),
  outcome: {
    status: "successful",
    summary: "You ran an excellent discovery call. You successfully uncovered their core pain point around distribution visibility and confirmed budget availability. Your prospect engaged positively, and you secured agreement for a finance follow-up.",
    dealProgression: { from: "intro", to: "discovery", likelihood: "high" },
    keyMoments: [
      { timestamp: "00:54", type: "positive", description: "You helped Marco identify 'visibility' as his main challenge" },
      { timestamp: "01:25", type: "positive", description: "You confirmed CFO involvement and decision-maker access" },
      { timestamp: "02:42", type: "negative", description: "Implementation complexity concern was raised — you addressed it with a phased rollout suggestion" },
      { timestamp: "03:19", type: "positive", description: "You secured agreement for an ROI session with their finance team" },
    ],
  },
  strategicInsights: [
    { category: "pain-point", insight: "You identified fragmented downstream retail tracking across multiple regions as their core pain", confidence: 95, icon: "✓" },
    { category: "budget", insight: "You confirmed budget availability and finance team engagement for the next step", confidence: 90, icon: "💰" },
    { category: "decision-maker", insight: "You need to engage the CFO directly in your next meeting — their approval is required", confidence: 85, icon: "👤" },
    { category: "competition", insight: "Two other vendors are in preliminary talks — move quickly to maintain your advantage", confidence: 75, icon: "⚠️" },
  ],
  recommendedActions: [
    {
      id: "action-001",
      priority: 1,
      title: "Send Phased Rollout Case Study",
      description: "Address the implementation complexity concern you uncovered by sharing a similar customer success story showing phased deployment.",
      timing: "within-24h",
      actionType: "send-material",
      status: "pending",
    },
    {
      id: "action-002",
      priority: 2,
      title: "Prepare ROI Calculator",
      description: "Build a custom ROI model using their regional distribution metrics before your finance meeting.",
      timing: "this-week",
      actionType: "schedule-meeting",
      status: "pending",
    },
    {
      id: "action-003",
      priority: 3,
      title: "Map Decision Process",
      description: "Research Lavazza's procurement process and identify all stakeholders you'll need for final approval.",
      timing: "this-week",
      actionType: "follow-up",
      status: "pending",
    },
  ],
};

// === Smart Summary Data ===

export interface DealEvolutionMeeting {
  id: string;
  date: string;
  type: string;
  outcome: string;
  isCurrent: boolean;
}

export interface ThenVsNow {
  topic: string;
  then: { date: string; status: string; sentiment: "positive" | "negative" | "neutral" };
  now: { status: string; sentiment: "positive" | "negative" | "neutral" };
  impact: string;
  indicator: "green" | "amber" | "red" | "blue";
}

export interface ChangeAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "positive";
  title: string;
  category: string;
  previous: { state: string; date: string };
  current: { state: string };
  impactAnalysis: string;
  recommendedActions: string[];
}

export interface EnhancedTopic {
  title: string;
  summary: string;
  badge: "new" | "revisited" | "resolved" | "shifted" | "trending";
  meetingCount: string;
  sentimentTrend: "improving" | "declining" | "stable";
  timeline: Array<{ date: string; quote: string; sentiment: "positive" | "negative" | "neutral" }>;
  status: string;
  nextStep: string;
}

export interface StrategicRecommendation {
  priority: "critical" | "important" | "opportunity";
  title: string;
  why: string;
  impact: string;
  timeline: string;
  confidence: number;
}

export interface DealHealthMetrics {
  engagement: { value: number; trend: "up" | "down" | "stable" };
  momentum: { value: number; trend: "up" | "down" | "stable" };
  riskLevel: { label: string; trend: "up" | "down" | "stable" };
  winProbability: { value: number; trend: "up" | "down" | "stable" };
}

export const mockDealEvolution: DealEvolutionMeeting[] = [
  { id: "m1", date: "Feb 15", type: "Cold Outreach", outcome: "Initial interest confirmed", isCurrent: false },
  { id: "m2", date: "Feb 28", type: "Intro Call", outcome: "Pain points identified", isCurrent: false },
  { id: "m3", date: "Mar 1", type: "Discovery", outcome: "Budget confirmed, CFO access", isCurrent: false },
  { id: "m4", date: "Today", type: "Follow-up Discovery", outcome: "ROI session agreed", isCurrent: true },
];

export const mockThenVsNow: ThenVsNow[] = [
  {
    topic: "Budget Status",
    then: { date: "Mar 1", status: "CFO confirmed budget allocation", sentiment: "positive" },
    now: { status: "Need to check with finance team", sentiment: "negative" },
    impact: "Deal risk increased — authority unclear",
    indicator: "amber",
  },
  {
    topic: "Decision Makers",
    then: { date: "Mar 1", status: "Marco has signing authority", sentiment: "positive" },
    now: { status: "Board needs to review this", sentiment: "negative" },
    impact: "New stakeholders in decision process",
    indicator: "amber",
  },
  {
    topic: "Implementation Readiness",
    then: { date: "Feb 28", status: "Concerned about complexity", sentiment: "negative" },
    now: { status: "Phased rollout plan resolves concerns", sentiment: "positive" },
    impact: "Technical barrier reduced — positive progression",
    indicator: "green",
  },
];

export const mockChangeAlerts: ChangeAlert[] = [
  {
    id: "ca1",
    severity: "warning",
    title: "Budget Authority Changed",
    category: "Budget",
    previous: { state: "CFO approval confirmed, budget allocated", date: "Mar 1" },
    current: { state: "Need to check with finance team" },
    impactAnalysis: "Deal risk increased by 35%. Previously confirmed authority is now uncertain.",
    recommendedActions: [
      "Schedule direct call with CFO within 48h",
      "Clarify budget approval process changes",
      "Identify if new compliance requirements emerged",
    ],
  },
  {
    id: "ca2",
    severity: "info",
    title: "Implementation Concerns Resolved",
    category: "Technical",
    previous: { state: "Implementation complexity is a blocker", date: "Feb 28" },
    current: { state: "Phased rollout approach accepted" },
    impactAnalysis: "Technical barrier resolved. Prospect moved from hesitation to acceptance.",
    recommendedActions: [
      "Document phased rollout agreement in follow-up email",
      "Prepare detailed implementation timeline",
    ],
  },
];

export const mockEnhancedTopics: EnhancedTopic[] = [
  {
    title: "Current Challenges",
    summary: "Distribution visibility, fragmented retail tracking, multi-regional complexity",
    badge: "revisited",
    meetingCount: "Discussed in 3 of 4 meetings",
    sentimentTrend: "improving",
    timeline: [
      { date: "Feb 28", quote: "Regional visibility is our biggest pain point", sentiment: "negative" },
      { date: "Mar 1", quote: "Your solution addresses this, but implementation concerns", sentiment: "neutral" },
      { date: "Today", quote: "Phased rollout plan resolves our concerns", sentiment: "positive" },
    ],
    status: "Moving toward resolution",
    nextStep: "Finalize implementation timeline",
  },
  {
    title: "Budget & Authority",
    summary: "Budget availability and decision-making process",
    badge: "shifted",
    meetingCount: "Discussed in 2 of 4 meetings",
    sentimentTrend: "declining",
    timeline: [
      { date: "Mar 1", quote: "I have signing authority, budget is allocated", sentiment: "positive" },
      { date: "Today", quote: "Board needs to review, need to check with finance", sentiment: "negative" },
    ],
    status: "Position changed — requires re-qualification",
    nextStep: "Schedule CFO alignment call",
  },
  {
    title: "Competitive Landscape",
    summary: "Other vendor evaluations and competitive positioning",
    badge: "new",
    meetingCount: "First time discussed",
    sentimentTrend: "stable",
    timeline: [
      { date: "Today", quote: "Preliminary conversations with two providers, nothing formal", sentiment: "neutral" },
    ],
    status: "Early stage — no formal competitor selected",
    nextStep: "Differentiate on implementation speed and phased approach",
  },
];

export const mockStrategicRecommendations: StrategicRecommendation[] = [
  {
    priority: "critical",
    title: "Re-qualify Budget Authority",
    why: "Budget status shifted from confirmed to uncertain",
    impact: "Blocks deal progression — affects close probability by 40%",
    timeline: "Schedule CFO call within 48 hours",
    confidence: 92,
  },
  {
    priority: "important",
    title: "Address Implementation Concerns",
    why: "Raised in 2 consecutive meetings without full resolution",
    impact: "Affects timeline and technical acceptance",
    timeline: "Send case study within 24 hours",
    confidence: 85,
  },
  {
    priority: "opportunity",
    title: "Engage Finance Team",
    why: "Positive mention indicates buying intent",
    impact: "Could accelerate decision timeline",
    timeline: "Prepare ROI materials this week",
    confidence: 78,
  },
];

export const mockDealHealth: DealHealthMetrics = {
  engagement: { value: 78, trend: "up" },
  momentum: { value: 65, trend: "stable" },
  riskLevel: { label: "Medium", trend: "up" },
  winProbability: { value: 72, trend: "stable" },
};

// Evaluation status for each call in sidebar
export const mockCallEvaluations: Record<string, { status: "evaluated" | "pending"; actionCount: number; progression?: string }> = {
  "1": { status: "evaluated", actionCount: 3, progression: "Intro → Discovery ↑" },
  "2": { status: "evaluated", actionCount: 2, progression: "Discovery → Demo ↑" },
  "3": { status: "pending", actionCount: 0 },
  "4": { status: "pending", actionCount: 0 },
  "5": { status: "evaluated", actionCount: 1, progression: "Proposal → Negotiation ↑" },
  "6": { status: "evaluated", actionCount: 2, progression: "Negotiation → Closing ↑" },
  "7": { status: "pending", actionCount: 0 },
  "8": { status: "evaluated", actionCount: 0, progression: "Closing → Won ✓" },
};
