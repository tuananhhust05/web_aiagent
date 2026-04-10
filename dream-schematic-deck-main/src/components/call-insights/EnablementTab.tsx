import { TrendingUp, ThumbsUp, Zap, Sparkles, GraduationCap, MessageSquare, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { mockMetrics, mockCoachWell, mockCoachImprove } from "@/data/mockData";
import PlaybookTab from "./PlaybookTab";

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

const FeedbackContent = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
  const t = useT();

  return (
    <div className="space-y-8">
      {/* Performance Metrics */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <TrendingUp className="h-4 w-4 text-[hsl(var(--forskale-purple))]" />
          <h3 className="text-[15px] font-heading font-bold text-foreground">{t("enablement.metrics")}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockMetrics.map((m, i) => (
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
              {mockCoachImprove.map((item, i) => (
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
              {mockCoachWell.map((item, i) => (
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

const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "playbook", label: "Analyze Meeting", icon: BookOpen },
];

const EnablementTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("feedback");
  const t = useT();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--badge-purple-bg))] flex items-center justify-center">
            <GraduationCap className="h-4.5 w-4.5 text-[hsl(var(--forskale-purple))]" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">{t("enablement.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("enablement.subtitle")}</p>
          </div>
        </div>

        {/* Sub-tab navigation — centered */}
        <div className="flex justify-center gap-2">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200",
                  isActive
                    ? "forskale-gradient-bg text-white shadow-md shadow-[hsl(var(--forskale-teal)/0.3)]"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent border border-border"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-white")} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="animate-in fade-in duration-200">
        {activeSubTab === "feedback" && <FeedbackContent />}
        {activeSubTab === "playbook" && <PlaybookTab />}
      </div>
    </div>
  );
};

export default EnablementTab;
