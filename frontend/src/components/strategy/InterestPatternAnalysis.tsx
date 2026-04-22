import { cn } from "@/lib/utils";
import type { InterestPattern } from "@/data/mockStrategyData";

interface Props {
  patterns: InterestPattern[];
  interestLevel: number;
  interestVelocity: number;
}

export default function InterestPatternAnalysis({ patterns, interestLevel, interestVelocity }: Props) {
  if (patterns.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-base font-bold text-foreground mb-1">Interest Pattern Analysis</h2>
      <p className="text-xs text-muted-foreground mb-4">How this deal compares to similar wins</p>

      {/* Velocity benchmark */}
      <div className="rounded-lg bg-muted/50 p-3 mb-4 flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Your typical velocity: <span className="text-foreground font-medium">+1-1.5%/day</span></span>
        <span className="text-muted-foreground">This deal: <span className={cn("font-medium", interestVelocity >= 1 ? "text-[hsl(var(--status-great))]" : "text-orange-500")}>+{interestVelocity}%/day</span></span>
        {interestLevel < 90 && (
          <span className="text-muted-foreground">
            Est. to 90%: ~{Math.ceil((90 - interestLevel) / Math.max(0.1, interestVelocity))} days
          </span>
        )}
      </div>

      {/* Pattern comparisons */}
      <div className="space-y-3">
        {patterns.map((p, i) => (
          <div key={i} className="rounded-lg border border-border p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">{p.company}</span>
              <span className="text-[10px] text-muted-foreground">{p.comparison} • {p.timeline}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1"><span className="font-medium">Pattern:</span> {p.pattern}</p>
            <p className="text-[10px] text-muted-foreground mb-1"><span className="font-medium">Lesson:</span> {p.lesson}</p>
            <div className="rounded bg-[hsl(var(--forskale-teal)/0.05)] border border-[hsl(var(--forskale-teal)/0.15)] p-2 mt-2">
              <p className="text-[10px] text-foreground">
                <span className="font-medium text-[hsl(var(--forskale-teal))]">Apply to this deal: </span>{p.application}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

