import { useState, useEffect } from "react";
import { Sparkles, Clock, AlertTriangle, CheckCircle2, Info, Trophy } from "lucide-react";
import { getBandByPct } from "@/lib/interestModel";
import { type PlaybookAnalysis } from "@/data/playbookAnalysisData";
import AdvancedAnalysisModal from "./AdvancedAnalysisModal";
import KeyMomentsSection from "./KeyMomentsSection";

// --- Mock Data ---

const currentInterestPct = 55;

const meetingHistory = [
  { id: "m1", dateLabel: "Jan 10", interestPct: 15, outcome: "Initial outreach" },
  { id: "m2", dateLabel: "Jan 24", interestPct: 28, outcome: "First conversation" },
  { id: "m3", dateLabel: "Feb 8", interestPct: 42, outcome: "Pain points identified" },
  { id: "m4", dateLabel: "Feb 22", interestPct: 55, outcome: "Solution presented" },
];

const changes = [
  {
    topic: "Budget",
    before: "CFO confirmed allocation",
    now: "Need to check with finance team",
    direction: "risk" as const,
  },
  {
    topic: "Decision Authority",
    before: "Marco has signing authority",
    now: "Board needs to review",
    direction: "risk" as const,
  },
  {
    topic: "Implementation",
    before: "Concerned about complexity",
    now: "Phased rollout accepted",
    direction: "positive" as const,
  },
];

const actions = [
  {
    priority: "CRITICAL" as const,
    title: "Re-qualify Budget Authority",
    why: "Budget status shifted from confirmed to uncertain",
    timeline: "Schedule CFO call within 48 hours",
  },
  {
    priority: "IMPORTANT" as const,
    title: "Address Implementation Concerns",
    why: "Raised in 2 consecutive meetings without full resolution",
    timeline: "Send case study within 24 hours",
  },
  {
    priority: "OPPORTUNITY" as const,
    title: "Engage Finance Team",
    why: "Positive mention indicates buying intent",
    timeline: "Prepare ROI materials this week",
  },
];

// --- Analyze Meeting Button with sparkle/shimmer/glow ---
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

