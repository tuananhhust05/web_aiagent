import { useState } from "react";
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
  Mail,
  ClipboardList,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockEvaluation } from "@/data/mockData";
import ReminderModal from "./ReminderModal";
import { toast } from "sonner";
import type { MeetingEvaluation } from "@/lib/api";

const timingLabels: Record<string, { label: string; color: string }> = {
  immediate: { label: "Now", color: "bg-destructive/10 text-destructive border-destructive/20" },
  "within-24h": { label: "Within 24h", color: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.2)]" },
  "this-week": { label: "This week", color: "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.2)]" },
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
  "pain-point": { label: "IDENTIFIED", className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]" },
  budget: { label: "OPPORTUNITY", className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]" },
  "decision-maker": { label: "ACTION NEEDED", className: "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.3)]" },
  competition: { label: "RISK", className: "bg-destructive/10 text-destructive border-destructive/30" },
  timeline: { label: "TIMELINE", className: "bg-secondary text-muted-foreground border-border" },
};

const insightContext: Record<string, string> = {
  "pain-point": "This is a strong foundation for your value proposition. Reference this pain point in every follow-up.",
  budget: "This positions you well for Demo stage. Use this momentum to accelerate timeline.",
  "decision-maker": "Engage the CFO early to avoid delays. Prepare executive-level messaging.",
  competition: "Move quickly to Demo or risk losing competitive advantage. Differentiate on implementation speed.",
};

const confidenceTooltip = "AI confidence based on conversation signals including tone, language patterns, commitment indicators, and contextual cues";

const actionButtons: Record<string, { label: string; icon: React.ElementType }> = {
  "send-material": { label: "Send Email", icon: Mail },
  "schedule-meeting": { label: "Add to Tasks", icon: ClipboardList },
  "follow-up": { label: "Add to Tasks", icon: ClipboardList },
};

interface EvaluationTabProps {
  onOpenStrategyModal?: () => void;
  evaluation?: MeetingEvaluation | null;
}

