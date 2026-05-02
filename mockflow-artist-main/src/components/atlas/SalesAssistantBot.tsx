import { useState, useRef, useCallback, useEffect } from "react";
import forskaleLogo from "@/assets/forskale-logo.png";
import { X, Volume2, ChevronLeft, ChevronRight, Pause, Play, Users, Building2, FileText, Target } from "lucide-react";
import { VoiceStrategySession } from "./VoiceStrategySession";
import { format, addDays, subDays } from "date-fns";

// Mock meeting data for the bot panel
const MOCK_BOT_MEETINGS = [
  {
    id: "b1",
    title: "Discovery Call - TechVision Systems",
    time: "9:00 AM",
    duration: "45 min",
    participants: ["Sarah Chen (VP Sales)", "Mike Rodriguez (CTO)", "You"],
    company: "TechVision Systems",
    industry: "Enterprise Software",
    size: "500-1,000 employees",
    revenue: "$75M - $100M ARR",
    location: "Austin, Texas",
    founded: "2015",
    description:
      "TechVision Systems is a rapidly growing enterprise software company specializing in AI-powered business intelligence solutions. They serve Fortune 500 companies across manufacturing, healthcare, and financial services verticals.",
  },
  {
    id: "b2",
    title: "Product Demo - Barilla Group",
    time: "2:00 PM",
    duration: "1.5 hrs",
    participants: ["Luigi Moretti (Procurement)", "Anna Bianchi (IT Director)", "You"],
    company: "Barilla Group",
    industry: "Food & Beverage / FMCG",
    size: "8,000+ employees",
    revenue: "€3.6B",
    location: "Parma, Italy",
    founded: "1877",
    description:
      "Barilla Group is the world's leading pasta maker and one of the top Italian food groups. They are looking for digital transformation solutions to streamline supply chain operations.",
  },
  {
    id: "b3",
    title: "Contract Negotiation - Ferrero SpA",
    time: "11:00 AM",
    duration: "1 hr",
    participants: ["Marco Rossi (Legal)", "Elena Conti (CFO)", "You"],
    company: "Ferrero SpA",
    industry: "Confectionery / FMCG",
    size: "35,000+ employees",
    revenue: "€14B",
    location: "Alba, Italy",
    founded: "1946",
    description:
      "Ferrero is a global confectionery giant known for Nutella, Ferrero Rocher, and Kinder. They are exploring enterprise CRM solutions for their global sales teams.",
  },
];

type BotView = "closed" | "welcome" | "meetings" | "meeting-countdown" | "meeting-brief";

