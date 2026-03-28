import { useEffect, useState, useCallback, useRef } from "react";
import { CalendarView, type Meeting } from "../components/mockflow-atlas/CalendarView";
import { ContactCard } from "../components/mockflow-atlas/ContactCard";
import { EnrichedProfileCard } from "../components/mockflow-atlas/EnrichedProfileCard";
import { RegistrationWizard } from "../components/mockflow-atlas/RegistrationWizard";
import { RecordingConsent } from "../components/mockflow-atlas/RecordingConsent";
import { CalendarRefreshPopup } from "../components/mockflow-atlas/CalendarRefreshPopup";
import { SalesAssistantBot } from "../components/mockflow-atlas/SalesAssistantBot";
import { toast } from "sonner";
import { calendarAPI, atlasAPI, vexaAPI, meetingsAPI, getVexaBotJoinErrorMessage, type GoogleCalendarEvent, type EnrichedProfileData, type MeetingPlatform } from "../lib/api";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mapEventsToMeetings(events: GoogleCalendarEvent[], rangeStart: Date): Meeting[] {
  const msPerDay = 24 * 60 * 60 * 1000;
  const monday = getMonday(rangeStart);
  return events
    .map((event) => {
      if (!event.id) return null;
      const start = event.start?.dateTime ? new Date(event.start.dateTime) : event.start?.date ? new Date(event.start.date) : null;
      const end = event.end?.dateTime ? new Date(event.end.dateTime) : event.end?.date ? new Date(event.end.date) : null;
      if (!start || !end) return null;
      const dayIndex = Math.min(6, Math.max(0, Math.floor((new Date(start.toDateString()).getTime() - monday.getTime()) / msPerDay)));
      const startHour = start.getHours() + start.getMinutes() / 60;
      const duration = (end.getTime() - start.getTime()) / (60 * 60 * 1000) || 1;
      const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const timeLabel = `${fmt(start)} - ${fmt(end)}`;
      const meetLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === "video")?.uri;
      const dateISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
      return { id: event.id, title: event.summary || "Untitled meeting", time: timeLabel, startHour, duration, dayIndex, dateISO, ...(meetLink ? { meetLink } : {}) } as Meeting;
    })
    .filter((m): m is Meeting => m !== null);
}

