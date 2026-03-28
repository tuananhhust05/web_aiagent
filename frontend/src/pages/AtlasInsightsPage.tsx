import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, Users, Target, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import CallListSidebar from "@/components/call-insights/CallListSidebar";
import type { CallEvaluationMap } from "@/components/call-insights/CallListSidebar";
import TranscriptPanel from "@/components/call-insights/TranscriptPanel";
import TranscriptSuccessModal from "@/components/call-insights/TranscriptSuccessModal";
import EvaluationTab from "@/components/call-insights/EvaluationTab";
import EnablementTab from "@/components/call-insights/EnablementTab";
import SummaryTab from "@/components/call-insights/SummaryTab";
import StrategyModal from "@/components/call-insights/StrategyModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { meetingsAPI } from "@/lib/api";
import type {
  MeetingEvaluation,
  MeetingFeedback,
  MeetingSmartSummary,
  MeetingPlaybookAnalysis,
} from "@/lib/api";
import type { CallItem, NegotiationStage, TranscriptEntry } from "@/data/mockData";
import { mockCalls, mockCallEvaluations, mockTranscript } from "@/data/mockData";

type TabType = "evaluation" | "enablement" | "summary";

const tabs: { id: TabType; label: string; subtitle: string; icon: React.ElementType }[] = [
  { id: "evaluation", label: "Evaluation", subtitle: "What happened and what to do next", icon: Target },
  { id: "enablement", label: "Enablement", subtitle: "Your performance and improvement areas", icon: GraduationCap },
  { id: "summary", label: "Smart Summary", subtitle: "Cross-meeting intelligence that tracks deal evolution and detects strategic shifts", icon: Sparkles },
];

const STAGE_MAP: Record<string, NegotiationStage> = {
  discovery: "Discovery",
  lead: "Discovery",
  qualified: "Discovery",
  demo: "Demo",
  presentation: "Demo",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closing: "Closing",
  closed: "Closing",
  won: "Closing",
  lost: "Closing",
};

function mapDealStage(stage?: string): NegotiationStage {
  if (!stage) return "Discovery";
  const key = stage.toLowerCase();
  for (const [k, v] of Object.entries(STAGE_MAP)) {
    if (key.includes(k)) return v;
  }
  return "Discovery";
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function durationFromTimestamp(ts?: string): number {
  if (!ts) return 0;
  const parts = ts.split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return 0;
}

function durationFromTranscript(transcriptLines?: any[]): string {
  if (!Array.isArray(transcriptLines) || transcriptLines.length === 0) return "";
  const last = transcriptLines[transcriptLines.length - 1];
  const secs = durationFromTimestamp(last?.time || last?.timestamp);
  return formatDuration(secs);
}

function capitalizeStage(stage: string): string {
  return stage.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase()).replace(/-/g, " ");
}

