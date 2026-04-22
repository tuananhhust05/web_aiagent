import { useState, useEffect, useCallback } from 'react';
import { X, Brain, ChevronDown, ChevronUp, RefreshCw, Sparkles, AlertTriangle, Target, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { getCognitiveState } from '@/data/mockStrategyData';
import { getStageTextColor, getStageBgColor } from '@/lib/stageColors';
import { generateStrategicBriefing, type StrategicBriefing } from '@/lib/strategicBriefing';
import { useLanguage } from '@/contexts/LanguageContext';
import InterestJourney from './InterestJourney';
import StrategyActionItems from './StrategyActionItems';
import InterestSignals from './InterestSignals';
import DecisionFriction from './DecisionFriction';
import CRMSyncStatus from './CRMSyncStatus';
import DealContext from './DealContext';


interface Props {
  deal: CompanyDeal;
  isFirstLoad: boolean;
  onClose: () => void;
  cachedBriefing: StrategicBriefing | null;
  onBriefingGenerated: (briefing: StrategicBriefing) => void;
  onRerun: () => void;
}

// ─── Loading Step Types ───
interface LoadingStep {
  id: number;
  text: string;
  duration: number;
  status: 'pending' | 'active' | 'completed';
}

const STEP_DEFINITIONS = [
  { id: 2, text: 'loading.orbital.step2', duration: 2266 },
  { id: 3, text: 'loading.orbital.step3', duration: 2266 },
  { id: 4, text: 'loading.orbital.step4', duration: 2268 },
];

// ─── Wow particle field (deterministic) ───
const WOW_PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const colors = [
    'hsl(var(--forskale-teal) / 0.7)',
    'hsl(var(--forskale-cyan) / 0.6)',
    'hsl(var(--forskale-green) / 0.5)',
    'hsl(var(--forskale-cyan) / 0.8)',
  ];
  const sizes = [2, 3, 2, 4];
  return {
    key: i,
    size: sizes[i % 4],
    color: colors[i % 4],
    top: `${(i * 17 + 7) % 90 + 5}%`,
    left: `${(i * 13 + 6) % 88 + 6}%`,
    wx: `${(i % 2 === 0 ? 1 : -1) * (20 + (i * 3) % 40)}px`,
    wy: `${(i % 3 === 0 ? -1 : 1) * (15 + (i * 5) % 35)}px`,
    duration: `${6 + (i % 5)}s`,
    delay: `${(i * 0.3).toFixed(1)}s`,
  };
});

