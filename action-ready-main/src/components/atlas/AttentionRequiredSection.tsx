import { AlertTriangle, Clock } from "lucide-react";
import { attentionRequiredItems } from "@/data/mockActions";

const AttentionRequiredSection = () => {
  return (
    <section className="rounded-[1.75rem] border border-atlas-urgent-border bg-atlas-urgent-light p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-atlas-urgent">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-atlas-urgent">Attention Required</h2>
              <span className="rounded-full border border-atlas-urgent-border bg-card px-2.5 py-1 text-xs font-semibold text-atlas-urgent">
                {attentionRequiredItems.length}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tasks older than 5 days stay visible here for quick intervention.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {attentionRequiredItems.map((item) => (
            <button
              key={item.id}
              className="inline-flex items-center gap-2 rounded-full border border-atlas-urgent-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:border-atlas-urgent"
            >
              <Clock size={12} className="text-atlas-urgent" />
              <span className="max-w-[28ch] truncate">{item.title}</span>
              <span className="text-atlas-urgent">({item.overdueLabel})</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AttentionRequiredSection;
