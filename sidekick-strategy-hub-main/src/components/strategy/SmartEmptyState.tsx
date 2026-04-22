import { useMemo } from 'react';
import { Sparkles, Target, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import type { CompanyDeal } from '@/data/mockStrategyData';
import { buildEmptyStateInsights, buildStrategicBriefingBanner, pillStyles } from '@/lib/dealNarrative';

interface Props {
  deals: CompanyDeal[];
  onSelectDeal: (id: string) => void;
  userName?: string;
}

const toneIcon = {
  critical: AlertTriangle,
  warning: Target,
  positive: TrendingUp,
} as const;

const toneStyle = {
  critical: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-orange-500/30 bg-orange-500/5 text-orange-500',
  positive: 'border-[hsl(var(--status-great)/0.3)] bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]',
} as const;

export default function SmartEmptyState({ deals, onSelectDeal, userName = 'Andrea' }: Props) {
  const insights = buildEmptyStateInsights(deals);
  const { narrative, pills } = useMemo(() => buildStrategicBriefingBanner(userName, deals), [userName, deals]);

  return (
    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
      {/* FORSKALE AI badge top-left */}
      <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.08)] backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--forskale-teal))] animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.14em] text-[hsl(var(--forskale-teal))]">FORSKALE AI</span>
      </div>

      {/* Subtle aurora */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-teal) / 0.08) 0%, transparent 70%)',
            animation: 'wow-aurora 16s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-cyan) / 0.07) 0%, transparent 70%)',
            animation: 'wow-aurora 20s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        <div
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--forskale-teal)/0.10)] border border-[hsl(var(--forskale-teal)/0.3)] mb-4"
          style={{ animation: 'sparkle-glow 2.4s ease-in-out infinite' }}
        >
          <Sparkles
            className="h-6 w-6 text-[hsl(var(--forskale-teal))]"
            style={{ animation: 'sparkle-spin 6s linear infinite' }}
          />
        </div>

        {/* Personalization narrative */}
        <p className="text-[15px] leading-relaxed text-foreground max-w-2xl mx-auto mb-3">
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
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {pills.map((p) => (
              <span
                key={p.label}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pillStyles[p.tone]}`}
              >
                {p.label}
              </span>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-foreground mb-2"></h2>
        <p className="text-sm text-muted-foreground mb-8"></p>

        {insights.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 text-left">
            {insights.map(i => {
              const Icon = toneIcon[i.tone];
              return (
                <button
                  key={i.dealId}
                  onClick={() => onSelectDeal(i.dealId)}
                  className="group w-[260px] rounded-xl border border-border bg-card hover:border-[hsl(var(--forskale-teal)/0.4)] hover:shadow-lg transition-all p-4 text-left"
                >
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border mb-3 ${toneStyle[i.tone]}`}>
                    <Icon className="h-3 w-3" />
                    {i.label}
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">{i.company}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{i.insight}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--forskale-teal))] group-hover:gap-1.5 transition-all">
                    Open strategy
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
