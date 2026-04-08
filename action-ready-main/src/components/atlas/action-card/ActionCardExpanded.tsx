import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Send,
  Phone,
  ListChecks,
  CheckCircle2,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  Save,
  Brain,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { ActionCardData, AlternativeOption, NeurosciencePrinciple } from "./types";
import NeurosciencePrinciples from "./NeurosciencePrinciples";
import { useLanguage } from "@/context/LanguageContext";
import {
  GmailRichTextEditor,
  plainToHtml,
  htmlToPlain,
} from "@/components/editor/GmailRichTextEditor";

// ─── Constants ─────────────────────────────────────────────────────────────────

const defaultAlternatives: AlternativeOption[] = [
  { label: "Send email with design tips and case studies", confidence: 60, actionType: "email" },
  { label: "Share a relevant app development success story", confidence: 40, actionType: "proposal" },
  { label: "Set a meeting", confidence: 20, actionType: "meeting" },
];

const toneKeys = ["formal", "professional", "conversational"] as const;
type ToneKey = (typeof toneKeys)[number];

const defaultDrafts: Record<ToneKey, string> = {
  formal:
    "Dear [Contact Name],\n\nI trust this message finds you well. I am writing to follow up on our recent discussion regarding [topic].\n\nI have prepared the documentation as discussed and remain at your disposal to arrange a meeting at your earliest convenience.\n\nWith kind regards,\n[Your name]",
  professional:
    "Dear [Contact Name],\n\nThank you for your time during our recent conversation. I wanted to follow up on the points we discussed regarding [topic].\n\nI've prepared the requested information and would be happy to schedule a brief call to walk through the details at your convenience.\n\nBest regards,\n[Your name]",
  conversational:
    "Hey [Contact Name],\n\nHope you're doing well! Just wanted to touch base on what we chatted about regarding [topic].\n\nI've pulled together the info you mentioned — happy to walk through it whenever works for you.\n\nTalk soon!\n[Your name]",
};

const toneToKey: Record<string, ToneKey> = {
  Professional: "professional",
  Formal: "formal",
  Conversational: "conversational",
  professional: "professional",
  formal: "formal",
  conversational: "conversational",
};

