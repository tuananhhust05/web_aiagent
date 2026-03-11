import { AlertTriangle, ChevronRight } from "lucide-react";

interface UrgentItem {
  label: string;
}

const urgentItems: UrgentItem[] = [
  { label: "Reply to: Invito: Atlas DEMO - Security" },
  { label: "Reply to: Evento annullato" },
  { label: "Reply to: Invito: Atlas DEMO - Iun 2" },
  { label: "Reply to: For you in Ritam's Space" },
];

const UrgentBanner = () => {
  return (
    <div className="bg-atlas-urgent-light border border-atlas-urgent-border rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-atlas-urgent" />
        <span className="text-sm font-semibold text-atlas-urgent">
          Attention Required
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {urgentItems.map((item, i) => (
          <button
            key={i}
            className="flex items-center gap-1.5 bg-card border border-atlas-urgent-border rounded-full px-3 py-1 text-xs text-foreground hover:border-atlas-urgent transition-colors"
          >
            <AlertTriangle size={11} className="text-atlas-urgent" />
            <span className="truncate max-w-[160px]">{item.label}</span>
          </button>
        ))}
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Show more <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default UrgentBanner;
