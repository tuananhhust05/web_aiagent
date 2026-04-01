import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, X, Clock, Brain, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DealStageIndicator, getDealStageForMeeting, STAGE_NEURO_MAP } from "./DealStageIndicator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface Meeting {
  id: string;
  title: string;
  time: string;
  startHour: number;
  duration: number;
  dayIndex: number;
  type?: "discovery" | "renewal" | "internal";
  meetLink?: string;
  dateISO?: string;
}

const MOCK_MEETINGS: Meeting[] = [
  { id: "1", title: "Lavazza A Modo Mio — Discussion and Pricing Review", time: "1:00 PM - 2:00 PM", startHour: 13, duration: 1, dayIndex: 0, type: "renewal" },
  { id: "2", title: "Nova Consulting — Discovery Call", time: "10:00 AM - 11:00 AM", startHour: 10, duration: 1, dayIndex: 1, type: "discovery" },
  { id: "3", title: "Barilla Group — Product Demo", time: "2:00 PM - 3:30 PM", startHour: 14, duration: 1.5, dayIndex: 2, type: "discovery" },
  { id: "4", title: "Ferrero SpA — Contract Negotiation", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 3, type: "internal" },
  { id: "5", title: "Pirelli — Q1 Strategy Sync", time: "3:00 PM - 4:00 PM", startHour: 15, duration: 1, dayIndex: 4, type: "renewal" },
  { id: "6", title: "Marco Verdi — Freelance Consultation", time: "9:00 AM - 10:00 AM", startHour: 9, duration: 1, dayIndex: 4, type: "discovery" },
  // Additional month meetings
  { id: "7", title: "UniCredit — Annual Review", time: "9:30 AM - 10:30 AM", startHour: 9, duration: 1, dayIndex: 8, type: "renewal" },
  { id: "8", title: "Campari Group — Brand Strategy", time: "2:00 PM - 3:00 PM", startHour: 14, duration: 1, dayIndex: 10, type: "discovery" },
  { id: "9", title: "Prada — Partnership Call", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 12, type: "discovery" },
  { id: "10", title: "Enel — Sustainability Sync", time: "3:00 PM - 4:00 PM", startHour: 15, duration: 1, dayIndex: 15, type: "internal" },
  { id: "11", title: "Generali — Q1 Pipeline", time: "10:00 AM - 11:00 AM", startHour: 10, duration: 1, dayIndex: 17, type: "renewal" },
  { id: "12", title: "Luxottica — Lens Innovation", time: "1:00 PM - 2:00 PM", startHour: 13, duration: 1, dayIndex: 19, type: "discovery" },
  { id: "13", title: "Team Standup", time: "9:00 AM - 9:30 AM", startHour: 9, duration: 0.5, dayIndex: 1, type: "internal" },
  { id: "14", title: "Benetton — Retail Expansion", time: "4:00 PM - 5:00 PM", startHour: 16, duration: 1, dayIndex: 22, type: "renewal" },
  { id: "15", title: "Illy Coffee — New Markets", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 24, type: "discovery" },
  { id: "16", title: "Maserati — Fleet Deal", time: "2:00 PM - 3:30 PM", startHour: 14, duration: 1.5, dayIndex: 26, type: "renewal" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getMeetingBorderColor = (type?: string) => {
  switch (type) {
    case "discovery": return "border-l-forskale-teal";
    case "renewal": return "border-l-forskale-green";
    case "internal": return "border-l-cal-cyan";
    default: return "border-l-forskale-teal";
  }
};

const getEventDotColor = (type?: string) => {
  switch (type) {
    case "discovery": return "bg-forskale-teal";
    case "renewal": return "bg-forskale-green";
    case "internal": return "bg-cal-cyan";
    default: return "bg-forskale-teal";
  }
};

// --- Dynamic calendar grid generation ---
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  const day = new Date(year, month, 1).getDay();
  // Convert Sunday-first (0-6) to Monday-first (0-6)
  return day === 0 ? 6 : day - 1;
};

interface CalendarDay {
  date: number;
  monthOffset: 'previous' | 'current' | 'next';
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
  dayIndex: number;
}

function generateCalendarGrid(year: number, month: number, todayDate: Date): CalendarDay[] {
  const daysInCurrentMonth = getDaysInMonth(year, month);
  const daysInPreviousMonth = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const calendarDays: CalendarDay[] = [];
  let dayCounter = 0;

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const date = daysInPreviousMonth - i;
    calendarDays.push({
      date,
      monthOffset: 'previous',
      isCurrentMonth: false,
      isToday: false,
      fullDate: new Date(year, month - 1, date),
      dayIndex: dayCounter++,
    });
  }

  // Current month days
  for (let date = 1; date <= daysInCurrentMonth; date++) {
    const isToday =
      year === todayDate.getFullYear() &&
      month === todayDate.getMonth() &&
      date === todayDate.getDate();

    calendarDays.push({
      date,
      monthOffset: 'current',
      isCurrentMonth: true,
      isToday,
      fullDate: new Date(year, month, date),
      dayIndex: dayCounter++,
    });
  }

  // Next month leading days (fill to 42 cells = 6 weeks)
  const totalCells = 42;
  const remaining = totalCells - calendarDays.length;
  for (let date = 1; date <= remaining; date++) {
    calendarDays.push({
      date,
      monthOffset: 'next',
      isCurrentMonth: false,
      isToday: false,
      fullDate: new Date(year, month + 1, date),
      dayIndex: dayCounter++,
    });
  }

  return calendarDays;
}

