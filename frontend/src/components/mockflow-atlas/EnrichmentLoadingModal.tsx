import { useEffect, useState } from "react";
import { X, Link2, Brain, Sparkles, Check, Building2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface EnrichmentLoadingModalProps {
  open: boolean;
  onComplete: () => void;
  onClose: () => void;
  participantName: string;
  companyName?: string;
}

interface EnrichmentStep {
  id: number;
  label: string;
  icon: typeof Link2;
  duration: number;
}

const STEPS: EnrichmentStep[] = [
  { id: 0, label: "Extracting company from email...", icon: Building2, duration: 20 },
  { id: 1, label: "Searching company information...", icon: Link2, duration: 50 },
  { id: 2, label: "Analyzing company data...", icon: Brain, duration: 80 },
  { id: 3, label: "Generating insights...", icon: Sparkles, duration: 100 },
];

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function EnrichmentLoadingModal({ open, onComplete, onClose, participantName, companyName }: EnrichmentLoadingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    let animationFrame: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const totalDuration = 3000;
      const normalizedTime = Math.min(elapsed / totalDuration, 1);
      const easedProgress = easeInOutCubic(normalizedTime) * 100;

      setProgress(Math.min(easedProgress, 100));

      const newStep = STEPS.findIndex((step) => easedProgress < step.duration);
      setCurrentStep(newStep === -1 ? STEPS.length - 1 : Math.max(0, newStep));

      if (easedProgress < 100) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setTimeout(() => onComplete(), 800);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [open, onComplete, companyName]);

  if (!open) return null;

  const statusDotIndex = Math.floor(currentStep / 1.33);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cal-dark/85 backdrop-blur-[12px] animate-in fade-in duration-400">
      <div className="relative w-[380px] max-w-[90vw] overflow-hidden rounded-[20px] bg-gradient-to-br from-cal-slate to-cal-dark p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_hsl(var(--forskale-teal)/0.15),inset_0_1px_0_rgba(255,255,255,0.05)] animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-400",
                  i === statusDotIndex
                    ? "w-5 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue shadow-[0_0_16px_hsl(var(--forskale-teal)/0.6)]"
                    : i < statusDotIndex
                    ? "w-2 bg-forskale-green shadow-[0_0_12px_hsl(var(--forskale-green)/0.4)]"
                    : "w-2 bg-cal-text-secondary/20"
                )}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-forskale-teal/20 bg-forskale-teal/[0.08] text-forskale-teal transition-all hover:scale-105 hover:border-forskale-teal hover:bg-forskale-teal/15"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* LinkedIn Icon with pulse rings */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
          {/* Pulse rings */}
          <div className="absolute inset-0 animate-[pulseRing_2.5s_ease-out_infinite] rounded-full border-2 border-forskale-teal/30" />
          <div className="absolute inset-[7.5%] animate-[pulseRing_2.5s_ease-out_0.8s_infinite] rounded-full border-2 border-forskale-teal/30" />
          <div className="absolute inset-[15%] animate-[pulseRing_2.5s_ease-out_1.6s_infinite] rounded-full border-2 border-forskale-teal/30" />

          <div className="relative z-10 flex h-12 w-12 animate-[iconFloat_3s_ease-in-out_infinite] items-center justify-center rounded-full bg-forskale-teal/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="linkedin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--forskale-green))" />
                  <stop offset="50%" stopColor="hsl(var(--forskale-teal))" />
                  <stop offset="100%" stopColor="hsl(var(--forskale-blue))" />
                </linearGradient>
              </defs>
              <path
                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
                fill="url(#linkedin-gradient)"
              />
            </svg>
          </div>
        </div>

        {/* Progress info */}
        <div className="mb-5 text-center">
          <h3 className="text-lg font-bold tracking-tight text-cal-text-primary">
            {STEPS[currentStep]?.label ?? "Generating insights..."}
          </h3>
          <p className="mt-1 text-sm text-cal-text-secondary/70">
            {companyName ? `Enriching ${participantName} at ${companyName}` : `Enriching ${participantName}'s profile`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="relative mb-2 h-1.5 w-full overflow-hidden rounded-full bg-cal-mid/60">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue shadow-[0_0_20px_hsl(var(--forskale-teal)/0.4)] transition-[width] duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-y-0 right-0 w-8 animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-cal-text-secondary/50">0%</span>
            <span className="font-semibold text-forskale-teal">{Math.round(progress)}%</span>
            <span className="text-cal-text-secondary/50">100%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-0.5">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isDone = progress >= step.duration;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-300",
                  isActive && "border border-forskale-teal/20 bg-forskale-teal/[0.08]",
                  isDone && !isActive && "bg-forskale-green/[0.06]"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    isActive
                      ? "animate-[iconPulse_1.5s_ease-in-out_infinite] bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue shadow-[0_0_16px_hsl(var(--forskale-teal)/0.4)]"
                      : isDone
                      ? "bg-forskale-green"
                      : "bg-forskale-teal/10"
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <StepIcon className={cn("h-4 w-4", isActive || isDone ? "text-white" : "text-cal-text-secondary/60")} />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[13px] font-medium transition-all duration-300",
                    isActive ? "font-semibold text-cal-text-primary" : isDone ? "text-forskale-green" : "text-cal-text-secondary/70"
                  )}
                >
                  {step.label}
                </span>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-[27px] h-[10px] w-0.5 translate-y-full transition-colors duration-400",
                      isDone ? "bg-forskale-teal" : "bg-forskale-teal/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
