import {
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ArrowRight,
  Compass,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  FileText,
  Lightbulb,
  CheckSquare,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  mockSummary,
  mockDealEvolution,
  mockThenVsNow,
  mockChangeAlerts,
  mockEnhancedTopics,
  mockStrategicRecommendations,
  mockDealHealth,
} from "@/data/mockData";
import type {
  MeetingSmartSummary,
  SmartSummaryDealHealth,
  SmartSummaryDealEvolution,
  SmartSummaryThenVsNow,
  SmartSummaryChangeAlert,
  SmartSummaryEnhancedTopic,
  SmartSummaryStrategicRecommendation,
} from "@/lib/api";

// --- Sub-components ---

const SyncStatus = () => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <RefreshCw className="h-3 w-3 text-status-great animate-none" />
    <span className="text-status-great font-medium">Synced with CRM</span>
    <span>•</span>
    <span>Last updated: 2 min ago</span>
  </div>
);

const DealHealthBar = ({ label, value, trend }: { label: string; value: number; trend: "up" | "down" | "stable" }) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-status-great" : trend === "down" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-foreground">{value}%</span>
          <TrendIcon className={cn("h-3 w-3", trendColor)} />
        </div>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[hsl(var(--forskale-teal))] transition-all duration-1000 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const DealHealthDashboard = ({ health }: { health?: SmartSummaryDealHealth | null }) => {
  const h = health ?? {
    engagement: mockDealHealth.engagement,
    momentum: mockDealHealth.momentum,
    risk_level: mockDealHealth.riskLevel.label,
    risk_trend: mockDealHealth.riskLevel.trend,
    win_probability: mockDealHealth.winProbability,
  };
  const riskColor =
    h.risk_level === "Low"
      ? "text-status-great"
      : h.risk_level === "Medium"
      ? "text-[hsl(var(--forskale-cyan))]"
      : "text-destructive";
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <span className="text-xs font-bold text-foreground">Deal Health Snapshot</span>
      </div>
      <div className="flex flex-wrap gap-4">
        <DealHealthBar label="Engagement" value={h.engagement.value} trend={h.engagement.trend} />
        <DealHealthBar label="Momentum" value={h.momentum.value} trend={h.momentum.trend} />
        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-muted-foreground">Risk Level</span>
            <span className={cn("text-xs font-bold", riskColor)}>{h.risk_level} ↗</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-destructive/60 transition-all duration-1000" style={{ width: "55%" }} />
          </div>
        </div>
        <DealHealthBar label="Win Probability" value={h.win_probability.value} trend={h.win_probability.trend} />
      </div>
    </div>
  );
};