// ─── Wow Loader ───
function OrbitalLoader({
  steps,
  companyName,
  t,
  progress,
}: {
  steps: LoadingStep[];
  companyName: string;
  t: (k: string) => string;
  progress: number;
}) {
  const [firstWord, ...restWords] = companyName.split(' ');
  const rest = restWords.join(' ');

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden bg-background"
    >
      {/* Soft aurora blobs (light) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 500, height: 500, top: -160, left: -160,
          background: 'radial-gradient(hsl(var(--forskale-teal) / 0.10) 0%, transparent 70%)',
          animation: 'wow-aurora 14s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, bottom: -120, right: -120,
          background: 'radial-gradient(hsl(var(--forskale-cyan) / 0.08) 0%, transparent 70%)',
          animation: 'wow-aurora 18s ease-in-out infinite reverse',
        }} />
      </div>

      {/* Floating particles */}
      {WOW_PARTICLES.slice(0, 10).map(p => (
        <div
          key={p.key}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            background: p.color,
            top: p.top, left: p.left,
            opacity: 0,
            ['--wx' as any]: p.wx,
            ['--wy' as any]: p.wy,
            animation: `wow-particle ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-20 w-full max-w-sm px-5 text-center">
        {/* Brain orbit */}
        <div className="relative mx-auto mb-5" style={{ width: 220, height: 220 }}>
          <div className="absolute inset-0 rounded-full border" style={{
            borderColor: 'hsl(var(--forskale-teal) / 0.22)',
            animation: 'wow-outer-pulse 3s ease-in-out infinite',
          }} />
          <div className="absolute rounded-full border" style={{
            inset: 22,
            borderColor: 'hsl(var(--forskale-teal) / 0.4)',
            animation: 'wow-spin-cw 8s linear infinite',
          }}>
            <span className="absolute rounded-full" style={{
              width: 9, height: 9, top: -4, left: '50%', marginLeft: -4,
              background: 'hsl(var(--forskale-cyan))',
              boxShadow: '0 0 12px hsl(var(--forskale-cyan))',
              animation: 'wow-orb-pulse 2s ease-in-out infinite',
            }} />
          </div>
          <div className="absolute rounded-full border" style={{
            inset: 44,
            borderColor: 'hsl(var(--forskale-teal) / 0.5)',
            animation: 'wow-spin-ccw 6s linear infinite',
          }}>
            <span className="absolute rounded-full" style={{
              width: 8, height: 8, top: '50%', left: -3, marginTop: -3,
              background: 'hsl(var(--forskale-green))',
              boxShadow: '0 0 10px hsl(var(--forskale-green))',
              animation: 'wow-orb-pulse 1.8s ease-in-out infinite',
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center rounded-full" style={{
              width: 84, height: 84,
              background: 'hsl(var(--forskale-teal) / 0.10)',
              border: '1px solid hsl(var(--forskale-teal) / 0.45)',
              animation: 'wow-core-glow 3s ease-in-out infinite',
            }}>
              <Brain className="text-[hsl(var(--forskale-teal))]" style={{
                width: 40, height: 40,
                animation: 'wow-brain-float 3s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="rounded-full" style={{
            width: 3, height: 3,
            background: 'hsl(var(--forskale-teal))',
            animation: 'wow-orb-pulse 1.5s ease-in-out infinite',
          }} />
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--forskale-teal))] font-bold">
            ForSkale AI · Live Analysis
          </p>
          <span className="rounded-full" style={{
            width: 3, height: 3,
            background: 'hsl(var(--forskale-teal))',
            animation: 'wow-orb-pulse 1.5s ease-in-out 0.5s infinite',
          }} />
        </div>

        <h2 className="text-base font-bold text-foreground tracking-tight mb-0.5">
          {t('loading.orbital.analyzing')}{' '}
          <span className="text-[hsl(var(--forskale-teal))]">{firstWord}</span>
          {rest && <span className="text-foreground"> {rest}</span>}
        </h2>
        <p className="text-[10px] text-muted-foreground mb-4">AI strategy intelligence in progress</p>

        {/* Steps */}
        <div className="space-y-1.5 text-left">
          {steps.map((step, idx) => {
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            return (
              <div
                key={step.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
                style={{
                  background: isActive || isCompleted ? 'hsl(var(--forskale-teal) / 0.06)' : 'hsl(var(--muted) / 0.5)',
                  borderColor: isActive
                    ? 'hsl(var(--forskale-teal) / 0.5)'
                    : isCompleted
                      ? 'hsl(var(--forskale-teal) / 0.3)'
                      : 'hsl(var(--border))',
                  boxShadow: isActive ? '0 0 12px hsl(var(--forskale-teal) / 0.15)' : 'none',
                  opacity: step.status === 'pending' ? 0.6 : 1,
                  animation: `wow-step-in 0.5s ease-out ${idx * 0.1}s both`,
                }}
              >
                <div className="relative shrink-0" style={{ width: 16, height: 16 }}>
                  {isCompleted ? (
                    <div className="flex items-center justify-center rounded-full w-full h-full" style={{
                      background: 'hsl(var(--forskale-teal) / 0.18)',
                      border: '1px solid hsl(var(--forskale-teal) / 0.6)',
                    }}>
                      <Check className="w-2.5 h-2.5 text-[hsl(var(--forskale-teal))]" />
                    </div>
                  ) : (
                    <div className="rounded-full w-full h-full" style={{
                      border: '2px solid hsl(var(--forskale-teal) / 0.18)',
                      borderTopColor: isActive ? 'hsl(var(--forskale-teal))' : 'hsl(var(--forskale-teal) / 0.4)',
                      animation: isActive ? 'wow-spin-cw 0.9s linear infinite' : 'wow-spin-cw 2.5s linear infinite',
                    }} />
                  )}
                </div>

                <span className="flex-1 text-xs font-medium" style={{
                  color: isActive
                    ? 'hsl(var(--foreground))'
                    : isCompleted
                      ? 'hsl(var(--forskale-teal))'
                      : 'hsl(var(--muted-foreground))',
                }}>
                  {t(step.text)}
                </span>

                {isActive && (
                  <div className="flex gap-0.5 shrink-0">
                    {[0, 1, 2].map(d => (
                      <span key={d} className="rounded-full" style={{
                        width: 3, height: 3,
                        background: 'hsl(var(--forskale-teal))',
                        animation: `wow-dot 1.4s ease-in-out ${d * 0.16}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Progress</span>
            <span className="text-[10px] font-bold text-[hsl(var(--forskale-teal))]">{progress}%</span>
          </div>
          <div className="relative w-full overflow-hidden rounded-full" style={{ height: 3, background: 'hsl(var(--muted))' }}>
            <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--forskale-teal)) 0%, hsl(var(--forskale-cyan)) 50%, hsl(var(--forskale-green)) 100%)',
              boxShadow: '0 0 8px hsl(var(--forskale-teal) / 0.5)',
            }} />
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(var(--forskale-teal) / 0.35) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'wow-shimmer 2s linear infinite',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collapsible Section ───
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 border-t border-border bg-card/50">{children}</div>}
    </div>
  );
}

