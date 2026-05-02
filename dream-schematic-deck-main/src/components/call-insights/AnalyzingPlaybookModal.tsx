import { useState, useEffect, useCallback } from "react";
import {
  Brain, FileText, Zap, Sparkles, CheckCircle, Check, Loader2,
  Target, Presentation, Wallet, Search, Users, Award, MessageCircleQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useFrameworkScoring, { type FrameworkResult } from "@/hooks/useFrameworkScoring";

interface AnalyzingPlaybookModalProps {
  isOpen: boolean;
  onComplete: (result: FrameworkResult) => void;
}

const pipelineSteps = [
  { label: "Fetching transcript", icon: FileText },
  { label: "Preprocessing & chunking", icon: Zap },
  { label: "Analyzing chunks with AI", icon: Sparkles },
  { label: "Scoring frameworks", icon: Target },
  { label: "Finalizing analysis", icon: CheckCircle },
];

const frameworkMeta: Record<string, { icon: typeof Target; colorClass: string }> = {
  demo: { icon: Presentation, colorClass: "text-[hsl(var(--forskale-blue))]" },
  meddic: { icon: Target, colorClass: "text-[hsl(var(--forskale-green))]" },
  spiced: { icon: Zap, colorClass: "text-amber-500" },
  bant: { icon: Wallet, colorClass: "text-purple-500" },
  discovery: { icon: Search, colorClass: "text-[hsl(var(--forskale-teal))]" },
  gpct: { icon: Users, colorClass: "text-orange-500" },
  champ: { icon: Award, colorClass: "text-red-500" },
  spin: { icon: MessageCircleQuestion, colorClass: "text-indigo-500" },
};

const AnalyzingPlaybookModal = ({ isOpen, onComplete }: AnalyzingPlaybookModalProps) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const scoring = useFrameworkScoring();

  // Pipeline step progression
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(-1);
      scoring.reset();
      return;
    }

    setCurrentStep(0);
    const timers: NodeJS.Timeout[] = [];

    pipelineSteps.forEach((_, i) => {
      const timeout = setTimeout(() => {
        setCurrentStep(i + 1);
        // Start framework scanning at step 3 ("Analyzing chunks")
        if (i === 2) {
          scoring.startScanning();
        }
      }, (i + 1) * 800);
      timers.push(timeout);
    });

    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  // When scoring completes, fire onComplete
  useEffect(() => {
    if (scoring.isComplete && scoring.winner) {
      const t = setTimeout(() => onComplete(scoring.winner!), 600);
      return () => clearTimeout(t);
    }
  }, [scoring.isComplete, scoring.winner, onComplete]);

  if (!isOpen) return null;

  const progress = Math.round((Math.max(0, currentStep) / pipelineSteps.length) * 100);
  const scanningId = scoring.currentScanIndex >= 0 && scoring.currentScanIndex < scoring.frameworkIds.length
    ? scoring.frameworkIds[scoring.currentScanIndex]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[820px] mx-4 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* LEFT COLUMN — Analysis Pipeline */}
          <div className="md:w-[45%] p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center shadow-[0_4px_20px_hsl(var(--forskale-green)/0.3)]">
                <Brain className="h-7 w-7 text-white" />
              </div>
            </div>

            <h2 className="text-lg font-bold font-heading text-foreground text-center mb-1">
              Analyzing Playbook
            </h2>
            <p className="text-xs text-muted-foreground text-center mb-5 leading-relaxed">
              AI is evaluating transcript against sales methodologies
            </p>

            {/* Steps */}
            <div className="space-y-1.5 mb-5">
              {pipelineSteps.map((step, i) => {
                const isDone = currentStep > i;
                const isActive = currentStep === i;
                const isPending = currentStep < i;
                const Icon = step.icon;

                return (
                  <div
                    key={step.label}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all duration-300",
                      isDone && "border-[hsl(var(--forskale-green)/0.2)] bg-[hsl(var(--forskale-green)/0.05)]",
                      isActive && "border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.05)]",
                      isPending && "border-border bg-card"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-300",
                      isDone && "text-status-great",
                      isActive && "text-[hsl(var(--forskale-teal))]",
                      isPending && "text-muted-foreground/50"
                    )} />
                    <span className={cn(
                      "text-xs font-medium flex-1 transition-colors duration-300",
                      isDone && "text-foreground",
                      isActive && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    <div className="shrink-0">
                      {isDone && <Check className="h-3.5 w-3.5 text-status-great animate-in zoom-in duration-200" />}
                      {isActive && <Loader2 className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] animate-spin" />}
                      {isPending && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* RIGHT COLUMN — Framework Scanner */}
          <div className="md:w-[55%] p-6 md:p-8">
            <h3 className="text-sm font-bold font-heading text-foreground mb-1">
              Comparing Sales Methodologies
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              {scanningId
                ? `Analyzing ${scoring.frameworkNames[scanningId]} methodology patterns...`
                : scoring.isComplete
                  ? "Analysis complete!"
                  : "Evaluating 8 frameworks for best fit..."}
            </p>

            {/* Framework Grid 2x4 */}
            <div className="grid grid-cols-2 gap-2.5">
              {scoring.frameworkIds.map((id) => {
                const meta = frameworkMeta[id];
                const Icon = meta.icon;
                const score = scoring.scores[id];
                const isScanning = scanningId === id;
                const isWinner = scoring.winner?.winnerId === id;
                const hasScore = score !== undefined;

                return (
                  <div
                    key={id}
                    className={cn(
                      "relative rounded-xl border px-3 py-3 transition-all duration-300",
                      isWinner && "bg-[hsl(var(--forskale-green)/0.08)] border-[hsl(var(--forskale-green)/0.4)] scale-105 shadow-[0_4px_16px_hsl(var(--forskale-green)/0.15)]",
                      isScanning && !isWinner && "border-[hsl(var(--forskale-teal)/0.5)] scale-[1.03] bg-[hsl(var(--forskale-teal)/0.05)] ring-2 ring-[hsl(var(--forskale-teal)/0.3)]",
                      hasScore && !isScanning && !isWinner && "border-border opacity-70",
                      !hasScore && !isScanning && "border-border opacity-40"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={cn("h-4 w-4 shrink-0", meta.colorClass)} />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {scoring.frameworkNames[id]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {isScanning && !hasScore ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 text-[hsl(var(--forskale-teal))] animate-spin" />
                          <span className="text-[11px] text-muted-foreground">Scanning...</span>
                        </div>
                      ) : hasScore ? (
                        <span className={cn(
                          "text-lg font-bold font-heading tabular-nums",
                          isWinner ? "text-status-great" : "text-muted-foreground"
                        )}>
                          {score}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Pending</span>
                      )}
                    </div>

                    {isWinner && (
                      <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[hsl(var(--forskale-green))] text-white text-[9px] font-bold rounded-full shadow-sm animate-in zoom-in duration-300">
                        🏆 Best Match
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzingPlaybookModal;
