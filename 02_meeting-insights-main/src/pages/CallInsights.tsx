import { useState } from "react";
import { ChevronLeft, Users, Target, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/atlas/AppLayout";
import CallListSidebar from "@/components/call-insights/CallListSidebar";
import TranscriptPanel from "@/components/call-insights/TranscriptPanel";
import TranscriptSuccessModal from "@/components/call-insights/TranscriptSuccessModal";
import EvaluationTab from "@/components/call-insights/EvaluationTab";
import EnablementTab from "@/components/call-insights/EnablementTab";
import SummaryTab from "@/components/call-insights/SummaryTab";
import StrategyModal from "@/components/call-insights/StrategyModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mockCalls, mockTranscript } from "@/data/mockData";

type TabType = "evaluation" | "enablement" | "summary";

const tabs: { id: TabType; label: string; subtitle: string; icon: React.ElementType }[] = [
  { id: "evaluation", label: "Evaluation", subtitle: "What happened and what to do next", icon: Target },
  { id: "enablement", label: "Enablement", subtitle: "Your performance and improvement areas", icon: GraduationCap },
  { id: "summary", label: "Smart Summary", subtitle: "Cross-meeting intelligence that tracks deal evolution and detects strategic shifts", icon: Sparkles },
];

const CallInsights = () => {
  const [selectedCall, setSelectedCall] = useState("1");
  const [activeTab, setActiveTab] = useState<TabType>("evaluation");
  const [callListCollapsed, setCallListCollapsed] = useState(false);
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(true);
  const [showTranscriptModal, setShowTranscriptModal] = useState(true);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);

  return (
    <AppLayout activeNav="Meeting Insight">
      <div className="flex flex-1 overflow-hidden bg-background">
        <CallListSidebar
          calls={mockCalls}
          selectedId={selectedCall}
          onSelect={setSelectedCall}
          collapsed={callListCollapsed}
          onToggle={() => setCallListCollapsed((prev) => !prev)}
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
                Lavazza A Modo Mio – Introductory Commercial Discussion
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                79% of sales playbook executed
              </span>
              <span>Mar 2, 2026</span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> 2 speakers
              </span>
            </div>

            {/* Tabs */}
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
            {activeTab === "evaluation" && <EvaluationTab onOpenStrategyModal={() => setStrategyModalOpen(true)} />}
            {activeTab === "enablement" && <EnablementTab />}
            {activeTab === "summary" && <SummaryTab />}
          </div>
        </div>

        <TranscriptPanel
          entries={mockTranscript}
          collapsed={transcriptCollapsed}
          onToggle={() => setTranscriptCollapsed((prev) => !prev)}
          meetingId={selectedCall}
          isNewTranscript={true}
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
        <StrategyModal isOpen={strategyModalOpen} onClose={() => setStrategyModalOpen(false)} />
      </div>
    </AppLayout>
  );
};

export default CallInsights;
