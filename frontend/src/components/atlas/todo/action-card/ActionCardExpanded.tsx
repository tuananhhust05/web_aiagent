import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
} from "lucide-react";
import { ActionCardData, AlternativeOption, NeurosciencePrinciple } from "./types";
import NeurosciencePrinciples from "./NeurosciencePrinciples";
import { useLanguage } from "../LanguageContext";
import { todoReadyAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { TODO_READY_QUERY_KEY } from "../useRealActions";

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

const ActionCardExpanded = ({
  data,
  selectedTone,
  onToneChange,
  resolved,
  onResolve,
  enriching,
}: {
  data: ActionCardData;
  selectedTone: string;
  onToneChange: (tone: string) => void;
  resolved?: boolean;
  onResolve?: () => void;
  enriching?: boolean;
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedDraft, setEditedDraft] = useState("");
  const { t } = useLanguage();

  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: () => todoReadyAPI.sendEmail(data.id, editedDraft || toneDraft),
    onSuccess: (res) => {
      const result = res.data;
      if (result.needs_reauthorization && result.auth_url) {
        window.location.href = result.auth_url;
        return;
      }
      toast.success("Email sent!");
      queryClient.invalidateQueries({ queryKey: TODO_READY_QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to send email. Please try again.");
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () =>
      todoReadyAPI.updateItem(data.id, {
        prepared_action: {
          strategy_label: "",
          explanation: "",
          draft_text: editedDraft,
        },
      }),
    onSuccess: () => {
      toast.success("Draft saved");
      setIsEditingDraft(false);
      queryClient.invalidateQueries({ queryKey: TODO_READY_QUERY_KEY });
    },
    onError: () => {
      toast.error("Failed to save draft.");
    },
  });

  const activeToneKey = toneToKey[selectedTone] ?? "professional";

  const toneDraft = useMemo(() => {
    if (data.toneDrafts) {
      const drafts = data.toneDrafts as Record<string, string | undefined>;
      const val = drafts[selectedTone] ?? drafts[activeToneKey.charAt(0).toUpperCase() + activeToneKey.slice(1)];
      if (val) return val;
    }
    return data.draftContent ?? defaultDrafts[activeToneKey];
  }, [data.draftContent, data.toneDrafts, selectedTone, activeToneKey]);

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
    <div className="relative flex flex-col">
      {/* Header — title + objective */}
      <div className="flex items-start justify-between px-5 pt-4 pb-1.5">
        <div className="space-y-0.5 min-w-0 pr-6">
          <h3 className="text-lg font-bold leading-snug text-foreground break-words">{data.title}</h3>
          {data.objective && (
            <p className="text-xs text-muted-foreground italic">{data.objective}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 px-5 pb-2">
        {/* 1. Interaction Summary */}
        {data.interactionSummary && (
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Brain size={11} className="text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {t("interactionSummary")}
              </span>
              <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary">AI</span>
              {enriching && <Loader2 size={8} className="animate-spin text-primary/60" />}
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

        {/* 3. Draft Ready To Send — HERO */}
        <div className="rounded-lg border-2 border-primary/30 bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Mail size={13} className="text-primary" />
            <span className="text-[11px] font-bold text-primary">{t("draftReadyToSend")}</span>
          </div>

          <p className="text-[9px] text-muted-foreground mb-1">
            🤖 {t("toneDetectedAuto")}: {t(activeToneKey)}
          </p>

          {/* Tone Tabs — pill style */}
          <div className="flex gap-1 mb-1.5">
            {toneKeys.map((tone) => (
              <button
                key={tone}
                onClick={() => onToneChange(tone)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold transition-all shrink-0 ${
                  activeToneKey === tone
                    ? "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tone)}
              </button>
            ))}
          </div>

          <div className="rounded-md bg-muted/30 p-2.5">
            {isEditingDraft ? (
              <textarea
                value={editedDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full min-h-[120px] rounded-md border border-border bg-card p-2 text-[13px] leading-relaxed text-foreground font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-y"
              />
            ) : (
              <p className="whitespace-pre-line break-words text-[13px] leading-relaxed text-foreground font-mono">
                {editedDraft || toneDraft}
              </p>
            )}
          </div>

          {/* Draft Action Buttons — inside draft section */}
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const draftContent = editedDraft || toneDraft;
                if (!sendEmailMutation.isPending && draftContent) {
                  sendEmailMutation.mutate();
                }
              }}
              disabled={sendEmailMutation.isPending || !(editedDraft || toneDraft)}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Send size={10} />
              )}
              {t("send")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditingDraft) {
                  setIsEditingDraft(false);
                } else {
                  setEditedDraft(toneDraft);
                  setIsEditingDraft(true);
                }
              }}
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
                if (isEditingDraft && editedDraft !== toneDraft) {
                  saveDraftMutation.mutate();
                }
              }}
              disabled={!isEditingDraft || editedDraft === toneDraft || saveDraftMutation.isPending}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[10px] font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveDraftMutation.isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Save size={10} />
              )}
              {t("saveDraft")}
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

      {/* Bottom bar — Mark Complete only */}
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
  );
};

export default ActionCardExpanded;
