import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import type { CompanyTimeline as CompanyTimelineType, MeetingCall } from '../../types/meeting';
import { STATUS_COLORS, getCognitiveState, isWon, isLost } from '../../lib/meetingUtils';

interface Props {
  timeline: CompanyTimelineType;
  onSelectMeeting: (id: string) => void;
}

export function CompanyTimeline({ timeline, onSelectMeeting }: Props) {
  const [offset, setOffset] = useState(0);
  const visible = 3;

  const canPrev = offset > 0;
  const canNext = offset + visible < timeline.meetings.length;

  const visibleMeetings = timeline.meetings.slice(offset, offset + visible);

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <span className="text-[15px] font-semibold text-foreground">{timeline.company}</span>
        <span className="text-[14px] text-muted-foreground">Meeting Timeline</span>
        <div className="flex items-center gap-3 ml-auto text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-green))]" /> Call
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--forskale-blue))]" /> CRM
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Both
          </span>
        </div>
      </div>

      {/* Timeline cards */}
      <div className="flex items-stretch">
        {visibleMeetings.map((m, idx) => (
          <React.Fragment key={m.id}>
            <TimelineCard meeting={m} onSelect={onSelectMeeting} />
            {idx < visibleMeetings.length - 1 && (
              <div className="flex items-center flex-shrink-0">
                <div className="w-6 flex items-center justify-center">
                  <svg width="24" height="2" viewBox="0 0 24 2" fill="none">
                    <line x1="0" y1="1" x2="24" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-border" />
                  </svg>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border/60">
        <span className="text-[12px] text-muted-foreground flex-1">{timeline.dateRange}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={!canPrev}
            className="h-6 w-6 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setOffset((o) => Math.min(timeline.meetings.length - visible, o + 1))}
            disabled={!canNext}
            className="h-6 w-6 rounded-md flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineCard({ meeting: m, onSelect }: { meeting: MeetingCall; onSelect: (id: string) => void }) {
  const cogState   = getCognitiveState(m.interestScore);
  const statusColor = STATUS_COLORS[m.evalStatus] ?? STATUS_COLORS['Pending'];
  const lost = isLost(m.interestScore);
  const won = isWon(m.interestScore);

  const sourceDotColor =
    m.sourceType === 'Call' ? 'bg-[hsl(var(--forskale-green))]' :
    m.sourceType === 'CRM'  ? 'bg-[hsl(var(--forskale-blue))]' :
                               'bg-purple-400';

  const sourceTextColor =
    m.sourceType === 'Call' ? 'text-[hsl(var(--forskale-green))]' :
    m.sourceType === 'CRM'  ? 'text-[hsl(var(--forskale-blue))]' :
                               'text-purple-400';

  const barWidth = lost ? 0 : (won ? 100 : (m.interestScore ?? 0));

  const bandBg = cogState.color === '#FBBF24' || cogState.color === '#F59E0B' || cogState.color === '#FB923C' || cogState.color === '#F97316'
    ? 'bg-[#FAEEDA] text-[#633806] border-[rgba(186,117,23,0.35)]'
    : cogState.color === '#22C55E' || cogState.color === '#16A34A'
    ? 'bg-[#EAF3DE] text-[#27500A] border-[rgba(59,109,17,0.35)]'
    : cogState.color === '#EF4444'
    ? 'bg-red-500/10 text-red-700 border-red-500/35'
    : 'bg-[#E1F5EE] text-[#085041] border-[rgba(15,110,86,0.35)]';

  return (
    <button
      onClick={() => onSelect(m.id)}
      className={[
        'flex-1 min-w-0 flex flex-col gap-2.5 p-4 text-left transition-colors border-r border-border/40 last:border-r-0',
        'hover:bg-accent/50 hover:shadow-sm',
        lost ? 'opacity-60' : '',
      ].join(' ')}
    >
      {/* Date */}
      <span className="text-[12px] text-muted-foreground tabular-nums">
        {format(parseISO(m.date), 'MMM d, yyyy')}
      </span>

      {/* Cognitive state band */}
      <div className={`inline-flex flex-col items-start rounded-lg border px-2.5 py-1 leading-tight self-start ${bandBg}`}>
        <span className="text-[12px] font-semibold">
          {won && <Check className="h-2.5 w-2.5 inline mr-0.5" />}
          {lost && <X className="h-2.5 w-2.5 inline mr-0.5" />}
          {cogState.label}
        </span>
        <span className="text-[11px] opacity-70">{cogState.range}</span>
      </div>

      {/* Title */}
      <span className={`text-[13px] font-semibold leading-tight line-clamp-2 ${lost ? 'text-muted-foreground' : 'text-foreground'}`}>
        {m.title}
      </span>

      {/* Source + eval */}
      <div className="flex items-center gap-2 mt-auto">
        <span className={`flex items-center gap-1 text-[12px] font-medium ${sourceTextColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sourceDotColor}`} />
          {m.sourceType}
        </span>
        <span className={`text-[12px] font-medium ${statusColor.text}`}>
          {m.evalStatus === 'Evaluated' ? '✓ Eval' : m.evalStatus}
        </span>
      </div>

      {/* Interest progress bar */}
      <div
        className={`h-[3px] rounded-full overflow-hidden ${lost ? '' : 'bg-border'}`}
        style={lost ? { backgroundColor: '#EF444433' } : undefined}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barWidth}%`,
            backgroundColor: cogState.color,
          }}
        />
      </div>
    </button>
  );
}
