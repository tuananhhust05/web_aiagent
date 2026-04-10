import { useState, useMemo, useEffect } from 'react';
import { format, parseISO, subDays, startOfMonth } from 'date-fns';

import { MOCK_MEETINGS } from '@/data/mockMeetings';
import {
  groupMeetingsByDate,
  getUniqueCompanies,
  buildCompanyTimelines,
} from '@/lib/meetingUtils';
import type { MeetingCall, DateGroup } from '@/types/meeting';

import { PersonalisationCard } from '@/components/meetInsight/PersonalisationCard';
import { BrowseNav, type BrowseMode } from '@/components/meetInsight/BrowseNav';
import { DateGroupAccordion } from '@/components/meetInsight/DateGroupAccordion';
import { CompanyTimeline } from '@/components/meetInsight/CompanyTimeline';

interface MeetingInsightDashboardProps {
  onSelectMeeting: (id: string) => void;
  userName?: string;
  meetings?: MeetingCall[];
}

export function MeetingInsightDashboard({
  onSelectMeeting,
  userName = 'Andrea',
  meetings = MOCK_MEETINGS,
}: MeetingInsightDashboardProps) {
  const [browseMode, setBrowseMode] = useState<BrowseMode>('week');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [strategizedIds] = useState<Set<string>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const mergedMeetings = useMemo(() =>
    meetings.map((m) => ({
      ...m,
      insightUnread: readIds.has(m.id) ? false : m.insightUnread,
      strategizeNotDone: strategizedIds.has(m.id) ? false : m.strategizeNotDone,
      freshInsight: m.freshInsight === true && !viewedIds.has(m.id),
    })),
    [meetings, readIds, strategizedIds, viewedIds]
  );

  const filteredMeetings = useMemo(() => {
    if (browseMode === 'all') return mergedMeetings;
    if (browseMode === 'unviewed') return mergedMeetings.filter(m => m.insightUnread === true);
    const now = new Date();
    const cutoff = browseMode === 'week' ? subDays(now, 7) : startOfMonth(now);
    return mergedMeetings.filter(m => new Date(m.date) >= cutoff);
  }, [mergedMeetings, browseMode]);

  const searchedMeetings = useMemo(() => {
    if (!searchQuery.trim()) return filteredMeetings;
    const q = searchQuery.toLowerCase();
    return filteredMeetings.filter(m => {
      const date = new Date(m.date);
      const monthName = date.toLocaleString('en', { month: 'long' }).toLowerCase();
      const dayLabel = format(date, 'MMM d, yyyy').toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        monthName.includes(q) ||
        dayLabel.includes(q) ||
        String(m.interestScore ?? '').includes(q)
      );
    });
  }, [filteredMeetings, searchQuery]);

  const companies = useMemo(() => getUniqueCompanies(mergedMeetings), [mergedMeetings]);

  const lastReadyMeeting = useMemo(() => {
    const ready = mergedMeetings
      .filter(m => m.freshInsight)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (ready.length === 0) return null;
    return { id: ready[0].id, title: ready[0].title, company: ready[0].company };
  }, [mergedMeetings]);

  const lastReadyMeetingFull = useMemo(() => {
    if (!lastReadyMeeting) return null;
    return mergedMeetings.find(m => m.id === lastReadyMeeting.id) ?? null;
  }, [lastReadyMeeting, mergedMeetings]);

  const unreviewedCount = useMemo(
    () => mergedMeetings.filter(m => m.insightUnread).length,
    [mergedMeetings]
  );

  const [groups, setGroups] = useState<DateGroup[]>([]);

  useEffect(() => {
    const newGroups = groupMeetingsByDate(searchedMeetings);
    setGroups(newGroups);
  }, [searchedMeetings]);

  const groupsForRender = useMemo(
    () => searchQuery.trim()
      ? groups.map(g => ({ ...g, expanded: true }))
      : groups,
    [groups, searchQuery]
  );

  const companyTimeline = useMemo(() => {
    if (selectedCompany === 'all') return null;
    const companyMeetings = mergedMeetings
      .filter((m) => m.company === selectedCompany)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (companyMeetings.length === 0) return null;
    const timelines = buildCompanyTimelines(companyMeetings);
    if (timelines.length === 0 && companyMeetings.length > 0) {
      return {
        company: selectedCompany,
        meetings: companyMeetings,
        dateRange: companyMeetings.length === 1
          ? format(parseISO(companyMeetings[0].date), 'MMM d, yyyy')
          : `${format(parseISO(companyMeetings[0].date), 'MMM d, yyyy')} – ${format(parseISO(companyMeetings[companyMeetings.length - 1].date), 'MMM d, yyyy')}`,
      };
    }
    return timelines[0] ?? null;
  }, [mergedMeetings, selectedCompany]);

  function toggleGroup(dateKey: string) {
    setGroups(prev =>
      prev.map(g =>
        g.dateKey === dateKey ? { ...g, expanded: !g.expanded } : g
      )
    );
  }

  function handleSelectMeeting(id: string) {
    const meeting = mergedMeetings.find((m) => m.id === id);
    if (meeting?.insightUnread) {
      setReadIds((prev) => new Set(prev).add(id));
    }
    onSelectMeeting(id);
  }

  function handleMarkViewed(id: string) {
    setViewedIds(prev => new Set([...prev, id]));
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto atlas-scrollbar bg-background">
      <div className="w-full px-6 py-6 space-y-5">

        <PersonalisationCard
          firstName={userName}
          lastReadyMeeting={lastReadyMeeting}
          lastReadyMeetingFull={lastReadyMeetingFull}
          onSelectMeeting={handleSelectMeeting}
        />

        <BrowseNav
          browseMode={browseMode}
          onBrowseModeChange={setBrowseMode}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          companies={companies}
          meetings={mergedMeetings}
          onSearch={setSearchQuery}
          unreviewedCount={unreviewedCount}
        />

        {selectedCompany !== 'all' && companyTimeline && (
          <CompanyTimeline timeline={companyTimeline} onSelectMeeting={handleSelectMeeting} />
        )}

        {selectedCompany === 'all' && (
          <div className="space-y-2">
            {groupsForRender.map((group) => (
              <DateGroupAccordion
                key={group.dateKey}
                group={group}
                onToggle={() => toggleGroup(group.dateKey)}
                onSelectMeeting={handleSelectMeeting}
                onMarkViewed={handleMarkViewed}
              />
            ))}
            {groupsForRender.length === 0 && searchQuery.trim() !== '' && (
              <div className="text-center py-8 text-[13px] text-muted-foreground">
                No meetings found for "{searchQuery}"
              </div>
            )}
            {groupsForRender.length === 0 && searchQuery.trim() === '' && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No meetings found for this period.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
