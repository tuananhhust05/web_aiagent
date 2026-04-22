import { useEffect, useMemo, useState } from 'react';
import { Search, Globe, Sparkles, Database, Wand2, CheckCircle2 } from 'lucide-react';
import { analysisLoaderSteps } from './strategyOrchestrator';

const iconMap = {
  database: Database,
  globe: Globe,
  sparkles: Sparkles,
  'wand-2': Wand2,
  search: Search
} as const;

const sourceLogos = [
  { name: 'Google', badge: 'G', className: 'from-blue-500 via-red-500 to-yellow-400' },
  { name: 'Bing', badge: 'B', className: 'from-emerald-400 via-teal-400 to-cyan-500' },
  { name: 'LinkedIn', badge: 'in', className: 'from-sky-500 via-blue-600 to-indigo-600' },
  { name: 'Gmail', badge: 'M', className: 'from-red-500 via-orange-400 to-yellow-400' },
  { name: 'CRM', badge: 'CRM', className: 'from-violet-500 via-fuchsia-500 to-pink-500' },
  { name: 'Social', badge: '#', className: 'from-cyan-400 via-teal-400 to-emerald-400' }
];

export function StrategyAnalysisLoader({
  open,
  onDone
}: {
  open: boolean;
  onDone?: () => void;
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const totalDuration = useMemo(
    () => analysisLoaderSteps.reduce((sum, step) => sum + step.durationMs, 0),
    []
  );

  useEffect(() => {
    if (!open) {
      setActiveStepIndex(0);
      setElapsed(0);
      return;
    }

    let timePassed = 0;
    const timeouts = analysisLoaderSteps.map((step, index) => {
      timePassed += step.durationMs;
      return window.setTimeout(() => {
        setActiveStepIndex(index);
        setElapsed(timePassed);
        if (index === analysisLoaderSteps.length - 1) {
          window.setTimeout(() => onDone?.(), 300);
        }
      }, timePassed);
    });

    return () => {
      timeouts.forEach(window.clearTimeout);
    };
  }, [open, onDone]);

  if (!open) return null;

  const activeStep = analysisLoaderSteps[activeStepIndex];
  const ActiveIcon = iconMap[activeStep.icon as keyof typeof iconMap] ?? Search;
  const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[hsl(222,47%,8%)] p-5 text-white shadow-2xl">
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%),linear-gradient(135deg,rgba(8,15,35,0.98),rgba(8,15,35,0.86))]" />

      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">AI Strategy Analysis</p>
            <h3 className="mt-1.5 text-xl font-semibold">Generating your strategy with live-methodology blending</h3>
            <p className="mt-1.5 max-w-2xl text-xs text-slate-300">
              Pulling internal playbooks, open deal evidence, stakeholder context, and internet-visible methodology patterns to build the next best move.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-white/5 px-3.5 py-2.5 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/70">Progress</div>
            <div className="mt-0.5 text-2xl font-semibold">{progress}%</div>
          </div>
        </div>

        {/* Source logos grid */}
        <div className="grid gap-2.5 grid-cols-3 md:grid-cols-6">
          {sourceLogos.map((logo, index) => (
            <div
              key={logo.name}
              className={`group rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur transition-all duration-500 ${index <= activeStepIndex + 1 ? 'scale-[1.02] border-cyan-300/30 shadow-[0_0_24px_rgba(34,211,238,0.15)]' : 'opacity-50'}`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${logo.className} text-xs font-bold text-white shadow-lg`}>
                {logo.badge}
              </div>
              <div className="mt-2 text-xs font-medium">{logo.name}</div>
              <div className="text-[10px] text-slate-400">Signal source</div>
            </div>
          ))}
        </div>

        {/* Active step progress */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${activeStep.tint} shadow-[0_0_30px_rgba(45,212,191,0.24)]`}>
              <ActiveIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{activeStep.label}</p>
                <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/80 animate-pulse">live analysis</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step cards */}
        <div className="grid gap-2.5 grid-cols-2 md:grid-cols-4">
          {analysisLoaderSteps.map((step, index) => {
            const Icon = iconMap[step.icon as keyof typeof iconMap] ?? Search;
            const state = index < activeStepIndex ? 'complete' : index === activeStepIndex ? 'active' : 'idle';
            return (
              <div
                key={step.id}
                className={`rounded-xl border p-3 transition-all duration-500 ${state === 'complete' ? 'border-emerald-300/30 bg-emerald-400/10' : state === 'active' ? 'border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]' : 'border-white/10 bg-white/5 text-slate-400'}`}
              >
                <div className="flex items-center gap-2.5">
                  {state === 'complete' ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Icon className="h-4 w-4" />}
                  <div className="text-xs font-medium">{step.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
