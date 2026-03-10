import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "../ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface RecordingConsentProps {
  open: boolean;
  onAccept: () => void;
  onLeave: () => void;
}

export function RecordingConsent({ open, onAccept, onLeave }: RecordingConsentProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-lg" onEscapeKeyDown={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center">Recording Consent Required</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-xs text-foreground leading-relaxed">
              <p className="mb-2">Recording and AI processing to be enabled.</p>
              <p className="mb-2">You are solely responsible for:</p>
              <ul className="mb-2 list-disc pl-4 space-y-1">
                <li>Informing ALL participants that recording is active</li>
                <li>Obtaining valid consent from ALL participants</li>
                <li>Ensuring compliance with applicable privacy laws</li>
              </ul>
              <p className="mb-1">Responsibility for consent lies entirely with you.</p>
              <p className="font-semibold">ForSkale is not responsible.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center gap-3">
          <AlertDialogCancel onClick={onLeave} className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Do Not Proceed
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            I Understand — Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
