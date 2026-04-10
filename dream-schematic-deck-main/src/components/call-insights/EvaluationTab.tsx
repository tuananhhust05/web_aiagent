import { useState } from "react";
import { useT } from "@/i18n/LanguageContext";
import {
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  Lightbulb,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Check,
  Info,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockEvaluation } from "@/data/mockData";
import { toast } from "sonner";
import { getBandByPct, STAGE_TO_PCT } from "@/lib/interestModel";

const timingLabels: Record<string, { label: string; color: string }> = {
  immediate: { label: "Now", color: "bg-destructive/10 text-destructive border-destructive/20" },
  "within-24h": {
    label: "Within 24h",
    color: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.2)]",
  },
  "this-week": {
    label: "This week",
    color: "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.2)]",
  },
  "this-month": { label: "This month", color: "bg-secondary text-muted-foreground border-border" },
};

const statusConfig = {
  successful: {
    icon: CheckCircle,
    label: "Successful Progression",
    bg: "bg-[hsl(var(--forskale-green)/0.05)]",
    border: "border-[hsl(var(--forskale-green)/0.2)]",
    badgeBg: "bg-[hsl(var(--badge-green-bg))]",
    badgeText: "text-status-great",
    badgeBorder: "border-[hsl(var(--forskale-green)/0.3)]",
    iconColor: "text-status-great",
  },
  neutral: {
    icon: MinusCircle,
    label: "Neutral",
    bg: "bg-[hsl(var(--forskale-cyan)/0.05)]",
    border: "border-[hsl(var(--forskale-cyan)/0.2)]",
    badgeBg: "bg-[hsl(var(--badge-cyan-bg))]",
    badgeText: "text-[hsl(var(--forskale-cyan))]",
    badgeBorder: "border-[hsl(var(--forskale-cyan)/0.3)]",
    iconColor: "text-[hsl(var(--forskale-cyan))]",
  },
  "needs-attention": {
    icon: AlertTriangle,
    label: "Needs Attention",
    bg: "bg-destructive/5",
    border: "border-destructive/20",
    badgeBg: "bg-destructive/10",
    badgeText: "text-destructive",
    badgeBorder: "border-destructive/30",
    iconColor: "text-destructive",
  },
};

const momentTypeColor = {
  positive: "bg-status-great",
  negative: "bg-destructive",
  neutral: "bg-muted-foreground",
};

const insightBadgeMap: Record<string, { label: string; className: string }> = {
  "pain-point": {
    label: "IDENTIFIED",
    className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]",
  },
  budget: {
    label: "OPPORTUNITY",
    className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]",
  },
  "decision-maker": {
    label: "ACTION NEEDED",
    className:
      "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.3)]",
  },
  competition: { label: "RISK", className: "bg-destructive/10 text-destructive border-destructive/30" },
  timeline: { label: "TIMELINE", className: "bg-secondary text-muted-foreground border-border" },
};

const insightContext: Record<string, string> = {
  "pain-point": "This is a strong foundation for your value proposition. Reference this pain point in every follow-up.",
  budget: "This positions you well for Demo stage. Use this momentum to accelerate timeline.",
  "decision-maker": "Engage the CFO early to avoid delays. Prepare executive-level messaging.",
  competition: "Move quickly to Demo or risk losing competitive advantage. Differentiate on implementation speed.",
};

const confidenceTooltip =
  "AI confidence based on conversation signals including tone, language patterns, commitment indicators, and contextual cues";

interface EvaluationTabProps {
  onOpenStrategyModal?: () => void;
}

