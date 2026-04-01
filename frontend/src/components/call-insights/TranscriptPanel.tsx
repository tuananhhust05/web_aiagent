import { Search, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TranscriptEntry } from "@/data/mockData";
import { Button } from "@/components/ui/button";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
  collapsed: boolean;
  onToggle: () => void;
  meetingId?: string;
  isNewTranscript?: boolean;
}

const TranscriptPanel = ({ entries, collapsed, onToggle, meetingId = "1", isNewTranscript = true }: TranscriptPanelProps) => {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showGlow, setShowGlow] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expandedKey = `transcript_expanded_${meetingId}`;

  const keywords = ["budget", "timeline", "visibility", "efficiency", "challenges", "ROI", "decision maker"];

  // Initialize glow and badge on mount
  useEffect(() => {
    const wasExpanded = sessionStorage.getItem(expandedKey);
    if (!wasExpanded && isNewTranscript) {
      setShowGlow(true);
      setShowNewBadge(true);
      // Auto-stop glow after 10 seconds
      glowTimerRef.current = setTimeout(() => setShowGlow(false), 10000);
    }
    return () => {
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, [meetingId, isNewTranscript]);

  const handleExpand = useCallback(() => {
    onToggle();
    setShowGlow(false);
    setShowNewBadge(false);
    setHasExpanded(true);
    sessionStorage.setItem(expandedKey, "true");
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    // Focus search after expand animation
    setTimeout(() => searchRef.current?.focus(), 350);
  }, [onToggle, expandedKey]);

  const handleCollapse = useCallback(() => {
    onToggle();
    sessionStorage.setItem(expandedKey, "false");
  }, [onToggle, expandedKey]);

  // ESC to collapse
  useEffect(() => {
    if (collapsed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCollapse();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed, handleCollapse]);

  const handleTagClick = (tag: string) => {
    if (activeTag === tag) {
      setActiveTag(null);
      setSearch("");
    } else {
      setActiveTag(tag);
      setSearch(tag);
    }
  };

  const filtered = search
    ? entries.filter(
        (e) =>
          e.text.toLowerCase().includes(search.toLowerCase()) || e.speaker.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  return (
    <div
      className={cn(
        "h-screen border-l border-border bg-card flex flex-col overflow-hidden",
        collapsed ? "w-[56px] min-w-[56px]" : "w-[340px] min-w-[340px]",
      )}
      style={{ transition: "width 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
      role="complementary"
      aria-label="Meeting transcript"
    >
      {collapsed ? (
        <>
          {/* Collapsed: glowing expand button */}
          <div className="flex justify-center p-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-[hsl(var(--forskale-teal))]",
                  showGlow && "transcript-glow-active"
                )}
                style={showGlow ? { animation: "transcript-glow 2s ease-in-out infinite" } : undefined}
                onClick={handleExpand}
                aria-expanded="false"
                aria-label={showNewBadge ? "Open transcript - newly generated" : "Open transcript panel"}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
              {/* NEW badge */}
              {showNewBadge && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 bg-[hsl(var(--forskale-teal))] text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                  NEW
                </span>
              )}
            </div>
          </div>

          {/* Collapsed: vertical label and media icons */}
          <div className="flex-1 flex flex-col items-center gap-5 pt-4">
            <span
              className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase"
              style={{ writingMode: "vertical-rl" }}
            >
              Transcript
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Header with controls - staggered reveal */}
          <div className={cn("p-4 border-b border-border", hasExpanded && "transcript-header-reveal")}>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-[hsl(var(--forskale-teal))]"
                onClick={handleCollapse}
                aria-expanded="true"
                aria-label="Collapse transcript panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
            </div>
          </div>

          {/* Search - staggered reveal */}
          <div className={cn("px-4 pb-3 pt-3", hasExpanded && "transcript-search-reveal")}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchRef}
                placeholder="Search transcript"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveTag(null); }}
                className="pl-8 h-8 text-xs bg-secondary border-border focus:border-[hsl(var(--forskale-teal))] focus:ring-[hsl(var(--forskale-teal)/0.1)]"
              />
            </div>
          </div>

          {/* Keyword Tags - staggered reveal */}
          <div className={cn("flex gap-2 flex-wrap px-4 py-3 border-b border-border", hasExpanded && "transcript-search-reveal")}>
            {keywords.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                  activeTag === tag
                    ? "bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal)/0.3)]"
                    : "bg-secondary text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Transcript entries - staggered reveal */}
          <div className={cn("flex-1 overflow-y-auto atlas-scrollbar p-4 space-y-5", hasExpanded && "transcript-messages-reveal")}>
            {filtered.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1.5 shrink-0">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      entry.color === "blue" ? "bg-[hsl(var(--forskale-green))]" : "bg-[hsl(var(--forskale-cyan))]",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-foreground">{entry.speaker}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Screen reader live region */}
      <div className="sr-only" aria-live="polite">
        {collapsed ? "Transcript panel collapsed" : "Transcript panel expanded"}
      </div>
    </div>
  );
};

export default TranscriptPanel;
