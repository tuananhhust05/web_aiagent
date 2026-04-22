import { useEffect, useState } from "react";
import { AppLayout } from "@/components/atlas/AppLayout";
import { CalendarView, type Meeting } from "@/components/atlas/CalendarView";
import { ContactCard } from "@/components/atlas/ContactCard";
import { RegistrationWizard } from "@/components/atlas/RegistrationWizard";
import { RecordingConsent } from "@/components/atlas/RecordingConsent";
import { CalendarRefreshPopup } from "@/components/atlas/CalendarRefreshPopup";
import { SalesAssistantBot } from "@/components/atlas/SalesAssistantBot";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRefreshTip, setShowRefreshTip] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    setShowRegistration(true);
  }, []);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSync = () => {
    toast.success(t("toast.calendarSynced"));
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
          <>
            {/* Backdrop – click anywhere outside to close */}
            <div
              className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setSelectedMeeting(null)}
            />
            <ContactCard
              meeting={selectedMeeting}
              onClose={() => setSelectedMeeting(null)}
              onBotJoin={() => setShowConsent(true)}
            />
          </>
        )}
      </AppLayout>

      {/* <SalesAssistantBot /> */}

      <RegistrationWizard open={showRegistration} onClose={() => setShowRegistration(false)} />
      <RecordingConsent
        open={showConsent}
        onAccept={() => { setShowConsent(false); toast.success(t("toast.recordingConsent")); }}
        onLeave={() => { setShowConsent(false); toast.info(t("toast.leftMeeting")); }}
      />
    </>
  );
};

export default Index;
