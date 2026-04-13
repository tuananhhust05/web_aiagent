import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Brain, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockLLMModels,
  mockPlaybookAnalysis,
  type LLMModelResult, type PlaybookAnalysis,
} from "@/data/playbookAnalysisData";

interface AdvancedAnalysisModalProps {
  isOpen: boolean;
  onComplete: (analysis: PlaybookAnalysis) => void;
}

const statusLabels: Record<string, string> = {
  initializing: "Initializing...",
  analyzing: "Analyzing transcript...",
  "cross-referencing": "Cross-referencing frameworks...",
  complete: "Complete ✓",
};

const LLMCard = memo(({ model }: { model: LLMModelResult & { currentStatus: string } }) => {
  const isComplete = model.currentStatus === "complete";
  return (
    <div className={cn(
      "rounded-xl border p-3.5 transition-all duration-300",
      isComplete
        ? "border-[hsl(var(--forskale-green)/0.3)] bg-[hsl(var(--forskale-green)/0.04)]"
        : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{model.icon}</span>
        <span className="text-xs font-semibold text-foreground truncate">{model.modelName}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {isComplete ? (
          <Check className="h-3.5 w-3.5 text-status-great" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] animate-spin" />
        )}
        <span className={cn("text-[11px]", isComplete ? "text-status-great font-medium" : "text-muted-foreground")}>
          {statusLabels[model.currentStatus]}
        </span>
      </div>
    </div>
  );
});
LLMCard.displayName = "LLMCard";

const AdvancedAnalysisModal = ({ isOpen, onComplete }: AdvancedAnalysisModalProps) => {
  const [models, setModels] = useState<(LLMModelResult & { currentStatus: string })[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setModels([]);
      return;
    }

    setModels(mockLLMModels.map(m => ({ ...m, currentStatus: "initializing" })));

    const statusSequence = ["initializing", "analyzing", "cross-referencing", "complete"];

    mockLLMModels.forEach((model, mi) => {
      statusSequence.forEach((status, si) => {
        if (si === 0) return;
        const delay = (model.completionTime * 1000 * si) / (statusSequence.length - 1);
        const t = setTimeout(() => {
          setModels(prev => prev.map((m, i) => i === mi ? { ...m, currentStatus: status } : m));
        }, delay);
        timersRef.current.push(t);
      });
    });


    // After loading completes, call onComplete directly
    const maxTime = Math.max(...mockLLMModels.map(m => m.completionTime));
    const transitionT = setTimeout(() => {
      onComplete(mockPlaybookAnalysis);
    }, (maxTime + 1) * 1000);
    timersRef.current.push(transitionT);

    return cleanup;
  }, [isOpen, cleanup, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-[620px] mx-4 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center shadow-[0_4px_16px_hsl(var(--forskale-green)/0.3)]">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-foreground">Analyzing Meeting</h2>
              <p className="text-[11px] text-muted-foreground">Using multiple AI models to analyze conversation patterns and methodologies</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {models.map((model) => (
              <LLMCard key={model.modelId} model={model} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalysisModal;
