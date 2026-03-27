import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const DEAL_STAGES = [
  "Discovery",
  "Qualification",
  "Demo",
  "Proposal",
  "Negotiation",
  "Verbal Commit",
  "Closed Won",
  "Post-Sale",
] as const;

type DealStage = (typeof DEAL_STAGES)[number];

interface DealStageIndicatorProps {
  stageName: DealStage;
  percentage: number;
  isAnimated?: boolean;
  size?: number;
}

const getStageColor = (pct: number): string => {
  if (pct <= 25) return "hsl(0, 84%, 60%)";      // Red
  if (pct <= 50) return "hsl(38, 92%, 50%)";      // Amber
  if (pct <= 75) return "hsl(174, 56%, 55%)";     // Teal
  return "hsl(142, 71%, 45%)";                     // Green
};

export function DealStageIndicator({
  stageName,
  percentage,
  isAnimated = true,
  size = 120,
}: DealStageIndicatorProps) {
  const [animatedPct, setAnimatedPct] = useState(isAnimated ? 0 : percentage);

  useEffect(() => {
    if (!isAnimated) {
      setAnimatedPct(percentage);
      return;
    }
    setAnimatedPct(0);
    const timeout = setTimeout(() => setAnimatedPct(percentage), 50);
    return () => clearTimeout(timeout);
  }, [percentage, isAnimated]);

  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const color = getStageColor(percentage);
  const isComplete = percentage >= 100;
  const gradientId = `stage-grad-${stageName.replace(/\s/g, "")}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted) / 0.3)"
            strokeWidth={strokeWidth}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--forskale-green))" />
              <stop offset="50%" stopColor="hsl(var(--forskale-teal))" />
              <stop offset="100%" stopColor="hsl(var(--forskale-blue))" />
            </linearGradient>
          </defs>
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-[800ms] ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="max-w-[70px] truncate text-center text-[11px] font-bold text-foreground leading-tight">
            {stageName}
          </span>
          {isComplete ? (
            <Check className="mt-0.5 h-5 w-5 text-forskale-green" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Neuroscience coaching data ----
export interface NeuroInsight {
  tips: string[];
  bias: string;
}

export const STAGE_NEURO_MAP: Record<string, NeuroInsight> = {
  Discovery: {
    tips: ["Use open-ended questions to uncover latent needs", "Mirror their language to build rapport"],
    bias: "Confirmation bias: validate their problems, don't project yours",
  },
  Qualification: {
    tips: ["Quantify pain points with metrics", "Identify the economic buyer early"],
    bias: "Anchoring effect: first numbers shared set the frame",
  },
  Demo: {
    tips: ["Lead with outcomes, not features", "Limit to 3 key value props"],
    bias: "Choice overload: fewer options increase decision confidence",
  },
  Proposal: {
    tips: ["Frame as ROI, not cost", "Include 3 tiers to guide choice"],
    bias: "Loss aversion: emphasize missed opportunities over gains",
  },
  Negotiation: {
    tips: ["Anchor high, concede slowly", "Trade concessions — never give free"],
    bias: "Reciprocity principle: every give should trigger a take",
  },
  "Verbal Commit": {
    tips: ["Confirm timeline and next steps in writing", "Reduce perceived risk with guarantees"],
    bias: "Status quo bias: make switching feel safe and easy",
  },
  "Closed Won": {
    tips: ["Set clear onboarding expectations", "Introduce CS team within 24h"],
    bias: "Peak-end rule: end the sale on a high note",
  },
  "Post-Sale": {
    tips: ["Schedule QBR within first 30 days", "Ask for referrals after first value milestone"],
    bias: "Endowment effect: they now own it — reinforce that pride",
  },
};

// Mapping from meeting type → deal stage + percentage (mock)
export function getDealStageForMeeting(meetingId: string): { stage: DealStage; percentage: number; lastUpdated: string } {
  const map: Record<string, { stage: DealStage; percentage: number; lastUpdated: string }> = {
    "1": { stage: "Proposal", percentage: 62, lastUpdated: "Mar 10, 2026" },
    "2": { stage: "Discovery", percentage: 15, lastUpdated: "Mar 8, 2026" },
    "3": { stage: "Demo", percentage: 37, lastUpdated: "Mar 6, 2026" },
    "4": { stage: "Negotiation", percentage: 78, lastUpdated: "Mar 5, 2026" },
    "5": { stage: "Qualification", percentage: 28, lastUpdated: "Mar 9, 2026" },
    "6": { stage: "Discovery", percentage: 8, lastUpdated: "Mar 11, 2026" },
    "7": { stage: "Closed Won", percentage: 100, lastUpdated: "Mar 7, 2026" },
    "8": { stage: "Demo", percentage: 45, lastUpdated: "Mar 4, 2026" },
    "9": { stage: "Discovery", percentage: 12, lastUpdated: "Mar 3, 2026" },
    "10": { stage: "Post-Sale", percentage: 100, lastUpdated: "Mar 1, 2026" },
    "11": { stage: "Verbal Commit", percentage: 90, lastUpdated: "Feb 28, 2026" },
    "12": { stage: "Proposal", percentage: 55, lastUpdated: "Mar 2, 2026" },
    "13": { stage: "Discovery", percentage: 0, lastUpdated: "N/A" },
    "14": { stage: "Negotiation", percentage: 72, lastUpdated: "Mar 7, 2026" },
    "15": { stage: "Qualification", percentage: 22, lastUpdated: "Mar 5, 2026" },
    "16": { stage: "Demo", percentage: 40, lastUpdated: "Mar 6, 2026" },
  };
  return map[meetingId] || { stage: "Discovery" as DealStage, percentage: 0, lastUpdated: "TBD" };
}
