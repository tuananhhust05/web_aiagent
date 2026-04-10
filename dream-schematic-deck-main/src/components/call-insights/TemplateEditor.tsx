import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface CustomTemplate {
  id: string;
  name: string;
  type: "personal" | "team";
  prompt: string;
  meetingType: string;
  titleKeyword: string;
  active: boolean;
}

interface TemplateEditorProps {
  templates: CustomTemplate[];
  onCreateNew: () => void;
  onUpdate: (template: CustomTemplate) => void;
}

const TemplateEditor = ({ templates, onCreateNew, onUpdate }: TemplateEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(templates[0]?.id ?? null);
  const selected = templates.find((t) => t.id === selectedId);

  const handleSaveAndActivate = () => {
    if (!selected) return;
    onUpdate({ ...selected, active: true });
    toast.success("Template saved and activated!");
  };

  const handleDeactivate = () => {
    if (!selected) return;
    onUpdate({ ...selected, active: false });
    toast.info("Template deactivated.");
  };

  return (
    <div className="flex gap-6">
      {/* Left sidebar — template list */}
      <div className="w-[220px] shrink-0 space-y-2">
        {templates.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={cn(
              "rounded-lg border px-4 py-3 cursor-pointer text-sm font-medium transition-all flex items-center justify-between gap-2",
              selectedId === t.id
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/15 hover:bg-accent/50"
            )}
          >
            <span className="truncate">{t.name}</span>
            {t.active && (
              <span className="shrink-0 rounded-full bg-[hsl(var(--badge-green-bg))] px-2 py-0.5 text-[10px] font-semibold text-status-great uppercase">
                On
              </span>
            )}
          </div>
        ))}
        <div
          onClick={onCreateNew}
          className="rounded-lg border border-dashed border-border px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Create new template
        </div>
      </div>

      {/* Right — editor area */}
      {selected ? (
        <div className="flex-1 rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex gap-6">
            {/* Prompt section */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-bold text-foreground">{selected.name}</h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase",
                    selected.active
                      ? "bg-[hsl(var(--badge-green-bg))] text-status-great"
                      : "border border-border text-muted-foreground"
                  )}
                >
                  {selected.active ? "On" : "Off"}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Prompt</label>
                <Textarea
                  placeholder="Tell AI what kind of summary you want..."
                  value={selected.prompt}
                  onChange={(e) => onUpdate({ ...selected, prompt: e.target.value })}
                  className="min-h-[200px] bg-secondary/50 resize-none"
                />
              </div>
            </div>

            {/* Automation section */}
            <div className="w-[280px] shrink-0 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">Automate this template for future meetings</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Automatically apply this template to future meetings that match this criteria:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Type of the meeting <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selected.meetingType}
                  onValueChange={(v) => onUpdate({ ...selected, meetingType: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external" className="text-xs">External meetings</SelectItem>
                    <SelectItem value="internal" className="text-xs">Internal meetings</SelectItem>
                    <SelectItem value="all" className="text-xs">All meetings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  When meeting title contains the word
                </label>
                <Input
                  placeholder="Type a word that always appear on the title"
                  value={selected.titleKeyword}
                  onChange={(e) => onUpdate({ ...selected, titleKeyword: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-3">
                {selected.active && (
                  <button
                    onClick={handleDeactivate}
                    className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Deactivate template
                  </button>
                )}
                <button
                  onClick={handleSaveAndActivate}
                  className="ml-auto inline-flex items-center justify-center px-4 py-2.5 forskale-gradient-bg text-white text-xs font-semibold rounded-lg shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
                >
                  Save and activate
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-card flex items-center justify-center min-h-[300px]">
          <p className="text-sm text-muted-foreground">Select a template or create a new one</p>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
