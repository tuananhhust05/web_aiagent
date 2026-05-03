import { AlertTriangle, CheckCircle2, Circle, PanelLeftClose, PanelLeft } from "lucide-react";
import { useState } from "react";
import { useActions, FilterType } from "@/context/ActionsContext";
import { useLanguage } from "@/context/LanguageContext";

const categoryKeys: Record<string, string> = {
  all: "all",
  interested: "interested",
  not_interested: "not_interested",
  meeting_intent: "meeting_intent",
  not_now: "not_now",
  forwarded: "forwarded",
  personal: "personal",
};

const ActionFilterSidebar = () => {
  const { counts, activeFilter, setActiveFilter, activeCategory, setActiveCategory, categoryCounts } = useActions();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const statusFilters: { labelKey: "needsReview" | "overdue" | "completed"; count: number; countSuffix: string; icon: JSX.Element; filter: FilterType; colorClass: string }[] = [
    { labelKey: "needsReview", count: counts.needsReview, countSuffix: ` ${t("actions")}`, icon: <Circle size={16} />, filter: "needs_review", colorClass: "bg-accent/10 text-accent" },
    { labelKey: "overdue", count: counts.overdue, countSuffix: ` ${t("tasks")}`, icon: <AlertTriangle size={16} />, filter: "overdue", colorClass: "bg-destructive/10 text-destructive" },
    { labelKey: "completed", count: counts.completed, countSuffix: ` ${t("tasks")}`, icon: <CheckCircle2 size={16} />, filter: "completed", colorClass: "bg-forskale-green/10 text-forskale-green" },
  ];

  if (collapsed) {
    return (
      <aside className="hidden w-[60px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col lg:items-center lg:py-4">
        <button onClick={() => setCollapsed(false)} className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Expand sidebar">
          <PanelLeft size={16} />
        </button>
        <div className="flex flex-col items-center gap-2.5">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter.filter;
            return (
              <button key={filter.labelKey} onClick={() => setActiveFilter(filter.filter)} className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:shadow-md ${isActive ? "border-accent bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06] shadow-md" : "border-border bg-card hover:border-accent"}`} title={`${t(filter.labelKey)} (${filter.count})`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${filter.colorClass}`}>{filter.icon}</div>
                {filter.filter === "overdue" && counts.overdue > 0 && (
                  <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shadow-[0_0_0_3px_hsl(var(--destructive)/0.2)]" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full border-b border-border bg-card p-4 lg:w-[250px] lg:shrink-0 lg:border-b-0 lg:border-r lg:p-4 lg:overflow-y-auto lg:h-full transition-all duration-200">
      <div className="space-y-4 lg:sticky lg:top-0">
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{t("filters")}</span>
          <button onClick={() => setCollapsed(true)} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Collapse">
            <PanelLeftClose size={14} />
          </button>
        </div>

        {/* Status Filters */}
        <div className="space-y-2">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter.filter;
            return (
              <button key={filter.labelKey} onClick={() => setActiveFilter(filter.filter)} className={`relative flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isActive ? "border-accent bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06] shadow-md" : "border-border bg-card hover:border-accent"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${filter.colorClass}`}>{filter.icon}</div>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{t(filter.labelKey)}</span>
                  <span className="text-xs text-muted-foreground">{filter.count}{filter.countSuffix}</span>
                </div>
                {filter.filter === "overdue" && counts.overdue > 0 && (
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shadow-[0_0_0_3px_hsl(var(--destructive)/0.2)]" />
                )}
                {isActive && filter.filter !== "overdue" && (
                  <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.2)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="pt-2">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{t("categories")}</h3>
          <div className="flex flex-col gap-1.5">
            {categoryCounts
              .filter((cat) => cat.key === "all" || cat.count > 0)
              .map((cat) => {
              const isActive = activeCategory === cat.key;
              const translatedLabel = categoryKeys[cat.key] ? t(categoryKeys[cat.key] as any) : cat.label;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key as any)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "border-foreground bg-foreground text-card"
                      : "border-border bg-muted/40 text-muted-foreground hover:border-accent hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{translatedLabel}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                    isActive ? "bg-card/20 text-card" : "bg-muted text-muted-foreground"
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ActionFilterSidebar;
