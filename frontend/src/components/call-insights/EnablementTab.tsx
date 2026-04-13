import { TrendingUp, ThumbsUp, Zap, Sparkles, GraduationCap, MessageSquare, BookOpen } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/meetInsight/LanguageContext";

import { mockMetrics, mockCoachWell, mockCoachImprove } from "@/data/mockData";
import type { PerformanceMetric, CoachFeedback } from "@/data/mockData";
import PlaybookTab from "./PlaybookTab";
import PlaybookAnalysisLoader from "./PlaybookAnalysisLoader";
import { useEnablementState } from "@/hooks/useEnablementState";
import type { MeetingFeedback, MeetingPlaybookAnalysis } from "@/lib/api";

type SubTab = "feedback" | "analyze";

const statusColor = (rating: string) => {
  if (rating === "Great!") return "text-[hsl(var(--forskale-purple))]";
  if (rating === "Okay") return "text-[hsl(var(--forskale-cyan))]";
  return "text-destructive";
};

const MetricCard = ({ label, rating, detail }: { label: string; rating: string; detail: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-300 shadow-card hover:border-[hsl(var(--forskale-purple)/0.4)] hover:shadow-card-md hover:-translate-y-0.5",
        expanded && "border-[hsl(var(--forskale-purple)/0.4)] bg-[hsl(var(--forskale-purple)/0.03)] shadow-card-md",
      )}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[80px]">
        <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
        <span className={cn("text-base font-bold font-heading", statusColor(rating))}>{rating}</span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  );
};

// Map API status_level → display rating
function mapStatusToRating(statusLevel?: string, status?: string): PerformanceMetric["rating"] {
  if (statusLevel === "great") return "Great!";
  if (statusLevel === "ok") return "Okay";
  if (statusLevel === "poor") return "Needs work";
  // Fallback: try to guess from status text
  if (status) {
    const s = status.toLowerCase();
    if (s.includes("great") || s.includes("excellent") || s.includes("good")) return "Great!";
    if (s.includes("okay") || s.includes("fair") || s.includes("moderate")) return "Okay";
  }
  return "Okay";
}

interface FeedbackContentProps {
  feedback?: MeetingFeedback | null;
}