const EvaluationTab = ({ onOpenStrategyModal, evaluation: realEvaluation }: EvaluationTabProps) => {
  const evaluation =
    realEvaluation != null
      ? {
          outcome: realEvaluation.outcome
            ? {
                status: realEvaluation.outcome.status,
                summary: realEvaluation.outcome.summary,
                dealProgression: {
                  from: realEvaluation.outcome.deal_progression?.from ?? "intro",
                  to: realEvaluation.outcome.deal_progression?.to ?? "discovery",
                  likelihood: realEvaluation.outcome.deal_progression?.likelihood ?? "medium",
                },
                keyMoments: (realEvaluation.outcome.key_moments ?? []).map((m) => ({
                  timestamp: m.timestamp,
                  type: m.type as "positive" | "negative" | "neutral",
                  description: m.description,
                })),
              }
            : {
                status: "neutral" as const,
                summary:
                  (realEvaluation.message && realEvaluation.message.trim()) ||
                  "No call summary is available yet. Ensure the meeting has a transcript, then use Regenerate insights.",
                dealProgression: {
                  from: "intro",
                  to: "discovery",
                  likelihood: "medium" as const,
                },
                keyMoments: [] as Array<{
                  timestamp: string;
                  type: "positive" | "negative" | "neutral";
                  description: string;
                }>,
              },
          recommendedActions: (realEvaluation.recommended_actions ?? []).map((a) => ({
            id: a.id,
            priority: a.priority,
            title: a.title,
            description: a.description,
            timing: a.timing,
            actionType: a.action_type,
          })),
          strategicInsights: (realEvaluation.strategic_insights ?? []).map((s) => ({
            category: s.category,
            insight: s.insight,
            confidence: s.confidence,
            icon: s.icon,
          })),
        }
      : mockEvaluation;
  const config = statusConfig[evaluation.outcome.status];
  const StatusIcon = config.icon;
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [reminderAction, setReminderAction] = useState<{ title: string; description: string } | null>(null);

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleActionButton = (actionType: string, title: string) => {
    if (actionType === "send-material") {
      toast.info("Opening email composer in Action Ready...", { description: title });
    } else {
      toast.info("Added to Action Ready tasks", { description: title });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Card 1: Call Summary */}
        <div className={cn("rounded-xl border p-5 shadow-card", config.bg, config.border)}>
          <div className="flex items-start gap-4">
            <StatusIcon className={cn("h-6 w-6 shrink-0 mt-0.5", config.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-base font-heading font-bold text-foreground">Call Summary</h3>
                <Badge className={cn("text-[11px] font-semibold", config.badgeBg, config.badgeText, config.badgeBorder)}>
                  {config.label}
                </Badge>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-4">
                {evaluation.outcome.summary}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-muted-foreground">Deal Stage:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {evaluation.outcome.dealProgression.from}
                  </span>
                  <ArrowRight className="h-3 w-3 text-status-great" />
                  <span className="text-xs font-semibold text-status-great capitalize">
                    {evaluation.outcome.dealProgression.to}
                  </span>
                  <ArrowUpRight className="h-3 w-3 text-status-great" />
                </div>
                <Badge variant="outline" className="text-[10px] h-5 border-[hsl(var(--forskale-green)/0.3)] text-status-great">
                  {evaluation.outcome.dealProgression.likelihood} likelihood
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Moments</div>
                <div className="space-y-1.5">
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
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Next Actions */}
        <div className="rounded-xl border-2 border-[hsl(var(--forskale-teal)/0.4)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.03)] to-[hsl(var(--forskale-green)/0.03)] p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-1">
            <ArrowRight className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
            <h3 className="text-base sm:text-xl font-heading font-bold text-foreground">Next Actions</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Your immediate priorities to move this deal forward</p>

          <div className="space-y-3">
            {evaluation.recommendedActions.map((action) => {
              const timing = timingLabels[action.timing];
              const isDone = completedActions[action.id];
              const actionBtn = actionButtons[action.actionType];

              return (
                <div
                  key={action.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg bg-card border border-border transition-all",
                    isDone && "opacity-60"
                  )}
                >
                  <button
                    onClick={() => toggleAction(action.id)}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                      isDone
                        ? "bg-status-great text-white"
                        : "bg-[hsl(var(--forskale-teal))] text-white"
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
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {action.description}
                    </p>

                    {!isDone && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleActionButton(action.actionType, action.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-secondary text-foreground hover:bg-accent transition-all hover:scale-[1.02]"
                        >
                          <actionBtn.icon className="h-3 w-3" />
                          {actionBtn.label}
                        </button>
                        <button
                          onClick={() => setReminderAction({ title: action.title, description: action.description })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-all hover:scale-[1.02]"
                        >
                          <Bell className="h-3 w-3" />
                          Set Reminder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategy Card */}
          <div className="mt-4 rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-teal)/0.08)] to-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-teal)/0.2)] p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[hsl(var(--forskale-teal)/0.15)] flex items-center justify-center shrink-0">
                <Sparkles className="h-4.5 w-4.5 text-[hsl(var(--forskale-teal))]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-heading font-bold text-foreground">Prepare for Success</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Get AI-powered guidance on meeting structure, talking points, and objection handling for your next interaction.
                </p>
                <button
                  onClick={() => onOpenStrategyModal?.()}
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-[hsl(var(--forskale-teal))] text-white hover:bg-[hsl(var(--forskale-teal)/0.9)] transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="h-3 w-3" />
                  Strategize Next Meeting
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Why These Actions Matter */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-1">
            <Lightbulb className="h-4.5 w-4.5 text-[hsl(var(--forskale-teal))]" />
            <h3 className="text-base font-heading font-bold text-foreground">Why These Actions Matter</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Here's what you uncovered and why it matters:</p>

          <div className="space-y-3">
            {evaluation.strategicInsights.map((insight, i) => {
              const badge = insightBadgeMap[insight.category];
              const context = insightContext[insight.category];

              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm text-foreground">{insight.insight}</span>
                      {badge && (
                        <Badge variant="outline" className={cn("text-[9px] h-4 font-bold tracking-wider", badge.className)}>
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    {context && (
                      <p className="text-[11px] text-muted-foreground italic mb-1.5">{context}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-full h-1">
                        <div
                          className="h-1 rounded-full bg-[hsl(var(--forskale-teal))]"
                          style={{ width: `${insight.confidence}%`, transition: "width 0.8s ease-out" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {insight.confidence}%
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] text-xs">
                          {confidenceTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminder Modal */}
        <ReminderModal
          isOpen={!!reminderAction}
          actionTitle={reminderAction?.title ?? ""}
          actionDescription={reminderAction?.description ?? ""}
          onClose={() => setReminderAction(null)}
        />
      </div>
    </TooltipProvider>
  );
};

export default EvaluationTab;
