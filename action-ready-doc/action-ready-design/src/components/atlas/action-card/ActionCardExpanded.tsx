import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Send,
  Phone,
  ListChecks,
  CheckCircle2,
  Mail,
  Calendar,
  MessageCircle,
  FileText,
  Save,
} from "lucide-react";
import { ActionCardData, AlternativeOption, NeurosciencePrinciple } from "./types";
import InteractionSummary from "./InteractionSummary";
import NeurosciencePrinciples from "./NeurosciencePrinciples";
import { useLanguage } from "@/context/LanguageContext";
import { GmailRichTextEditor } from "@/components/editor/GmailRichTextEditor";
import { ToneSelector, ToneType } from "@/components/action-ready/ToneSelector";
import { ToneBadge } from "@/components/action-ready/ToneBadge";
import { UnsavedChangesDialog } from "@/components/action-ready/UnsavedChangesDialog";

const defaultAlternatives: AlternativeOption[] = [
  { label: "Send email with design tips and case studies", confidence: 60, actionType: "email" },
  { label: "Share a relevant app development success story", confidence: 40, actionType: "proposal" },
  { label: "Set a meeting", confidence: 20, actionType: "meeting" },
];

const toneKeys: ToneType[] = ["formal", "professional", "conversational"];

const defaultDrafts: Record<ToneType, string> = {
  formal:
    "Dear [Contact Name],<br><br>I trust this message finds you well. I am writing to follow up on our recent discussion regarding [topic].<br><br>I have prepared the documentation as discussed and remain at your disposal to arrange a meeting at your earliest convenience.<br><br>With kind regards,<br>[Your name]",
  professional:
    "Dear [Contact Name],<br><br>Thank you for your time during our recent conversation. I wanted to follow up on the points we discussed regarding [topic].<br><br>I've prepared the requested information and would be happy to schedule a brief call to walk through the details at your convenience.<br><br>Best regards,<br>[Your name]",
  conversational:
    "Hey [Contact Name],<br><br>Hope you're doing well! Just wanted to touch base on what we chatted about regarding [topic].<br><br>I've pulled together the info you mentioned — happy to walk through it whenever works for you.<br><br>Talk soon!<br>[Your name]",
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

const ActionCardExpanded = ({
  data,
  selectedTone,
  onToneChange,
  resolved,
  onResolve,
}: {
  data: ActionCardData;
  selectedTone: ToneType;
  onToneChange: (tone: ToneType) => void;
  resolved?: boolean;
  onResolve?: () => void;
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [draftHtml, setDraftHtml] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedContent, setSavedContent] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const isDirty = draftHtml !== savedContent && draftHtml !== "";

  const detectedTone: ToneType = (data.detectedTone as ToneType) ?? "professional";
  const activeToneKey: ToneType = selectedTone;

  const toneDraft = useMemo(() => {
    if (data.toneDrafts) {
      const val = data.toneDrafts[activeToneKey];
      if (val) return val;
    }
    return data.draftContent ?? defaultDrafts[activeToneKey];
  }, [data.draftContent, data.toneDrafts, activeToneKey]);

  // Initialize savedContent from toneDraft
  useEffect(() => {
    setSavedContent(toneDraft);
  }, [toneDraft]);

  // Detect click outside card while dirty & editing
  const handleCardBlur = useCallback(
    (e: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node) &&
        isDirty &&
        isEditing
      ) {
        setShowUnsavedDialog(true);
      }
    },
    [isDirty, isEditing]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleCardBlur);
    return () => document.removeEventListener("mousedown", handleCardBlur);
  }, [handleCardBlur]);

  const handleEditorFocus = () => setIsEditing(true);
  
  const handleEditorBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (cardRef.current && relatedTarget && cardRef.current.contains(relatedTarget)) return;
    setIsEditing(false);
  }, []);

  const handleSaveDraft = () => {
    setSavedContent(draftHtml);
    setIsEditing(false);
    setShowUnsavedDialog(false);
  };

  const handleDiscard = () => {
    setDraftHtml(savedContent);
    setIsEditing(false);
    setShowUnsavedDialog(false);
  };

  const alternativeOptions = data.alternativeOptions?.length ? data.alternativeOptions : defaultAlternatives;

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

  return (
    <div ref={cardRef} className="relative flex flex-col min-h-0">
      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <UnsavedChangesDialog onSave={handleSaveDraft} onDiscard={handleDiscard} />
      )}
      {/* Sticky Header — title + objective */}
      <div className="sticky top-0 z-20 shrink-0 flex items-start justify-between px-5 pt-4 pb-3 bg-card/95 backdrop-blur-sm border-b border-border/50 supports-[backdrop-filter]:bg-card/80">
        <div className="space-y-0.5 min-w-0 pr-6">
          <h3 className="text-lg font-bold leading-snug text-foreground break-words">{data.title}</h3>
          {data.objective && (
            <p className="text-xs text-muted-foreground italic">{data.objective}</p>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto">
      <div className="space-y-2 px-5 pb-2 pt-4">
        {/* 1. Interaction Summary */}
        {data.interactionSummary && (
          <InteractionSummary
            summary={data.interactionSummary}
            history={data.interactionHistory}
          />
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

        {/* 3. Draft Ready To Send — HERO */}
        <div className="rounded-lg border-2 border-primary/30 bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Mail size={13} className="text-primary" />
            <span className="text-[11px] font-bold text-primary">{t("draftReadyToSend")}</span>
          </div>

          {!isEditing ? (
            <ToneSelector
              detectedTone={detectedTone}
              selectedTone={activeToneKey}
              onToneChange={onToneChange}
            />
          ) : (
            <ToneBadge tone={activeToneKey} />
          )}

          <div onFocus={handleEditorFocus} onBlur={handleEditorBlur}>
            <GmailRichTextEditor
              value={isDirty ? undefined : toneDraft}
              onChange={setDraftHtml}
              minHeight={100}
              className="mt-1"
            />
          </div>

          {/* Draft Action Buttons — inside draft section */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/50">
            <button
              onClick={() => { setSavedContent(draftHtml); setIsEditing(false); }}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send size={10} />
              {t("send")}
            </button>
            <button
              onClick={handleSaveDraft}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
            >
              <Save size={10} />
              {t("saveDraft")}
              {isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" title="Unsaved changes" />
              )}
            </button>
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
            <button onClick={() => setShowOptions((prev) => !prev)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className="text-[11px] font-semibold text-foreground">{t("viewOtherOptions")}</span>
              {showOptions ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
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

      {/* Bottom bar — Mark Complete only (inside scrollable body) */}
      <div className="flex items-center justify-end border-t border-border px-5 py-2 bg-card/50">
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
    </div>
  );
};

export default ActionCardExpanded;
