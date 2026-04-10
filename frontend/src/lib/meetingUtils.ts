import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { MeetingCall, DateGroup, CompanyTimeline, DashboardStats, CognitiveState } from '@/types/meeting';

/* ── Date helpers ── */

export function getDateLabel(isoDate: string): string {
  const d = parseISO(isoDate);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

export function getDateKey(isoDate: string): string {
  return format(parseISO(isoDate), 'yyyy-MM-dd');
}

export function groupMeetingsByDate(meetings: MeetingCall[]): DateGroup[] {
  const map = new Map<string, MeetingCall[]>();
  for (const m of meetings) {
    const key = getDateKey(m.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
  return sortedKeys.map((key) => {
    const groupMeetings = map.get(key)!.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return {
      label: getDateLabel(groupMeetings[0].date),
      dateKey: key,
      meetings: groupMeetings,
      expanded: false,
      freshInsightCount: groupMeetings.filter(m => m.freshInsight === true).length,
    };
  });
}

export function buildCompanyTimelines(meetings: MeetingCall[]): CompanyTimeline[] {
  const map = new Map<string, MeetingCall[]>();
  for (const m of meetings) {
    if (!map.has(m.company)) map.set(m.company, []);
    map.get(m.company)!.push(m);
  }
  return Array.from(map.entries())
    .filter(([, calls]) => calls.length >= 2)
    .map(([company, calls]) => {
      const sorted = calls.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const first = format(parseISO(sorted[0].date), 'MMM d, yyyy');
      const last = format(parseISO(sorted[sorted.length - 1].date), 'MMM d, yyyy');
      return {
        company,
        meetings: sorted,
        dateRange: first === last ? first : `${first} – ${last}`,
      };
    });
}

export function computeStats(meetings: MeetingCall[]): DashboardStats {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const weekMeetings = meetings.filter((m) => new Date(m.date) >= cutoff);

  const scored = weekMeetings.filter((m) => m.interestScore != null);
  const avgInterest = scored.length > 0
    ? Math.round(scored.reduce((sum, m) => sum + (m.interestScore ?? 0), 0) / scored.length)
    : 0;

  return {
    totalThisWeek: weekMeetings.length,
    needsStrategy: meetings.filter((m) => m.strategizeNotDone).length,
    unreviewedInsights: meetings.filter((m) => m.insightUnread).length,
    avgInterest,
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function companyInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Cognitive State System ── */

export interface CognitiveStateInfo {
  state: CognitiveState;
  label: string;
  range: string;
  color: string;       // hex color
  bgClass: string;
  textClass: string;
  borderClass: string;
  barClass: string;
}

const COGNITIVE_STATES: { min: number; max: number; state: CognitiveState; label: string; range: string; color: string }[] = [
  { min: 0,  max: 0,   state: 'Lost',                label: 'Lost',                range: '0%',      color: '#EF4444' },
  { min: 1,  max: 20,  state: 'Attention',            label: 'Attention',           range: '10-20%',  color: '#F97316' },
  { min: 21, max: 30,  state: 'Curiosity',            label: 'Curiosity',           range: '20-30%',  color: '#FB923C' },
  { min: 31, max: 40,  state: 'Interest',             label: 'Interest',            range: '30-40%',  color: '#F59E0B' },
  { min: 41, max: 50,  state: 'Problem Recognition',  label: 'Problem Recognition', range: '40-50%',  color: '#FBBF24' },
  { min: 51, max: 60,  state: 'Trust',                label: 'Trust',               range: '50-60%',  color: '#14B8A6' },
  { min: 61, max: 70,  state: 'Evaluation',           label: 'Evaluation',          range: '60-70%',  color: '#0D9488' },
  { min: 71, max: 80,  state: 'Validation',           label: 'Validation',          range: '70-80%',  color: '#0F766E' },
  { min: 81, max: 90,  state: 'Hard Commitment',      label: 'Hard Commitment',     range: '80-90%',  color: '#22C55E' },
  { min: 91, max: 100, state: 'Decision',             label: 'Decision',            range: '90%+',    color: '#16A34A' },
];

export function getCognitiveState(score: number | null): CognitiveStateInfo {
  if (score == null) {
    return {
      state: 'Not Scored',
      label: 'Not Scored',
      range: '—',
      color: '#6B7280',
      bgClass: 'bg-gray-500/10',
      textClass: 'text-gray-400',
      borderClass: 'border-gray-500/30',
      barClass: 'bg-gray-400',
    };
  }

  const entry = COGNITIVE_STATES.find((s) => score >= s.min && score <= s.max)
    ?? COGNITIVE_STATES[0];

  return {
    state: entry.state,
    label: entry.label,
    range: entry.range,
    color: entry.color,
    bgClass: `bg-[${entry.color}]/10`,
    textClass: `text-[${entry.color}]`,
    borderClass: `border-[${entry.color}]/30`,
    barClass: `bg-[${entry.color}]`,
  };
}

export function isLowInterest(score: number | null): boolean {
  return score != null && score < 40;
}

export function isWon(score: number | null): boolean {
  return score != null && score >= 91;
}

export function isLost(score: number | null): boolean {
  return score != null && score === 0;
}

/* ── Status colors ── */

export const STATUS_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  Evaluated:  { bg: 'bg-[hsl(var(--badge-green-bg))]',  text: 'text-status-great', border: 'border-[hsl(var(--forskale-green)/0.3)]' },
  Pending:    { bg: 'bg-[hsl(var(--badge-cyan-bg))]',   text: 'text-[hsl(var(--forskale-cyan))]', border: 'border-[hsl(var(--forskale-cyan)/0.3)]' },
  Processing: { bg: 'bg-amber-500/10',                   text: 'text-amber-500',   border: 'border-amber-500/30' },
};

export const COMPANY_AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  Lavazza:      { bg: 'bg-amber-500/15',   text: 'text-amber-600' },
  'Atlas Corp': { bg: 'bg-[hsl(var(--forskale-blue)/0.15)]', text: 'text-[hsl(var(--forskale-blue))]' },
  Nestlé:       { bg: 'bg-[hsl(var(--forskale-teal)/0.15)]', text: 'text-[hsl(var(--forskale-teal))]' },
  Unilever:     { bg: 'bg-[hsl(var(--forskale-green)/0.15)]', text: 'text-[hsl(var(--forskale-green))]' },
  Ferrero:      { bg: 'bg-red-500/15',     text: 'text-red-600' },
};

export function avatarColors(company: string) {
  return COMPANY_AVATAR_COLORS[company] ?? { bg: 'bg-muted', text: 'text-muted-foreground' };
}

export function getUniqueCompanies(meetings: MeetingCall[]): string[] {
  return [...new Set(meetings.map((m) => m.company))].sort();
}
