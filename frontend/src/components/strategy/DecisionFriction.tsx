import type { DecisionFriction as DecisionFrictionType, FrictionRoadmapWeek } from "@/data/mockStrategyData";

interface Props {
  friction: DecisionFrictionType[];
  roadmap: FrictionRoadmapWeek[];
  interestLevel: number;
  daysAtCurrentLevel: number;
}

const STAGE_BY_INTEREST = [
  { min: 0, max: 10, label: 'Cold Contact' },
  { min: 10, max: 20, label: 'Attention' },
  { min: 20, max: 30, label: 'Curiosity' },
  { min: 30, max: 40, label: 'Engagement' },
  { min: 40, max: 50, label: 'Problem Recognition' },
  { min: 50, max: 60, label: 'Trust' },
  { min: 60, max: 70, label: 'Evaluation' },
  { min: 70, max: 80, label: 'Validation' },
  { min: 80, max: 90, label: 'Hard Commitment' },
  { min: 90, max: 101, label: 'Decision' },
] as const;

function getStageLabel(interestLevel: number): string {
  return STAGE_BY_INTEREST.find((s) => interestLevel >= s.min && interestLevel < s.max)?.label ?? 'Validation';
}

export default function DecisionFriction({ friction, interestLevel, daysAtCurrentLevel }: Props) {
  if (friction.length === 0) return null;

  // Rule of One: pick the single highest-impact friction
  const levelRank = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
  const top = [...friction].sort((a, b) => {
    const rankDiff = (levelRank[b.frictionLevel] ?? 0) - (levelRank[a.frictionLevel] ?? 0);
    if (rankDiff !== 0) return rankDiff;
    return (b.blockingPercent ?? 0) - (a.blockingPercent ?? 0);
  })[0];

  const mainFriction = top.title;
  const whyItMatters = top.whyItMatters;
  const suggestedApproach = top.currentState || top.effectOnInterest;
  const recommendedAction = top.howToRemove?.[0] ?? "Schedule a focused conversation with the key stakeholder this week.";
  const timingLabel = top.timeline || "Within 2 days";
  const stageLabel = `${getStageLabel(interestLevel)} stage`;
  const daysStalled = daysAtCurrentLevel;

  return (
    <div className="rounded-xl border border-border border-l-4 border-l-destructive bg-card p-5 shadow-card space-y-4">
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[hsl(var(--status-great))]" />
        <span>{stageLabel} · Deal stalled for {daysStalled} days</span>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Main Friction</p>
        <p className="text-sm text-foreground font-medium">{mainFriction}</p>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Why It Matters</p>
        <p className="text-sm text-muted-foreground">{whyItMatters}</p>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Suggested Approach</p>
        <p className="text-sm text-muted-foreground">{suggestedApproach}</p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.05)] p-4">
        <p className="text-xs font-bold text-[hsl(var(--forskale-teal))] uppercase tracking-wider mb-2">⚡ Recommended Action</p>
        <p className="text-sm text-foreground font-medium">{recommendedAction}</p>
        <p className="text-xs text-[hsl(var(--forskale-teal))] font-medium mt-2">⏱ {timingLabel}</p>
        <button
          type="button"
          className="mt-3 w-full border border-[hsl(var(--forskale-teal))] text-[hsl(var(--forskale-teal))] hover:bg-[hsl(var(--forskale-teal)/0.08)] px-3 py-2 rounded-md text-xs font-medium transition-colors"
        >
          Add to Action Ready →
        </button>
      </div>
    </div>
  );
}

