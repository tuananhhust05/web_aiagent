import { useState } from 'react';
import {
  Sparkles, Target, Brain, ArrowRight, Copy, Check,
  GitBranch, ExternalLink, Zap, Shield, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StrategyAnalysisResult } from './types';

interface Props {
  result: StrategyAnalysisResult;
  companyName: string;
  onClose: () => void;
}

const productAreaIcons: Record<string, React.ReactNode> = {
  'Meeting Intelligence': <Brain className="h-3.5 w-3.5" />,
  'Meeting Insight': <Zap className="h-3.5 w-3.5" />,
  'Performance': <Target className="h-3.5 w-3.5" />,
  'QnA Engine': <BookOpen className="h-3.5 w-3.5" />,
  'Action Ready': <ArrowRight className="h-3.5 w-3.5" />,
};

export default function StrategyResultPanel({ result, companyName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.methodology.copyReadyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = result.score >= 75
    ? 'text-emerald-400'
    : result.score >= 55
      ? 'text-amber-400'
      : 'text-rose-400';

  const scoreBg = result.score >= 75
    ? 'from-emerald-500/20 to-emerald-500/5'
    : result.score >= 55
      ? 'from-amber-500/20 to-amber-500/5'
      : 'from-rose-500/20 to-rose-500/5';

  const difficultyLabel = result.score >= 75 ? 'Favorable' : result.score >= 55 ? 'Moderate' : 'Challenging';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[hsl(222,47%,8%)] text-white shadow-2xl">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_35%)]" />

      <div className="relative p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">AI Strategy Result</p>
            <h3 className="mt-1 text-lg font-bold">{companyName}</h3>
          </div>
          <div className={cn("rounded-xl bg-gradient-to-b px-4 py-2.5 text-center", scoreBg)}>
            <div className={cn("text-3xl font-bold", scoreColor)}>{result.score}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{difficultyLabel}</div>
          </div>
        </div>

        {/* Strategic verdict */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">Strategic Verdict</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{result.verdict}</p>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">{result.summary}</p>
        </div>

        {/* Methodology stack */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">Methodology Stack</span>
          </div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 text-sm font-bold text-cyan-300">
              {result.methodology.primary.name}
            </span>
            {result.methodology.secondary.map(m => (
              <span key={m.id} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                + {m.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-300 italic">"{result.methodology.primary.shortDescription}"</p>
          {result.methodology.rationale.map((r, i) => (
            <p key={i} className="mt-1.5 text-xs text-slate-400 flex items-start gap-1.5">
              <span className="text-cyan-400 mt-0.5">→</span> {r}
            </p>
          ))}
          {result.methodology.primary.source === 'external' && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
              <ExternalLink className="h-3 w-3" />
              <span>Enriched with internet-visible methodology research</span>
            </div>
          )}
        </div>

        {/* Next actions */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <Target className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">Immediate Next Moves</span>
          </div>
          <div className="space-y-2">
            {result.nextActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <p className="text-slate-200">{action}</p>
              </div>
            ))}
          </div>
        </div>

        {/* If/then branches */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <GitBranch className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">Decision Branches</span>
          </div>
          <div className="space-y-2.5">
            {result.futureBranches.map((branch, i) => (
              <div key={i} className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
                <p className="text-xs text-slate-300"><span className="font-semibold text-amber-400">IF</span> {branch.if}</p>
                <p className="text-xs text-slate-400 mt-1"><span className="font-semibold text-emerald-400">THEN</span> {branch.then}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Copy-ready message */}
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-cyan-300/70">Copy-ready note</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{result.methodology.copyReadyMessage}</p>
        </div>

        {/* Deeper links */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">For further analysis, refer to:</p>
          <div className="flex flex-wrap gap-2">
            {result.deeperLinks.map((link) => (
              <button
                key={link.productArea}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:border-cyan-400/20 transition-all"
              >
                {productAreaIcons[link.productArea]}
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
            <ArrowRight className="h-4 w-4" />
            Push to Action Ready
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