const DealEvolutionSection = ({ evolution }: { evolution?: SmartSummaryDealEvolution[] | null }) => {
  const meetings = evolution?.length
    ? evolution
    : mockDealEvolution.map((m) => ({
        id: m.id,
        date: m.date,
        type: m.type,
        outcome: m.outcome,
        is_current: m.isCurrent,
      }));

  return (
    <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.03)] to-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <h3 className="text-base font-heading font-bold text-foreground">Deal Evolution</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">How this opportunity has progressed across meetings</p>

      <div className="relative flex items-center gap-0 mb-6 overflow-x-auto pb-2">
        {meetings.map((m, i) => (
          <div key={m.id} className="flex items-center flex-1 min-w-[120px]">
            <div className="flex flex-col items-center text-center flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                m.is_current
                  ? "bg-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal))] text-white shadow-md"
                  : "bg-card border-border text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn("text-[10px] font-semibold mt-1.5", m.is_current ? "text-foreground" : "text-muted-foreground")}>{m.date}</span>
              <span className="text-[10px] text-muted-foreground">{m.type}</span>
              <span className={cn("text-[10px] mt-0.5", m.is_current ? "text-[hsl(var(--forskale-teal))] font-medium" : "text-muted-foreground")}>{m.outcome}</span>
            </div>
            {i < meetings.length - 1 && (
              <div className="w-8 h-0.5 bg-border shrink-0 mx-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChangeDetectionSection = ({ alerts }: { alerts?: SmartSummaryChangeAlert[] | null }) => {
  const displayAlerts = alerts?.length
    ? alerts
    : mockChangeAlerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        category: a.category,
        previous_state: a.previous.state,
        previous_date: a.previous.date,
        current_state: a.current.state,
        impact_analysis: a.impactAnalysis,
        recommended_actions: a.recommendedActions,
      }));

  if (!displayAlerts.length) return null;

  const severityStyles: Record<string, string> = {
    critical: "border-destructive/40 bg-destructive/5",
    warning: "border-destructive/20 bg-destructive/5",
    info: "border-[hsl(var(--forskale-cyan)/0.3)] bg-[hsl(var(--forskale-cyan)/0.05)]",
    positive: "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.05)]",
  };
  const severityIcon: Record<string, string> = {
    critical: "🔴",
    warning: "⚠️",
    info: "🔄",
    positive: "✅",
  };

  return (
    <div className="space-y-2">
      {displayAlerts.map((alert) => (
        <div key={alert.id} className={cn("rounded-xl border-2 p-4 shadow-card", severityStyles[alert.severity])}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{severityIcon[alert.severity]}</span>
            <h4 className="text-sm font-heading font-bold text-foreground">
              {alert.severity === "warning" ? "Strategic Shift Detected" : alert.title}
            </h4>
            <Badge variant="outline" className="text-[9px] h-4 font-bold tracking-wider">
              {alert.category}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-muted-foreground font-medium">Previous ({alert.previous_date}):</span>
              <p className="text-foreground mt-0.5">"{alert.previous_state}"</p>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Current (Today):</span>
              <p className="text-foreground mt-0.5">"{alert.current_state}"</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic mb-3">{alert.impact_analysis}</p>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recommended Actions</div>
            {alert.recommended_actions.map((action, j) => (
              <div key={j} className="flex items-center gap-2 text-xs text-foreground">
                <ArrowRight className="h-3 w-3 text-[hsl(var(--forskale-teal))] shrink-0" />
                {action}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const badgeConfig: Record<string, { label: string; className: string }> = {
  new: { label: "🆕 NEW", className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]" },
  revisited: { label: "🔄 REVISITED", className: "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.3)]" },
  resolved: { label: "✅ RESOLVED", className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]" },
  shifted: { label: "⚠️ SHIFTED", className: "bg-destructive/10 text-destructive border-destructive/30" },
  trending: { label: "📈 TRENDING", className: "bg-accent text-accent-foreground border-border" },
};

const sentimentIcon = {
  improving: { icon: TrendingUp, color: "text-status-great", label: "Improving" },
  declining: { icon: TrendingDown, color: "text-destructive", label: "Declining" },
  stable: { icon: Minus, color: "text-muted-foreground", label: "Stable" },
};

const EnhancedTopicsSection = ({ topics }: { topics?: SmartSummaryEnhancedTopic[] | null }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const displayTopics = topics?.length
    ? topics
    : mockEnhancedTopics.map((t) => ({
        title: t.title,
        badge: t.badge,
        meeting_count: t.meetingCount,
        sentiment_trend: t.sentimentTrend,
        timeline: t.timeline.map((e) => ({ date: e.date, quote: e.quote, sentiment: e.sentiment })),
        status: t.status,
        next_step: t.nextStep,
      }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <h3 className="text-base font-heading font-bold text-foreground">Discussion Topics</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Topic evolution across your meetings</p>
      <div className="space-y-2">
        {displayTopics.map((topic, i) => {
          const badge = badgeConfig[topic.badge];
          const sentiment = sentimentIcon[topic.sentiment_trend];
          const SentimentIcon = sentiment.icon;
          const isOpen = expanded[i];
          return (
            <div key={i} className="rounded-lg border border-border bg-secondary/30">
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{topic.title}</span>
                    <Badge variant="outline" className={cn("text-[9px] h-4 font-bold", badge.className)}>
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span>{topic.meeting_count}</span>
                    <span>•</span>
                    <SentimentIcon className={cn("h-3 w-3", sentiment.color)} />
                    <span>{sentiment.label}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 animate-fade-in border-t border-border pt-2">
                  <div className="space-y-1.5">
                    {topic.timeline.map((entry, j) => {
                      const dotColor = entry.sentiment === "positive" ? "bg-status-great" : entry.sentiment === "negative" ? "bg-destructive" : "bg-muted-foreground";
                      return (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotColor)} />
                          <div>
                            <span className="font-medium text-muted-foreground">{entry.date}:</span>
                            <span className="text-foreground ml-1">"{entry.quote}"</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] pt-1">
                    <span className="text-muted-foreground"><strong>Status:</strong> {topic.status}</span>
                    <span className="text-[hsl(var(--forskale-teal))]"><strong>Next:</strong> {topic.next_step}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ThenVsNowSection = ({ items }: { items?: SmartSummaryThenVsNow[] | null }) => {
  const displayItems = items?.length
    ? items
    : mockThenVsNow.map((t) => ({
        topic: t.topic,
        then_date: t.then.date,
        then_status: t.then.status,
        then_sentiment: t.then.sentiment,
        now_status: t.now.status,
        now_sentiment: t.now.sentiment,
        impact: t.impact,
        indicator: t.indicator,
      }));

  const indicatorColors: Record<string, string> = {
    green: "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.05)]",
    amber: "border-destructive/20 bg-destructive/5",
    red: "border-destructive/30 bg-destructive/10",
    blue: "border-[hsl(var(--forskale-cyan)/0.3)] bg-[hsl(var(--forskale-cyan)/0.05)]",
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Then vs Now</div>
      {displayItems.map((item, i) => (
        <div key={i} className={cn("rounded-lg border p-3", indicatorColors[item.indicator])}>
          <div className="font-semibold text-sm text-foreground mb-2">{item.topic}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Then ({item.then_date}):</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.then_sentiment === "positive" ? <CheckCircle className="h-3 w-3 text-status-great shrink-0" /> : <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                <span className="text-foreground">{item.then_status}</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground font-medium">Now (Today):</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {item.now_sentiment === "positive" ? <CheckCircle className="h-3 w-3 text-status-great shrink-0" /> : <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                <span className="text-foreground">{item.now_status}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground italic">
            <strong>Impact:</strong> {item.impact}
          </div>
        </div>
      ))}
    </div>
  );
};

const StrategicDirectionSection = ({ recommendations }: { recommendations?: SmartSummaryStrategicRecommendation[] | null }) => {
  const displayRecs = recommendations?.length
    ? recommendations
    : mockStrategicRecommendations;

  const priorityStyles: Record<string, { emoji: string; label: string; className: string }> = {
    critical: { emoji: "🔴", label: "CRITICAL", className: "bg-destructive/10 text-destructive border-destructive/30" },
    important: { emoji: "🟡", label: "IMPORTANT", className: "bg-[hsl(var(--forskale-cyan)/0.1)] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.3)]" },
    opportunity: { emoji: "🟢", label: "OPPORTUNITY", className: "bg-[hsl(var(--forskale-green)/0.1)] text-status-great border-[hsl(var(--forskale-green)/0.3)]" },
  };

  return (
    <div className="rounded-xl border-2 border-[hsl(var(--forskale-teal)/0.4)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.03)] to-[hsl(var(--forskale-green)/0.03)] p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Compass className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
        <h3 className="text-base font-heading font-bold text-foreground">Strategic Direction</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Based on deal state, conversation patterns, and historical context</p>
      <div className="space-y-3">
        {displayRecs.map((rec, i) => {
          const style = priorityStyles[rec.priority];
          return (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{style.emoji}</span>
                <Badge variant="outline" className={cn("text-[9px] h-4 font-bold tracking-wider", style.className)}>
                  {style.label}
                </Badge>
                <span className="text-sm font-semibold text-foreground">{rec.title}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div><span className="text-muted-foreground font-medium">Why:</span> <span className="text-foreground">{rec.why}</span></div>
                <div><span className="text-muted-foreground font-medium">Impact:</span> <span className="text-foreground">{rec.impact}</span></div>
                <div><span className="text-muted-foreground font-medium">Timeline:</span> <span className="text-[hsl(var(--forskale-teal))] font-medium">{rec.timeline}</span></div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-secondary rounded-full h-1">
                  <div className="h-1 rounded-full bg-[hsl(var(--forskale-teal))]" style={{ width: `${rec.confidence}%`, transition: "width 0.8s ease-out" }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{rec.confidence}% confidence</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CurrentMeetingContext = ({ insights }: { insights?: any }) => {
  const [open, setOpen] = useState(false);
  const [expandedQA, setExpandedQA] = useState<Record<number, boolean>>({});

  const summary = insights?.summary ?? mockSummary;
  const keyTakeaways: string[] = summary?.key_takeaways ?? summary?.keyTakeaways ?? [];
  const nextSteps: { assignee: string; action?: string; description?: string }[] = insights?.next_steps ?? mockSummary.nextSteps;
  const questionsAndObjections: { question: string; answer: string; timestamp?: string; time?: string }[] =
    insights?.questions_and_objections ?? mockSummary.questionsAndObjections;
  const summaryText: string = typeof summary === "string" ? summary : summary?.text ?? "";

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <button className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left" onClick={() => setOpen(!open)}>
        <FileText className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <span className="text-sm font-semibold text-foreground flex-1">Current Meeting Context</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Raw data</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Summary</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{summaryText}</p>
          </div>
          {keyTakeaways.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Key Takeaways</span>
              </div>
              <ul className="space-y-1">
                {keyTakeaways.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--forskale-green))] shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nextSteps.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Next Steps</span>
              </div>
              <div className="space-y-1.5">
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <input type="checkbox" className="mt-1 rounded border-border accent-[hsl(var(--forskale-teal))]" />
                    <div>
                      <span className="text-status-great font-medium">{step.assignee}</span>
                      <span className="text-foreground ml-1">{step.action ?? step.description ?? ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {questionsAndObjections.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Questions & Objections</span>
              </div>
              <div className="space-y-1.5">
                {questionsAndObjections.map((qa, i) => (
                  <div key={i} className="bg-secondary rounded-lg">
                    <button className="w-full flex items-center justify-between px-3 py-2 text-left" onClick={() => setExpandedQA(p => ({ ...p, [i]: !p[i] }))}>
                      <span className="text-sm text-foreground">{qa.question}</span>
                      {expandedQA[i] ? <ChevronUp className="h-3 w-3 text-muted-foreground ml-2 shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground ml-2 shrink-0" />}
                    </button>
                    {expandedQA[i] && (
                      <div className="px-3 pb-2.5 space-y-0.5 animate-fade-in">
                        <div className="text-[11px] text-status-great font-medium">Your answer at {qa.time ?? qa.timestamp}</div>
                        <div className="text-sm text-muted-foreground">{qa.answer}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

interface SummaryTabProps {
  smartSummary?: MeetingSmartSummary | null;
  atlasInsights?: any;
}

const SummaryTab = ({ smartSummary, atlasInsights }: SummaryTabProps) => {
  return (
    <TooltipProvider>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
              <h2 className="text-base sm:text-xl font-heading font-bold text-foreground">Smart Summary</h2>
              <Badge variant="outline" className="text-[9px] h-4 font-bold tracking-wider bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal)/0.3)]">
                Smart S
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Multi-layered deal intelligence</p>
          </div>
          <SyncStatus />
        </div>

        {/* Deal Health */}
        <DealHealthDashboard health={smartSummary?.deal_health} />

        {/* Section 1: Deal Evolution */}
        <DealEvolutionSection evolution={smartSummary?.deal_evolution} />

        {/* Section 2: Then vs Now */}
        {(smartSummary?.then_vs_now?.length || mockThenVsNow.length > 0) && (
          <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.03)] to-card p-5 shadow-card">
            <ThenVsNowSection items={smartSummary?.then_vs_now} />
          </div>
        )}

        {/* Section 3: Change Detection */}
        <ChangeDetectionSection alerts={smartSummary?.change_alerts} />

        {/* Section 4: Enhanced Discussion Topics */}
        <EnhancedTopicsSection topics={smartSummary?.enhanced_topics} />

        {/* Section 5: Current Meeting Context (collapsed raw data) */}
        <CurrentMeetingContext insights={atlasInsights} />

        {/* Section 6: Strategic Direction */}
        <StrategicDirectionSection recommendations={smartSummary?.strategic_recommendations} />
      </div>
    </TooltipProvider>
  );
};

export default SummaryTab;
