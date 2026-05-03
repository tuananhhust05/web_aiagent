import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef, useEffect } from "react";
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
    // Primary: newest email first (createdAt DESC)
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return tb - ta;
    // Secondary tiebreaker: soonest due date
    const da = parseDueDays(a.dueLabel);
    const db = parseDueDays(b.dueLabel);
    if (da !== db) return da - db;
    // Tertiary tiebreaker: action type priority
    const pa = ACTION_PRIORITY[a.type] ?? 99;
    const pb = ACTION_PRIORITY[b.type] ?? 99;
    return pa - pb;
  });
}

function matchesSearchQuery(action: ActionCardData, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const text = [
    action.title,
    action.prospect,
    action.triggeredFrom,
    action.dueLabel,
    action.strategicStep,
    action.objective,
    action.whyThisStep,
    action.interactionSummary,
    action.draftContent,
    ...(action.keyTopics ?? []),
    ...(action.interactionHistory ?? []).map((h) => h.summary),
  ]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ")
    .toLowerCase();

  return text.includes(query);
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
  // Items due in 5+ days: still future tasks, show in "in4days" bucket (closest future bucket)
  if (n.startsWith("due in ")) return "in4days";
  // Items overdue: show in overdue_due
  if (n.includes("overdue")) return "overdue_due";
  // Unknown/fallback: treat as today so it's never invisible
  return "today";
}

interface ActionsContextType {
  allActions: ActionCardData[];
  filteredActions: ActionCardData[];
  searchDraft: string;
  setSearchDraft: (q: string) => void;
  applySearch: () => void;
  isSearchPending: boolean;
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

export const ActionsProvider = ({ children }: { children: ReactNode }) => {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [isSearchPending, setIsSearchPending] = useState(false);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("needs_review");
  const [activeCategory, setActiveCategory] = useState<SentimentBadge | "all">("all");
  const [activeChannel, setActiveChannel] = useState<Channel | "all">("all");
  const [activeDueFilter, setActiveDueFilter] = useState<DueDateFilter>("all");

  const { actions: liveActions, isLoading, completeItem } = useRealActions();

  const resolveAction = useCallback((id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    completeItem(id); // backend call, fire-and-forget
  }, [completeItem]);

  const applySearch = useCallback(() => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    setIsSearchPending(true);
    const next = searchDraft;
    pendingTimerRef.current = setTimeout(() => {
      setAppliedSearchQuery(next);
      setIsSearchPending(false);
      pendingTimerRef.current = null;
    }, 500);
  }, [searchDraft]);

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const clearFilters = useCallback(() => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = null;
    setIsSearchPending(false);
    setActiveCategory("all");
    setActiveChannel("all");
    setActiveDueFilter("all");
    setSearchDraft("");
    setAppliedSearchQuery("");
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
  const overdueActions = useMemo(() => allActions.filter((a) => a.isOverdue && a.status !== "completed"), [allActions]);
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

  const afterSearch = useMemo(
    () => afterCategoryChannel.filter((a) => matchesSearchQuery(a, appliedSearchQuery)),
    [afterCategoryChannel, appliedSearchQuery]
  );

  // Compute due date filter counts from the category/channel-filtered set
  const dueFilterCounts = useMemo(() => {
    const counts: Record<DueDateFilter, number> = {
      all: afterSearch.length,
      today: 0,
      tomorrow: 0,
      in2days: 0,
      in3days: 0,
      in4days: 0,
      overdue_due: 0,
    };
    afterSearch.forEach((a) => {
      counts[classifyByDueDate(a.dueLabel)]++;
    });
    return counts;
  }, [afterSearch]);

  const filteredActions = useMemo(() => {
    let result = afterSearch;
    if (activeDueFilter !== "all") {
      result = result.filter((a) => classifyByDueDate(a.dueLabel) === activeDueFilter);
    }
    return sortByPriority(result);
  }, [afterSearch, activeDueFilter]);

  // Category counts based on current status filter + channel filter
  const categoryCounts = useMemo(() => {
    let base = baseByStatus;
    if (activeChannel !== "all") {
      base = base.filter((a) => a.triggeredFrom === activeChannel);
    }
    if (appliedSearchQuery.trim()) {
      base = base.filter((a) => matchesSearchQuery(a, appliedSearchQuery));
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
  }, [baseByStatus, activeChannel, appliedSearchQuery]);

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
      searchDraft,
      setSearchDraft,
      applySearch,
      isSearchPending,
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
