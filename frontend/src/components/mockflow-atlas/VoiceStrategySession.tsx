import { useState, useCallback, useEffect, useRef } from "react";
import { X, Mic, Keyboard, Square, Send, ChevronUp, ChevronDown } from "lucide-react";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface VoiceStrategySessionProps {
  meetingTitle: string;
  company: string;
  participants: string[];
  onClose: () => void;
}

// Mock AI responses based on keywords
function getMockResponse(input: string, meeting: { company: string; participants: string[] }): string {
  const lower = input.toLowerCase();
  if (lower.includes("opening") || lower.includes("start") || lower.includes("begin")) {
    return `Great question! For your meeting with ${meeting.company}, I'd recommend opening with a brief acknowledgment of their recent growth, then pivot to understanding their current challenges. Ask something like: "We've been following ${meeting.company}'s impressive trajectory — what's driving the need for new solutions right now?" This positions you as informed and genuinely curious.`;
  }
  if (lower.includes("objection") || lower.includes("pushback") || lower.includes("concern")) {
    return `Common objections from companies like ${meeting.company} include budget constraints, integration complexity, and change management concerns. For each: 1) Acknowledge the concern genuinely, 2) Share a relevant case study, 3) Offer a phased approach. For example: "I completely understand — ${meeting.company}'s existing tech stack is a real consideration. That's why we designed our solution to integrate incrementally."`;
  }
  if (lower.includes("pain") || lower.includes("problem") || lower.includes("challenge")) {
    return `Based on ${meeting.company}'s profile, likely pain points include: operational inefficiency at scale, data silos between departments, and difficulty in real-time decision making. Ask probing questions like: "How are your teams currently sharing insights across departments?" and "What's the cost of delayed decisions in your workflow?"`;
  }
  if (lower.includes("question") || lower.includes("ask") || lower.includes("cto")) {
    return `For ${meeting.participants.join(", ")}, prepare these targeted questions: 1) "What does your current tech evaluation process look like?" 2) "What would success look like 12 months from now?" 3) "What's been your experience with similar solutions?" These show strategic thinking and respect for their expertise.`;
  }
  if (lower.includes("close") || lower.includes("next step") || lower.includes("follow")) {
    return `To close effectively with ${meeting.company}: summarize 3 key value points discussed, propose a specific next step (not generic "follow up"), and create urgency by tying to their timeline. Example: "Based on what ${meeting.participants[0]} mentioned about Q3 goals, shall we schedule a technical deep-dive next week so your team can evaluate the integration path?"`;
  }
  return `That's an excellent strategic consideration for your meeting with ${meeting.company}. I'd suggest approaching this by first understanding their specific context — every organization has unique dynamics. Focus on building rapport with ${meeting.participants[0]} early in the conversation, and use open-ended questions to uncover their true priorities. Would you like me to elaborate on any specific aspect of your strategy?`;
}

const QUICK_SUGGESTIONS = [
  "Opening strategy",
  "Pain points",
  "Objection handling",
  "CTO questions",
];

