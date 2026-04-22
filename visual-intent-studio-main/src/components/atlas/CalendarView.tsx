import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RefreshCw, X, Clock, Users, Brain, RefreshCcw, CheckCircle2, Circle, FileText, Video, ListChecks } from "lucide-react";
import { getMeetingDetails, type MeetingDetails } from "@/data/mockMeetingDetails";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { DealStageIndicator, getDealStageForMeeting, STAGE_NEURO_MAP } from "./DealStageIndicator";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MEETING_PARTICIPANTS } from "./ContactCard";
import { WeekViewEvent } from "./WeekViewEvent";

interface Meeting {
  id: string;
  title: string;
  time: string;
  startHour: number;
  duration: number;
  dayIndex: number;
  type?: "discovery" | "renewal" | "internal";
}

// Mock meetings with dayIndex as offset from the start of the current week (0=Mon, 6=Sun)
const MOCK_MEETINGS: Meeting[] = [
  { id: "1", title: "Lavazza A Modo Mio — Discussion and Pricing Review", time: "1:00 PM - 2:00 PM", startHour: 13, duration: 1, dayIndex: 0, type: "renewal" },
  { id: "2", title: "Nova Consulting — Discovery Call", time: "10:00 AM - 11:00 AM", startHour: 10, duration: 1, dayIndex: 1, type: "discovery" },
  { id: "3", title: "Barilla Group — Product Demo", time: "2:00 PM - 3:30 PM", startHour: 14, duration: 1.5, dayIndex: 2, type: "discovery" },
  { id: "4", title: "Ferrero SpA — Contract Negotiation", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 3, type: "internal" },
  { id: "5", title: "Pirelli — Q1 Strategy Sync", time: "3:00 PM - 4:00 PM", startHour: 15, duration: 1, dayIndex: 4, type: "renewal" },
  { id: "6", title: "Marco Verdi — Freelance Consultation", time: "9:00 AM - 10:00 AM", startHour: 9, duration: 1, dayIndex: 4, type: "discovery" },
  { id: "13", title: "Team Standup", time: "9:00 AM - 9:15 AM", startHour: 9, duration: 0.25, dayIndex: 1, type: "internal" },
];

