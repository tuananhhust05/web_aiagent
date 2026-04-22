import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  preview: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AnalyzeSection({ title, preview, icon, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden transition-all duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          <p className="text-[11px] text-muted-foreground truncate">{preview}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!open && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border border-[hsl(var(--forskale-teal)/0.2)]">
              <Search className="h-2.5 w-2.5" />
              Analyze
            </span>
          )}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 border-t border-border pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
