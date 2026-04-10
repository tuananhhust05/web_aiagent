import React from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { MeetingCall } from "@/types/meeting";
import { MeetingCard } from "./MeetingCard";
import { useT } from "@/i18n/LanguageContext";

interface PersonalisationCardProps {
  firstName: string;
  lastReadyMeeting?: { title: string; company: string } | null;
  lastReadyMeetingFull?: MeetingCall | null;
  onSelectMeeting?: (id: string) => void;
}

export function PersonalisationCard({
  firstName,
  lastReadyMeeting = null,
  lastReadyMeetingFull = null,
  onSelectMeeting,
}: PersonalisationCardProps) {
  const t = useT();

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      {/* Last meeting ready line + mini card */}
      {lastReadyMeeting && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-[hsl(var(--forskale-teal)/0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-foreground leading-snug">
                {t('personalisation.lastReady')},{' '}
                <span className="font-semibold text-[hsl(var(--forskale-teal))]">{firstName}</span>
              </p>
            </div>
          </div>
          {lastReadyMeetingFull && (
            <div className="ml-10">
              <MeetingCard
                meeting={lastReadyMeetingFull}
                isSelected={false}
                onClick={() => onSelectMeeting?.(lastReadyMeetingFull.id)}
              />
            </div>
          )}
        </div>
      )}

      {/* All clear state */}
      {!lastReadyMeeting && (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[hsl(var(--forskale-green)/0.1)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
          </div>
          <p className="text-[13px] text-foreground">
            {t('personalisation.allClear')},{' '}
            <span className="font-semibold text-[hsl(var(--forskale-green))]">{firstName}</span>
          </p>
        </div>
      )}
    </div>
  );
}
