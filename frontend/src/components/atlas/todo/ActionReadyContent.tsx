import { CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import ActionCard from "./ActionCard";
import type { ActionCardData } from "./ActionCard";
import DueDateFilterBar from "./DueDateFilterBar";
import { useActions } from "./ActionsContext";
import { useLanguage } from "./LanguageContext";
import { todoReadyAPI } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { TODO_READY_QUERY_KEY, mapTodoItemToCard } from "./useRealActions";

const ActionReadyContent = () => {
  const { filteredActions, activeFilter, resolveAction, counts, isLoading } = useActions();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const handleEnsureAnalyzed = async (id: string): Promise<ActionCardData | null> => {
    try {
      const res = await todoReadyAPI.ensureAnalyzed(id);
      const item = res.data;
      // invalidate the list query so next load is fresh
      queryClient.invalidateQueries({ queryKey: TODO_READY_QUERY_KEY });
      // map TodoItem → ActionCardData using the same mapper logic
      return mapTodoItemToCard(item);
    } catch (e) {
      return null;
    }
  };

  const isCompleted = activeFilter === "completed";
  const isOverdue = activeFilter === "overdue";

  const config = {
    needs_review: { eyebrow: t("executionQueue"), icon: Circle },
    overdue: { eyebrow: t("overdueEyebrow"), icon: AlertTriangle },
    completed: { eyebrow: t("completedEyebrow"), icon: CheckCircle2 },
  } as const;

  const current = config[activeFilter];
  const Icon = current.icon;

  return (
    <main className="flex-1 overflow-y-auto bg-secondary px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="space-y-3">
          {/* Queue Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isOverdue ? "bg-destructive/10 text-destructive" : isCompleted ? "bg-forskale-green/10 text-forskale-green" : "bg-primary/10 text-primary"
              }`}>
                <Icon size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{current.eyebrow}</span>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {isCompleted ? t("recentlyShipped") : t("oneTaskOneAction")}
                </h2>
              </div>
            </div>
          </div>

          {isOverdue && (
            <p className="text-xs text-muted-foreground">{t("tasksOlderThan5")}</p>
          )}

          {/* Due Date Filter Pills */}
          <DueDateFilterBar />

          {/* Loading spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Task Cards Grid */}
          {!isLoading && (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredActions.map((action) => (
                <ActionCard
                    key={action.id}
                    data={action}
                    onResolve={!isCompleted ? resolveAction : undefined}
                    resolved={isCompleted}
                    onEnsureAnalyzed={!isCompleted ? handleEnsureAnalyzed : undefined}
                  />
              ))}
            </div>
          )}

          {!isLoading && filteredActions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
              {isOverdue && counts.overdue === 0 ? (
                <>
                  <CheckCircle2 className="mx-auto mb-2 text-forskale-green" size={28} />
                  <p className="text-sm font-bold text-foreground">{t("noOverdueTasks")}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("allOnTrack")}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground">
                    {isCompleted ? t("noCompletedYet") : t("noTasksMatch")}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isCompleted ? t("completedWillAppear") : t("tryAdjusting")}
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ActionReadyContent;
