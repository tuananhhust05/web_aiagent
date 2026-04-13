import { useState, useEffect } from "react";
import { Sparkles, Clock, AlertTriangle, CheckCircle2, Info, Trophy } from "lucide-react";
import { getBandByPct } from "@/lib/interestModel";
import { type PlaybookAnalysis } from "@/data/playbookAnalysisData";
import AdvancedAnalysisModal from "./AdvancedAnalysisModal";
import KeyMomentsSection from "./KeyMomentsSection";
import type { MeetingSmartSummary, MeetingInterestPulse } from "@/lib/api";

// ── Mock fallback data ──

const MOCK_INTEREST_PCT = 55;

const mockMeetingHistory = [
  { id: "m1", dateLabel: "Jan 10", interestPct: 15, outcome: "Initial outreach" },
  { id: "m2", dateLabel: "Jan 24", interestPct: 28, outcome: "First conversation" },
  { id: "m3", dateLabel: "Feb 8",  interestPct: 42, outcome: "Pain points identified" },
  { id: "m4", dateLabel: "Feb 22", interestPct: 55, outcome: "Solution presented" },
];

const mockChanges = [
  { topic: "Budget",           before: "CFO confirmed allocation",  now: "Need to check with finance team", direction: "risk"     as const },
  { topic: "Decision Authority", before: "Marco has signing authority", now: "Board needs to review",           direction: "risk"     as const },
  { topic: "Implementation",   before: "Concerned about complexity",   now: "Phased rollout accepted",         direction: "positive" as const },
];

const mockActions = [
  { priority: "CRITICAL"    as const, title: "Re-qualify Budget Authority",    why: "Budget status shifted from confirmed to uncertain",       timeline: "Schedule CFO call within 48 hours"      },
  { priority: "IMPORTANT"   as const, title: "Address Implementation Concerns", why: "Raised in 2 consecutive meetings without full resolution", timeline: "Send case study within 24 hours"         },
  { priority: "OPPORTUNITY" as const, title: "Engage Finance Team",              why: "Positive mention indicates buying intent",                timeline: "Prepare ROI materials this week"        },
];

