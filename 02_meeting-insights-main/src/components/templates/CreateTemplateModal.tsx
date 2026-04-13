import { useState } from "react";
import { Plus, ChevronUp, ChevronDown, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ManagedTemplate } from "@/pages/MeetingTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: ManagedTemplate) => void;
}

const CreateTemplateModal = ({ open, onOpenChange, onSave }: Props) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Sales");
  const [templateType, setTemplateType] = useState<"personal" | "team">("personal");
  const [sections, setSections] = useState([
    { id: "1", title: "", description: "" },
  ]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("Sales");
    setTemplateType("personal");
    setSections([{ id: "1", title: "", description: "" }]);
  };

  const addSection = () => {
    setSections([...sections, { id: `${Date.now()}`, title: "", description: "" }]);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: "title" | "description", value: string) => {
    setSections(sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    const validSections = sections.filter((s) => s.title.trim());
    if (validSections.length === 0) {
      toast.error("Add at least one section with a title.");
      return;
    }

    const newTemplate: ManagedTemplate = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      category,
      isBuiltIn: false,
      type: templateType,
      creator: "You",
      createdAt: new Date().toISOString().split("T")[0],
      description,
      sections: validSections.map(({ title, description }) => ({ title, description })),
    };

    onSave(newTemplate);
    toast.success("Template created!");
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="text-lg font-heading font-bold text-foreground">
              Create New Template
            </DialogTitle>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Template Name <span className="text-destructive">*</span>
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Discovery Call" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sales", "HR/Recruiting", "Marketing", "Strategy", "Custom"].map((c) => (
                        <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this template for?"
                  className="min-h-[60px] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Visibility</label>
                <RadioGroup value={templateType} onValueChange={(v) => setTemplateType(v as "personal" | "team")} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="personal" id="create-personal" />
                    <Label htmlFor="create-personal" className="text-sm cursor-pointer">Personal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="team" id="create-team" />
                    <Label htmlFor="create-team" className="text-sm cursor-pointer">Team</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Sections Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Sections</label>
                  <button onClick={addSection} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    <Plus className="h-3 w-3" /> Add section
                  </button>
                </div>
                {sections.map((section, i) => (
                  <div key={section.id} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5 text-center">{i + 1}</span>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(i, "title", e.target.value)}
                        placeholder="Section title"
                        className="h-8 text-sm flex-1"
                      />
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveSection(i, "up")} disabled={i === 0} className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => moveSection(i, "down")} disabled={i === sections.length - 1} className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => removeSection(i)} disabled={sections.length <= 1} className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive disabled:opacity-30 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <Input
                      value={section.description}
                      onChange={(e) => updateSection(i, "description", e.target.value)}
                      placeholder="Section description"
                      className="h-7 text-xs ml-7"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="w-[280px] shrink-0 border-l border-border bg-secondary/20 overflow-y-auto p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Preview</div>
              <h4 className="text-sm font-bold text-foreground mb-1">{name || "Untitled Template"}</h4>
              {description && <p className="text-xs text-muted-foreground mb-4">{description}</p>}
              <div className="space-y-3">
                {sections.filter((s) => s.title).map((s, i) => (
                  <div key={i}>
                    <div className="text-sm font-semibold text-foreground">{s.title}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg forskale-gradient-bg text-white shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
            >
              <Save className="h-3 w-3" />
              Save Template
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateModal;
