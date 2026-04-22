import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Linkedin, Check } from "lucide-react";

interface PlaybookAnalysisLoaderProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ANALYSIS_STEPS = ["Profile", "Experience", "Posts", "Comments", "Interests", "Skills", "Network", "Activity"];

const AI_MODELS = [
  { name: "ForSkale AI", color: "hsl(201,100%,55%)", featured: true, badge: "Primary" },
  { name: "GPT-4o", color: "hsl(201,100%,55%)", featured: false },
  { name: "Claude 3.5 Sonnet", color: "hsl(265,60%,65%)", featured: false },
  { name: "Gemini 1.5 Pro", color: "hsl(197,86%,64%)", featured: false },
  { name: "Llama 3.1 405B", color: "hsl(97,68%,63%)", featured: false },
  { name: "Mistral Large 2", color: "hsl(213,88%,60%)", featured: false },
];

const STATUS_MESSAGES: Record<string, string> = {
  Profile: "Extracting headline, summary, and professional identity...",
  Experience: "Mapping career trajectory, roles, and tenure patterns...",
  Posts: "Analyzing published content, topics, and engagement style...",
  Comments: "Reading comment history for opinions and priorities...",
  Interests: "Identifying followed topics, groups, and industry focus...",
  Skills: "Evaluating endorsed skills and competency signals...",
  Network: "Mapping connections, mutual contacts, and influence reach...",
  Activity: "Scoring recent engagement frequency and content patterns...",
};

const STEP_COMPLETION: Record<string, string> = {
  Profile: "Professional identity mapped",
  Experience: "Career trajectory analyzed",
  Posts: "Content patterns extracted",
  Comments: "Opinion signals captured",
  Interests: "Topic clusters identified",
  Skills: "Competency profile built",
  Network: "Influence map generated",
  Activity: "Engagement score calculated",
};

