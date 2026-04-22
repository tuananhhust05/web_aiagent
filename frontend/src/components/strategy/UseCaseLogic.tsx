import { useMemo, useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Shield, Sparkles, Lightbulb, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { SCENARIOS, getScenarioForInterestLevel } from './useCaseScenarios';

interface Props {
  deal: CompanyDeal;
}

export default function UseCaseLogic({ deal }: Props) {
  const defaultId = useMemo(
    () => getScenarioForInterestLevel(deal.interestLevel).id,
    [deal.interestLevel],
  );
  const [activeId, setActiveId] = useState(defaultId);
  const [animKey, setAnimKey] = useState(0);

  const active = useMemo(
    () => SCENARIOS.find(s => s.id === activeId) ?? SCENARIOS[0],
    [activeId],
  );
  const headline = active.headline(deal);
  const isCurrent = active.id === defaultId;

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    setAnimKey(k => k + 1);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2 mb-0.5">
          <Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Use-Case Logic</h4>
        </div>
        <p className="text-[11px] text-muted-foreground">
          See the reasoning framework behind the current recommendation
        </p>
      </div>

      {/* Dynamic personalization line (changes per scenario) */}
      <div key={`head-${animKey}`} className="px-4 pt-4 pb-2 animate-fade-in">
        <p className="text-[15px] leading-snug text-foreground font-medium">{headline}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground mt-1">{active.subline}</p>
      </div>

      {/* Scenario buttons */}
      <div className="flex gap-1.5 overflow-x-auto atlas-scrollbar px-4 py-3 border-b border-border">
        {SCENARIOS.map(s => {
          const isActive = s.id === activeId;
          const isDefault = s.id === defaultId;
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              title={`${s.code}: ${s.title} (${s.range})${isDefault ? ' — current state' : ''}`}
              className={cn(
                'relative shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border',
                isActive
                  ? 'bg-[hsl(var(--forskale-teal))] text-white border-[hsl(var(--forskale-teal))] shadow-md shadow-[hsl(var(--forskale-teal)/0.35)] scale-[1.04]'
                  : isDefault
                    ? 'bg-[hsl(var(--forskale-teal)/0.08)] text-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal)/0.30)] hover:bg-[hsl(var(--forskale-teal)/0.14)]'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-[hsl(var(--forskale-teal)/0.10)] hover:text-[hsl(var(--forskale-teal))]',
              )}
            >
              {isActive && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-70 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              )}
              {s.id}
            </button>
          );
        })}
      </div>

      {/* Dynamic scenario content */}
      <div key={`body-${animKey}`} className="p-4 space-y-3 animate-fade-in">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-[0.22em] text-[hsl(var(--forskale-teal))] uppercase">
            {active.code}
          </span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] font-semibold text-foreground">
            {active.title} <span className="text-muted-foreground">({active.range})</span>
          </span>
          {isCurrent && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[hsl(var(--forskale-teal)/0.12)] text-[hsl(var(--forskale-teal))] border border-[hsl(var(--forskale-teal)/0.30)]">
              Current
            </span>
          )}
        </div>

        <Field icon={Eye} tone="text-muted-foreground" label="When this applies">
          <p className="text-sm text-foreground leading-relaxed">{active.whenApplies}</p>
        </Field>

        <Field icon={Target} tone="text-[hsl(var(--forskale-teal))]" label="Your strategic goal">
          <p className="text-sm text-foreground leading-relaxed">{active.goal}</p>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ListField
            icon={AlertTriangle}
            tone="text-destructive"
            label="Common wrong moves"
            items={active.wrongMoves}
          />
          <ListField
            icon={Sparkles}
            tone="text-[hsl(var(--forskale-cyan))]"
            label="AI-recommended approach"
            items={active.approach}
          />
          <ListField
            icon={Shield}
            tone="text-amber-500"
            label="Active psychological guardrails"
            items={active.guardrails}
          />
          <Field icon={CheckCircle2} tone="text-[hsl(var(--status-great))]" label="Success signal to watch for">
            <p className="text-sm text-foreground leading-relaxed">{active.successSignal}</p>
          </Field>
        </div>
      </div>
    </div>
  );
}

interface FieldBaseProps {
  icon: React.ElementType;
  tone: string;
  label: string;
}

function Field({ icon: Icon, tone, label, children }: FieldBaseProps & { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ListField({ icon: Icon, tone, label, items }: FieldBaseProps & { items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('h-3.5 w-3.5', tone)} />
        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">{label}</span>
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

