import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptSuccessModalProps {
  meetingId: string;
  isNewTranscript: boolean;
  onViewTranscript: () => void;
  onDismiss: () => void;
}

const TranscriptSuccessModal = ({
  meetingId,
  isNewTranscript,
  onViewTranscript,
  onDismiss,
}: TranscriptSuccessModalProps) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [paused, setPaused] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const introSeenKey = `transcript_intro_seen_${meetingId}`;
  const globalDisabledKey = "global_transcript_intro_disabled";

  useEffect(() => {
    if (!isNewTranscript) return;
    const alreadySeen = localStorage.getItem(introSeenKey);
    const globalDisabled = localStorage.getItem(globalDisabledKey);
    if (alreadySeen || globalDisabled) return;
    setVisible(true);
  }, [isNewTranscript, introSeenKey]);

  // Focus trap
  useEffect(() => {
    if (visible && !closing) {
      firstFocusRef.current?.focus();
    }
  }, [visible, closing]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!visible || closing || paused) return;
    if (countdown <= 0) {
      handleClose();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, closing, paused, countdown]);

  // ESC key
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible]);

  const handleClose = useCallback(() => {
    setClosing(true);
    localStorage.setItem(introSeenKey, Date.now().toString());
    if (dontShowAgain) {
      localStorage.setItem(globalDisabledKey, "true");
    }
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onDismiss();
    }, 200);
  }, [introSeenKey, dontShowAgain, onDismiss]);

  const handleViewTranscript = () => {
    localStorage.setItem(introSeenKey, Date.now().toString());
    if (dontShowAgain) {
      localStorage.setItem(globalDisabledKey, "true");
    }
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onViewTranscript();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200",
        closing ? "opacity-0" : "opacity-100"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Transcript Generated"
    >
      <div
        ref={modalRef}
        className={cn(
          "relative max-w-md mx-4 bg-card border border-border rounded-2xl p-6 shadow-2xl transition-all duration-300",
          closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
        onFocus={() => setPaused(true)}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Animated success icon */}
          <div className="flex justify-center">
            <div
              className="success-pop-icon w-16 h-16 rounded-full forskale-gradient-bg flex items-center justify-center"
              style={{ animation: "success-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" }}
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-heading font-bold text-foreground">
              Transcript Generated!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI has processed this meeting
            </p>
          </div>

          {/* Feature checklist */}
          <div className="text-left space-y-2 bg-secondary/50 rounded-lg p-4">
            {[
              "Full conversation captured",
              "Speaker identification added",
              "Searchable with timestamps",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="h-4 w-4 text-[hsl(var(--forskale-green))] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              ref={firstFocusRef}
              onClick={handleViewTranscript}
              className="flex-1 forskale-gradient-bg text-white hover:opacity-90 transition-opacity"
            >
              View Transcript
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>

          {/* Don't show again */}
          <label className="flex items-center gap-2 justify-center text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-border"
            />
            Don't show this again
          </label>

          {/* Auto-close countdown */}
          <p className="text-[10px] text-muted-foreground/60">
            {paused ? "Paused" : `Auto-closing in ${countdown}s...`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranscriptSuccessModal;