// ── Analyze Meeting Button ──
const AnalyzeMeetingButton = ({ onClick }: { onClick: () => void }) => (
  <div className="flex items-center justify-center py-12">
    <button
      onClick={onClick}
      className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 forskale-gradient-bg text-white text-sm font-semibold rounded-xl shadow-[0_4px_20px_hsl(var(--forskale-green)/0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_hsl(var(--forskale-green)/0.45)] transition-all duration-300 overflow-hidden"
    >
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="absolute inset-0 rounded-xl animate-pulse opacity-30 bg-[hsl(var(--forskale-green)/0.4)]" />
      <Sparkles className="h-5 w-5 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
      <span className="relative z-10">Analyze Meeting</span>
    </button>
  </div>
);

// ── Section 1: Interest Pulse ──
interface InterestPulseProps {
  interestPct?: number;
  winProbability?: number | null;
  riskLevel?: string | null;
  riskReason?: string | null;
  cognitiveState?: string | null;
  psychologyLabel?: string | null;
  uiColorTheme?: string | null;
  pulseScore?: number | null;
}

const InterestPulse = ({ interestPct = MOCK_INTEREST_PCT, winProbability, riskLevel, riskReason, cognitiveState, psychologyLabel, pulseScore }: InterestPulseProps) => {
  const band = getBandByPct(interestPct);
  const targetScore = Math.min(Math.round(interestPct * 1.4), 100); // rough gauge score

  // ── Derived values — must be declared BEFORE useEffect to avoid TDZ ──
  const displayCognitiveState = cognitiveState || band.cognitiveState;
  const displayPsychology = psychologyLabel || band.psychology;
  const displayTargetScore = pulseScore != null ? Math.min(Math.round(pulseScore), 100) : targetScore;
  const winPct = winProbability != null ? Math.round(winProbability) : null;
  const riskText = riskLevel || "Medium";

  const [displayScore, setDisplayScore] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [gaugeActive, setGaugeActive] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTextVisible(true), 100);
    const t2 = setTimeout(() => setGaugeActive(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (!gaugeActive) return;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(displayTargetScore * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [gaugeActive, displayTargetScore]);

  const radius = 50;
  const circumference = Math.PI * radius;
  const dashValue = gaugeActive ? (displayScore / 100) * circumference : 0;

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-teal))] animate-pulse" />
        <h3 className="text-base font-bold text-foreground">Interest Pulse</h3>
        <span className="text-xs text-muted-foreground ml-1">where the buyer is right now</span>
      </div>

      <div className="rounded-xl border border-[hsl(145,92%,91%)] bg-[hsl(143,85%,96%)] p-6">
        <div className="flex items-center justify-between">
          <div
            className="flex flex-col justify-center transition-all duration-500"
            style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? 'translateY(0)' : 'translateY(10px)' }}
          >
            <h4 className="text-2xl font-bold text-[hsl(140,100%,27%)] mb-1">{displayCognitiveState}</h4>
            <p className="text-sm text-[hsl(140,100%,27%)]/70 mb-2">{interestPct}% interest</p>
            <p className="text-sm font-medium text-[hsl(140,100%,27%)]">{displayPsychology}</p>
            {psychologyLabel && psychologyLabel !== band.psychology && (
              <p className="text-xs italic text-[hsl(140,100%,27%)]/60 mt-1">{psychologyLabel}</p>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 120, height: 70 }}>
              <svg viewBox="0 0 120 68" className="w-full h-full">
                <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
                <path
                  d="M 10 58 A 50 50 0 0 1 110 58"
                  fill="none"
                  stroke="hsl(97,72%,48%)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${dashValue} ${circumference}`}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[32px] leading-none font-bold tabular-nums text-[hsl(97,72%,38%)]">{displayScore}</span>
                  <span className="text-sm text-[hsl(140,100%,27%)]/60">/100</span>
                </div>
              </div>
            </div>
            <div className="text-center mt-1.5">
              <span className="text-xs font-semibold text-[hsl(97,72%,38%)] block">{getScoreLabel(displayScore)}</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Trophy className="h-3 w-3 text-[hsl(97,72%,48%)]" />
                <span className="text-[10px] font-medium text-[hsl(97,72%,48%)]">Great job!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="rounded-lg bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] p-3">
          <p className="text-[11px] text-muted-foreground">Win probability</p>
          <p className="text-xl font-bold text-[hsl(var(--forskale-green))]">{winPct != null ? `${winPct}%` : "72%"}</p>
        </div>
        <div className="rounded-lg bg-amber-500/[0.08] border border-amber-500/20 p-3">
          <p className="text-[11px] text-muted-foreground">Risk level</p>
          <p className="text-sm font-bold text-amber-500">{riskText}</p>
          {riskReason && (
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{riskReason}</p>
          )}
        </div>
      </div>
      {cognitiveState && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[hsl(var(--forskale-teal)/0.1)] border border-[hsl(var(--forskale-teal)/0.2)] text-[10px] font-semibold text-[hsl(var(--forskale-teal))]">
            {cognitiveState}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Section 2: Interest Evolution ──
interface EvolutionItem {
  id: string;
  dateLabel: string;
  interestPct: number;
  outcome: string;
}

const InterestEvolution = ({ history }: { history: EvolutionItem[] }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 mb-1">
      <Clock className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
      <h3 className="text-base font-bold text-foreground">Interest Evolution</h3>
    </div>
    <p className="text-xs text-muted-foreground mb-5">How buyer interest shifted across meetings</p>

    <div className="flex items-start justify-between relative">
      <div className="absolute top-5 left-8 right-8 h-[1px] bg-border" />
      {history.map((m, i) => {
        const b = getBandByPct(m.interestPct);
        const isActive = i === history.length - 1;
        return (
          <div key={m.id} className="flex flex-col items-center gap-2 z-10" style={{ flex: 1 }}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isActive ? `${b.bgClass} ${b.textClass} border-current` : "bg-card text-muted-foreground border-border"}`}>
              {i + 1}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">{m.dateLabel}</p>
            <p className={`text-[11px] font-semibold text-center ${isActive ? b.textClass : "text-foreground"}`}>{b.cognitiveState}</p>
            <p className="text-[10px] text-muted-foreground text-center">{m.interestPct}%</p>
            <p className="text-[10px] text-muted-foreground text-center leading-tight">{m.outcome}</p>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Section 3: What Changed ──
interface ChangeItem {
  topic: string;
  before: string;
  now: string;
  direction: "risk" | "positive";
}

const WhatChanged = ({ changes }: { changes: ChangeItem[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen(v => !v)} className="p-5 w-full text-left cursor-pointer rounded-xl hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">What Changed</h3>
          <span className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inset-0 rounded-full bg-[hsl(var(--forskale-teal)/0.15)] animate-pulse" />
            <Info className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] relative z-10" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Since your last meeting</p>
      </button>
      {open && (
        <div className="grid grid-cols-3 gap-3 px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {changes.map((c) => (
            <div key={c.topic} className={`rounded-lg p-3 border ${c.direction === "risk" ? "bg-destructive/5 border-destructive/20" : "bg-[hsl(var(--forskale-green)/0.06)] border-[hsl(var(--forskale-green)/0.2)]"}`}>
              <p className="text-[11px] font-bold text-foreground mb-2">{c.topic}</p>
              <div className="space-y-1.5">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Before</p>
                  <p className="text-[11px] text-foreground">{c.before}</p>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Now</p>
                  <div className="flex items-center gap-1">
                    {c.direction === "risk"
                      ? <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                      : <CheckCircle2 className="h-3 w-3 text-[hsl(var(--forskale-green))] flex-shrink-0" />
                    }
                    <p className="text-[11px] text-foreground">{c.now}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Section 4: What to Do Next ──
interface ActionItem {
  priority: "CRITICAL" | "IMPORTANT" | "OPPORTUNITY";
  title: string;
  why: string;
  timeline: string;
}

const WhatToDoNext = ({ actions }: { actions: ActionItem[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border-2 border-[hsl(var(--forskale-teal)/0.3)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.04)] to-transparent">
      <button onClick={() => setOpen(v => !v)} className="p-5 w-full text-left cursor-pointer rounded-xl hover:bg-[hsl(var(--forskale-teal)/0.06)] transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">What to Do Next</h3>
          <span className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inset-0 rounded-full bg-[hsl(var(--forskale-teal)/0.15)] animate-pulse" />
            <Info className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] relative z-10" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Your most important moves</p>
      </button>
      {open && (
        <div className="space-y-3 px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {actions.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${a.priority === "CRITICAL" ? "bg-destructive" : a.priority === "IMPORTANT" ? "bg-amber-500" : "bg-[hsl(var(--forskale-green))]"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.priority === "CRITICAL" ? "bg-destructive/10 text-destructive" : a.priority === "IMPORTANT" ? "bg-amber-500/10 text-amber-600" : "bg-[hsl(var(--forskale-green)/0.1)] text-[hsl(var(--forskale-green))]"}`}>
                    {a.priority}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">{a.why}</p>
                <p className="text-[11px] text-[hsl(var(--forskale-teal))] mt-1 font-medium">{a.timeline}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helpers to map real API data ──
function buildEvolutionFromSummary(summary: MeetingSmartSummary): EvolutionItem[] {
  if (summary.deal_evolution && summary.deal_evolution.length > 0) {
    return summary.deal_evolution.map((e, i) => ({
      id: e.id || `ev-${i}`,
      dateLabel: e.date ? new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `Meeting ${i + 1}`,
      interestPct: 20 + i * 10, // approximate progression; no exact pct in API
      outcome: e.outcome || e.type || "",
    }));
  }
  return mockMeetingHistory;
}

function buildChangesFromSummary(summary: MeetingSmartSummary): ChangeItem[] {
  if (summary.then_vs_now && summary.then_vs_now.length > 0) {
    return summary.then_vs_now.slice(0, 6).map(c => ({
      topic: c.topic,
      before: c.then_status,
      now: c.now_status,
      direction: (c.now_sentiment === "negative" || c.indicator === "red" || c.indicator === "amber") ? "risk" : "positive",
    }));
  }
  return mockChanges;
}

function buildActionsFromSummary(summary: MeetingSmartSummary): ActionItem[] {
  if (summary.strategic_recommendations && summary.strategic_recommendations.length > 0) {
    return summary.strategic_recommendations.slice(0, 4).map(r => ({
      priority: r.priority === "critical" ? "CRITICAL" : r.priority === "important" ? "IMPORTANT" : "OPPORTUNITY",
      title: r.title,
      why: r.why,
      timeline: r.timeline,
    }));
  }
  return mockActions;
}

// ── Main Component ──
type AnalysisState = "pristine" | "loading" | "complete";

interface SummaryTabProps {
  autoAnalyze?: boolean;
  smartSummary?: MeetingSmartSummary | null;
  atlasInsights?: any;
  interestPulse?: MeetingInterestPulse | null;
}

const SummaryTab = ({ autoAnalyze = false, smartSummary, atlasInsights: _atlasInsights, interestPulse }: SummaryTabProps) => {
  const hasRealData = !!smartSummary;

  // If real data is available, go straight to complete
  const [analysisState, setAnalysisState] = useState<AnalysisState>(() => {
    if (hasRealData) return "complete";
    if (autoAnalyze) return "loading";
    return "pristine";
  });

  // When real data arrives mid-session, upgrade state to complete
  useEffect(() => {
    if (hasRealData && analysisState !== "complete") {
      setAnalysisState("complete");
    }
  }, [hasRealData, analysisState]);

  const handleAnalysisComplete = (_result: PlaybookAnalysis) => {
    setAnalysisState("complete");
  };

  // Derived values from real data or mock fallback
  const interestPct = interestPulse?.interest_percent ?? smartSummary?.deal_health?.engagement?.value ?? MOCK_INTEREST_PCT;
  const winProbability = interestPulse?.win_probability ?? smartSummary?.deal_health?.win_probability?.value ?? null;
  const riskLevel = interestPulse?.risk_level ?? smartSummary?.deal_health?.risk_level ?? null;
  const history = smartSummary ? buildEvolutionFromSummary(smartSummary) : mockMeetingHistory;
  const changes = smartSummary ? buildChangesFromSummary(smartSummary) : mockChanges;
  const actions = smartSummary ? buildActionsFromSummary(smartSummary) : mockActions;

  return (
    <div className="space-y-5">
      {analysisState === "pristine" && (
        <AnalyzeMeetingButton onClick={() => setAnalysisState("loading")} />
      )}

      {analysisState === "complete" && (
        <>
          <InterestPulse
            interestPct={interestPct}
            winProbability={winProbability}
            riskLevel={riskLevel}
            riskReason={interestPulse?.risk_reason ?? null}
            cognitiveState={interestPulse?.cognitive_state ?? null}
            psychologyLabel={interestPulse?.psychology_label ?? null}
            uiColorTheme={interestPulse?.ui_color_theme ?? null}
            pulseScore={interestPulse?.pulse_score ?? null}
          />
          <KeyMomentsSection />
          <InterestEvolution history={history} />
          <WhatChanged changes={changes} />
          <WhatToDoNext actions={actions} />
        </>
      )}

      <AdvancedAnalysisModal
        isOpen={analysisState === "loading"}
        onComplete={handleAnalysisComplete}
        onViewDetailed={() => setAnalysisState("complete")}
      />
    </div>
  );
};

export default SummaryTab;