// For the current app context: March 2026, today = March 13
const DISPLAY_YEAR = 2026;
const DISPLAY_MONTH = 2; // 0-indexed: 2 = March
const TODAY = new Date(2026, 2, 13);

// Map meeting dayIndex to actual March 2026 dates
const MEETING_DATE_MAP: Record<number, number> = {
  0: 2, 1: 3, 2: 4, 3: 5, 4: 6,
  8: 10, 10: 12, 12: 14, 15: 17, 17: 19,
  19: 21, 22: 24, 24: 26, 26: 28,
};

function getMeetingsForDate(fullDate: Date): Meeting[] {
  const dateNum = fullDate.getDate();
  const month = fullDate.getMonth();
  if (month !== 2) return []; // Only March
  return MOCK_MEETINGS.filter(m => MEETING_DATE_MAP[m.dayIndex] === dateNum);
}

// --- Simple Month View Tooltip (no deal stage) ---
function MonthEventTooltip({ events, onClose }: { events: Meeting[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 animate-fade-in rounded-xl border border-forskale-teal/20 bg-card/95 shadow-2xl backdrop-blur-xl"
      style={{ minWidth: 220, maxWidth: 280 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-1.5 px-4 py-3">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-2">
            <div className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", getEventDotColor(ev.type))} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{ev.title.split("—")[0].trim()}</p>
              <p className="text-[10px] text-muted-foreground">{ev.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Day Detail Panel ---
function DayDetailPanel({
  day,
  events,
  onClose,
  onMeetingClick,
}: {
  day: CalendarDay | null;
  events: Meeting[];
  onClose: () => void;
  onMeetingClick: (m: Meeting) => void;
}) {
  if (!day) return null;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${monthNames[day.fullDate.getMonth()]} ${day.date}, ${day.fullDate.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[380px] animate-[slide-in-right_300ms_cubic-bezier(0.4,0,0.2,1)] border-l border-border bg-card/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Day Details</p>
            <h3 className="mt-1 text-lg font-bold text-foreground">{label}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-forskale-teal hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto p-6" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No meetings scheduled</p>
              <p className="mt-1 text-xs text-muted-foreground/60">This day is wide open</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {events.length} meeting{events.length > 1 ? "s" : ""}
              </p>
              {events.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => onMeetingClick(meeting)}
                  className={cn(
                    "group w-full rounded-xl border border-border/60 bg-muted/40 p-4 text-left transition-all duration-300",
                    "hover:-translate-y-0.5 hover:border-forskale-teal/30 hover:bg-muted/80 hover:shadow-lg"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1 h-2 w-2 flex-shrink-0 rounded-full", getEventDotColor(meeting.type))} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{meeting.title.split("—")[0].trim()}</p>
                      {meeting.title.includes("—") && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{meeting.title.split("—")[1]?.trim()}</p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" /> {meeting.time}
                        </span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                          meeting.type === "discovery" && "bg-forskale-teal/10 text-forskale-teal",
                          meeting.type === "renewal" && "bg-forskale-green/10 text-forskale-green",
                          meeting.type === "internal" && "bg-cal-cyan/10 text-cal-cyan"
                        )}>
                          {meeting.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Month Grid View ---
function MonthGridView({ onMeetingClick }: { onMeetingClick: (m: Meeting) => void }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const calendarDays = generateCalendarGrid(DISPLAY_YEAR, DISPLAY_MONTH, TODAY);

  // Group into weeks
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-auto">
        {/* Day Headers */}
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border bg-card">
          {DAYS.map((day) => (
            <div key={day} className="px-3 py-2.5 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid flex-1 grid-rows-6">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border/50 last:border-b-0">
              {week.map((day) => {
                const events = getMeetingsForDate(day.fullDate);
                const visibleDots = events.slice(0, 3);
                const overflow = events.length - 3;

                return (
                  <div
                    key={day.dayIndex}
                    onClick={() => setSelectedDay(day)}
                    onMouseEnter={() => events.length > 0 && setHoveredDay(day.dayIndex)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      "group relative flex min-h-[60px] sm:min-h-[100px] cursor-pointer flex-col border-r border-border/30 p-1.5 sm:p-2.5 transition-all duration-300 last:border-r-0",
                      day.isToday
                        ? "bg-gradient-to-br from-forskale-green/[0.08] via-forskale-teal/[0.06] to-forskale-blue/[0.04] shadow-[inset_0_0_0_1px_hsl(var(--forskale-green)/0.2)]"
                        : day.isCurrentMonth
                          ? "bg-card hover:bg-forskale-teal/[0.03]"
                          : "bg-muted/30",
                      day.isCurrentMonth && !day.isToday && "hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]"
                    )}
                  >
                    {/* Day Number */}
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          "flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[11px] sm:text-sm transition-all",
                          day.isToday
                            ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue font-bold text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)] animate-[pulse-glow_2s_ease-in-out_infinite_alternate]"
                            : day.isCurrentMonth
                              ? "font-semibold text-foreground"
                              : "font-normal text-muted-foreground"
                        )}
                      >
                        {day.date}
                      </div>
                      {events.length > 0 && day.isCurrentMonth && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-1 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {events.length}
                        </span>
                      )}
                    </div>

                    {/* Event Dots - only for current month */}
                    {day.isCurrentMonth && events.length > 0 && (
                      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                        {visibleDots.map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              "h-[6px] w-[6px] rounded-full transition-all duration-200",
                              getEventDotColor(ev.type),
                              "group-hover:scale-125 group-hover:shadow-[0_0_6px_hsl(var(--forskale-teal)/0.5)]"
                            )}
                          />
                        ))}
                        {overflow > 0 && (
                          <span className="rounded-full bg-gradient-to-r from-forskale-green to-forskale-teal px-1.5 py-px text-[8px] font-semibold text-white">
                            +{overflow}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip on hover */}
                    {hoveredDay === day.dayIndex && events.length > 0 && day.isCurrentMonth && (
                      <MonthEventTooltip events={events} onClose={() => setHoveredDay(null)} />
                    )}

                    {/* Today indicator line */}
                    {day.isToday && (
                      <div className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay && (
        <DayDetailPanel
          day={selectedDay}
          events={getMeetingsForDate(selectedDay.fullDate)}
          onClose={() => setSelectedDay(null)}
          onMeetingClick={onMeetingClick}
        />
      )}
    </>
  );
}

// --- Main CalendarView ---
interface CalendarViewProps {
  onMeetingClick: (meeting: Meeting) => void;
  selectedMeetingId?: string;
  onSyncClick: () => void | Promise<void>;
  /** Live meetings from backend. When provided, replaces MOCK_MEETINGS in week view. */
  meetings?: Meeting[];
  /** Called when the user navigates to a new week/month so the parent can reload events */
  onRangeChange?: (start: Date, end: Date) => void;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function CalendarView({ onMeetingClick, selectedMeetingId, onSyncClick, meetings: externalMeetings, onRangeChange }: CalendarViewProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [syncing, setSyncing] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => getMonday(new Date()));

  const liveMeetings = externalMeetings ?? MOCK_MEETINGS;

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAnchor);
    d.setDate(weekAnchor.getDate() + i);
    return d;
  });

  const weekLabel = (() => {
    const sunday = new Date(weekAnchor);
    sunday.setDate(weekAnchor.getDate() + 6);
    const fmt = (d: Date) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;
    if (weekAnchor.getMonth() === sunday.getMonth()) {
      return `${fmt(weekAnchor)} – ${sunday.getDate()}, ${weekAnchor.getFullYear()}`;
    }
    return `${fmt(weekAnchor)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
  })();

  const monthLabel = (() => {
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[weekAnchor.getMonth()]} ${weekAnchor.getFullYear()}`;
  })();

  const navigateWeek = (dir: -1 | 1) => {
    setWeekAnchor(prev => {
      const next = new Date(prev);
      if (view === "week") {
        next.setDate(prev.getDate() + dir * 7);
        const sunday = new Date(next);
        sunday.setDate(next.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        setTimeout(() => onRangeChange?.(next, sunday), 0);
      } else {
        next.setMonth(prev.getMonth() + dir, 1);
        const last = new Date(next.getFullYear(), next.getMonth() + 1, 0, 23, 59, 59, 999);
        setTimeout(() => onRangeChange?.(next, last), 0);
      }
      return next;
    });
  };

  const switchView = (newView: "week" | "month") => {
    setView(newView);
    if (newView === "week") {
      const monday = getMonday(weekAnchor);
      setWeekAnchor(monday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      onRangeChange?.(monday, sunday);
    } else {
      const first = new Date(weekAnchor.getFullYear(), weekAnchor.getMonth(), 1);
      setWeekAnchor(first);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59, 59, 999);
      onRangeChange?.(first, last);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncClick();
    } finally {
      setTimeout(() => setSyncing(false), 600);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-3 sm:px-6 py-3 gap-2">
        <h2 className="text-base sm:text-lg font-bold tracking-[0.1em] text-foreground">CALENDAR</h2>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          {/* View Toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border bg-muted">
            <button
              onClick={() => switchView("week")}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "week"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              week
            </button>
            <button
              onClick={() => switchView("month")}
              className={cn(
                "px-3 sm:px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "month"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button onClick={() => navigateWeek(-1)} className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <span className="min-w-[110px] sm:min-w-[160px] text-center text-xs sm:text-sm font-semibold text-foreground">
              {view === "week" ? weekLabel : monthLabel}
            </span>
            <button onClick={() => navigateWeek(1)} className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync Calendar"}</span>
            <span className="sm:hidden">{syncing ? "…" : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "week" ? (
        /* Week View */
        <div className="flex flex-1 overflow-auto scrollbar-thin">
          <div className="w-12 sm:w-20 flex-shrink-0 border-r border-border bg-muted/50 pt-16">
            {HOURS.map((h) => (
              <div key={h} className="relative h-16 border-b border-border/50 pr-1 sm:pr-2 text-right">
                <span className="absolute -top-2 right-1 sm:right-2 text-[10px] sm:text-xs font-normal text-muted-foreground leading-tight">
                  <span className="hidden sm:inline">{h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}</span>
                  <span className="sm:hidden">{h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7 min-w-[560px]">
            {weekDates.map((date, di) => {
              const today = new Date();
              const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
              const dayMeetings = liveMeetings.filter((m) => m.dayIndex === di);
              return (
              <div key={di} className="border-r border-border last:border-r-0">
                <div className={cn(
                  "sticky top-0 z-10 flex flex-col items-center justify-center border-b border-border bg-card px-1 sm:px-2 py-2",
                  isToday && "bg-gradient-to-br from-forskale-green/[0.08] to-forskale-teal/[0.08]"
                )}>
                  <div className={cn(
                    "text-[10px] sm:text-xs font-medium uppercase tracking-wider",
                    isToday ? "text-forskale-teal" : "text-muted-foreground"
                  )}>{DAYS[di]}</div>
                  <div className={cn(
                    "mx-auto mt-1 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all",
                    isToday
                      ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)] animate-[pulse-glow_2s_ease-in-out_infinite_alternate]"
                      : "text-foreground"
                  )}>
                    {date.getDate()}
                  </div>
                </div>
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="h-16 border-b border-dashed border-border/50" />
                  ))}
                  {dayMeetings.map((meeting) => {
                    const dealData = getDealStageForMeeting(meeting.id);
                    const stageColor =
                      dealData.percentage <= 25 ? "bg-red-400" :
                      dealData.percentage <= 50 ? "bg-amber-400" :
                      dealData.percentage <= 75 ? "bg-forskale-teal" :
                      "bg-forskale-green";

                    return (
                      <HoverCard key={meeting.id} openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <button
                            onClick={() => onMeetingClick(meeting)}
                            className={cn(
                              "absolute inset-x-0.5 sm:inset-x-1 z-20 overflow-hidden rounded-lg border-l-[3px] bg-muted/60 px-1 sm:px-2 py-1.5 text-left transition-all duration-300",
                              getMeetingBorderColor(meeting.type),
                              selectedMeetingId === meeting.id
                                ? "shadow-lg ring-1 ring-forskale-teal/40 bg-muted"
                                : "hover:translate-x-0.5 hover:-translate-y-px hover:bg-muted hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                            )}
                            style={{
                              top: `${meeting.startHour * 64}px`,
                              height: `${meeting.duration * 64 - 4}px`,
                            }}
                          >
                            <p className="truncate text-[10px] sm:text-xs font-semibold text-foreground">{meeting.title.split("—")[0].trim()}</p>
                            <p className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">{meeting.time}</p>
                            <div className={cn("absolute bottom-1.5 right-1.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-2 ring-card", stageColor)} />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="right"
                          sideOffset={12}
                          align="center"
                          className="w-72 sm:w-80 rounded-xl border-border/20 bg-card p-0 shadow-2xl backdrop-blur-xl"
                        >
                          {/* Deal Stage Indicator */}
                          <div className="flex items-center gap-4 border-b border-border/50 px-4 pt-4 pb-3">
                            <DealStageIndicator stageName={dealData.stage} percentage={dealData.percentage} size={64} />
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-foreground">{dealData.stage}</h3>
                              <p className="text-[10px] text-muted-foreground">{dealData.percentage}% of deal journey</p>
                              <div className="mt-1 flex items-center gap-1">
                                <RefreshCcw className="h-2.5 w-2.5 text-forskale-teal" />
                                <span className="text-[9px] font-medium text-forskale-teal">CRM · {dealData.lastUpdated}</span>
                              </div>
                            </div>
                          </div>

                          {/* Meeting Details */}
                          <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
                            <p className="text-xs font-semibold text-foreground">{meeting.title.split("—")[0].trim()}</p>
                            {meeting.title.includes("—") && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{meeting.title.split("—")[1]?.trim()}</p>
                            )}
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {meeting.time}
                            </p>
                          </div>

                          {/* Neuro Insights */}
                          {STAGE_NEURO_MAP[dealData.stage] && (
                            <div className="bg-forskale-teal/[0.04] px-4 py-3 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Brain className="h-3.5 w-3.5 text-forskale-teal" />
                                <span className="text-[11px] font-semibold text-forskale-teal">Neuro Insights</span>
                              </div>
                              <ul className="space-y-1">
                                {STAGE_NEURO_MAP[dealData.stage].tips.map((tip, i) => (
                                  <li key={i} className="flex gap-1.5 text-[11px] text-foreground">
                                    <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-forskale-teal" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                              <div className="rounded-md bg-forskale-blue/[0.06] px-2.5 py-1.5">
                                <p className="text-[10px] font-semibold text-forskale-blue">⚠ Cognitive Bias</p>
                                <p className="text-[11px] text-foreground">{STAGE_NEURO_MAP[dealData.stage].bias}</p>
                              </div>
                            </div>
                          )}
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month View */
        <MonthGridView onMeetingClick={onMeetingClick} />
      )}
    </div>
  );
}

export type { Meeting };
