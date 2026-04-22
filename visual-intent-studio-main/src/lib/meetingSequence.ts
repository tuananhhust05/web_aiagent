// Meeting sequence and velocity tracking
// Replaces interest percentages with chronological meeting counts

export type DealVelocity = "normal" | "stalled" | "fast";
export type StrategyMode = "FIRST_INTERACTION" | "DEAL_CONTEXT";

export interface MeetingSequenceData {
  meetingNumber: number;
  strategyMode: StrategyMode;
  velocity: DealVelocity;
  cognitiveState: string;
}

// Maps meeting IDs to their sequence number within the account
const MEETING_SEQUENCE_MAP: Record<string, MeetingSequenceData> = {
  "1": { meetingNumber: 3, strategyMode: "DEAL_CONTEXT", velocity: "normal", cognitiveState: "Evaluation" },
  "2": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Attention" },
  "3": { meetingNumber: 2, strategyMode: "DEAL_CONTEXT", velocity: "normal", cognitiveState: "Interest" },
  "4": { meetingNumber: 5, strategyMode: "DEAL_CONTEXT", velocity: "normal", cognitiveState: "Validation" },
  "5": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Curiosity" },
  "6": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Attention" },
  "7": { meetingNumber: 7, strategyMode: "DEAL_CONTEXT", velocity: "fast", cognitiveState: "Decision" },
  "8": { meetingNumber: 3, strategyMode: "DEAL_CONTEXT", velocity: "stalled", cognitiveState: "Problem Recognition" },
  "9": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Attention" },
  "10": { meetingNumber: 8, strategyMode: "DEAL_CONTEXT", velocity: "normal", cognitiveState: "Decision" },
  "11": { meetingNumber: 6, strategyMode: "DEAL_CONTEXT", velocity: "fast", cognitiveState: "Hard Commitment" },
  "12": { meetingNumber: 4, strategyMode: "DEAL_CONTEXT", velocity: "normal", cognitiveState: "Trust" },
  "13": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Attention" },
  "14": { meetingNumber: 6, strategyMode: "DEAL_CONTEXT", velocity: "stalled", cognitiveState: "Evaluation" },
  "15": { meetingNumber: 1, strategyMode: "FIRST_INTERACTION", velocity: "normal", cognitiveState: "Attention" },
  "16": { meetingNumber: 2, strategyMode: "DEAL_CONTEXT", velocity: "fast", cognitiveState: "Interest" },
};

export function getMeetingSequence(meetingId: string): MeetingSequenceData {
  return MEETING_SEQUENCE_MAP[meetingId] || {
    meetingNumber: 1,
    strategyMode: "FIRST_INTERACTION" as StrategyMode,
    velocity: "normal" as DealVelocity,
    cognitiveState: "Attention",
  };
}

export const VELOCITY_DOT_CLASSES: Record<DealVelocity, string> = {
  normal: "bg-teal-400",
  stalled: "bg-red-400",
  fast: "bg-blue-400",
};

export function getStrategyStatusText(data: MeetingSequenceData): string {
  if (data.strategyMode === "FIRST_INTERACTION") {
    return `Meeting 1 with this account. Preparation based on profile analysis.`;
  }
  if (data.velocity === "stalled") {
    return `Meeting ${data.meetingNumber} at ${data.cognitiveState}. More meetings than expected for this stage.`;
  }
  if (data.velocity === "fast") {
    return `Meeting ${data.meetingNumber}. Reached ${data.cognitiveState} faster than typical. Validate signals.`;
  }
  return `Meeting ${data.meetingNumber} with this account. ${data.cognitiveState} stage. Deal context active.`;
}

export function getStrategyStatusDotClass(data: MeetingSequenceData): string {
  if (data.strategyMode === "FIRST_INTERACTION") return "bg-amber-400";
  if (data.velocity === "stalled") return "bg-red-500";
  if (data.velocity === "fast") return "bg-blue-500";
  return "bg-emerald-500";
}

export function getEnterCallSubtitle(data: MeetingSequenceData): { text: string; colorClass: string } {
  if (data.strategyMode === "FIRST_INTERACTION") {
    return { text: "Meeting 1. Profile-based preparation.", colorClass: "text-amber-600/70" };
  }
  if (data.velocity === "stalled") {
    return { text: `Meeting ${data.meetingNumber}. Previous approach needs adjustment.`, colorClass: "text-red-500/70" };
  }
  if (data.velocity === "fast") {
    return { text: `Meeting ${data.meetingNumber}. Moving faster than typical. Validate before committing.`, colorClass: "text-blue-500/70" };
  }
  return { text: `Meeting ${data.meetingNumber}. Building on previous conversation(s).`, colorClass: "text-forskale-teal/70" };
}

export function getSectionBadge(data: MeetingSequenceData): { text: string; classes: string } {
  if (data.strategyMode === "FIRST_INTERACTION") {
    return { text: "predicted", classes: "bg-amber-500/10 text-amber-600 border border-amber-500/20" };
  }
  if (data.velocity === "stalled") {
    return { text: "needs review", classes: "bg-red-500/10 text-red-600 border border-red-500/20" };
  }
  if (data.velocity === "fast") {
    return { text: "validate first", classes: "bg-blue-500/10 text-blue-600 border border-blue-500/20" };
  }
  return { text: "from meeting", classes: "bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/20" };
}
