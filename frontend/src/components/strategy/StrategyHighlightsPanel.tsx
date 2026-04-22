import { useMemo } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import type { ParticipantEmailDeal } from '@/components/strategy/types';

interface Props {
  deals: ParticipantEmailDeal[];
  onSelectDeal: (id: string) => void;
  userName?: string;
}

interface HighlightInsight {
  label: string;
  dealId: string;
  company: string;
  insight: string;
  tone: 'critical' | 'warning' | 'positive';
}

interface BannerSummaryPill {
  label: string;
  tone: 'critical' | 'warning' | 'info' | 'positive';
}

interface StrategicBriefingBanner {
  narrative: string;
  pills: BannerSummaryPill[];
}

const toneIcon = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  positive: TrendingUp,
} as const;

const toneStyle = {
  critical: 'border-destructive/30 bg-destructive/5 text-destructive',
  warning: 'border-orange-500/30 bg-orange-500/5 text-orange-500',
  positive: 'border-[hsl(var(--status-great)/0.3)] bg-[hsl(var(--badge-green-bg))] text-[hsl(var(--status-great))]',
} as const;

function getDaysSinceLastMeeting(lastMeetingDate?: string): number {
  if (!lastMeetingDate) return 999;
  const last = new Date(lastMeetingDate);
  const now = new Date();
  const diff = now.getTime() - last.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getInterestVelocity(meetingCount: number, daysSinceLastMeeting: number): number {
  if (meetingCount <= 1 || daysSinceLastMeeting > 14) return 0;
  if (meetingCount >= 5) return 2;
  if (meetingCount >= 3) return 1.5;
  return 1;
}

function buildStrategicBriefingBanner(userName: string, deals: ParticipantEmailDeal[]): StrategicBriefingBanner {
  if (deals.length === 0) {
    return { narrative: '', pills: [] };
  }

  const dealsWithMetrics = deals.map(d => ({
    ...d,
    daysSinceLastMeeting: getDaysSinceLastMeeting(d.lastMeetingDate),
    interestVelocity: getInterestVelocity(d.meetingCount, getDaysSinceLastMeeting(d.lastMeetingDate)),
  }));

  const noChampion = dealsWithMetrics.filter(d => d.meetingCount < 2);
  const earlyStage = dealsWithMetrics.filter(d => d.meetingCount < 3 && d.daysSinceLastMeeting < 14);
  const stalled = dealsWithMetrics.filter(d => d.daysSinceLastMeeting > 7 && d.interestVelocity <= 0.5);
  const fastMoving = dealsWithMetrics.filter(d => d.interestVelocity >= 1.5);

  const fragments: string[] = [];
  const companyName = (deal: ParticipantEmailDeal) => deal.company || deal.email.split('@')[1] || 'Unknown';

  if (noChampion.length >= 2) {
    fragments.push(`${noChampion.slice(0, 2).map(d => companyName(d)).join(' and ')} both need internal champions before momentum disappears.`);
  } else if (noChampion.length === 1) {
    fragments.push(`${companyName(noChampion[0])} needs an internal champion this week.`);
  }

  if (earlyStage.length >= 2) {
    fragments.push(`${earlyStage.length} deals are still in attention mode — focus on curiosity, not pricing.`);
  } else if (earlyStage.length === 1) {
    fragments.push(`${companyName(earlyStage[0])} is early but curiosity is rising.`);
  }

  if (stalled.length > 0 && noChampion.length === 0) {
    fragments.push(`${companyName(stalled[0])} has been silent for ${stalled[0].daysSinceLastMeeting} days — re-engagement window matters.`);
  }

  if (fastMoving.length > 0 && fragments.length < 2) {
    const velocity = fastMoving[0].interestVelocity;
    fragments.push(`${companyName(fastMoving[0])} has the highest momentum increase this week (+${velocity}%/day).`);
  }

  fragments.push('One strong discovery call this week could meaningfully shift the quarter.');

  const narrative = `${userName}, ${fragments.slice(0, 3).join(' ')}`;

  const pills: BannerSummaryPill[] = [];
  if (noChampion.length > 0) pills.push({ label: `${noChampion.length} need champion development`, tone: 'critical' });
  if (earlyStage.length > 0) pills.push({ label: `${earlyStage.length} need discovery focus`, tone: 'info' });
  if (stalled.length > 0) pills.push({ label: `${stalled.length} at risk this week`, tone: 'warning' });
  if (fastMoving.length > 0) pills.push({ label: `${fastMoving.length} accelerating`, tone: 'positive' });

  return { narrative, pills };
}

function buildEmptyStateInsights(deals: ParticipantEmailDeal[]): HighlightInsight[] {
  if (deals.length === 0) return [];

  const companyName = (deal: ParticipantEmailDeal) => deal.company || deal.email.split('@')[1] || 'Unknown';

  const dealsWithMetrics = deals.map(d => ({
    ...d,
    daysSinceLastMeeting: getDaysSinceLastMeeting(d.lastMeetingDate),
    interestVelocity: getInterestVelocity(d.meetingCount, getDaysSinceLastMeeting(d.lastMeetingDate)),
  }));

  const byMeetings = [...dealsWithMetrics].sort((a, b) => b.meetingCount - a.meetingCount);
  const topPriority = byMeetings[0];

  const byRecent = [...dealsWithMetrics].sort((a, b) => {
    if (!a.lastMeetingDate) return 1;
    if (!b.lastMeetingDate) return -1;
    return new Date(b.lastMeetingDate).getTime() - new Date(a.lastMeetingDate).getTime();
  });
  const fastest = byRecent[0];

  const out: HighlightInsight[] = [];

  if (topPriority) {
    out.push({
      label: 'Top priority',
      dealId: topPriority.email,
      company: companyName(topPriority),
      insight: `${companyName(topPriority)} is your most urgent opportunity based on meeting frequency.`,
      tone: 'critical',
    });
  }

  if (fastest && fastest.email !== topPriority?.email) {
    out.push({
      label: 'Fastest growing',
      dealId: fastest.email,
      company: companyName(fastest),
      insight: `${companyName(fastest)} has the highest momentum increase this week (+${fastest.interestVelocity}%/day).`,
      tone: 'positive',
    });
  }

  return out;
}

export default function StrategyHighlightsPanel({ deals, onSelectDeal, userName = 'Andrea' }: Props) {
  const { narrative, pills } = useMemo(() => buildStrategicBriefingBanner(userName, deals), [userName, deals]);
  const insights = useMemo(() => buildEmptyStateInsights(deals), [deals]);

  if (deals.length === 0) {
    return (
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
        <div className="relative z-10 max-w-3xl w-full text-center">
          <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--forskale-teal)/0.10)] border border-[hsl(var(--forskale-teal)/0.3)] mb-4">
            <Sparkles className="h-6 w-6 text-[hsl(var(--forskale-teal))]" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No Meeting Data Yet</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Start having meetings to see strategic insights here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">
      <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.08)] backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--forskale-teal))] animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.14em] text-[hsl(var(--forskale-teal))]">FORSKALE AI</span>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute top-1/3 left-1/4 w-[480px] h-[480px] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-teal) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(hsl(var(--forskale-cyan) / 0.07) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--forskale-teal)/0.10)] border border-[hsl(var(--forskale-teal)/0.3)] mb-4">
          <Sparkles className="h-6 w-6 text-[hsl(var(--forskale-teal))]" />
        </div>

        <p className="text-[15px] leading-relaxed text-foreground max-w-2xl mx-auto mb-3">
          {narrative}
        </p>

        {pills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {pills.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border border-orange-500/30 bg-orange-500/5 text-orange-500"
              >
                {p.label}
              </span>
            ))}
          </div>
        )}

        {insights.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 text-left">
            {insights.map((i) => {
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