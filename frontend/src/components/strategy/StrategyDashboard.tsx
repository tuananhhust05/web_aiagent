import { useState, useCallback } from "react";
import { Search, ArrowUpDown, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { companyDeals, type DealStatus, getCognitiveState } from "@/data/mockStrategyData";
import { getStageTextColor, getStageLeftBorderColor } from "@/lib/stageColors";

interface Props {
  onSelectDeal: (id: string) => void;
  onRequestStrategy: (id: string) => void;
}

const statusFilters: { label: string; value: DealStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'ongoing_negotiation' },
  { label: 'New', value: 'first_meeting' },
  { label: 'Won', value: 'closed_won' },
  { label: 'Lost', value: 'closed_lost' },
];

export default function StrategyDashboard({ onSelectDeal, onRequestStrategy }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'interest' | 'velocity'>('interest');

  const filtered = companyDeals
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => d.company.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'interest') return b.interestLevel - a.interestLevel;
      return b.interestVelocity - a.interestVelocity;
    });

  const handleStrategy = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRequestStrategy(id);
  }, [onRequestStrategy]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-border bg-card">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Strategy Command Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">AI-powered deal intelligence — click "Give me strategy" to activate</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-2.5 border-b border-border bg-card/50 flex items-center gap-3">
        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                statusFilter === f.value
                  ? "bg-[hsl(var(--forskale-teal))] text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortBy(sortBy === 'interest' ? 'velocity' : 'interest')}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground rounded-md border border-border transition-colors"
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === 'interest' ? 'Interest' : 'Velocity'}
        </button>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto atlas-scrollbar p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-w-[1200px] mx-auto">
          {filtered.map((deal) => {
            const cogState = getCognitiveState(deal.interestLevel);
            const isActive = deal.status === 'ongoing_negotiation' || deal.status === 'first_meeting';
            return (
              <div
                key={deal.id}
                className={cn(
                  "group text-left rounded-lg border border-border bg-card transition-all duration-200 border-l-[3px] overflow-hidden",
                  "hover:shadow-[0_4px_20px_-4px_hsl(var(--forskale-teal)/0.15)] hover:-translate-y-0.5 hover:border-[hsl(var(--forskale-teal)/0.3)]",
                  getStageLeftBorderColor(deal.interestLevel),
                )}
              >
                <button
                  onClick={() => onSelectDeal(deal.id)}
                  className="w-full text-left p-4"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2.5">
                    <span className="text-sm font-bold text-foreground leading-tight">{deal.company}</span>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn("text-sm font-bold leading-tight", getStageTextColor(deal.interestLevel))}>
                        {cogState.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{deal.interestLevel}%</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                      {deal.industry}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-foreground">
                      {deal.dealValue}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium",
                      deal.interestVelocity >= 1
                        ? "bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]"
                        : "bg-orange-500/10 text-orange-500"
                    )}>
                      <TrendingUp className="h-2.5 w-2.5" />
                      +{deal.interestVelocity}%/d
                    </span>
                    {deal.interestChange !== 0 && (
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                        deal.interestChange > 0
                          ? "bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]"
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {deal.interestChange > 0 ? '+' : ''}{deal.interestChange}%
                      </span>
                    )}
                  </div>

                  {/* Stakeholders */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {deal.stakeholderStatus.map((s, i) => (
                      <span key={i} className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium",
                        s.met ? 'bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]' : 'bg-destructive/10 text-destructive'
                      )}>
                        {s.label} {s.met ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>

                  {/* Next action */}
                  <div className="text-[11px] text-muted-foreground">
                    <span className="text-foreground font-medium">{deal.nextAction}</span>
                  </div>
                </button>

                {/* CTA bar */}
                {isActive && (
                  <div className="px-4 pb-3 pt-0">
                    <button
                      onClick={(e) => handleStrategy(e, deal.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-cyan))] text-white text-xs font-semibold hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-[1.02] transition-all duration-200"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Give me strategy
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