const actionTypeIcons: Record<string, typeof Mail> = {
  email: Mail,
  email_response: Mail,
  call: Phone,
  call_followup: Phone,
  meeting: Calendar,
  schedule_demo: Calendar,
  whatsapp: MessageCircle,
  proposal: FileText,
  send_resources: FileText,
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ActionCardExpandedProps {
  data: ActionCardData;
  selectedTone: string;
  onToneChange: (tone: string) => void;
  resolved?: boolean;
  onResolve?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterUnsavedTrigger?: (fn: () => void) => void;
}

// ─── Unsaved Changes Dialog (frosted glass overlay) ───────────────────────────

interface UnsavedDialogProps {
  onSaveDraft: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

const UnsavedChangesDialog = ({ onSaveDraft, onDiscard, onCancel }: UnsavedDialogProps) => (
  <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit]">
    <div className="absolute inset-0 rounded-[inherit] backdrop-blur-md bg-black/40" />
    <div className="relative z-10 w-[320px] rounded-2xl border border-white/20 bg-white/10 dark:bg-black/40 backdrop-blur-xl p-5 shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <AlertTriangle size={16} className="text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Unsaved Changes</h4>
          <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
            You have unsaved changes to this draft. What would you like to do?
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={onSaveDraft}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-[11px] font-bold uppercase tracking-[0.05em] h-8 transition-colors"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
          Save Draft
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white/90 text-[11px] font-bold uppercase tracking-[0.05em] h-8 transition-colors"
        >
          <X size={10} />
          Discard Changes
        </button>
        <button
          onClick={onCancel}
          className="flex items-center justify-center rounded-lg text-white/60 hover:text-white text-[11px] font-semibold h-7 transition-colors"
        >
          Cancel — Keep Editing
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ActionCardExpanded = ({
  data,
  selectedTone,
  onToneChange,
  resolved,
  onResolve,
  onDirtyChange,
  onRegisterUnsavedTrigger,
}: ActionCardExpandedProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedDraftHtml, setEditedDraftHtml] = useState("");
  const [editorFocused, setEditorFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [userSelectedTone, setUserSelectedTone] = useState<ToneKey | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<Record<ToneKey, string>>({ formal: "", professional: "", conversational: "" });

  const { t } = useLanguage();

  const activeToneKey = toneToKey[selectedTone] ?? "professional";
  const aiDetectedTone: ToneKey =
    (data as any).detectedTone
      ? (toneToKey[(data as any).detectedTone] ?? "professional")
      : "professional";

  const toneDraft = useMemo(() => {
    if (data.toneDrafts) {
      const drafts = data.toneDrafts as Record<string, string | undefined>;
      const val =
        drafts[selectedTone] ??
        drafts[activeToneKey.charAt(0).toUpperCase() + activeToneKey.slice(1)];
      if (val) return val;
    }
    return data.draftContent ?? defaultDrafts[activeToneKey];
  }, [data.draftContent, data.toneDrafts, selectedTone, activeToneKey]);

  const currentHtml = editedDraftHtml || plainToHtml(toneDraft);

  const isDirty =
    isEditingDraft && editedDraftHtml !== "" && htmlToPlain(editedDraftHtml) !== toneDraft;

  const notifyDirty = useCallback(
    (dirty: boolean) => { onDirtyChange?.(dirty); },
    [onDirtyChange]
  );

  useEffect(() => {
    onRegisterUnsavedTrigger?.(() => setShowUnsavedDialog(true));
  }, [onRegisterUnsavedTrigger]);

  const alternativeOptions = data.alternativeOptions?.length
    ? data.alternativeOptions
    : defaultAlternatives;

  const principles: NeurosciencePrinciple[] = data.neurosciencePrinciples?.length
    ? data.neurosciencePrinciples
    : [
        {
          title: "Loss Aversion",
          explanation: "The draft emphasizes what the prospect may lose if they delay action.",
          highlightedPhrase: "make sure we're aligned on the next steps",
        },
        {
          title: "Social Proof",
          explanation: "References to similar companies build trust and reduce perceived risk.",
          highlightedPhrase: "Companies similar to yours have seen improvements",
        },
      ];

  const handleEditToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditingDraft) {
      setIsEditingDraft(false);
      notifyDirty(false);
    } else {
      setEditedDraftHtml(plainToHtml(toneDraft));
      setIsEditingDraft(true);
    }
  };

  const handleDiscard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditedDraftHtml("");
    setIsEditingDraft(false);
    setEditorFocused(false);
    setAttachments([]);
    notifyDirty(false);
    setShowUnsavedDialog(false);
  };

  const handleToneChange = (tone: ToneKey) => {
    setUserSelectedTone(tone);
    onToneChange(tone);
    setEditedDraftHtml("");
    setIsEditingDraft(false);
    notifyDirty(false);
  };

  const handleEditorChange = (html: string) => {
    setEditedDraftHtml(html);
    const dirty = isEditingDraft && html !== "" && htmlToPlain(html) !== toneDraft;
    notifyDirty(dirty);
  };

  // Prototype: save draft locally (no API)
  const handleSaveDraft = () => {
    setSavedDrafts((prev) => ({ ...prev, [activeToneKey]: editedDraftHtml }));
    setIsEditingDraft(false);
    notifyDirty(false);
    setShowUnsavedDialog(false);
  };

  const getToneLabel = (tone: ToneKey) => {
    const isAI = tone === aiDetectedTone;
    const isUserPick = userSelectedTone === tone && tone !== aiDetectedTone;
    return (
      <span className="inline-flex items-center gap-1">
        {t(tone)}
        {isAI && <span title="AI-detected tone" className="text-[11px] leading-none">🤖</span>}
        {isUserPick && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" title="Your selection" aria-hidden="true" />
        )}
      </span>
    );
  };

  return (
    <div className="relative flex flex-col h-full max-h-[80vh]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-start justify-between px-5 pt-4 pb-1.5 backdrop-blur-sm bg-card/90 border-b border-border/30">
        <div className="space-y-0.5 min-w-0 pr-6">
          <h3 className="text-lg font-bold leading-snug text-foreground break-words">{data.title}</h3>
          {data.objective && (
            <p className="text-xs text-muted-foreground italic">{data.objective}</p>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto flex-1">
        <div className="space-y-2 px-5 py-2">
          {/* 1. Interaction Summary */}
          {data.interactionSummary && (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Brain size={11} className="text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {t("interactionSummary")}
                </span>
                <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary">AI</span>
              </div>
              <p className="text-xs leading-snug text-foreground">{data.interactionSummary}</p>
              {data.interactionHistory?.length ? (
                <>
                  <button
                    onClick={() => setShowHistory((prev) => !prev)}
                    className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                  >
                    <ChevronRight size={10} className={`transition-transform ${showHistory ? "rotate-90" : ""}`} />
                    {showHistory ? t("hideHistory") : t("seeCompleteChronology")}
                  </button>
                  {showHistory && (
                    <div className="mt-1 space-y-1 pl-1">
                      {data.interactionHistory.map((item, i) => {
                        const Icon = actionTypeIcons[item.type] || Mail;
                        return (
                          <div key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                            <Icon size={10} className="mt-0.5 shrink-0 text-primary/60" />
                            <span className="shrink-0 font-medium">{item.timeAgo}</span>
                            <span className="text-foreground/80">{item.summary}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* 2. Company & Deal Info */}
          <div className="flex items-center gap-4 px-1 text-[10px]">
            <span>
              <span className="font-bold uppercase tracking-[0.1em] text-muted-foreground">COMPANY: </span>
              <span className="font-semibold text-foreground">{data.prospect}</span>
            </span>
            <span>
              <span className="font-bold uppercase tracking-[0.1em] text-muted-foreground">DEAL: </span>
              <span className="font-semibold text-foreground">{data.title}</span>
            </span>
          </div>

          {/* 3. Draft Ready To Send */}
          <div className="rounded-lg border-2 border-primary/30 bg-card p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Mail size={13} className="text-primary" />
              <span className="text-[11px] font-bold text-primary">{t("draftReadyToSend")}</span>
            </div>

            <p className="text-[9px] text-muted-foreground mb-1">
              🤖 {t("toneDetectedAuto")}: {t(activeToneKey)}
            </p>

            {/* Tone tabs — hidden when editor focused */}
            <div
              className={`transition-all duration-200 overflow-hidden ${
                editorFocused
                  ? "max-h-0 opacity-0 mb-0 pointer-events-none"
                  : "max-h-10 opacity-100 mb-1.5"
              }`}
            >
              <div className="flex gap-1">
                {toneKeys.map((tone) => (
                  <button
                    key={tone}
                    onClick={() => handleToneChange(tone)}
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold transition-all shrink-0 ${
                      activeToneKey === tone
                        ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {getToneLabel(tone)}
                  </button>
                ))}
              </div>
            </div>

            {/* ToneBadge — shown only when editor focused */}
            <div
              className={`transition-all duration-200 overflow-hidden ${
                editorFocused
                  ? "max-h-8 opacity-100 mb-1.5"
                  : "max-h-0 opacity-0 mb-0 pointer-events-none"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t(activeToneKey)}
              </span>
            </div>

            {/* Editor / Read-only */}
            <div className="rounded-md bg-muted/30 overflow-hidden">
              {isEditingDraft ? (
                <GmailRichTextEditor
                  value={editedDraftHtml}
                  onChange={handleEditorChange}
                  minHeight={160}
                  onFocus={() => setEditorFocused(true)}
                  onBlur={() => setEditorFocused(false)}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              ) : (
                <div
                  className="px-3 py-2.5 text-[13px] leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: currentHtml }}
                />
              )}
            </div>

            {/* Draft Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-border/50">
              <button
                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={(e) => e.stopPropagation()}
              >
                <Send size={10} />
                {t("send")}
              </button>

              <button
                onClick={handleEditToggle}
                className={`inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors ${
                  isEditingDraft
                    ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                    : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
                }`}
              >
                <Pencil size={10} />
                {isEditingDraft ? "Done" : t("edit")}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDirty) handleSaveDraft();
                }}
                disabled={!isDirty}
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={10} />
                {t("saveDraft")}
              </button>

              {isEditingDraft && isDirty && (
                <button
                  onClick={handleDiscard}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <X size={10} />
                  Discard
                </button>
              )}
            </div>
          </div>

          {/* 4. Neuroscientific Principles */}
          <NeurosciencePrinciples principles={principles} />

          {/* 5. Key Topics */}
          {data.keyTopics?.length ? (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400 mb-1">
                <ListChecks size={11} />
                {t("keyTopics")}
              </div>
              <div className="flex flex-wrap gap-1">
                {data.keyTopics.map((topic) => (
                  <span key={topic} className="rounded-full bg-amber-100/80 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* 6. View Other Options */}
          <div className="rounded-lg border border-border bg-secondary/50 p-1.5">
            <div className="rounded-lg border border-border bg-card px-2.5 py-1.5">
              <button
                onClick={() => setShowOptions((prev) => !prev)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="text-[11px] font-semibold text-foreground">{t("viewOtherOptions")}</span>
                {showOptions
                  ? <ChevronUp size={13} className="text-muted-foreground" />
                  : <ChevronDown size={13} className="text-muted-foreground" />
                }
              </button>
              {showOptions && (
                <div className="mt-1.5 space-y-1">
                  {alternativeOptions.map((option) => {
                    const OptionIcon = actionTypeIcons[option.actionType || "email"] || Mail;
                    return (
                      <div key={option.label} className="flex items-center justify-between gap-2 rounded-md bg-secondary px-2 py-1.5 text-[11px]">
                        <div className="flex items-start gap-1.5 text-foreground">
                          <OptionIcon size={11} className="mt-0.5 shrink-0 text-accent" />
                          <span>{option.label}</span>
                        </div>
                        <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                          {option.confidence}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-end border-t border-border px-5 py-2">
          {!resolved && onResolve && (
            <button
              onClick={onResolve}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-forskale-green/10 px-3 text-[10px] font-bold text-forskale-green transition-colors hover:bg-forskale-green/20"
            >
              <CheckCircle2 size={12} />
              {t("completed")}
            </button>
          )}
          {resolved && (
            <div className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-forskale-green/10 px-3 text-[10px] font-bold text-forskale-green">
              <CheckCircle2 size={12} />
              {t("completed")}
            </div>
          )}
        </div>
      </div>

      {/* Frosted glass unsaved changes dialog */}
      {showUnsavedDialog && (
        <UnsavedChangesDialog
          onSaveDraft={handleSaveDraft}
          onDiscard={handleDiscard}
          onCancel={() => setShowUnsavedDialog(false)}
        />
      )}
    </div>
  );
};

export default ActionCardExpanded;
