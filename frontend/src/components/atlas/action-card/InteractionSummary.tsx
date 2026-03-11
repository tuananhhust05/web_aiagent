import { useState } from "react";
import { Brain, Mail, Phone, Calendar, ChevronRight } from "lucide-react";
import type { InteractionHistoryItem } from "../../../lib/api";

const historyIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
};

export default function InteractionSummary({
  summary,
  history,
}: {
  summary: string;
  history?: InteractionHistoryItem[] | null;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <Brain size={12} className="text-primary" />
          Interaction Summary
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
            AI
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </div>

      {history && history.length > 0 && (
        <>
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ChevronRight
              size={12}
              className={`transition-transform ${showHistory ? "rotate-90" : ""}`}
            />
            {showHistory ? "Hide history" : "View full history"}
          </button>

          {showHistory && (
            <div className="space-y-1.5 pl-1">
              {history.map((item, i) => {
                const Icon = historyIcons[item.type] || Mail;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Icon size={12} className="mt-0.5 shrink-0 text-primary/60" />
                    <span className="shrink-0 font-medium">{item.time_ago}</span>
                    <span className="text-foreground/80">— {item.summary}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
