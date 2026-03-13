import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Meeting {
  id: string;
  title: string;
  time: string;
  startHour: number;
  duration: number;
  /** Day index relative to the start of the displayed week (0-6) */
  dayIndex: number;
  type?: "discovery" | "renewal" | "internal";
  /** Google Meet link (hangoutLink or conferenceData entry) */
  meetLink?: string;
  /** ISO date string of the meeting start – used for month view grouping */
  dateISO?: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getMeetingBorderColor = (type?: string) => {
  switch (type) {
    case "discovery":
      return "border-l-forskale-teal";
    case "renewal":
      return "border-l-forskale-green";
    case "internal":
      return "border-l-cal-cyan";
    default:
      return "border-l-forskale-teal";
  }
};

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

/** Return the Monday 00:00 of the week containing `date`. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return 1st of the month for `date`. */
function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Short month names */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a Date range label for week view, e.g. "Mar 2 – 8, 2026" */
function weekRangeLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const m1 = MONTH_NAMES[monday.getMonth()];
  const m2 = MONTH_NAMES[sunday.getMonth()];
  if (monday.getMonth() === sunday.getMonth()) {
    return `${m1} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`;
  }
  return `${m1} ${monday.getDate()} – ${m2} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

/** Format month label, e.g. "March 2026" */
function monthLabel(date: Date): string {
  const full = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${full[date.getMonth()]} ${date.getFullYear()}`;
}

/** Check if two dates are the same calendar day */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface CalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
  selectedMeetingId?: string;
  onSyncClick: () => void;
  /** Called when the visible date range changes so the parent can reload events */
  onRangeChange?: (start: Date, end: Date) => void;
}

