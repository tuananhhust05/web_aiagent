import { useState, useCallback, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronRight, Linkedin, Building2, MapPin, Globe, Calendar, Sparkles, AlertTriangle, Lightbulb, History, UserPlus, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";
import { EnrichmentLoadingModal } from "./EnrichmentLoadingModal";
import { EnrichedProfileCard, getEnrichedProfile } from "./EnrichedProfileCard";
import { AddProfileDialog } from "./AddProfileDialog";
import toast from "react-hot-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { atlasAPI, type MeetingParticipantsResponse, type AtlasMeetingContext } from "../../lib/api";

interface ContactCardProps {
  meeting: {
    id: string;
    title: string;
    time: string;
  };
  onClose: () => void;
  onBotJoin: () => void;
}

const DEAL_STAGES = ["Discovery", "Demo", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
];

type CardData = {
  companyName: string;
  primaryContact: { name: string; email: string; jobTitle: string };
  participants: Array<{ name: string; email: string; isGmail: boolean }>;
  company: {
    industry: string;
    size: string;
    revenue: string;
    location: string;
    founded: string;
    website: string;
    description: string;
  };
  intelligence: { keyPoints: string[]; risks: string[]; suggestedAngle: string };
  dealStage: string;
  interactionHistory: Array<{ date: string; type: string; summary: string; link?: string }>;
};

const EMPTY_CARD_DATA: CardData = {
  companyName: "—",
  primaryContact: { name: "—", email: "—", jobTitle: "—" },
  participants: [],
  company: {
    industry: "—",
    size: "—",
    revenue: "—",
    location: "—",
    founded: "—",
    website: "—",
    description: "No company data yet. Enrich from participants or use Regenerate.",
  },
  intelligence: {
    keyPoints: [],
    risks: [],
    suggestedAngle: "—",
  },
  dealStage: "Discovery",
  interactionHistory: [],
};

function isPersonalEmail(email: string): boolean {
  if (!email || !email.includes("@")) return true;
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
}

function buildCardDataFromApi(
  res: MeetingParticipantsResponse,
  meetingTitle: string,
  context?: AtlasMeetingContext | null,
): CardData {
  const mc = res.main_contact;
  const ci = res.company_info;
  const companyName =
    meetingTitle.split("—")[0].trim() || (mc?.email ? mc.email.split("@")[1]?.split(".")[0] : null) || "—";

  const rawParticipants = res.participants?.length
    ? res.participants
    : mc
      ? [{ name: mc.name ?? "", email: mc.email ?? "" }]
      : [];
  const participantsList = rawParticipants.map((p) => ({
    name: p.name || p.email || "—",
    email: p.email || "—",
    isGmail: isPersonalEmail(p.email || ""),
  }));

  const prep = context?.meeting_preparation;
  const keyPoints = prep?.key_points ?? [];
  const risks = prep?.risks_or_questions ?? [];
  const suggestedAngle = prep?.suggested_angle ?? "—";
  const pastEvents = context?.past_events ?? [];
  const interactionHistory = pastEvents.slice(0, 10).map((e) => ({
    date: e.date,
    type: e.type,
    summary: e.subject || e.content || "—",
    link: undefined as string | undefined,
  }));

  return {
    companyName: companyName || "—",
    primaryContact: {
      name: mc?.name ?? "—",
      email: mc?.email ?? "—",
      jobTitle: mc?.job_title ?? "—",
    },
    participants: participantsList,
    company: {
      industry: ci?.industry ?? "—",
      size: ci?.size_revenue ?? "—",
      revenue: "—",
      location: ci?.location ?? "—",
      founded: ci?.founded ?? "—",
      website: ci?.website ?? "—",
      description: ci?.description ?? EMPTY_CARD_DATA.company.description,
    },
    intelligence: {
      keyPoints: keyPoints.length ? keyPoints : ["No key points yet."],
      risks: risks.length ? risks : ["No risks yet."],
      suggestedAngle,
    },
    dealStage: res.deal_stage ?? "Discovery",
    interactionHistory: interactionHistory.length ? interactionHistory : [{ date: "—", type: "—", summary: "No history yet.", link: undefined }],
  };
}

// Note: historical mock data removed – card now always uses live API data.
function CollapsibleIntel({ icon, title, titleColor, borderColor, bgColor, children }: {
  icon: React.ReactNode;
  title: string;
  titleColor: string;
  borderColor: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={cn("rounded-lg border p-3", borderColor, bgColor)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 text-left"
      >
        {open ? <ChevronDown className={cn("h-3 w-3", titleColor)} /> : <ChevronRight className={cn("h-3 w-3", titleColor)} />}
        {icon}
        <span className={cn("text-xs font-semibold", titleColor)}>{title}</span>
      </button>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

export function ContactCard({ meeting, onClose, onBotJoin }: ContactCardProps) {
  const [data, setData] = useState<CardData>(EMPTY_CARD_DATA);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [dealStage, setDealStage] = useState<string>("Discovery");
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const mountedRef = useRef(true);

  const [enrichingParticipant, setEnrichingParticipant] = useState<string | null>(null);
  const [enrichedProfiles, setEnrichedProfiles] = useState<Set<string>>(new Set());
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [addProfileTarget, setAddProfileTarget] = useState<string | null>(null);
  const [enrichingCompanyName, setEnrichingCompanyName] = useState<string | null>(null);

  const fetchAndBuildCard = useCallback(
    async (forceEnrich = false) => {
      try {
        let participantsRes: MeetingParticipantsResponse = await atlasAPI.getMeetingParticipants(meeting.id).then((r) => r.data);
        const hadCompanyInfo = !!(participantsRes.company_info && (participantsRes.company_info.industry || participantsRes.company_info.description));

        if (forceEnrich || !hadCompanyInfo) {
          await atlasAPI.enrichMeeting(meeting.id, forceEnrich);
          participantsRes = await atlasAPI.getMeetingParticipants(meeting.id).then((r) => r.data);
        }

        let context: AtlasMeetingContext | null = null;
        const q = participantsRes.main_contact?.email?.split("@")[1]?.split(".")[0] || meeting.title.split("—")[0].trim() || meeting.title;
        if (q) {
          try {
            const ctxRes = await atlasAPI.getMeetingContext(q);
            context = ctxRes.data;
          } catch {
            // ignore
          }
        }

        if (!mountedRef.current) return;
        const card = buildCardDataFromApi(participantsRes, meeting.title, context);
        setData(card);
        setDealStage(card.dealStage);
      } catch (e) {
        if (mountedRef.current) {
          console.error("ContactCard fetch error:", e);
          toast.error("Could not load meeting details");
          setData(EMPTY_CARD_DATA);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRegenerating(false);
        }
      }
    },
    [meeting.id, meeting.title],
  );

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setData(EMPTY_CARD_DATA);
    void fetchAndBuildCard(false);
    return () => {
      mountedRef.current = false;
    };
  }, [meeting.id, fetchAndBuildCard]);

  const handleRegenerate = () => {
    setRegenerating(true);
    toast.loading("Regenerating company info…", { id: "regen" });
    fetchAndBuildCard(true).then(() => toast.success("Card updated", { id: "regen" })).catch(() => toast.error("Regenerate failed", { id: "regen" }));
  };

  const handleEnrichClick = async (name: string, email: string) => {
    // Extract company name from email domain
    const domain = email.split('@')[1];
    const companyName = domain ? domain.split('.')[0] : '';
    
    if (!companyName) {
      toast.error("Cannot extract company from email");
      return;
    }
    
    setEnrichingCompanyName(companyName);
    setEnrichingParticipant(name);
  };

  const handleEnrichComplete = useCallback(() => {
    if (enrichingParticipant) {
      setEnrichedProfiles((prev) => new Set(prev).add(enrichingParticipant));
      setEnrichingParticipant(null);
      setEnrichingCompanyName(null);
      setViewingProfile(enrichingParticipant);
      void fetchAndBuildCard(false);
    }
  }, [enrichingParticipant, fetchAndBuildCard]);

  const handleEnrichClose = () => {
    setEnrichingParticipant(null);
  };

  const handleAddProfile = (_linkedinUrl: string) => {
    if (addProfileTarget) {
      toast.success(`LinkedIn profile linked for ${addProfileTarget}`);
      // After adding profile, trigger enrichment
      setAddProfileTarget(null);
      setEnrichingParticipant(addProfileTarget);
    }
  };

  const profileData = viewingProfile ? getEnrichedProfile(viewingProfile) : null;

  return (
    <>
      <div className="flex w-[380px] flex-col border-l bg-card">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground">{meeting.title.split("—")[0].trim()}</h3>
              <p className="text-xs text-muted-foreground">{meeting.time}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 px-3 text-xs">
              Join Meeting
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={onBotJoin}>
              Bot Join
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleRegenerate}
              disabled={loading || regenerating}
            >
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 scrollbar-thin space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-xs">Loading participants & company info…</p>
            </div>
          ) : (
            <>
          {/* Primary Contact */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Contact</h4>
            <div className="rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{data.primaryContact.name}</p>
                <p className="text-xs text-muted-foreground">{data.primaryContact.jobTitle}</p>
                <p className="mt-1 text-xs text-primary">{data.primaryContact.email}</p>
              </div>
            </div>
          </section>

          {/* Participants — each with Enrich button */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Participants</h4>
            <div className="space-y-1.5">
              {data.participants.map((p) => {
                const isEnriched = enrichedProfiles.has(p.name);
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
                        <p className="text-[10px] text-atlas-warning">Personal email — auto-enrich unavailable</p>
                      )}
                    </div>
                    {isEnriched ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs border-atlas-success text-atlas-success hover:bg-atlas-success/10"
                        onClick={() => setViewingProfile(p.name)}
                      >
                        <Linkedin className="h-3 w-3" />
                        View
                      </Button>
                    ) : isGmail ? (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs opacity-50 cursor-not-allowed"
                                disabled
                              >
                                <Linkedin className="h-3 w-3" />
                                Enrich
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Cannot auto-enrich personal email. Use "Add Profile" instead.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => setAddProfileTarget(p.name)}
                        >
                          <UserPlus className="h-3 w-3" />
                          Add Profile
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => handleEnrichClick(p.name, p.email || "")}
                      >
                        <Linkedin className="h-3 w-3" />
                        Enrich
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Company Profile */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Profile</h4>
            <div className="rounded-lg border p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{data.companyName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Industry</span>
                  <p className="font-medium text-foreground">{data.company.industry}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Size & Revenue</span>
                  <p className="font-medium text-foreground">{data.company.size} · {data.company.revenue}</p>
                </div>
                <div className="flex items-start gap-1">
                  <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium text-foreground">{data.company.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <Calendar className="mt-0.5 h-3 w-3 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Founded</span>
                    <p className="font-medium text-foreground">{data.company.founded}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <a href="#" className="text-primary hover:underline">{data.company.website}</a>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{data.company.description}</p>
            </div>
          </section>

          <Separator />

          {/* Before You Join — AI Intelligence */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Before You Join</h4>
            </div>
            <div className="space-y-3">
              <CollapsibleIntel
                icon={<Lightbulb className="h-3.5 w-3.5 text-primary" />}
                title="Key Points"
                titleColor="text-primary"
                borderColor="border-primary/20"
                bgColor="bg-atlas-brand-light"
              >
                <ul className="space-y-1">
                  {data.intelligence.keyPoints.map((pt, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-foreground">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </CollapsibleIntel>
              <CollapsibleIntel
                icon={<AlertTriangle className="h-3.5 w-3.5 text-atlas-warning" />}
                title="Risks & Open Questions"
                titleColor="text-atlas-warning"
                borderColor="border-atlas-warning/30"
                bgColor="bg-atlas-warning/5"
              >
                <ul className="space-y-1">
                  {data.intelligence.risks.map((r, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-foreground">
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-atlas-warning" />
                      {r}
                    </li>
                  ))}
                </ul>
              </CollapsibleIntel>
              <CollapsibleIntel
                icon={<Sparkles className="h-3.5 w-3.5 text-atlas-success" />}
                title="Suggested Angle"
                titleColor="text-atlas-success"
                borderColor="border-atlas-success/30"
                bgColor="bg-atlas-success/5"
              >
                <p className="text-xs text-foreground leading-relaxed">{data.intelligence.suggestedAngle}</p>
              </CollapsibleIntel>
            </div>
          </section>

          <Separator />

          {/* Deal Context */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deal Context</h4>
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

          {/* Interaction History */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interaction History</h4>
            </div>
            <div className="space-y-2">
              {data.interactionHistory.map((item, i) => (
                <div key={i} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{item.date}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground">{item.summary}</p>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-[11px] font-medium text-primary hover:underline"
                    >
                      Open meeting page
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
            </>
          )}
        </div>
      </div>

      {/* Enriched profile panel beside contact card */}
      {profileData && viewingProfile && (
        <EnrichedProfileCard
          data={profileData}
          onClose={() => setViewingProfile(null)}
        />
      )}

      {/* Enrichment loading modal */}
      <EnrichmentLoadingModal
        open={!!enrichingParticipant}
        onComplete={handleEnrichComplete}
        onClose={handleEnrichClose}
        participantName={enrichingParticipant || ""}
        companyName={enrichingCompanyName || ""}
      />

      {/* Add Profile dialog for Gmail participants */}
      <AddProfileDialog
        open={!!addProfileTarget}
        onClose={() => setAddProfileTarget(null)}
        onSubmit={handleAddProfile}
        participantName={addProfileTarget || ""}
      />
    </>
  );
}
