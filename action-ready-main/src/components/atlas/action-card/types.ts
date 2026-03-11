export type ActionType = "email_response" | "call_followup" | "schedule_demo";
export type SentimentBadge = "interested" | "not_interested" | "not_now";

export interface AlternativeOption {
  label: string;
  confidence: number;
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
  triggeredFrom: string;
  dueLabel: string;
  isOverdue?: boolean;
  strategicStep?: string;
  objective?: string;
  keyTopics?: string[];
  whyThisStep?: string;
  draftContent: string;
  toneOptions?: string[];
  toneDrafts?: Partial<Record<"Professional" | "Warm" | "Direct", string>>;
  decisionFactors?: { label: string; value: string }[];
  alternativeOptions?: AlternativeOption[];
  interactionSummary?: string;
  interactionHistory?: InteractionHistoryItem[];
}
