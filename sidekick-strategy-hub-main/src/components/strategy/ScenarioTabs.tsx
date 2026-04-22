import { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Flag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { scenarioGuides } from '@/lib/dealNarrative';

interface Props {
  defaultState: string;
}

const tabOrder = [
  'Attention',
  'Curiosity',
  'Interest',
  'Problem Recognition',
  'Trust',
  'Evaluation',
  'Validation',
  'Commitment Intent',
  'Decision',
];

export default function ScenarioTabs({ defaultState }: Props) {
  const initial = scenarioGuides[defaultState] ? defaultState : 'Validation';
  const [active, setActive] = useState(initial);
  const guide = scenarioGuides[active];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground font-bold">
          Use-Case Scenarios
        </span>
        <span className="text-[10px] text-muted-foreground">Active: {defaultState}</span>
      </div>

      <div className="flex gap-1 overflow-x-auto atlas-scrollbar px-3 py-2 border-b border-border">
        {tabOrder.map(s => {
          const isActive = s === active;
          const isCurrent = s === defaultState;
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-[hsl(var(--forskale-teal))] text-white'
                  : isCurrent
                    ? 'bg-[hsl(var(--forskale-teal)/0.12)] text-[hsl(var(--forskale-teal))]'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{guide.whenItApplies}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Section icon={CheckCircle2} title="Do this" tone="text-[hsl(var(--status-great))]" items={guide.doThis} />
          <Section icon={XCircle} title="Avoid" tone="text-destructive" items={guide.avoid} />
          <Section icon={AlertTriangle} title="Common mistakes" tone="text-orange-500" items={guide.commonMistakes} />
          <Section icon={Sparkles} title="Positive signals" tone="text-[hsl(var(--forskale-cyan))]" items={guide.positiveSignals} />
        </div>

        <div className="rounded-lg border border-[hsl(var(--forskale-teal)/0.25)] bg-[hsl(var(--forskale-teal)/0.06)] p-3 flex gap-2">
          <Flag className="h-4 w-4 text-[hsl(var(--forskale-teal))] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[hsl(var(--forskale-teal))] mb-0.5">
              Next milestone
            </p>
            <p className="text-sm text-foreground">{guide.nextMilestone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  tone,
  items,
}: {
  icon: any;
  title: string;
  tone: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
            <span className={tone}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
