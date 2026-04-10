import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { MeetingCall } from '@/types/meeting';
import { useT } from '@/components/meetInsight/LanguageContext';

export type BrowseMode = 'week' | 'month' | 'all' | 'unviewed';

const PILLS_PER_PAGE = 5;

interface Props {
  browseMode: BrowseMode;
  onBrowseModeChange: (mode: BrowseMode) => void;
  selectedCompany: string;
  onCompanyChange: (company: string) => void;
  companies: string[];
  meetings: MeetingCall[];
  onSearch?: (query: string) => void;
  unreviewedCount?: number;
}

function companyAvgInterest(meetings: MeetingCall[], company: string): number | null {
  const scored = meetings.filter(m => m.company === company && m.interestScore != null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((s, m) => s + (m.interestScore ?? 0), 0) / scored.length);
}

function getDotColor(score: number | null): string {
  if (score == null) return 'bg-muted-foreground/30';
  if (score === 0) return 'bg-[#EF4444]';           // Lost — Red
  if (score >= 90) return 'bg-[#639922]';            // Decision — Green
  if (score >= 80) return 'bg-[#639922]';            // Hard Commitment — Green
  if (score >= 70) return 'bg-[#1D9E75]';            // Validation — Teal
  if (score >= 60) return 'bg-[#1D9E75]';            // Evaluation — Teal
  if (score >= 50) return 'bg-[#1D9E75]';            // Trust — Teal
  if (score >= 40) return 'bg-[#BA7517]';            // Problem Recognition — Amber
  if (score >= 30) return 'bg-[#BA7517]';            // Interest — Amber
  if (score >= 20) return 'bg-[#E97B1E]';            // Curiosity — Orange
  return 'bg-[#EF4444]';                             // Attention — Red/Orange
}

function getPillStyle(score: number | null, isActive: boolean) {
  if (!isActive) return 'bg-card text-muted-foreground border-border hover:bg-accent';
  if (score == null) return 'bg-card text-muted-foreground border-border';
  if (score === 0) return 'bg-red-500/10 text-red-700 border-red-500/40';
  if (score >= 80) return 'bg-[#EAF3DE] text-[#27500A] border-[rgba(59,109,17,0.4)]';
  if (score >= 50) return 'bg-[#E1F5EE] text-[#085041] border-[rgba(15,110,86,0.4)]';
  if (score >= 30) return 'bg-[#FAEEDA] text-[#633806] border-[rgba(186,117,23,0.4)]';
  if (score >= 20) return 'bg-[#FEF0E0] text-[#7A3D06] border-[rgba(233,123,30,0.4)]';
  return 'bg-red-500/10 text-red-700 border-red-500/40';
}

export function BrowseNav({
  browseMode,
  onBrowseModeChange,
  selectedCompany,
  onCompanyChange,
  companies,
  meetings,
  onSearch,
  unreviewedCount = 0,
}: Props) {
  const t = useT();

  const [companyPage, setCompanyPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const totalPages = Math.ceil(companies.length / PILLS_PER_PAGE);
  const visibleCompanies = companies.slice(
    companyPage * PILLS_PER_PAGE,
    companyPage * PILLS_PER_PAGE + PILLS_PER_PAGE
  );
  const showPagination = companies.length > PILLS_PER_PAGE;

  useEffect(() => {
    setCompanyPage(0);
  }, [companies.length]);

  const modes: { id: BrowseMode; label: string }[] = [
    { id: 'week', label: t('browse.thisWeek') },
    { id: 'month', label: t('browse.thisMonth') },
    { id: 'all', label: t('browse.allHistory') },
  ];

  return (
    <div className="space-y-3">
      {/* Row A — Browse mode with search */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {t('browse.browse')}
          </p>

          {searchActive ? (
            <div className="flex items-center gap-1.5 bg-card border border-[hsl(var(--forskale-teal)/0.5)] rounded-lg px-2.5 py-1.5 w-56">
              <Search className="h-3.5 w-3.5 text-[hsl(var(--forskale-teal))] flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder={t('browse.searchPlaceholder')}
                className="text-[12px] bg-transparent border-none outline-none flex-1 min-w-0 text-foreground placeholder:text-muted-foreground"
              />
              <button
                className="flex-shrink-0 p-0.5"
                onClick={() => {
                  setSearchQuery('');
                  setSearchActive(false);
                  onSearch?.('');
                }}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchActive(true)}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-[hsl(var(--forskale-teal))] px-2.5 py-1 rounded-lg border border-border hover:border-[hsl(var(--forskale-teal)/0.3)] hover:bg-[hsl(var(--forskale-teal)/0.06)] transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              {t('browse.search')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onBrowseModeChange(m.id)}
              className={[
                'inline-flex items-center rounded-full text-[12px] font-medium px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap',
                browseMode === m.id
                  ? 'bg-[#E1F5EE] text-[#085041] border-[#1D9E75]'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}

          {/* Unviewed insights button with glowing red dot */}
          <button
            onClick={() => onBrowseModeChange('unviewed')}
            className={[
              'inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap',
              browseMode === 'unviewed'
                ? 'bg-destructive/10 text-destructive border-destructive/40'
                : 'bg-card text-muted-foreground border-border hover:bg-accent',
            ].join(' ')}
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            {t('browse.unviewedInsights')}
            <span className="text-[10px] opacity-70">({unreviewedCount})</span>
          </button>
        </div>
      </div>

      {/* Row B — Companies */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
          {t('browse.companies')}
        </p>

        {/* Pills row with pagination */}
        <div className="flex items-center gap-2">
          {/* Fixed-width pill strip */}
          <div
            className="flex items-center gap-2 overflow-hidden"
            style={{ width: '680px', minWidth: '680px', maxWidth: '680px' }}
          >
            {/* All pill */}
            <button
              onClick={() => onCompanyChange('all')}
              className={[
                'inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap flex-shrink-0',
                selectedCompany === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent',
              ].join(' ')}
            >
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30 flex-shrink-0" />
              {t('tabs.allCompanies')}
            </button>

            {visibleCompanies.map((c) => {
              const avg = companyAvgInterest(meetings, c);
              const count = meetings.filter(m => m.company === c).length;
              const isActive = selectedCompany === c;
              return (
                <button
                  key={c}
                  onClick={() => onCompanyChange(c)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full text-[12px] font-medium px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap flex-shrink-0',
                    getPillStyle(avg, isActive),
                  ].join(' ')}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? getDotColor(avg) : 'bg-muted-foreground/30'}`} />
                  {c}
                  <span className="text-[10px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Arrows */}
          {showPagination && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setCompanyPage(p => Math.max(0, p - 1))}
                disabled={companyPage === 0}
                className="h-6 w-6 rounded-md bg-[hsl(var(--forskale-teal)/0.1)] border border-[hsl(var(--forskale-teal)/0.3)] flex items-center justify-center text-[hsl(var(--forskale-teal))] hover:bg-[hsl(var(--forskale-teal)/0.2)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCompanyPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={companyPage >= totalPages - 1}
                className="h-6 w-6 rounded-md bg-[hsl(var(--forskale-teal)/0.1)] border border-[hsl(var(--forskale-teal)/0.3)] flex items-center justify-center text-[hsl(var(--forskale-teal))] hover:bg-[hsl(var(--forskale-teal)/0.2)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />
    </div>
  );
}
