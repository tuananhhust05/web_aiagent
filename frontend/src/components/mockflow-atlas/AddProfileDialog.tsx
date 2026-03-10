import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Linkedin } from "lucide-react";

interface AddProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (linkedinUrl: string) => void;
  participantName: string;
}

export function AddProfileDialog({ open, onClose, onSubmit, participantName }: AddProfileDialogProps) {
  const [url, setUrl] = useState("");

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
            Add Profile for {participantName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This participant signed up with a personal email (e.g. Gmail), so we couldn't find their LinkedIn automatically. Paste their LinkedIn profile URL to enable enrichment.
        </p>

        <div className="space-y-2">
          <Label htmlFor="linkedin-url" className="text-xs font-medium">LinkedIn Profile URL</Label>
          <Input
            id="linkedin-url"
            placeholder="https://linkedin.com/in/username"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isValid}>Add Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
