import { useState } from "react";
import {
  ChevronDown, ChevronUp, Users, MessageSquare, FileText,
  CheckCircle2, XCircle, AlertTriangle, Clock, Shield, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";
import { getStageTextColor } from "@/lib/stageColors";
import { useLanguage } from '@/components/strategy/LanguageContext';

interface Props {
  deal: CompanyDeal;
}

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-4 px-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-5 px-1">{children}</div>}
    </div>
  );
}

const stakeholderColors: Record<string, string> = {
  green: 'bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]',
  cyan: 'bg-[hsl(var(--badge-cyan-bg))] text-[hsl(var(--forskale-cyan))]',
  orange: 'bg-orange-500/10 text-orange-500',
  red: 'bg-destructive/10 text-destructive',
};

const objectionStatusColors: Record<string, string> = {
  Resolved: 'text-[hsl(var(--status-great))]',
  'Partially Resolved': 'text-orange-500',
  Open: 'text-destructive',
};

const commitmentStatusColors: Record<string, string> = {
  Completed: 'text-[hsl(var(--status-great))]',
  Pending: 'text-orange-500',
  Overdue: 'text-destructive',
};

export default function DealContext({ deal }: Props) {
  const { t } = useLanguage();
  const cogState = getCognitiveState(deal.interestLevel);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: t('context.cognitiveState'), value: cogState.name, colorClass: getStageTextColor(deal.interestLevel) },
          { label: t('context.interestLevel'), value: `${deal.interestLevel}%`, colorClass: getStageTextColor(deal.interestLevel) },
          { label: t('context.daysAtStage'), value: `${deal.daysAtCurrentLevel} ${t('context.days')}`, colorClass: deal.daysAtCurrentLevel > 7 ? 'text-orange-500' : 'text-foreground' },
          { label: t('context.velocity'), value: `+${deal.interestVelocity}%/day`, colorClass: deal.interestVelocity >= 1 ? 'text-[hsl(var(--status-great))]' : 'text-orange-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-muted/50 p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-sm font-bold", s.colorClass)}>{s.value}</p>
          </div>
        ))}
      </div>


      <Section title={t('context.stakeholders')} icon={Users}>
        <div className="space-y-3">
          {deal.stakeholders.map((s, idx) => (
            <div key={idx} className={cn("rounded-lg border p-4", s.priority ? "border-destructive/30 bg-destructive/5" : "border-border bg-background")}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">— {s.title}</span>
                <span className={cn("ml-auto inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium", stakeholderColors[s.statusColor])}>
                  {s.status}
                </span>
                {s.priority && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.role} — {s.notes}</p>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}

