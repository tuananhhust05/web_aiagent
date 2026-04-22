import { ShieldAlert } from 'lucide-react';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { getAvoidMoves } from '@/lib/dealNarrative';

interface Props {
  deal: CompanyDeal;
}

export default function AvoidMoves({ deal }: Props) {
  const moves = getAvoidMoves(deal);
  if (moves.length === 0) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <span className="text-xs font-bold text-destructive uppercase tracking-wider">Avoid These Moves</span>
      </div>
      <ul className="space-y-1.5">
        {moves.map((m, i) => (
          <li key={i} className="text-sm text-foreground/90 flex gap-2">
            <span className="text-destructive shrink-0">✕</span>
            <span>{m}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
