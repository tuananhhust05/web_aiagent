import { useState } from "react";
import { Clock, Mail, Phone, Calendar, Share2, CheckCircle2 } from "lucide-react";
import { ActionCardData, ActionType } from "./types";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  const typeConfig: Record<ActionType, { icon: typeof Mail; labelKey: "emailResponse" | "callFollowup" | "scheduleDemo" | "sendResources"; colorVar: string }> = {
    email_response: { icon: Mail, labelKey: "emailResponse", colorVar: "--forskale-blue" },
    call_followup: { icon: Phone, labelKey: "callFollowup", colorVar: "--forskale-green" },
    schedule_demo: { icon: Calendar, labelKey: "scheduleDemo", colorVar: "--forskale-teal" },
    send_resources: { icon: Share2, labelKey: "sendResources", colorVar: "--forskale-cyan" },
  };

  const type = typeConfig[data.type];
  const TypeIcon = type.icon;

  const handleBodyClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onOpen();
  };

  return (
    <div
      onClick={handleBodyClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ "--task-color": `hsl(var(${type.colorVar}))` } as React.CSSProperties}
    >
      {/* Hover tooltip */}
      {showTooltip && !resolved && (
        <div className="absolute top-2 right-2 z-10 rounded-md bg-foreground/90 px-2 py-1 text-[10px] font-medium text-background shadow-lg animate-in fade-in duration-150">
          {t("clickToSee")}
        </div>
      )}

      {/* Priority bar */}
      <div
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
        style={{ background: data.isOverdue ? "hsl(var(--destructive))" : `hsl(var(${type.colorVar}))` }}
      />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em]"
              style={{ background: `hsl(var(${type.colorVar}) / 0.08)`, color: `hsl(var(${type.colorVar}))` }}
            >
              <TypeIcon size={11} />
              {t(type.labelKey)}
            </div>
            {data.isOverdue && (
              <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
                {t("overdue")}
              </span>
            )}
          </div>
          {resolved && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-forskale-green">
              <CheckCircle2 size={16} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{data.prospect}</span>
          <h3 className="mt-1 max-w-[30ch] text-sm font-bold leading-snug text-foreground">{data.title}</h3>
          {data.objective && (
            <p className="mt-0.5 text-[11px] text-muted-foreground italic">{data.objective}</p>
          )}
        </div>

        {/* Due */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} className={data.isOverdue ? "text-destructive" : ""} />
          <span className={data.isOverdue ? "font-medium text-destructive" : ""}>{data.dueLabel}</span>
        </div>

        {/* Channel badge */}
        <div className="mb-3 flex items-center gap-1.5">
          <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {data.triggeredFrom}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-border pt-3">
          {onResolve && (
            <button onClick={onResolve} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <CheckCircle2 size={12} />
              {t("complete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionCardFront;
