import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, Sparkles, ChevronDown, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { todoReadyAPI } from "@/lib/api";
import { useActions } from "./ActionsContext";
import { categories } from "./mockActions";
import { TODO_READY_QUERY_KEY } from "./useRealActions";

const ActionReadyHeader = () => {
  const {
    searchDraft,
    setSearchDraft,
    applySearch,
    isSearchPending,
    activeChannel,
    setActiveChannel,
    activeCategory,
    setActiveCategory,
    clearFilters,
    counts,
  } = useActions();
  const [channelOpen, setChannelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const hasActiveFilters = activeCategory !== "all" || activeChannel !== "all";
  const categoryLabel = categories.find((c) => c.key === activeCategory)?.label;

  // "Analyze New" mutation
  const analyzeMutation = useMutation({
    mutationFn: () => todoReadyAPI.analyze().then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TODO_READY_QUERY_KEY });
      if (data.new_todos_created > 0) {
        toast.success(`${data.new_todos_created} new action${data.new_todos_created !== 1 ? "s" : ""} created`);
      } else {
        const existingCount = counts.total;
        if (existingCount > 0) {
          toast.success(`No new actions — there are ${existingCount} existing actions to handle`);
        } else {
          toast.success("Analysis complete — no new actions");
        }
      }
    },
    onError: () => {
      toast.error("Analysis failed. Please try again.");
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setChannelOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="shrink-0 sticky top-0 z-20 border-b border-border bg-card px-5 py-3.5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Execution flashcards for sales follow-up
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-10 w-[180px] rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
          <button
            onClick={applySearch}
            disabled={isSearchPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSearchPending ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Channel Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setChannelOpen(!channelOpen)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-all ${
                activeChannel !== "all"
                  ? "border-accent text-accent"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              <span className="hidden sm:inline">{activeChannel === "all" ? "All channels" : activeChannel}</span>
              <ChevronDown size={14} className={`transition-transform ${channelOpen ? "rotate-180" : ""}`} />
            </button>
            {channelOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-card p-1 shadow-lg">
                {(["all", "Email", "Meeting"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setActiveChannel(ch as any);
                      setChannelOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      activeChannel === ch ? "bg-accent/10 font-semibold text-accent" : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {activeChannel === ch && <span className="text-accent">✓</span>}
                    <span>{ch === "all" ? "All channels" : ch}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analyze New button */}
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className={`relative inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
              analyzeMutation.isPending
                ? "border-accent text-accent shadow-[0_0_0_4px_hsl(var(--accent)/0.10)]"
                : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
            } disabled:opacity-60`}
          >
            {analyzeMutation.isPending ? (
              <span className="relative inline-flex h-5 w-5 items-center justify-center">
                <span className="absolute inset-0 animate-[pulseRing_2.5s_ease-out_infinite] rounded-full border border-accent/40" />
                <span className="absolute inset-[18%] animate-[pulseRing_2.5s_ease-out_0.8s_infinite] rounded-full border border-accent/40" />
                <span className="relative z-10 flex h-5 w-5 items-center justify-center animate-[iconFloat_3s_ease-in-out_infinite]">
                  <Loader2 size={16} className="text-accent" />
                </span>
              </span>
            ) : (
              <Sparkles size={16} />
            )}
            <span className="hidden sm:inline">
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze New"}
            </span>
            {analyzeMutation.isPending && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
                <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-accent/15 to-transparent" />
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {categoryLabel}
              <button onClick={() => setActiveCategory("all")} className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20">
                <X size={12} />
              </button>
            </span>
          )}
          {activeChannel !== "all" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {activeChannel}
              <button onClick={() => setActiveChannel("all")} className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20">
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </header>
  );
};

export default ActionReadyHeader;