function mapMeetingToCallItem(meeting: any): CallItem {
  const hasTranscript = Array.isArray(meeting.transcript_lines) && meeting.transcript_lines.length > 0;
  const date = meeting.created_at
    ? new Date(meeting.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const duration = formatDuration(meeting.duration_seconds) || durationFromTranscript(meeting.transcript_lines);
  return {
    id: meeting.id,
    title: meeting.title || "Untitled Meeting",
    date,
    duration,
    company: meeting.company || meeting.company_name || "",
    product: meeting.product || "",
    negotiationStage: mapDealStage(meeting.deal_stage || meeting.stage),
    dataSource: hasTranscript ? "call" : "crm",
    dataCompleteness: meeting.data_completeness ?? (hasTranscript ? 80 : 40),
  };
}

function mapTranscriptLines(lines: any[]): TranscriptEntry[] {
  return lines.map((l: any) => ({
    speaker: l.speaker || "Speaker",
    timestamp: l.time || "",
    text: l.text || "",
    color: "blue",
  }));
}

const AtlasInsightsPage = () => {
  const [calls, setCalls] = useState<CallItem[]>(mockCalls);
  const [callEvaluations, setCallEvaluations] = useState<CallEvaluationMap>(mockCallEvaluations);
  const [selectedCall, setSelectedCall] = useState<string>(mockCalls[0]?.id ?? "");
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>(mockTranscript);
  const [evaluation, setEvaluation] = useState<MeetingEvaluation | null>(null);
  const [feedback, setFeedback] = useState<MeetingFeedback | null>(null);
  const [playbookAnalysis, setPlaybookAnalysis] = useState<MeetingPlaybookAnalysis | null>(null);
  const [smartSummary, setSmartSummary] = useState<MeetingSmartSummary | null>(null);
  const [atlasInsights, setAtlasInsights] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>("evaluation");
  const [callListCollapsed, setCallListCollapsed] = useState(false);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(true);
  const [showTranscriptModal, setShowTranscriptModal] = useState(true);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);

  const meetingCache = useRef<Record<string, {
    evaluation: MeetingEvaluation | null;
    feedback: MeetingFeedback | null;
    playbookAnalysis: MeetingPlaybookAnalysis | null;
    smartSummary: MeetingSmartSummary | null;
    atlasInsights: any;
    transcriptEntries: TranscriptEntry[];
  }>>({});

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await meetingsAPI.getMeetings({ limit: 50 });
        const meetingList: any[] = (res.data as any)?.meetings || [];
        if (meetingList.length === 0) return;

        const mapped = meetingList.map(mapMeetingToCallItem);
        const evalMap: CallEvaluationMap = {};
        for (const m of meetingList) {
          const hasEval = !!(m.atlas_evaluation && (m.atlas_evaluation.generated_at || m.atlas_evaluation.outcome));
          const actionCount = Array.isArray(m.atlas_next_steps)
            ? m.atlas_next_steps.length
            : Array.isArray(m.atlas_evaluation?.recommended_actions)
            ? m.atlas_evaluation.recommended_actions.length
            : 0;
          const dp = m.atlas_evaluation?.outcome?.deal_progression;
          evalMap[m.id] = {
            status: hasEval ? "evaluated" : "pending",
            actionCount,
            progression: dp?.from && dp?.to
              ? `${capitalizeStage(dp.from)} → ${capitalizeStage(dp.to)} ↑`
              : undefined,
          };
        }

        setCalls(mapped);
        setCallEvaluations(evalMap);
        setSelectedCall(mapped[0].id);
        setTranscriptEntries([]);
        setShowTranscriptModal(false);
        setUsingRealData(true);
      } catch {
        // keep mock data on error
      }
    };
    fetchMeetings();
  }, []);

  const loadMeetingData = useCallback(async (meetingId: string) => {
    if (!meetingId || !usingRealData) return;

    if (meetingCache.current[meetingId]) {
      const cached = meetingCache.current[meetingId];
      setEvaluation(cached.evaluation);
      setFeedback(cached.feedback);
      setPlaybookAnalysis(cached.playbookAnalysis);
      setSmartSummary(cached.smartSummary);
      setAtlasInsights(cached.atlasInsights);
      setTranscriptEntries(cached.transcriptEntries);
      return;
    }

    setLoadingInsights(true);
    setEvaluation(null);
    setFeedback(null);
    setPlaybookAnalysis(null);
    setSmartSummary(null);
    setAtlasInsights(null);
    setTranscriptEntries([]);

    let fetchedTranscript: TranscriptEntry[] = [];
    try {
      const [meetingRes, transcriptRes] = await Promise.allSettled([
        meetingsAPI.getMeeting(meetingId),
        meetingsAPI.getMeetingTranscription(meetingId),
      ]);

      if (transcriptRes.status === "fulfilled") {
        const lines = ((transcriptRes.value as any).data as any)?.transcript_lines || [];
        fetchedTranscript = mapTranscriptLines(lines);
        setTranscriptEntries(fetchedTranscript);
        if (fetchedTranscript.length > 0) setShowTranscriptModal(true);
      }

      const meetingDetail = meetingRes.status === "fulfilled" ? (meetingRes.value as any).data : null;
      if (meetingDetail) {
        setCalls((prev) =>
          prev.map((c) => (c.id === meetingId ? mapMeetingToCallItem(meetingDetail) : c))
        );
      }
    } catch {}

    const [evalRes, feedbackRes, playbookRes, summaryRes, insightsRes] = await Promise.allSettled([
      meetingsAPI.getMeetingEvaluation(meetingId),
      meetingsAPI.getMeetingFeedback(meetingId),
      meetingsAPI.getMeetingPlaybookAnalysis(meetingId),
      meetingsAPI.getMeetingSmartSummary(meetingId),
      meetingsAPI.getAtlasMeetingInsights(meetingId),
    ]);

    const newEval = evalRes.status === "fulfilled" ? (evalRes.value as any).data : null;
    const newFeedback = feedbackRes.status === "fulfilled" ? (feedbackRes.value as any).data : null;
    const newPlaybook = playbookRes.status === "fulfilled" ? (playbookRes.value as any).data : null;
    const newSummary = summaryRes.status === "fulfilled" ? (summaryRes.value as any).data : null;
    const newInsights = insightsRes.status === "fulfilled" ? (insightsRes.value as any).data : null;

    meetingCache.current[meetingId] = {
      evaluation: newEval,
      feedback: newFeedback,
      playbookAnalysis: newPlaybook,
      smartSummary: newSummary,
      atlasInsights: newInsights,
      transcriptEntries: fetchedTranscript,
    };

    if (newEval) {
      setEvaluation(newEval);
      const dp = newEval?.outcome?.deal_progression;
      setCallEvaluations((prev) => ({
        ...prev,
        [meetingId]: {
          status: "evaluated",
          actionCount: Array.isArray(newEval?.recommended_actions) ? newEval.recommended_actions.length : 0,
          progression: dp?.from && dp?.to
            ? `${capitalizeStage(dp.from)} → ${capitalizeStage(dp.to)} ↑`
            : prev[meetingId]?.progression,
        },
      }));
    }
    if (newFeedback) setFeedback(newFeedback);
    if (newPlaybook) setPlaybookAnalysis(newPlaybook);
    if (newSummary) setSmartSummary(newSummary);
    if (newInsights) setAtlasInsights(newInsights);

    setLoadingInsights(false);
  }, [usingRealData]);

  useEffect(() => {
    if (selectedCall && usingRealData) {
      loadMeetingData(selectedCall);
    }
  }, [selectedCall, usingRealData, loadMeetingData]);

  const meetingTitle = calls.find((c) => c.id === selectedCall)?.title || "Select a meeting";
  const meetingDate = calls.find((c) => c.id === selectedCall)?.date || "";
  const playbookScorePct = evaluation?.playbook_score_pct ?? (playbookAnalysis?.overall_score ?? (usingRealData ? null : 79));

  const meetingCountThisMonth = calls.filter((c) => {
    if (!c.date) return false;
    const d = new Date(c.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex flex-1 overflow-hidden bg-background h-screen">
      <CallListSidebar
        calls={calls}
        selectedId={selectedCall}
        onSelect={setSelectedCall}
        collapsed={callListCollapsed}
        onToggle={() => setCallListCollapsed((prev) => !prev)}
        callEvaluations={callEvaluations}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
        <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
          <button
            onClick={() => setCallListCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Calls
          </button>

          <div className="flex items-center justify-between mb-4 gap-4">
            <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight leading-tight">
              {meetingTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {playbookScorePct != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                {playbookScorePct}% of sales playbook executed
              </span>
            )}
            {meetingDate && <span>{meetingDate}</span>}
            {transcriptEntries.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {new Set(transcriptEntries.map((e) => e.speaker)).size} speakers
              </span>
            )}
          </div>

          <TooltipProvider>
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const tabButton = (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative pb-3 flex items-center gap-2 transition-colors group",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
                    <span className={cn(
                      "text-sm transition-all",
                      tab.id === "evaluation" ? "font-bold" : "font-semibold",
                    )}>
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] forskale-gradient-bg rounded-full" />
                    )}
                  </button>
                );
                if (tab.id === "summary") {
                  return (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>{tabButton}</TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[280px] text-xs">
                        {tab.subtitle}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return tabButton;
              })}
            </div>
          </TooltipProvider>
        </div>

        <div className="flex-1 overflow-y-auto atlas-scrollbar p-8 bg-background transition-all duration-300 ease-in-out">
          {loadingInsights ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-sm text-muted-foreground">Analyzing meeting...</div>
            </div>
          ) : (
            <>
              {activeTab === "evaluation" && (
                <EvaluationTab
                  evaluation={evaluation}
                  onOpenStrategyModal={() => setStrategyModalOpen(true)}
                />
              )}
              {activeTab === "enablement" && (
                <EnablementTab
                  feedback={feedback}
                  playbookAnalysis={playbookAnalysis}
                  meetingCount={meetingCountThisMonth || undefined}
                />
              )}
              {activeTab === "summary" && (
                <SummaryTab
                  smartSummary={smartSummary}
                  atlasInsights={atlasInsights}
                />
              )}
            </>
          )}
        </div>
      </div>

      <TranscriptPanel
        entries={transcriptEntries}
        collapsed={transcriptCollapsed}
        onToggle={() => setTranscriptCollapsed((prev) => !prev)}
        meetingId={selectedCall}
        isNewTranscript={transcriptEntries.length > 0}
      />

      <TranscriptSuccessModal
        meetingId={selectedCall}
        isNewTranscript={showTranscriptModal}
        onViewTranscript={() => {
          setTranscriptCollapsed(false);
          setShowTranscriptModal(false);
        }}
        onDismiss={() => setShowTranscriptModal(false)}
      />
      <StrategyModal isOpen={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} meetingId={selectedCall || undefined} />
    </div>
  );
};

export default AtlasInsightsPage;
