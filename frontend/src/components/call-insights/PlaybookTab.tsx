import { useState, useCallback } from "react";
import { Check, ChevronDown, ChevronUp, Download, RefreshCw, Sparkles, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockPlaybookRules, mockPlaybookMetrics } from "@/data/mockData";
import { mockMethodologyScores, type PlaybookAnalysis } from "@/data/playbookAnalysisData";
import AdvancedAnalysisModal from "./AdvancedAnalysisModal";
import DetailedAnalysisDashboard from "./DetailedAnalysisDashboard";
import type { MeetingPlaybookAnalysis } from "@/lib/api";

type AnalysisState = "initial" | "analyzing" | "complete";

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

const getScoreRingColor = (score: number) => {
  if (score >= 70) return "stroke-[hsl(var(--forskale-green))]";
  if (score >= 40) return "stroke-[hsl(var(--forskale-cyan))]";
  return "stroke-status-needs-work";
};

// Semi-circle gauge component
const DealHealthGauge = ({ score }: { score: number }) => {
  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-32 h-20 flex items-end justify-center">
      <svg viewBox="0 0 120 68" className="w-full h-full">
        <path
          d="M 6 62 A 54 54 0 0 1 114 62"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 6 62 A 54 54 0 0 1 114 62"
          fill="none"
          className={getScoreRingColor(score)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <span className={cn("text-2xl font-bold font-heading tabular-nums", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
};

interface PlaybookTabProps {
  playbookAnalysis?: MeetingPlaybookAnalysis | null;
}

const PlaybookTab = ({ playbookAnalysis }: PlaybookTabProps) => {
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const [analysisState, setAnalysisState] = useState<AnalysisState>("initial");
  const [analysisResult, setAnalysisResult] = useState<PlaybookAnalysis | null>(null);
  const [showDetailed, setShowDetailed] = useState(false);

  const realRules = playbookAnalysis?.rules?.length
    ? playbookAnalysis.rules.map((r, i) => ({
        id: r.rule_id ?? String(i),
        label: r.label,
        passed: r.passed,
        weight: 20,
        isKeyDriver: false,
        whatYouSaid: r.what_you_said ?? "No relevant quote found in transcript.",
        whatYouShouldSay: r.what_you_should_say ?? "",
      }))
    : null;

  const displayRules = realRules ?? mockPlaybookRules;

  const realMetrics = playbookAnalysis?.dimension_scores
    ? Object.entries(playbookAnalysis.dimension_scores).map(([label, value]) => ({
        label,
        value: `${value}%`,
      }))
    : null;

  const displayMetrics = realMetrics ?? mockPlaybookMetrics;
  const overallScore = playbookAnalysis?.overall_score ?? null;

  const handleAnalysisComplete = useCallback((result: PlaybookAnalysis) => {
    setAnalysisResult(result);
    setAnalysisState("complete");
  }, []);

  const handleViewDetailed = useCallback((result: PlaybookAnalysis) => {
    setAnalysisResult(result);
    setAnalysisState("complete");
    setShowDetailed(true);
  }, []);

  const handleReanalyze = useCallback(() => {
    setAnalysisState("analyzing");
    setAnalysisResult(null);
    setShowDetailed(false);
  }, []);

  const toggleRule = (id: string) => setExpandedRules((p) => ({ ...p, [id]: !p[id] }));

  const sorted = [...mockMethodologyScores].sort((a, b) => b.overallScore - a.overallScore);
  const top = sorted[0];
  const score = analysisResult?.consensusScore
    ? Math.round(analysisResult.consensusScore)
    : overallScore != null
    ? overallScore
    : top.overallScore;

  // Generate coach summary from analysis
  const getCoachSummary = () => {
    const topMethod = sorted[0];
    const missed = topMethod.elementsDetected.filter(e => !e.detected);
    const strong = topMethod.elementsDetected.filter(e => e.detected && e.score >= 80);
    
    let summary = `Strong discovery call with clear next steps`;
    if (strong.length > 0) summary += ` — great ${strong[0].name.toLowerCase()} identification`;
    if (missed.length > 0) summary += `, but you missed identifying the ${missed[0].name.toLowerCase()}.`;
    else summary += ".";
    return summary;
  };

  return (
    <div className="space-y-5">
      {/* Deal Health Header */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        {analysisState === "initial" && !playbookAnalysis && (
          <div className="flex items-center gap-3 p-4 flex-wrap">
            <div className="relative" />
            <button
              onClick={() => setAnalysisState("analyzing")}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 forskale-gradient-bg text-white text-sm font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.4)] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Analyze this meeting
            </button>
          </div>
        )}

        {((analysisState === "complete" && analysisResult) || (playbookAnalysis && analysisState !== "analyzing")) && (
          <div className="p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Deal Health Score Card */}
            <div className="bg-[hsl(var(--forskale-green)/0.06)] border border-[hsl(var(--forskale-green)/0.2)] rounded-xl p-5 mb-4">
              <div className="flex items-start gap-6 flex-wrap">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-1">
                  <DealHealthGauge score={score} />
                  <span className={cn("text-xs font-semibold", getScoreColor(score))}>
                    {getScoreLabel(score)}
                  </span>
                  {score >= 75 && (
                    <div className="flex items-center gap-1 mt-1 animate-in zoom-in duration-500">
                      <Trophy className="h-3.5 w-3.5 text-[hsl(var(--forskale-green))]" />
                      <span className="text-[10px] font-medium text-status-great">Great job!</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold font-heading text-foreground mb-1">
                    Deal Health Score
                  </h3>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className="bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)] text-[10px]">
                      🎯 {top.name} Approach
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {analysisResult?.methodologies?.length ?? 0} methods analyzed
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getCoachSummary()}
                  </p>
                </div>
              </div>

              {/* Quick Performance Indicators */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[hsl(var(--forskale-green)/0.15)]">
                {sorted.slice(0, 3).map((m) => (
                  <div key={m.frameworkId} className="text-center">
                    <div className={cn("text-lg font-bold font-heading tabular-nums", getScoreColor(m.overallScore))}>
                      {m.overallScore}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">{m.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowDetailed(true)}
                className="inline-flex items-center gap-2 px-4 py-2 forskale-gradient-bg text-white text-xs font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                View Full Coaching Report
              </button>
              <button
                onClick={handleReanalyze}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Re-analyze
              </button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export Report
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="flex gap-3 flex-wrap">
        {displayMetrics.map((m) => {
          const val = parseInt(m.value);
          return (
            <div
              key={m.label}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-center min-w-[120px] bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-md",
                val >= 80
                  ? "border-[hsl(var(--forskale-green)/0.2)]"
                  : val >= 20
                    ? "border-[hsl(var(--forskale-cyan)/0.2)]"
                    : "border-border",
              )}
            >
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
              <div
                className={cn(
                  "text-lg font-bold font-heading",
                  val >= 80 ? "text-status-great" : val >= 20 ? "text-status-okay" : "text-muted-foreground",
                )}
              >
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rules with coaching enhancements */}
      <div className="space-y-2">
        {displayRules.map((rule) => (
          <div
            key={rule.id}
            className="border border-border rounded-xl overflow-hidden bg-card shadow-card transition-all hover:shadow-card-md"
          >
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => toggleRule(rule.id)}>
              {rule.passed ? (
                <Check className="h-4 w-4 text-status-great shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-status-needs-work shrink-0" />
              )}
              <span className="text-sm text-foreground flex-1 font-medium">{rule.label}</span>
              {rule.isKeyDriver && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 border-[hsl(var(--forskale-green)/0.3)] text-status-great bg-[hsl(var(--badge-green-bg))]"
                >
                  Key Driver
                </Badge>
              )}
              {!rule.passed && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 border-status-needs-work/30 text-status-needs-work bg-status-needs-work/5"
                >
                  Missed Opportunity
                </Badge>
              )}
              {expandedRules[rule.id] ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {expandedRules[rule.id] && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 animate-fade-in">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">What you said</div>
                  <div className="bg-secondary rounded-lg p-3 text-xs text-foreground leading-relaxed">
                    {rule.whatYouSaid}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[hsl(var(--forskale-green))]" />
                    Coaching tip — try this next time
                  </div>
                  <div className="bg-[hsl(var(--badge-green-bg))] rounded-lg p-3 text-xs text-foreground leading-relaxed border border-[hsl(var(--forskale-green)/0.2)]">
                    {rule.whatYouShouldSay}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analysis Modals */}
      <AdvancedAnalysisModal
        isOpen={analysisState === "analyzing"}
        onComplete={handleAnalysisComplete}
        onViewDetailed={handleViewDetailed}
      />

      <DetailedAnalysisDashboard
        analysis={analysisResult || ({} as PlaybookAnalysis)}
        isOpen={showDetailed && !!analysisResult}
        onClose={() => setShowDetailed(false)}
      />
    </div>
  );
};

export default PlaybookTab;
