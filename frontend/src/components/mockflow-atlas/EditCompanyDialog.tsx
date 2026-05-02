import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Building2, Pencil } from "lucide-react";

type CompanyDraft = {
  name?: string;
  industry?: string;
  size?: string;
  revenue?: string;
  location?: string;
  founded?: string;
  website?: string;
  description?: string;
};

interface EditCompanyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (draft: CompanyDraft) => void;
  hostEmail: string;
  initial: CompanyDraft;
}

export function EditCompanyDialog({ open, onClose, onSave, hostEmail, initial }: EditCompanyDialogProps) {
  const [draft, setDraft] = useState<CompanyDraft>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const canSave = useMemo(() => {
    return Boolean((draft.name || "").trim());
  }, [draft.name]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-primary" />
            Edit Company Info
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-muted-foreground leading-relaxed">
          This company profile is mapped to <strong>{hostEmail}</strong>.
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Company Name</Label>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Input value={draft.name || ""} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Industry</Label>
              <Input value={draft.industry || ""} onChange={(e) => setDraft((p) => ({ ...p, industry: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Size</Label>
              <Input value={draft.size || ""} onChange={(e) => setDraft((p) => ({ ...p, size: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Revenue</Label>
              <Input value={draft.revenue || ""} onChange={(e) => setDraft((p) => ({ ...p, revenue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Location</Label>
              <Input value={draft.location || ""} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Founded</Label>
              <Input value={draft.founded || ""} onChange={(e) => setDraft((p) => ({ ...p, founded: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Website</Label>
              <Input value={draft.website || ""} onChange={(e) => setDraft((p) => ({ ...p, website: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              rows={4}
              value={draft.description || ""}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!canSave} onClick={() => onSave(draft)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