// Additional meetings for month view (dayIndex = day of month - 1)
const MONTH_EXTRA_MEETINGS: Meeting[] = [
  { id: "7", title: "UniCredit — Annual Review", time: "9:30 AM - 10:30 AM", startHour: 9, duration: 1, dayIndex: 9, type: "renewal" },
  { id: "8", title: "Campari Group — Brand Strategy", time: "2:00 PM - 3:00 PM", startHour: 14, duration: 1, dayIndex: 11, type: "discovery" },
  { id: "9", title: "Prada — Partnership Call", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 13, type: "discovery" },
  { id: "10", title: "Enel — Sustainability Sync", time: "3:00 PM - 4:00 PM", startHour: 15, duration: 1, dayIndex: 16, type: "internal" },
  { id: "11", title: "Generali — Q1 Pipeline", time: "10:00 AM - 11:00 AM", startHour: 10, duration: 1, dayIndex: 18, type: "renewal" },
  { id: "12", title: "Luxottica — Lens Innovation", time: "1:00 PM - 2:00 PM", startHour: 13, duration: 1, dayIndex: 20, type: "discovery" },
  { id: "14", title: "Benetton — Retail Expansion", time: "4:00 PM - 5:00 PM", startHour: 16, duration: 1, dayIndex: 23, type: "renewal" },
  { id: "15", title: "Illy Coffee — New Markets", time: "11:00 AM - 12:00 PM", startHour: 11, duration: 1, dayIndex: 25, type: "discovery" },
  { id: "16", title: "Maserati — Fleet Deal", time: "2:00 PM - 3:30 PM", startHour: 14, duration: 1.5, dayIndex: 27, type: "renewal" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM

const getEventDotColor = (type?: string) => {
  switch (type) {
    case "discovery": return "bg-forskale-teal";
    case "renewal": return "bg-forskale-green";
    case "internal": return "bg-cal-cyan";
    default: return "bg-forskale-teal";
  }
};

// ── Date helpers ──
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${months[monday.getMonth()]} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`;
  }
  return `${months[monday.getMonth()]} ${monday.getDate()} – ${months[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

function formatMonthYear(year: number, month: number): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[month]} ${year}`;
}

// ── Month grid helpers ──
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

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

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const date = daysInPreviousMonth - i;
    calendarDays.push({ date, monthOffset: 'previous', isCurrentMonth: false, isToday: false, fullDate: new Date(year, month - 1, date), dayIndex: dayCounter++ });
  }
  for (let date = 1; date <= daysInCurrentMonth; date++) {
    const isToday = isSameDay(new Date(year, month, date), todayDate);
    calendarDays.push({ date, monthOffset: 'current', isCurrentMonth: true, isToday, fullDate: new Date(year, month, date), dayIndex: dayCounter++ });
  }
  const remaining = 42 - calendarDays.length;
  for (let date = 1; date <= remaining; date++) {
    calendarDays.push({ date, monthOffset: 'next', isCurrentMonth: false, isToday: false, fullDate: new Date(year, month + 1, date), dayIndex: dayCounter++ });
  }
  return calendarDays;
}

// Get meetings for a specific date in month view
function getMeetingsForMonthDate(date: Date, allMeetings: Meeting[], monthStart: Date): Meeting[] {
  const dayOfMonth = date.getDate() - 1; // 0-indexed
  if (date.getMonth() !== monthStart.getMonth() || date.getFullYear() !== monthStart.getFullYear()) return [];
  
  // Map week meetings to their actual dates in the current week
  const today = new Date();
  const currentMonday = getMonday(today);
  const weekMeetings = MOCK_MEETINGS.filter(m => {
    const meetingDate = new Date(currentMonday);
    meetingDate.setDate(currentMonday.getDate() + m.dayIndex);
    return isSameDay(meetingDate, date);
  });
  
  // Extra month meetings by dayIndex as day-of-month offset
  const extraMeetings = MONTH_EXTRA_MEETINGS.filter(m => m.dayIndex === dayOfMonth);
  
  return [...weekMeetings, ...extraMeetings];
}

// ── Grab Scroll Hook ──
function useGrabScroll(ref: React.RefObject<HTMLElement | null>) {
  const [isGrabMode, setIsGrabMode] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleDoubleClick = useCallback(() => {
    setIsGrabMode(prev => !prev);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isGrabMode || !ref.current) return;
    setIsGrabbing(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: ref.current.scrollLeft,
      scrollTop: ref.current.scrollTop,
    };
    e.preventDefault();
  }, [isGrabMode, ref]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isGrabbing || !ref.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    ref.current.scrollLeft = startPos.current.scrollLeft - dx;
    ref.current.scrollTop = startPos.current.scrollTop - dy;
  }, [isGrabbing, ref]);

  const handleMouseUp = useCallback(() => {
    setIsGrabbing(false);
  }, []);

  return { isGrabMode, isGrabbing, handleDoubleClick, handleMouseDown, handleMouseMove, handleMouseUp };
}

// ── Month Event Tooltip ──
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

// ── Day Detail Panel ──
function DayDetailPanel({
  day, events, onClose, onMeetingClick, getDetails, toggleActionItem, markComplete,
}: {
  day: CalendarDay | null;
  events: Meeting[];
  onClose: () => void;
  onMeetingClick: (m: Meeting) => void;
  getDetails: (id: string) => MeetingDetails | null;
  toggleActionItem: (meetingId: string, actionItemId: string) => void;
  markComplete: (meetingId: string) => void;
}) {
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const { t } = useLanguage();
  if (!day) return null;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const label = `${months[day.fullDate.getMonth()]} ${day.date}, ${day.fullDate.getFullYear()}`;

  const statusColors: Record<string, string> = {
    'completed': 'bg-forskale-green/15 text-forskale-green border-forskale-green/30',
    'upcoming': 'bg-forskale-teal/15 text-forskale-teal border-forskale-teal/30',
    'in-progress': 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  };

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[400px] animate-[slide-in-right_300ms_cubic-bezier(0.4,0,0.2,1)] border-l border-border bg-card/95 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("calendar.dayDetails")}</p>
            <h3 className="mt-1 text-lg font-bold text-foreground">{label}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-forskale-teal hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-auto p-5" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{t("calendar.noMeetings")}</p>
              <p className="mt-1 text-xs text-muted-foreground/60">{t("calendar.dayOpen")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                {events.length} {events.length > 1 ? t("calendar.meetings") : t("calendar.meeting")}
              </p>
              {events.map((meeting) => {
                const details = getDetails(meeting.id);
                const isExpanded = expandedMeeting === meeting.id;
                const completedActions = details?.actionItems.filter(a => a.completed).length ?? 0;
                const totalActions = details?.actionItems.length ?? 0;

                return (
                  <div
                    key={meeting.id}
                    className={cn(
                      "rounded-xl border border-border/60 bg-muted/40 transition-all duration-300",
                      "hover:border-forskale-teal/30 hover:shadow-lg"
                    )}
                  >
                    <button
                      onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-1 h-2 w-2 flex-shrink-0 rounded-full", getEventDotColor(meeting.type))} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">{meeting.title.split("—")[0].trim()}</p>
                            {details && (
                              <span className={cn(
                                "flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                                statusColors[details.status] ?? statusColors['upcoming']
                              )}>
                                {details.status}
                              </span>
                            )}
                          </div>
                          {meeting.title.includes("—") && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{meeting.title.split("—")[1]?.trim()}</p>
                          )}
                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {meeting.time}
                            </span>
                            {details && details.attendees.length > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Users className="h-3 w-3" /> {details.attendees.length}
                              </span>
                            )}
                            {totalActions > 0 && (
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <ListChecks className="h-3 w-3" /> {completedActions}/{totalActions}
                              </span>
                            )}
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
                    {isExpanded && details && (
                      <div className="animate-fade-in border-t border-border/40 px-4 pb-4 space-y-4">
                        <div className="pt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("calendar.attendees")}</p>
                          <div className="flex flex-wrap gap-2">
                            {details.attendees.map(att => (
                              <div key={att.id} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                                  <span className="text-[8px] font-bold text-primary">{att.initials}</span>
                                </div>
                                <span className="text-[11px] font-medium text-foreground">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {details.topics.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("calendar.agenda")}</p>
                            <ul className="space-y-1">
                              {details.topics.map((topic, i) => (
                                <li key={i} className="flex gap-2 text-[11px] text-foreground">
                                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-forskale-teal" />
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {details.actionItems.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                              {t("calendar.actionItems")} ({completedActions}/{totalActions})
                            </p>
                            <div className="space-y-1.5">
                              {details.actionItems.map(item => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-2 group cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleActionItem(meeting.id, item.id);
                                    toast.success(item.completed ? t("toast.actionItemReopened") : t("toast.actionItemCompleted"));
                                  }}
                                >
                                  {item.completed ? (
                                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-forskale-green" />
                                  ) : (
                                    <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground group-hover:text-forskale-teal transition-colors" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className={cn("text-[11px]", item.completed ? "text-muted-foreground line-through" : "text-foreground")}>{item.title}</p>
                                    {item.owner && (
                                      <p className="text-[9px] text-muted-foreground">{item.owner}{item.dueDate ? ` · Due ${item.dueDate}` : ''}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {details.notes && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{t("calendar.notes")}</p>
                            <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-foreground leading-relaxed">{details.notes}</p>
                          </div>
                        )}
                        {details.recordingUrl && (
                          <div className="flex items-center gap-1.5 text-[11px] text-forskale-teal font-medium">
                            <Video className="h-3 w-3" />
                            <span>{t("calendar.recordingAvailable")}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }}
                            className="flex-1 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 py-2 text-[11px] font-semibold text-white transition-all hover:shadow-lg"
                          >
                            {t("calendar.openContactCard")}
                          </button>
                          {details.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markComplete(meeting.id);
                                toast.success(t("toast.meetingCompleted"));
                              }}
                              className="rounded-lg border border-forskale-green/30 px-3 py-2 text-[11px] font-medium text-forskale-green transition-all hover:bg-forskale-green/10"
                            >
                              {t("calendar.markComplete")}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Month Grid View ──
function MonthGridView({ year, month, onMeetingClick, getDetails, toggleActionItem, markComplete }: {
  year: number;
  month: number;
  onMeetingClick: (m: Meeting) => void;
  getDetails: (id: string) => MeetingDetails | null;
  toggleActionItem: (meetingId: string, actionItemId: string) => void;
  markComplete: (meetingId: string) => void;
}) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const { t } = useLanguage();
  const today = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  const grab = useGrabScroll(scrollRef as React.RefObject<HTMLElement | null>);

  const calendarDays = generateCalendarGrid(year, month, today);
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const monthStart = new Date(year, month, 1);

  return (
    <>
      <div
        ref={scrollRef}
        className={cn(
          "flex flex-1 flex-col overflow-auto scrollbar-thin",
          grab.isGrabMode && !grab.isGrabbing && "cursor-grab",
          grab.isGrabbing && "cursor-grabbing"
        )}
        onDoubleClick={grab.handleDoubleClick}
        onMouseDown={grab.handleMouseDown}
        onMouseMove={grab.handleMouseMove}
        onMouseUp={grab.handleMouseUp}
        onMouseLeave={grab.handleMouseUp}
      >
        <div className="sticky top-0 z-10 grid grid-cols-7 border-b border-border bg-card">
          {DAY_LABELS.map((label) => (
            <div key={label} className="px-3 py-2.5 text-center">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-rows-6">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-border/50 last:border-b-0">
              {week.map((day) => {
                const events = getMeetingsForMonthDate(day.fullDate, MOCK_MEETINGS, monthStart);
                const visibleDots = events.slice(0, 3);
                const overflow = events.length - 3;

                return (
                  <div
                    key={day.dayIndex}
                    onClick={() => !grab.isGrabMode && setSelectedDay(day)}
                    onMouseEnter={() => events.length > 0 && setHoveredDay(day.dayIndex)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      "group relative flex min-h-[100px] flex-col border-r border-border/30 p-2.5 transition-all duration-300 last:border-r-0",
                      !grab.isGrabMode && "cursor-pointer",
                      day.isToday
                        ? "bg-gradient-to-br from-forskale-green/[0.08] via-forskale-teal/[0.06] to-forskale-blue/[0.04] shadow-[inset_0_0_0_1px_hsl(var(--forskale-green)/0.2)]"
                        : day.isCurrentMonth
                          ? "bg-card hover:bg-forskale-teal/[0.03]"
                          : "bg-muted/30",
                      day.isCurrentMonth && !day.isToday && "hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-all",
                        day.isToday
                          ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue font-bold text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)]"
                          : day.isCurrentMonth ? "font-semibold text-foreground" : "font-normal text-muted-foreground"
                      )}>
                        {day.date}
                      </div>
                      {events.length > 0 && day.isCurrentMonth && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-1 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {events.length}
                        </span>
                      )}
                    </div>
                    {day.isCurrentMonth && events.length > 0 && (
                      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                        {visibleDots.map((ev) => (
                          <div key={ev.id} className={cn("h-[6px] w-[6px] rounded-full transition-all duration-200", getEventDotColor(ev.type), "group-hover:scale-125")} />
                        ))}
                        {overflow > 0 && (
                          <span className="rounded-full bg-gradient-to-r from-forskale-green to-forskale-teal px-1.5 py-px text-[8px] font-semibold text-white">+{overflow}</span>
                        )}
                      </div>
                    )}
                    {hoveredDay === day.dayIndex && events.length > 0 && day.isCurrentMonth && (
                      <MonthEventTooltip events={events} onClose={() => setHoveredDay(null)} />
                    )}
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
      {selectedDay && (
        <DayDetailPanel
          day={selectedDay}
          events={getMeetingsForMonthDate(selectedDay.fullDate, MOCK_MEETINGS, monthStart)}
          onClose={() => setSelectedDay(null)}
          onMeetingClick={onMeetingClick}
          getDetails={getDetails}
          toggleActionItem={toggleActionItem}
          markComplete={markComplete}
        />
      )}
    </>
  );
}

// ── Main CalendarView ──
interface CalendarViewProps {
  onMeetingClick: (meeting: Meeting) => void;
  selectedMeetingId?: string;
  onSyncClick: () => void;
}

export function CalendarView({ onMeetingClick, selectedMeetingId, onSyncClick }: CalendarViewProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [syncing, setSyncing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const { getDetails, toggleActionItem, markComplete } = useCalendarEvents();
  const { t } = useLanguage();

  const today = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  const grab = useGrabScroll(scrollRef as React.RefObject<HTMLElement | null>);

  // Dynamic week dates
  const currentMonday = getMonday(today);
  const displayMonday = new Date(currentMonday);
  displayMonday.setDate(currentMonday.getDate() + weekOffset * 7);

  const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(displayMonday);
    d.setDate(displayMonday.getDate() + i);
    return d;
  });

  // Dynamic month
  const displayMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  const handleSync = () => {
    setSyncing(true);
    onSyncClick();
    setTimeout(() => setSyncing(false), 2000);
  };

  const goToToday = () => {
    setWeekOffset(0);
    setMonthOffset(0);
  };

  // Scroll to 1 hour before the first meeting on mount
  useEffect(() => {
    if (view === "week" && scrollRef.current && weekOffset === 0) {
      const earliestHour = Math.min(...MOCK_MEETINGS.map(m => m.startHour));
      const scrollToHour = Math.max(0, earliestHour - 1);
      const targetScroll = scrollToHour * 64; // HOURS starts at 0
      scrollRef.current.scrollTop = targetScroll;
    }
  }, [view, weekOffset]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <h2 className="text-lg font-bold tracking-[0.1em] text-foreground">{t("calendar.title")}</h2>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border bg-muted">
            <button
              onClick={() => setView("week")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "week"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {t("calendar.week")}
            </button>
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "month"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {t("calendar.month")}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => view === "week" ? setWeekOffset(p => p - 1) : setMonthOffset(p => p - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[160px] text-center text-sm font-semibold text-foreground">
              {view === "week" ? formatDateRange(displayMonday) : formatMonthYear(displayMonth.getFullYear(), displayMonth.getMonth())}
            </span>
            <button
              onClick={() => view === "week" ? setWeekOffset(p => p + 1) : setMonthOffset(p => p + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>


          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? t("calendar.syncing") : t("calendar.sync")}
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "week" ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Grab hint banner */}
          <div className="flex items-center justify-center gap-2 border-b border-border bg-muted/50 px-4 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              ✋ Double-click empty area to toggle <strong className="text-foreground">grab scroll</strong>
            </span>
            {grab.isGrabMode && (
              <span className="rounded-full bg-forskale-teal/10 px-2 py-0.5 text-[10px] font-semibold text-forskale-teal border border-forskale-teal/20">
                Active
              </span>
            )}
          </div>
          <div
            ref={scrollRef}
            className={cn(
              "flex flex-1 overflow-auto scrollbar-thin select-none",
              grab.isGrabMode && !grab.isGrabbing && "cursor-grab",
              grab.isGrabbing && "cursor-grabbing"
            )}
            onDoubleClick={grab.handleDoubleClick}
            onMouseDown={grab.handleMouseDown}
            onMouseMove={grab.handleMouseMove}
            onMouseUp={grab.handleMouseUp}
            onMouseLeave={grab.handleMouseUp}
          >
          <div className="w-20 flex-shrink-0 border-r border-border bg-muted/50 pt-16">
            {HOURS.map((h) => (
              <div key={h} className="relative h-16 border-b border-border/50 pr-2 text-right">
                <span className="absolute -top-2 right-2 text-xs font-normal text-muted-foreground">
                  {h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
                </span>
              </div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7">
            {weekDates.map((date, di) => {
              const isToday = isSameDay(date, today);
              const dayLabel = DAY_LABELS[di];
              const dateNum = date.getDate();

              return (
                <div key={di} className="border-r border-border last:border-r-0">
                  <div className={cn(
                    "sticky top-0 z-10 flex flex-col items-center justify-center border-b border-border bg-card px-2 py-2",
                    isToday && "bg-gradient-to-br from-forskale-green/[0.08] to-forskale-teal/[0.08]"
                  )}>
                    <div className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      isToday ? "text-forskale-teal" : "text-muted-foreground"
                    )}>{dayLabel}</div>
                    <div className={cn(
                      "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                      isToday
                        ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)]"
                        : "text-foreground"
                    )}>
                      {dateNum}
                    </div>
                  </div>
                  <div className="relative">
                    {HOURS.map((h) => (
                      <div key={h} className="h-16 border-b border-dashed border-border/50" />
                    ))}
                    {/* Only show meetings on the current (offset=0) week */}
                    {weekOffset === 0 && MOCK_MEETINGS.filter((m) => m.dayIndex === di).map((meeting) => (
                      <WeekViewEvent
                        key={meeting.id}
                        meeting={meeting}
                        isSelected={selectedMeetingId === meeting.id}
                        onClick={onMeetingClick}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      ) : (
        <MonthGridView
          year={displayMonth.getFullYear()}
          month={displayMonth.getMonth()}
          onMeetingClick={onMeetingClick}
          getDetails={getDetails}
          toggleActionItem={toggleActionItem}
          markComplete={markComplete}
        />
      )}
    </div>
  );
}

export type { Meeting };
