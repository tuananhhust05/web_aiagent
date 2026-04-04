import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ActionCardData } from "@/components/atlas/action-card/types";
import { mockActions } from "@/data/mockActions";

export type FilterType = "needs_review" | "overdue" | "completed";

interface ActionsContextType {
  pendingActions: ActionCardData[];
  completedActions: ActionCardData[];
  filteredActions: ActionCardData[];
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  resolveAction: (id: string) => void;
}

const ActionsContext = createContext<ActionsContextType | null>(null);

export const useActions = () => {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useActions must be used within ActionsProvider");
  return ctx;
};

export const ActionsProvider = ({ children }: { children: ReactNode }) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>("needs_review");

  const resolveAction = useCallback((id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
  }, []);

  const getOverdueDays = (dueLabel: string) => {
    const match = dueLabel.match(/(\d+)\s+days?\s+overdue/i);
    return match ? Number(match[1]) : 0;
  };

  const pendingActions = mockActions.filter((a) => !completedIds.has(a.id));
  const overdueActions = pendingActions.filter((a) => a.isOverdue && getOverdueDays(a.dueLabel) > 5);
  const reviewActions = pendingActions.filter((a) => !completedIds.has(a.id) && !overdueActions.some((overdue) => overdue.id === a.id));
  const completedActions = mockActions.filter((a) => completedIds.has(a.id));

  const filteredActions = activeFilter === "completed"
    ? completedActions
    : activeFilter === "overdue"
      ? overdueActions
      : reviewActions;

  return (
    <ActionsContext.Provider value={{ pendingActions: reviewActions, completedActions, filteredActions, activeFilter, setActiveFilter, resolveAction }}>
      {children}
    </ActionsContext.Provider>
  );
};
