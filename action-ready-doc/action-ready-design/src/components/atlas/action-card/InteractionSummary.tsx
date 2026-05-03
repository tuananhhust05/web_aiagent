import { useState } from "react";
import { Brain, Mail, Phone, Calendar, ChevronRight } from "lucide-react";
import { InteractionHistoryItem } from "./types";
import { useLanguage } from "@/context/LanguageContext";

const historyIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
};

const InteractionSummary = ({
  summary,
  history,
}: {
  summary: string;
  history?: InteractionHistoryItem[];
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          <Brain size={11} className="text-primary" />
          {t("interactionSummary")}
          <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary">AI</span>
        </div>
      </div>
      <p className="text-xs leading-snug text-foreground">{summary}</p>

      {/* View full history */}
      {history?.length ? (
        <>
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ChevronRight
              size={12}
              className={`transition-transform ${showHistory ? "rotate-90" : ""}`}
            />
            {showHistory ? t("hideHistory") : t("viewFullHistory")}
          </button>

          {showHistory && (
            <div className="space-y-1.5 pl-1">
              {history.map((item, i) => {
                const Icon = historyIcons[item.type] || Mail;
                return (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Icon size={12} className="mt-0.5 shrink-0 text-primary/60" />
                    <span className="shrink-0 font-medium">{item.timeAgo}</span>
                    <span className="text-foreground/80">{item.summary}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default InteractionSummary;
