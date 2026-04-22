import React, { useEffect, useState, useMemo } from "react";
import { 
  Brain, 
  CheckCircle2, 
  Newspaper, 
  TrendingUp, 
  Database, 
  Globe, 
  Linkedin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrichmentModalProps {
  participantName: string;
  onComplete: () => void;
}

type SourceId = 'linkedin' | 'news' | 'forbes' | 'crunchbase' | 'wikipedia';
type SourceState = 'pending' | 'active' | 'complete';

interface Source {
  id: SourceId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  statusMessage: string;
}

const SOURCES: Source[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    color: 'text-[#0077B5]',
    bgColor: 'bg-[#0077B5]/20',
    statusMessage: 'Analyzing professional network and experience...'
  },
  {
    id: 'news',
    label: 'Google News',
    icon: Newspaper,
    color: 'text-[#EA4335]',
    bgColor: 'bg-[#EA4335]/20',
    statusMessage: 'Scanning recent press mentions and interviews...'
  },
  {
    id: 'forbes',
    label: 'Forbes',
    icon: TrendingUp,
    color: 'text-slate-100',
    bgColor: 'bg-slate-100/20',
    statusMessage: 'Gathering executive insights and thought leadership...'
  },
  {
    id: 'crunchbase',
    label: 'Crunchbase',
    icon: Database,
    color: 'text-[#0288D1]',
    bgColor: 'bg-[#0288D1]/20',
    statusMessage: 'Retrieving company funding and growth metrics...'
  },
  {
    id: 'wikipedia',
    label: 'Wikipedia',
    icon: Globe,
    color: 'text-[#636466]',
    bgColor: 'bg-[#636466]/20',
    statusMessage: 'Cross-referencing public sources and background...'
  }
];

export const EnrichmentModal: React.FC<EnrichmentModalProps> = ({ 
  participantName, 
  onComplete 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [sourceStates, setSourceStates] = useState<Record<SourceId, SourceState>>(
    Object.fromEntries(SOURCES.map(s => [s.id, 'pending'])) as Record<SourceId, SourceState>
  );
  const [isComplete, setIsComplete] = useState(false);

  const currentSource = SOURCES[currentSourceIndex];
  const participantInitials = useMemo(() => {
    return participantName
      .split(' ')
      .slice(0, 2)
      .map(name => name[0]?.toUpperCase())
      .join('');
  }, [participantName]);

  useEffect(() => {
    const totalDuration = 3500;
    const stepDuration = totalDuration / SOURCES.length;
    let stepIndex = 0;

    const runEnrichment = () => {
      if (stepIndex >= SOURCES.length) {
        setIsComplete(true);
        setProgress(100);
        setTimeout(() => {
          onComplete();
        }, 800);
        return;
      }

      const source = SOURCES[stepIndex];
      
      setCurrentSourceIndex(stepIndex);
      setSourceStates(prev => ({
        ...prev,
        [source.id]: 'active'
      }));

      const startProgress = (stepIndex / SOURCES.length) * 100;
      const endProgress = ((stepIndex + 1) / SOURCES.length) * 100;
      const progressStart = performance.now();

      const animateProgress = (timestamp: number) => {
        const elapsed = timestamp - progressStart;
        const progressRatio = Math.min(elapsed / stepDuration, 1);
        const currentProgress = startProgress + (endProgress - startProgress) * progressRatio;
        
        setProgress(currentProgress);
        
        if (progressRatio < 1) {
          requestAnimationFrame(animateProgress);
        }
      };

      requestAnimationFrame(animateProgress);

      setTimeout(() => {
        setSourceStates(prev => ({
          ...prev,
          [source.id]: 'complete'
        }));
        
        stepIndex++;
        runEnrichment();
      }, stepDuration);
    };

    runEnrichment();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/90 shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-[hsl(var(--forskale-teal))]/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-[hsl(var(--forskale-blue))]/20 blur-3xl" />

        <div className="relative z-10 p-8">
          
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))]">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                {!isComplete && (
                  <div className="absolute inset-0 rounded-full border-2 border-[hsl(var(--forskale-teal))]/50 animate-ping" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {isComplete ? 'Neuro-Profile Ready' : 'Generating Insights...'}
                </h3>
                <p className="text-sm text-slate-400">
                  {isComplete 
                    ? 'Opening Prospect Intelligence...' 
                    : `Enriching ${participantName}'s profile from 5 sources`
                  }
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                {Math.round(progress)}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider">
                {isComplete ? 'Complete' : `${currentSourceIndex + 1} of ${SOURCES.length}`}
              </div>
            </div>
          </div>

          {/* Sources Row */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4">
              {SOURCES.map((source) => {
                const Icon = source.icon;
                const state = sourceStates[source.id];
                const isActive = state === 'active';
                const isDone = state === 'complete';

                return (
                  <div
                    key={source.id}
                    className={cn(
                      "flex flex-col items-center gap-3 transition-all duration-500",
                      isActive && "scale-110"
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all duration-500",
                          state === 'pending' && "border-slate-600 bg-slate-800/50 opacity-30",
                          isActive && `border-transparent ${source.bgColor} shadow-lg`,
                          isDone && "border-green-500/50 bg-green-500/20"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-8 w-8 transition-colors duration-300",
                            state === 'pending' && "text-slate-500",
                            isActive && source.color,
                            isDone && "text-green-400"
                          )}
                        />
                        
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl border-2 border-white/20 animate-pulse" />
                        )}
                        
                        {isDone && (
                          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <span
                      className={cn(
                        "text-xs font-semibold transition-colors duration-300",
                        state === 'pending' && "text-slate-500",
                        isActive && "text-white",
                        isDone && "text-green-400"
                      )}
                    >
                      {source.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {!isComplete ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--forskale-teal))] animate-pulse" />
                  <span className="text-slate-300 font-medium">
                    {currentSource?.statusMessage || 'Initializing...'}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-green-300 font-medium">
                    Multi-source enrichment complete
                  </span>
                </>
              )}
            </div>
            
            <span className="text-xs text-slate-500">
              {Math.round(progress * 0.43)} data points gathered
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
