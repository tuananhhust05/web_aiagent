import { useState } from "react";
import { X, Bell, Clock, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReminderModalProps {
  actionTitle: string;
  actionDescription: string;
  isOpen: boolean;
  onClose: () => void;
}

const timingOptions = [
  { id: "1h", label: "In 1 hour" },
  { id: "tomorrow", label: "Tomorrow morning" },
  { id: "3d", label: "In 3 days" },
  { id: "1w", label: "Next week" },
  { id: "custom", label: "Custom" },
] as const;

const methodOptions = [
  { id: "in-app", label: "In-app notification", icon: Bell, defaultChecked: true },
  { id: "email", label: "Email", icon: Mail, defaultChecked: false },
  { id: "slack", label: "Slack", icon: MessageSquare, defaultChecked: false },
] as const;

const ReminderModal = ({ actionTitle, actionDescription, isOpen, onClose }: ReminderModalProps) => {
  const [timing, setTiming] = useState("tomorrow");
  const [methods, setMethods] = useState<Record<string, boolean>>({ "in-app": true, email: false, slack: false });
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    toast.success("Reminder set!", {
      description: `You'll be reminded ${timingOptions.find(t => t.id === timing)?.label?.toLowerCase()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
            <h3 className="text-sm font-heading font-bold text-foreground">Set Reminder</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Action preview */}
          <div className="bg-secondary rounded-lg p-3">
            <div className="text-xs font-semibold text-foreground mb-1">{actionTitle}</div>
            <div className="text-xs text-muted-foreground">{actionDescription}</div>
          </div>

          {/* Timing */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">When</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {timingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTiming(opt.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    timing === opt.id
                      ? "bg-[hsl(var(--forskale-teal))] text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Methods */}
          <div>
            <span className="text-xs font-semibold text-foreground mb-2 block">How</span>
            <div className="space-y-2">
              {methodOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={methods[opt.id] ?? false}
                      onChange={() => setMethods(p => ({ ...p, [opt.id]: !p[opt.id] }))}
                      className="rounded border-border accent-[hsl(var(--forskale-teal))]"
                    />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <span className="text-xs font-semibold text-foreground mb-1.5 block">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context or instructions..."
              className="w-full bg-secondary border border-border rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--forskale-teal))]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSave} className="text-xs bg-[hsl(var(--forskale-teal))] hover:bg-[hsl(var(--forskale-teal)/0.9)] text-white">
            Set Reminder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