export function SalesAssistantBot() {
  const [hovered, setHovered] = useState(false);
  const [view, setView] = useState<BotView>("closed");
  const [countdown, setCountdown] = useState(5);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<(typeof MOCK_BOT_MEETINGS)[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showStrategy, setShowStrategy] = useState(false);
  const totalDuration = 150; // 2:30

  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Countdown timer
  useEffect(() => {
    if ((view === "welcome" || view === "meeting-countdown") && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (view === "welcome" && countdown === 0) {
      setView("meetings");
    }
    if (view === "meeting-countdown" && countdown === 0) {
      setView("meeting-brief");
      setIsPlaying(true);
      setElapsed(0);
    }
  }, [countdown, view]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && view === "meeting-brief" && elapsed < totalDuration) {
      const timer = setTimeout(() => setElapsed((e) => e + 1), 1000);
      return () => clearTimeout(timer);
    }
    if (elapsed >= totalDuration) setIsPlaying(false);
  }, [isPlaying, elapsed, view]);

  // Drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (view !== "closed") return;
      setIsDragging(true);
      hasMoved.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position, view]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      setPosition({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy });
    },
    [isDragging]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleBotClick = () => {
    if (hasMoved.current) return;
    setCountdown(5);
    setView("welcome");
  };

  const handleClose = () => {
    setView("closed");
    setSelectedMeeting(null);
    setIsPlaying(false);
    setElapsed(0);
  };

  const handleMeetingClick = (meeting: (typeof MOCK_BOT_MEETINGS)[0]) => {
    setSelectedMeeting(meeting);
    setCountdown(5);
    setView("meeting-countdown");
  };

  const handleBackToMeetings = () => {
    setView("meetings");
    setSelectedMeeting(null);
    setIsPlaying(false);
    setElapsed(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const circumference = 2 * Math.PI * 45;
  const countdownOffset = circumference - (countdown / 5) * circumference;

  return (
    <>
      {/* Draggable bot icon */}
      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Glow tooltip */}
        <div
          className={`pointer-events-none select-none whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            hovered ? "translate-x-0 opacity-100 scale-100" : "translate-x-4 opacity-0 scale-95"
          }`}
          style={{
            background: "linear-gradient(135deg, #7ED957 0%, #06B6D4 50%, #1C4E80 100%)",
            color: "white",
            boxShadow: hovered ? "0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(126, 217, 87, 0.3)" : "none",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          Sales Assistance
        </div>

        {/* Bot button */}
        <button
          onClick={handleBotClick}
          className="relative flex items-center justify-center rounded-full transition-all duration-300 ease-in-out touch-none"
          style={{
            width: hovered ? 68 : 56,
            height: hovered ? 68 : 56,
            background: "linear-gradient(135deg, #E8F8FF 0%, #D1F3E6 100%)",
            boxShadow: hovered
              ? "0 8px 24px rgba(0, 0, 0, 0.25), 0 0 30px rgba(6, 182, 212, 0.4)"
              : "0 4px 10px rgba(0, 0, 0, 0.18)",
          }}
          aria-label="Sales Assistance Bot"
        >
          <img
            src={forskaleLogo}
            alt="ForSkale"
            className="h-[60%] w-auto pointer-events-none"
            style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
          />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ background: "#1C4E80" }}
          />
        </button>
      </div>

      {/* Modal overlay */}
      {view !== "closed" && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header gradient bar */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: "linear-gradient(135deg, #7ED957 0%, #06B6D4 50%, #1C4E80 100%)" }}
            >
              <h2 className="text-white font-bold text-lg">Atlas Sales Coach</h2>
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Welcome / Countdown view */}
            {(view === "welcome" || view === "meeting-countdown") && (
              <div className="flex flex-col items-center py-10 px-6">
                {/* Speaking avatar */}
                <div className="relative mb-6">
                  <div
                    className="h-20 w-20 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)" }}
                  >
                    <img src={forskaleLogo} alt="" className="h-10 w-auto brightness-0 invert" />
                  </div>
                  {/* Pulse rings */}
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="absolute inset-0 rounded-full border-2 border-[#06B6D4]/40"
                      style={{
                        animation: `pulse-ring 2s ease-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Volume prompt */}
                <Volume2 className="h-10 w-10 mb-3" style={{ color: "#06B6D4" }} />
                <p className="text-base font-semibold text-gray-700 mb-1">
                  {view === "welcome" ? "Please turn on your volume" : "Preparing your meeting brief"}
                </p>

                {/* Countdown ring */}
                <div className="relative my-6">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#06B6D4"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={countdownOffset}
                      className="transition-all duration-1000"
                      style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800">
                    {countdown}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {view === "welcome" ? "Starting in" : "Starting brief in"} {countdown} seconds
                </p>
              </div>
            )}

            {/* Meetings list view */}
            {view === "meetings" && (
              <div className="py-4 px-6">
                {/* Date picker */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedDate((d) => subDays(d, 1))}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="font-semibold text-gray-800">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                  <button
                    onClick={() => setSelectedDate((d) => addDays(d, 1))}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <h3 className="font-bold text-gray-800 mb-1">Your Meetings</h3>
                <p className="text-sm text-gray-500 mb-4">{MOCK_BOT_MEETINGS.length} meetings</p>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {MOCK_BOT_MEETINGS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleMeetingClick(m)}
                      className="w-full text-left rounded-xl p-4 border border-gray-200 hover:border-[#06B6D4] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: "linear-gradient(135deg, #7ED957, #06B6D4)" }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate group-hover:text-[#1C4E80] transition-colors">
                            {m.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {m.time} • {m.duration}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting brief view */}
            {view === "meeting-brief" && selectedMeeting && (
              <div className="py-4 px-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={handleBackToMeetings}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1C4E80] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back to meetings
                  </button>
                  <button
                    onClick={() => setShowStrategy(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #7ED957, #06B6D4, #1C4E80)",
                      boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <Target className="h-4 w-4" /> Plan Strategy
                  </button>
                </div>

                <h3 className="font-bold text-gray-800 text-lg">{selectedMeeting.title}</h3>
                <p className="text-sm text-gray-500 mb-5">
                  {selectedMeeting.time} • {selectedMeeting.duration}
                </p>

                {/* Participants */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" style={{ color: "#06B6D4" }} />
                    <span className="font-semibold text-sm text-gray-700">Meeting Participants</span>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {selectedMeeting.participants.map((p, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        • {p}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Company overview */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" style={{ color: "#06B6D4" }} />
                    <span className="font-semibold text-sm text-gray-700">Company Overview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 ml-6 text-sm">
                    <div>
                      <span className="text-gray-400">Company</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.company}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Industry</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.industry}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Size</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.size}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Revenue</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.revenue}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Location</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Founded</span>
                      <p className="text-gray-800 font-medium">{selectedMeeting.founded}</p>
                    </div>
                  </div>
                </div>

                {/* Company description */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" style={{ color: "#06B6D4" }} />
                    <span className="font-semibold text-sm text-gray-700">Company Description</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-6 leading-relaxed">{selectedMeeting.description}</p>
                </div>

                {/* Playback controls */}
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "linear-gradient(135deg, #7ED95710, #06B6D410)" }}
                >
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #06B6D4, #1C4E80)" }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(elapsed / totalDuration) * 100}%`,
                          background: "linear-gradient(90deg, #7ED957, #06B6D4)",
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono w-20 text-right">
                    {formatTime(elapsed)} / {formatTime(totalDuration)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Strategy Session */}
      {showStrategy && selectedMeeting && (
        <VoiceStrategySession
          meetingTitle={selectedMeeting.title}
          company={selectedMeeting.company}
          participants={selectedMeeting.participants}
          onClose={() => setShowStrategy(false)}
        />
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </>
  );
}
