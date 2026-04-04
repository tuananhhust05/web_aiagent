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
} from "lucide-react";
import { ActionCardData, AlternativeOption } from "./types";
import InteractionSummary from "./InteractionSummary";

const defaultAlternatives: AlternativeOption[] = [
  { label: "Send email with design tips and case studies", confidence: 60 },
  { label: "Share a relevant app development success story", confidence: 40 },
  { label: "Set a meeting", confidence: 20 },
];

const draftPrefixes: Record<"Professional" | "Warm" | "Direct", string> = {
  Professional: "Hi there,\n\nThank you for reaching out.",
  Warm: "Hi there,\n\nReally appreciate your note.",
  Direct: "Hi there,\n\nQuick follow-up on this.",
};

const ActionCardExpanded = ({
  data,
  selectedTone,
  tones,
  showDraft,
  showFullDraft,
  onToneChange,
  onToggleDraft,
  onToggleFullDraft,
  onFlipBack,
  resolved,
  onResolve,
}: {
  data: ActionCardData;
  selectedTone: string;
  tones: string[];
  showDraft: boolean;
  showFullDraft: boolean;
  onToneChange: (tone: string) => void;
  onToggleDraft: () => void;
  onToggleFullDraft: () => void;
  onFlipBack: () => void;
  resolved?: boolean;
  onResolve?: () => void;
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const toneDraft = useMemo(() => {
    const typedTone = (selectedTone in draftPrefixes ? selectedTone : "Professional") as "Professional" | "Warm" | "Direct";
    return data.toneDrafts?.[typedTone] ?? `${draftPrefixes[typedTone]}\n\n${data.draftContent}`;
  }, [data.draftContent, data.toneDrafts, selectedTone]);

  const alternativeOptions = data.alternativeOptions?.length ? data.alternativeOptions : defaultAlternatives;

  return (
    <div
      className="relative cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-md"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, [role='button'], input, textarea, select")) return;
        if (!resolved) onFlipBack();
      }}
    >
      {/* Top-right completed checkmark */}
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
        {/* Header */}
        <div className="space-y-3 min-w-0 pr-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{data.prospect}</p>
            <h3 className="mt-1 text-lg font-bold leading-tight text-foreground break-words">{data.title}</h3>
          </div>


          {/* Interaction Summary - between header and strategic step */}
          {data.interactionSummary && (
            <InteractionSummary
              summary={data.interactionSummary}
              history={data.interactionHistory}
            />
          )}

          {(data.strategicStep || data.objective) && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <Lightbulb size={14} />
                Strategic next step
              </div>
              {data.strategicStep && <p className="mt-3 text-sm font-medium text-foreground">{data.strategicStep}</p>}
            </div>
          )}

          {data.objective && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <Target size={14} />
                Objective
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{data.objective}</p>
            </div>
          )}
        </div>

        {/* Draft & Options */}
        <div className="space-y-3 min-w-0 rounded-xl border border-border bg-secondary p-3">
          {/* AI Draft */}
          <div className="rounded-xl border border-border bg-card p-4">
            <button onClick={onToggleDraft} className="flex w-full items-center justify-between gap-3 text-left">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-foreground">AI Generated Draft</span>
              {showDraft ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showDraft && (
              <div className="mt-4 space-y-4 min-w-0">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Tone</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tones.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => onToneChange(tone)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          selectedTone === tone
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <p className={`whitespace-pre-line break-words text-sm leading-relaxed text-foreground ${showFullDraft ? "" : "line-clamp-6"}`}>
                  {toneDraft}
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

                <button onClick={onToggleFullDraft} className="text-xs font-semibold text-accent hover:underline">
                  {showFullDraft ? "Collapse Draft" : "Show Full Draft"}
                </button>
              </div>
            )}
          </div>

          {/* Other Options */}
          <div className="rounded-xl border border-border bg-card p-4">
            <button onClick={() => setShowOptions((prev) => !prev)} className="flex w-full items-center justify-between gap-3 text-left">
              <span className="text-sm font-semibold text-foreground">View other options</span>
              {showOptions ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>

            {showOptions && (
              <div className="mt-4 space-y-2">
                {alternativeOptions.map((option) => (
                  <div key={option.label} className="flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-3 text-sm">
                    <div className="flex items-start gap-2 text-foreground">
                      <Phone size={14} className="mt-0.5 shrink-0 text-accent" />
                      <span>{option.label}</span>
                    </div>
                    <span className="shrink-0 rounded-lg bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {option.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Topics */}
          {data.keyTopics?.length ? (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <ListChecks size={14} />
                Key topics
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.keyTopics.map((topic, index) => (
                  <div key={topic} className="rounded-xl bg-card px-3 py-2 text-sm text-foreground">
                    <span className="mr-2 text-xs font-bold text-muted-foreground">{index + 1}</span>
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Why this step */}
          {data.whyThisStep && (
            <div className="p-4">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Why this step</span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.whyThisStep}</p>
            </div>
          )}

          {/* Decision Factors */}
          {data.decisionFactors?.length ? (
            <div className="p-4">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Decision factors</span>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {data.decisionFactors.map((factor) => (
                  <div key={factor.label} className="rounded-xl bg-card px-3 py-2">
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{factor.label}</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{factor.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Completed button at bottom */}
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
};

export default ActionCardExpanded;
