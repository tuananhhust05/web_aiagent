import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { ActionCardData, SentimentBadge, Channel, ActionType } from "./types";
import { mockActions } from "./mockActions";
import { useRealActions } from "./useRealActions";

const ACTION_PRIORITY: Record<ActionType, number> = {
  email_response: 1,
  call_followup: 2,
  send_resources: 3,
  schedule_demo: 4,
};

function parseDueDays(dueLabel: string): number {
  const todayMatch = dueLabel.match(/due today/i);
  if (todayMatch) return 0;
  const tomorrowMatch = dueLabel.match(/due tomorrow/i);
  if (tomorrowMatch) return 1;
  const inMatch = dueLabel.match(/due in (\d+) days?/i);
  if (inMatch) return Number(inMatch[1]);
  const overdueMatch = dueLabel.match(/(\d+) days? overdue/i);
  if (overdueMatch) return -Number(overdueMatch[1]);
  return 99;
}

function sortByPriority(cards: ActionCardData[]): ActionCardData[] {
  return [...cards].sort((a, b) => {
    const pa = ACTION_PRIORITY[a.type] ?? 99;
    const pb = ACTION_PRIORITY[b.type] ?? 99;
    if (pa !== pb) return pa - pb;
    return parseDueDays(a.dueLabel) - parseDueDays(b.dueLabel);
  });
}

export type FilterType = "needs_review" | "overdue" | "completed";

export type DueDateFilter = "all" | "today" | "tomorrow" | "in2days" | "in3days" | "in4days" | "overdue_due";

function classifyByDueDate(dueLabel: string): DueDateFilter {
  const n = dueLabel.toLowerCase().trim();
  if (n === "due today") return "today";
  if (n === "due tomorrow") return "tomorrow";
  if (n.includes("in 2 days")) return "in2days";
  if (n.includes("in 3 days")) return "in3days";
  if (n.includes("in 4 days")) return "in4days";
  return "overdue_due";
}

interface ActionsContextType {
  allActions: ActionCardData[];
  filteredActions: ActionCardData[];
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  activeCategory: SentimentBadge | "all";
  setActiveCategory: (cat: SentimentBadge | "all") => void;
  activeChannel: Channel | "all";
  setActiveChannel: (ch: Channel | "all") => void;
  activeDueFilter: DueDateFilter;
  setActiveDueFilter: (f: DueDateFilter) => void;
  dueFilterCounts: Record<DueDateFilter, number>;
  resolveAction: (id: string) => void;
  clearFilters: () => void;
  isLoading: boolean;
  counts: {
    total: number;
    needsReview: number;
    overdue: number;
    completed: number;
    filtered: number;
  };
  categoryCounts: { key: string; label: string; count: number }[];
}

const ActionsContext = createContext<ActionsContextType | null>(null);

export const useActions = () => {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useActions must be used within ActionsProvider");
  return ctx;
};

const getOverdueDays = (dueLabel: string) => {
  const match = dueLabel.match(/(\d+)\s+days?\s+overdue/i);
  return match ? Number(match[1]) : 0;
};

