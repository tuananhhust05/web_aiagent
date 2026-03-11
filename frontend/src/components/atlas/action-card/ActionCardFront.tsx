import { Clock, Mail, Phone, Calendar, CheckCircle2, Video } from "lucide-react";
import type { TodoItem } from "../../../lib/api";

const typeConfig: Record<string, { icon: typeof Mail; label: string; colorVar: string }> = {
  respond_to_email: { icon: Mail, label: "Email Response", colorVar: "--forskale-blue" },
  handle_pricing_objection: { icon: Mail, label: "Pricing Objection", colorVar: "--forskale-blue" },
  competitive_followup: { icon: Mail, label: "Competitive Follow-up", colorVar: "--forskale-blue" },
  send_case_study: { icon: Mail, label: "Case Study", colorVar: "--forskale-blue" },
  general_followup: { icon: Phone, label: "Follow-up", colorVar: "--forskale-green" },
  send_integration_doc: { icon: Phone, label: "Integration Doc", colorVar: "--forskale-green" },
  schedule_demo: { icon: Calendar, label: "Schedule Demo", colorVar: "--forskale-teal" },
};

const fallbackType = { icon: Video, label: "Action", colorVar: "--forskale-teal" };

const sentimentConfig: Record<string, { label: string; bg: string; text: string }> = {
  interested: { label: "Interested", bg: "bg-emerald-50", text: "text-emerald-700" },
  not_interested: { label: "Not interested", bg: "bg-amber-50", text: "text-amber-700" },
  do_not_contact: { label: "Do not contact", bg: "bg-red-50", text: "text-red-700" },
  not_now: { label: "Not now", bg: "bg-sky-50", text: "text-sky-700" },
  forwarded: { label: "Forwarded", bg: "bg-violet-50", text: "text-violet-700" },
  meeting_intent: { label: "Meeting intent", bg: "bg-violet-50", text: "text-violet-700" },
  non_in_target: { label: "Non in target", bg: "bg-pink-50", text: "text-pink-700" },
};

function getDueLabel(task: TodoItem): { label: string; overdue: boolean } {
  if (!task.due_at) return { label: "No due date", overdue: false };
  const due = new Date(task.due_at);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffH = Math.round(diffMs / (1000 * 60 * 60));
  if (diffH < 0) {
    const days = Math.abs(Math.floor(diffH / 24));
    return {
      label: days > 0 ? `${days}d overdue` : `${Math.abs(diffH)}h overdue`,
      overdue: true,
    };
  }
  if (diffH < 24) return { label: `Due in ${diffH}h`, overdue: false };
  const days = Math.floor(diffH / 24);
  return { label: `Due in ${days}d`, overdue: false };
}

export default function ActionCardFront({
  task,
  onOpen,
  onResolve,
  resolved,
}: {
  task: TodoItem;
  onOpen: () => void;
  onResolve?: () => void;
  resolved?: boolean;
}) {
  const type = typeConfig[task.task_type] ?? fallbackType;
  const TypeIcon = type.icon;
  const due = getDueLabel(task);
  const prospect = task.deal_intelligence?.company_name ?? "—";
  const sentiment = task.intent_category ? sentimentConfig[task.intent_category] : null;
  const confidence = task.task_strategy?.confidence;

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        onOpen();
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ "--task-color": `hsl(var(${type.colorVar}))` } as React.CSSProperties}
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl"
        style={{ background: `hsl(var(${type.colorVar}))` }}
      />

      <div className="p-4 pl-5">
        {/* Row 1: Type badge + Sentiment + Confidence */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
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
            {sentiment && (
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${sentiment.bg} ${sentiment.text}`}
              >
                {sentiment.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {confidence != null && (
              <span className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {confidence}%
              </span>
            )}
            {resolved && <CheckCircle2 size={16} className="text-forskale-green" />}
          </div>
        </div>

        {/* Row 2: Prospect + Title */}
        <div className="mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {prospect}
          </span>
          <h3 className="mt-1 max-w-[30ch] text-sm font-bold leading-snug text-foreground">
            {task.title}
          </h3>
        </div>

        {/* Row 3: Due label + source */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={12} className={due.overdue ? "text-destructive" : ""} />
          <span className={due.overdue ? "font-medium text-destructive" : ""}>{due.label}</span>
          {(task.triggered_from || task.source) && (
            <>
              <span className="text-border">·</span>
              <span className="text-[10px]">from {task.triggered_from ?? task.source}</span>
            </>
          )}
        </div>

        {/* Row 4: Complete action */}
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
}