export function VoiceStrategySession({ meetingTitle, company, participants, onClose }: VoiceStrategySessionProps) {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [statusText, setStatusText] = useState("Ready to strategize");
  const [statusSubtitle, setStatusSubtitle] = useState("Tap the microphone to begin");
  const [isActive, setIsActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setIsActive(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial AI greeting
  useEffect(() => {
    const t = setTimeout(() => {
      setOrbState("speaking");
      setStatusText("Preparing your strategy...");
      setStatusSubtitle("");
      const greeting = `Welcome to your strategy session for ${company}. I've analyzed the meeting details and I'm ready to help you prepare for your ${meetingTitle.toLowerCase()}. You'll be meeting with ${participants.length} participants. What would you like to focus on first?`;
      setTimeout(() => {
        setMessages([{ role: "assistant", content: greeting }]);
        setOrbState("idle");
        setStatusText("Ready to strategize");
        setStatusSubtitle("Tap the microphone or type your question");
        setShowConversation(true);
      }, 2000);
    }, 1000);
    return () => clearTimeout(t);
  }, [company, meetingTitle, participants]);

  const processInput = useCallback((input: string) => {
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setOrbState("thinking");
    setStatusText("Analyzing...");
    setStatusSubtitle("Crafting your strategy");

    setTimeout(() => {
      setOrbState("speaking");
      setStatusText("Speaking...");
      setStatusSubtitle("");
      const response = getMockResponse(input, { company, participants });

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
        setOrbState("idle");
        setStatusText("Ready to strategize");
        setStatusSubtitle("Tap the microphone or type your question");
      }, 1500);
    }, 2000);
  }, [company, participants]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      recognitionRef.current?.stop();
      setOrbState("idle");
      setStatusText("Ready to strategize");
      setStatusSubtitle("Tap the microphone to begin");
    } else {
      // Start recording
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        // Fallback: prompt text input
        setIsKeyboardMode(true);
        setShowConversation(true);
        setStatusText("Voice not supported");
        setStatusSubtitle("Use keyboard input instead");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        setShowConversation(true);
        processInput(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        setOrbState("idle");
        setStatusText("Couldn't hear you");
        setStatusSubtitle("Tap the microphone to try again");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      setIsRecording(true);
      setOrbState("listening");
      setStatusText("Listening...");
      setStatusSubtitle("Speak your question or concern");
      recognition.start();
    }
  }, [isRecording, processInput]);

  const toggleKeyboard = () => {
    setIsKeyboardMode(!isKeyboardMode);
    if (!isKeyboardMode) setShowConversation(true);
  };

  const sendText = () => {
    const msg = textInput.trim();
    if (!msg) return;
    setTextInput("");
    setShowConversation(true);
    processInput(msg);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowConversation(true);
    processInput(suggestion);
  };

  const handleClose = () => {
    setIsActive(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    setTimeout(onClose, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col transition-opacity duration-500"
      style={{
        background: "radial-gradient(ellipse at center, #0f1419 0%, #0a0e13 70%, #000000 100%)",
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "all" : "none",
        borderRadius: 24,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start p-8 pb-0 z-10">
        <div className="flex flex-col gap-1">
          <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
            ForSkale Strategy Session
          </span>
          <span className="text-white/60 text-xs">{meetingTitle}</span>
        </div>
        <button
          onClick={handleClose}
          className="p-3 rounded-xl border-none cursor-pointer transition-all duration-200 hover:bg-white/20"
          style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}
        >
          <X className="h-5 w-5 text-white/80" />
        </button>
      </div>

      {/* Central Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        {/* AI Orb */}
        <div className="relative w-[200px] h-[200px] mb-10">
          <div
            className={`w-full h-full relative cursor-pointer transition-all duration-400 orb-${orbState}`}
          >
            <div
              className="w-full h-full relative rounded-full"
              style={{
                background: orbState === "thinking"
                  ? "conic-gradient(from 0deg, #7ED957, #06B6D4, #1C4E80, #7ED957)"
                  : "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)",
                animation: orbState === "thinking"
                  ? "spin-think 2s linear infinite"
                  : orbState === "speaking"
                  ? "speak-pulse 0.8s ease-in-out infinite"
                  : orbState === "listening"
                  ? "breathe 2s ease-in-out infinite"
                  : "breathe 4s ease-in-out infinite",
                boxShadow: orbState === "listening"
                  ? "0 0 60px rgba(6, 182, 212, 0.6), inset 0 0 40px rgba(255,255,255,0.1)"
                  : orbState === "speaking"
                  ? "0 0 80px rgba(126, 217, 87, 0.8), inset 0 0 40px rgba(255,255,255,0.1)"
                  : "0 0 40px rgba(126, 217, 87, 0.4), inset 0 0 40px rgba(255,255,255,0.1)",
              }}
            >
              {/* Core glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                  animation: "pulse-core 3s ease-in-out infinite",
                }}
              />
            </div>
            {/* Rings */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20"
                style={{
                  width: `${110 + i * 20}%`,
                  height: `${110 + i * 20}%`,
                  animation: `ring-pulse 4s ease-in-out infinite`,
                  animationDelay: `${i * 1.3}s`,
                }}
              />
            ))}
          </div>
          {/* Glow behind orb */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full -z-10"
            style={{
              background: "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)",
              filter: "blur(30px)",
              opacity: 0.6,
              animation: "glow-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Status */}
        <h3 className="text-white text-xl font-semibold mb-1">{statusText}</h3>
        <p className="text-white/50 text-sm mb-6">{statusSubtitle}</p>

        {/* Voice Waveform (when listening) */}
        {isRecording && (
          <div className="flex items-center gap-1.5 h-10 mb-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{
                  background: "linear-gradient(to top, #7ED957, #06B6D4)",
                  animation: `wave-dance 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  height: 8,
                }}
              />
            ))}
          </div>
        )}

        {/* Quick Suggestions (when idle and no keyboard) */}
        {orbState === "idle" && !isKeyboardMode && messages.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-md">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-4 py-2 rounded-full text-sm text-white/80 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all"
                style={{ backdropFilter: "blur(10px)" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex justify-center items-center gap-6 py-8 z-10">
        <button
          onClick={toggleRecording}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording ? "shadow-[0_8px_32px_rgba(239,68,68,0.4)]" : ""
          }`}
          style={{
            background: isRecording
              ? "linear-gradient(135deg, #ef4444, #dc2626)"
              : "rgba(255,255,255,0.1)",
            animation: isRecording ? "recording-pulse 1.5s ease-in-out infinite" : "none",
            boxShadow: isRecording ? "0 8px 32px rgba(239,68,68,0.4)" : "0 8px 32px rgba(255,255,255,0.1)",
          }}
        >
          <Mic className="h-7 w-7 text-white" />
        </button>

        <button
          onClick={toggleKeyboard}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: isKeyboardMode ? "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)" : "rgba(255,255,255,0.05)",
          }}
        >
          <Keyboard className={`h-7 w-7 ${isKeyboardMode ? "text-white" : "text-white/70"}`} />
        </button>

        <button
          onClick={handleClose}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-red-500/30"
          style={{ background: "rgba(239,68,68,0.2)" }}
        >
          <Square className="h-6 w-6 text-red-500" />
        </button>
      </div>

      {/* Conversation Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col transition-transform duration-400 max-h-[60vh]"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px 24px 0 0",
          transform: showConversation ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Toggle handle */}
        <button
          onClick={() => setShowConversation(!showConversation)}
          className="flex items-center justify-center py-3 text-white/60 hover:text-white/90 transition-colors"
        >
          {showConversation ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          <span className="text-sm ml-2">Conversation</span>
        </button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4 max-h-[40vh]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white"
                    : "text-white/90"
                }`}
                style={{
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #06B6D4, #1C4E80)"
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>

        {/* Text input */}
        {isKeyboardMode && (
          <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type your strategy question..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-[#06B6D4] transition-colors"
              autoFocus
            />
            <button
              onClick={sendText}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)" }}
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); border-radius: 50%; }
          25% { transform: scale(1.05); border-radius: 45% 55% 60% 40% / 50% 45% 55% 50%; }
          50% { transform: scale(1.02); border-radius: 60% 40% 45% 55% / 45% 60% 40% 55%; }
          75% { transform: scale(1.08); border-radius: 40% 60% 55% 45% / 55% 40% 60% 45%; }
        }
        @keyframes spin-think {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes speak-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes pulse-core {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes ring-pulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes wave-dance {
          0%, 100% { height: 8px; }
          50% { height: 40px; }
        }
        @keyframes recording-pulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 8px 40px rgba(239, 68, 68, 0.6); }
        }
      `}</style>
    </div>
  );
}