export function CalendarView({
  meetings,
  onMeetingClick,
  selectedMeetingId,
  onSyncClick,
  onRangeChange,
}: CalendarViewProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [syncing, setSyncing] = useState(false);

  // Anchor date – the Monday (week) or 1st (month) of the displayed period
  const [anchor, setAnchor] = useState<Date>(() => getMonday(new Date()));

  const today = useMemo(() => new Date(), []);

  /* ---- derived week dates ---- */
  const weekMonday = useMemo(() => (view === "week" ? anchor : getMonday(anchor)), [anchor, view]);
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [weekMonday]);

  /* ---- derived month grid ---- */
  const monthGrid = useMemo(() => {
    if (view !== "month") return [];
    const first = getFirstOfMonth(anchor);
    const year = first.getFullYear();
    const month = first.getMonth();
    // day-of-week of the 1st (Mon=0 … Sun=6)
    const startDow = (first.getDay() + 6) % 7;
    // total days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    // leading blanks
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    // trailing blanks to fill last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [anchor, view]);

  /* ---- navigation ---- */
  const notifyRange = useCallback(
    (start: Date, end: Date) => {
      onRangeChange?.(start, end);
    },
    [onRangeChange],
  );

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setAnchor((prev) => {
        let next: Date;
        if (view === "week") {
          next = new Date(prev);
          next.setDate(prev.getDate() + direction * 7);
        } else {
          next = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
        }
        // Compute range for the new anchor
        if (view === "week") {
          const monday = getMonday(next);
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          setTimeout(() => notifyRange(monday, sunday), 0);
        } else {
          const first = getFirstOfMonth(next);
          const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59, 59, 999);
          setTimeout(() => notifyRange(first, last), 0);
        }
        return next;
      });
    },
    [view, notifyRange],
  );

  const switchView = useCallback(
    (newView: "week" | "month") => {
      if (newView === view) return;
      setView(newView);
      if (newView === "week") {
        const monday = getMonday(anchor);
        setAnchor(monday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        notifyRange(monday, sunday);
      } else {
        const first = getFirstOfMonth(anchor);
        setAnchor(first);
        const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 23, 59, 59, 999);
        notifyRange(first, last);
      }
    },
    [view, anchor, notifyRange],
  );

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncClick();
    } finally {
      setSyncing(false);
    }
  };

  /* ---- header label ---- */
  const headerLabel = view === "week" ? weekRangeLabel(weekMonday) : monthLabel(anchor);

  /* ---- meetings grouped by ISO date for month view ---- */
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach((m) => {
      // Compute the actual date from weekMonday + dayIndex
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + m.dayIndex);
      const key = m.dateISO ?? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [meetings, weekMonday]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <h2 className="text-lg font-bold tracking-[0.1em] text-foreground">CALENDAR</h2>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex overflow-hidden rounded-lg border border-border bg-muted">
            <button
              onClick={() => switchView("week")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "week"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              week
            </button>
            <button
              onClick={() => switchView("month")}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold transition-all duration-300",
                view === "month"
                  ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.4)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[160px] text-center text-sm font-semibold text-foreground">
              {headerLabel}
            </span>
            <button
              onClick={() => navigate(1)}
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
            {syncing ? "Syncing…" : "Sync Calendar"}
          </button>
        </div>
      </div>

      {/* ===================== WEEK VIEW ===================== */}
      {view === "week" && (
        <div className="flex flex-1 overflow-auto scrollbar-thin">
          {/* Time gutter */}
          <div className="w-20 flex-shrink-0 border-r border-border bg-muted/50 pt-16">
            {HOURS.map((h) => (
              <div key={h} className="relative h-16 border-b border-border/50 pr-2 text-right">
                <span className="absolute -top-2 right-2 text-xs font-normal text-muted-foreground">
                  {h === 0 ? "12:00 AM" : h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="grid flex-1 grid-cols-7">
            {weekDates.map((date, di) => {
              const isToday = isSameDay(date, today);
              return (
                <div key={di} className="border-r border-border last:border-r-0">
                  {/* Day header */}
                  <div
                    className={cn(
                      "sticky top-0 z-10 flex flex-col items-center justify-center border-b border-border bg-card px-2 py-2",
                      isToday && "bg-gradient-to-br from-forskale-green/8 to-forskale-teal/8",
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium uppercase tracking-wider",
                        isToday ? "text-forskale-teal" : "text-muted-foreground",
                      )}
                    >
                      {DAY_LABELS[di]}
                    </div>
                    <div
                      className={cn(
                        "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                        isToday
                          ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)] animate-[pulse-glow_2s_ease-in-out_infinite_alternate]"
                          : "text-foreground",
                      )}
                    >
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Hour slots */}
                  <div className="relative">
                    {HOURS.map((h) => (
                      <div key={h} className="h-16 border-b border-dashed border-border/50" />
                    ))}

                    {/* Meetings */}
                    {meetings
                      .filter((m) => m.dayIndex === di)
                      .map((meeting) => (
                        <button
                          key={meeting.id}
                          onClick={() => onMeetingClick(meeting)}
                          className={cn(
                            "absolute inset-x-1 z-20 overflow-hidden rounded-lg border-l-[3px] bg-muted/60 px-2 py-1.5 text-left transition-all duration-300",
                            getMeetingBorderColor(meeting.type),
                            selectedMeetingId === meeting.id
                              ? "shadow-lg ring-1 ring-forskale-teal/40 bg-muted"
                              : "hover:translate-x-0.5 hover:-translate-y-px hover:bg-muted hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                          )}
                          style={{
                            top: `${(meeting.startHour - HOURS[0]) * 64}px`,
                            height: `${meeting.duration * 64 - 4}px`,
                          }}
                        >
                          <p className="truncate text-xs font-semibold text-foreground">
                            {meeting.title.split("—")[0].trim()}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{meeting.time}</p>
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MONTH VIEW ===================== */}
      {view === "month" && (
        <div className="flex flex-1 flex-col overflow-auto scrollbar-thin">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-border bg-card">
            {DAY_LABELS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid flex-1 grid-cols-7 auto-rows-fr">
            {monthGrid.map((cell, idx) => {
              if (!cell) {
                return <div key={`blank-${idx}`} className="border-b border-r border-border/50 bg-muted/20" />;
              }
              const key = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, "0")}-${String(cell.getDate()).padStart(2, "0")}`;
              const dayMeetings = meetingsByDate.get(key) ?? [];
              const isToday = isSameDay(cell, today);

              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[80px] border-b border-r border-border/50 p-1",
                    isToday && "bg-gradient-to-br from-forskale-green/5 to-forskale-teal/5",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                      isToday
                        ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white"
                        : "text-foreground",
                    )}
                  >
                    {cell.getDate()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => onMeetingClick(m)}
                        className={cn(
                          "w-full truncate rounded border-l-2 px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors",
                          getMeetingBorderColor(m.type),
                          selectedMeetingId === m.id
                            ? "bg-forskale-teal/20 text-foreground"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {m.title.split("—")[0].trim()}
                      </button>
                    ))}
                    {dayMeetings.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{dayMeetings.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
