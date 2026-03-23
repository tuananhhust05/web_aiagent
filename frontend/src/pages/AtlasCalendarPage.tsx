import { useEffect, useState, useCallback, useRef } from "react";
import { CalendarView, type Meeting } from "../components/mockflow-atlas/CalendarView";
import { ContactCard } from "../components/mockflow-atlas/ContactCard";
import { RegistrationWizard } from "../components/mockflow-atlas/RegistrationWizard";
import { RecordingConsent } from "../components/mockflow-atlas/RecordingConsent";
import { CalendarRefreshPopup } from "../components/mockflow-atlas/CalendarRefreshPopup";
import toast from "react-hot-toast";
import { calendarAPI, atlasAPI, vexaAPI, getVexaBotJoinErrorMessage, type GoogleCalendarEvent } from "../lib/api";

const AtlasCalendarPage = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRefreshTip, setShowRefreshTip] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Track the currently displayed range so we can reload on navigation
  const rangeRef = useRef<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    checkCalendarConnection();
  }, []);

  const checkCalendarConnection = async () => {
    try {
      const response = await calendarAPI.getStatus();
      const connected = response.data?.connected ?? false;
      setCalendarConnected(connected);

      if (!connected) {
        setShowRegistration(true);
      } else {
        // Load events for the default week (CalendarView starts on current week's Monday)
        const monday = getMonday(new Date());
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        rangeRef.current = { start: monday, end: sunday };
        await loadCalendarEvents(monday, sunday, true);
        await revalidateConnectionStatus();
      }
    } catch (error) {
      console.error("Failed to check calendar connection:", error);
      setShowRegistration(true);
    }
  };

  const revalidateConnectionStatus = async () => {
    try {
      const resp = await calendarAPI.getStatus();
      const stillConnected = resp.data?.connected ?? false;
      if (!stillConnected) {
        setCalendarConnected(false);
        setShowRegistration(true);
      }
    } catch {
      setCalendarConnected(false);
      setShowRegistration(true);
    }
  };

  /** Return the Monday 00:00 of the week containing `date`. */
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun … 6=Sat
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const mapEventsToMeetings = (
    events: GoogleCalendarEvent[],
    rangeStart: Date,
  ): Meeting[] => {
    const msPerDay = 24 * 60 * 60 * 1000;
    const monday = getMonday(rangeStart);

    return events
      .map((event) => {
        if (!event.id) return null;

        let start: Date | null = null;
        let end: Date | null = null;

        if (event.start?.dateTime) {
          start = new Date(event.start.dateTime);
        } else if (event.start?.date) {
          start = new Date(event.start.date);
        }

        if (event.end?.dateTime) {
          end = new Date(event.end.dateTime);
        } else if (event.end?.date) {
          end = new Date(event.end.date);
        }

        if (!start || !end) return null;

        const dayIndex = Math.min(
          6,
          Math.max(
            0,
            Math.floor(
              (new Date(start.toDateString()).getTime() - monday.getTime()) /
                msPerDay,
            ),
          ),
        );

        const startHour = start.getHours() + start.getMinutes() / 60;
        const duration =
          (end.getTime() - start.getTime()) / (60 * 60 * 1000) || 1;

        const timeLabel = (() => {
          const format = (d: Date) =>
            d.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
          return `${format(start!)} - ${format(end!)}`;
        })();

        const meetLink =
          event.hangoutLink ||
          event.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === "video",
          )?.uri ||
          undefined;

        // ISO date key for month-view grouping
        const dateISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

        return {
          id: event.id,
          title: event.summary || "Untitled meeting",
          time: timeLabel,
          startHour,
          duration,
          dayIndex,
          dateISO,
          ...(meetLink ? { meetLink } : {}),
        } as Meeting;
      })
      .filter((m): m is Meeting => m !== null);
  };

  const loadCalendarEvents = async (start: Date, end: Date, force = false) => {
    if (!force && !calendarConnected) return;
    try {
      const response = await calendarAPI.getEvents({
        time_min: start.toISOString(),
        time_max: end.toISOString(),
      });
      const events = response.data?.events ?? [];

      // Persist events for meeting enrichment & history
      if (events.length) {
        await atlasAPI.syncCalendarEvents(events);
      }

      const mapped = mapEventsToMeetings(events, start);

      if (mapped.length === 0) {
        console.warn(
          "[AtlasCalendar] No meetings mapped from Google events for the displayed range.",
        );
        // Clear meetings when navigating to a range with no events
        setMeetings([]);
      } else {
        setMeetings(mapped);
      }
    } catch (error) {
      console.error("Failed to load calendar events:", error);
      await revalidateConnectionStatus();
    }
  };

  /** Called by CalendarView when the user navigates or switches view */
  const handleRangeChange = useCallback(
    (start: Date, end: Date) => {
      rangeRef.current = { start, end };
      if (calendarConnected) {
        loadCalendarEvents(start, end);
      }
    },
    [calendarConnected],
  );

  const handleMeetingClick = (meeting: Meeting) => {
    setShowRefreshTip(false);
    setSelectedMeeting(meeting);
  };

  const handleSync = async () => {
    if (!calendarConnected) {
      toast.error("Please connect your Google Calendar first");
      setShowRegistration(true);
      return;
    }

    setShowRefreshTip(false);

    try {
      toast.loading("Syncing calendar...", { id: "sync" });
      const range = rangeRef.current;
      if (range) {
        await loadCalendarEvents(range.start, range.end);
      }
      toast.success("Calendar synced successfully", { id: "sync" });
    } catch (error) {
      console.error("Sync failed:", error);
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
    if (!selectedMeeting?.meetLink) {
      toast.error("No meeting link available");
      return;
    }

    const meetId = selectedMeeting.meetLink.split("/").pop();
    if (!meetId) {
      toast.error("Could not extract meeting ID from link");
      return;
    }

    try {
      toast.loading("Bot is joining the meeting…", { id: "bot-join" });
      await vexaAPI.joinGoogleMeet(meetId);
      toast.success("Bot joined the meeting successfully!", { id: "bot-join" });
    } catch (err) {
      const message = getVexaBotJoinErrorMessage(err);
      toast.error(message, { id: "bot-join" });
    }
  };

  const handleConsentDecline = () => {
    setShowConsent(false);
  };

  const handleConnectCalendar = async () => {
    try {
      const origin = window.location.origin;
      const response = await calendarAPI.getAuthUrl(origin);

      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Failed to get calendar auth URL:", error);
      toast.error("Failed to connect calendar");
    }
  };

  return (
    <>
      <div className="flex flex-1 overflow-hidden h-full relative">
        <div className="relative flex flex-1 flex-col min-w-0 overflow-hidden pl-0 lg:pl-0">
          {/* Add top padding on mobile for hamburger button */}
          <div className="flex flex-1 flex-col pt-12 lg:pt-0 overflow-hidden">
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

        {/* Desktop: sidebar panel */}
        {selectedMeeting && (
          <div className="hidden md:flex md:flex-col md:h-full">
            <ContactCard
              meeting={selectedMeeting}
              onClose={() => setSelectedMeeting(null)}
              onBotJoin={handleBotJoin}
            />
          </div>
        )}

        {/* Mobile: full-screen overlay */}
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden overflow-y-auto">
            <ContactCard
              meeting={selectedMeeting}
              onClose={() => setSelectedMeeting(null)}
              onBotJoin={handleBotJoin}
            />
          </div>
        )}
      </div>

      <RegistrationWizard
        open={showRegistration}
        onClose={() => setShowRegistration(false)}
        onConnect={handleConnectCalendar}
      />
      <RecordingConsent
        open={showConsent}
        onAccept={handleConsentAccept}
        onLeave={handleConsentDecline}
      />
    </>
  );
};

export default AtlasCalendarPage;
