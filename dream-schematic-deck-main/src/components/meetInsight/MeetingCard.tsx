import React from 'react';
import { Mic, Link2, Briefcase, Check, X } from 'lucide-react';
import type { MeetingCall } from '../../types/meeting';
import { companyInitials, avatarColors, STATUS_COLORS, getCognitiveState, isWon, isLost } from '../../lib/meetingUtils';

interface Props {
  meeting: MeetingCall;
  isSelected: boolean;
  onClick: () => void;
}

export function MeetingCard({ meeting: m, isSelected, onClick }: Props) {
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
    <button
      onClick={onClick}
      className={[
        'w-full relative flex flex-col px-3 py-2.5 rounded-lg text-left transition-all group',
        isSelected
          ? 'bg-[hsl(var(--forskale-teal)/0.06)] border border-[hsl(var(--forskale-teal)/0.3)] shadow-sm pl-4'
          : 'border border-transparent hover:bg-accent hover:border-border',
        lost ? 'opacity-60' : '',
      ].join(' ')}
    >
      {isSelected && (
        <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[hsl(var(--forskale-teal))]" />
      )}

      {/* Row 1: avatar + title + eval badge */}
      <div className="flex items-start gap-2">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${avatar.bg} ${avatar.text}`}>
          {companyInitials(m.company)}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-[12px] font-semibold truncate ${lost ? 'text-muted-foreground' : 'text-foreground'}`}>{m.title}</div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Cognitive state badge */}
            <span
              className="inline-flex items-center gap-0.5 rounded-full text-[8px] h-3.5 px-1 font-semibold border"
              style={{
                backgroundColor: `${cogState.color}15`,
                color: cogState.color,
                borderColor: `${cogState.color}4D`,
              }}
            >
              {isWon(m.interestScore) && <Check className="h-2 w-2" />}
              {isLost(m.interestScore) && <X className="h-2 w-2" />}
              {cogState.label}
            </span>
            <span className="text-[8px] text-muted-foreground">{cogState.range}</span>
            <SourceIcon className={`h-2.5 w-2.5 ${sourceIconColor}`} />
            <span className="text-[9px] text-muted-foreground tabular-nums">{m.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {m.freshInsight && (
            <span className="text-[8px] font-bold bg-[hsl(var(--forskale-teal))] text-white px-1.5 py-0.5 rounded-full leading-none">
              NEW
            </span>
          )}
          <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-semibold ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
            {m.evalStatus}
          </div>
        </div>
      </div>

      {/* Row 2: company + actions + alert dots + interest bar */}
      <div className="flex items-center gap-2 mt-1 pl-8 flex-wrap">
        <span className={`text-[9px] ${lost ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{m.company}</span>

        {m.actionCount > 0 && (
          <span className="text-[9px] text-[hsl(var(--forskale-teal))] font-medium">
            {m.actionCount} action{m.actionCount !== 1 ? 's' : ''}
          </span>
        )}

        {m.strategizeNotDone && (
          <span className="flex items-center gap-0.5 text-[9px] text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Strategize
          </span>
        )}
        {m.insightUnread && (
          <span className="flex items-center gap-0.5 text-[9px] text-destructive">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
            Unread insight
          </span>
        )}
      </div>

      {/* Interest progress bar */}
      <div className="mt-1.5 pl-8 pr-1">
        <div className="h-0.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${m.interestScore ?? 0}%`,
              backgroundColor: cogState.color,
            }}
          />
        </div>
      </div>
    </button>
  );
}
