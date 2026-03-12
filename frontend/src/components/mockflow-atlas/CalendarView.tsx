import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

export interface Meeting {
  id: string;
  title: string;
  time: string;
  startHour: number;
  duration: number;
  dayIndex: number;
  type?: "discovery" | "renewal" | "internal";
  /** Google Meet link (hangoutLink or conferenceData entry) */
  meetLink?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [2, 3, 4, 5, 6, 7, 8];
// Show full 24h day (00:00–23:00)
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

interface CalendarViewProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
  selectedMeetingId?: string;
  onSyncClick: () => void;
}

export function CalendarView({
  meetings,
  onMeetingClick,
  selectedMeetingId,
  onSyncClick,
}: CalendarViewProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncClick();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <h2 className="text-lg font-bold tracking-[0.1em] text-foreground">CALENDAR</h2>
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
              week
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
              month
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[120px] text-center text-sm font-semibold text-foreground">Mar 2 – 8, 2026</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-forskale-teal transition-all hover:border-forskale-teal hover:bg-muted hover:shadow-[0_0_12px_hsl(var(--forskale-teal)/0.3)]">
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

      {/* Grid */}
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
          {DAYS.map((day, di) => (
            <div key={day} className="border-r border-border last:border-r-0">
              {/* Day header */}
              <div className={cn(
                "sticky top-0 z-10 flex flex-col items-center justify-center border-b border-border bg-card px-2 py-2",
                di === 1 && "bg-gradient-to-br from-forskale-green/8 to-forskale-teal/8"
              )}>
                <div className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  di === 1 ? "text-forskale-teal" : "text-muted-foreground"
                )}>{day}</div>
                <div className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                  di === 1
                    ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_16px_hsl(var(--forskale-green)/0.5)] animate-[pulse-glow_2s_ease-in-out_infinite_alternate]"
                    : "text-foreground"
                )}>
                  {DATES[di]}
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
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {meeting.time}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