export default function PlaybookAnalysisLoader({ isOpen, onComplete }: PlaybookAnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentModel, setCurrentModel] = useState(0);
  const [zoomKey, setZoomKey] = useState(0);
  const [insightsFound, setInsightsFound] = useState(12);
  const [dataPoints, setDataPoints] = useState(120);
  const [confidence, setConfidence] = useState(42);
  const [orbitDuration, setOrbitDuration] = useState(6000);

  const stableOnComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCurrentModel(0);
      setZoomKey(0);
      setInsightsFound(12);
      setDataPoints(120);
      setConfidence(42);
      setOrbitDuration(6000);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setOrbitDuration((prev) => Math.max(2800, prev - 80));
    }, 400);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= ANALYSIS_STEPS.length) {
          clearInterval(interval);
          setTimeout(stableOnComplete, 800);
          return prev;
        }
        setZoomKey((k) => k + 1);
        setInsightsFound((n) => Math.min(85 + Math.floor(Math.random() * 6), n + Math.floor(Math.random() * 11) + 8));
        setDataPoints((n) => Math.min(600 + Math.floor(Math.random() * 30), n + Math.floor(Math.random() * 55) + 35));
        setConfidence((c) => Math.min(98, c + Math.floor(Math.random() * 8) + 6));
        return next;
      });
    }, 1400);
    return () => clearInterval(interval);
  }, [isOpen, stableOnComplete]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentModel((prev) => (prev + 1) % AI_MODELS.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isOpen]);

  const progressPct = ((currentStep + 1) / ANALYSIS_STEPS.length) * 100;

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{
            maxWidth: "780px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(135deg, hsl(220,60%,8%) 0%, hsl(220,40%,11%) 50%, hsl(215,50%,9%) 100%)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 25% 50%, hsla(201,100%,50%,0.12), transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 40% 60% at 80% 30%, hsla(201,100%,45%,0.08), transparent 60%)",
            }}
          />

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, hsl(201,100%,30%), hsl(210,80%,48%))",
                    boxShadow: "0 0 20px hsla(201,100%,50%,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
                    flexShrink: 0,
                  }}
                >
                  <Linkedin className="text-white" style={{ width: "20px", height: "20px" }} />
                  <div
                    className="absolute inset-0 rounded-[10px] border border-white/20 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight leading-tight">
                    LinkedIn Profile Enrichment
                  </h2>
                  <p className="text-[11px] leading-tight" style={{ color: "hsl(215,20%,50%)" }}>
                    Building behavioral intelligence from LinkedIn data
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold tabular-nums leading-none" style={{ color: "hsl(201,100%,65%)" }}>
                  {currentStep + 1}
                  <span className="text-sm font-normal" style={{ color: "hsl(215,20%,35%)" }}>
                    /{ANALYSIS_STEPS.length}
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "hsl(215,20%,40%)" }}>
                  sections analyzed
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="mb-5"
              style={{ height: "2px", background: "rgba(255,255,255,0.06)", borderRadius: "1px", overflow: "hidden" }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: "linear-gradient(to right, hsl(201,100%,30%), hsl(210,80%,55%))",
                  borderRadius: "1px",
                  transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 8px hsl(201,100%,50%)",
                }}
              />
            </div>

            {/* Two-column body */}
            <div className="flex gap-5">
              {/* Left: Orbital */}
              <div style={{ width: "240px", flexShrink: 0 }}>
                <div
                  className="relative overflow-hidden"
                  style={{
                    height: "270px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.018)",
                  }}
                >
                  <div className="scan-sweep" />
                  <div className="pulse-rings">
                    <div className="pulse-ring pr-1" />
                    <div className="pulse-ring pr-2" />
                    <div className="pulse-ring pr-3" />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="orbital-scene">
                      <div className="orbital-ring" style={{ animationDuration: `${orbitDuration}ms` }}>
                        {ANALYSIS_STEPS.map((step, index) => {
                          const angle = (360 / ANALYSIS_STEPS.length) * index;
                          const isActive = index === currentStep;
                          const isComplete = index < currentStep;
                          return (
                            <div
                              key={step}
                              className="orbital-item-wrapper"
                              style={{ transform: `rotateX(${angle}deg) translateZ(100px)` }}
                            >
                              <div
                                className={`orbital-pill${isActive ? " active" : ""}${isComplete ? " complete" : ""}`}
                              >
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

                  <div className="absolute bottom-0 left-0 right-0 text-center pb-3">
                    <div
                      className="text-[9px] font-medium uppercase tracking-[0.3em]"
                      style={{ color: "hsla(201,100%,55%,0.7)" }}
                    >
                      Analyzing
                    </div>
                    <div className="text-xs font-bold tracking-wider uppercase text-white">
                      {ANALYSIS_STEPS[currentStep]}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {[
                    { label: "Signals Found", value: insightsFound, color: "hsl(201,100%,65%)" },
                    { label: "Behavioral Data", value: dataPoints, color: "hsl(201,100%,65%)" },
                    { label: "Profile Confidence", value: `${confidence}%`, color: "hsl(150,60%,55%)" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="text-center px-1 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="text-xs font-bold tabular-nums leading-none" style={{ color }}>
                        {value}
                      </div>
                      <div className="text-[8px] uppercase tracking-wide mt-0.5" style={{ color: "hsl(215,20%,35%)" }}>
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Step progress list */}
              <div className="flex-1 flex flex-col gap-1">
                {ANALYSIS_STEPS.map((step, index) => {
                  const isCompleted = index < currentStep;
                  const isActive = index === currentStep;
                  return (
                    <div
                      key={step}
                      className="flex items-center gap-2.5 px-3 rounded-xl"
                      style={{
                        height: "34px",
                        flexShrink: 0,
                        overflow: "hidden",
                        background: isActive
                          ? "hsla(201,100%,50%,0.1)"
                          : isCompleted
                            ? "hsla(150,60%,40%,0.05)"
                            : "transparent",
                        border: isActive
                          ? "1px solid hsla(201,100%,50%,0.22)"
                          : isCompleted
                            ? "1px solid hsla(150,60%,40%,0.15)"
                            : "1px solid transparent",
                        transition: "all 0.4s ease",
                      }}
                    >
                      <div style={{ flexShrink: 0, width: "18px", height: "18px" }}>
                        {isCompleted ? (
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "hsl(150,55%,38%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 0 8px hsla(150,55%,38%,0.5)",
                            }}
                          >
                            <Check size={9} color="white" strokeWidth={3} />
                          </div>
                        ) : isActive ? (
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: "1.5px solid hsl(201,100%,50%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "hsl(201,100%,50%)",
                                boxShadow: "0 0 6px hsl(201,100%,50%)",
                                animation: "stepDot 1s ease-in-out infinite",
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[11px] font-semibold tracking-wide leading-none"
                          style={{
                            color: isActive
                              ? "hsl(201,100%,80%)"
                              : isCompleted
                                ? "hsl(150,50%,62%)"
                                : "hsl(215,20%,28%)",
                          }}
                        >
                          {step}
                        </div>
                        {isActive && (
                          <div className="text-[9px] mt-0.5 leading-snug" style={{ color: "hsl(215,20%,52%)" }}>
                            {STATUS_MESSAGES[step]}
                          </div>
                        )}
                        {isCompleted && (
                          <div className="text-[9px] mt-0.5" style={{ color: "hsl(150,45%,48%)" }}>
                            {STEP_COMPLETION[step]}
                          </div>
                        )}
                      </div>

                      {isCompleted && (
                        <div
                          className="flex-shrink-0 text-[8px] font-medium uppercase tracking-wide"
                          style={{ color: "hsl(150,40%,35%)" }}
                        >
                          done
                        </div>
                      )}
                      {isActive && (
                        <div className="flex-shrink-0 flex gap-0.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              style={{
                                width: "3px",
                                height: "3px",
                                borderRadius: "50%",
                                background: "hsl(201,100%,50%)",
                                animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI model strip */}
            <div
              className="mt-4 px-4 py-2.5"
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: AI_MODELS[currentModel].color,
                    boxShadow: `0 0 8px ${AI_MODELS[currentModel].color}`,
                    animation: "stepDot 1s ease-in-out infinite",
                  }}
                />
                <span className="text-[10px]" style={{ color: "hsl(215,20%,45%)" }}>
                  Running on
                </span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: AI_MODELS[currentModel].featured ? "hsl(201,100%,65%)" : "white" }}
                >
                  {AI_MODELS[currentModel].name}
                </span>
                {AI_MODELS[currentModel].featured && (
                  <span
                    className="text-[8px] font-bold uppercase rounded-full px-1.5 py-0.5"
                    style={{
                      background: "hsla(201,100%,50%,0.2)",
                      color: "hsl(201,100%,65%)",
                      border: "1px solid hsla(201,100%,50%,0.3)",
                    }}
                  >
                    Primary
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {AI_MODELS.map((m, i) => (
                    <div
                      key={m.name}
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: i === currentModel ? m.color : "rgba(255,255,255,0.08)",
                        boxShadow: i === currentModel ? `0 0 5px ${m.color}` : "none",
                        transition: "all 0.3s",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-1 text-[9px] italic" style={{ color: "hsl(215,20%,45%)" }}>
                {STATUS_MESSAGES[ANALYSIS_STEPS[currentStep]]}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .orbital-scene {
          position: relative;
          width: 220px;
          height: 240px;
          perspective: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .orbit-track-ring {
          position: absolute;
          width: 54px;
          height: 220px;
          border-radius: 50%;
          border: 1px solid hsla(201, 100%, 50%, 0.18);
          transform: rotateY(72deg);
          pointer-events: none;
        }

        .orbital-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: orbitSpin 6000ms linear infinite;
        }

        @keyframes orbitSpin {
          from { transform: rotateY(-14deg) rotateX(0deg); }
          to   { transform: rotateY(-14deg) rotateX(-360deg); }
        }

        .orbital-item-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
          margin-top: -14px;
          margin-left: -42px;
        }

        .orbital-pill {
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(203, 213, 225, 0.5);
          font-size: 0.55rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        .orbital-pill.active {
          background: hsla(201, 100%, 50%, 0.3);
          border-color: hsla(201, 100%, 50%, 0.5);
          color: hsl(201, 100%, 85%);
          box-shadow: 0 0 16px hsla(201, 100%, 50%, 0.5);
        }

        .orbital-pill.complete {
          background: hsla(150, 55%, 38%, 0.12);
          border-color: hsla(150, 55%, 38%, 0.3);
          color: hsl(150, 50%, 60%);
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
          animation: orbitZoom 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }

        .zoom-glow-burst {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle, hsla(201, 100%, 50%, 0.5) 0%, transparent 70%);
          animation: glowPulse 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }

        .zoom-text {
          position: relative;
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fff;
          text-shadow:
            0 0 16px hsla(201, 100%, 55%, 0.95),
            0 0 32px hsla(201, 100%, 55%, 0.6),
            0 0 64px hsla(201, 100%, 45%, 0.3);
          white-space: nowrap;
        }

        @keyframes orbitZoom {
          0%   { transform: translate(-50%, -50%) scale(0.2); opacity: 0; filter: blur(8px); }
          35%  { transform: translate(-50%, -50%) scale(1);   opacity: 1; filter: blur(0); }
          65%  { transform: translate(-50%, -50%) scale(1.05); opacity: 1; filter: blur(0); }
          82%  { transform: translate(-50%, -50%) scale(2.0); opacity: 0.4; filter: blur(2px); }
          100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; filter: blur(8px); }
        }

        @keyframes glowPulse {
          0%   { opacity: 0; transform: scale(0.3); }
          35%  { opacity: 1; transform: scale(1); }
          65%  { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        .scan-sweep {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            hsla(201, 100%, 50%, 0.06) 48%,
            hsla(201, 100%, 60%, 0.14) 50%,
            hsla(201, 100%, 50%, 0.06) 52%,
            transparent 100%
          );
          animation: scanSweep 2.8s ease-in-out infinite;
        }

        @keyframes scanSweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        .pulse-rings {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 1;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid hsla(201, 100%, 50%, 0.2);
          animation: ringExpand 3s ease-out infinite;
        }

        .pr-1 { width: 60px;  height: 60px;  animation-delay: 0s; }
        .pr-2 { width: 60px;  height: 60px;  animation-delay: 1s; }
        .pr-3 { width: 60px;  height: 60px;  animation-delay: 2s; }

        @keyframes ringExpand {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }

        @keyframes stepDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }

        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </>,
    document.body,
  );
}
