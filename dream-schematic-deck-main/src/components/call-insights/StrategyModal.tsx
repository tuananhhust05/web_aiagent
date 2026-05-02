import { X, Target, Sparkles } from "lucide-react";
import { useEffect } from "react";

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  "Account playbooks and strategic plans",
  "Cross-meeting themes and opportunities",
  "Smart suggestions powered by Meeting Intelligence",
];

const StrategyModal = ({ isOpen, onClose }: StrategyModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[565px] animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-modal-title"
      >
        {/* Gradient Header */}
        <div className="rounded-t-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors duration-200"
            aria-label="Close Strategy modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 id="strategy-modal-title" className="text-2xl font-heading font-bold text-white">
              Strategy — Coming Soon
            </h2>
          </div>

          <div className="space-y-4 text-white">
            <p className="text-sm leading-relaxed font-medium">
              A dedicated Strategy hub that guides you through every negotiation with clarity and confidence.
            </p>
            <p className="text-sm leading-relaxed opacity-95">
              This space will deliver strategy powered by advanced AI and Neuroscience, combining past conversations,
              critical context, and stakeholder insights – so you always know what to say next and how to move the
              discussion toward the desired outcome.
            </p>
            <p className="text-sm font-semibold pt-2">Stay tuned</p>
          </div>
        </div>

        {/* White Content */}
        {/* <div className="bg-white rounded-b-xl p-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            WHAT'S COMING
          </h3>

          <div className="space-y-3 mb-6">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[hsl(var(--forskale-teal))] shrink-0 mt-0.5" />
                <span className="text-sm text-foreground leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            Got it
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default StrategyModal;
