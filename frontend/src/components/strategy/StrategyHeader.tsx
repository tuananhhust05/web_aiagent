import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal, DealStatus } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";
import { getStageTextColor } from "@/lib/stageColors";

interface StrategyHeaderProps {
  deal: CompanyDeal;
  onBack: () => void;
}

const statusConfig: Record<DealStatus, { label: string; badge: string; headerAccent: string }> = {
  ongoing_negotiation: {
    label: 'Active',
    badge: 'bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal)/0.2)]',
    headerAccent: 'border-b-[hsl(var(--forskale-teal)/0.3)]',
  },
  first_meeting: {
    label: 'New Opportunity',
    badge: 'bg-[hsl(var(--badge-blue-bg))] text-[hsl(var(--forskale-blue))] border-[hsl(var(--forskale-blue)/0.2)]',
    headerAccent: 'border-b-[hsl(var(--forskale-blue)/0.3)]',
  },
  closed_won: {
    label: 'Closed Won',
    badge: 'bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))] border-[hsl(var(--status-great)/0.2)]',
    headerAccent: 'border-b-[hsl(var(--status-great)/0.3)]',
  },
  closed_lost: {
    label: 'Closed Lost',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
    headerAccent: 'border-b-destructive/30',
  },
};

export default function StrategyHeader({ deal, onBack }: StrategyHeaderProps) {
  const config = statusConfig[deal.status];
  const showInterest = deal.status === 'ongoing_negotiation' || deal.status === 'first_meeting';
  const cogState = getCognitiveState(deal.interestLevel);

  return (
    <div className={cn("px-6 pt-4 pb-3 border-b-2 bg-card", config.headerAccent)}>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-200 mb-2"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Back</span>
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {deal.company}
        </h1>
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", config.badge)}>
          {config.label}
        </span>
        {showInterest && (
          <span className={cn("text-base font-bold", getStageTextColor(deal.interestLevel))}>
            {cogState.name} — {deal.interestLevel}%
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
        <span>{deal.industry}</span>
        <span className="text-border">•</span>
        <span>{deal.dealValue}</span>
        <span className="text-border">•</span>
        <span>{deal.lastContact}d ago</span>
        <span className="text-border">•</span>
        <span>{deal.primaryContact}</span>
        {showInterest && (
          <>
            <span className="text-border">•</span>
            <span>CRM: {deal.crmStage}</span>
          </>
        )}
      </div>
    </div>
  );
}

