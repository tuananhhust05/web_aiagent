import { useState, useEffect, useCallback } from 'react';
import { MEETING_DETAILS, type MeetingDetails } from '@/data/mockMeetingDetails';

const STORAGE_KEY = 'forskale-calendar-events';

export function useCalendarEvents() {
  const [details, setDetails] = useState<Record<string, MeetingDetails>>(MEETING_DETAILS);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge stored data over defaults (so new meetings aren't lost)
        setDetails({ ...MEETING_DETAILS, ...parsed });
      } catch {
        setDetails(MEETING_DETAILS);
      }
    }
  }, []);

  const toggleActionItem = useCallback((meetingId: string, actionItemId: string) => {
    setDetails(prev => {
      const meeting = prev[meetingId];
      if (!meeting) return prev;
      const updated = {
        ...prev,
        [meetingId]: {
          ...meeting,
          actionItems: meeting.actionItems.map(item =>
            item.id === actionItemId ? { ...item, completed: !item.completed } : item
          ),
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markComplete = useCallback((meetingId: string) => {
    setDetails(prev => {
      const meeting = prev[meetingId];
      if (!meeting) return prev;
      const updated = {
        ...prev,
        [meetingId]: { ...meeting, status: 'completed' as const },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateNotes = useCallback((meetingId: string, notes: string) => {
    setDetails(prev => {
      const meeting = prev[meetingId];
      if (!meeting) return prev;
      const updated = {
        ...prev,
        [meetingId]: { ...meeting, notes },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getDetails = useCallback((meetingId: string): MeetingDetails | null => {
    return details[meetingId] ?? null;
  }, [details]);

  return { details, getDetails, toggleActionItem, markComplete, updateNotes };
}
