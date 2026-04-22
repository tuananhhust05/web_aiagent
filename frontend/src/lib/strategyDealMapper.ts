import type {
  CompanyDeal,
  DealStatus,
  StrategyActionItem,
  DecisionFriction,
  InterestJourneyPoint,
} from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";

type BackendDeal = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  stage_name?: string;
  next_step?: string;
  amount?: number;
  probability?: number | null;
  expected_close_date?: string | null;
  updated_at?: string;
  created_at?: string;
  contact_name?: string;
  contact_email?: string;
  days_in_stage?: number;
  is_stalled?: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
  custom_properties?: Record<string, unknown>;
};

type BackendDealListResponse = {
  deals?: BackendDeal[];
};

const STATUS_TO_INTEREST: Record<string, number> = {
  new: 10,
  lead: 15,
  contacted: 25,
  qualified: 35,
  demo: 50,
  proposal: 65,
  negotiation: 75,
  closed_won: 95,
  closed_lost: 0,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatCurrencyEUR(amount: number): string {
  if (!amount || amount <= 0) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateLabel(input?: string | null): string {
  if (!input) return "TBD";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(input?: string): string {
  if (!input) return "Today";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "Today";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function mapStatusToStrategy(status: string, interest: number): DealStatus {
  if (status === "closed_won") return "closed_won";
  if (status === "closed_lost") return "closed_lost";
  return interest < 30 ? "first_meeting" : "ongoing_negotiation";
}

function buildDecisionFriction(deal: BackendDeal, interestLevel: number): DecisionFriction[] {
  const friction: DecisionFriction[] = [];

  if (deal.is_stalled) {
    friction.push({
      title: "Deal momentum is stalling",
      frictionLevel: "HIGH",
      blockingPercent: 40,
      whyItMatters: "No movement in-stage reduces close probability each week.",
      currentState: `Deal has spent ${deal.days_in_stage ?? 0} days in current stage.`,
      effectOnInterest: "Interest progression is blocked until a concrete next step is agreed.",
      howToRemove: [
        "Confirm one owner for next step",
        "Book a 15-min alignment call",
        "Send recap with deadline",
      ],
      timeline: "Within 2 days",
      successIndicator: "Prospect confirms a dated next step",
    });
  }

  if (!deal.next_step) {
    friction.push({
      title: "No explicit next step is defined",
      frictionLevel: "MEDIUM",
      blockingPercent: 30,
      whyItMatters: "Without a concrete next step, the deal can drift and lose urgency.",
      currentState: "Pipeline record has no next_step value.",
      effectOnInterest: "Decision momentum stays flat.",
      howToRemove: [
        "Set one specific next action",
        "Assign owner and due date",
        "Confirm acceptance with stakeholder",
      ],
      timeline: "Within this week",
      successIndicator: "Next step accepted by all key stakeholders",
    });
  }

  if (friction.length === 0) {
    friction.push({
      title: "Stakeholder alignment still needs validation",
      frictionLevel: "LOW",
      blockingPercent: 15,
      whyItMatters: "Late-stage surprises often come from unseen stakeholders.",
      currentState: "No explicit blocker captured in CRM.",
      effectOnInterest: "Progress may slow unexpectedly.",
      howToRemove: ["Validate decision map", "Confirm approval flow"],
      timeline: "This week",
      successIndicator: "Clear decision chain documented",
    });
  }

  return friction;
}

function buildActionItems(deal: BackendDeal, decisionFriction: DecisionFriction[]): StrategyActionItem[] {
  const topFriction = decisionFriction[0];
  const baseTitle = deal.next_step || "Define and lock next stakeholder action";

  const topPriority: StrategyActionItem = {
    id: 1,
    title: baseTitle,
    priority: deal.is_stalled ? "Critical" : "High",
    priorityColor: deal.is_stalled ? "destructive" : "orange-500",
    owner: "You",
    deadline: topFriction.timeline || "This week",
    expectedOutcome: topFriction.successIndicator,
    interestImpact: deal.is_stalled ? "+8-12%" : "+4-8%",
    frictionRemoved: `removes ${topFriction.blockingPercent}% decision friction`,
    details: topFriction.howToRemove,
  };

  return [topPriority];
}

function buildInterestJourney(deal: BackendDeal, interestLevel: number, previousLevel: number): InterestJourneyPoint[] {
  return [
    {
      date: formatShortDate(deal.created_at),
      interestLevel: previousLevel,
      cognitiveState: getCognitiveState(previousLevel).name,
      change: 0,
      event: "Deal created",
      detail: "Opportunity entered pipeline",
    },
    {
      date: formatShortDate(deal.updated_at),
      interestLevel,
      cognitiveState: getCognitiveState(interestLevel).name,
      change: interestLevel - previousLevel,
      event: "Latest CRM update",
      detail: deal.next_step || "Record updated",
    },
  ];
}

export function mapBackendDealToCompanyDeal(deal: BackendDeal): CompanyDeal {
  const status = (deal.status || "lead").toLowerCase();
  const interestLevel = clamp(Math.round(deal.probability ?? STATUS_TO_INTEREST[status] ?? 20), 0, 100);
  const previousInterestLevel = clamp(interestLevel - (deal.is_stalled ? 5 : 2), 0, 100);
  const currentStage = getCognitiveState(Math.max(10, interestLevel)).name;
  const daysAtCurrentLevel = Math.max(0, deal.days_in_stage ?? 0);
  const decisionFriction = buildDecisionFriction(deal, interestLevel);
  const actionItems = buildActionItems(deal, decisionFriction);

  const lastContactDays = deal.updated_at
    ? Math.max(0, Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const strategyStatus = mapStatusToStrategy(status, interestLevel);

  return {
    id: String(deal.id),
    company: deal.name,
    industry: String((deal.custom_properties?.industry as string) || "Unknown"),
    dealValue: formatCurrencyEUR(deal.amount || 0),
    status: strategyStatus,
    interestLevel,
    previousInterestLevel,
    interestChange: interestLevel - previousInterestLevel,
    daysAtCurrentLevel,
    interestVelocity: deal.is_stalled ? 0 : 0.5,
    currentStage,
    crmStage: deal.stage_name || status,
    crmMapping: {
      interestLevel,
      cognitiveState: currentStage,
      crmStage: deal.stage_name || status,
      inSync: true,
      lastSynced: formatDateLabel(deal.updated_at),
    },
    lastContact: lastContactDays,
    primaryContact: deal.contact_name || "Unknown contact",
    primaryTitle: "Stakeholder",
    stakeholderStatus: [
      { label: "Champion", met: !!deal.contact_name },
      { label: "Budget", met: interestLevel >= 60 },
      { label: "Decision-maker", met: interestLevel >= 70 },
    ],
    biggestBlocker: decisionFriction[0]?.title || "No blocker detected",
    nextAction: deal.next_step || "Define next action",
    estimatedCloseDate: formatDateLabel(deal.expected_close_date),
    dealAssessment: deal.description || "Deal imported from CRM pipeline.",
    situationSummary: deal.description || "No detailed summary available from CRM yet.",
    whyThisStage: [
      `Current CRM stage: ${deal.stage_name || status}.`,
      `Deal has spent ${daysAtCurrentLevel} days in this stage.`,
      decisionFriction[0]?.whyItMatters || "Primary friction is being monitored.",
    ],
    winFactors: [],
    lossRisks: decisionFriction.map((f) => f.whyItMatters),
    interestJourney: buildInterestJourney(deal, interestLevel, previousInterestLevel),
    interestSignals: [],
    decisionFriction,
    frictionRoadmap: [],
    interestAlerts: [],
    interestPatterns: [],
    interactions: [],
    stakeholders: [
      {
        name: deal.contact_name || "Primary Contact",
        title: "Main contact",
        role: "Primary",
        status: "Engaged",
        statusColor: "cyan",
        notes: deal.contact_email || "",
        priority: false,
      },
    ],
    objections: [],
    commitments: [],
    strategies: [],
    actionItems,
    similarWins: [],
    weeklyPlan: [],
    redFlags: [],
    emotionalTriggers: [],
    objectionPsychology: [],
    decisionProfile: [],
    decisionProfileNote: "",
    progressionNote: "",
  };
}

export function mapDealsResponseToStrategyDeals(payload: unknown): CompanyDeal[] {
  const raw = payload as BackendDealListResponse | BackendDeal[];
  const deals = Array.isArray(raw) ? raw : raw?.deals ?? [];
  return deals.map(mapBackendDealToCompanyDeal);
}
