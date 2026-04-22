import { Brain } from "lucide-react";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";
import { getStageTextColor, getStageSurfaceColor } from "@/lib/stageColors";

interface Props {
  deal: CompanyDeal;
}

export default function SituationSummary({ deal }: Props) {
  const cogState = getCognitiveState(deal.interestLevel);

  return (
    <div className={`rounded-lg border-2 p-5 ${getStageSurfaceColor(deal.interestLevel)}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <Brain className={`h-4 w-4 ${getStageTextColor(deal.interestLevel)}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <h2 className="text-base font-bold text-foreground">
              {deal.status === 'closed_won' ? 'Deal Won' :
               deal.status === 'closed_lost' ? 'Post-Mortem' :
               cogState.name} Stage
            </h2>
            <span className={`text-sm font-semibold ${getStageTextColor(deal.interestLevel)}`}>
              {deal.interestLevel > 0 ? `${deal.interestLevel}%` : ''}
            </span>
          </div>
          <p className="text-[13px] text-foreground leading-relaxed">
            {deal.situationSummary}
          </p>
        </div>
      </div>
    </div>
  );
}
