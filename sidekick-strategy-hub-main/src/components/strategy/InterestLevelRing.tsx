import { cn } from "@/lib/utils";
import { getCognitiveState, COGNITIVE_STATES } from "@/data/mockStrategyData";
import { getStageTextColor, getStageStrokeColor, getStageBgColor } from "@/lib/stageColors";

interface Props {
  interestLevel: number;
  previousLevel: number;
  interestChange: number;
  daysAtCurrentLevel: number;
  estimatedClose: string;
  lastContact: number;
  crmStage: string;
}

export default function InterestLevelRing({ interestLevel, previousLevel, interestChange, daysAtCurrentLevel, estimatedClose, lastContact, crmStage }: Props) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (interestLevel / 100) * circumference;
  const cogState = getCognitiveState(interestLevel);
  const prevState = getCognitiveState(previousLevel);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-start gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="45" fill="none" className="stroke-muted" strokeWidth="6" />
            <circle cx="60" cy="60" r="45" fill="none" className={getStageStrokeColor(interestLevel)} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getStageTextColor(interestLevel))}>{interestLevel}%</span>
            <span className="text-[9px] text-muted-foreground font-medium">{cogState.name}</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-foreground mb-0.5">Interest Level</h3>
          <p className={cn("text-xs font-medium mb-4", getStageTextColor(interestLevel))}>
            {cogState.description}
          </p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Previous:</span>
              <span className="text-foreground font-medium">{previousLevel}% ({prevState.name})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Change:</span>
              <span className={cn("font-medium", interestChange > 0 ? "text-[hsl(var(--status-great))]" : interestChange < 0 ? "text-destructive" : "text-muted-foreground")}>
                {interestChange > 0 ? '+' : ''}{interestChange}% in last 7 days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Days at level:</span>
              <span className={cn("font-medium", daysAtCurrentLevel > 7 ? "text-destructive" : "text-foreground")}>{daysAtCurrentLevel} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CRM mapping:</span>
              <span className="text-foreground font-medium">{crmStage} (for sync)</span>
            </div>
          </div>

          {/* Cognitive state progression — colored per stage */}
          <div className="flex items-center gap-0.5">
            {COGNITIVE_STATES.map((state) => {
              const isActive = interestLevel >= state.level;
              const isCurrent = state.level === Math.floor(interestLevel / 10) * 10;
              return (
                <div key={state.level} className="flex-1 flex flex-col items-center">
                  <div className={cn(
                    "w-full h-2 rounded-full transition-all",
                    isCurrent ? "ring-2 ring-offset-1 ring-offset-card ring-[hsl(var(--forskale-teal))]" : "",
                    isActive ? getStageBgColor(state.level) : "bg-muted",
                  )} />
                  <span className={cn(
                    "text-[7px] mt-1 leading-tight text-center",
                    isCurrent ? "text-foreground font-bold" : isActive ? "text-muted-foreground" : "text-muted-foreground/50",
                  )}>
                    {state.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>Est. close: {estimatedClose}</span>
            <span>{lastContact}d since last contact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
