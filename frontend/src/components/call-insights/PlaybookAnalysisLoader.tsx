import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Brain } from "lucide-react";

interface PlaybookAnalysisLoaderProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  "MEDDIC", "BANT", "SPIN", "SPICED",
  "CHAMP", "GPCT", "Discovery", "Demo Call"
];

const AI_MODELS = [
  { name: "ForSkale AI", color: "hsl(97,72%,48%)", featured: true, badge: "⚡ Primary" },
  { name: "GPT-4o", color: "hsl(174,56%,55%)", featured: false },
  { name: "Claude 3.5 Sonnet", color: "hsl(265,60%,55%)", featured: false },
  { name: "Gemini 1.5 Pro", color: "hsl(197,86%,64%)", featured: false },
  { name: "Llama 3.1 405B", color: "hsl(97,68%,63%)", featured: false },
  { name: "Mistral Large 2", color: "hsl(213,88%,31%)", featured: false },
];

const STATUS_MESSAGES: Record<string, string> = {
  "MEDDIC": "Evaluating Metrics, Economic Buyer, Decision Criteria...",
  "BANT": "Scoring Budget, Authority, Need, Timeline coverage...",
  "SPIN": "Analyzing Situation, Problem, Implication, Need-Payoff...",
  "SPICED": "Checking Situation, Pain, Impact, Critical Event, Decision...",
  "CHAMP": "Assessing Challenges, Authority, Money, Prioritization...",
  "GPCT": "Reviewing Goals, Plans, Challenges, Timeline alignment...",
  "Discovery": "Evaluating discovery call structure and depth...",
  "Demo Call": "Analyzing demo flow, objections, and next steps...",
};

