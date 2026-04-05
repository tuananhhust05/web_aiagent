export type ActionType = "email_response" | "call_followup" | "schedule_demo" | "send_resources";
export type SentimentBadge = "interested" | "not_interested" | "not_now" | "meeting_intent" | "forwarded" | "personal";
export type Channel = "Email" | "Meeting";
export type TaskStatus = "needs_review" | "overdue" | "completed";

export interface NeurosciencePrinciple {
  title: string;
  explanation: string;
  highlightedPhrase: string;
}

export interface AlternativeOption {
  label: string;
  confidence: number;
  actionType?: "email" | "call" | "meeting" | "whatsapp" | "proposal";
}

export interface InteractionHistoryItem {
  type: "email" | "call" | "meeting";
  timeAgo: string;
  summary: string;
}

export interface ActionCardData {
  id: string;
  type: ActionType;
  title: string;
  prospect: string;
  sentiment: SentimentBadge;
  triggeredFrom: Channel;
  dueLabel: string;
  isOverdue?: boolean;
  status: TaskStatus;
  category: SentimentBadge;
  strategicStep?: string;
  objective?: string;
  keyTopics?: string[];
  whyThisStep?: string;
  draftContent: string;
  toneOptions?: string[];
  toneDrafts?: Partial<Record<"Professional" | "Friendly" | "Direct", string>>;
  decisionFactors?: { label: string; value: string }[];
  alternativeOptions?: AlternativeOption[];
  interactionSummary?: string;
  interactionHistory?: InteractionHistoryItem[];
  neurosciencePrinciples?: NeurosciencePrinciple[];
}

export interface CategoryItem {
  key: SentimentBadge | "all";
  label: string;
  count: number;
}
