import { useMemo } from 'react';
import { Activity, AlertTriangle, Brain } from 'lucide-react';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { buildStrategicBriefingBanner, pillStyles } from '@/lib/dealNarrative';

interface Props {
  userName: string;
  deals: CompanyDeal[];
}

export default function PersonalizedAttentionBanner({ userName, deals }: Props) {
  const { narrative, pills } = useMemo(() => buildStrategicBriefingBanner(userName, deals), [userName, deals]);

  const activeCount = deals.filter(d => d.status === 'ongoing_negotiation' || d.status === 'first_meeting').length;
  const criticalCount = deals.reduce(
    (sum, d) => sum + d.actionItems.filter(a => a.priority === 'Critical').length,
    0,
  );

  return (
    <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-card via-card to-[hsl(var(--forskale-teal)/0.04)]">
      {/* Animated subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-teal) / 0.10) 0%, transparent 70%)',
            animation: 'wow-aurora 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-24 right-0 w-[360px] h-[360px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-cyan) / 0.08) 0%, transparent 70%)',
            animation: 'wow-aurora 22s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* AI badge */}
      <div className="absolute top-3 right-4 flex items-center gap-2 z-10">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--forskale-teal))] opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[hsl(var(--forskale-teal))]" />
        </span>
        <span className="text-[11px] font-light tracking-[0.35em] uppercase bg-gradient-to-r from-[hsl(var(--forskale-teal))] via-[hsl(var(--forskale-cyan))] to-[hsl(var(--forskale-teal))] bg-clip-text text-transparent">
          FORSKALE&nbsp;AI
        </span>
      </div>

      <div className="relative px-6 py-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-relaxed text-foreground max-w-3xl">
              {narrative.split(userName).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="font-semibold text-[hsl(var(--forskale-teal))]">{userName}</span>
                  )}
                </span>
              ))}
            </p>

            {pills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {pills.map(p => (
                  <span
                    key={p.label}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pillStyles[p.tone]}`}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[hsl(var(--forskale-teal)/0.12)] text-[hsl(var(--forskale-teal))]">
              <Activity className="h-3 w-3" />
              {activeCount} Active
            </span>
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} Critical
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
