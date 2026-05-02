import { useEffect, useState } from "react";
import { AppLayout } from "@/components/atlas/AppLayout";
import { CalendarView, type Meeting } from "@/components/atlas/CalendarView";
import { ContactCard } from "@/components/atlas/ContactCard";
import { RegistrationWizard } from "@/components/atlas/RegistrationWizard";
import { RecordingConsent } from "@/components/atlas/RecordingConsent";
import { CalendarRefreshPopup } from "@/components/atlas/CalendarRefreshPopup";
import { SalesAssistantBot } from "@/components/atlas/SalesAssistantBot";
import { toast } from "sonner";

const Index = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRefreshTip, setShowRefreshTip] = useState(true);

  useEffect(() => {
    setShowRegistration(true);
  }, []);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSync = () => {
    toast.success("Calendar synced successfully");
  };

  return (
    <>
      <AppLayout>
        <CalendarView
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
            onBotJoin={() => setShowConsent(true)}
          />
        )}
      </AppLayout>

      <SalesAssistantBot />

      <RegistrationWizard open={showRegistration} onClose={() => setShowRegistration(false)} />
      <RecordingConsent
        open={showConsent}
        onAccept={() => { setShowConsent(false); toast.success("Recording consent acknowledged"); }}
        onLeave={() => { setShowConsent(false); toast.info("Left meeting"); }}
      />
    </>
  );
};

export default Index;

