import { useState, useEffect, memo } from "react";
import {
  X, Check, AlertTriangle, Brain, Award,
  Target, Users, BookOpen, TrendingUp, Zap,
  Calendar, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  PlaybookAnalysis, MethodologyScore, ExtractedElement,
} from "@/data/playbookAnalysisData";

interface DetailedAnalysisDashboardProps {
  analysis: PlaybookAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

type CoachingTab = "snapshot" | "well" | "practice";

// --- Helpers ---
const getScoreColor = (score: number) => {
  if (score >= 70) return "text-status-great";
  if (score >= 40) return "text-status-okay";
  return "text-status-needs-work";
};

const AnimatedNumber = ({ target, duration = 800 }: { target: number; duration?: number }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{value}</>;
};

// --- Label mappings ---
const skillLabels: Record<string, string> = {
  "Metrics": "Found the pain",
  "Economic Buyer": "Found the buyer",
  "Decision Criteria": "Knows what they care about",
  "Decision Process": "Mapped the process",
  "Identify Pain": "Uncovered the pain",
  "Champion": "Internal champion",
};

const skillDescriptions: Record<string, { good: string; bad: string }> = {
  "Metrics": { good: "You quantified the business impact clearly", bad: "Quantify the business impact with specific numbers" },
  "Economic Buyer": { good: "You identified the key decision-maker", bad: "Ask who controls the budget early on" },
  "Decision Criteria": { good: "You uncovered what matters to them", bad: "Ask what criteria they'll evaluate against" },
  "Decision Process": { good: "You mapped their buying process", bad: "Clarify the steps to a purchasing decision" },
  "Identify Pain": { good: "You masterfully uncovered key pain points", bad: "Dig deeper into their core challenges" },
  "Champion": { good: "You found an internal advocate", bad: "Identify someone who will champion your solution internally" },
};

const approachLabels: Record<string, string> = {
  "MEDDIC": "Qualification",
  "Discovery Call": "Discovery",
  "BANT": "Needs analysis",
  "SPICED": "Urgency building",
  "CHAMP": "Challenge-led",
  "SPIN": "Question flow",
  "GPCT": "Goal alignment",
  "Demo Call": "Demo structure",
};

// --- Tab 1: Snapshot ---
const SnapshotTab = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const score = Math.round(analysis.consensusScore);
  const sorted = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore);
  const top = sorted[0];
  const elements = top.elementsDetected.slice(0, 6);
  const missed = elements.filter(e => !e.detected);
  const lowestMissed = missed[0];

  const scoreLabel = score >= 80 ? "Strong call" : score >= 60 ? "Good call" : "Needs work";

  const radius = 60;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  const teamAvg = 67;
  const top10 = 85;

  return (
    <div className="space-y-5">
      {/* 1a: Score band */}
      <div className="bg-secondary rounded-xl p-5 flex items-center gap-5 flex-wrap">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative w-[72px] h-[42px]">
            <svg viewBox="0 0 132 76" className="w-full h-full">
              <path d="M 6 70 A 60 60 0 0 1 126 70" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M 6 70 A 60 60 0 0 1 126 70"
                fill="none"
                className={cn(
                  score >= 70 ? "stroke-[hsl(var(--forskale-green))]" : score >= 40 ? "stroke-[hsl(var(--forskale-cyan))]" : "stroke-status-needs-work"
                )}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                style={{ transition: "stroke-dasharray 1.2s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-0">
              <span className={cn("text-lg font-bold font-heading tabular-nums", getScoreColor(score))}>
                <AnimatedNumber target={score} />
              </span>
            </div>
          </div>
          <span className={cn("text-xs font-semibold", getScoreColor(score))}>{scoreLabel}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed">
            Strong discovery call with clear next steps and good pain identification.
            {lowestMissed && (
              <>
                {" "}You missed identifying the <strong>{(skillLabels[lowestMissed.name] || lowestMissed.name).toLowerCase()}</strong>.
              </>
            )}
          </p>
          {lowestMissed && (
            <Badge className="mt-2 bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
              ❌ Gap: {skillLabels[lowestMissed.name] || lowestMissed.name}
            </Badge>
          )}
        </div>
      </div>

      {/* 1b: Skills grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {elements.map((el) => {
          const label = skillLabels[el.name] || el.name;
          const desc = skillDescriptions[el.name];
          return (
            <div
              key={el.elementId}
              className={cn(
                "rounded-xl border p-3.5",
                el.detected
                  ? "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.05)]"
                  : "border-destructive/20 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {el.detected ? (
                  <Check className="h-4 w-4 text-status-great shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className="text-xs font-semibold text-foreground">{label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {el.detected ? desc?.good : desc?.bad}
              </p>
            </div>
          );
        })}
      </div>

      {/* 1c: Sales approaches — horizontal scrolling pills */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2.5 min-w-max">
          {sorted.map((m, i) => {
            const plainName = approachLabels[m.name] || m.name;
            const isTop = i < 2;
            const isMiddle = i >= 2 && i < 4;
            return (
              <div
                key={m.frameworkId}
                className={cn(
                  "rounded-lg border px-3.5 py-2.5 min-w-[120px] flex flex-col gap-1.5",
                  isTop
                    ? "border-[hsl(var(--forskale-teal)/0.4)] bg-[hsl(var(--forskale-teal)/0.08)]"
                    : "border-border bg-card"
                )}
                title={m.name}
              >
                <span className={cn(
                  "text-xs font-semibold",
                  isTop ? "text-[hsl(var(--forskale-teal))]" : "text-foreground"
                )}>
                  {plainName}
                </span>
                <div className="h-[3px] w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isTop
                        ? "bg-[hsl(var(--forskale-teal))]"
                        : isMiddle
                          ? "bg-amber-400"
                          : "bg-muted-foreground/30"
                    )}
                    style={{ width: `${m.overallScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    isTop ? "text-[hsl(var(--forskale-teal))]" : "text-muted-foreground"
                  )}>
                    {m.overallScore}%
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">{m.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1d: 3 action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold text-foreground">Send within 24h</span>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            "Hi Marco, thanks for our call. I'll send the ROI calculator and connect you with our implementation team for the phased rollout discussion."
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--forskale-blue)/0.2)] bg-[hsl(var(--forskale-blue)/0.04)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-[hsl(var(--forskale-blue))]" />
            <span className="text-xs font-bold text-foreground">Prep next meeting</span>
          </div>
          <div className="space-y-1 text-[11px] text-foreground/80">
            <p>• Send ROI calculator</p>
            <p>• Include finance person</p>
            <p>• Schedule early next month</p>
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-2">
            💡 Research their finance team on LinkedIn first
          </p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-[hsl(var(--forskale-teal)/0.04)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
            <span className="text-xs font-bold text-foreground">Practice one thing</span>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            Try asking: <em className="text-[hsl(var(--forskale-teal))]">"Who else typically gets involved in decisions like this?"</em> to find the internal champion.
          </p>
        </div>
      </div>

      {/* 1e: How you compare */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
          <span className="text-sm font-bold font-heading text-foreground">How you compare</span>
        </div>
        <div className="space-y-3">
          {[
            { label: "You", value: score, highlight: true },
            { label: "Team average", value: teamAvg, highlight: false },
            { label: "Top 10%", value: top10, highlight: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className={cn("text-xs w-24", row.highlight ? "font-bold text-foreground" : "text-muted-foreground")}>{row.label}</span>
              <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    row.highlight
                      ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]"
                      : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${row.value}%` }}
                />
              </div>
              <span className={cn("text-xs font-bold tabular-nums w-10 text-right", row.highlight ? "text-status-great" : "text-muted-foreground")}>
                {row.value}%
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Week 1: 71% → Week 2: 75% → <span className="text-status-great font-semibold">This week: 79% ↗️</span>
        </p>
      </div>
    </div>
  );
});
SnapshotTab.displayName = "SnapshotTab";

// --- Tab 2: What you did well ---
const WellTab = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const top = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore)[0];
  const detected = top.elementsDetected.filter(e => e.detected);

  return (
    <div className="space-y-6">
      {/* Narrative bullet list */}
      <div>
        <h3 className="text-sm font-bold font-heading text-foreground mb-3">What you did in this call</h3>
        <div className="space-y-3">
          {detected.map((el) => {
            const desc = skillDescriptions[el.name];
            const label = skillLabels[el.name] || el.name;
            return (
              <div key={el.elementId} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-teal))] mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">
                    You {label.toLowerCase()} — {desc?.good?.toLowerCase() || "successfully addressed this"}
                    {el.transcriptReferences.length > 0 && (
                      <span className="text-[hsl(var(--forskale-teal))]"> at {el.transcriptReferences[0]}</span>
                    )}
                  </p>
                  {el.transcriptReferences.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      📍 {el.transcriptReferences.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unique techniques — compact */}
      <div>
        <h3 className="text-sm font-bold font-heading text-foreground mb-3">Unique techniques</h3>
        <div className="space-y-3">
          {analysis.customElements.map((el) => (
            <div key={el.id} className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-[hsl(var(--forskale-teal)/0.03)] p-4">
              <p className="text-xs font-semibold text-foreground mb-1">{el.name}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">What you did:</span> {el.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
WellTab.displayName = "WellTab";

// --- Tab 3: What to practice ---
const PracticeTab = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const top = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore)[0];
  const missed = top.elementsDetected.filter(e => !e.detected);
  const lowScorers = top.elementsDetected
    .filter(e => e.detected)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const mainMissed = missed[0];

  return (
    <div className="space-y-5">
      {/* Main missed item */}
      {mainMissed && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/20 p-5">
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] mb-3 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700">
            Most impact
          </Badge>
          <h3 className="text-base font-bold text-foreground mb-2">
            {skillLabels[mainMissed.name] || mainMissed.name}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {skillDescriptions[mainMissed.name]?.bad || "This was not covered during the call."}
            {" "}Finding an internal champion early means someone inside the company is selling for you when you're not in the room. 
            In this call, Marco mentioned bringing finance into the next discussion — that's your opening to ask who else cares about this problem.
          </p>
          <div className="rounded-lg border border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.06)] p-3">
            <p className="text-xs font-semibold text-[hsl(var(--forskale-teal))] mb-1">💡 Try this next time</p>
            <p className="text-sm text-foreground italic">
              "Who else on your team would benefit from seeing the results of this? I'd love to include them early."
            </p>
          </div>
        </div>
      )}

      {/* Improve items */}
      {lowScorers.map((el) => {
        const label = skillLabels[el.name] || el.name;
        const desc = skillDescriptions[el.name];
        return (
          <div key={el.elementId} className="rounded-xl border border-border bg-card p-4">
            <Badge variant="outline" className="text-[10px] mb-2 border-[hsl(var(--forskale-cyan)/0.3)] text-[hsl(var(--forskale-cyan))]">
              Improve
            </Badge>
            <h4 className="text-sm font-semibold text-foreground mb-1">{label}</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
              You touched on this but could go deeper. {desc?.bad || "Try to explore this area more thoroughly."}
            </p>
            <p className="text-[11px] text-[hsl(var(--forskale-teal))]">
              💡 {el.name === "Decision Criteria"
                ? "Ask: \"What are the top 3 things you'll evaluate us on?\""
                : el.name === "Metrics"
                  ? "Ask: \"How much time or money does this cost your team weekly?\""
                  : "Ask: \"What does success look like for you in 6 months?\""
              }
            </p>
          </div>
        );
      })}
    </div>
  );
});
PracticeTab.displayName = "PracticeTab";

// --- Main Dashboard ---
const DetailedAnalysisDashboard = ({ analysis, isOpen, onClose }: DetailedAnalysisDashboardProps) => {
  const [activeTab, setActiveTab] = useState<CoachingTab>("snapshot");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs: { id: CoachingTab; label: string }[] = [
    { id: "snapshot", label: "Snapshot" },
    { id: "well", label: "What you did well" },
    { id: "practice", label: "What to practice" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-[90vw] h-[90vh] max-w-[1400px] animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-foreground">Call coaching</h2>
              <p className="text-[11px] text-muted-foreground">Discovery Call with TechVision Inc. • Jan 15, 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)] text-[10px]">
              Analysis complete
            </Badge>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-all border-b-2",
                activeTab === tab.id
                  ? "border-[hsl(var(--forskale-teal))] text-[hsl(var(--forskale-teal))]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto atlas-scrollbar p-6">
          {activeTab === "snapshot" && <SnapshotTab analysis={analysis} />}
          {activeTab === "well" && <WellTab analysis={analysis} />}
          {activeTab === "practice" && <PracticeTab analysis={analysis} />}
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisDashboard;
