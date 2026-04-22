import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import StrategyTopBar from "@/components/strategy/StrategyTopBar";
import DealCardRail from "@/components/strategy/DealCardRail";
import EmailMeetingPanel from "@/components/strategy/EmailMeetingPanel";
import StrategyHighlightsPanel from "@/components/strategy/StrategyHighlightsPanel";
import { useAnalysisCache } from "@/hooks/useAnalysisCache";
import { LanguageProvider } from "@/components/strategy/LanguageContext";
import { meetingsAPI } from "@/lib/api";
import type { ParticipantEmailDeal } from "@/components/strategy/types";

function AtlasStrategyPageContent() {
  const [overlayDealId, setOverlayDealId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"urgency" | "interest" | "recent">("urgency");
  const [highlightDealIds, setHighlightDealIds] = useState<string[]>([]);
  const analysisCache = useAnalysisCache();

  const { data: participantEmailsResponse, isLoading, isError } = useQuery({
    queryKey: ["atlas-strategy-participant-emails"],
    queryFn: async () => {
      const res = await meetingsAPI.getParticipantEmails();
      return res.data;
    },
  });

  const deals = useMemo((): ParticipantEmailDeal[] => {
    if (!participantEmailsResponse?.emails) return [];
    return participantEmailsResponse.emails.map((item) => ({
      email: item.email,
      name: item.name,
      company: item.company || item.email.split("@")[1] || "Unknown",
      meetingCount: item.meeting_count,
      lastMeetingDate: item.last_meeting_date,
    }));
  }, [participantEmailsResponse]);
  const overlayDeal = overlayDealId ? deals.find((d) => d.email === overlayDealId) ?? null : null;

  const handleSelectDeal = useCallback((id: string) => {
    setOverlayDealId(id);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setOverlayDealId(null);
  }, []);

  const handleRerunAnalysis = useCallback(() => {
    if (overlayDealId) {
      analysisCache.clearCache(overlayDealId);
    }
  }, [overlayDealId, analysisCache]);

  const handleApplyPattern = useCallback((ids: string[]) => {
    setHighlightDealIds(ids);
    setSortMode("urgency");
    setTimeout(() => setHighlightDealIds([]), 4000);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <StrategyTopBar />

      <div className="relative flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading strategy deals...</div>
        ) : isError ? (
          <div className="flex flex-1 items-center justify-center text-sm text-destructive">Failed to load strategy deals.</div>
        ) : !overlayDealId ? (
          <>
            <DealCardRail
              deals={deals}
              selectedId={overlayDealId}
              onSelectDeal={handleSelectDeal}
              sortMode={sortMode}
              onSortChange={setSortMode}
              highlightDealIds={highlightDealIds}
            />
            <StrategyHighlightsPanel
              deals={deals}
              onSelectDeal={handleSelectDeal}
            />
          </>
        ) : (
          <>
            <DealCardRail
              deals={deals}
              selectedId={overlayDealId}
              onSelectDeal={handleSelectDeal}
              sortMode={sortMode}
              onSortChange={setSortMode}
              highlightDealIds={highlightDealIds}
            />
          </>
        )}

        {overlayDealId && (
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={handleCloseOverlay}
          />
        )}

        {overlayDeal && (
          <EmailMeetingPanel
            deal={overlayDeal}
            onClose={handleCloseOverlay}
          />
        )}
      </div>
    </div>
  );
}

export default function AtlasStrategyPage() {
  return (
    <LanguageProvider>
      <AtlasStrategyPageContent />
    </LanguageProvider>
  );
}
