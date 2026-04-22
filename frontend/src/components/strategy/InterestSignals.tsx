import { cn } from "@/lib/utils";
import type { InterestSignal } from "@/data/mockStrategyData";

interface Props {
  signals: InterestSignal[];
  interestLevel: number;
}

interface TimelineEntry {
  date: string;
  tone: "positive" | "risk" | "neutral";
  label: string;
  description: string;
}

const timeline: TimelineEntry[] = [
  {
    date: "Apr 28",
    tone: "risk",
    label: "Interest risk",
    description:
      "Competitor evaluation mentioned, introducing decision friction and comparison pressure.",
  },
  {
    date: "Apr 18",
    tone: "positive",
    label: "Interest increased",
    description:
      "CFO formally approved budget allocation, demonstrating organizational commitment to the solution.",
  },
  {
    date: "Apr 5",
    tone: "positive",
    label: "Interest increased",
    description:
      "CTO and development team joined demo and confirmed the product addresses their specific technical needs.",
  },
  {
    date: "Mar 22",
    tone: "neutral",
    label: "Initial engagement",
    description:
      "Prospect shared operational challenges and asked detailed questions about API capabilities.",
  },
];

const dotColor: Record<TimelineEntry["tone"], string> = {
  positive: "bg-[hsl(var(--status-great))]",
  risk: "bg-orange-500",
  neutral: "bg-muted-foreground",
};

const labelColor: Record<TimelineEntry["tone"], string> = {
  positive: "text-[hsl(var(--status-great))]",
  risk: "text-orange-500",
  neutral: "text-muted-foreground",
};

export default function InterestSignals(_props: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-base font-bold text-foreground mb-1">Interest Signals</h2>
      <p className="text-xs text-muted-foreground mb-5">
        Key moments that shaped the current deal momentum
      </p>

      <ol className="relative space-y-5 pl-5">
        <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" aria-hidden />
        {timeline.map((entry, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-card",
                dotColor[entry.tone],
              )}
            />
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-medium">{entry.date}</span>
              <span className={cn("text-xs font-semibold", labelColor[entry.tone])}>
                {entry.label}
              </span>
            </div>
            <p className="text-[13px] text-foreground leading-relaxed">{entry.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

