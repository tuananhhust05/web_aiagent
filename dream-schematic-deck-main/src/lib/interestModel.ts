export interface InterestBand {
  cognitiveState: string;
  rangeLabel: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  psychology: string;
}

const bands: { min: number; max: number; band: InterestBand }[] = [
  { min: 90, max: 100, band: { cognitiveState: "Decision", rangeLabel: "90-100%", textClass: "text-[#639922]", bgClass: "bg-[#EAF3DE]", borderClass: "border-[rgba(59,109,17,0.4)]", psychology: "Decision made" } },
  { min: 80, max: 89, band: { cognitiveState: "Hard Commitment", rangeLabel: "80-90%", textClass: "text-[#639922]", bgClass: "bg-[#EAF3DE]", borderClass: "border-[rgba(59,109,17,0.4)]", psychology: "Ready to commit" } },
  { min: 70, max: 79, band: { cognitiveState: "Validation", rangeLabel: "70-80%", textClass: "text-[#1D9E75]", bgClass: "bg-[#E1F5EE]", borderClass: "border-[rgba(15,110,86,0.4)]", psychology: "Validating fit and consensus" } },
  { min: 60, max: 69, band: { cognitiveState: "Evaluation", rangeLabel: "60-70%", textClass: "text-[#1D9E75]", bgClass: "bg-[#E1F5EE]", borderClass: "border-[rgba(15,110,86,0.4)]", psychology: "They're comparing options" } },
  { min: 50, max: 59, band: { cognitiveState: "Trust", rangeLabel: "50-60%", textClass: "text-[#1D9E75]", bgClass: "bg-[#E1F5EE]", borderClass: "border-[rgba(15,110,86,0.4)]", psychology: "They trust your solution" } },
  { min: 40, max: 49, band: { cognitiveState: "Problem Recognition", rangeLabel: "40-50%", textClass: "text-[#BA7517]", bgClass: "bg-[#FAEEDA]", borderClass: "border-[rgba(186,117,23,0.4)]", psychology: "They see the problem" } },
  { min: 30, max: 39, band: { cognitiveState: "Interest", rangeLabel: "30-40%", textClass: "text-[#BA7517]", bgClass: "bg-[#FAEEDA]", borderClass: "border-[rgba(186,117,23,0.4)]", psychology: "They're engaged" } },
  { min: 20, max: 29, band: { cognitiveState: "Curiosity", rangeLabel: "20-30%", textClass: "text-[#E97B1E]", bgClass: "bg-[#FEF0E0]", borderClass: "border-[rgba(233,123,30,0.4)]", psychology: "They want to know more" } },
  { min: 10, max: 19, band: { cognitiveState: "Attention", rangeLabel: "10-20%", textClass: "text-[#EF4444]", bgClass: "bg-red-500/10", borderClass: "border-red-500/40", psychology: "They notice you exist" } },
  { min: 0, max: 9, band: { cognitiveState: "Lost", rangeLabel: "0-10%", textClass: "text-[#EF4444]", bgClass: "bg-red-500/10", borderClass: "border-red-500/40", psychology: "Deal lost" } },
];

export function getBandByPct(pct: number): InterestBand {
  for (const b of bands) {
    if (pct >= b.min && pct <= b.max) return b.band;
  }
  return bands[bands.length - 1].band;
}

export const STAGE_TO_PCT: Record<string, number> = {
  "closed-lost": 5,
  intro: 25,
  discovery: 45,
  demo: 60,
  proposal: 75,
  negotiation: 85,
  "closed-won": 95,
};
