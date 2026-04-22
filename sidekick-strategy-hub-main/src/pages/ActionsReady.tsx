import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, TrendingUp, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { companyDeals } from "@/data/mockStrategyData";
import { LanguageProvider } from "@/contexts/LanguageContext";

const priorityBadge: Record<string, string> = {
  Critical: "bg-destructive/10 text-destructive",
  High: "bg-orange-500/10 text-orange-500",
  Medium: "bg-[hsl(var(--badge-cyan-bg))] text-[hsl(var(--forskale-cyan))]",
  Low: "bg-muted text-muted-foreground",
};

const priorityDot: Record<string, string> = {
  Critical: "bg-destructive",
  High: "bg-orange-500",
  Medium: "bg-[hsl(var(--forskale-cyan))]",
  Low: "bg-muted-foreground",
};

function ActionsReadyInner() {
  const navigate = useNavigate();

  const tasks = companyDeals
    .filter((d) => d.status === "ongoing_negotiation" || d.status === "first_meeting")
    .flatMap((d) =>
      d.actionItems.map((item) => ({ ...item, company: d.company, dealId: d.id })),
    );

  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 } as Record<string, number>;
  tasks.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2 mb-1">
          <CheckSquare className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
          <h1 className="text-xl font-bold text-foreground">Actions Ready</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""} ready to execute across active deals.
        </p>

        <div className="space-y-2">
          {tasks.map((item) => (
            <div
              key={`${item.dealId}-${item.id}`}
              className="rounded-lg border border-border bg-card p-3 shadow-card"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold mt-0.5",
                    priorityDot[item.priority],
                  )}
                >
                  {item.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {item.company}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-px rounded text-[9px] font-medium",
                        priorityBadge[item.priority],
                      )}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-0.5 text-[hsl(var(--forskale-teal))] font-medium">
                      <TrendingUp className="h-3 w-3" /> {item.interestImpact}
                    </span>
                    {item.owner && <span>{item.owner}</span>}
                    {item.deadline && (
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" /> {item.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActionsReady() {
  return (
    <LanguageProvider>
      <ActionsReadyInner />
    </LanguageProvider>
  );
}
