import { useState, useCallback } from "react";
import { Plus, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { mockPlaybookTemplates } from "@/data/mockData";
import type { PlaybookTemplate } from "@/data/mockData";
import CreateTemplateDialog from "./CreateTemplateDialog";
import TemplateEditor, { type CustomTemplate } from "./TemplateEditor";

const PlaybookTemplateManager = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(mockPlaybookTemplates[0]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);
  const [templateTab, setTemplateTab] = useState<"suggested" | "personal" | "team">("suggested");
  const [templateCategory, setTemplateCategory] = useState("Sales");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [personalTemplates, setPersonalTemplates] = useState<CustomTemplate[]>([]);
  const [teamTemplates, setTeamTemplates] = useState<CustomTemplate[]>([]);

  const createNewTemplate = (type: "personal" | "team") => {
    const templates = type === "personal" ? personalTemplates : teamTemplates;
    const newTemplate: CustomTemplate = {
      id: `${type}-${Date.now()}`,
      name: `${type} template ${templates.length + 1}`,
      type,
      prompt: "",
      meetingType: "external",
      titleKeyword: "",
      active: false,
    };
    if (type === "personal") {
      setPersonalTemplates((prev) => [...prev, newTemplate]);
    } else {
      setTeamTemplates((prev) => [...prev, newTemplate]);
    }
    toast.success("Meeting template created!");
  };

  const handleCreateConfirm = (type: "personal" | "team") => {
    setShowCreateDialog(false);
    createNewTemplate(type);
    setTemplateTab(type);
  };

  const handleUpdateTemplate = (updated: CustomTemplate) => {
    const setter = updated.type === "personal" ? setPersonalTemplates : setTeamTemplates;
    setter((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleCategoryChange = useCallback((cat: string) => {
    setTemplateCategory(cat);
    const first = mockPlaybookTemplates.find((t) => t.category === cat);
    if (first) setSelectedTemplate(first);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <button onClick={() => setShowCreateDialog(true)} className="inline-flex items-center gap-1.5 px-3 py-2 forskale-gradient-bg text-white text-xs font-semibold rounded-lg shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all">
          <Plus className="h-3.5 w-3.5" />
          Create personal/team template
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-6">
            {(["suggested", "personal", "team"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTemplateTab(tab)}
                className={cn(
                  "relative pb-3 text-sm font-semibold transition-colors capitalize",
                  templateTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "suggested" ? "Suggested templates" : tab === "personal" ? "Personal templates" : "Team templates"}
                {templateTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {templateTab === "suggested" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Templates for</span>
            <Select value={templateCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[160px] h-8 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Sales", "HR/Recruiting", "Marketing", "Strategy"].map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(templateTab === "personal" || templateTab === "team") ? (
          (() => {
            const templates = templateTab === "personal" ? personalTemplates : teamTemplates;
            return templates.length > 0 ? (
              <TemplateEditor
                templates={templates}
                onCreateNew={() => createNewTemplate(templateTab)}
                onUpdate={handleUpdateTemplate}
              />
            ) : (
              <div className="rounded-xl bg-secondary/50 flex items-center justify-center min-h-[320px]">
                <div className="text-center space-y-2 px-6">
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    There are no {templateTab} templates yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Select one of our suggested templates or<br />create a {templateTab} template from scratch.
                  </p>
                </div>
              </div>
            );
          })()
        ) : (
        <div className="flex gap-6">
          <div className="w-1/2 space-y-2">
            {mockPlaybookTemplates
              .filter((t) => templateTab === "suggested" ? t.category === templateCategory : true)
              .map((t) => {
                const isSelected = selectedTemplate?.id === t.id;
                const isDefault = defaultTemplateId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-5 py-4 cursor-pointer transition-all",
                      isSelected
                        ? "border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.04)] shadow-sm"
                        : "border-border bg-card hover:border-[hsl(var(--forskale-teal)/0.15)] hover:bg-accent/50"
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">ForSkale</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDefaultTemplateId(t.id); }}
                      className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border",
                        isDefault
                          ? "bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)]"
                          : "text-muted-foreground hover:text-foreground border-border hover:border-foreground/20 hover:bg-accent"
                      )}
                    >
                      {isDefault && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {isDefault ? "Default for you" : "Set Default"}
                    </button>
                  </div>
                );
              })}
          </div>

          {selectedTemplate && (
            <div className="w-1/2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-card h-fit sticky top-0">
              <div>
                <h3 className="text-lg font-heading font-bold text-foreground">{selectedTemplate.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Notes structure preview.</p>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Notes structure <span className="text-[10px] uppercase tracking-wider text-forskale-cyan">(PREVIEW)</span>
                </div>
                <div className="space-y-3">
                  {selectedTemplate.sections.map((s, i) => (
                    <div key={i}>
                      <div className="text-sm font-semibold text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onConfirm={handleCreateConfirm}
      />
    </div>
  );
};

export default PlaybookTemplateManager;
