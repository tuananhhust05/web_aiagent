// ============================================================
// AtlasInsightsPage.tsx
// UI copied from dream-schematic-deck-main/src/pages/CallInsights.tsx
// Real API logic restored and integrated into new MeetingInsightDashboard UI
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Target, GraduationCap, Sparkles, LayoutDashboard, RefreshCw, Loader2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import TranscriptPanel from "@/components/call-insights/TranscriptPanel";
import TranscriptSuccessModal from "@/components/call-insights/TranscriptSuccessModal";
import EvaluationTab from "@/components/call-insights/EvaluationTab";
import EnablementTab from "@/components/call-insights/EnablementTab";
import SummaryTab from "@/components/call-insights/SummaryTab";
import StrategyModal from "@/components/call-insights/StrategyModal";
import { mockTranscript } from "@/data/mockData";
import { MeetingInsightDashboard } from "@/pages/MeetingInsightDashboard";
import { MeetLangProvider, tMeet, type MeetLang } from "@/components/meetInsight/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { meetingsAPI } from "@/lib/api";
import type { MeetingEvaluation, MeetingFeedback, MeetingSmartSummary, MeetingPlaybookAnalysis } from "@/lib/api";
import type { TranscriptEntry } from "@/data/mockData";
import type { MeetingCall } from "@/types/meeting";
import { useAuth } from "@/hooks/useAuth";

type TabType = "evaluation" | "enablement" | "summary";

