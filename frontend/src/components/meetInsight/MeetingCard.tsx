import { Mic, Link2, Briefcase, Check, X } from 'lucide-react';
import type { MeetingCall } from '@/types/meeting';
import { meetingInitials, avatarColors, STATUS_COLORS, getCognitiveState, isWon, isLost } from '@/lib/meetingUtils';
import { useT } from '@/components/meetInsight/LanguageContext';

interface Props {
  meeting: MeetingCall;
  isSelected: boolean;
  onClick: () => void;
}

export function MeetingCard({ meeting: m, isSelected, onClick }: Props) {
  const t = useT();
  const cogState   = getCognitiveState(m.interestScore);
  const statusColor = STATUS_COLORS[m.evalStatus] ?? STATUS_COLORS['Pending'];
  const avatar      = avatarColors(m.company);
  const lost        = isLost(m.interestScore);

  const SourceIcon =
    m.sourceType === 'Call' ? Mic :
    m.sourceType === 'CRM'  ? Briefcase :
                               Link2;

  const sourceIconColor =
    m.sourceType === 'Call' ? 'text-[hsl(var(--forskale-green))]' :
    m.sourceType === 'CRM'  ? 'text-[hsl(var(--forskale-blue))]' :
                               'text-purple-400';

  return (
    <div
      onClick={onClick}
      className={[
        'w-full relative flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all border cursor-pointer',
        isSelected
          ? 'border-[hsl(var(--forskale-teal)/0.4)] shadow-md'
          : 'hover:shadow-sm',
        lost ? 'opacity-60' : '',
      ].join(' ')}
      style={{
        backgroundColor: `${cogState.color}08`,
        borderColor: isSelected ? undefined : `${cogState.color}18`,
      }}
    >
      {/* Left: avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold ${avatar.bg} ${avatar.text}`}>
        {meetingInitials(m.title)}
      </div>

      {/* Middle: info */}
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-semibold truncate ${lost ? 'text-muted-foreground' : 'text-foreground'}`}>
          {m.title}
        </div>

        {/* Row 2: cognitive badge + range + source + duration */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className="inline-flex items-center gap-0.5 rounded-full text-[10px] h-4 px-1.5 font-semibold border"
            style={{
              backgroundColor: `${cogState.color}15`,
              color: cogState.color,
              borderColor: `${cogState.color}4D`,
            }}
          >
            {isWon(m.interestScore) && <Check className="h-2.5 w-2.5" />}
            {isLost(m.interestScore) && <X className="h-2.5 w-2.5" />}
            {cogState.label}
          </span>
          <span className="text-[10px] text-muted-foreground">{cogState.range}</span>
          <SourceIcon className={`h-3 w-3 ${sourceIconColor}`} />
          <span className="text-[11px] text-muted-foreground tabular-nums">{m.duration}</span>
        </div>

        {/* Row 3: company + actions + alerts */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[11px] ${lost ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{m.company}</span>

          {m.actionCount > 0 && (
            <span className="text-[11px] text-[hsl(var(--forskale-teal))] font-medium">
              {m.actionCount} action{m.actionCount !== 1 ? 's' : ''}
            </span>
          )}

          {m.strategizeNotDone && (
            <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Strategize
            </span>
          )}
          {m.insightUnread && (
            <span className="flex items-center gap-0.5 text-[11px] text-destructive">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
              Unread Insight
            </span>
          )}
        </div>

        {/* Interest progress bar */}
        <div className="mt-2">
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${m.interestScore ?? 0}%`,
                backgroundColor: cogState.color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Right side: NEW badge + eval badge + CTA button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-end gap-1.5">
          {m.freshInsight && (
            <span className="text-[9px] font-bold bg-[hsl(var(--forskale-teal))] text-white px-1.5 py-0.5 rounded-full leading-none">
              NEW
            </span>
          )}
          <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
            {m.evalStatus}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{ background: 'linear-gradient(135deg, hsl(var(--forskale-green)), hsl(var(--forskale-teal)), hsl(var(--forskale-blue)))' }}
        >
          {t('card.findOutMore')}
        </button>
      </div>
    </div>
  );
}
