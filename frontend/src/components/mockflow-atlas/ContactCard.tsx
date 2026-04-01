import { useState, useCallback, useEffect, useRef } from "react";
import {
  X, ChevronDown, Linkedin, Building2, MapPin,
  AlertTriangle, History, UserPlus, Brain, Target,
  CheckCircle2, XCircle, MessageSquare, Users, Zap, Copy, Loader2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnrichmentLoadingModal } from "./EnrichmentLoadingModal";
import { AddProfileDialog } from "./AddProfileDialog";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  atlasAPI,
  type MeetingParticipantsResponse,
  type AtlasMeetingContext,
  type EnrichedProfileData,
  type NeuroProfile,
} from "@/lib/api";

interface ContactCardProps {
  meeting: {
    id: string;
    title: string;
    time: string;
  };
  onClose: () => void;
  onBotJoin: () => void;
  onViewProfile?: (data: EnrichedProfileData) => void;
}

const DEAL_STAGES = ["Discovery", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const PERSONAL_EMAIL_DOMAINS = ["gmail.com","googlemail.com","yahoo.com","hotmail.com","outlook.com","live.com","icloud.com"];

function isPersonalEmail(email: string): boolean {
  if (!email || !email.includes("@")) return true;
  return PERSONAL_EMAIL_DOMAINS.includes(email.split("@")[1]?.toLowerCase() ?? "");
}

type CardData = {
  companyName: string;
  primaryContact: { name: string; email: string; jobTitle: string };
  participants: Array<{ name: string; email: string; isGmail: boolean }>;
  company: { industry: string; size: string; revenue: string; location: string; founded: string; website: string; description: string };
  intelligence: { keyPoints: string[]; risks: string[]; suggestedAngle: string };
  dealStage: string;
  interactionHistory: Array<{ date: string; type: string; summary: string; link?: string }>;
};

const EMPTY_CARD: CardData = {
  companyName: "—",
  primaryContact: { name: "—", email: "—", jobTitle: "—" },
  participants: [],
  company: { industry: "—", size: "—", revenue: "—", location: "—", founded: "—", website: "—", description: "No company data yet." },
  intelligence: { keyPoints: [], risks: [], suggestedAngle: "—" },
  dealStage: "Discovery",
  interactionHistory: [],
};

function buildCardData(res: MeetingParticipantsResponse, title: string, context?: AtlasMeetingContext | null): CardData {
  const mc = res.main_contact;
  const ci = res.company_info;
  const rawP = res.participants?.length ? res.participants : mc ? [{ name: mc.name ?? "", email: mc.email ?? "" }] : [];
  const participants = rawP.map(p => ({ name: p.name || p.email || "—", email: p.email || "—", isGmail: isPersonalEmail(p.email || "") }));
  const firstBiz = participants.find(p => !p.isGmail && p.email !== "—");
  const companyFromEmail = firstBiz ? firstBiz.email.split("@")[1]?.split(".")[0] ?? null : mc?.email && !isPersonalEmail(mc.email) ? mc.email.split("@")[1]?.split(".")[0] ?? null : null;
  const companyName = companyFromEmail || title.split("—")[0].trim() || "—";
  const prep = context?.meeting_preparation;
  const pastEvents = context?.past_events ?? [];
  return {
    companyName,
    primaryContact: { name: mc?.name ?? "—", email: mc?.email ?? "—", jobTitle: mc?.job_title ?? "—" },
    participants,
    company: {
      industry: ci?.industry ?? "—", size: ci?.size_revenue ?? "—", revenue: "—",
      location: ci?.location ?? "—", founded: ci?.founded ?? "—", website: ci?.website ?? "—",
      description: ci?.description ?? EMPTY_CARD.company.description,
    },
    intelligence: {
      keyPoints: prep?.key_points?.length ? prep.key_points : ["No key points yet."],
      risks: prep?.risks_or_questions?.length ? prep.risks_or_questions : ["No risks yet."],
      suggestedAngle: prep?.suggested_angle ?? "—",
    },
    dealStage: res.deal_stage ?? "Discovery",
    interactionHistory: pastEvents.slice(0, 10).map(e => ({ date: e.date, type: e.type, summary: e.subject || e.content || "—" })),
  };
}


// ── Sub-components ──

function NeuroGauge({ label, valueLabel, score, description, gradient }: {
  label: string; valueLabel: string; score: number; description: string; gradient: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{score}% {valueLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", gradient)}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function NeuroCard({ color, icon, title, children }: {
  color: "green" | "red" | "amber" | "blue" | "orange" | "purple";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-950/20 border-green-200/50",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200/50",
    amber: "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200/50",
    orange: "bg-orange-50 dark:bg-orange-950/20 border-orange-200/50",
    purple: "bg-purple-50 dark:bg-purple-950/20 border-purple-200/50",
  };
  const titleStyles: Record<string, string> = {
    green: "text-green-900 dark:text-green-100",
    red: "text-red-900 dark:text-red-100",
    amber: "text-amber-900 dark:text-amber-100",
    blue: "text-blue-900 dark:text-blue-100",
    orange: "text-orange-900 dark:text-orange-100",
    purple: "text-purple-900 dark:text-purple-100",
  };
  const bodyStyles: Record<string, string> = {
    green: "text-green-700 dark:text-green-300",
    red: "text-red-700 dark:text-red-300",
    amber: "text-amber-700 dark:text-amber-300",
    blue: "text-blue-800 dark:text-blue-200",
    orange: "text-orange-700 dark:text-orange-300",
    purple: "text-purple-700 dark:text-purple-300",
  };
  return (
    <div className={cn("rounded-lg border p-3", styles[color])}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div>
          <p className={cn("font-semibold mb-1 text-xs", titleStyles[color])}>{title}</p>
          <div className={cn("text-xs leading-relaxed", bodyStyles[color])}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ContactCard({ meeting, onClose, onBotJoin, onViewProfile }: ContactCardProps) {
  const [data, setData] = useState<CardData>(EMPTY_CARD);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [neuroLoading, setNeuroLoading] = useState(false);
  const [neuro, setNeuro] = useState<NeuroProfile | null>(null);
  const [dealStage, setDealStage] = useState("Discovery");
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [enrichingParticipant, setEnrichingParticipant] = useState<string | null>(null);
  const [enrichedProfiles, setEnrichedProfiles] = useState<Set<string>>(new Set());
  const [addProfileTarget, setAddProfileTarget] = useState<string | null>(null);
  const [enrichedProfilesData, setEnrichedProfilesData] = useState<Record<string, EnrichedProfileData>>({});
  const [enrichApiDone, setEnrichApiDone] = useState(false);
  const enrichApiRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchNeuroProfile = useCallback(async (force = false) => {
    if (!data.primaryContact.email || data.primaryContact.email === "—") return;
    if (neuro && !force) return;
    setNeuroLoading(true);
    try {
      const res = await atlasAPI.getNeuroProfile({ 
        event_id: meeting.id, 
        email: data.primaryContact.email,
        name: data.primaryContact.name,
        force,
      });
      if (mountedRef.current && res.data) {
        setNeuro(res.data);
      }
    } catch (err) {
      console.error("Failed to load neuro profile:", err);
    } finally {
      if (mountedRef.current) setNeuroLoading(false);
    }
  }, [data.primaryContact.email, data.primaryContact.name, meeting.id, neuro]);

  const fetchCard = useCallback(async (forceEnrich = false) => {
    try {
      let res: MeetingParticipantsResponse = await atlasAPI.getMeetingParticipants(meeting.id).then(r => r.data);
      const hadCompany = !!(res.company_info && (res.company_info.industry || res.company_info.description));
      if (forceEnrich || !hadCompany) {
        await atlasAPI.enrichMeeting(meeting.id, forceEnrich);
        res = await atlasAPI.getMeetingParticipants(meeting.id).then(r => r.data);
      }
      let context: AtlasMeetingContext | null = null;
      const q = res.main_contact?.email?.split("@")[1]?.split(".")[0] || meeting.title.split("—")[0].trim();
      if (q) {
        try { context = (await atlasAPI.getMeetingContext(q)).data; } catch { /* no context */ }
      }
      if (!mountedRef.current) return;
      const card = buildCardData(res, meeting.title, context);
      setData(card);
      setDealStage(card.dealStage);
    } catch {
      if (mountedRef.current) {
        toast.error("Could not load meeting details");
        setData(EMPTY_CARD);
      }
    } finally {
      if (mountedRef.current) { setLoading(false); setRegenerating(false); }
    }
  }, [meeting.id, meeting.title]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setData(EMPTY_CARD);
    void fetchCard(false);
    return () => { mountedRef.current = false; };
  }, [meeting.id, fetchCard]);

  // Load existing enriched profiles on mount
  useEffect(() => {
    if (loading || data.participants.length === 0) return;
    const load = async () => {
      for (const p of data.participants) {
        if (!p.email || p.email === "—") continue;
        try {
          const res = await atlasAPI.getParticipantProfile(p.email);
          const profileData = res.data?.profile_data;
          if (profileData) {
            setEnrichedProfilesData(prev => ({ ...prev, [p.email]: profileData }));
            setEnrichedProfiles(prev => new Set(prev).add(p.email));
          }
        } catch { /* not enriched yet */ }
      }
    };
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!loading && data.primaryContact.email && data.primaryContact.email !== "—" && !neuro) {
      void fetchNeuroProfile();
    }
  }, [loading, data.primaryContact.email, data.primaryContact.name, fetchNeuroProfile, neuro]);

  const handleRegenerate = () => {
    setRegenerating(true);
    toast.loading("Regenerating company info…", { id: "regen" });
    fetchCard(true)
      .then(() => toast.success("Card updated", { id: "regen" }))
      .catch(() => toast.error("Regenerate failed", { id: "regen" }));
  };

  const handleEnrichClick = async (name: string, email: string, force = false) => {
    setEnrichingParticipant(email);
    setEnrichApiDone(false);
    enrichApiRef.current?.abort();
    const ctrl = new AbortController();
    enrichApiRef.current = ctrl;
    try {
      const res = await atlasAPI.enrichParticipant({ event_id: meeting.id, email, name, force });
      if (ctrl.signal.aborted) return;
      const result = res.data;
      if (result.enriched && result.profile_data) {
        setEnrichedProfilesData(prev => ({ ...prev, [email]: result.profile_data! }));
        setEnrichedProfiles(prev => new Set(prev).add(email));
        setEnrichApiDone(true);
      } else if (result.error === "no_linkedin_url") {
        toast.error("LinkedIn profile not found. Please add it manually.");
        setEnrichingParticipant(null);
        setAddProfileTarget(email);
      } else if (result.error) {
        toast.error(result.error);
        setEnrichingParticipant(null);
      }
    } catch (err) {
      if (!(err as { name?: string }).name?.includes("Abort")) {
        toast.error("Failed to enrich profile");
        setEnrichingParticipant(null);
        setEnrichApiDone(false);
      }
    }
  };

  const handleEnrichComplete = useCallback(() => {
    if (enrichingParticipant) {
      const pd = enrichedProfilesData[enrichingParticipant];
      setEnrichingParticipant(null);
      if (pd) onViewProfile?.(pd);
      void fetchCard(false);
    }
  }, [enrichingParticipant, enrichedProfilesData, fetchCard, onViewProfile]);

  const handleEnrichClose = () => {
    enrichApiRef.current?.abort();
    setEnrichingParticipant(null);
    setEnrichApiDone(false);
  };

  const handleAddProfile = (linkedinUrl: string) => {
    if (!addProfileTarget) return;
    const targetEmail = addProfileTarget;
    const targetName = data.participants.find(p => p.email === targetEmail)?.name || "";
    setAddProfileTarget(null);
    setEnrichingParticipant(targetEmail);
    setEnrichApiDone(false);
    (async () => {
      try {
        const res = await atlasAPI.enrichParticipant({ event_id: meeting.id, email: targetEmail, name: targetName, linkedin_url: linkedinUrl });
        const result = res.data;
        if (result.enriched && result.profile_data) {
          setEnrichedProfilesData(prev => ({ ...prev, [targetEmail]: result.profile_data! }));
          setEnrichedProfiles(prev => new Set(prev).add(targetEmail));
          setEnrichApiDone(true);
        } else if (result.error) {
          toast.error(result.error);
          setEnrichingParticipant(null);
        }
      } catch {
        toast.error("Failed to enrich profile");
        setEnrichingParticipant(null);
      }
    })();
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(neuro?.openingScript.text ?? "");
    toast.success("Opening script copied to clipboard");
  };

  const handleViewProfile = async (email: string) => {
    if (enrichedProfilesData[email]) {
      onViewProfile?.(enrichedProfilesData[email]);
      return;
    }
    try {
      const res = await atlasAPI.getParticipantProfile(email);
      const pd = res.data?.profile_data;
      if (pd) {
        setEnrichedProfilesData(prev => ({ ...prev, [email]: pd }));
        onViewProfile?.(pd);
      } else {
        toast.error("Profile data not found");
      }
    } catch {
      toast.error("Failed to load profile");
    }
  };


  return (
    <>
      <div className="flex w-full md:w-[380px] flex-col border-l bg-card h-full">
        {/* ── Header ── */}
        <div className="border-b px-4 py-3 bg-gradient-to-br from-secondary to-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {data.primaryContact.name !== "—"
                    ? data.primaryContact.name.split(" ").map(n => n[0]).join("")
                    : "?"}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-forskale-teal border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground truncate">{data.primaryContact.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{data.primaryContact.jobTitle} @ {data.companyName}</p>
                  <p className="text-[11px] text-primary mt-0.5 truncate">{data.primaryContact.email}</p>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button className="h-8 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0">
              Join Meeting
            </button>
            <button className="h-8 rounded-lg border border-forskale-teal/30 bg-transparent px-3 text-xs font-semibold text-forskale-teal transition-all hover:-translate-y-0.5 hover:bg-forskale-teal/10 hover:shadow-[0_4px_12px_hsl(var(--forskale-teal)/0.2)]" onClick={onBotJoin}>
              Bot Join
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading || regenerating}
              className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 scrollbar-thin space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-xs">Loading participants & company info…</p>
            </div>
          ) : (
            <>
          {neuroLoading && !neuro && (
            <section className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Cognitive Profile</h4>
                <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-purple-500" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-3/4 animate-pulse rounded bg-purple-200/50" />
                <div className="h-2 w-1/2 animate-pulse rounded bg-purple-200/40" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-purple-200/50" />
                <div className="h-2 w-1/3 animate-pulse rounded bg-purple-200/40" />
              </div>
            </section>
          )}
          {neuro && (
            <section className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Cognitive Profile</h4>
                <Badge variant="outline" className="text-[10px] border-purple-200 dark:border-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <button
                  className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-40"
                  onClick={() => fetchNeuroProfile(true)}
                  disabled={neuroLoading}
                  title="Regenerate neuro profile"
                >
                  {neuroLoading
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                </button>
              </div>

              <div className="space-y-3">
                <NeuroGauge
                  label="Decision Style"
                  valueLabel={neuro.decisionStyle.label}
                  score={neuro.decisionStyle.score}
                  description={neuro.decisionStyle.description}
                  gradient="bg-gradient-to-r from-blue-500 to-purple-500"
                />
                <NeuroGauge
                  label="Risk Tolerance"
                  valueLabel={neuro.riskTolerance.label}
                  score={neuro.riskTolerance.score}
                  description={neuro.riskTolerance.description}
                  gradient="bg-gradient-to-r from-green-500 to-amber-500"
                />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Decision Triggers:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {neuro.triggers.map((t) => (
                      <Badge key={t.label} variant="secondary" className={cn("text-[10px]", t.color)}>
                        {t.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Neuro Action Accordion ── */}
          {neuro && (
            <Accordion type="single" collapsible className="space-y-1">
              {/* How to Approach This Brain */}
              <AccordionItem value="approach" className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-forskale-teal" />
                    <span className="text-sm font-semibold text-foreground">How to Approach This Brain</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2">
                  <NeuroCard color="green" icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} title={neuro.approach.do.title}>
                    {neuro.approach.do.action}
                  </NeuroCard>
                  <NeuroCard color="red" icon={<XCircle className="h-4 w-4 text-red-600" />} title={neuro.approach.dont.title}>
                    {neuro.approach.dont.action}
                  </NeuroCard>
                  <NeuroCard color="amber" icon={<Brain className="h-4 w-4 text-amber-600" />} title={neuro.approach.bias.name}>
                    {neuro.approach.bias.description}
                  </NeuroCard>
                </AccordionContent>
              </AccordionItem>

              {/* Opening Script */}
              <AccordionItem value="script" className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Opening Script (First 30s)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200/50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCopyScript}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed italic">
                      "{neuro.openingScript.text}"
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1">
                      <Brain className="h-3 w-3" /> Why This Works:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {neuro.openingScript.reasons.map((r) => (
                        <li key={r.principle} className="flex gap-2">
                          <span className="text-forskale-teal">•</span>
                          <span><strong>{r.principle}:</strong> {r.explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Cognitive Risk Alerts */}
              <AccordionItem value="risks" className="border rounded-lg px-3">
                <AccordionTrigger className="py-3 hover:no-underline text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-foreground">Cognitive Risk Alerts</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2">
                  {neuro.riskAlerts.map((alert) => (
                    <NeuroCard
                      key={alert.title}
                      color={alert.icon === "budget" ? "orange" : "purple"}
                      icon={alert.icon === "budget"
                        ? <AlertTriangle className="h-4 w-4 text-orange-600" />
                        : <Users className="h-4 w-4 text-purple-600" />
                      }
                      title={alert.title}
                    >
                      {alert.description}
                    </NeuroCard>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <Separator />

          {/* ── Participants ── */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</h4>
            <div className="space-y-1.5">
              {data.participants.map((p) => {
                const isEnriched = enrichedProfiles.has(p.email);
                const isGmail = p.isGmail;
                return (
                  <div key={p.email} className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {p.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{p.email}</p>
                      {isGmail && !isEnriched && (
                        <p className="text-[10px] text-destructive">Personal email — auto-enrich unavailable</p>
                      )}
                    </div>
                    {isEnriched ? (
                      <button
                        className="flex h-7 items-center gap-1 rounded-lg border border-forskale-teal/30 bg-transparent px-3 text-xs font-semibold text-forskale-teal transition-all hover:-translate-y-0.5 hover:bg-forskale-teal/10"
                        onClick={() => handleViewProfile(p.email)}
                      >
                        <Linkedin className="h-3 w-3" /> View
                      </button>
                    ) : isGmail ? (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs opacity-50 cursor-not-allowed" disabled>
                                <Linkedin className="h-3 w-3" /> Enrich
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Cannot auto-enrich personal email.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <button
                          className="flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5"
                          onClick={() => setAddProfileTarget(p.email)}
                        >
                          <UserPlus className="h-3 w-3" /> Add Profile
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5"
                        onClick={() => handleEnrichClick(p.name, p.email)}
                      >
                        <Linkedin className="h-3 w-3" /> Enrich
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Compact Company Profile ── */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</h4>
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{data.companyName}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{data.company.size}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{data.company.location}</span>
                <span>{data.company.industry}</span>
              </div>
            </div>
          </section>

          <Separator />

          {/* ── Deal Context ── */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deal Stage</h4>
            <div className="relative">
              <button
                onClick={() => setShowStageDropdown(!showStageDropdown)}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs"
              >
                <span className="font-medium text-foreground">{dealStage}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {showStageDropdown && (
                <div className="absolute z-30 mt-1 w-full rounded-md border bg-popover p-1 shadow-lg">
                  {DEAL_STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setDealStage(s); setShowStageDropdown(false); }}
                      className={cn(
                        "block w-full rounded-sm px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                        s === dealStage && "bg-accent font-medium"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Interaction History (compact) ── */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h4>
            </div>
            <div className="space-y-1.5">
              {data.interactionHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground">No interaction history yet.</p>
              ) : (
                data.interactionHistory.map((item, i) => (
                  <div key={i} className="rounded-md border px-3 py-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground">{item.summary}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[11px] font-medium text-primary hover:underline">
                        Open meeting page
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
            </>
          )}
        </div>
      </div>

      <EnrichmentLoadingModal
        open={!!enrichingParticipant}
        onComplete={handleEnrichComplete}
        onClose={handleEnrichClose}
        participantName={data.participants.find(p => p.email === enrichingParticipant)?.name || enrichingParticipant || ""}
        apiDone={enrichApiDone}
      />
      <AddProfileDialog
        open={!!addProfileTarget}
        onClose={() => setAddProfileTarget(null)}
        onSubmit={handleAddProfile}
        participantName={data.participants.find(p => p.email === addProfileTarget)?.name || addProfileTarget || ""}
      />
    </>
  );
}
