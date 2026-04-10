import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (type: "personal" | "team") => void;
}

const CreateTemplateDialog = ({ open, onOpenChange, onConfirm }: CreateTemplateDialogProps) => {
  const [selected, setSelected] = useState<"personal" | "team">("personal");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            What kind of template you want to create?
          </DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={selected}
          onValueChange={(v) => setSelected(v as "personal" | "team")}
          className="space-y-3 py-2"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="personal" id="personal" />
            <Label htmlFor="personal" className="text-sm font-medium cursor-pointer">Personal template</Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="team" id="team" />
            <Label htmlFor="team" className="text-sm text-muted-foreground cursor-pointer">Team template</Label>
          </div>
        </RadioGroup>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onConfirm(selected)}
            className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center px-5 py-2.5 border border-border text-sm font-medium rounded-lg hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateDialog;