const AtlasInsightsPage = () => {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("evaluation");
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(true);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [language, setLanguage] = useState<MeetLang>("EN");

  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Andrea";

  // ── Meetings list state ──
  type MeetingsListState = "loading" | "empty" | "ready" | "error";
  const [meetingsListState, setMeetingsListState] = useState<MeetingsListState>("loading");
  const [realMeetings, setRealMeetings] = useState<MeetingCall[]>([]);
  const [usingRealData, setUsingRealData] = useState(false);

  // ── Detail data state ──
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [evaluation, setEvaluation] = useState<MeetingEvaluation | null>(null);
  const [feedback, setFeedback] = useState<MeetingFeedback | null>(null);
  const [playbookAnalysis, setPlaybookAnalysis] = useState<MeetingPlaybookAnalysis | null>(null);
  const [smartSummary, setSmartSummary] = useState<MeetingSmartSummary | null>(null);
  const [atlasInsights, setAtlasInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);

  const meetingCache = useRef<Record<string, {
    evaluation: MeetingEvaluation | null;
    feedback: MeetingFeedback | null;
    playbookAnalysis: MeetingPlaybookAnalysis | null;
    smartSummary: MeetingSmartSummary | null;
    atlasInsights: any;
    transcriptEntries: TranscriptEntry[];
  }>>({});

  const shownTranscriptIds = useRef<Set<string>>(
    new Set(JSON.parse(sessionStorage.getItem('shownTranscriptIds') || '[]'))
  );

  const tabs: { id: TabType; labelKey: "tab.evaluation" | "tab.enablement" | "tab.summary"; icon: React.ElementType }[] = [
    { id: "evaluation", labelKey: "tab.evaluation", icon: Target },
    { id: "summary",    labelKey: "tab.summary",    icon: Sparkles },
    { id: "enablement", labelKey: "tab.enablement", icon: GraduationCap },
  ];

  // ── Helpers ──
  function formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function durationFromTimestamp(ts?: string): number {
    if (!ts) return 0;
    const parts = ts.split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    return 0;
  }

  function durationFromTranscript(lines?: any[]): string {
    if (!Array.isArray(lines) || lines.length === 0) return "";
    const last = lines[lines.length - 1];
    const secs = durationFromTimestamp(last?.time || last?.timestamp);
    return formatDuration(secs);
  }

  function mapApiMeetingToMeetingCall(m: any): MeetingCall {
    const hasEval = !!(m.atlas_evaluation && (m.atlas_evaluation.generated_at || m.atlas_evaluation.outcome));
    const actionCount = Array.isArray(m.atlas_next_steps)
      ? m.atlas_next_steps.length
      : Array.isArray(m.atlas_evaluation?.recommended_actions)
      ? m.atlas_evaluation.recommended_actions.length
      : 0;
    return {
      id: m.id,
      title: m.title || "Untitled Meeting",
      company: m.company || m.company_name || "",
      date: m.created_at || new Date().toISOString(),
      duration: formatDuration(m.duration_seconds) || durationFromTranscript(m.transcript_lines),
      interestScore: m.interest_score ?? null,
      evalStatus: hasEval ? "Evaluated" : "Pending",
      sourceType: (Array.isArray(m.transcript_lines) && m.transcript_lines.length > 0) ? "Call" : "CRM",
      actionCount,
      keyMoments: [],
      insightUnread: !hasEval,
      strategizeNotDone: hasEval && actionCount > 0,
      freshInsight: hasEval && !m._insightViewed,
    };
  }

  // ── Fetch meetings list ──
  const fetchMeetingsList = useCallback(async () => {
    setMeetingsListState("loading");
    try {
      const res = await meetingsAPI.getMeetings({ limit: 50 });
      const meetingList: any[] = (res.data as any)?.meetings || [];
      if (meetingList.length === 0) {
        setRealMeetings([]);
        setUsingRealData(true);
        setMeetingsListState("empty");
        return;
      }
      const mapped = meetingList.map(mapApiMeetingToMeetingCall);
      setRealMeetings(mapped);
      setUsingRealData(true);
      setMeetingsListState("ready");
    } catch {
      setMeetingsListState("error");
    }
  }, []);

  useEffect(() => {
    fetchMeetingsList();
  }, [fetchMeetingsList]);

  // ── Load detail data when a meeting is selected ──
  function mapTranscriptLines(lines: any[]): TranscriptEntry[] {
    return lines.map((l: any) => ({
      speaker: l.speaker || "Speaker",
      timestamp: l.time || "",
      text: l.text || "",
      color: "blue" as const,
    }));
  }

  const loadMeetingData = useCallback(async (meetingId: string) => {
    if (!meetingId) return;

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
        if (fetchedTranscript.length > 0 && !shownTranscriptIds.current.has(meetingId)) {
          setShowTranscriptModal(true);
          shownTranscriptIds.current.add(meetingId);
          sessionStorage.setItem('shownTranscriptIds', JSON.stringify([...shownTranscriptIds.current]));
        }
      }

      if (meetingRes.status === "fulfilled") {
        const detail = (meetingRes.value as any).data;
        if (detail) {
          setRealMeetings(prev => prev.map(m => m.id === meetingId ? mapApiMeetingToMeetingCall(detail) : m));
        }
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

    if (newEval) setEvaluation(newEval);
    if (newFeedback) setFeedback(newFeedback);
    if (newPlaybook) setPlaybookAnalysis(newPlaybook);
    if (newSummary) setSmartSummary(newSummary);
    if (newInsights) setAtlasInsights(newInsights);

    // Update evalStatus in realMeetings list
    if (newEval) {
      setRealMeetings(prev => prev.map(m =>
        m.id === meetingId
          ? { ...m, evalStatus: "Evaluated" as const, actionCount: Array.isArray(newEval.recommended_actions) ? newEval.recommended_actions.length : m.actionCount }
          : m
      ));
    }

    setLoadingInsights(false);
  }, []);

  useEffect(() => {
    if (selectedCall && usingRealData) {
      loadMeetingData(selectedCall);
    }
  }, [selectedCall, usingRealData, loadMeetingData]);

  // ── Reanalyze ──
  const handleReanalyzeTranscript = useCallback(async () => {
    if (!selectedCall || reanalyzeLoading || loadingInsights) return;
    setReanalyzeLoading(true);
    try {
      await meetingsAPI.reanalyzeMeeting(selectedCall);
      delete meetingCache.current[selectedCall];
      await loadMeetingData(selectedCall);
    } catch {
    } finally {
      setReanalyzeLoading(false);
    }
  }, [selectedCall, reanalyzeLoading, loadingInsights, loadMeetingData]);

  // ── Derived values for detail header ──
  const selectedMeeting = realMeetings.find(m => m.id === selectedCall);
  const meetingTitle = selectedMeeting?.title || "Select a meeting";
  const meetingDate = selectedMeeting?.date
    ? new Date(selectedMeeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const playbookScorePct = evaluation?.playbook_score_pct ??
    (playbookAnalysis?.overall_score != null ? playbookAnalysis.overall_score : null);
  const meetingCountThisMonth = realMeetings.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleSelectMeeting = (id: string) => {
    setSelectedCall(id);
    setShowTranscriptModal(true);
  };

  const handleBackToOverview = () => {
    setSelectedCall(null);
    setTranscriptCollapsed(true);
    setShowTranscriptModal(false);
  };

  // ── Loading / Error / Empty screens ──
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
          <button type="button" onClick={() => fetchMeetingsList()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--forskale-teal))] text-white hover:opacity-90 transition-opacity">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (meetingsListState === "empty") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background h-screen px-6">
        <Video className="h-14 w-14 text-muted-foreground/30 mb-5" />
        <h1 className="text-xl font-heading font-bold text-foreground tracking-tight mb-2 text-center">No meetings yet</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
          Meeting insights appear here after you have recorded or imported calls.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/atlas/calendar"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-[hsl(var(--forskale-teal))] text-white hover:opacity-90 transition-opacity">
            Open calendar
          </Link>
          <Link to="/atlas/calls"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card text-foreground hover:bg-accent transition-colors">
            View calls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <MeetLangProvider language={language}>
      <div className="flex flex-1 overflow-hidden bg-background">
        {selectedCall === null ? (
          <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {tMeet("topbar.title", language)}
              </span>
              <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
                <button
                  onClick={() => setLanguage("IT")}
                  className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "IT" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >IT</button>
                <button
                  onClick={() => setLanguage("EN")}
                  className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "EN" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >EN</button>
              </div>
            </div>
            <MeetingInsightDashboard
              onSelectMeeting={handleSelectMeeting}
              userName={userName}
              meetings={usingRealData && realMeetings.length > 0 ? realMeetings : undefined}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {tMeet("topbar.title", language)}
                </span>
                <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setLanguage("IT")}
                    className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "IT" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >IT</button>
                  <button
                    onClick={() => setLanguage("EN")}
                    className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "EN" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >EN</button>
                </div>
              </div>

              <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handleBackToOverview}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {tMeet("detail.overview", language)}
                  </button>
                </div>

                <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
                  <h1 className="text-lg sm:text-2xl font-heading font-bold text-foreground tracking-tight leading-tight line-clamp-2 min-w-0 flex-1">
                    {meetingTitle}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-4">
                  {playbookScorePct != null && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                      {playbookScorePct}% {tMeet("detail.playbook", language)}
                    </span>
                  )}
                  {meetingDate && <span className="tabular-nums">{meetingDate}</span>}
                  {transcriptEntries.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                      {new Set(transcriptEntries.map(e => e.speaker)).size} {tMeet("detail.speakers", language)}
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
                            "disabled:opacity-45 disabled:pointer-events-none"
                          )}
                        >
                          {reanalyzeLoading || loadingInsights
                            ? <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin opacity-90" />
                            : <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" />
                          }
                          <span>{language === "IT" ? "Rigenera insights" : "Regenerate insights"}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="end" className="max-w-[280px] text-xs leading-relaxed">
                        Re-run full AI analysis on the transcript.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div>
                  <div className="flex gap-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "relative pb-3 flex items-center gap-2 transition-colors group",
                            isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
                          <span className={cn("text-sm transition-all", tab.id === "evaluation" ? "font-bold" : "font-semibold")}>
                            {tMeet(tab.labelKey, language)}
                          </span>
                          {isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] forskale-gradient-bg rounded-full" />}
                        </button>
                      );
                    })}
                    {/* Strategize button */}
                    <div className="pb-3 flex items-center">
                      <button
                        onClick={() => setStrategyModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[hsl(var(--forskale-teal))] text-white hover:bg-[hsl(var(--forskale-teal)/0.9)] transition-all hover:scale-[1.02]"
                      >
                        <Sparkles className="h-3 w-3" />
                        {language === "IT" ? "Strategizza" : "Strategize"}
                      </button>
                    </div>
                  </div>
                </div>
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

            <TranscriptPanel
              entries={transcriptEntries.length > 0 ? transcriptEntries : mockTranscript}
              collapsed={transcriptCollapsed}
              onToggle={() => setTranscriptCollapsed((prev) => !prev)}
              meetingId={selectedCall ?? undefined}
              isNewTranscript={transcriptEntries.length > 0}
            />
            <TranscriptSuccessModal
              meetingId={selectedCall ?? ""}
              isNewTranscript={showTranscriptModal}
              onViewTranscript={() => { setTranscriptCollapsed(false); setShowTranscriptModal(false); }}
              onDismiss={() => setShowTranscriptModal(false)}
            />
          </>
        )}
        <StrategyModal isOpen={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} meetingId={selectedCall ?? undefined} />
      </div>
    </MeetLangProvider>
  );
};

export default AtlasInsightsPage;