export const ActionsProvider = ({ children }: { children: ReactNode }) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<FilterType>("needs_review");
  const [activeCategory, setActiveCategory] = useState<SentimentBadge | "all">("all");
  const [activeChannel, setActiveChannel] = useState<Channel | "all">("all");
  const [activeDueFilter, setActiveDueFilter] = useState<DueDateFilter>("all");

  const { actions: liveActions, isLoading, completeItem } = useRealActions();

  const resolveAction = useCallback((id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    completeItem(id); // backend call, fire-and-forget
  }, [completeItem]);

  const clearFilters = useCallback(() => {
    setActiveCategory("all");
    setActiveChannel("all");
    setActiveDueFilter("all");
  }, []);

  const allActions = useMemo(() => {
    // Only show mock data during initial load (liveActions not yet available)
    const base = (isLoading && liveActions.length === 0) ? mockActions : liveActions;
    return base.map((a) => ({
      ...a,
      status: completedIds.has(a.id) ? "completed" as const : a.status,
      isOverdue: completedIds.has(a.id) ? false : a.isOverdue,
    }));
  }, [liveActions, isLoading, completedIds]);

  const needsReviewActions = useMemo(() => allActions.filter((a) => a.status !== "completed" && !a.isOverdue), [allActions]);
  const overdueActions = useMemo(() => allActions.filter((a) => a.isOverdue && getOverdueDays(a.dueLabel) > 5 && a.status !== "completed"), [allActions]);
  const completedActions = useMemo(() => allActions.filter((a) => a.status === "completed" || completedIds.has(a.id)), [allActions, completedIds]);

  const baseByStatus = useMemo(() => {
    if (activeFilter === "completed") return completedActions;
    if (activeFilter === "overdue") return overdueActions;
    return needsReviewActions;
  }, [activeFilter, needsReviewActions, overdueActions, completedActions]);

  const afterCategoryChannel = useMemo(() => {
    let result = baseByStatus;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (activeChannel !== "all") {
      result = result.filter((a) => a.triggeredFrom === activeChannel);
    }
    return result;
  }, [baseByStatus, activeCategory, activeChannel]);

  // Compute due date filter counts from the category/channel-filtered set
  const dueFilterCounts = useMemo(() => {
    const counts: Record<DueDateFilter, number> = {
      all: afterCategoryChannel.length,
      today: 0,
      tomorrow: 0,
      in2days: 0,
      in3days: 0,
      in4days: 0,
      overdue_due: 0,
    };
    afterCategoryChannel.forEach((a) => {
      counts[classifyByDueDate(a.dueLabel)]++;
    });
    return counts;
  }, [afterCategoryChannel]);

  const filteredActions = useMemo(() => {
    let result = afterCategoryChannel;
    if (activeDueFilter !== "all") {
      result = result.filter((a) => classifyByDueDate(a.dueLabel) === activeDueFilter);
    }
    return sortByPriority(result);
  }, [afterCategoryChannel, activeDueFilter]);

  // Category counts based on current status filter + channel filter
  const categoryCounts = useMemo(() => {
    let base = baseByStatus;
    if (activeChannel !== "all") {
      base = base.filter((a) => a.triggeredFrom === activeChannel);
    }

    // Build dynamic category set from real data, ordered by priority
    const categoryOrder = ["all", "interested", "meeting_intent", "not_now", "forwarded", "personal", "not_interested"];
    const categoryLabels: Record<string, string> = {
      all: "All",
      interested: "Interested",
      not_interested: "Not interested",
      meeting_intent: "Meeting intent",
      not_now: "Not now",
      forwarded: "Forwarded",
      personal: "Personal",
    };

    // Collect all unique category values that actually appear in the data
    const presentCategories = new Set(base.map((a) => a.category));

    return categoryOrder
      .filter((key) => key === "all" || presentCategories.has(key as any))
      .map((key) => ({
        key,
        label: categoryLabels[key] ?? key,
        count: key === "all" ? base.length : base.filter((a) => a.category === key).length,
      }));
  }, [baseByStatus, activeChannel]);

  const counts = useMemo(() => ({
    total: allActions.length,
    needsReview: needsReviewActions.length,
    overdue: overdueActions.length,
    completed: completedActions.length,
    filtered: filteredActions.length,
  }), [allActions, needsReviewActions, overdueActions, completedActions, filteredActions]);

  return (
    <ActionsContext.Provider value={{
      allActions,
      filteredActions,
      activeFilter,
      setActiveFilter,
      activeCategory,
      setActiveCategory,
      activeChannel,
      setActiveChannel,
      activeDueFilter,
      setActiveDueFilter,
      dueFilterCounts,
      resolveAction,
      clearFilters,
      isLoading,
      counts,
      categoryCounts,
    }}>
      {children}
    </ActionsContext.Provider>
  );
};
