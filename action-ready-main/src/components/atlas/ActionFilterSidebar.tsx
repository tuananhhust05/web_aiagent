import { useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { useActions, FilterType } from "@/context/ActionsContext";

const getOverdueDays = (dueLabel: string) => {
  const match = dueLabel.match(/(\d+)\s+days?\s+overdue/i);
  return match ? Number(match[1]) : 0;
};

const ActionFilterSidebar = () => {
  const { pendingActions, completedActions, activeFilter, setActiveFilter } = useActions();
  const [selectedCategory, setSelectedCategory] = useState<string>("interested");
  const [collapsed, setCollapsed] = useState(false);

  const overdueCards = [...pendingActions, ...completedActions].filter(
    (a) => a.isOverdue && getOverdueDays(a.dueLabel) > 5 && !completedActions.some((c) => c.id === a.id)
  );

  const statusFilters: { label: string; count: number; countSuffix?: string; icon: JSX.Element; filter: FilterType; colorClass: string }[] = [
    { label: "Needs Review", count: pendingActions.length, countSuffix: " Actions", icon: <Circle size={16} />, filter: "needs_review", colorClass: "bg-accent/10 text-accent" },
    { label: "Overdue", count: overdueCards.length, countSuffix: " min", icon: <AlertTriangle size={16} />, filter: "overdue", colorClass: "bg-forskale-cyan/10 text-forskale-cyan" },
    { label: "Completed", count: completedActions.length, countSuffix: " tasks", icon: <CheckCircle2 size={16} />, filter: "completed", colorClass: "bg-forskale-green/10 text-forskale-green" },
  ];

  const categories = [
    { key: "interested", label: `${pendingActions.filter((a) => a.sentiment === "interested").length} Interested` },
    { key: "not_now", label: `${pendingActions.filter((a) => a.sentiment === "not_now").length} Not now` },
    { key: "not_interested", label: `${pendingActions.filter((a) => a.sentiment === "not_interested").length} Not interested` },
  ];

  // Collapsed rail view
  if (collapsed) {
    return (
      <aside className="hidden w-[60px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col lg:items-center lg:py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Expand sidebar"
        >
          <PanelLeft size={16} />
        </button>
        <div className="flex flex-col items-center gap-2.5">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter.filter;
            return (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.filter)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:shadow-md ${
                  isActive
                    ? "border-accent bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06] shadow-md"
                    : "border-border bg-card hover:border-accent"
                }`}
                title={`${filter.label} (${filter.count}${filter.countSuffix || ""})`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${filter.colorClass}`}>
                  {filter.icon}
                </div>
                {isActive && (
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_0_3px_hsl(var(--accent)/0.2)]" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded view
  return (
    <aside className="w-full border-b border-border bg-card p-4 lg:w-[240px] lg:shrink-0 lg:border-b-0 lg:border-r lg:p-4 transition-all duration-200">
      <div className="space-y-4 lg:sticky lg:top-0">
        {/* Collapse button */}
        <div className="hidden lg:flex lg:justify-end">
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* Queue Navigation */}
        <div className="space-y-2">
          {statusFilters.map((filter) => {
            const isActive = activeFilter === filter.filter;
            return (
              <button
                key={filter.label}
                onClick={() => setActiveFilter(filter.filter)}
                className={`relative flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? "border-accent bg-gradient-to-r from-forskale-green/[0.06] to-accent/[0.06] shadow-md"
                    : "border-border bg-card hover:border-accent"
                }`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${filter.colorClass}`}>
                  {filter.icon}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">{filter.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {filter.count}{filter.countSuffix || ""}
                  </span>
                </div>
                {isActive ? (
                  <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.2)]" />
                ) : (
                  <ChevronRight size={14} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            );
          })}
        </div>

        {/* Categories */}
        <div className="pt-2">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Categories</h3>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  selectedCategory === cat.key
                    ? "border-foreground bg-foreground text-card"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-accent hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ActionFilterSidebar;
