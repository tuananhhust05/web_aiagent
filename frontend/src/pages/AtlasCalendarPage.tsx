import { useEffect, useState, useCallback, useRef } from "react";
import { CalendarView, type Meeting } from "../components/mockflow-atlas/CalendarView";
import { ContactCard } from "../components/mockflow-atlas/ContactCard";
import { RegistrationWizard } from "../components/mockflow-atlas/RegistrationWizard";
import { RecordingConsent } from "../components/mockflow-atlas/RecordingConsent";
import { CalendarRefreshPopup } from "../components/mockflow-atlas/CalendarRefreshPopup";
import { toast } from "sonner";
import { calendarAPI, atlasAPI, vexaAPI, meetingsAPI, getVexaBotJoinErrorMessage, type GoogleCalendarEvent, type MeetingPlatform } from "../lib/api";

const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

function isPersonalEmail(email: string): boolean {
  const parts = (email || "").trim().toLowerCase().split("@");
  if (parts.length !== 2) return true;
  return PERSONAL_DOMAINS.has(parts[1]);
}

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

  const parsed = events
    .map((event) => {
      if (!event.id) return null;
      const start = event.start?.dateTime
        ? new Date(event.start.dateTime)
        : event.start?.date
          ? new Date(`${event.start.date}T00:00:00`)
          : null;
      const end = event.end?.dateTime
        ? new Date(event.end.dateTime)
        : event.end?.date
          ? new Date(`${event.end.date}T00:00:00`)
          : null;
      if (!start || !end) return null;

      const companyKey = (event.summary || "Untitled meeting").split("—")[0].trim().toLowerCase();
      const participantInitials = (event.attendees || [])
        .filter((a) => !a.self)
        .map((a) => {
          const source = (a.displayName || a.email || "").trim();
          if (!source) return "";
          const tokens = source
            .replace(/@.*/, "")
            .split(/[\s._-]+/)
            .filter(Boolean);
          const initials = tokens.slice(0, 2).map((t) => t[0]?.toUpperCase() || "").join("");
          return initials || source.slice(0, 2).toUpperCase();
        })
        .filter(Boolean);

      const attendeeEmails = (event.attendees || [])
        .filter((a) => !a.self)
        .map((a) => (a.email || "").trim().toLowerCase())
        .filter(Boolean);
      const business = attendeeEmails.find((e) => !isPersonalEmail(e));
      const hostEmail: string | undefined = business || attendeeEmails[0] || undefined;

      return { event, start, end, companyKey, participantInitials, hostEmail };
    })
    .filter(
      (v): v is { event: GoogleCalendarEvent; start: Date; end: Date; companyKey: string; participantInitials: string[]; hostEmail: string | undefined } =>
        v !== null,
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const sequenceByCompany: Record<string, number> = {};

  return parsed.map(({ event, start, end, companyKey, participantInitials, hostEmail }) => {
    const dayIndex = Math.floor((new Date(start.toDateString()).getTime() - monday.getTime()) / msPerDay);
    const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
    const startHour = isAllDay ? 0 : start.getHours() + start.getMinutes() / 60;

    const rawDuration = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
    const crossesDay = start.toDateString() !== end.toDateString();
    const daySpan = Math.max(0, Math.round((new Date(end.toDateString()).getTime() - new Date(start.toDateString()).getTime()) / msPerDay));
    const endOfDay = (() => {
      const d = new Date(start);
      d.setHours(23, 59, 59, 999);
      return d;
    })();

    const duration = (() => {
      if (isAllDay) return 0.75;
      if (!Number.isFinite(rawDuration) || rawDuration <= 0) return 1;
      if (!crossesDay) return rawDuration;
      const capped = (endOfDay.getTime() - start.getTime()) / (60 * 60 * 1000);
      return Math.max(0.25, capped);
    })();

    const timeLabel = isAllDay ? "All day" : crossesDay ? `${fmt(start)} - ${fmt(endOfDay)} (+${daySpan}d)` : `${fmt(start)} - ${fmt(end)}`;
    const meetLink =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((ep: { entryPointType?: string; uri?: string }) => ep.entryPointType === "video")?.uri;
    const dateISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

    const nextSequence = (sequenceByCompany[companyKey] || 0) + 1;
    sequenceByCompany[companyKey] = nextSequence;

    return {
      id: event.id!,
      title: event.summary || "Untitled meeting",
      time: timeLabel,
      startHour,
      duration,
      dayIndex,
      dateISO,
      hostEmail,
      meetingNumber: nextSequence,
      velocity: nextSequence >= 4 ? "stalled" : "normal",
      participantInitials,
      ...(meetLink ? { meetLink } : {}),
    } as Meeting;
  });
}

const AtlasCalendarPage = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRefreshTip, setShowRefreshTip] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const rangeRef = useRef<{ start: Date; end: Date } | null>(null);
  const syncingRef = useRef(false);
  const syncedResetTimerRef = useRef<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">("idle");

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
      const hostEmails = Array.from(new Set(mapped.map((m) => (m.hostEmail || "").trim().toLowerCase()).filter(Boolean)));
      if (!hostEmails.length) {
        setMeetings(mapped);
        return;
      }
      try {
        const countsResp = await atlasAPI.getMeetingHistoryCounts(hostEmails);
        const counts = countsResp.data?.counts || {};
        setMeetings(
          mapped.map((m) => {
            const he = (m.hostEmail || "").trim().toLowerCase();
            const count = he ? (counts[he] ?? 1) : 1;
            return { ...m, meetingNumber: count };
          }),
        );
      } catch {
        setMeetings(mapped);
      }
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
  };

  const handleSync = useCallback(async () => {
    if (syncingRef.current) return;
    if (!calendarConnected) {
      toast.error("Please connect your Google Calendar first");
      setShowRegistration(true);
      return;
    }

    setShowRefreshTip(false);
    syncingRef.current = true;
    setSyncStatus("syncing");

    try {
      const range = rangeRef.current;
      const params = range
        ? { time_min: range.start.toISOString(), time_max: range.end.toISOString() }
        : undefined;

      await calendarAPI.sync(params);
      if (range) {
        await loadCalendarEvents(range.start, range.end, true);
      }

      setSyncStatus("synced");
      if (syncedResetTimerRef.current) {
        window.clearTimeout(syncedResetTimerRef.current);
      }
      syncedResetTimerRef.current = window.setTimeout(() => {
        setSyncStatus("idle");
      }, 3000);
    } catch {
      setSyncStatus("idle");
      toast.error("Failed to sync calendar");
    } finally {
      syncingRef.current = false;
    }
  }, [calendarConnected, loadCalendarEvents]);

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

  useEffect(() => {
    if (!calendarConnected) return;

    const intervalId = window.setInterval(() => {
      void handleSync();
    }, 10_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [calendarConnected, handleSync]);

  useEffect(() => {
    return () => {
      if (syncedResetTimerRef.current) {
        window.clearTimeout(syncedResetTimerRef.current);
      }
    };
  }, []);

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
            syncStatus={syncStatus}
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
          />
        </div>
      )}

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden overflow-y-auto">
          <ContactCard
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onBotJoin={handleBotJoin}
          />
        </div>
      )}

      {/* <SalesAssistantBot /> */}

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
