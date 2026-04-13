import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import type { DateGroup } from '../../types/meeting';
import { buildCompanyTimelines } from '../../lib/meetingUtils';
import { MeetingCard }       from './MeetingCard';
import { CompanyTimeline }   from './CompanyTimeline';
import { useT } from '@/i18n/LanguageContext';

interface Props {
  group: DateGroup;
  onToggle: () => void;
  onSelectMeeting: (id: string) => void;
  onMarkViewed?: (id: string) => void;
}

export function DateGroupAccordion({ group, onToggle, onSelectMeeting, onMarkViewed }: Props) {
  const t = useT();
  const timelines = buildCompanyTimelines(group.meetings);

  // Translate "Today" / "Yesterday"
  const translatedLabel =
    group.label === 'Today' ? t('date.today')
    : group.label === 'Yesterday' ? t('date.yesterday')
    : group.label;

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card">
      {/* Header row */}
      <button
        onClick={() => {
          if (!group.expanded && group.freshInsightCount > 0) {
            group.meetings
              .filter(m => m.freshInsight)
              .forEach(m => onMarkViewed?.(m.id));
          }
          onToggle();
        }}
        className="sticky top-0 z-10 flex w-full items-center gap-2 bg-accent/60 px-3 py-2.5 transition-colors hover:bg-accent/80"
      >
        <div className={[
          'w-[3px] h-4 rounded-full flex-shrink-0',
          group.freshInsightCount > 0
            ? 'bg-[hsl(var(--forskale-teal))] animate-pulse'
            : 'bg-[hsl(var(--forskale-teal))]',
        ].join(' ')} />

        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-sm border border-border/50">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>

        <span className="text-[14px] font-bold text-foreground text-left tracking-tight">
          {translatedLabel}
        </span>
        <span className="w-5 h-5 rounded-full bg-[hsl(var(--forskale-teal))] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
          {group.meetings.length}
        </span>

        <span className="flex-1" />

        {group.freshInsightCount > 0 && (
          <span className="text-[11px] font-semibold bg-[hsl(var(--forskale-teal))] text-white px-1.5 py-0.5 rounded-full mr-1 leading-none">
            {group.freshInsightCount} {t('date.new')}
          </span>
        )}
      </button>

      {/* Collapsed body */}
      {!group.expanded && (
        <div className="flex items-center gap-3 px-4 py-2 text-[12px] text-muted-foreground">
          {[...new Set(group.meetings.map((m) => m.company))].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}

      {/* Expanded body */}
      {group.expanded && (
        <div className="divide-y divide-border/50">
          <div className="px-2 py-2 space-y-1.5">
            {group.meetings.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                isSelected={false}
                onClick={() => onSelectMeeting(m.id)}
              />
            ))}
          </div>

          {timelines.map((tl) => (
            <div key={tl.company} className="px-3 py-3">
              <CompanyTimeline timeline={tl} onSelectMeeting={onSelectMeeting} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
