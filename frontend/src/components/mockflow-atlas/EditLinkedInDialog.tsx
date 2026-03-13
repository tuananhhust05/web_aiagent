import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Linkedin, Pencil } from "lucide-react";

interface EditLinkedInDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (linkedinUrl: string) => void;
  participantName: string;
  currentUrl: string;
}

export function EditLinkedInDialog({ open, onClose, onSave, participantName, currentUrl }: EditLinkedInDialogProps) {
  const [url, setUrl] = useState(currentUrl);

  // Sync with external prop when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(currentUrl);
    }
  }, [open, currentUrl]);

  const isValid = url.trim() === "" || url.includes("linkedin.com/in/");

  const handleSave = () => {
    onSave(url.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary" />
            Edit LinkedIn Profile
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Update the LinkedIn profile URL for <strong>{participantName}</strong>. This will be used for future enrichment lookups.
        </p>

        <div className="space-y-2">
          <Label htmlFor="edit-linkedin-url" className="text-xs font-medium">LinkedIn Profile URL</Label>
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <Input
              id="edit-linkedin-url"
              placeholder="https://linkedin.com/in/username"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          {url && !isValid && (
            <p className="text-[11px] text-destructive">Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username)</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!isValid}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
