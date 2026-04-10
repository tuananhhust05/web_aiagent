import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Brain, Loader2, Check, Minimize2, Maximize2, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  mockLLMModels, mockAnalysisLogMessages, mockMethodologyScores,
  mockPlaybookAnalysis,
  type LLMModelResult, type PlaybookAnalysis,
} from "@/data/playbookAnalysisData";

type ModalState = "loading" | "compact" | "minimized";

interface AdvancedAnalysisModalProps {
  isOpen: boolean;
  onComplete: (analysis: PlaybookAnalysis) => void;
  onViewDetailed: (analysis: PlaybookAnalysis) => void;
}

const statusLabels: Record<string, string> = {
  initializing: "Initializing...",
  analyzing: "Analyzing structure...",
  "cross-referencing": "Cross-referencing...",
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
      {isComplete && (
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-lg font-bold font-heading tabular-nums text-status-great">{model.topScore}%</span>
          <span className="text-[10px] text-muted-foreground">{model.topFramework}</span>
        </div>
      )}
    </div>
  );
});
LLMCard.displayName = "LLMCard";

const MethodologyBar = memo(({ name, score, isTop }: { name: string; score: number; isTop: boolean }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-medium text-foreground w-24 truncate">{name}</span>
    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          isTop ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]" :
          score >= 60 ? "bg-[hsl(var(--forskale-cyan))]" : "bg-muted-foreground/30"
        )}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className={cn(
      "text-sm font-bold tabular-nums w-10 text-right",
      isTop ? "text-status-great" : score >= 60 ? "text-[hsl(var(--forskale-cyan))]" : "text-muted-foreground"
    )}>{score}%</span>
  </div>
));
MethodologyBar.displayName = "MethodologyBar";

const AdvancedAnalysisModal = ({ isOpen, onComplete, onViewDetailed }: AdvancedAnalysisModalProps) => {
  const [modalState, setModalState] = useState<ModalState>("loading");
  const [models, setModels] = useState<(LLMModelResult & { currentStatus: string })[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<PlaybookAnalysis | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const cleanup = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Reset on open
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      setModalState("loading");
      setModels([]);
      setLogMessages([]);
      setAnalysisResult(null);
      return;
    }

    // Initialize models
    setModels(mockLLMModels.map(m => ({ ...m, currentStatus: "initializing" })));

    const statusSequence = ["initializing", "analyzing", "cross-referencing", "complete"];

    // Stagger model completions
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

    // Log messages
    mockAnalysisLogMessages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setLogMessages(prev => [...prev, msg]);
      }, (i + 1) * 700);
      timersRef.current.push(t);
    });

    // Transition to compact after all models complete
    const maxTime = Math.max(...mockLLMModels.map(m => m.completionTime));
    const transitionT = setTimeout(() => {
      setAnalysisResult(mockPlaybookAnalysis);
      setModalState("compact");
    }, (maxTime + 1) * 1000);
    timersRef.current.push(transitionT);

    return cleanup;
  }, [isOpen, cleanup]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logMessages]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete(analysisResult!);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, analysisResult, onComplete]);

  if (!isOpen) return null;

  // Minimized pill
  if (modalState === "minimized") {
    const top = mockMethodologyScores[0];
    const second = mockMethodologyScores[1];
    return (
      <div
        onClick={() => setModalState("compact")}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-card border border-border shadow-xl cursor-pointer hover:shadow-2xl transition-all animate-in slide-in-from-bottom-4 duration-300"
        style={{ animation: "pulse 3s ease-in-out infinite" }}
      >
        <Brain className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <span className="text-xs font-semibold text-foreground">
          🧠 Analysis: {top.overallScore}% {top.name} | {second.overallScore}% {second.name}
        </span>
        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }

  // Loading state
  if (modalState === "loading") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-[620px] mx-4 animate-in zoom-in-95 duration-300 overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center shadow-[0_4px_16px_hsl(var(--forskale-green)/0.3)]">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold font-heading text-foreground">Advanced Playbook Analysis</h2>
                <p className="text-[11px] text-muted-foreground">Using neuroscience and multiple AI models to decode conversation patterns</p>
              </div>
            </div>

            {/* LLM Grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-5 mb-5">
              {models.map((model) => (
                <LLMCard key={model.modelId} model={model} />
              ))}
            </div>

            {/* Analysis Log */}
            <div className="border border-border rounded-lg bg-secondary/50 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-border bg-card">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Analysis Log</span>
              </div>
              <div ref={logRef} className="h-[100px] overflow-y-auto atlas-scrollbar p-3 space-y-1">
                {logMessages.map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="text-[10px] font-mono text-[hsl(var(--forskale-teal))]">▸</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{msg}</span>
                  </div>
                ))}
                {logMessages.length < mockAnalysisLogMessages.length && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 text-[hsl(var(--forskale-teal))] animate-spin" />
                    <span className="text-[11px] font-mono text-muted-foreground/50">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact results state
  const sorted = [...mockMethodologyScores].sort((a, b) => b.overallScore - a.overallScore);
  const top3Ids = sorted.slice(0, 3).map(m => m.frameworkId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl border border-border shadow-[0_20px_60px_rgba(0,0,0,0.3)] w-full max-w-[820px] mx-4 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] flex items-center justify-center">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold font-heading text-foreground">Analysis Complete</h2>
                <p className="text-[11px] text-muted-foreground">Multi-model consensus across 8 methodologies</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setModalState("minimized")} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <Minimize2 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => analysisResult && onComplete(analysisResult)} className="p-1.5 rounded-md hover:bg-accent transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Custom elements badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--forskale-teal)/0.08)] border border-[hsl(var(--forskale-teal)/0.2)] text-[hsl(var(--forskale-teal))] text-[11px] font-semibold">
              🔍 3 Custom Elements Detected
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great text-[11px] font-semibold">
              ✓ High Confidence
            </span>
          </div>

          {/* Methodology bars */}
          <div className="space-y-2.5 mb-6">
            {sorted.map((m) => (
              <div key={m.frameworkId} className={cn(
                "px-3 py-2 rounded-lg transition-all",
                top3Ids.includes(m.frameworkId)
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green)/0.04)] to-transparent border border-[hsl(var(--forskale-green)/0.15)]"
                  : ""
              )}>
                <MethodologyBar
                  name={m.name}
                  score={m.overallScore}
                  isTop={top3Ids.includes(m.frameworkId)}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => analysisResult && onViewDetailed(analysisResult)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 forskale-gradient-bg text-white text-sm font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
            >
              View Detailed Analysis
            </button>
            <button
              onClick={() => analysisResult && onComplete(analysisResult)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Save Analysis
            </button>
            <button
              onClick={() => setModalState("minimized")}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalysisModal;