// --- Section 1: Interest Pulse with Animated Gauge ---
const InterestPulse = () => {
  const band = getBandByPct(currentInterestPct);
  const targetScore = 80;
  const [displayScore, setDisplayScore] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [gaugeActive, setGaugeActive] = useState(false);

  useEffect(() => {
    const textTimer = setTimeout(() => setTextVisible(true), 100);
    const gaugeTimer = setTimeout(() => setGaugeActive(true), 400);
    return () => { clearTimeout(textTimer); clearTimeout(gaugeTimer); };
  }, []);

  useEffect(() => {
    if (!gaugeActive) return;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(targetScore * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [gaugeActive]);

  const radius = 50;
  const circumference = Math.PI * radius;
  const dashValue = gaugeActive ? (displayScore / 100) * circumference : 0;
  const strokeDasharray = `${dashValue} ${circumference}`;

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
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
            <h4 className="text-2xl font-bold text-[hsl(140,100%,27%)] mb-1">Trust</h4>
            <p className="text-sm text-[hsl(140,100%,27%)]/70 mb-2">50-60% interest</p>
            <p className="text-sm font-medium text-[hsl(140,100%,27%)]">They trust your solution</p>
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
                  strokeDasharray={strokeDasharray}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-1">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-[32px] leading-none font-bold tabular-nums text-[hsl(97,72%,38%)]">{displayScore}</span>
                    <span className="text-sm text-[hsl(140,100%,27%)]/60">/100</span>
                  </div>
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
          <p className="text-xl font-bold text-[hsl(var(--forskale-green))]">72%</p>
        </div>
        <div className="rounded-lg bg-amber-500/[0.08] border border-amber-500/20 p-3">
          <p className="text-[11px] text-muted-foreground">Risk level</p>
          <p className="text-sm font-bold text-amber-500">Medium — budget unclear</p>
        </div>
      </div>
    </div>
  );
};

// --- Section 2: Interest Evolution ---
const InterestEvolution = () => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 mb-1">
      <Clock className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
      <h3 className="text-base font-bold text-foreground">Interest Evolution</h3>
    </div>
    <p className="text-xs text-muted-foreground mb-5">How buyer interest shifted across meetings</p>

    <div className="flex items-start justify-between relative">
      <div className="absolute top-5 left-8 right-8 h-[1px] bg-border" />

      {meetingHistory.map((m, i) => {
        const b = getBandByPct(m.interestPct);
        const isActive = i === meetingHistory.length - 1;
        return (
          <div key={m.id} className="flex flex-col items-center gap-2 z-10" style={{ flex: 1 }}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                isActive ? `${b.bgClass} ${b.textClass} border-current` : "bg-card text-muted-foreground border-border"
              }`}
            >
              {i + 1}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">{m.dateLabel}</p>
            <p className={`text-[11px] font-semibold text-center ${isActive ? b.textClass : "text-foreground"}`}>
              {b.cognitiveState}
            </p>
            <p className="text-[10px] text-muted-foreground text-center">{m.interestPct}%</p>
            <p className="text-[10px] text-muted-foreground text-center leading-tight">{m.outcome}</p>
          </div>
        );
      })}
    </div>
  </div>
);

// --- Section 3: What Changed ---
const WhatChanged = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-5 w-full text-left cursor-pointer rounded-xl hover:bg-muted/30 transition-colors"
      >
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
            <div
              key={c.topic}
              className={`rounded-lg p-3 border ${
                c.direction === "risk"
                  ? "bg-destructive/5 border-destructive/20"
                  : "bg-[hsl(var(--forskale-green)/0.06)] border-[hsl(var(--forskale-green)/0.2)]"
              }`}
            >
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
                    {c.direction === "risk" ? (
                      <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-[hsl(var(--forskale-green))] flex-shrink-0" />
                    )}
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

// --- Section 4: What to Do Next ---
const WhatToDoNext = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border-2 border-[hsl(var(--forskale-teal)/0.3)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.04)] to-transparent">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-5 w-full text-left cursor-pointer rounded-xl hover:bg-[hsl(var(--forskale-teal)/0.06)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">What to Do Next</h3>
          <span className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute inset-0 rounded-full bg-[hsl(var(--forskale-teal)/0.15)] animate-pulse" />
            <Info className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] relative z-10" />
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Your 3 most important moves</p>
      </button>

      {open && (
        <div className="space-y-3 px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200">
          {actions.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                  a.priority === "CRITICAL"
                    ? "bg-destructive"
                    : a.priority === "IMPORTANT"
                      ? "bg-amber-500"
                      : "bg-[hsl(var(--forskale-green))]"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      a.priority === "CRITICAL"
                        ? "bg-destructive/10 text-destructive"
                        : a.priority === "IMPORTANT"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-[hsl(var(--forskale-green)/0.1)] text-[hsl(var(--forskale-green))]"
                    }`}
                  >
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

// --- Main Component ---
type AnalysisState = "pristine" | "loading" | "complete";

interface SummaryTabProps {
  autoAnalyze?: boolean;
}

const SummaryTab = ({ autoAnalyze = false }: SummaryTabProps) => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>(autoAnalyze ? "loading" : "pristine");

  const handleAnalysisComplete = (_result: PlaybookAnalysis) => {
    setAnalysisState("complete");
  };

  return (
    <div className="space-y-5">
      {analysisState === "pristine" && (
        <AnalyzeMeetingButton onClick={() => setAnalysisState("loading")} />
      )}

      {analysisState === "complete" && (
        <>
          <InterestPulse />
          <KeyMomentsSection />
          <InterestEvolution />
          <WhatChanged />
          <WhatToDoNext />
        </>
      )}

      <AdvancedAnalysisModal
        isOpen={analysisState === "loading"}
        onComplete={handleAnalysisComplete}
      />
    </div>
  );
};

export default SummaryTab;