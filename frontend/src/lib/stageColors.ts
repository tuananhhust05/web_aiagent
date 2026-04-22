// Psychology-based color mapping: colors tied to cognitive stage names, not raw percentages
// Attention = neutral, Curiosity = orange, Trust = green, Commitment = deep green, Lost = red

import { getCognitiveState } from "@/data/mockStrategyData";

export function getStageTextColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'text-muted-foreground';
    case 'Curiosity': return 'text-orange-500';
    case 'Interest': return 'text-orange-400';
    case 'Problem Recognition': return 'text-amber-500';
    case 'Trust': return 'text-[hsl(var(--forskale-teal))]';
    case 'Evaluation': return 'text-[hsl(var(--forskale-teal))]';
    case 'Validation': return 'text-[hsl(var(--status-great))]';
    case 'Commitment Intent': return 'text-emerald-500';
    case 'Decision': return 'text-emerald-600';
    default: return 'text-destructive';
  }
}

export function getStageBgColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'bg-muted-foreground';
    case 'Curiosity': return 'bg-orange-500';
    case 'Interest': return 'bg-orange-400';
    case 'Problem Recognition': return 'bg-amber-500';
    case 'Trust': return 'bg-[hsl(var(--forskale-teal))]';
    case 'Evaluation': return 'bg-[hsl(var(--forskale-teal))]';
    case 'Validation': return 'bg-[hsl(var(--status-great))]';
    case 'Commitment Intent': return 'bg-emerald-500';
    case 'Decision': return 'bg-emerald-600';
    default: return 'bg-destructive';
  }
}

export function getStageStrokeColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'stroke-muted-foreground';
    case 'Curiosity': return 'stroke-orange-500';
    case 'Interest': return 'stroke-orange-400';
    case 'Problem Recognition': return 'stroke-amber-500';
    case 'Trust': return 'stroke-[hsl(var(--forskale-teal))]';
    case 'Evaluation': return 'stroke-[hsl(var(--forskale-teal))]';
    case 'Validation': return 'stroke-[hsl(var(--status-great))]';
    case 'Commitment Intent': return 'stroke-emerald-500';
    case 'Decision': return 'stroke-emerald-600';
    default: return 'stroke-destructive';
  }
}

export function getStageBorderColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'border-muted-foreground/30';
    case 'Curiosity': return 'border-orange-500/30';
    case 'Interest': return 'border-orange-400/30';
    case 'Problem Recognition': return 'border-amber-500/30';
    case 'Trust': return 'border-[hsl(var(--forskale-teal)/0.3)]';
    case 'Evaluation': return 'border-[hsl(var(--forskale-teal)/0.3)]';
    case 'Validation': return 'border-[hsl(var(--status-great)/0.3)]';
    case 'Commitment Intent': return 'border-emerald-500/30';
    case 'Decision': return 'border-emerald-600/30';
    default: return 'border-destructive/30';
  }
}

export function getStageSurfaceColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'border-muted-foreground/20 bg-muted/30';
    case 'Curiosity': return 'border-orange-500/30 bg-orange-500/[0.04]';
    case 'Interest': return 'border-orange-400/30 bg-orange-400/[0.04]';
    case 'Problem Recognition': return 'border-amber-500/30 bg-amber-500/[0.04]';
    case 'Trust': return 'border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.04)]';
    case 'Evaluation': return 'border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.04)]';
    case 'Validation': return 'border-[hsl(var(--status-great)/0.3)] bg-[hsl(var(--forskale-green)/0.04)]';
    case 'Commitment Intent': return 'border-emerald-500/30 bg-emerald-500/[0.04]';
    case 'Decision': return 'border-emerald-600/30 bg-emerald-600/[0.04]';
    default: return 'border-destructive/30 bg-destructive/[0.04]';
  }
}

export function getStageLeftBorderColor(level: number): string {
  const name = getCognitiveState(level).name;
  switch (name) {
    case 'Attention': return 'border-l-muted-foreground';
    case 'Curiosity': return 'border-l-orange-500';
    case 'Interest': return 'border-l-orange-400';
    case 'Problem Recognition': return 'border-l-amber-500';
    case 'Trust': return 'border-l-[hsl(var(--forskale-teal))]';
    case 'Evaluation': return 'border-l-[hsl(var(--forskale-teal))]';
    case 'Validation': return 'border-l-[hsl(var(--status-great))]';
    case 'Commitment Intent': return 'border-l-emerald-500';
    case 'Decision': return 'border-l-emerald-600';
    default: return 'border-l-destructive';
  }
}