export default function PlaybookAnalysisLoader({
  isOpen,
  onComplete,
}: PlaybookAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentModel, setCurrentModel] = useState(0);
  const [zoomKey, setZoomKey] = useState(0);

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCurrentModel(0);
      setZoomKey(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= ANALYSIS_STEPS.length) {
          clearInterval(interval);
          setTimeout(stableOnComplete, 800);
          return prev;
        }
        setZoomKey(k => k + 1);
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isOpen, stableOnComplete]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentModel(prev => (prev + 1) % AI_MODELS.length);
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: "linear-gradient(180deg, hsl(var(--background) / 0.18), hsl(var(--background) / 0.12))",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)"
        }}
      >
        <div
          className="relative w-full max-w-2xl overflow-hidden border shadow-2xl"
          style={{
            borderRadius: "24px",
            borderColor: "rgba(255,255,255,0.1)",
            background: "linear-gradient(to bottom right, hsl(224,100%,10%), hsl(224,60%,15%), black)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8)"
          }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, hsla(174,56%,55%,0.12), transparent 60%)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))" }} />

          <div className="relative z-10 px-6 py-5">
            <div className="mb-5 flex items-center gap-3">
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: "linear-gradient(to bottom right, hsl(97,72%,48%), hsl(174,56%,55%), hsl(213,88%,31%))",
                  boxShadow: "0 0 24px hsla(97,72%,48%,0.5)"
                }}
              >
                <Brain className="h-5 w-5 text-white" />
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-heading text-white tracking-tight">
                  Advanced Playbook Analysis
                </h2>
                <p className="text-[11px]" style={{ color: "hsl(215,20%,65%)" }}>
                  Cross-referencing meeting against sales methodologies & frameworks
                </p>
              </div>
            </div>

            <div
              className="relative overflow-hidden"
              style={{
                height: "240px",
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.025)",
                backdropFilter: "blur(20px)"
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="orbital-scene">
                  <div className="orbital-ring">
                    {ANALYSIS_STEPS.map((step, index) => {
                      const angle = (360 / ANALYSIS_STEPS.length) * index;
                      const isActive = index === currentStep;

                      return (
                        <div
                          key={step}
                          className="orbital-item-wrapper"
                          style={{ transform: `rotateY(${angle}deg) translateZ(170px)` }}
                        >
                          <div className={`orbital-pill ${isActive ? "active" : ""}`}>
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="orbit-track-ring" />

                  <div key={zoomKey} className="zoom-spotlight">
                    <div className="zoom-glow-burst" />
                    <span className="zoom-text">{ANALYSIS_STEPS[currentStep]}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: "hsla(174,56%,55%,0.8)" }}>
                Currently Scoring
              </div>

              <div className="text-base font-bold tracking-wider uppercase text-white min-h-[1.5rem]">
                {ANALYSIS_STEPS[currentStep]}
              </div>

              <div
                className="w-full max-w-lg px-4 py-3"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)",
                  backdropFilter: "blur(20px)"
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: AI_MODELS[currentModel].color,
                        boxShadow: `0 0 12px ${AI_MODELS[currentModel].color}`
                      }}
                    />
                    <span className="text-xs font-medium" style={{ color: "hsl(215,20%,65%)" }}>AI Model:</span>
                    <span
                      className="font-semibold text-xs transition-all duration-300"
                      style={{ color: AI_MODELS[currentModel].featured ? "hsl(97,72%,65%)" : "white" }}
                    >
                      {AI_MODELS[currentModel].name}
                    </span>
                    {AI_MODELS[currentModel].featured && (
                      <span
                        className="text-[0.6rem] font-bold tracking-wide uppercase rounded-full px-2 py-0.5"
                        style={{
                          background: "hsla(97,72%,48%,0.15)",
                          color: "hsl(97,72%,48%)",
                          border: "1px solid hsla(97,72%,48%,0.3)"
                        }}
                      >
                        {AI_MODELS[currentModel].badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(215,20%,75%)" }}>
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "hsl(174,56%,55%)" }} />
                  <span className="italic">
                    {STATUS_MESSAGES[ANALYSIS_STEPS[currentStep]] || "Analyzing conversation patterns..."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                {AI_MODELS.map((model, index) => (
                  <div
                    key={model.name}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-300"
                    style={{
                      border: index === currentModel
                        ? model.featured
                          ? "1px solid hsla(97,72%,48%,0.4)"
                          : "1px solid hsla(174,56%,55%,0.4)"
                        : "1px solid rgba(255,255,255,0.1)",
                      background: index === currentModel
                        ? model.featured
                          ? "hsla(97,72%,48%,0.15)"
                          : "hsla(174,56%,55%,0.15)"
                        : "transparent",
                      color: index === currentModel
                        ? model.featured
                          ? "hsl(97,72%,65%)"
                          : "hsl(174,56%,75%)"
                        : "hsl(215,20%,40%)"
                    }}
                  >
                    {model.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .orbital-scene {
          position: relative;
          width: 380px;
          height: 180px;
          perspective: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit-track-ring {
          position: absolute;
          width: 340px;
          height: 64px;
          border-radius: 50%;
          border: 1px solid hsla(174, 56%, 55%, 0.18);
          transform: rotateX(72deg);
          pointer-events: none;
        }

        .orbital-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: orbitSpin 5000ms linear infinite;
        }

        @keyframes orbitSpin {
          from { transform: rotateX(-18deg) rotateY(0deg); }
          to { transform: rotateX(-18deg) rotateY(-360deg); }
        }

        .orbital-item-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
          margin-top: -18px;
          margin-left: -50px;
        }

        .orbital-pill {
          padding: 5px 12px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(203, 213, 225, 0.85);
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          white-space: nowrap;
          backdrop-filter: blur(12px);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .orbital-pill.active {
          background: hsla(174, 56%, 55%, 0.2);
          border-color: hsla(174, 56%, 55%, 0.4);
          color: hsl(174, 56%, 75%);
          box-shadow: 0 0 20px hsla(174, 56%, 55%, 0.4);
        }

        .zoom-spotlight {
          position: absolute;
          top: 50%;
          left: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 30;
          animation: orbitZoom 1.0s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }

        .zoom-glow-burst {
          position: absolute;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(174, 56%, 55%, 0.45) 0%, transparent 70%);
          animation: glowPulse 1.0s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }

        .zoom-text {
          position: relative;
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #fff;
          text-shadow:
            0 0 20px hsla(174, 56%, 55%, 0.9),
            0 0 40px hsla(174, 56%, 55%, 0.5),
            0 0 80px hsla(97, 72%, 48%, 0.3);
          white-space: nowrap;
        }

        @keyframes orbitZoom {
          0% {
            transform: translate(-50%, -50%) scale(0.25) translateZ(-60px);
            opacity: 0;
            filter: blur(10px);
          }
          35% {
            transform: translate(-50%, -50%) scale(1) translateZ(0px);
            opacity: 1;
            filter: blur(0);
          }
          65% {
            transform: translate(-50%, -50%) scale(1.05) translateZ(0px);
            opacity: 1;
            filter: blur(0);
          }
          82% {
            transform: translate(-50%, -50%) scale(2.2) translateZ(60px);
            opacity: 0.4;
            filter: blur(2px);
          }
          100% {
            transform: translate(-50%, -50%) scale(4) translateZ(150px);
            opacity: 0;
            filter: blur(8px);
          }
        }

        @keyframes glowPulse {
          0% { opacity: 0; transform: scale(0.3); }
          35% { opacity: 1; transform: scale(1); }
          65% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(2.5); }
        }
      `}</style>
    </>,
    document.body,
  );
}
