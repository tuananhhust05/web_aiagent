import { useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import StrategyTopBar from "@/components/strategy/StrategyTopBar";

import DealCardRail from "@/components/strategy/DealCardRail";
import SmartEmptyState from "@/components/strategy/SmartEmptyState";
import StrategyOverlayPanel from "@/components/strategy/StrategyOverlayPanel";
import { companyDeals, getDealById } from "@/data/mockStrategyData";
import { useAnalysisCache } from "@/hooks/useAnalysisCache";
import { LanguageProvider } from "@/contexts/LanguageContext";

const StrategyPage = () => {
  const [overlayDealId, setOverlayDealId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'urgency' | 'interest' | 'recent'>('urgency');
  const [highlightDealIds, setHighlightDealIds] = useState<string[]>([]);
  const analysisCache = useAnalysisCache();

  const overlayDeal = overlayDealId ? getDealById(overlayDealId) : null;

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
    setSortMode('urgency');
    // auto-clear highlight after a few seconds
    setTimeout(() => setHighlightDealIds([]), 4000);
  }, []);

  return (
    <AppLayout activeNav="Strategy">
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <StrategyTopBar />

        <div className="flex flex-1 overflow-hidden relative">
          <DealCardRail
            deals={companyDeals}
            selectedId={overlayDealId}
            onSelectDeal={handleSelectDeal}
            sortMode={sortMode}
            onSortChange={setSortMode}
            highlightDealIds={highlightDealIds}
          />

          {/* Center: smart empty state */}
          <SmartEmptyState deals={companyDeals} onSelectDeal={handleSelectDeal} />

          {/* Backdrop */}
          {overlayDealId && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
              onClick={handleCloseOverlay}
            />
          )}

          {/* Overlay panel */}
          {overlayDeal && (
            <StrategyOverlayPanel
              deal={overlayDeal}
              isFirstLoad={!analysisCache.hasCached(overlayDeal.id)}
              onClose={handleCloseOverlay}
              cachedBriefing={analysisCache.getCachedAnalysis(overlayDeal.id)}
              onBriefingGenerated={(b) => analysisCache.setCachedAnalysis(overlayDeal.id, b)}
              onRerun={handleRerunAnalysis}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const Index = () => (
  <LanguageProvider>
    <StrategyPage />
  </LanguageProvider>
);

export default Index;
