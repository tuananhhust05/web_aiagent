import { useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";
import { getStageTextColor } from "@/lib/stageColors";
import { sortDealsByUrgency } from "@/lib/urgencyEngine";
import { useLanguage } from "@/contexts/LanguageContext";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import DealJourneyHoverCard from "./DealJourneyHoverCard";
import { getDealSituationLine, getUrgencyTier, urgencyBorder, urgencyDot } from "@/lib/dealNarrative";

interface Props {
  deals: CompanyDeal[];
  selectedId: string | null;
  onSelectDeal: (id: string) => void;
  sortMode: "urgency" | "interest" | "recent";
  onSortChange: (mode: "urgency" | "interest" | "recent") => void;
  highlightDealIds?: string[];
}

export default function DealCardRail({ deals, selectedId, onSelectDeal, sortMode, onSortChange, highlightDealIds }: Props) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);

  const sortOptions: { value: Props["sortMode"]; labelKey: string }[] = [
    { value: "urgency", labelKey: "rail.urgency" },
    { value: "interest", labelKey: "rail.interest" },
    { value: "recent", labelKey: "rail.recent" },
  ];

  const sorted = useMemo(() => {
    if (sortMode === "interest") return [...deals].sort((a, b) => b.interestLevel - a.interestLevel);
    if (sortMode === "urgency") return sortDealsByUrgency(deals);
    return [...deals].sort((a, b) => a.lastContact - b.lastContact);
  }, [deals, sortMode]);

  const highlightSet = useMemo(() => new Set(highlightDealIds || []), [highlightDealIds]);

  return (
    <div
      className={cn(
        "shrink-0 border-r border-border bg-card flex flex-col h-full relative",
        "transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-[88px]" : "w-[360px]",
      )}
    >
      {/* Floating toggle button — sits on the right border edge like the main sidebar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "absolute top-6 -right-3 z-30 flex h-6 w-6 items-center justify-center rounded-full",
          "bg-background border border-border shadow-md text-muted-foreground hover:text-foreground",
          "hover:border-[hsl(var(--forskale-teal)/0.5)] hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]",
          "transition-all duration-300",
        )}
        aria-label={collapsed ? "Expand deals rail" : "Collapse deals rail"}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-500", collapsed && "rotate-180")} />
      </button>

      {/* Header — fades in expanded mode */}
      <div
        className={cn(
          "px-4 py-3 border-b border-border transition-opacity duration-300 overflow-hidden",
          collapsed ? "opacity-0 pointer-events-none h-0 py-0 border-b-0" : "opacity-100",
        )}
      >
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">{t("rail.yourDeals")}</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            <Eye className="h-3 w-3" />
            Hover to see · click to strategize
          </span>
        </div>
        <div className="flex gap-1">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                sortMode === opt.value
                  ? "bg-[hsl(var(--forskale-teal))] text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto atlas-scrollbar">
        {sorted.map((deal, idx) => {
          const cogState = getCognitiveState(deal.interestLevel);
          const isSelected = selectedId === deal.id;
          const tier = getUrgencyTier(deal);
          const situation = getDealSituationLine(deal);
          const isHighlighted = highlightSet.has(deal.id);
          const meetingCount = deal.interestJourney.length;

          return (
            <HoverCard key={deal.id} openDelay={150} closeDelay={80}>
              <HoverCardTrigger asChild>
                <button
                  onClick={() => onSelectDeal(deal.id)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className={cn(
                    "group w-full text-left border-b border-border border-l-[3px] transition-all duration-300 hover:bg-muted/40 animate-fade-in",
                    collapsed ? "px-3 py-3.5" : "px-4 py-3 hover:pl-5",
                    isSelected
                      ? "bg-[hsl(var(--forskale-teal)/0.08)] border-l-[hsl(var(--forskale-teal))]"
                      : urgencyBorder[tier],
                    isHighlighted && "ring-1 ring-inset ring-[hsl(var(--forskale-cyan)/0.5)]",
                  )}
                >
                  {collapsed ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300",
                        isSelected
                          ? "bg-gradient-to-br from-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-cyan))] text-white shadow-[0_0_16px_hsl(var(--forskale-teal)/0.4)]"
                          : "bg-muted text-foreground group-hover:bg-[hsl(var(--forskale-teal)/0.1)] group-hover:scale-105",
                      )}>
                        {deal.company.charAt(0)}
                        <span className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card", urgencyDot[tier])} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground/90 truncate w-full text-center">
                        {deal.company.split(" ")[0]}
                      </span>
                      <span className={cn("text-[9px] font-bold", getStageTextColor(deal.interestLevel))}>
                        {deal.interestLevel}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", urgencyDot[tier])} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground truncate">{deal.company}</span>
                          <span className={cn("text-[10px] font-bold shrink-0", getStageTextColor(deal.interestLevel))}>
                            {cogState.name}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-snug mt-1 line-clamp-2 group-hover:text-foreground/80 transition-colors">
                          {situation}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/80">
                          <span>{deal.interestLevel}%</span>
                          <span>·</span>
                          <span>{meetingCount} meetings</span>
                          <span>·</span>
                          <span>{deal.daysAtCurrentLevel}d at stage</span>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" align="start" sideOffset={8} className="p-0 border-0 bg-transparent shadow-none w-auto">
                <DealJourneyHoverCard deal={deal} />
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}
