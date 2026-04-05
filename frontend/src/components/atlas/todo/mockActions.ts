import { ActionCardData } from "./types";
const companies = {
  interested: [
    "TechVentures Corp", "GrowthScale Inc", "Innovation Labs", "DevTools Solutions", "FinTech Partners",
    "CloudNine Systems", "DataFlow Analytics", "QuantumLeap AI", "PrimeStack Technologies", "NexGen Software",
    "BlueWave Digital", "CyberVault Security", "AppSphere Inc", "ScaleForce Labs", "TrueNorth Analytics",
    "VelocityCode", "BrightPath Systems", "CoreLogic Partners", "SyntheticMinds AI", "DigitalPulse Corp",
    "AlphaEdge Technologies",
  ],
  not_interested: [
    "Legacy Systems Co", "Declined Corp", "Competitor User Inc", "Budget Constraints LLC", "OldGuard Enterprises",
    "StaticTech Group", "NoChange Corp", "FlatLine Industries", "SteadyState LLC", "ConservaTech",
    "HoldPattern Inc", "MinimalGrowth Co", "Plateau Systems", "SlowAdopt Corp", "BasicOps LLC",
    "TraditionalWay Inc",
  ],
  meeting_intent: [
    "Eager Buyer Corp", "Decision Ready Inc", "Fast Track Startup",
  ],
  not_now: [
    "NextQuarter Corp", "FuturePlans Inc",
  ],
  forwarded: [
    "Redirect Solutions", "PassAlong Inc",
  ],
  personal: [
    "Marco Bianchi", "Laura Rossi", "Giovanni Ferretti", "Anna Colombo",
  ],
};

const interestedTitles = [
  "Send ROI calculator and enterprise pricing", "Schedule product demo with C-suite", "Follow up on pilot program interest",
  "Answer API integration questions", "Share security compliance documentation", "Send custom proposal for Q1 rollout",
  "Provide benchmark results vs competitors", "Share customer success stories", "Send technical architecture overview",
  "Schedule sandbox walkthrough", "Address data migration concerns", "Send SSO integration guide",
  "Follow up on procurement timeline", "Share onboarding playbook", "Confirm pilot scope and timeline",
  "Send volume pricing breakdown", "Schedule founder-to-founder call", "Share platform roadmap preview",
  "Address compliance questionnaire", "Send multi-region deployment guide", "Follow up on security audit results",
];

const notInterestedTitles = [
  "Quarterly industry newsletter", "6-month check-in on priorities", "Share new feature announcement",
  "Request referral to other departments", "Send annual product recap", "Share industry benchmarking report",
  "Light-touch re-engagement email", "Send product update digest", "Quarterly market insights",
  "Annual review invitation", "Share competitive landscape update", "Low-priority nurture sequence",
  "Community event invitation", "Annual survey participation", "Share thought leadership content",
  "Product webinar invitation",
];

const meetingIntentTitles = [
  "Book demo requested by VP Sales", "Schedule technical review with IT team", "Set up intro call with founder",
];

const notNowTitles = ["Schedule Q2 follow-up reminder", "Set calendar ping for budget cycle"];
const forwardedTitles = ["Follow up with referred contact", "Connect with forwarded stakeholder"];

const personalTitles = [
  "Follow up on personal intro from demo meeting",
  "Reply to thank-you email after product walkthrough",
  "Send meeting notes to direct contact",
  "Follow up on coffee chat scheduling",
];

function makeDueLabel(status: "needs_review" | "overdue" | "completed", index: number): { dueLabel: string; isOverdue: boolean } {
  if (status === "overdue") {
    const days = 6 + (index % 5);
    return { dueLabel: `${days} days overdue`, isOverdue: true };
  }
  if (status === "completed") {
    return { dueLabel: "Completed", isOverdue: false };
  }
  const options = ["Due today", "Due tomorrow", "Due in 2 days", "Due in 3 days", "Due in 4 days", "Due in 5 days"];
  return { dueLabel: options[index % options.length], isOverdue: false };
}

