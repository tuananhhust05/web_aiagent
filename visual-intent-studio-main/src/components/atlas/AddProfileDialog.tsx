import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Linkedin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (linkedinUrl: string) => void;
  participantName: string;
}

export function AddProfileDialog({ open, onClose, onSubmit, participantName }: AddProfileDialogProps) {
  const [url, setUrl] = useState("");
  const { t } = useLanguage();

  const isValid = url.includes("linkedin.com/in/");

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(url);
      setUrl("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Linkedin className="h-5 w-5 text-primary" />
            {t("addProfile.title")} {participantName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("addProfile.description")}
        </p>

        <div className="space-y-2">
          <Label htmlFor="linkedin-url" className="text-xs font-medium">{t("addProfile.label")}</Label>
          <Input
            id="linkedin-url"
            placeholder="https://linkedin.com/in/username"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>{t("addProfile.cancel")}</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isValid}>{t("addProfile.submit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
