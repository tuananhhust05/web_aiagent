export interface InterestMappingResult {
  cognitiveState: string;
  crmStage: string;
  psychology: string;
  color: "red" | "orange" | "amber" | "teal" | "green";
}

export function getInterestMapping(score: number): InterestMappingResult {
  if (score === 0) {
    return { cognitiveState: "Lost", crmStage: "Closed Lost", psychology: "Deal lost", color: "red" };
  }
  if (score <= 20) {
    return { cognitiveState: "Attention", crmStage: "Discovery", psychology: "They notice you exist", color: "orange" };
  }
  if (score <= 30) {
    return { cognitiveState: "Curiosity", crmStage: "Qualified Lead", psychology: "They want to know more", color: "orange" };
  }
  if (score <= 40) {
    return { cognitiveState: "Interest", crmStage: "Discovery", psychology: "They're engaged", color: "amber" };
  }
  if (score <= 50) {
    return { cognitiveState: "Problem Recognition", crmStage: "Demo", psychology: "They see the problem", color: "amber" };
  }
  if (score <= 60) {
    return { cognitiveState: "Trust", crmStage: "Demo", psychology: "They trust your solution", color: "teal" };
  }
  if (score <= 70) {
    return { cognitiveState: "Evaluation", crmStage: "Proposal", psychology: "They're comparing options", color: "teal" };
  }
  if (score <= 80) {
    return { cognitiveState: "Validation", crmStage: "Negotiation", psychology: "Validating fit and consensus", color: "teal" };
  }
  if (score <= 90) {
    return { cognitiveState: "Hard Commitment", crmStage: "Closing", psychology: "Ready to commit", color: "green" };
  }
  return { cognitiveState: "Decision", crmStage: "Closed Won", psychology: "Decision made", color: "green" };
}

export const INTEREST_COLOR_CLASSES = {
  badge: {
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    amber: "bg-amber-100 text-amber-700",
    teal: "bg-teal-100 text-teal-700",
    green: "bg-green-100 text-green-700",
  },
  dot: {
    red: "bg-red-400",
    orange: "bg-orange-400",
    amber: "bg-amber-400",
    teal: "bg-teal-400",
    green: "bg-green-400",
  },
  box: {
    red: "bg-red-50 text-red-600 border-red-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    green: "bg-green-50 text-green-600 border-green-100",
  },
} as const;
