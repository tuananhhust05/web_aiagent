import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Bell, Calendar, TrendingUp, ChevronDown, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  deal: CompanyDeal;
}

const priorityBadge: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive',
  High: 'bg-orange-500/10 text-orange-500',
  Medium: 'bg-[hsl(var(--badge-cyan-bg))] text-[hsl(var(--forskale-cyan))]',
  Low: 'bg-muted text-muted-foreground',
};

const priorityDot: Record<string, string> = {
  Critical: 'bg-destructive',
  High: 'bg-orange-500',
  Medium: 'bg-[hsl(var(--forskale-cyan))]',
  Low: 'bg-muted-foreground',
};

type ActionItem = CompanyDeal['actionItems'][number];

function ActionRow({ item }: { item: ActionItem }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!(item.details?.length || item.owner || item.deadline || item.actionReadyLink || item.frictionRemoved);

  return (
    <div className="rounded-md border border-border/60">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2.5 p-2 text-left hover:bg-muted/40 transition-colors"
      >
        <span className={cn("flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold mt-0.5", priorityDot[item.priority])}>
          {item.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground">{item.title}</span>
            <span className={cn("inline-flex items-center px-1.5 py-px rounded text-[9px] font-medium", priorityBadge[item.priority])}>
              {item.priority}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-[hsl(var(--forskale-teal))] font-medium ml-auto">
              <TrendingUp className="h-2.5 w-2.5" />
              {item.interestImpact}
            </span>
            {hasDetails && (
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
            )}
          </div>
        </div>
      </button>

      {open && hasDetails && (
        <div className="px-2 pb-2.5 pl-9 space-y-1">
          {item.frictionRemoved && (
            <p className="text-[10px] text-muted-foreground">{item.frictionRemoved}</p>
          )}
          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
            {item.owner && <span>{item.owner}</span>}
            {item.deadline && (
              <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" /> {item.deadline}</span>
            )}
          </div>
          {item.details && (
            <div className="space-y-px pt-0.5">
              {item.details.map((d, i) => (
                <p key={i} className="text-[10px] text-muted-foreground">☐ {d}</p>
              ))}
            </div>
          )}
          {item.actionReadyLink && (
            <button className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] hover:bg-[hsl(var(--forskale-teal)/0.15)] transition-colors">
              <ArrowRight className="h-2.5 w-2.5" />
              Action Ready → "{item.actionReadyLink}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StrategyActionItems({ deal }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  if (deal.actionItems.length === 0) return null;

  const critical = deal.actionItems.filter(a => a.priority === 'Critical');
  const high = deal.actionItems.filter(a => a.priority === 'High');
  const rest = deal.actionItems.filter(a => a.priority !== 'Critical' && a.priority !== 'High');

  // Move to the next 10% cognitive stage band, not jump straight to 80/90
  const nextTarget = Math.min(100, (Math.floor(deal.interestLevel / 10) + 1) * 10);

  const renderGroup = (title: string, items: ActionItem[], borderColor: string) => {
    if (items.length === 0) return null;
    return (
      <div className={cn("rounded-lg border-2 p-2.5 mb-2", borderColor)}>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
        <div className="space-y-1.5">
          {items.map((item) => <ActionRow key={item.id} item={item} />)}
        </div>
      </div>
    );
  };

  const totalCount = deal.actionItems.length;
  const criticalCount = critical.length;
  const hasCritical = criticalCount > 0;

  return (
    <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className={cn(
          "w-full flex items-center gap-2 p-4 text-left transition-colors",
          hasCritical
            ? "bg-gradient-to-r from-[hsl(var(--forskale-teal)/0.08)] via-transparent to-transparent hover:from-[hsl(var(--forskale-teal)/0.12)]"
            : "hover:bg-muted/40"
        )}
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          {hasCritical && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--forskale-teal))] opacity-60 animate-ping" />
          )}
          <Bell className={cn("relative h-4 w-4", hasCritical ? "text-[hsl(var(--forskale-teal))]" : "text-muted-foreground")} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-foreground">
              {t('actions.title')}: {deal.interestLevel}% → {nextTarget}%+
            </h2>
            <span className="inline-flex items-center px-1.5 py-px rounded-full text-[10px] font-bold bg-[hsl(var(--forskale-teal)/0.12)] text-[hsl(var(--forskale-teal))]">
              {totalCount}
            </span>
            {hasCritical && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
                </span>
                {criticalCount} critical
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t('actions.subtitle')}
            </p>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[11px] text-muted-foreground mb-3">
            {t('actions.subtitle')}
          </p>

          {renderGroup(t('actions.critical'), critical, 'border-destructive/30')}
          {renderGroup(t('actions.high'), high, 'border-orange-500/30')}
          {renderGroup(t('actions.medium'), rest, 'border-border')}

          <div className="mt-3 flex justify-center">
            <button
              onClick={() => navigate('/actions-ready')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold shadow-lg shadow-[hsl(var(--forskale-teal)/0.35)] bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-cyan))] hover:shadow-xl hover:shadow-[hsl(var(--forskale-teal)/0.5)] hover:scale-[1.02] transition-all"
            >
              <CheckSquare className="h-4 w-4" />
              Open Actions Ready
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