function pickType(title: string): "email_response" | "call_followup" | "schedule_demo" | "send_resources" {
  const lower = title.toLowerCase();
  if (lower.includes("schedule") || lower.includes("book") || lower.includes("set up") || lower.includes("call")) return "schedule_demo";
  if (lower.includes("follow up") || lower.includes("check-in")) return "call_followup";
  if (lower.includes("share") || lower.includes("send") || lower.includes("refer") || lower.includes("suggest") || lower.includes("provide")) return "send_resources";
  return "email_response";
}

function pickChannel(type: string): "Email" | "Meeting" {
  if (type === "call_followup" || type === "schedule_demo") return "Meeting";
  return "Email";
}

let idCounter = 1;

function generateTasks(
  titles: string[],
  companyList: string[],
  category: ActionCardData["category"],
  statusDistribution: ActionCardData["status"][],
): ActionCardData[] {
  return titles.map((title, i) => {
    const type = pickType(title);
    const channel = pickChannel(type);
    const status = statusDistribution[i % statusDistribution.length];
    const { dueLabel, isOverdue } = makeDueLabel(status, i);
    const company = companyList[i % companyList.length];
    const id = String(idCounter++);

    return {
      id,
      type,
      title,
      prospect: company,
      sentiment: category,
      triggeredFrom: channel,
      dueLabel,
      isOverdue,
      status,
      category,
      objective: `Move ${company} toward next milestone`,
      draftContent: `Hi there,\n\nFollowing up regarding "${title}". I wanted to make sure we're aligned on the next steps.\n\nLooking forward to hearing from you.\n\nBest regards`,
      keyTopics: ["ROI", "Budget", "Timeline", "Urgency", "Pricing"],
      interactionSummary: `Recent activity with ${company} suggests this action is timely and aligned with their current stage.`,
      interactionHistory: [
        { type: "email" as const, timeAgo: "2d ago", summary: "Last touchpoint regarding interest" },
      ],
      neurosciencePrinciples: [
        {
          title: "Loss Aversion",
          explanation: "The draft emphasizes what the prospect may lose if they delay action on this opportunity.",
          highlightedPhrase: "make sure we're aligned on the next steps",
        },
        {
          title: "Social Proof",
          explanation: "References to similar companies build trust and reduce perceived risk for the prospect.",
          highlightedPhrase: "Companies in your industry are already benefiting",
        },
        {
          title: "Urgency",
          explanation: "Time-bound framing accelerates commitment and reduces procrastination.",
          highlightedPhrase: "Looking forward to hearing from you",
        },
      ],
    };
  });
}

export const mockActions: ActionCardData[] = [
  ...generateTasks(interestedTitles, companies.interested, "interested", ["needs_review", "needs_review", "needs_review", "overdue", "completed"]),
  ...generateTasks(notInterestedTitles, companies.not_interested, "not_interested", ["needs_review", "needs_review", "completed", "overdue"]),
  ...generateTasks(meetingIntentTitles, companies.meeting_intent, "meeting_intent", ["needs_review", "needs_review", "needs_review"]),
  ...generateTasks(notNowTitles, companies.not_now, "not_now", ["needs_review", "completed"]),
  ...generateTasks(forwardedTitles, companies.forwarded, "forwarded", ["needs_review", "needs_review"]),
  ...generateTasks(personalTitles, companies.personal, "personal", ["needs_review", "needs_review", "overdue", "completed"]),
];

export const categories = [
  { key: "all" as const, label: "All" },
  { key: "interested" as const, label: "Interested" },
  { key: "not_interested" as const, label: "Not interested" },
  { key: "meeting_intent" as const, label: "Meeting intent" },
  { key: "not_now" as const, label: "Not now" },
  { key: "forwarded" as const, label: "Forwarded" },
  { key: "personal" as const, label: "Personal" },
];
