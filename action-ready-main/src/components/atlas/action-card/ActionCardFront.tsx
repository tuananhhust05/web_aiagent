import { Clock, Mail, Phone, Calendar, CheckCircle2 } from "lucide-react";
import { ActionCardData, ActionType } from "./types";

const typeConfig: Record<ActionType, { icon: typeof Mail; label: string; colorVar: string }> = {
  email_response: { icon: Mail, label: "Email Response", colorVar: "--forskale-blue" },
  call_followup: { icon: Phone, label: "Call Follow-up", colorVar: "--forskale-green" },
  schedule_demo: { icon: Calendar, label: "Schedule Demo", colorVar: "--forskale-teal" },
};

const ActionCardFront = ({
  data,
  onOpen,
  onResolve,
  resolved,
}: {
  data: ActionCardData;
  onOpen: () => void;
  onResolve?: () => void;
  resolved?: boolean;
}) => {
  const type = typeConfig[data.type];
  const TypeIcon = type.icon;

  const handleBodyClick = (e: React.MouseEvent) => {
    // Don't flip if clicking on a button or interactive element
    if ((e.target as HTMLElement).closest("button")) return;
    onOpen();
  };

  return (
    <div
      onClick={handleBodyClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ "--task-color": `hsl(var(${type.colorVar}))` } as React.CSSProperties}
    >
      {/* Priority bar */}
      <div
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
        style={{ background: `hsl(var(${type.colorVar}))` }}
      />

      <div className="p-4 pl-5">
        {/* Header: type badge + resolve */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em]"
            style={{
              background: `hsl(var(${type.colorVar}) / 0.08)`,
              color: `hsl(var(${type.colorVar}))`,
            }}
          >
            <TypeIcon size={11} />
            {type.label}
          </div>
          {resolved && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-forskale-green">
              <CheckCircle2 size={16} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {data.prospect}
          </span>
          <h3 className="mt-1 max-w-[30ch] text-sm font-bold leading-snug text-foreground">
            {data.title}
          </h3>
        </div>

        {/* Due */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} className={data.isOverdue ? "text-destructive" : ""} />
          <span className={data.isOverdue ? "font-medium text-destructive" : ""}>{data.dueLabel}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border pt-3">
          {onResolve && (
            <button
              onClick={onResolve}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CheckCircle2 size={12} />
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionCardFront;
