import { cn } from "@/lib/utils";
import type { InterestJourneyPoint } from "@/data/mockStrategyData";
import { getStageBgColor, getStageTextColor } from "@/lib/stageColors";
import { useLanguage } from '@/components/strategy/LanguageContext';

interface Props {
  journey: InterestJourneyPoint[];
  companyName: string;
  interestVelocity: number;
  daysAtCurrentLevel: number;
}

export default function InterestJourney({ journey, companyName }: Props) {
  const { t } = useLanguage();
  if (journey.length === 0) return null;

  const maxParticipants = Math.max(...journey.map(p => p.participants?.length ?? 0));

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">{companyName} {t('journey.title')}</h2>
      </div>

      <div className="relative">
        <div className="absolute top-3.5 left-4 right-4 h-px bg-border" />
        <div className="flex justify-between relative gap-2">
          {journey.map((point, idx) => {
            const ordinal = `${idx + 1}${['ST','ND','RD'][idx] || 'TH'} MEETING`;
            const isLast = idx === journey.length - 1;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 relative min-w-0">
                {/* Circle on timeline */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 border-card",
                  getStageBgColor(point.interestLevel),
                )}>
                  <span className="text-[7px] font-bold text-white">{point.interestLevel}%</span>
                </div>

                {/* Aligned content rows */}
                <div className={cn(
                  "mt-2 px-1.5 py-2 rounded-md w-full flex flex-col items-center text-center",
                  isLast && "bg-[hsl(var(--forskale-teal)/0.05)] border border-[hsl(var(--forskale-teal)/0.2)]",
                )}>
                  {/* Row: ordinal */}
                  <p className={cn("text-[8px] font-bold tracking-wider", getStageTextColor(point.interestLevel))}>
                    {ordinal}
                  </p>
                
                  {/* Row: date (aligned across all) */}
                  <p className="text-[8px] text-muted-foreground mt-1 min-h-[12px]">{point.date}</p>
                  {/* Row: meeting title (aligned across all) */}
                  <p className="text-[9px] text-foreground font-medium mt-1.5 leading-snug min-h-[28px] flex items-center justify-center">
                    {point.meetingTitle ?? ''}
                  </p>
                  {/* Row: stakeholders (aligned across all, reserved height) */}
                  <div className="mt-1.5 flex flex-col gap-0.5 w-full" style={{ minHeight: maxParticipants * 14 }}>
                    {point.participants?.map((p, i) => (
                      <p key={i} className="text-[8px] text-muted-foreground italic leading-snug">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

