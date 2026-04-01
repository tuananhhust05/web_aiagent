import { TrendingUp, ThumbsUp, Zap, Sparkles, GraduationCap, MessageSquare, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mockMetrics, mockCoachWell, mockCoachImprove } from "@/data/mockData";
import PlaybookTab from "./PlaybookTab";
import { meetingsAPI } from "@/lib/api";
import type { MeetingFeedback, MeetingPlaybookAnalysis } from "@/lib/api";

type SubTab = "feedback" | "playbook";

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

type ProgressDay = {
  date: string;
  label: string;
  score_pct: number | null;
  count: number;
  speech_pace_wpm?: number | null;
  talk_ratio_pct?: number | null;
};

const ScoreBar = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => (
  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
    <div
      className={cn("h-full rounded-full transition-all duration-700", color)}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

const ProgressChart = ({ days }: { days: ProgressDay[] }) => {
  if (!days.length) return null;
  const maxScore = 100;
  return (
    <div className="space-y-3">
      {days.map((d, i) => {
        const score = d.score_pct;
        const pace = d.speech_pace_wpm;
        const color = score == null ? "bg-muted-foreground/30"
          : score >= 70 ? "bg-[hsl(var(--forskale-green))]"
          : score >= 40 ? "bg-[hsl(var(--forskale-cyan))]"
          : "bg-destructive/60";
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-16 shrink-0 text-right">{d.label}</span>
            {score != null ? (
              <>
                <ScoreBar value={score} max={maxScore} color={color} />
                <span className={cn("text-xs font-bold w-10 shrink-0 tabular-nums",
                  score >= 70 ? "text-status-great" : score >= 40 ? "text-[hsl(var(--forskale-cyan))]" : "text-destructive"
                )}>{score}%</span>
              </>
            ) : (
              <>
                <div className="flex-1 h-2 bg-secondary rounded-full" />
                <span className="text-[10px] text-muted-foreground w-10 shrink-0">—</span>
              </>
            )}
            {pace != null && (
              <span className="text-[10px] text-muted-foreground hidden md:inline shrink-0">{pace} wpm</span>
            )}
            {d.count > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0">{d.count} call{d.count > 1 ? "s" : ""}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const FeedbackContent = ({ feedback }: { feedback?: MeetingFeedback | null }) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const [progressDays, setProgressDays] = useState<ProgressDay[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    setLoadingProgress(true);
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    Promise.allSettled([
      meetingsAPI.getPlaybookScoresInsights({ days }),
      meetingsAPI.getSpeakingScoresInsights({ days }),
    ]).then(([playbookRes, speakingRes]) => {
      const playbookDays: Record<string, { score_pct: number | null; count: number }> = {};
      if (playbookRes.status === "fulfilled") {
        for (const d of (playbookRes.value as any).data?.days ?? []) {
          playbookDays[d.date] = { score_pct: d.score_pct, count: d.count };
        }
      }
      const speakingMap: Record<string, { speech_pace_wpm?: number | null; talk_ratio_pct?: number | null }> = {};
      if (speakingRes.status === "fulfilled") {
        for (const d of (speakingRes.value as any).data?.days ?? []) {
          speakingMap[d.date] = { speech_pace_wpm: d.speech_pace_wpm, talk_ratio_pct: d.talk_ratio_pct };
        }
      }
      const merged: ProgressDay[] = Object.keys(playbookDays).map((date) => {
        const pb = playbookDays[date];
        const sp = speakingMap[date] ?? {};
        const label = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return { date, label, score_pct: pb.score_pct, count: pb.count, ...sp };
      });
      merged.sort((a, b) => a.date.localeCompare(b.date));
      setProgressDays(merged.filter((d) => d.count > 0));
    }).finally(() => setLoadingProgress(false));
  }, [timeRange]);

  const metrics = feedback?.metrics?.length
    ? feedback.metrics.map((m) => ({
        label: m.label,
        rating: (m.status as "Great!" | "Okay" | "Needs work") ?? "Okay",
        detail: m.detail ?? m.value ?? "",
      }))
    : mockMetrics.map((m) => ({ label: m.label, rating: m.rating, detail: m.value || m.description }));

  const didWell = feedback?.did_well?.length
    ? feedback.did_well.map((b) => ({ title: b.title, description: b.details ?? "" }))
    : mockCoachWell;

  const improve = feedback?.improve?.length
    ? feedback.improve.map((b) => ({ title: b.title, description: b.details ?? "" }))
    : mockCoachImprove;

  return (
    <div className="space-y-8">
      {/* Performance Metrics */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <TrendingUp className="h-4 w-4 text-[hsl(var(--forskale-purple))]" />
          <h3 className="text-[15px] font-heading font-bold text-foreground">Your Performance Metrics</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} label={m.label} rating={m.rating} detail={m.detail} />
          ))}
        </div>
      </section>

      {/* AI Coach — two columns */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="h-4 w-4 text-[hsl(var(--forskale-purple))]" />
          <h3 className="text-[15px] font-heading font-bold text-foreground">AI Coach Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Areas for Improvement */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-destructive" />
              <span className="text-sm font-semibold text-foreground">Where You Can Improve</span>
            </div>
            <div className="space-y-3">
              {improve.map((item, i) => (
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
              <span className="text-sm font-semibold text-foreground">Your Strengths</span>
            </div>
            <div className="space-y-3">
              {didWell.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <span className="text-[10px] text-status-great font-medium">↑ improving</span>
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
          <h3 className="text-[15px] font-heading font-bold text-foreground">Your Progress Over Time</h3>
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
            {([["7d", "Last 7 days"], ["30d", "Last 30 days"], ["all", "All time"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
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
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          {loadingProgress ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading progress data...</p>
          ) : progressDays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No meeting data for this period yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-green))] inline-block" />≥70% Playbook</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-cyan))] inline-block" />40–69%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/60 inline-block" />&lt;40%</span>
              </div>
              <ProgressChart days={progressDays} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "playbook", label: "Playbook", icon: BookOpen },
];

interface EnablementTabProps {
  feedback?: MeetingFeedback | null;
  playbookAnalysis?: MeetingPlaybookAnalysis | null;
  meetingCount?: number;
}

const EnablementTab = ({ feedback, playbookAnalysis, meetingCount }: EnablementTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("feedback");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--badge-purple-bg))] flex items-center justify-center">
            <GraduationCap className="h-4.5 w-4.5 text-[hsl(var(--forskale-purple))]" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">Enablement & Skills Development</h2>
            <p className="text-xs text-muted-foreground">Your performance across all meetings</p>
          </div>
        </div>
        {meetingCount != null && meetingCount > 0 && (
          <Badge variant="outline" className="text-[11px] border-[hsl(var(--forskale-purple)/0.3)] text-[hsl(var(--forskale-purple))] bg-[hsl(var(--badge-purple-bg))]">
            Based on {meetingCount} meeting{meetingCount !== 1 ? "s" : ""} this month
          </Badge>
        )}
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === "feedback" && <FeedbackContent feedback={feedback} />}
        {activeSubTab === "playbook" && <PlaybookTab playbookAnalysis={playbookAnalysis} />}
      </div>
    </div>
  );
};

export default EnablementTab;
