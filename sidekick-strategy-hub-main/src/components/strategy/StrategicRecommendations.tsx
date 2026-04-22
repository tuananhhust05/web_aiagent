import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Sparkles, Target, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyDeal } from "@/data/mockStrategyData";
import { getCognitiveState } from "@/data/mockStrategyData";

interface Props {
  deal: CompanyDeal;
}

function Collapsible({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[hsl(var(--forskale-teal))]" />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

const priorityColors: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Medium: 'bg-[hsl(var(--badge-cyan-bg))] text-[hsl(var(--forskale-cyan))] border-[hsl(var(--forskale-cyan)/0.2)]',
};

export default function StrategicRecommendations({ deal }: Props) {
  if (deal.status === 'closed_won' || deal.status === 'closed_lost') return null;

  const nextTarget = deal.interestLevel < 80 ? 80 : 90;
  const nextLabel = nextTarget === 80 ? 'Commitment Intent' : 'Decision';

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-[hsl(var(--forskale-teal))]" />
        <h2 className="text-base font-bold text-foreground">Interest Acceleration Strategy</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Psychological triggers to move from {deal.interestLevel}% → {nextTarget}% ({nextLabel})
      </p>

      {/* Deal Assessment */}
      <div className="rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-teal)/0.05)] to-[hsl(var(--forskale-green)/0.05)] border border-[hsl(var(--forskale-teal)/0.2)] p-4 mb-4">
        <p className="text-sm text-foreground leading-relaxed">{deal.dealAssessment}</p>
      </div>

      {/* What the next level looks like */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 mb-4">
        <p className="text-xs font-bold text-foreground mb-2">What {nextTarget}% ({nextLabel}) Looks Like:</p>
        <div className="text-[10px] text-muted-foreground space-y-1">
          {nextTarget === 80 ? (
            <>
              <p>• They say: "We want to move forward"</p>
              <p>• They say: "Let's figure out implementation details"</p>
              <p>• They say: "When can we start?"</p>
              <p>• Internal alignment: "We're ready to commit"</p>
            </>
          ) : (
            <>
              <p>• No more "what-ifs", only logistics</p>
              <p>• Procurement moving fast, leadership engaged</p>
              <p>• Contracts being signed</p>
            </>
          )}
        </div>
      </div>

      {/* Psychological Triggers to move them */}
      {deal.strategies.length > 0 && (
        <Collapsible title={`Psychological Triggers to Reach ${nextTarget}%`} icon={Target}>
          <div className="space-y-3">
            {deal.strategies.map((s, idx) => (
              <div key={idx} className="rounded-lg border border-border p-4 bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-foreground">{s.title}</span>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border", priorityColors[s.priority])}>
                    {s.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2"><span className="font-medium">Why it works:</span> {s.why}</p>
                <div className="space-y-1 mb-2">
                  {s.howSteps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Timing: {s.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Psychological Approach */}
      {deal.emotionalTriggers.length > 0 && (
        <Collapsible title="Psychological Triggers Deep Dive" icon={Brain} defaultOpen={false}>
          {/* Decision profile */}
          {deal.decisionProfile.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Decision-Making Profile</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {deal.decisionProfile.map((trait) => (
                  <span key={trait.label} className={cn(
                    "inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium border",
                    trait.active
                      ? "bg-[hsl(var(--forskale-teal)/0.1)] text-[hsl(var(--forskale-teal))] border-[hsl(var(--forskale-teal)/0.2)]"
                      : "bg-muted text-muted-foreground border-border",
                  )}>
                    {trait.label}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic">{deal.decisionProfileNote}</p>
            </div>
          )}

          {/* Triggers with detail */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Acceleration Triggers</p>
          <div className="space-y-3 mb-4">
            {deal.emotionalTriggers.map((t) => (
              <div key={t.title} className="rounded-lg border border-border p-3 bg-background">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{t.icon}</span>
                  <span className="text-xs font-semibold text-foreground">{t.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{t.description}</p>
                <div className="space-y-1 mb-2">
                  {t.whatToDo.map((step, si) => (
                    <p key={si} className="text-[10px] text-foreground">• {step}</p>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground"><span className="font-medium text-[hsl(var(--forskale-teal))]">Why it works:</span> {t.whyItWorks}</p>
                <p className="text-[10px] text-muted-foreground"><span className="font-medium">Timing:</span> {t.timing}</p>
              </div>
            ))}
          </div>

          {/* Objection psychology */}
          {deal.objectionPsychology.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Objection Psychology</p>
              <div className="space-y-2">
                {deal.objectionPsychology.map((o, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 bg-background">
                    <p className="text-xs text-foreground mb-1">When they say: <span className="font-semibold">"{o.objection}"</span></p>
                    <p className="text-[10px] text-muted-foreground mb-1">They really mean: {o.rootCause}</p>
                    <div className="rounded bg-[hsl(var(--forskale-green)/0.05)] border border-[hsl(var(--forskale-green)/0.15)] p-2">
                      <p className="text-[10px] text-foreground">
                        <span className="font-medium text-[hsl(var(--status-great))]">Better response: </span>{o.response}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Progression psychology */}
          {deal.progressionNote && (
            <div className="mt-4 rounded-lg bg-gradient-to-r from-[hsl(var(--forskale-teal)/0.05)] to-[hsl(var(--forskale-green)/0.05)] border border-border p-3">
              <p className="text-xs font-semibold text-foreground mb-1">{deal.interestLevel}% → {nextTarget}%</p>
              <p className="text-[11px] text-muted-foreground">{deal.progressionNote}</p>
            </div>
          )}
        </Collapsible>
      )}

      {/* Similar Wins */}
      {deal.similarWins.length > 0 && (
        <Collapsible title="Comparison to Similar Wins" icon={Target} defaultOpen={false}>
          <div className="space-y-3">
            {deal.similarWins.map((sw, i) => (
              <div key={i} className="rounded-lg border border-border p-4 bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Similar to: {sw.company}</span>
                  <span className="text-[10px] text-muted-foreground">{sw.timeline}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Similarities</p>
                    {sw.similarities.map((s, si) => (
                      <p key={si} className="text-[10px] text-foreground">• {s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">What Worked</p>
                    {sw.whatWorked.map((w, wi) => (
                      <p key={wi} className="text-[10px] text-foreground">• {w}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded bg-[hsl(var(--forskale-teal)/0.05)] border border-[hsl(var(--forskale-teal)/0.15)] p-2">
                  <p className="text-[10px] text-foreground">
                    <span className="font-medium text-[hsl(var(--forskale-teal))]">Action: </span>{sw.suggestedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Weekly Trigger Schedule */}
      {deal.weeklyPlan.length > 0 && (
        <Collapsible title="Week-by-Week Trigger Schedule" icon={Calendar} defaultOpen={false}>
          <div className="space-y-4">
            {deal.weeklyPlan.map((week, wi) => (
              <div key={wi}>
                <p className="text-xs font-semibold text-foreground mb-2">{week.weekLabel}</p>
                <div className="space-y-1.5">
                  {week.tasks.map((t, ti) => (
                    <div key={ti} className="flex items-center gap-2 text-xs">
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center", t.done ? "bg-[hsl(var(--status-great))] border-transparent" : "border-border")}>
                        {t.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className="text-muted-foreground w-20">{t.day}</span>
                      <span className="text-foreground">{t.task}</span>
                    </div>
                  ))}
                </div>
                {week.expectedResult && (
                  <p className="text-[10px] font-medium text-[hsl(var(--forskale-teal))] mt-1.5">Expected: {week.expectedResult}</p>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Red Flags */}
      {deal.redFlags.length > 0 && (
        <Collapsible title="Interest Drop Signals to Watch" icon={Flag} defaultOpen={false}>
          <div className="space-y-2">
            {deal.redFlags.map((rf, i) => (
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-semibold text-foreground mb-1">🚩 If {rf.signal}</p>
                <p className="text-[10px] text-muted-foreground">= {rf.meaning}</p>
                <p className="text-[10px] text-foreground mt-1"><span className="font-medium text-[hsl(var(--forskale-teal))]">Response:</span> {rf.response}</p>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
