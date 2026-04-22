import { useState, useCallback } from 'react';
import type { StrategyBriefing } from '@/lib/api';

interface AnalysisCache {
  [dealId: string]: {
    briefing: StrategyBriefing;
    timestamp: number;
  };
}

export function useAnalysisCache() {
  const [cache, setCache] = useState<AnalysisCache>({});

  const getCachedAnalysis = useCallback((dealId: string): StrategyBriefing | null => {
    const cached = cache[dealId];
    if (!cached) return null;
    if (Date.now() - cached.timestamp > 3600000) {
      setCache(prev => {
        const { [dealId]: _, ...rest } = prev;
        return rest;
      });
      return null;
    }
    return cached.briefing;
  }, [cache]);

  const setCachedAnalysis = useCallback((dealId: string, briefing: StrategyBriefing) => {
    setCache(prev => ({
      ...prev,
      [dealId]: { briefing, timestamp: Date.now() },
    }));
  }, []);

  const clearCache = useCallback((dealId?: string) => {
    if (dealId) {
      setCache(prev => {
        const { [dealId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setCache({});
    }
  }, []);

  const hasCached = useCallback((dealId: string) => Boolean(cache[dealId]), [cache]);

  return { getCachedAnalysis, setCachedAnalysis, clearCache, hasCached };
}

