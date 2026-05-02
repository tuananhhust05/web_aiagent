import { cn } from "@/lib/utils";
import { VELOCITY_DOT_CLASSES } from "@/lib/meetingSequence";

interface Meeting {
  id: string;
  title: string;
  time: string;
  startHour: number;
  duration: number;
  dayIndex: number;
  type?: "discovery" | "renewal" | "internal";
  hostEmail?: string;
  meetingNumber?: number;
  velocity?: "normal" | "stalled" | "fast";
  participantInitials?: string[];
}

const getMeetingBorderColor = (type?: string) => {
  switch (type) {
    case "discovery": return "border-l-forskale-teal";
    case "renewal": return "border-l-forskale-green";
    case "internal": return "border-l-cal-cyan";
    default: return "border-l-forskale-teal";
  }
};

interface WeekViewEventProps {
  meeting: Meeting;
  isSelected: boolean;
  onClick: (meeting: Meeting) => void;
  slotPx: number;
}

export function WeekViewEvent({ meeting, isSelected, onClick, slotPx }: WeekViewEventProps) {
  const meetingNumber = meeting.meetingNumber ?? 1;
  const velocity = meeting.velocity ?? "normal";
  const eventHeightPx = Math.round(slotPx * 0.45);

  return (
    <button
      onClick={() => onClick(meeting)}
      className={cn(
        "absolute inset-x-1 z-20 overflow-hidden rounded-lg border-l-[3px] bg-muted/60 px-2 text-left transition-all duration-300",
        "py-1.5",
        getMeetingBorderColor(meeting.type),
        isSelected
          ? "shadow-lg ring-1 ring-forskale-teal/40 bg-muted"
          : "hover:translate-x-0.5 hover:-translate-y-px hover:bg-muted hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      )}
      style={{
        top: `${meeting.startHour * slotPx}px`,
        height: `${eventHeightPx}px`,
      }}
    >
      <>
        {meeting.type !== "internal" && (
          <div className="absolute right-2 top-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[10px] font-semibold",
                meetingNumber === 1
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : "bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/20"
              )}
            >
              {meetingNumber}
            </span>
          </div>
        )}

        <p className="truncate text-xs font-semibold text-foreground pr-10">{meeting.title.split("—")[0].trim()}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{meeting.time}</p>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
          {(() => {
            const participants = meeting.participantInitials || [];
            if (participants.length === 0) return null;
            const first = participants[0];
            return (
              <div className="flex -space-x-1.5">
                <div className="h-5 w-5 rounded-full bg-primary/15 border-2 border-card flex items-center justify-center">
                  <span className="text-[7px] font-bold text-primary">{first}</span>
                </div>
                {participants.length > 1 && (
                  <div className="h-5 w-5 rounded-full bg-forskale-teal border-2 border-card flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">+{participants.length - 1}</span>
                  </div>
                )}
              </div>
            );
          })()}
          {meeting.type !== "internal" && (
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full ring-2 ring-card",
                VELOCITY_DOT_CLASSES[velocity]
              )}
            />
          )}
        </div>
      </>
    </button>
  );
}
