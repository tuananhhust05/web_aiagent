import { Compass, ShieldAlert, Route, PlayCircle, Clock, TrendingUp } from 'lucide-react';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { buildStrategyFramework, getWhyForAction } from '@/lib/dealNarrative';

interface Props {
  deal: CompanyDeal;
}

const rows = [
  { key: 'situation', label: 'Current Situation', icon: Compass, tone: 'text-foreground' },
  { key: 'friction', label: 'Friction / Blocker', icon: ShieldAlert, tone: 'text-destructive' },
  { key: 'approach', label: 'Strategic Approach', icon: Route, tone: 'text-[hsl(var(--forskale-cyan))]' },
  { key: 'action', label: 'Recommended Action', icon: PlayCircle, tone: 'text-[hsl(var(--forskale-teal))]' },
  { key: 'timing', label: 'Timing', icon: Clock, tone: 'text-orange-500' },
  { key: 'expectedResult', label: 'Expected Result', icon: TrendingUp, tone: 'text-[hsl(var(--status-great))]' },
] as const;

export default function StrategyFramework({ deal }: Props) {
  const f = buildStrategyFramework(deal);
  const why = getWhyForAction(deal, f.action);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground font-bold">
          Situation → Friction → Move → Timing
        </span>
      </div>
      <div className="divide-y divide-border">
        {rows.map(r => {
          const Icon = r.icon;
          const value = f[r.key as keyof typeof f] as string;
          return (
            <div key={r.key} className="px-4 py-3 flex gap-3">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${r.tone}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                  {r.label}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
                {r.key === 'action' && why && (
                  <p className="text-[11px] text-muted-foreground italic mt-1">
                    <span className="font-semibold not-italic">Why?</span> {why}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
