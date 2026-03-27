import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, Save } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ManagedTemplate } from "@/pages/MeetingTemplates";

type UploadState = "idle" | "analyzing" | "preview";

interface ExtractedSection {
  title: string;
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: ManagedTemplate) => void;
}

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.json,.md,.pptx,.xlsx";

const simulateExtraction = (fileName: string): ExtractedSection[] => {
  const name = fileName.toLowerCase();
  if (name.includes("sales") || name.includes("discovery")) {
    return [
      { title: "Company overview", description: "Background and current situation." },
      { title: "Pain points", description: "Key challenges and problems discussed." },
      { title: "Solution fit", description: "How the product addresses identified needs." },
      { title: "Next steps", description: "Agreed follow-up actions and timeline." },
    ];
  }
  if (name.includes("marketing") || name.includes("campaign")) {
    return [
      { title: "Campaign objectives", description: "Goals and KPIs." },
      { title: "Target audience", description: "Audience segments and personas." },
      { title: "Budget & timeline", description: "Resource allocation and milestones." },
      { title: "Measurement", description: "Success metrics and reporting." },
    ];
  }
  return [
    { title: "Overview", description: "General context and background." },
    { title: "Key discussion points", description: "Main topics covered." },
    { title: "Decisions made", description: "Outcomes and resolutions." },
    { title: "Action items", description: "Follow-up tasks and owners." },
  ];
};

const UploadTemplateModal = ({ open, onOpenChange, onSave }: Props) => {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Sales");
  const [templateType, setTemplateType] = useState<"personal" | "team">("personal");
  const [sections, setSections] = useState<ExtractedSection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setUploadState("idle");
    setFileName("");
    setName("");
    setCategory("Sales");
    setTemplateType("personal");
    setSections([]);
    setError(null);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setName(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    setUploadState("analyzing");

    // Simulate AI analysis
    setTimeout(() => {
      setSections(simulateExtraction(file.name));
      setUploadState("preview");
    }, 2000);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(input);
    }
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Template name is required.");
      return;
    }
    const newTemplate: ManagedTemplate = {
      id: `upload-${Date.now()}`,
      name: name.trim(),
      category,
      isBuiltIn: false,
      type: templateType,
      creator: "You",
      createdAt: new Date().toISOString().split("T")[0],
      sections,
    };
    onSave(newTemplate);
    toast.success("Template created from upload!");
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="text-lg font-heading font-bold text-foreground">Upload Template</DialogTitle>

        {uploadState === "idle" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => document.getElementById("template-upload")?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Drop a file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, TXT, JSON, Markdown, PPT, XLSX — up to 10MB
              </p>
              <input
                id="template-upload"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </div>
            )}
          </div>
        )}

        {uploadState === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Analyzing document...</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        )}

        {uploadState === "preview" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--forskale-green)/0.06)] border border-[hsl(var(--forskale-green)/0.15)]">
              <FileText className="h-4 w-4 text-[hsl(var(--forskale-green))]" />
              <span className="text-xs font-medium text-foreground flex-1 truncate">{fileName}</span>
              <span className="text-[10px] text-status-great font-semibold">Analyzed</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Sales", "HR/Recruiting", "Marketing", "Strategy", "Custom"].map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Visibility</label>
                <RadioGroup value={templateType} onValueChange={(v) => setTemplateType(v as "personal" | "team")} className="flex gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="personal" id="up-personal" />
                    <Label htmlFor="up-personal" className="text-xs cursor-pointer">Personal</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="team" id="up-team" />
                    <Label htmlFor="up-team" className="text-xs cursor-pointer">Team</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground">Extracted Sections</label>
              {sections.map((s, i) => (
                <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                  <Input
                    value={s.title}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[i] = { ...s, title: e.target.value };
                      setSections(updated);
                    }}
                    className="h-7 text-sm mb-1.5 font-medium"
                  />
                  <Input
                    value={s.description}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[i] = { ...s, description: e.target.value };
                      setSections(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={resetForm} className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg forskale-gradient-bg text-white shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
              >
                <Save className="h-3 w-3" /> Save Template
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadTemplateModal;