const FeedbackContent = ({ feedback }: FeedbackContentProps) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const t = useT();

  // Build metrics from real data if available, else use mock
  const metrics: PerformanceMetric[] = feedback?.metrics && feedback.metrics.length > 0
    ? feedback.metrics.map(m => ({
        label: m.label,
        rating: mapStatusToRating(m.status_level, m.status),
        value: m.value || "",
        description: m.detail || m.value || "",
      }))
    : mockMetrics;

  // Build coach feedback from real data if available, else use mock
  const coachWell: CoachFeedback[] = feedback?.did_well && feedback.did_well.length > 0
    ? feedback.did_well.map(b => ({ title: b.title, description: b.details || "" }))
    : mockCoachWell;

  const coachImprove: CoachFeedback[] = feedback?.improve && feedback.improve.length > 0
    ? feedback.improve.map(b => ({ title: b.title, description: b.details || "" }))
    : mockCoachImprove;

  return (
    <div className="space-y-8">
      {/* Performance Metrics */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <TrendingUp className="h-4 w-4 text-[hsl(var(--forskale-purple))]" />
          <h3 className="text-[15px] font-heading font-bold text-foreground">{t("enablement.metrics")}</h3>
          {feedback?.quality_score != null && (
            <span className="ml-auto text-xs font-semibold text-[hsl(var(--forskale-purple))]">
              {Math.round(feedback.quality_score)}% quality
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} label={m.label} rating={m.rating} detail={m.value || m.description} />
          ))}
        </div>
      </section>

      {/* AI Coach — two columns */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="h-4 w-4 text-[hsl(var(--forskale-purple))]" />
          <h3 className="text-[15px] font-heading font-bold text-foreground">{t("enablement.aiCoach")}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Areas for Improvement */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-destructive" />
              <span className="text-sm font-semibold text-foreground">{t("enablement.improve")}</span>
            </div>
            <div className="space-y-3">
              {coachImprove.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="rounded-xl border border-[hsl(var(--forskale-green)/0.2)] bg-[hsl(var(--forskale-green)/0.05)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="h-3.5 w-3.5 text-status-great" />
              <span className="text-sm font-semibold text-foreground">{t("enablement.strengths")}</span>
            </div>
            <div className="space-y-3">
              {coachWell.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <span className="text-[10px] text-status-great font-medium">{t("enablement.improving")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracking */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-heading font-bold text-foreground">{t("enablement.progress")}</h3>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {([["7d", t("enablement.last7")], ["30d", t("enablement.last30")], ["all", t("enablement.allTime")]] as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as "7d" | "30d" | "all")}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium rounded-md transition-all",
                  timeRange === key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">{t("enablement.progressSoon")}</p>
        </div>
      </section>
    </div>
  );
};

interface EnablementTabProps {
  meetingId?: string;
  feedback?: MeetingFeedback | null;
  playbookAnalysis?: MeetingPlaybookAnalysis | null;
  meetingCount?: number;
  onRequestAnalysis?: () => Promise<void>;
}

const EnablementTab = ({
  meetingId = "default",
  feedback,
  playbookAnalysis,
  meetingCount,
  onRequestAnalysis,
}: EnablementTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("feedback");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);
  const { state, startAnalysis, completeAnalysis } = useEnablementState(meetingId);
  const isPristine = state === "pristine";
  const isLoading = state === "loading";
  const isComplete = state === "complete";
  const t = useT();

  // If real playbook data exists, auto-mark complete
  const hasRealPlaybook = !!(playbookAnalysis?.rules && playbookAnalysis.rules.length > 0);

  // Mark loaded when playbookAnalysis arrives
  useEffect(() => {
    if (playbookAnalysis) {
      setAnalysisLoaded(true);
    }
  }, [playbookAnalysis]);

  const handleAnalysisClick = async () => {
    if (analysisLoaded || analysisLoading) return;
    setActiveSubTab("analyze");
    setAnalysisLoading(true);
    try {
      if (onRequestAnalysis) {
        await onRequestAnalysis();
      } else if (isPristine && !hasRealPlaybook) {
        startAnalysis();
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleReanalyze = useCallback(() => {
    startAnalysis();
  }, [startAnalysis]);

  const handleLoaderComplete = useCallback(() => {
    completeAnalysis();
  }, [completeAnalysis]);

  const showPlaybook = isComplete || hasRealPlaybook;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[hsl(var(--badge-purple-bg))] flex items-center justify-center">
          <GraduationCap className="h-4.5 w-4.5 text-[hsl(var(--forskale-purple))]" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-foreground">{t("enablement.title")}</h2>
          <p className="text-xs text-muted-foreground">
            {meetingCount
              ? `Based on ${meetingCount} meeting${meetingCount !== 1 ? "s" : ""} this month`
              : t("enablement.subtitle")}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4 mb-2">
        {/* Feedback button */}
        <button
          onClick={() => setActiveSubTab("feedback")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeSubTab === "feedback"
              ? "forskale-gradient-bg text-white shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </button>

        {/* Analysis button */}
        <button
          onClick={handleAnalysisClick}
          disabled={analysisLoaded || analysisLoading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            analysisLoaded
              ? "bg-[hsl(var(--forskale-purple)/0.1)] text-[hsl(var(--forskale-purple))] border border-[hsl(var(--forskale-purple)/0.3)] cursor-default"
              : activeSubTab === "analyze"
              ? "bg-[hsl(var(--forskale-purple))] text-white shadow-sm"
              : "bg-[hsl(var(--forskale-purple)/0.08)] text-[hsl(var(--forskale-purple))] border border-[hsl(var(--forskale-purple)/0.2)] hover:bg-[hsl(var(--forskale-purple)/0.15)]",
            (analysisLoaded || analysisLoading) && "disabled:opacity-70 disabled:pointer-events-none"
          )}
        >
          {analysisLoaded ? (
            <BookOpen className="h-4 w-4" />
          ) : analysisLoading ? (
            <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '1.5s' }} />
          ) : (
            <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
          )}
          Analysis
        </button>
      </div>

      {/* Sub-tab content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === "feedback" && <FeedbackContent feedback={feedback} />}
        {activeSubTab === "analyze" && !analysisLoading && (
          <PlaybookTab
            forceComplete={showPlaybook}
            playbookAnalysis={playbookAnalysis}
            onReanalyze={handleReanalyze}
          />
        )}
      </div>

      {/* Analysis loading modal (triggered by new Analysis button) */}
      <PlaybookAnalysisLoader
        isOpen={analysisLoading}
        onComplete={() => { setAnalysisLoading(false); setAnalysisLoaded(true); }}
      />

      {/* Legacy loader for useEnablementState flow */}
      <PlaybookAnalysisLoader
        isOpen={isLoading}
        onComplete={handleLoaderComplete}
      />
    </div>
  );
};

export default EnablementTab;
