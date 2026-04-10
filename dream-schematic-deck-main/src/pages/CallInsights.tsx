import { useState } from "react";
import { Users, Target, GraduationCap, Sparkles, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/atlas/AppLayout";
import TranscriptPanel from "@/components/call-insights/TranscriptPanel";
import TranscriptSuccessModal from "@/components/call-insights/TranscriptSuccessModal";
import EvaluationTab from "@/components/call-insights/EvaluationTab";
import EnablementTab from "@/components/call-insights/EnablementTab";
import SummaryTab from "@/components/call-insights/SummaryTab";
import StrategyModal from "@/components/call-insights/StrategyModal";

import { mockTranscript } from "@/data/mockData";
import { MeetingInsightDashboard } from "@/pages/MeetingInsightDashboard";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { t } from "@/i18n/translations";
import type { Language } from "@/i18n/translations";

type TabType = "evaluation" | "enablement" | "summary";

const CallInsights = () => {
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("evaluation");
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(true);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("IT");

  const tabs: { id: TabType; labelKey: "tab.evaluation" | "tab.enablement" | "tab.summary"; subtitleKey: "tab.evaluation.subtitle" | "tab.enablement.subtitle" | "tab.summary.subtitle"; icon: React.ElementType }[] = [
    { id: "evaluation", labelKey: "tab.evaluation", subtitleKey: "tab.evaluation.subtitle", icon: Target },
    { id: "summary", labelKey: "tab.summary", subtitleKey: "tab.summary.subtitle", icon: Sparkles },
    { id: "enablement", labelKey: "tab.enablement", subtitleKey: "tab.enablement.subtitle", icon: GraduationCap },
  ];

  const handleSelectMeeting = (id: string) => {
    setSelectedCall(id);
    setShowTranscriptModal(true);
  };

  const handleBackToOverview = () => {
    setSelectedCall(null);
    setTranscriptCollapsed(true);
    setShowTranscriptModal(false);
  };

  return (
    <LanguageProvider language={language}>
      <AppLayout activeNav="Meeting Insight">
        <div className="flex flex-1 overflow-hidden bg-background">
          {selectedCall === null ? (
            <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("topbar.title", language)}</span>
                <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
                  <button onClick={() => setLanguage("IT")} className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "IT" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>IT</button>
                  <button onClick={() => setLanguage("EN")} className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "EN" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>EN</button>
                </div>
              </div>
              <MeetingInsightDashboard onSelectMeeting={handleSelectMeeting} />
            </div>
          ) : (
            <>
              <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("topbar.title", language)}</span>
                  <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
                    <button onClick={() => setLanguage("IT")} className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "IT" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>IT</button>
                    <button onClick={() => setLanguage("EN")} className={cn("px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200", language === "EN" ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>EN</button>
                  </div>
                </div>

                <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={handleBackToOverview} className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
                      <LayoutDashboard className="h-3.5 w-3.5" /> {t("detail.overview", language)}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4 gap-4">
                    <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight leading-tight">
                      Lavazza A Modo Mio – Introductory Commercial Discussion
                    </h1>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                      79% {t("detail.playbook", language)}
                    </span>
                    <span>Mar 2, 2026</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> 2 {t("detail.speakers", language)}
                    </span>
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
                              {t(tab.labelKey, language)}
                            </span>
                            {isActive && <span className="absolute bottom-0 left-0 right-0 h-[3px] forskale-gradient-bg rounded-full" />}
                          </button>
                        );
                      })}
                      {/* Strategize button — beside Enablement */}
                      <div className="pb-3 flex items-center">
                        <button
                          onClick={() => setStrategyModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[hsl(var(--forskale-teal))] text-white hover:bg-[hsl(var(--forskale-teal)/0.9)] transition-all hover:scale-[1.02]"
                        >
                          <Sparkles className="h-3 w-3" />
                          {t("tab.evaluation", language) === "Valutazione" ? "Strategizza" : "Strategize"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto atlas-scrollbar p-8 bg-background transition-all duration-300 ease-in-out">
                  {activeTab === "evaluation" && <EvaluationTab onOpenStrategyModal={() => setStrategyModalOpen(true)} />}
                  {activeTab === "enablement" && <EnablementTab />}
                  {activeTab === "summary" && <SummaryTab />}
                </div>
              </div>

              <TranscriptPanel entries={mockTranscript} collapsed={transcriptCollapsed} onToggle={() => setTranscriptCollapsed((prev) => !prev)} meetingId={selectedCall} isNewTranscript={true} />
              <TranscriptSuccessModal meetingId={selectedCall} isNewTranscript={showTranscriptModal} onViewTranscript={() => { setTranscriptCollapsed(false); setShowTranscriptModal(false); }} onDismiss={() => setShowTranscriptModal(false)} />
            </>
          )}
          <StrategyModal isOpen={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} />
        </div>
      </AppLayout>
    </LanguageProvider>
  );
};

export default CallInsights;
