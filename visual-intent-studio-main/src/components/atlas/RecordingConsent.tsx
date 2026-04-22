import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecordingConsentProps {
  open: boolean;
  onAccept: () => void;
  onLeave: () => void;
}

export function RecordingConsent({ open, onAccept, onLeave }: RecordingConsentProps) {
  const { t } = useLanguage();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-lg" onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">{t("consent.title")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-xs text-foreground leading-relaxed">
              <p className="mb-2">{t("consent.intro")}</p>
              <p className="mb-2">{t("consent.responsible")}</p>
              <ul className="mb-2 list-disc pl-4 space-y-1">
                <li>{t("consent.item1")}</li>
                <li>{t("consent.item2")}</li>
                <li>{t("consent.item3")}</li>
              </ul>
              <p className="mb-1">{t("consent.liability")}</p>
              <p className="font-semibold">{t("consent.disclaimer")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center gap-3">
          <AlertDialogCancel onClick={onLeave} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            {t("consent.doNotProceed")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            {t("consent.continue")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
