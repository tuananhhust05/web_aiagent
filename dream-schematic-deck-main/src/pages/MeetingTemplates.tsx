import { useState, useMemo } from "react";
import { Search, Plus, Upload, Settings2, FileText, Users, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/atlas/AppLayout";
import { Input } from "@/components/ui/input";
import { mockPlaybookTemplates } from "@/data/mockData";
import type { PlaybookTemplate } from "@/data/mockData";
import CustomizeTemplateModal from "@/components/templates/CustomizeTemplateModal";
import CreateTemplateModal from "@/components/templates/CreateTemplateModal";
import UploadTemplateModal from "@/components/templates/UploadTemplateModal";

const categories = ["Sales", "HR/Recruiting", "Marketing", "Strategy"] as const;
type Category = typeof categories[number];

export interface ManagedTemplate extends PlaybookTemplate {
  type: "suggested" | "personal" | "team";
  creator: string;
  createdAt: string;
  description?: string;
}

const MeetingTemplates = () => {
  const [activeCategory, setActiveCategory] = useState<Category>("Sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [customizeTemplate, setCustomizeTemplate] = useState<ManagedTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userTemplates, setUserTemplates] = useState<ManagedTemplate[]>([]);

  const allTemplates: ManagedTemplate[] = useMemo(() => {
    const builtIn: ManagedTemplate[] = mockPlaybookTemplates.map((t) => ({
      ...t,
      type: "suggested" as const,
      creator: "ForSkale",
      createdAt: "2026-01-01",
    }));
    return [...builtIn, ...userTemplates];
  }, [userTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesCategory = t.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.sections.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, activeCategory, searchQuery]);

  const handleCreateTemplate = (template: ManagedTemplate) => {
    setUserTemplates((prev) => [...prev, template]);
  };

  const handleSaveCustomization = (updated: ManagedTemplate) => {
    setUserTemplates((prev) =>
      prev.some((t) => t.id === updated.id)
        ? prev.map((t) => (t.id === updated.id ? updated : t))
        : [...prev, updated]
    );
    setCustomizeTemplate(null);
  };

  return (
    <AppLayout activeNav="Meeting Templates">
      <div className="flex flex-1 overflow-hidden bg-background">
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">
                  Meeting Templates
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and organize templates for your meetings across all categories.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-accent transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Template
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 forskale-gradient-bg text-white text-xs font-semibold rounded-lg shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Your Own Template
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "relative pb-3 text-sm font-semibold transition-colors",
                    activeCategory === cat
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                  {activeCategory === cat && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 forskale-gradient-bg rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto atlas-scrollbar p-8 bg-background">
            {/* Search */}
            <div className="mb-6 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name or section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Template Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="rounded-xl bg-secondary/50 flex items-center justify-center min-h-[320px]">
                <div className="text-center space-y-2 px-6">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    {searchQuery ? "No templates found" : `No ${activeCategory} templates yet`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : "Create a template or upload one to get started."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  return (
                    <div
                      key={template.id}
                      className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-md hover:-translate-y-0.5 flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{template.creator}</span>
                            {template.type !== "suggested" && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                                  template.type === "personal"
                                    ? "bg-[hsl(var(--forskale-blue)/0.1)] text-[hsl(var(--forskale-blue))]"
                                    : "bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))]"
                                )}
                              >
                                {template.type === "personal" ? (
                                  <User className="h-2.5 w-2.5" />
                                ) : (
                                  <Users className="h-2.5 w-2.5" />
                                )}
                                {template.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sections Preview */}
                      <div className="flex-1 mb-4">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {template.sections.length} sections
                        </div>
                        <div className="space-y-1">
                          {template.sections.slice(0, 4).map((s, i) => (
                            <div key={i} className="text-xs text-muted-foreground truncate">
                              <span className="text-foreground font-medium">{s.title}</span>
                              {" — "}
                              {s.description}
                            </div>
                          ))}
                          {template.sections.length > 4 && (
                            <div className="text-xs text-muted-foreground">
                              +{template.sections.length - 4} more sections
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <button
                          onClick={() => setCustomizeTemplate(template)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors"
                        >
                          <Settings2 className="h-3 w-3" />
                          Customize
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {customizeTemplate && (
        <CustomizeTemplateModal
          template={customizeTemplate}
          onClose={() => setCustomizeTemplate(null)}
          onSave={handleSaveCustomization}
        />
      )}

      <CreateTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSave={handleCreateTemplate}
      />

      <UploadTemplateModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onSave={handleCreateTemplate}
      />
    </AppLayout>
  );
};

export default MeetingTemplates;
