import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Filter,
  X,
  Phone,
  Briefcase,
  Link2,
  Check,
  Search,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallItem, NegotiationStage, DataSource } from "@/data/mockData";
import { mockCallEvaluations } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type CallEvaluationMap = Record<string, { status: "evaluated" | "pending"; actionCount: number; progression?: string }>;

interface CallListSidebarProps {
  calls: CallItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  callEvaluations?: CallEvaluationMap;
}

const STAGE_TEXT_COLORS: Record<NegotiationStage, string> = {
  Discovery: "text-[hsl(var(--forskale-teal))]",
  Demo: "text-[hsl(var(--forskale-blue))]",
  Proposal: "text-purple-500",
  Negotiation: "text-orange-500",
  Closing: "text-[hsl(var(--forskale-green))]",
};

const STAGE_BG_COLORS: Record<NegotiationStage, string> = {
  Discovery: "bg-[hsl(var(--forskale-teal)/0.1)] border-[hsl(var(--forskale-teal)/0.3)]",
  Demo: "bg-[hsl(var(--forskale-blue)/0.1)] border-[hsl(var(--forskale-blue)/0.3)]",
  Proposal: "bg-purple-500/10 border-purple-500/30",
  Negotiation: "bg-orange-500/10 border-orange-500/30",
  Closing: "bg-[hsl(var(--forskale-green)/0.1)] border-[hsl(var(--forskale-green)/0.3)]",
};

const SOURCE_ICON: Record<DataSource, { icon: typeof Phone; label: string; color: string }> = {
  call: { icon: Mic, label: "Call Recording", color: "text-[hsl(var(--forskale-green))]" },
  crm: { icon: Briefcase, label: "CRM Entry", color: "text-[hsl(var(--forskale-blue))]" },
  both: { icon: Link2, label: "Both Sources", color: "text-purple-400" },
};

const ALL_STAGES: NegotiationStage[] = ["Discovery", "Demo", "Proposal", "Negotiation", "Closing"];

// ─── Filter Dropdown (shared open-state controller) ───
const FilterDropdown = ({
  label,
  options,
  selected,
  onChange,
  multi = false,
  searchable = false,
  openKey,
  activeKey,
  onOpen,
}: {
  label: string;
  options: string[];
  selected: string | string[];
  onChange: (val: any) => void;
  multi?: boolean;
  searchable?: boolean;
  openKey: string;
  activeKey: string | null;
  onOpen: (key: string | null) => void;
}) => {
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isOpen = activeKey === openKey;
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Position dropdown via portal
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        onOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onOpen]);

  const filtered = searchable ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;
  const selectedArr = multi ? (selected as string[]) : [];
  const selectedStr = multi ? "" : (selected as string);
  const hasValue = multi ? selectedArr.length > 0 : !!selectedStr;

  const displayLabel = multi
    ? selectedArr.length > 0 ? `${label} (${selectedArr.length})` : label
    : selectedStr || label;

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={() => onOpen(isOpen ? null : openKey)}
        className={cn(
          "flex w-full h-9 items-center justify-between gap-2 rounded-md border border-border/50 bg-background px-3 py-2 text-[11px] text-foreground transition-colors",
          "hover:border-border hover:bg-accent/20",
          isOpen && "border-border bg-accent/20",
          hasValue && "border-[hsl(var(--forskale-teal)/0.4)]",
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <div className="flex items-center gap-1">
          {multi && selectedArr.length > 0 && (
            <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-[hsl(var(--forskale-teal))] text-[9px] font-bold text-white">
              {selectedArr.length}
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>
      {isOpen && dropdownPos && createPortal(
        <div
          ref={dropdownRef}
          className="fixed max-h-[200px] overflow-y-auto rounded-md border border-border bg-card p-1 shadow-xl atlas-scrollbar"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
        >
          {searchable && (
            <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5 mb-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}
          {multi ? (
            filtered.map((opt) => {
              const checked = selectedArr.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onChange(checked ? selectedArr.filter((s) => s !== opt) : [...selectedArr, opt])}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] hover:bg-accent transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors",
                      checked ? "bg-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal))]" : "border-border",
                    )}
                  >
                    {checked && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className={cn("text-left", checked ? "text-foreground font-medium" : "text-muted-foreground")}>{opt}</span>
                </button>
              );
            })
          ) : (
            <>
              <button
                onClick={() => { onChange(""); onOpen(null); }}
                className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] hover:bg-accent transition-colors", !selectedStr && "text-foreground font-medium")}
              >
                All
              </button>
              {filtered.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); onOpen(null); }}
                  className={cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] hover:bg-accent transition-colors text-left", selectedStr === opt ? "text-foreground font-medium" : "text-muted-foreground")}
                >
                  {opt}
                </button>
              ))}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};

