import { CheckCircle2, AlertTriangle, Clock, Circle } from "lucide-react";
import ActionCard from "./ActionCard";
import { useActions } from "@/context/ActionsContext";

const filterLabels = {
  needs_review: { label: "Execution Queue", eyebrow: "EXECUTION QUEUE", icon: Circle },
  overdue: { label: "Overdue Follow-ups", eyebrow: "OVERDUE", icon: AlertTriangle },
  completed: { label: "Completed", eyebrow: "COMPLETED", icon: CheckCircle2 },
} as const;

const ActionReadyContent = () => {
  const { filteredActions, activeFilter, resolveAction } = useActions();

  const isCompleted = activeFilter === "completed";
  const isOverdue = activeFilter === "overdue";
  const config = filterLabels[activeFilter];
  const Icon = config.icon;

  return (
    <main className="flex-1 overflow-y-auto bg-secondary px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="space-y-3">
          {/* Queue Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                isOverdue ? "bg-forskale-cyan/10 text-forskale-cyan" : isCompleted ? "bg-forskale-green/10 text-forskale-green" : "bg-primary/10 text-primary"
              }`}>
                <Icon size={16} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{config.eyebrow}</span>
                <h2 className="text-lg font-bold tracking-tight text-foreground">
                  {isCompleted ? "Recently shipped actions" : "One task. One action. Next card."}
                </h2>
              </div>
            </div>
            <span className="rounded-md border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-primary">
              {filteredActions.length} cards
            </span>
          </div>

          {isOverdue && (
            <p className="text-xs text-muted-foreground">Tasks older than 5 days stay visible here for quick intervention.</p>
          )}

          {/* Task Cards Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredActions.map((action) => (
              <ActionCard
                key={action.id}
                data={action}
                onResolve={!isCompleted ? resolveAction : undefined}
                resolved={isCompleted}
              />
            ))}
          </div>

          {filteredActions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center">
              <p className="text-sm font-bold text-foreground">
                {isCompleted ? "No completed cards yet." : isOverdue ? "No overdue cards right now." : "Execution queue is clear."}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {isCompleted ? "Completed work will appear here once reps finish tasks." : isOverdue ? "Cards older than 5 days will appear here automatically." : "When a new action is ready, it will drop straight into this flow."}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ActionReadyContent;