// ─── Main Overlay ───
export default function StrategyOverlayPanel({ deal, isFirstLoad, onClose, cachedBriefing, onBriefingGenerated, onRerun }: Props) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(isFirstLoad && !cachedBriefing);
  const [steps, setSteps] = useState<LoadingStep[]>(
    STEP_DEFINITIONS.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [briefing, setBriefing] = useState<StrategicBriefing | null>(cachedBriefing);
  const [visible, setVisible] = useState(false);

  const cogState = getCognitiveState(deal.interestLevel);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Orbital step sequencer
  useEffect(() => {
    if (!isLoading) return;

    setSteps(STEP_DEFINITIONS.map(s => ({ ...s, status: 'pending' as const })));

    let currentStep = 0;
    const timeouts: number[] = [];

    const processNext = () => {
      if (currentStep >= STEP_DEFINITIONS.length) {
        timeouts.push(window.setTimeout(() => {
          const result = generateStrategicBriefing(deal);
          setBriefing(result);
          onBriefingGenerated(result);
          setIsLoading(false);
        }, 400));
        return;
      }

      // activate
      setSteps(prev => prev.map(s => s.id === currentStep + 1 ? { ...s, status: 'active' } : s));

      timeouts.push(window.setTimeout(() => {
        // complete
        setSteps(prev => prev.map(s => s.id === currentStep + 1 ? { ...s, status: 'completed' } : s));
        currentStep++;
        processNext();
      }, STEP_DEFINITIONS[currentStep].duration));
    };

    processNext();
    return () => timeouts.forEach(clearTimeout);
  }, [isLoading, deal, onBriefingGenerated]);

  const handleRerun = useCallback(() => {
    onRerun();
    setIsLoading(true);
    setBriefing(null);
  }, [onRerun]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-[65%] max-w-3xl z-50 flex flex-col bg-background border-l border-border shadow-2xl transition-transform duration-[350ms]",
        visible ? "translate-x-0" : "translate-x-full"
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.32, 1)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
          <div>
            <h3 className="text-sm font-bold text-foreground">{deal.company}</h3>
            <span className={cn("text-xs font-medium", getStageTextColor(deal.interestLevel))}>
              {cogState.name} · {deal.interestLevel}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {briefing && (
            <button
              onClick={handleRerun}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              {t('overlay.rerun')}
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto atlas-scrollbar">
        {isLoading ? (
          <OrbitalLoader
            steps={steps}
            companyName={deal.company}
            t={t}
            progress={Math.round(
              ((steps.filter(s => s.status === 'completed').length +
                (steps.some(s => s.status === 'active') ? 0.5 : 0)) /
                steps.length) * 100
            )}
          />
        ) : briefing ? (
          <div className="p-5 space-y-4">
            {/* Strategic Briefing */}
            <div className="rounded-xl border border-[hsl(var(--forskale-teal)/0.2)] bg-[hsl(var(--forskale-teal)/0.04)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
                <h4 className="text-xs font-bold text-[hsl(var(--forskale-teal))] uppercase tracking-wider">{t('overlay.strategicBriefing')}</h4>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">{briefing.narrative}</p>
            </div>
            <InterestJourney
              journey={deal.interestJourney}
              companyName={deal.company}
              interestVelocity={deal.interestVelocity}
              daysAtCurrentLevel={deal.daysAtCurrentLevel}
            />

            {/* Cognitive State */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-3 h-3 rounded-full", getStageBgColor(deal.interestLevel))} />
                <span className={cn("text-sm font-bold", getStageTextColor(deal.interestLevel))}>{cogState.name}</span>
                <span className="text-xs text-muted-foreground">· {deal.interestLevel}%</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{briefing.cognitiveStateExplanation}</p>
            </div>

            {/* Priorities & Risks */}
            <div className="grid grid-cols-2 gap-3">
              {briefing.topPriorities.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))]" />
                    <span className="text-xs font-semibold text-foreground">{t('overlay.topPriorities')}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {briefing.topPriorities.map((p, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-[hsl(var(--forskale-teal))]">→</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {briefing.riskWarnings.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-semibold text-foreground">{t('overlay.riskWarnings')}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {briefing.riskWarnings.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-orange-500">⚠</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <StrategyActionItems deal={deal} />

            {deal.interestSignals.length > 0 && (
              <CollapsibleSection title={t('section.interestSignals')} icon={Sparkles}>
                <InterestSignals signals={deal.interestSignals} interestLevel={deal.interestLevel} />
              </CollapsibleSection>
            )}

            {deal.decisionFriction.length > 0 && (
              <CollapsibleSection title={t('section.decisionFriction')} icon={Shield}>
                <DecisionFriction friction={deal.decisionFriction} roadmap={deal.frictionRoadmap} interestLevel={deal.interestLevel} />
              </CollapsibleSection>
            )}

            <CollapsibleSection title={t('section.dealContext')} icon={Target}>
              <DealContext deal={deal} />
            </CollapsibleSection>
          </div>
        ) : null}
      </div>
    </div>
  );
}
