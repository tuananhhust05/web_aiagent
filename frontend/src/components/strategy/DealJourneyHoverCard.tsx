import type { CompanyDeal } from "@/data/mockStrategyData";
import { getStageBgColor, getStageTextColor } from "@/lib/stageColors";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  deal: CompanyDeal;
}

export default function DealJourneyHoverCard({ deal }: Props) {
  const journey = deal.interestJourney;
  if (!journey || journey.length === 0) return null;

  const width = 280;
  const height = 70;
  const padX = 12;
  const padY = 12;

  const points = journey.map((p, i) => {
    const x = padX + (i / Math.max(1, journey.length - 1)) * (width - padX * 2);
    const y = height - padY - (p.interestLevel / 100) * (height - padY * 2);
    return { x, y, level: p.interestLevel, point: p };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  const first = journey[0].interestLevel;
  const last = journey[journey.length - 1].interestLevel;
  const delta = last - first;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? "text-emerald-500" : delta < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="w-[300px] p-3 rounded-lg border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Interest Journey</p>
          <p className="text-xs font-semibold text-foreground truncate">{deal.company}</p>
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-bold", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          {delta > 0 ? "+" : ""}{delta}%
        </div>
      </div>

      <svg width={width} height={height} className="w-full block">
        <defs>
          <linearGradient id={`grad-${deal.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--forskale-teal))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--forskale-teal))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${deal.id})`} />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--forskale-teal))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-in fade-in-0 duration-500"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              className={cn(getStageBgColor(p.level).replace("bg-", "fill-"))}
              fill="currentColor"
              stroke="hsl(var(--card))"
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-1.5 px-1">
        {journey.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 min-w-0" style={{ flex: 1 }}>
            <span className={cn("text-[9px] font-bold leading-none", getStageTextColor(p.interestLevel))}>
              {p.interestLevel}%
            </span>
            <span className="text-[8px] text-muted-foreground leading-none truncate max-w-full">
              {p.date}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}

