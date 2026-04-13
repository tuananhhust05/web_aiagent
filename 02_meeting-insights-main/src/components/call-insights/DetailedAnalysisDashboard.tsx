import { useState, useEffect, memo } from "react";
import {
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Copy,
  Calendar,
  BookOpen,
  Target,
  Zap,
  Brain,
  MessageSquare,
  Users,
  Clock,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  PlaybookAnalysis,
  MethodologyScore,
  ExtractedElement,
  NeuroscienceMetric,
} from "@/data/playbookAnalysisData";

interface DetailedAnalysisDashboardProps {
  analysis: PlaybookAnalysis;
  isOpen: boolean;
  onClose: () => void;
}

// --- Helpers ---
const getScoreColor = (score: number) => {
  if (score >= 70) return "text-status-great";
  if (score >= 40) return "text-status-okay";
  return "text-status-needs-work";
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
};

const getStars = (score: number) => {
  const filled = score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 40 ? 2 : 1;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        "h-3 w-3",
        i < filled ? "fill-[hsl(var(--forskale-green))] text-[hsl(var(--forskale-green))]" : "text-muted-foreground/30",
      )}
    />
  ));
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

// --- Section 1: Deal Health Header ---
const DealHealthHeader = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const score = Math.round(analysis.consensusScore);
  const sorted = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore);
  const top = sorted[0];
  const missed = top.elementsDetected.filter((e) => !e.detected);

  const radius = 60;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        score >= 70
          ? "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.04)]"
          : score >= 40
            ? "border-[hsl(var(--forskale-cyan)/0.2)] bg-[hsl(var(--forskale-cyan)/0.03)]"
            : "border-status-needs-work/20 bg-status-needs-work/5",
      )}
    >
      <div className="flex items-center gap-6 flex-wrap">
        {/* Gauge */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-36 h-[82px]">
            <svg viewBox="0 0 132 76" className="w-full h-full">
              <path
                d="M 6 70 A 60 60 0 0 1 126 70"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 6 70 A 60 60 0 0 1 126 70"
                fill="none"
                className={cn(
                  score >= 70
                    ? "stroke-[hsl(var(--forskale-green))]"
                    : score >= 40
                      ? "stroke-[hsl(var(--forskale-cyan))]"
                      : "stroke-status-needs-work",
                )}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progress} ${circumference}`}
                style={{ transition: "stroke-dasharray 1.2s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <div className="text-center">
                <span className={cn("text-3xl font-bold font-heading tabular-nums", getScoreColor(score))}>
                  <AnimatedNumber target={score} />
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {score >= 75 && (
              <Trophy className="h-4 w-4 text-[hsl(var(--forskale-green))] animate-in zoom-in duration-500" />
            )}
            <span className={cn("text-sm font-semibold", getScoreColor(score))}>{getScoreLabel(score)}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold font-heading text-foreground mb-1">Deal Health Score</h3>
          <Badge className="bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)] text-[10px] mb-2">
            🎯 {top.name} Approach
          </Badge>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Strong discovery call with clear next steps
            {missed.length > 0 && (
              <>
                , but you missed identifying the{" "}
                <strong className="text-foreground">{missed[0].name.toLowerCase()}</strong>.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
});
DealHealthHeader.displayName = "DealHealthHeader";

// --- Section 2: Key Behaviors Grid ---
const behaviorDescriptions: Record<string, { good: string; bad: string; icon: typeof Check }> = {
  Metrics: {
    good: "Clearly quantified business impact",
    bad: "Quantify the business impact with specific numbers",
    icon: Target,
  },
  "Economic Buyer": {
    good: "Identified the key decision-maker",
    bad: "Ask who controls the budget early on",
    icon: Users,
  },
  "Decision Criteria": {
    good: "Uncovered what matters to them",
    bad: "Ask what criteria they'll evaluate against",
    icon: BookOpen,
  },
  "Decision Process": {
    good: "Mapped their buying process",
    bad: "Clarify the steps to a purchasing decision",
    icon: TrendingUp,
  },
  "Identify Pain": {
    good: "Masterfully uncovered key pain points",
    bad: "Dig deeper into their core challenges",
    icon: Zap,
  },
  Champion: {
    good: "Found an internal advocate",
    bad: "Identify someone who will champion your solution internally",
    icon: Award,
  },
};

const KeyBehaviorsGrid = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const topMethod = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore)[0];
  const elements = topMethod.elementsDetected.slice(0, 6);

  return (
    <div>
      <h3 className="text-sm font-bold font-heading text-foreground mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        Key Behaviors
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {elements.map((el) => {
          const desc = behaviorDescriptions[el.name];
          const StatusIcon = el.detected ? Check : AlertTriangle;
          return (
            <div
              key={el.elementId}
              className={cn(
                "rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-md",
                el.detected && el.score >= 80
                  ? "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.04)]"
                  : el.detected
                    ? "border-[hsl(var(--forskale-cyan)/0.2)] bg-[hsl(var(--forskale-cyan)/0.03)]"
                    : "border-status-needs-work/20 bg-status-needs-work/5",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusIcon
                    className={cn(
                      "h-4 w-4",
                      el.detected && el.score >= 80
                        ? "text-status-great"
                        : el.detected
                          ? "text-status-okay"
                          : "text-status-needs-work",
                    )}
                  />
                  <span className="text-xs font-semibold text-foreground">{el.name}</span>
                </div>
                {el.detected ? (
                  <span className={cn("text-lg font-bold font-heading tabular-nums", getScoreColor(el.score))}>
                    {el.score}%
                  </span>
                ) : (
                  <Badge variant="outline" className="text-[9px] border-status-needs-work/30 text-status-needs-work">
                    Missed
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {el.detected
                  ? desc?.good || "Successfully addressed in the conversation"
                  : desc?.bad || "This was not covered during the call"}
              </p>
              {el.detected && el.transcriptReferences.length > 0 && (
                <div className="mt-2 text-[10px] text-muted-foreground/70">📍 {el.transcriptReferences.join(", ")}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
KeyBehaviorsGrid.displayName = "KeyBehaviorsGrid";

// --- Section 3: Sales Approaches ---
const frameworkExplanations: Record<string, { description: string; whyItMatters: string }> = {
  MEDDIC: {
    description:
      "A qualification approach focused on Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, and Champion.",
    whyItMatters: "Helps close larger deals faster by focusing on the right stakeholders and decision factors.",
  },
  "Discovery Call": {
    description:
      "A structured approach to understand the prospect's company, challenges, goals, current tools, and next steps.",
    whyItMatters: "Ensures you gather all critical information to qualify and advance the deal.",
  },
  BANT: {
    description: "Qualifies opportunities based on Budget, Authority, Need, and Timeline.",
    whyItMatters: "Quickly determines if a prospect is worth pursuing based on four key criteria.",
  },
  SPICED: {
    description: "Evaluates Situation, Pain, Impact, Critical Event, and Decision to understand deal urgency.",
    whyItMatters: "Helps create urgency by connecting pain to business impact and timelines.",
  },
  CHAMP: {
    description: "Focuses on Challenges, Authority, Money, and Prioritization to qualify deals effectively.",
    whyItMatters: "Puts the prospect's challenges first, leading to more consultative conversations.",
  },
  SPIN: {
    description: "Uses Situation, Problem, Implication, and Need-Payoff questions to guide discovery.",
    whyItMatters: "Proven questioning technique that helps prospects realize the full impact of their problems.",
  },
  GPCT: {
    description: "Evaluates Goals, Plans, Challenges, and Timeline for strategic alignment.",
    whyItMatters: "Aligns your solution with the prospect's strategic objectives and plans.",
  },
  "Demo Call": {
    description: "Structured product demonstration including user context, questions, problem review, and next steps.",
    whyItMatters: "Ensures demos are personalized and address the prospect's specific needs.",
  },
};

const SalesApproaches = memo(({ analysis }: { analysis: PlaybookAnalysis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const sorted = [...analysis.methodologies].sort((a, b) => b.overallScore - a.overallScore);
  const displayed = showAll ? sorted : sorted.slice(0, 3);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
          <span className="text-sm font-bold font-heading text-foreground">Sales Approaches You Used</span>
          <span className="text-[11px] text-muted-foreground ml-1">
            ({analysis.methodologies.length} methods analyzed)
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        onClick={() => setIsOpen(false)}
        className="w-full flex items-center justify-between mb-3 text-left"
      >
        <div>
          <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
            Sales Approaches You Used
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            We compared your call against {analysis.methodologies.length} proven methods
          </p>
        </div>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="space-y-3">
        {displayed.map((m) => (
          <SalesApproachCard key={m.frameworkId} methodology={m} />
        ))}
      </div>
      {sorted.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-xs text-[hsl(var(--forskale-teal))] hover:underline flex items-center gap-1"
        >
          {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAll ? "Show fewer" : `Show ${sorted.length - 3} more methods`}
        </button>
      )}
    </div>
  );
});
SalesApproaches.displayName = "SalesApproaches";

const SalesApproachCard = memo(({ methodology }: { methodology: MethodologyScore }) => {
  const [expanded, setExpanded] = useState(false);
  const info = frameworkExplanations[methodology.name];
  const excellent = methodology.elementsDetected.filter((e) => e.detected && e.score >= 75);
  const improve = methodology.elementsDetected.filter((e) => e.detected && e.score < 75);
  const missing = methodology.elementsDetected.filter((e) => !e.detected);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        methodology.overallScore >= 70
          ? "border-[hsl(var(--forskale-green)/0.2)] bg-[hsl(var(--forskale-green)/0.03)]"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm">🎯</span>
          <span className="text-sm font-semibold text-foreground">{methodology.name} Method</span>
          <span className={cn("text-sm font-bold tabular-nums", getScoreColor(methodology.overallScore))}>
            {methodology.overallScore}/100
          </span>
        </div>
        <div className="flex items-center gap-1">{getStars(methodology.overallScore)}</div>
      </div>

      {info && <p className="text-[11px] text-muted-foreground mb-2 italic">{info.description}</p>}

      {/* Performance summary */}
      <div className="space-y-1 mb-2">
        {excellent.length > 0 && (
          <p className="text-[11px] text-foreground">
            <span className="text-status-great">✅ Excellent:</span> {excellent.map((e) => e.name).join(", ")}
          </p>
        )}
        {improve.length > 0 && (
          <p className="text-[11px] text-foreground">
            <span className="text-status-okay">⚠️ Improve:</span> {improve.map((e) => e.name).join(", ")}
          </p>
        )}
        {missing.length > 0 && (
          <p className="text-[11px] text-foreground">
            <span className="text-status-needs-work">❌ Missing:</span> {missing.map((e) => e.name).join(", ")}
          </p>
        )}
      </div>

      {info && <p className="text-[10px] text-muted-foreground italic">💡 Why it matters: {info.whyItMatters}</p>}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[11px] text-[hsl(var(--forskale-teal))] hover:underline flex items-center gap-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide" : "See"} detailed breakdown
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200 pt-2 border-t border-border">
          {methodology.elementsDetected.map((el) => (
            <div key={el.elementId} className="flex items-start gap-2 text-[11px]">
              {el.detected ? (
                <Check className="h-3 w-3 text-status-great shrink-0 mt-0.5" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/50 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className={cn("font-medium", el.detected ? "text-foreground" : "text-muted-foreground")}>
                  {el.name}
                </span>
                {el.detected && el.instances > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({el.score}%) • {el.instances} time{el.instances > 1 ? "s" : ""} at{" "}
                    {el.transcriptReferences.join(", ")}
                  </span>
                )}
                {!el.detected && <span className="text-muted-foreground/50 ml-1">— not covered</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
SalesApproachCard.displayName = "SalesApproachCard";

// --- Section 5: Unique Techniques ---
const UniqueDiscoveries = memo(({ elements }: { elements: ExtractedElement[] }) => (
  <div>
    <div className="mb-3">
      <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        🌟 Unique Techniques You Used
      </h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        Great news! You used {elements.length} effective techniques not in our standard playbooks.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {elements.map((el) => (
        <UniqueDiscoveryCard key={el.id} element={el} />
      ))}
    </div>
  </div>
));
UniqueDiscoveries.displayName = "UniqueDiscoveries";

const UniqueDiscoveryCard = memo(({ element }: { element: ExtractedElement }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.25)] bg-[hsl(var(--forskale-teal)/0.04)] p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm">📈</span>
        <span className="text-sm font-semibold text-foreground">{element.name}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
        <strong className="text-foreground">What you did:</strong> {element.description}
      </p>
      <p className="text-[10px] text-muted-foreground italic mb-2">
        💡 This technique increases close rates in enterprise deals.
      </p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-[hsl(var(--forskale-teal))] hover:underline mb-2"
      >
        {expanded ? "Hide evidence" : "When you used it"}
      </button>

      {expanded && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          {element.transcriptSnippets.map((s, i) => (
            <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2 text-[11px] text-foreground/70">
              {s}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium forskale-gradient-bg text-white rounded-md hover:opacity-90 transition-opacity">
          <Check className="h-3 w-3" /> Add to My Playbook
        </button>
        <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium border border-border rounded-md hover:bg-accent transition-colors">
          <BookOpen className="h-3 w-3" /> Learn More
        </button>
      </div>
    </div>
  );
});
UniqueDiscoveryCard.displayName = "UniqueDiscoveryCard";

// --- Section 6: Conversation Effectiveness (simplified neuroscience) ---
const neurosciencelabels: Record<string, { label: string; explanation: string }> = {
  "Question Sequencing Effectiveness": {
    label: "Question Flow",
    explanation: "You built trust by starting with easy questions before asking about budget",
  },
  "Cognitive Load Management": {
    label: "Kept It Simple",
    explanation: "You explained complex concepts in digestible pieces",
  },
  "Trust Building Patterns": {
    label: "Trust Building",
    explanation: "You established rapport and credibility naturally throughout the call",
  },
  "Decision Trigger Activation": {
    label: "Creating Urgency",
    explanation: "Try connecting their pain to specific deadlines or business events",
  },
  "Emotional Engagement Score": {
    label: "Engagement Level",
    explanation: "The prospect was actively engaged and responsive to your approach",
  },
};

const ConversationEffectiveness = memo(({ metrics }: { metrics: NeuroscienceMetric[] }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[hsl(var(--forskale-blue)/0.2)] bg-[hsl(var(--forskale-blue)/0.03)] p-5">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[hsl(var(--forskale-blue))]" />
          <span className="text-sm font-bold font-heading text-foreground">🧠 Conversation Effectiveness</span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <span className="text-xs text-muted-foreground">
              Avg: {Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)}%
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      <p className="text-[11px] text-muted-foreground mt-1">How engaging and persuasive was your conversation?</p>

      {expanded && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {metrics.map((m) => {
            const info = neurosciencelabels[m.label];
            return (
              <div key={m.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{info?.label || m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">{getStars(m.score)}</div>
                    <span className={cn("text-xs font-semibold", getScoreColor(m.score))}>
                      {getScoreLabel(m.score)}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mb-1">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      m.score >= 80
                        ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]"
                        : m.score >= 60
                          ? "bg-[hsl(var(--forskale-cyan))]"
                          : "bg-[hsl(var(--forskale-blue))]",
                    )}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
                {info && <p className="text-[10px] text-muted-foreground">{info.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
ConversationEffectiveness.displayName = "ConversationEffectiveness";

// --- Section: Action Plan ---
const ActionPlan = memo(() => (
  <div>
    <h3 className="text-sm font-bold font-heading text-foreground mb-3 flex items-center gap-2">
      <TrendingUp className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
      Your Action Plan
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Immediate follow-up */}
      <div className="rounded-xl border border-[hsl(var(--forskale-green)/0.2)] bg-[hsl(var(--forskale-green)/0.04)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
          <span className="text-xs font-bold text-foreground">Follow Up Within 24 Hours</span>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-[11px] text-foreground/80 leading-relaxed mb-3">
          ✉️ "Hi Marco, thanks for our call. As discussed, I'll send the ROI calculator and connect you with our
          implementation team..."
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Copy className="h-3 w-3" /> Copy Template
          </button>
          <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium border border-border rounded-md hover:bg-accent transition-colors">
            <Clock className="h-3 w-3" /> Set Reminder
          </button>
        </div>
      </div>

      {/* Next meeting prep */}
      <div className="rounded-xl border border-[hsl(var(--forskale-cyan)/0.2)] bg-[hsl(var(--forskale-cyan)/0.03)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-[hsl(var(--forskale-cyan))]" />
          <span className="text-xs font-bold text-foreground">Next Meeting Prep</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-foreground/80 mb-3">
          <p>You committed to:</p>
          <p>✓ Send ROI calculator</p>
          <p>✓ Include finance person</p>
          <p>✓ Schedule for early next month</p>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          💡 Pro tip: Research their finance team on LinkedIn first
        </p>
      </div>

      {/* Skills development */}
      <div className="rounded-xl border border-[hsl(var(--forskale-blue)/0.2)] bg-[hsl(var(--forskale-blue)/0.03)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-[hsl(var(--forskale-blue))]" />
          <span className="text-xs font-bold text-foreground">Practice These Skills</span>
        </div>
        <div className="space-y-2 text-[11px] text-foreground/80 mb-3">
          <div>
            <span className="font-medium">Champion Identification</span>
            <span className="text-muted-foreground"> (Current: 45%)</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              → Ask: "Who else typically gets involved in decisions like this?"
            </p>
          </div>
          <div>
            <span className="font-medium">Creating Urgency</span>
            <span className="text-muted-foreground"> (Current: 67%)</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">→ Try the "Timeline Question" technique</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium forskale-gradient-bg text-white rounded-md hover:opacity-90 transition-opacity">
          <Sparkles className="h-3 w-3" /> Start Training
        </button>
      </div>
    </div>
  </div>
));
ActionPlan.displayName = "ActionPlan";

// --- Section: Benchmarking ---
const Benchmarking = memo(({ score }: { score: number }) => {
  const [expanded, setExpanded] = useState(false);
  const teamAvg = 67;
  const top10 = 85;
  const percentile = Math.min(99, Math.round((score / 100) * 90 + 5));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
          <span className="text-sm font-bold font-heading text-foreground">How Does This Stack Up?</span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <span className="text-xs text-status-great font-medium">🎉 Top {100 - percentile}% of your team</span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Comparison bars */}
          <div className="space-y-3">
            {[
              { label: "You", value: score, highlight: true },
              { label: "Team Average", value: teamAvg, highlight: false },
              { label: "Top 10%", value: top10, highlight: false },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span
                  className={cn("text-xs w-24", row.highlight ? "font-bold text-foreground" : "text-muted-foreground")}
                >
                  {row.label}
                </span>
                <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      row.highlight
                        ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]"
                        : "bg-muted-foreground/30",
                    )}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums w-10 text-right",
                    row.highlight ? "text-status-great" : "text-muted-foreground",
                  )}
                >
                  {row.value}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-status-great">
            🎉 You're performing better than {percentile}% of your team!
          </p>

          {/* What top performers do */}
          <div className="bg-secondary/30 rounded-lg p-4">
            <p className="text-xs font-semibold text-foreground mb-2">What Top Performers Do Differently:</p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p>1. Ask 15 questions vs your 12 (helps uncover hidden objections)</p>
              <p>2. Quantify pain specifically ("How many hours does this cost weekly?")</p>
              <p>3. Identify 3–4 decision makers by call 2 (you've found 1 so far)</p>
            </div>
          </div>

          {/* Strongest skills */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Your Strongest Skills (Top 20%):</p>
            <div className="flex gap-2 flex-wrap">
              {["Building rapport", "Handling objections", "Setting next steps"].map((s) => (
                <Badge
                  key={s}
                  className="bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)] text-[10px]"
                >
                  ✓ {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
Benchmarking.displayName = "Benchmarking";

// --- Main Dashboard ---
const DetailedAnalysisDashboard = ({ analysis, isOpen, onClose }: DetailedAnalysisDashboardProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      style={{ marginTop: 0 }}
    >
      <div className="bg-background rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-[90vw] h-[90vh] max-w-[1400px] animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-foreground">Coaching Report</h2>
              <p className="text-[11px] text-muted-foreground">
                Your personalized call performance analysis and coaching insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)] text-[10px]">
              Analysis Complete
            </Badge>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-accent transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto atlas-scrollbar p-6 space-y-6">
          {/* 1. Deal Health Score */}
          <DealHealthHeader analysis={analysis} />


          {/* 2. Key Behaviors */}
          <KeyBehaviorsGrid analysis={analysis} />

          {/* 3. Sales Approaches */}
          <SalesApproaches analysis={analysis} />

          {/* 5. Unique Techniques */}
          <UniqueDiscoveries elements={analysis.customElements} />

          {/* 6. Conversation Effectiveness */}
          <ConversationEffectiveness metrics={analysis.neuroscienceMetrics} />

          {/* Benchmarking */}
          <Benchmarking score={Math.round(analysis.consensusScore)} />

          {/* Weekly progress */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-foreground">
              📊 This was your <strong>3rd call this week</strong>. You're improving!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Week 1: 71% → Week 2: 75% → <span className="text-status-great font-semibold">This week: 79% ↗️</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalysisDashboard;
