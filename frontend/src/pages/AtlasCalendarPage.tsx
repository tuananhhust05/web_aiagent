import { useEffect, useState } from "react";
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
        await loadCalendarEvents(true);
        // After loading events, re-verify connection status.
        // The backend revokes the flag when the Google token is expired/invalid,
        // so a second status check catches stale "connected=true" from the first call.
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

  const getCurrentWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diffToMonday,
    );
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  };

  const mapEventsToMeetings = (
    events: GoogleCalendarEvent[],
    monday: Date,
  ): Meeting[] => {
    const msPerDay = 24 * 60 * 60 * 1000;

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
              (new Date(start.toDateString()).getTime() -
                monday.getTime()) /
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

        // Extract Google Meet link from hangoutLink or conferenceData
        const meetLink =
          event.hangoutLink ||
          event.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === "video",
          )?.uri ||
          undefined;

        return {
          id: event.id,
          title: event.summary || "Untitled meeting",
          time: timeLabel,
          startHour,
          duration,
          dayIndex,
          ...(meetLink ? { meetLink } : {}),
        } as Meeting;
      })
      .filter((m): m is Meeting => m !== null);
  };

  const loadCalendarEvents = async (force = false) => {
    if (!force && !calendarConnected) return;
    try {
      const { monday, sunday } = getCurrentWeekRange();
      const response = await calendarAPI.getEvents({
        time_min: monday.toISOString(),
        time_max: sunday.toISOString(),
      });
      const events = response.data?.events ?? [];

      // Persist events for meeting enrichment & history
      if (events.length) {
        await atlasAPI.syncCalendarEvents(events);
      }

      const mapped = mapEventsToMeetings(events, monday);

      // Không xóa lịch đang hiển thị nếu lần gọi sau trả về rỗng (lỗi tạm thời / quota)
      if (mapped.length === 0) {
        console.warn(
          "[AtlasCalendar] No meetings mapped from Google events for current week.",
        );
      } else {
        setMeetings(mapped);
      }
    } catch (error) {
      console.error("Failed to load calendar events:", error);
      await revalidateConnectionStatus();
    }
  };

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSync = async () => {
    if (!calendarConnected) {
      toast.error("Please connect your Google Calendar first");
      setShowRegistration(true);
      return;
    }
    
    try {
      toast.loading("Syncing calendar...", { id: "sync" });
      await loadCalendarEvents();
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

    // Extract the native Google Meet ID from the link
    // e.g. https://meet.google.com/abc-defg-hij => abc-defg-hij
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
      <div className="relative flex flex-1 overflow-hidden h-full">
        <CalendarView
          meetings={meetings}
          onMeetingClick={handleMeetingClick}
          selectedMeetingId={selectedMeeting?.id}
          onSyncClick={handleSync}
        />

        {showRefreshTip && (
          <CalendarRefreshPopup onDismissPermanent={() => setShowRefreshTip(false)} />
        )}

        {selectedMeeting && (
          <ContactCard
            meeting={selectedMeeting}
            onClose={() => setSelectedMeeting(null)}
            onBotJoin={handleBotJoin}
          />
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
