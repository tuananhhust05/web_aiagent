import { cn } from "@/lib/utils";
import { useActions } from "@/context/ActionsContext";
import { useLanguage } from "@/context/LanguageContext";
import type { DueDateFilter } from "@/context/ActionsContext";

const DueDateFilterBar = () => {
  const { filteredActions, activeDueFilter, setActiveDueFilter, dueFilterCounts } = useActions();
  const { t } = useLanguage();

  const filterOrder: DueDateFilter[] = [
    "all", "today", "tomorrow", "in2days", "in3days", "in4days", "overdue_due",
  ];

  const filterLabelKeys: Record<DueDateFilter, string> = {
    all: "dueAll",
    today: "dueToday",
    tomorrow: "dueTomorrow",
    in2days: "dueIn2Days",
    in3days: "dueIn3Days",
    in4days: "dueIn4Days",
    overdue_due: "dueOverdue",
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin">
      <span className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-primary whitespace-nowrap">
        {dueFilterCounts[activeDueFilter]} {t("cards")}
        {activeDueFilter !== "all" && (
          <span className="ml-1 text-[9px] font-normal text-muted-foreground">
            / {dueFilterCounts.all} {t("cards")}
          </span>
        )}
      </span>

      <div className="h-4 w-px bg-border shrink-0" />

      <div className="flex items-center gap-1.5 min-w-0">
        {filterOrder.map((filterId) => {
          const isActive = activeDueFilter === filterId;
          const isOverdue = filterId === "overdue_due";
          const count = dueFilterCounts[filterId];

          return (
            <button
              key={filterId}
              onClick={() => setActiveDueFilter(filterId)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] transition-all duration-200 whitespace-nowrap",
                isActive
                  ? isOverdue
                    ? "border-destructive bg-destructive/10 text-destructive shadow-sm"
                    : "border-accent bg-accent/10 text-accent shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground hover:bg-muted/50"
              )}
            >
              {t(filterLabelKeys[filterId] as any)}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  isActive
                    ? isOverdue
                      ? "bg-destructive/20 text-destructive"
                      : "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DueDateFilterBar;
