import { useMemo, useState } from "react";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/strategy/LanguageContext";
import type { ParticipantEmailDeal } from "./types";

type EmailTier = "hot" | "warm" | "cold";

const tierBorder: Record<EmailTier, string> = {
  hot: "border-l-[hsl(var(--forskale-red))]",
  warm: "border-l-[hsl(var(--forskale-orange))]",
  cold: "border-l-[hsl(var(--forskale-blue))]",
};

const tierDot: Record<EmailTier, string> = {
  hot: "bg-[hsl(var(--forskale-red))]",
  warm: "bg-[hsl(var(--forskale-orange))]",
  cold: "bg-[hsl(var(--forskale-blue))]",
};

interface ParticipantEmailCardProps {
  deal: ParticipantEmailDeal;
  isSelected: boolean;
  onClick: () => void;
  collapsed: boolean;
  tier: EmailTier;
}

function ParticipantEmailCard({ deal, isSelected, onClick, collapsed, tier }: ParticipantEmailCardProps) {
  const companyDisplay = deal.company || deal.email.split("@")[1] || "Unknown";
  const emailDisplay = deal.name || deal.email;

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left border-b border-border border-l-[3px] transition-all duration-300 hover:bg-muted/40 animate-fade-in",
          "px-3 py-3.5",
          isSelected
            ? "bg-[hsl(var(--forskale-teal)/0.08)] border-l-[hsl(var(--forskale-teal))]"
            : tierBorder[tier],
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold transition-all duration-300",
            isSelected
              ? "bg-gradient-to-br from-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-cyan))] text-white shadow-[0_0_16px_hsl(var(--forskale-teal)/0.4)]"
              : "bg-muted text-foreground group-hover:bg-[hsl(var(--forskale-teal)/0.1)] group-hover:scale-105",
          )}>
            {companyDisplay.charAt(0).toUpperCase()}
            <span className={cn("absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card", tierDot[tier])} />
          </div>
          <span className="text-[10px] font-semibold text-foreground/90 truncate w-full text-center">
            {companyDisplay.split(" ")[0]}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">
            {deal.meetingCount} mtg{deal.meetingCount !== 1 ? "s" : ""}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-b border-border border-l-[3px] transition-all duration-300 hover:bg-muted/40 animate-fade-in px-4 py-3",
        isSelected
          ? "bg-[hsl(var(--forskale-teal)/0.08)] border-l-[hsl(var(--forskale-teal))]"
          : tierBorder[tier],
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", tierDot[tier])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-foreground truncate">{emailDisplay}</span>
            <span className="text-[10px] font-bold shrink-0 text-muted-foreground">
              {deal.meetingCount} meeting{deal.meetingCount !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-snug mt-1 line-clamp-2 group-hover:text-foreground/80 transition-colors">
            {companyDisplay}
          </p>
          {deal.lastMeetingDate && (
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/80">
              <span>Last: {new Date(deal.lastMeetingDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface Props {
  deals: ParticipantEmailDeal[];
  selectedId: string | null;
  onSelectDeal: (id: string) => void;
  sortMode: "urgency" | "interest" | "recent";
  onSortChange: (mode: "urgency" | "interest" | "recent") => void;
  highlightDealIds?: string[];
}

function getEmailDealTier(deal: ParticipantEmailDeal): EmailTier {
  if (deal.meetingCount >= 5) return "hot";
  if (deal.meetingCount >= 2) return "warm";
  return "cold";
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
    if (sortMode === "interest") return [...deals].sort((a, b) => b.meetingCount - a.meetingCount);
    if (sortMode === "urgency") return [...deals].sort((a, b) => getEmailDealTier(b) !== getEmailDealTier(a) ? (getEmailDealTier(b) === "hot" ? 1 : -1) : 0);
    return [...deals].sort((a, b) => {
      if (!a.lastMeetingDate && !b.lastMeetingDate) return 0;
      if (!a.lastMeetingDate) return 1;
      if (!b.lastMeetingDate) return -1;
      return new Date(b.lastMeetingDate).getTime() - new Date(a.lastMeetingDate).getTime();
    });
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
          const isSelected = selectedId === deal.email;
          const tier = getEmailDealTier(deal);

          return (
            <ParticipantEmailCard
              key={deal.email}
              deal={deal}
              isSelected={isSelected}
              onClick={() => onSelectDeal(deal.email)}
              collapsed={collapsed}
              tier={tier}
            />
          );
        })}
      </div>
    </div>
  );
}