const AtlasCalendarPage = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRefreshTip, setShowRefreshTip] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [viewingProfile, setViewingProfile] = useState<EnrichedProfileData | null>(null);
  const rangeRef = useRef<{ start: Date; end: Date } | null>(null);

  const revalidateConnection = useCallback(async () => {
    try {
      const resp = await calendarAPI.getStatus();
      if (!(resp.data?.connected ?? false)) {
        setCalendarConnected(false);
        setShowRegistration(true);
      }
    } catch {
      setCalendarConnected(false);
      setShowRegistration(true);
    }
  }, []);

  const loadCalendarEvents = useCallback(async (start: Date, end: Date, force = false) => {
    if (!force && !calendarConnected) return;
    try {
      const response = await calendarAPI.getEvents({ time_min: start.toISOString(), time_max: end.toISOString() });
      const events = response.data?.events ?? [];
      if (events.length) await atlasAPI.syncCalendarEvents(events);
      const mapped = mapEventsToMeetings(events, start);
      setMeetings(mapped);
    } catch {
      await revalidateConnection();
    }
  }, [calendarConnected, revalidateConnection]);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await calendarAPI.getStatus();
        const connected = response.data?.connected ?? false;
        setCalendarConnected(connected);
        if (!connected) {
          setShowRegistration(true);
        } else {
          const monday = getMonday(new Date());
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          rangeRef.current = { start: monday, end: sunday };
          await loadCalendarEvents(monday, sunday, true);
          await revalidateConnection();
        }
      } catch {
        setShowRegistration(true);
      }
    };
    void init();
  }, [loadCalendarEvents, revalidateConnection]);

  const handleRangeChange = useCallback((start: Date, end: Date) => {
    rangeRef.current = { start, end };
    if (calendarConnected) void loadCalendarEvents(start, end);
  }, [calendarConnected, loadCalendarEvents]);

  const handleMeetingClick = (meeting: Meeting) => {
    setShowRefreshTip(false);
    setSelectedMeeting(meeting);
    setViewingProfile(null);
  };

  const handleSync = async () => {
    if (!calendarConnected) {
      toast.error("Please connect your Google Calendar first");
      setShowRegistration(true);
      return;
    }
    setShowRefreshTip(false);
    toast.loading("Syncing calendar...", { id: "sync" });
    try {
      const range = rangeRef.current;
      if (range) await loadCalendarEvents(range.start, range.end, true);
      toast.success("Calendar synced successfully", { id: "sync" });
    } catch {
      toast.error("Failed to sync calendar", { id: "sync" });
    }
  };

  const handleBotJoin = () => {
    if (!selectedMeeting?.meetLink) {
      toast.error("No Google Meet link found for this meeting");
      return;
    }
    setShowConsent(true);
  };

  const handleConsentAccept = async () => {
    setShowConsent(false);
    if (!selectedMeeting?.meetLink) { toast.error("No meeting link available"); return; }
    const meetId = selectedMeeting.meetLink.split("/").pop();
    if (!meetId) { toast.error("Could not extract meeting ID from link"); return; }
    try {
      toast.loading("Bot is joining the meeting…", { id: "bot-join" });
      await vexaAPI.joinGoogleMeet(meetId);
      toast.success("Bot joined the meeting successfully!", { id: "bot-join" });

      const meetingLink = selectedMeeting.meetLink;
      let meetingId: string | null = null;
      try {
        const byLinkRes = await meetingsAPI.getMeetingByLink(meetingLink);
        meetingId = byLinkRes.data?.id ?? null;
      } catch {
        try {
          const platform: MeetingPlatform = "google_meet";
          const createRes = await meetingsAPI.createMeeting({
            title: selectedMeeting.title,
            platform,
            link: meetingLink,
          });
          meetingId = (createRes.data as any)?.id ?? null;
        } catch {}
      }
      if (meetingId && selectedMeeting.id) {
        try {
          await meetingsAPI.linkCalendarEvent(meetingId, selectedMeeting.id, selectedMeeting.title);
        } catch {}
      }
    } catch (err) {
      toast.error(getVexaBotJoinErrorMessage(err), { id: "bot-join" });
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const response = await calendarAPI.getAuthUrl(window.location.origin);
      if (response.data?.url) window.location.href = response.data.url;
    } catch {
      toast.error("Failed to connect calendar");
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full relative">
      <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <CalendarView
            meetings={meetings}
            onMeetingClick={handleMeetingClick}
            selectedMeetingId={selectedMeeting?.id}
            onSyncClick={handleSync}
            onRangeChange={handleRangeChange}
          />
        </div>

        {showRefreshTip && (
          <CalendarRefreshPopup onDismissPermanent={() => setShowRefreshTip(false)} />
        )}
      </div>

      {selectedMeeting && (
        <div className="hidden md:flex md:flex-col md:h-full">
          <ContactCard
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onBotJoin={handleBotJoin}
            onViewProfile={(data) => setViewingProfile(data)}
          />
        </div>
      )}

      {selectedMeeting && viewingProfile && (
        <div className="hidden md:flex md:flex-col md:h-full">
          <EnrichedProfileCard
            data={viewingProfile}
            onClose={() => setViewingProfile(null)}
          />
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden overflow-y-auto">
          <ContactCard
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onBotJoin={handleBotJoin}
            onViewProfile={(data) => setViewingProfile(data)}
          />
        </div>
      )}

      {selectedMeeting && viewingProfile && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-card md:hidden overflow-y-auto">
          <EnrichedProfileCard
            data={viewingProfile}
            onClose={() => setViewingProfile(null)}
          />
        </div>
      )}

      <SalesAssistantBot />

      <RegistrationWizard
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onConnect={handleConnectCalendar}
      />
      <RecordingConsent
        open={showConsent}
        onAccept={handleConsentAccept}
        onLeave={() => setShowConsent(false)}
      />
    </div>
  );
};

export default AtlasCalendarPage;
