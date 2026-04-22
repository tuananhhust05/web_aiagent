import { HelpCircle } from "lucide-react";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";

interface Props {
  deal: CompanyDeal;
}

export default function WhyThisStage({ deal }: Props) {
  if (deal.whyThisStage.length === 0) return null;
  const cogState = getCognitiveState(deal.interestLevel);

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
        <h2 className="text-sm font-bold text-foreground">
          Why {deal.status === 'closed_lost' ? 'the Deal Was Lost' :
               deal.status === 'closed_won' ? 'the Deal Was Won' :
               `This Deal Is in ${cogState.name}`}
        </h2>
      </div>
      <div className="space-y-1.5">
        {deal.whyThisStage.map((reason, i) => (
          <div key={i} className="flex items-start gap-2.5 text-[13px]">
            <span className="text-[hsl(var(--forskale-teal))] mt-0.5 flex-shrink-0">→</span>
            <span className="text-foreground leading-relaxed">{reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

