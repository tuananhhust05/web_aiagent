import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Shield, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegistrationWizardProps {
  open: boolean;
  onClose: () => void;
}

export function RegistrationWizard({ open, onClose }: RegistrationWizardProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-atlas-brand-light">
            <CalendarDays className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{t("registration.title")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("registration.description")}
          </DialogDescription>
        </DialogHeader>
        <ul className="my-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-atlas-success flex-shrink-0" />{t("registration.benefit1")}</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-atlas-success flex-shrink-0" />{t("registration.benefit2")}</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-atlas-success flex-shrink-0" />{t("registration.benefit3")}</li>
        </ul>
        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-atlas-brand-light px-3 py-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
          {t("registration.permissions")}
        </div>
        <Button className="mt-4 w-full" onClick={onClose}>
          {t("registration.continue")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
