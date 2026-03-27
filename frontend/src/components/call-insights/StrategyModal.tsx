import { X, Target, Sparkles, MessageSquare, Lightbulb, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { meetingsAPI } from "@/lib/api";
import type { NextMeetingStrategy } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId?: string;
}

const StrategyModal = ({ isOpen, onClose, meetingId }: StrategyModalProps) => {
  const [strategy, setStrategy] = useState<NextMeetingStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !meetingId) return;
    setLoading(true);
    setError(null);
    meetingsAPI.getNextMeetingStrategy(meetingId)
      .then((res) => {
        setStrategy((res as any).data as NextMeetingStrategy);
      })
      .catch(() => {
        setError("Could not generate strategy. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, meetingId]);

  const handleRefresh = () => {
    if (!meetingId) return;
    setLoading(true);
    setError(null);
    meetingsAPI.getNextMeetingStrategy(meetingId, { force_refresh: true })
      .then((res) => {
        setStrategy((res as any).data as NextMeetingStrategy);
      })
      .catch(() => {
        setError("Could not generate strategy. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  if (!isOpen) return null;

  const hasData = strategy && strategy.source !== "none" && (strategy.objective || strategy.key_talking_points?.length > 0);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />

      <div
        className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-modal-title"
      >
        <div className="bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] p-6 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors duration-200"
            aria-label="Close Strategy modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="strategy-modal-title" className="text-xl font-heading font-bold text-white">
                Strategize Next Meeting
              </h2>
              <p className="text-xs text-white/70">AI-powered preparation guide based on this conversation</p>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-y-auto atlas-scrollbar flex-1 p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Sparkles className="h-8 w-8 text-[hsl(var(--forskale-teal))] animate-pulse" />
              <p className="text-sm text-muted-foreground">Generating your strategy...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary hover:bg-accent transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          )}

          {!loading && !error && !meetingId && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Target className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Select a meeting to generate strategy.</p>
            </div>
          )}

          {!loading && !error && meetingId && !hasData && strategy && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Target className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No transcript available to generate strategy. Record a meeting first.</p>
            </div>
          )}

          {!loading && !error && hasData && strategy && (
            <>
              {strategy.objective && (
                <div className="rounded-lg bg-[hsl(var(--forskale-teal)/0.06)] border border-[hsl(var(--forskale-teal)/0.2)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Target className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meeting Objective</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{strategy.objective}</p>
                </div>
              )}

              {strategy.opening_script && (
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[hsl(var(--forskale-purple))]" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Opening Script</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{strategy.opening_script}"</p>
                </div>
              )}

              {strategy.key_talking_points?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Key Talking Points</span>
                  </div>
                  <div className="space-y-2">
                    {strategy.key_talking_points.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {strategy.objection_handling?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Objection Handling</span>
                  </div>
                  <div className="space-y-2">
                    {strategy.objection_handling.map((item, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-3">
                        <p className="text-xs font-semibold text-destructive mb-1">"{item.objection}"</p>
                        <p className="text-xs text-foreground leading-relaxed">→ {item.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {strategy.closing_move && (
                <div className="rounded-lg bg-[hsl(var(--forskale-green)/0.06)] border border-[hsl(var(--forskale-green)/0.2)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-status-great" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Closing Move</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{strategy.closing_move}</p>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleRefresh}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md border border-border hover:bg-accent transition-colors",
                    loading && "opacity-50 pointer-events-none"
                  )}
                >
                  <RefreshCw className="h-3 w-3" /> Refresh strategy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;