// Date grouping helper
function groupByDate(calls: CallItem[]): { date: string; label: string; calls: CallItem[] }[] {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const groups: Map<string, CallItem[]> = new Map();
  calls.forEach((call) => {
    const existing = groups.get(call.date) || [];
    existing.push(call);
    groups.set(call.date, existing);
  });

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    label: date === todayStr ? "Today" : date === yesterdayStr ? "Yesterday" : date,
    calls: items,
  }));
}

// ─── N8N Flowchart with browsing mode ───
const MeetingFlowchart = ({
  company,
  calls,
  currentCallId,
  anchorRect,
  onSelectCall,
  onClose,
  browsingMode,
  onEnterBrowsingMode,
  onMouseEnter,
  onMouseLeave,
  callEvaluations,
}: {
  company: string;
  calls: CallItem[];
  currentCallId: string;
  anchorRect: DOMRect;
  onSelectCall: (id: string) => void;
  onClose: () => void;
  browsingMode: boolean;
  onEnterBrowsingMode: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  callEvaluations?: CallEvaluationMap;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const companyCalls = useMemo(() =>
    calls
      .filter((c) => c.company === company)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [calls, company],
  );

  const displayCalls = companyCalls.slice(-12);
  const olderCount = companyCalls.length - displayCalls.length;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight") { setFocusedIdx((i) => Math.min(i + 1, displayCalls.length - 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft") { setFocusedIdx((i) => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === "Home") { setFocusedIdx(0); e.preventDefault(); }
      if (e.key === "End") { setFocusedIdx(displayCalls.length - 1); e.preventDefault(); }
      if (e.key === "Enter" && focusedIdx >= 0) {
        const call = displayCalls[focusedIdx];
        if (call) {
          setSelectedNodeId(call.id);
          onEnterBrowsingMode();
          onSelectCall(call.id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, focusedIdx, displayCalls, onSelectCall, onEnterBrowsingMode]);

  // Scroll focused node into view
  useEffect(() => {
    if (focusedIdx >= 0 && scrollRef.current) {
      const nodes = scrollRef.current.querySelectorAll("[data-timeline-node]");
      nodes[focusedIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [focusedIdx]);

  const scrollByNode = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 192, behavior: "smooth" });
    }
  };

  const handleNodeClick = (call: CallItem) => {
    setSelectedNodeId(call.id);
    onEnterBrowsingMode();
    onSelectCall(call.id);
  };

  // Position to the right of the sidebar
  const top = Math.max(40, Math.min(anchorRect.top - 60, window.innerHeight - 340));
  const left = anchorRect.right + 12;

  // Scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setScrollProgress(scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0);
  };

  return (
    <div
      className="fixed rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200"
      style={{ top, left, maxWidth: "min(90vw, 700px)", maxHeight: "320px", zIndex: 9998 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">{company}</h3>
          <span className="text-[10px] text-muted-foreground">
            {browsingMode ? "Browsing timeline" : "Meeting Timeline"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground mr-2">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--forskale-green))]" />Call</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--forskale-blue))]" />CRM</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" />Both</span>
          </div>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline with scroll */}
      <div className="relative px-4">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-4 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-card/95 to-transparent" />
        <div className="pointer-events-none absolute right-4 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-card/95 to-transparent" />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-start gap-0 overflow-x-auto pb-2"
          style={{ scrollBehavior: "smooth", scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
        >
          {olderCount > 0 && (
            <div className="flex flex-col items-center justify-center min-w-[60px] h-[140px] text-[10px] text-muted-foreground">
              +{olderCount} older
            </div>
          )}
          {displayCalls.map((call, idx) => {
            const isCurrent = call.id === currentCallId;
            const isSelected = call.id === selectedNodeId;
            const isFocused = focusedIdx === idx;
            const evalData = callEvaluations?.[call.id];
            const sourceInfo = SOURCE_ICON[call.dataSource];
            const SourceIcon = sourceInfo.icon;
            const borderColor = call.dataSource === "call"
              ? "border-l-[hsl(var(--forskale-green))]"
              : call.dataSource === "crm"
              ? "border-l-[hsl(var(--forskale-blue))]"
              : "border-l-purple-400";

            return (
              <div
                key={call.id}
                className="flex items-center"
                style={{ animationDelay: `${idx * 50}ms`, scrollSnapAlign: "center" }}
                data-timeline-node
              >
                <button
                  onClick={() => handleNodeClick(call)}
                  className={cn(
                    "relative flex flex-col min-w-[160px] max-w-[160px] h-[140px] rounded-lg border-l-[3px] border border-border p-3 transition-all duration-200 text-left animate-in fade-in slide-in-from-bottom-1",
                    borderColor,
                    isCurrent && "ring-2 ring-[hsl(var(--forskale-teal))] bg-[hsl(var(--forskale-teal)/0.06)] shadow-md",
                    isSelected && !isCurrent && "ring-2 ring-[hsl(var(--forskale-teal))] scale-105",
                    isFocused && "ring-2 ring-[hsl(var(--forskale-blue))]",
                    browsingMode && selectedNodeId && !isSelected && !isCurrent && "opacity-60",
                    !isCurrent && !isSelected && !isFocused && "hover:bg-accent/50 hover:shadow-sm",
                  )}
                >
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[hsl(var(--forskale-teal))] animate-pulse" />
                  )}
                  <span className="text-[9px] text-muted-foreground mb-1">{call.date}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[8px] h-4 w-fit mb-1.5 border", STAGE_BG_COLORS[call.negotiationStage], STAGE_TEXT_COLORS[call.negotiationStage])}
                  >
                    {call.negotiationStage}
                  </Badge>
                  <span className="text-[11px] font-medium text-foreground line-clamp-2 flex-1">{call.title}</span>
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className={cn("flex items-center gap-1 text-[9px]", sourceInfo.color)}>
                      <SourceIcon className="h-3 w-3" />
                      {call.dataSource === "both" ? "Both" : call.dataSource === "crm" ? "CRM" : "Call"}
                    </span>
                    {evalData && (
                      <span className={cn("text-[8px] font-medium", evalData.status === "evaluated" ? "text-status-great" : "text-muted-foreground")}>
                        {evalData.status === "evaluated" ? "✓ Eval" : "Pending"}
                      </span>
                    )}
                  </div>
                  {call.dataCompleteness != null && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/30 rounded-b">
                      <div
                        className="h-full rounded-b transition-all"
                        style={{
                          width: `${call.dataCompleteness}%`,
                          background: call.dataCompleteness > 80
                            ? "hsl(var(--forskale-green))"
                            : call.dataCompleteness > 50
                            ? "hsl(var(--forskale-teal))"
                            : "hsl(0 60% 50%)",
                        }}
                      />
                    </div>
                  )}
                </button>
                {idx < displayCalls.length - 1 && (
                  <div className="flex items-center h-[140px]">
                    <svg width="32" height="140" className="flex-shrink-0">
                      <path d="M0,70 C16,70 16,70 32,70" stroke="hsl(var(--forskale-teal))" strokeWidth="2" fill="none" strokeDasharray="4 2" opacity="0.4" />
                      <circle cx="0" cy="70" r="3" fill="hsl(var(--forskale-teal))" opacity="0.6" />
                      <circle cx="32" cy="70" r="3" fill="hsl(var(--forskale-teal))" opacity="0.6" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll progress bar */}
      <div className="mx-4 h-[2px] bg-border/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${Math.max(10, scrollProgress * 100)}%`,
            background: "linear-gradient(to right, hsl(var(--forskale-teal)), hsl(var(--forskale-blue)))",
          }}
        />
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 mt-1">
        <span className="text-[10px] font-semibold text-foreground">{company}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">
            {displayCalls[0]?.date} – {displayCalls[displayCalls.length - 1]?.date}
          </span>
          <button onClick={() => scrollByNode(-1)} className="h-7 w-7 flex items-center justify-center rounded-md bg-background hover:bg-accent border border-border/50 transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => scrollByNode(1)} className="h-7 w-7 flex items-center justify-center rounded-md bg-background hover:bg-accent border border-border/50 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Invisible Bridge ───
const FlowchartBridge = ({
  cardRect,
  flowchartLeft,
  onMouseEnter,
  onMouseLeave,
}: {
  cardRect: DOMRect;
  flowchartLeft: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const bridgeLeft = cardRect.right;
  const bridgeWidth = Math.max(0, flowchartLeft - cardRect.right);
  const bridgeTop = cardRect.top - 60;
  const bridgeHeight = 340;

  if (bridgeWidth <= 0) return null;

  return createPortal(
    <div
      className="fixed"
      style={{ left: bridgeLeft, top: bridgeTop, width: bridgeWidth, height: bridgeHeight, zIndex: 9997 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />,
    document.body,
  );
};

const CallListSidebar = ({ calls, selectedId, onSelect, collapsed, onToggle, callEvaluations }: CallListSidebarProps) => {
  const evaluations = callEvaluations ?? mockCallEvaluations;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Flowchart state with bridge logic
  const [flowchartCompany, setFlowchartCompany] = useState<string | null>(null);
  const [flowchartRect, setFlowchartRect] = useState<DOMRect | null>(null);
  const [browsingMode, setBrowsingMode] = useState(false);
  const [mouseInCard, setMouseInCard] = useState(false);
  const [mouseInFlowchart, setMouseInFlowchart] = useState(false);
  const [mouseInBridge, setMouseInBridge] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const companies = useMemo(() => [...new Set(calls.map((c) => c.company))], [calls]);
  const products = useMemo(() => [...new Set(calls.map((c) => c.product))], [calls]);

  const activeFilterCount = (selectedStages.length > 0 ? 1 : 0) + (selectedCompany ? 1 : 0) + (selectedProduct ? 1 : 0);

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      if (selectedStages.length > 0 && !selectedStages.includes(call.negotiationStage)) return false;
      if (selectedCompany && call.company !== selectedCompany) return false;
      if (selectedProduct && call.product !== selectedProduct) return false;
      return true;
    });
  }, [calls, selectedStages, selectedCompany, selectedProduct]);

  const dateGroups = useMemo(() => groupByDate(filteredCalls), [filteredCalls]);

  const clearFilters = () => {
    setSelectedStages([]);
    setSelectedCompany("");
    setSelectedProduct("");
  };

  const toggleDateGroup = (date: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // ─── Flowchart hover logic with bridge ───
  const showFlowchart = useCallback((company: string, rect: DOMRect) => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    setFlowchartCompany(company);
    setFlowchartRect(rect);
  }, []);

  const scheduleHide = useCallback(() => {
    if (browsingMode) return; // Don't auto-hide in browsing mode
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setFlowchartCompany(null);
      setFlowchartRect(null);
      setBrowsingMode(false);
    }, 200);
  }, [browsingMode]);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  }, []);

  // When any zone loses mouse, check if all zones are empty
  useEffect(() => {
    if (!mouseInCard && !mouseInFlowchart && !mouseInBridge && !browsingMode && flowchartCompany) {
      scheduleHide();
    }
  }, [mouseInCard, mouseInFlowchart, mouseInBridge, browsingMode, flowchartCompany, scheduleHide]);

  const handleCardMouseEnter = (call: CallItem, e: React.MouseEvent) => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    cancelHide();
    setMouseInCard(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    showTimerRef.current = setTimeout(() => {
      showFlowchart(call.company, rect);
    }, 300);
  };

  const handleCardMouseLeave = () => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    setMouseInCard(false);
  };

  const closeFlowchart = useCallback(() => {
    setFlowchartCompany(null);
    setFlowchartRect(null);
    setBrowsingMode(false);
    setMouseInCard(false);
    setMouseInFlowchart(false);
    setMouseInBridge(false);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const flowchartLeft = flowchartRect ? flowchartRect.right + 12 : 0;

  return (
    <>
      <div
        className={cn(
          "h-screen border-r border-border bg-card overflow-hidden transition-all duration-300 ease-in-out flex-col",
          collapsed ? "w-[56px] min-w-[56px] hidden sm:flex" : "w-[280px] min-w-[280px] max-w-full hidden sm:flex",
        )}
      >
        {collapsed ? (
          <>
            <div className="flex justify-center p-3 border-b border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onToggle}>
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1.5">
              {calls.map((call) => {
                const evalData = evaluations[call.id];
                return (
                  <button
                    key={call.id}
                    onClick={() => onSelect(call.id)}
                    className={cn(
                      "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[13px] font-semibold",
                      selectedId === call.id
                        ? "bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border border-[hsl(var(--forskale-teal)/0.3)]"
                        : "text-foreground hover:bg-accent",
                    )}
                    title={call.title}
                  >
                    {call.id}
                    {evalData?.status === "evaluated" && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-great" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-sm font-heading font-bold text-foreground tracking-tight">Call History</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 text-muted-foreground hover:text-foreground relative",
                    filtersOpen && "bg-accent text-foreground",
                  )}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 px-1.5 items-center justify-center rounded-full bg-[hsl(var(--forskale-teal))] text-[9px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onToggle}>
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Filter Panel - 2-col grid */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                filtersOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="px-3 py-3 bg-accent/50 border-b border-border">
                <div className="grid grid-cols-2 gap-2">
                  <FilterDropdown
                    label="Stage"
                    options={ALL_STAGES}
                    selected={selectedStages}
                    onChange={setSelectedStages}
                    multi
                    openKey="stage"
                    activeKey={activeDropdown}
                    onOpen={setActiveDropdown}
                  />
                  <FilterDropdown
                    label="Company"
                    options={companies}
                    selected={selectedCompany}
                    onChange={setSelectedCompany}
                    searchable
                    openKey="company"
                    activeKey={activeDropdown}
                    onOpen={setActiveDropdown}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <FilterDropdown
                    label="Product"
                    options={products}
                    selected={selectedProduct}
                    onChange={setSelectedProduct}
                    searchable
                    openKey="product"
                    activeKey={activeDropdown}
                    onOpen={setActiveDropdown}
                  />
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex h-9 items-center justify-center gap-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Call List grouped by date */}
            <div className="flex-1 overflow-y-auto atlas-scrollbar px-2 py-2">
              {filteredCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Filter className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No results found</p>
                  <button onClick={clearFilters} className="text-[10px] text-[hsl(var(--forskale-teal))] mt-1 hover:underline">
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dateGroups.map((group) => {
                    const isCollapsed = collapsedDates.has(group.date);
                    return (
                      <div key={group.date}>
                        <button
                          onClick={() => toggleDateGroup(group.date)}
                          className="sticky top-0 z-10 flex w-full items-center gap-2 rounded-md bg-accent px-2.5 py-1.5 mb-1 transition-colors hover:bg-accent/80"
                        >
                          <div className="w-[2px] h-4 rounded-full bg-[hsl(var(--forskale-teal))]" />
                          <span className="text-[11px] font-bold text-foreground flex-1 text-left">{group.label}</span>
                          <span className="text-[9px] text-muted-foreground mr-1">{group.calls.length}</span>
                          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isCollapsed && "-rotate-90")} />
                        </button>

                        <div className={cn("space-y-1 overflow-hidden transition-all duration-300", isCollapsed && "max-h-0 opacity-0")}>
                          {group.calls.map((call) => {
                            const evalData = evaluations[call.id];
                            const sourceInfo = SOURCE_ICON[call.dataSource];
                            const SourceIcon = sourceInfo.icon;

                            return (
                              <button
                                key={call.id}
                                onClick={() => onSelect(call.id)}
                                onMouseEnter={(e) => handleCardMouseEnter(call, e)}
                                onMouseLeave={handleCardMouseLeave}
                                className={cn(
                                  "w-full relative flex flex-col px-3 py-2.5 rounded-lg text-left transition-all group",
                                  selectedId === call.id
                                    ? "bg-[hsl(var(--forskale-teal)/0.06)] border border-[hsl(var(--forskale-teal)/0.3)] shadow-sm"
                                    : "border border-transparent hover:bg-accent hover:border-border",
                                )}
                              >
                                {selectedId === call.id && (
                                  <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[hsl(var(--forskale-teal))]" />
                                )}
                                <div className="flex items-start justify-between pl-1 gap-1">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-semibold text-foreground truncate">{call.title}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <Badge
                                        variant="outline"
                                        className={cn("text-[8px] h-3.5 px-1 border", STAGE_BG_COLORS[call.negotiationStage], STAGE_TEXT_COLORS[call.negotiationStage])}
                                      >
                                        {call.negotiationStage}
                                      </Badge>
                                      <span className={cn("flex items-center gap-0.5 text-[9px]", sourceInfo.color)}>
                                        <SourceIcon className="h-2.5 w-2.5" />
                                      </span>
                                      <span className="text-[9px] text-muted-foreground">{call.duration}</span>
                                    </div>
                                  </div>
                                  {evalData && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[8px] h-4 ml-1 shrink-0",
                                        evalData.status === "evaluated"
                                          ? "border-[hsl(var(--forskale-green)/0.3)] text-status-great bg-[hsl(var(--badge-green-bg))]"
                                          : "border-[hsl(var(--forskale-cyan)/0.3)] text-[hsl(var(--forskale-cyan))] bg-[hsl(var(--badge-cyan-bg))]",
                                      )}
                                    >
                                      {evalData.status === "evaluated" ? "Evaluated" : "Pending"}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 pl-1 mt-1">
                                  <span className="text-[9px] text-muted-foreground">{call.company}</span>
                                  {evalData?.status === "evaluated" && evalData.actionCount > 0 && (
                                    <span className="text-[9px] text-[hsl(var(--forskale-teal))] font-medium">
                                      {evalData.actionCount} actions
                                    </span>
                                  )}
                                  {evalData?.progression && (
                                    <span className="text-[9px] text-muted-foreground">{evalData.progression}</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bridge element */}
      {flowchartCompany && flowchartRect && !browsingMode && (
        <FlowchartBridge
          cardRect={flowchartRect}
          flowchartLeft={flowchartLeft}
          onMouseEnter={() => { setMouseInBridge(true); cancelHide(); }}
          onMouseLeave={() => setMouseInBridge(false)}
        />
      )}

      {/* N8N-style flowchart overlay */}
      {flowchartCompany && flowchartRect && (
        <MeetingFlowchart
          company={flowchartCompany}
          calls={calls}
          currentCallId={selectedId}
          anchorRect={flowchartRect}
          onSelectCall={onSelect}
          onClose={closeFlowchart}
          browsingMode={browsingMode}
          onEnterBrowsingMode={() => setBrowsingMode(true)}
          onMouseEnter={() => { setMouseInFlowchart(true); cancelHide(); }}
          onMouseLeave={() => setMouseInFlowchart(false)}
          callEvaluations={evaluations}
        />
      )}
    </>
  );
};

export default CallListSidebar;
