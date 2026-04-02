import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, Target, GraduationCap, Video, Loader2, RefreshCw, Sparkles } from "lucide-react";
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

type TabType = "evaluation" | "enablement" | "summary";

const tabs: { id: TabType; label: string; subtitle: string; icon: React.ElementType }[] = [
  { id: "evaluation", label: "Evaluation", subtitle: "What happened and what to do next", icon: Target },
  { id: "enablement", label: "Enablement", subtitle: "Your performance and improvement areas", icon: GraduationCap },
  // { id: "summary", label: "Smart Summary", subtitle: "Cross-meeting intelligence that tracks deal evolution and detects strategic shifts", icon: Sparkles },
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

type MeetingsListState = "loading" | "empty" | "ready" | "error";

const AtlasInsightsPage = () => {
  const [meetingsListState, setMeetingsListState] = useState<MeetingsListState>("loading");
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [callEvaluations, setCallEvaluations] = useState<CallEvaluationMap>({});
  const [selectedCall, setSelectedCall] = useState<string>("");
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [evaluation, setEvaluation] = useState<MeetingEvaluation | null>(null);
  const [feedback, setFeedback] = useState<MeetingFeedback | null>(null);
  const [playbookAnalysis, setPlaybookAnalysis] = useState<MeetingPlaybookAnalysis | null>(null);
  const [smartSummary, setSmartSummary] = useState<MeetingSmartSummary | null>(null);
  const [atlasInsights, setAtlasInsights] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>("evaluation");
  const [callListCollapsed, setCallListCollapsed] = useState(false);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(true);
  // Track which meeting IDs have already shown the transcript popup this session
  const shownTranscriptIds = useRef<Set<string>>(
    new Set(JSON.parse(sessionStorage.getItem('shownTranscriptIds') || '[]'))
  );
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);

  const meetingCache = useRef<Record<string, {
    evaluation: MeetingEvaluation | null;
    feedback: MeetingFeedback | null;
    playbookAnalysis: MeetingPlaybookAnalysis | null;
    smartSummary: MeetingSmartSummary | null;
    atlasInsights: any;
    transcriptEntries: TranscriptEntry[];
  }>>({});

  const fetchMeetingsList = useCallback(async () => {
    setMeetingsListState("loading");
    try {
      const res = await meetingsAPI.getMeetings({ limit: 50 });
      const meetingList: any[] = (res.data as any)?.meetings || [];
      if (meetingList.length === 0) {
        setCalls([]);
        setCallEvaluations({});
        setSelectedCall("");
        setTranscriptEntries([]);
        setShowTranscriptModal(false);
        setUsingRealData(true);
        setMeetingsListState("empty");
        return;
      }

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
      setMeetingsListState("ready");
    } catch {
      setMeetingsListState("error");
    }
  }, []);

  useEffect(() => {
    fetchMeetingsList();
  }, [fetchMeetingsList]);

  const loadMeetingData = useCallback(async (meetingId: string, evaluationMap?: CallEvaluationMap) => {
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
        if (fetchedTranscript.length > 0
          && !shownTranscriptIds.current.has(meetingId)
          && evaluationMap?.[meetingId]?.status === "pending") {
          setShowTranscriptModal(true);
          shownTranscriptIds.current.add(meetingId);
          sessionStorage.setItem('shownTranscriptIds', JSON.stringify([...shownTranscriptIds.current]));
        }
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

  const handleReanalyzeTranscript = useCallback(async () => {
    if (!selectedCall || reanalyzeLoading || loadingInsights) return;
    setReanalyzeLoading(true);
    try {
      await meetingsAPI.reanalyzeMeeting(selectedCall);
      delete meetingCache.current[selectedCall];
      await loadMeetingData(selectedCall, callEvaluations);
    } catch {
    } finally {
      setReanalyzeLoading(false);
    }
  }, [selectedCall, reanalyzeLoading, loadingInsights, loadMeetingData, callEvaluations]);

  useEffect(() => {
    if (selectedCall && usingRealData) {
      loadMeetingData(selectedCall, callEvaluations);
    }
  }, [selectedCall, usingRealData, loadMeetingData, callEvaluations]);

  const meetingTitle = calls.find((c) => c.id === selectedCall)?.title || "Select a meeting";
  const meetingDate = calls.find((c) => c.id === selectedCall)?.date || "";
  const playbookScorePct =
    evaluation?.playbook_score_pct ?? (playbookAnalysis?.overall_score != null ? playbookAnalysis.overall_score : null);

  const meetingCountThisMonth = calls.filter((c) => {
    if (!c.date) return false;
    const d = new Date(c.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const [mobileCallPickerOpen, setMobileCallPickerOpen] = useState(false);

  if (meetingsListState === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background h-screen">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--forskale-teal))]" />
          <p className="text-sm">Loading meetings...</p>
        </div>
      </div>
    );
  }

  if (meetingsListState === "error") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background h-screen px-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-sm text-foreground">Could not load your meetings.</p>
          <p className="text-xs text-muted-foreground">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => fetchMeetingsList()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--forskale-teal))] text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (meetingsListState === "empty") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background h-screen px-6">
        <Video className="h-14 w-14 text-muted-foreground/30 mb-5" />
        <h1 className="text-xl font-heading font-bold text-foreground tracking-tight mb-2 text-center">
          No meetings yet
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
          Meeting insights appear here after you have recorded or imported calls. Connect your calendar or open Calls to get started.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/atlas/calendar"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-[hsl(var(--forskale-teal))] text-white hover:opacity-90 transition-opacity"
          >
            Open calendar
          </Link>
          <Link
            to="/atlas/calls"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-accent transition-colors"
          >
            View calls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-background h-screen">
      {/* Desktop call list sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <CallListSidebar
          calls={calls}
          selectedId={selectedCall}
          onSelect={setSelectedCall}
          collapsed={callListCollapsed}
          onToggle={() => setCallListCollapsed((prev) => !prev)}
          callEvaluations={callEvaluations}
        />
      </div>

      {/* Mobile call picker drawer */}
      {mobileCallPickerOpen && (
        <div className="fixed inset-0 z-[80] md:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileCallPickerOpen(false)} />
          <div className="relative z-10 flex flex-col bg-card w-72 h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Call History</h3>
              <button onClick={() => setMobileCallPickerOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
              {calls.map((call) => (
                <button
                  key={call.id}
                  onClick={() => { setSelectedCall(call.id); setMobileCallPickerOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm",
                    selectedCall === call.id
                      ? "bg-[hsl(var(--forskale-teal)/0.1)] border border-[hsl(var(--forskale-teal)/0.3)] text-foreground font-semibold"
                      : "text-foreground hover:bg-accent border border-transparent"
                  )}
                >
                  <div className="truncate font-medium text-[13px]">{call.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{call.date} · {call.duration}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
        <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-0 border-b border-border bg-card">
          {/* Desktop: collapse sidebar toggle */}
          <button
            onClick={() => setCallListCollapsed((prev) => !prev)}
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors mb-3 sm:mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Calls
          </button>
          {/* Mobile: open call picker */}
          <button
            onClick={() => setMobileCallPickerOpen(true)}
            className="md:hidden inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors mb-3"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> All Calls
          </button>

          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
            <h1 className="text-lg sm:text-2xl font-heading font-bold text-foreground tracking-tight leading-tight line-clamp-2 min-w-0 flex-1">
              {meetingTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-3 sm:mb-4">
            {playbookScorePct != null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                {playbookScorePct}% playbook
              </span>
            )}
            {meetingDate && <span className="tabular-nums">{meetingDate}</span>}
            {transcriptEntries.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                {new Set(transcriptEntries.map((e) => e.speaker)).size} speakers
              </span>
            )}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void handleReanalyzeTranscript()}
                    disabled={!selectedCall || reanalyzeLoading || loadingInsights}
                    className={cn(
                      "ml-auto inline-flex items-center gap-2 rounded-full pl-3 pr-3.5 py-1.5 text-[11px] sm:text-xs font-semibold tracking-tight",
                      "border border-[hsl(var(--forskale-teal)/0.35)] bg-[hsl(var(--forskale-teal)/0.07)] text-[hsl(var(--forskale-teal))]",
                      "hover:bg-[hsl(var(--forskale-teal)/0.14)] hover:border-[hsl(var(--forskale-teal)/0.45)] transition-colors",
                      "shadow-[0_1px_2px_hsl(var(--forskale-teal)/0.08)] disabled:opacity-45 disabled:pointer-events-none disabled:shadow-none",
                    )}
                  >
                    {reanalyzeLoading || loadingInsights ? (
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" />
                    )}
                    <span>Regenerate insights</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="max-w-[280px] text-xs leading-relaxed">
                  Re-run full AI analysis on the transcript: evaluation, insights, feedback, playbook, smart summary, strategy, and Q&A extraction.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <div className="flex gap-3 sm:gap-6 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const tabButton = (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative pb-3 flex items-center gap-1.5 sm:gap-2 transition-colors group whitespace-nowrap flex-shrink-0",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
                    <span className={cn(
                      "text-xs sm:text-sm transition-all",
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

        <div className="flex-1 overflow-y-auto atlas-scrollbar p-4 sm:p-8 bg-background transition-all duration-300 ease-in-out">
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

      {/* Desktop transcript panel */}
      <div className="hidden md:flex">
        <TranscriptPanel
          entries={transcriptEntries}
          collapsed={transcriptCollapsed}
          onToggle={() => setTranscriptCollapsed((prev) => !prev)}
          meetingId={selectedCall}
          isNewTranscript={transcriptEntries.length > 0}
        />
      </div>

      {/* Mobile: floating transcript button */}
      {transcriptEntries.length > 0 && (
        <button
          onClick={() => setTranscriptCollapsed(false)}
          className="md:hidden fixed bottom-20 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border shadow-lg text-xs font-medium text-foreground"
        >
          <Users className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
          Transcript
        </button>
      )}

      {/* Mobile: transcript full-screen overlay */}
      {!transcriptCollapsed && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col bg-card overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Transcript</h3>
            <button onClick={() => setTranscriptCollapsed(true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <TranscriptPanel
            entries={transcriptEntries}
            collapsed={false}
            onToggle={() => setTranscriptCollapsed(true)}
            meetingId={selectedCall}
            isNewTranscript={transcriptEntries.length > 0}
          />
        </div>
      )}

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