const EvaluationTab = ({ onOpenStrategyModal }: EvaluationTabProps) => {
  const t = useT();
  const evaluation = mockEvaluation;
  const config = statusConfig[evaluation.outcome.status];
  const StatusIcon = config.icon;
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});
  const [showKeyMoments, setShowKeyMoments] = useState(false);

  const pct = STAGE_TO_PCT[evaluation.outcome.dealProgression.to] ?? 35;
  const band = getBandByPct(pct);
  const previousBand = evaluation.outcome.dealProgression.from
    ? getBandByPct(STAGE_TO_PCT[evaluation.outcome.dealProgression.from] ?? 15)
    : null;

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleActionButton = (actionType: string, title: string) => {
    if (actionType === "send-material") {
      toast.info("Opening in Action Ready...", { description: title });
    } else {
      toast.info("Added to Action Ready tasks", { description: title });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div className={cn("rounded-xl border p-5 shadow-card", config.bg, config.border)}>
          <div className="flex items-start gap-4">
            <StatusIcon className={cn("h-6 w-6 shrink-0 mt-0.5", config.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-base font-heading font-bold text-foreground">{t("eval.callSummary")}</h3>
                <Badge
                  className={cn("text-[11px] font-semibold", config.badgeBg, config.badgeText, config.badgeBorder)}
                >
                  {config.label}
                </Badge>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-4">{evaluation.outcome.summary}</p>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-muted-foreground">Interest Level:</span>
                <div className="flex items-center gap-1.5">
                  {previousBand && (
                    <>
                      <span className={`text-xs font-semibold ${previousBand.textClass}`}>
                        {previousBand.cognitiveState}
                      </span>
                      <span className="text-xs text-muted-foreground">{previousBand.rangeLabel}</span>
                      <ArrowRight className="h-3 w-3 text-status-great" />
                    </>
                  )}
                  <span className={`text-xs font-semibold ${band.textClass}`}>{band.cognitiveState}</span>
                  <span className="text-xs text-muted-foreground">{band.rangeLabel}</span>
                  <ArrowUpRight className="h-3 w-3 text-status-great" />
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] h-5 font-semibold ${band.bgClass} ${band.textClass} ${band.borderClass}`}
                >
                  {band.cognitiveState}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowKeyMoments(prev => !prev)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                    {t("eval.keyMoments")}
                  </span>
                  <span className="relative flex items-center justify-center w-5 h-5">
                    <span className="absolute inset-0 rounded-full bg-[hsl(var(--forskale-teal)/0.15)] animate-pulse" />
                    <Info className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] relative z-10" />
                  </span>
                </button>
                {showKeyMoments && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {evaluation.outcome.keyMoments.map((moment, i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <span className={cn("w-2 h-2 rounded-full shrink-0", momentTypeColor[moment.type])} />
                        <span className="text-[11px] font-mono text-muted-foreground w-10 shrink-0">
                          {moment.timestamp}
                        </span>
                        <span className="text-xs text-foreground">{moment.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[hsl(var(--forskale-teal)/0.4)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.03)] to-[hsl(var(--forskale-green)/0.03)] p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-1">
            <ArrowRight className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
            <h3 className="text-xl font-heading font-bold text-foreground">{t("eval.nextActions")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{t("eval.nextActions.subtitle")}</p>

          <div className="space-y-4">
            {evaluation.recommendedActions.map((action) => {
              const timing = timingLabels[action.timing];
              const isDone = completedActions[action.id];

              return (
                <div
                  key={action.id}
                  className={cn(
                    "flex items-start gap-3 transition-all",
                    isDone && "opacity-60",
                  )}
                >
                  <button
                    onClick={() => toggleAction(action.id)}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                      isDone ? "bg-status-great text-white" : "bg-[hsl(var(--forskale-teal))] text-white",
                    )}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : action.priority}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-semibold text-foreground", isDone && "line-through")}>
                        {action.title}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px] h-5", timing.color)}>
                        <Clock className="h-2.5 w-2.5 mr-1" />
                        {timing.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* See all actions button */}
          <div className="mt-4 flex justify-center">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md border border-[hsl(var(--forskale-teal)/0.3)] text-[hsl(var(--forskale-teal))] bg-[hsl(var(--forskale-teal)/0.05)] hover:bg-[hsl(var(--forskale-teal)/0.1)] transition-all hover:scale-[1.02]"
              onClick={() => toast.info("Opening Action Ready...")}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              See all actions in Action Ready
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-1">
            <Lightbulb className="h-4.5 w-4.5 text-[hsl(var(--forskale-teal))]" />
            <h3 className="text-base font-heading font-bold text-foreground">{t("eval.whyMatters")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{t("eval.whyMatters.subtitle")}</p>

          <div className="space-y-3">
            {evaluation.strategicInsights.map((insight, i) => {
              const badge = insightBadgeMap[insight.category];
              const context = insightContext[insight.category];

              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setExpandedInsights(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="flex items-center gap-2 flex-wrap w-full text-left group cursor-pointer"
                    >
                      <span className="text-sm text-foreground">{insight.insight}</span>
                      {badge && (
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] h-4 font-bold tracking-wider", badge.className)}
                        >
                          {badge.label}
                        </Badge>
                      )}
                      <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto group-hover:text-foreground transition-colors" />
                    </button>
                    {expandedInsights[i] && (
                      <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {context && <p className="text-[11px] text-muted-foreground italic mb-1.5">{context}</p>}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-[hsl(var(--forskale-teal))]"
                              style={{ width: `${insight.confidence}%`, transition: "width 0.8s ease-out" }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{insight.confidence}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EvaluationTab;
