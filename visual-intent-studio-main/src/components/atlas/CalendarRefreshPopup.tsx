import { useState } from "react";
import { X, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CalendarRefreshPopupProps {
  onDismissPermanent: () => void;
}

export function CalendarRefreshPopup({ onDismissPermanent }: CalendarRefreshPopupProps) {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();

  if (!visible) return null;

  return (
    <div className="absolute left-1/2 top-16 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3 rounded-lg border border-forskale-teal/20 bg-cal-slate px-4 py-3 shadow-lg backdrop-blur-sm max-w-md">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-forskale-teal" />
        <div className="flex-1">
          <p className="text-sm text-cal-text-primary" dangerouslySetInnerHTML={{ __html: t("refresh.message") }} />
          <button
            onClick={() => { setVisible(false); onDismissPermanent(); }}
            className="mt-1.5 text-xs font-medium text-forskale-teal hover:underline"
          >
            {t("refresh.dismiss")}
          </button>
        </div>
        <button className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-cal-text-secondary hover:text-cal-text-primary" onClick={() => setVisible(false)}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
