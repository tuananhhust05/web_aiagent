import { TrendingUp, ThumbsUp, Zap, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { mockMetrics, mockCoachWell, mockCoachImprove } from "@/data/mockData";

const statusColor = (rating: string) => {
  if (rating === "Great!") return "text-status-great";
  if (rating === "Okay") return "text-status-okay";
  return "text-status-needs-work";
};

const MetricCard = ({ label, rating, detail }: { label: string; rating: string; detail: string }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-300 shadow-card hover:border-forskale-teal hover:shadow-card-md hover:-translate-y-0.5",
        expanded && "border-forskale-teal forskale-gradient-subtle shadow-card-md",
      )}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[80px]">
        <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
        <span className={cn("text-base font-bold font-heading", statusColor(rating))}>{rating}</span>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  );
};

const FeedbackCard = ({
  title,
  description,
  accentColor,
}: {
  title: string;
  description: string;
  accentColor: "green" | "cyan";
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 transition-all duration-300 shadow-card hover:border-forskale-teal hover:shadow-card-md hover:-translate-y-0.5">
      <div className="flex gap-3">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
            accentColor === "green" ? "bg-forskale-green" : "bg-forskale-cyan",
          )}
        />
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground leading-tight mb-1.5">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

const FeedbackTab = () => {
  return (
    <div className="space-y-8">
      {/* Performance Metrics */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-4 w-4 text-forskale-teal" />
            <h2 className="text-lg font-heading font-bold text-foreground">Performance Metrics</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg forskale-gradient-subtle border border-[hsl(var(--forskale-teal)/0.2)] text-xs font-semibold text-forskale-teal">
              <Sparkles className="h-3.5 w-3.5" />
              80% call quality
            </span>
            {/* <button className="px-3 py-1.5 forskale-gradient-bg text-white text-xs font-semibold rounded-lg shadow-[0_2px_8px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_hsl(var(--forskale-green)/0.4)] transition-all">
              Analyze feedback
            </button> */}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockMetrics.map((m, i) => (
            <MetricCard key={i} label={m.label} rating={m.rating} detail={m.value || m.description} />
          ))}
        </div>
      </section>

      {/* AI Sales Coach feedback */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <Sparkles className="h-4 w-4 text-forskale-teal" />
          <h2 className="text-lg font-heading font-bold text-foreground">AI Sales Coach feedback</h2>
        </div>

        {/* What you did well */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="h-3.5 w-3.5 text-forskale-green" />
            <span className="text-[15px] font-semibold text-foreground">What you did well</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockCoachWell.map((item, i) => (
              <FeedbackCard key={i} title={item.title} description={item.description} accentColor="green" />
            ))}
          </div>
        </div>

        {/* Where you can improve */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-3.5 w-3.5 text-forskale-cyan" />
            <span className="text-[15px] font-semibold text-foreground">Where you can improve</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockCoachImprove.map((item, i) => (
              <FeedbackCard key={i} title={item.title} description={item.description} accentColor="cyan" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeedbackTab;
