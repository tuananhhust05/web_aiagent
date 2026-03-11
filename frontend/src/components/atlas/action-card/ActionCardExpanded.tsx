import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Pencil,
  Send,
  Phone,
  Target,
  ListChecks,
  CheckCircle2,
  Calendar,
  Mail,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import type { TodoItem, DraftTone } from "../../../lib/api";
import InteractionSummary from "./InteractionSummary";

const TONE_OPTIONS: { key: DraftTone; label: string }[] = [
  { key: "professional", label: "Professional" },
  { key: "warm", label: "Warm" },
  { key: "direct", label: "Direct" },
];

const NEXT_STEP_ICONS: Record<string, typeof Mail> = {
  send_email: Mail,
  make_call: Phone,
  share_case_study: Share2,
  escalate_technical_validation: ArrowUpRight,
  schedule_followup_call: Calendar,
  schedule_demo: Calendar,
};

function parseDecisionFactor(raw: string): { label: string; value: string } {
  const idx = raw.indexOf(":");
  if (idx > 0) return { label: raw.slice(0, idx).trim(), value: raw.slice(idx + 1).trim() };
  return { label: raw, value: "" };
}

export default function ActionCardExpanded({
  task,
  onFlipBack,
  resolved,
  onResolve,
}: {
  task: TodoItem;
  onFlipBack: () => void;
  resolved?: boolean;
  onResolve?: () => void;
}) {
  const [showDraft, setShowDraft] = useState(false);
  const [showFullDraft, setShowFullDraft] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTone, setSelectedTone] = useState<DraftTone>("professional");

  const prospect = task.deal_intelligence?.company_name ?? "—";
  const strategy = task.task_strategy;
  const alternatives = strategy?.alternative_actions ?? [];
  const keyTopics = strategy?.key_topics ?? [];
  const confidence = strategy?.confidence;

  const interactionSummary = task.interaction_summary ?? task.description;
  const interactionHistory = task.interaction_history;

  const toneDrafts = task.prepared_action?.tone_drafts;
  const baseDraft = task.prepared_action?.draft_text ?? "";
  const hasToneDrafts = !!(toneDrafts?.professional || toneDrafts?.warm || toneDrafts?.direct);

  const currentDraft = useMemo(() => {
    if (toneDrafts?.[selectedTone]) return toneDrafts[selectedTone]!;
    return baseDraft;
  }, [toneDrafts, selectedTone, baseDraft]);

  const decisionFactors = useMemo(() => {
    if (!strategy?.decision_factors?.length) return [];
    return strategy.decision_factors.map(parseDecisionFactor);
  }, [strategy?.decision_factors]);

  return (
    <div
      className="relative cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-md"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, [role='button'], input, textarea, select"))
          return;
        if (!resolved) onFlipBack();
      }}
    >
      {/* Top-right resolve button */}
      {!resolved && onResolve && (
        <button
          onClick={onResolve}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-forskale-green hover:text-forskale-green hover:bg-forskale-green/10"
          title="Mark as completed"
        >
          <CheckCircle2 size={18} />
        </button>
      )}
      {resolved && (
        <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-forskale-green/10 text-forskale-green">
          <CheckCircle2 size={18} />
        </div>
      )}

      <div className="grid gap-3">
        {/* ── Header: Prospect + Title + Confidence ── */}
        <div className="space-y-3 min-w-0 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {prospect}
              </p>
              {confidence != null && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                  {confidence}% confidence
                </span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-bold leading-tight text-foreground break-words">
              {task.title}
            </h3>
          </div>

          {/* ── Section 1: Interaction Summary ── */}
          {interactionSummary && (
            <InteractionSummary summary={interactionSummary} history={interactionHistory} />
          )}

          {/* ── Section 2: Strategic Next Step ── */}
          {(strategy?.recommended_next_step_label || strategy?.recommended_next_step_type) && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <Lightbulb size={14} />
                Strategic next step
              </div>
              <div className="mt-3 flex items-start gap-2">
                {(() => {
                  const Icon =
                    NEXT_STEP_ICONS[strategy?.recommended_next_step_type ?? ""] ?? Mail;
                  return <Icon size={16} className="mt-0.5 shrink-0 text-primary" />;
                })()}
                <p className="text-sm font-medium text-foreground">
                  {strategy?.recommended_next_step_label ?? strategy?.recommended_next_step_type}
                </p>
              </div>
            </div>
          )}

          {/* ── Section 3: Objective ── */}
          {strategy?.objective && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <Target size={14} />
                Objective
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{strategy.objective}</p>
            </div>
          )}
        </div>

        {/* ── Intelligence Panel ── */}
        <div className="space-y-3 min-w-0 rounded-xl border border-border bg-secondary p-3">
          {/* ── Section 4: AI Draft with Tone Switching ── */}
          {(currentDraft || baseDraft) && (
            <div className="rounded-xl border border-border bg-card p-4">
              <button
                onClick={() => setShowDraft(!showDraft)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">
                  AI Generated Draft
                </span>
                {showDraft ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>

              {showDraft && (
                <div className="mt-4 space-y-4 min-w-0">
                  {hasToneDrafts && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        Tone
                      </span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TONE_OPTIONS.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => setSelectedTone(key)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              selectedTone === key
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p
                    className={`whitespace-pre-line break-words text-sm leading-relaxed text-foreground ${
                      showFullDraft ? "" : "line-clamp-6"
                    }`}
                  >
                    {currentDraft || baseDraft}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-accent hover:text-foreground">
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.05em] text-primary-foreground transition-colors hover:bg-primary/90">
                      <Send size={14} />
                      Send
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFullDraft(!showFullDraft)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {showFullDraft ? "Collapse Draft" : "Show Full Draft"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Section 5: Alternative Actions ── */}
          {alternatives.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="text-sm font-semibold text-foreground">View other options</span>
                {showOptions ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </button>

              {showOptions && (
                <div className="mt-4 space-y-2">
                  {alternatives.map((opt) => (
                    <div
                      key={opt.label}
                      className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-3 text-sm"
                    >
                      <div className="flex items-start gap-2 text-foreground">
                        {(() => {
                          const Icon = NEXT_STEP_ICONS[opt.action_type] ?? Phone;
                          return <Icon size={14} className="mt-0.5 shrink-0 text-primary" />;
                        })()}
                        <span>{opt.label}</span>
                      </div>
                      <span className="shrink-0 rounded-lg bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {opt.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Section 6: Key Topics ── */}
          {keyTopics.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <ListChecks size={14} />
                Key topics
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {keyTopics.map((topic, index) => (
                  <div key={topic} className="rounded-xl bg-card px-3 py-2 text-sm text-foreground">
                    <span className="mr-2 text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 7: Why This Step ── */}
          {strategy?.strategic_reasoning && (
            <div className="p-4">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Why this step
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {strategy.strategic_reasoning}
              </p>
            </div>
          )}

          {/* ── Section 8: Decision Factors (label/value) ── */}
          {decisionFactors.length > 0 && (
            <div className="p-4">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Decision factors
              </span>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {decisionFactors.map((factor) => (
                  <div key={factor.label} className="rounded-xl bg-card px-3 py-2">
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {factor.label}
                    </p>
                    {factor.value && (
                      <p className="mt-1 text-sm font-medium text-foreground">{factor.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Complete Action ── */}
        {!resolved && onResolve && (
          <button
            onClick={onResolve}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-forskale-green/10 py-3 text-sm font-bold text-forskale-green transition-colors hover:bg-forskale-green/20"
          >
            <CheckCircle2 size={16} />
            Completed
          </button>
        )}
      </div>
    </div>
  );
}
