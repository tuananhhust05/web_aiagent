import { useState, useCallback } from "react";
import {
  X, ChevronDown, ChevronRight, Linkedin, Building2, MapPin, Globe, Calendar,
  Sparkles, AlertTriangle, Lightbulb, History, UserPlus, Brain, Target,
  CheckCircle2, XCircle, MessageSquare, Users, Zap, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EnrichmentLoadingModal } from "./EnrichmentLoadingModal";
import { EnrichedProfileCard, getEnrichedProfile } from "./EnrichedProfileCard";
import { AddProfileDialog } from "./AddProfileDialog";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

// ── Neuroscience mock data per meeting ──
const NEURO_PROFILE_DEFAULT = {
  decisionStyle: { score: 75, label: "Analytical", description: "Needs concrete data and proof points" },
  riskTolerance: { score: 30, label: "Conservative", description: "Prefers proven solutions with minimal downside" },
  triggers: [
    { label: "ROI Focus", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
    { label: "Team Consensus", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    { label: "Efficiency", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  ],
  summary: "Data-driven operations leader who values team alignment and proven ROI",
  approach: {
    do: {
      title: "Lead with Authority & Data",
      action: '"We helped 3 consulting firms reduce delivery time by 40%" — triggers authority bias',
    },
    dont: {
      title: "Avoid Pricing Before Value",
      action: "Loss aversion trigger — establish ROI first, then reveal investment",
    },
    bias: {
      name: "Confirmation Bias Active",
      description: "Ask discovery questions that reveal pain before proposing solutions",
    },
  },
  openingScript: {
    text: "Luca, thanks for making time. I wanted to share something relevant: we recently worked with a Milan consulting firm facing similar delivery bottlenecks. They achieved a 40% reduction in project turnaround within 60 days. What's your biggest challenge right now with client delivery timelines?",
    reasons: [
      { principle: "Authority bias", explanation: "Similar client success builds credibility" },
      { principle: "Specificity", explanation: '"40%" and "60 days" = concrete proof' },
      { principle: "Discovery focus", explanation: "Open question invites pain sharing" },
    ],
  },
  riskAlerts: [
    {
      icon: "budget",
      title: "Budget Sensitivity Detected",
      description: 'Previous notes mention "budget freeze" — reframe as ROI discussion, not cost',
    },
    {
      icon: "stakeholder",
      title: "Multi-Stakeholder Complexity",
      description: "Decision involves CFO + IT team — prepare consensus-building materials",
    },
  ],
};

const GMAIL_MOCK_DATA = {
  companyName: "Unknown",
  primaryContact: { name: "Marco Verdi", email: "marco.verdi92@gmail.com", jobTitle: "Unknown" },
  participants: [{ name: "Marco Verdi", email: "marco.verdi92@gmail.com", isGmail: true }],
  company: {
    industry: "Unknown", size: "Unknown", revenue: "Unknown", location: "Unknown",
    founded: "Unknown", website: "N/A",
    description: "Company information unavailable — participant registered with a personal email address.",
  },
  intelligence: {
    keyPoints: ["Participant joined via personal Gmail — limited company data", "No prior CRM records found"],
    risks: ["Cannot auto-detect LinkedIn or company affiliation", "May require manual profile addition for enrichment"],
    suggestedAngle: "Ask participant for their company and role during the meeting. Use 'Add Profile' to manually link their LinkedIn for future enrichment.",
  },
  dealStage: "Discovery",
  interactionHistory: [
    { date: "Mar 5, 2026", type: "Email", summary: "Meeting invite sent to marco.verdi92@gmail.com", link: undefined as string | undefined },
  ],
  neuro: null as typeof NEURO_PROFILE_DEFAULT | null,
};

const MOCK_DATA = {
  companyName: "Nova Consulting",
  primaryContact: { name: "Luca Bianchi", email: "luca.bianchi@novaconsulting.it", jobTitle: "Head of Operations" },
  participants: [
    { name: "Luca Bianchi", email: "luca.bianchi@novaconsulting.it", isGmail: false },
    { name: "Maria Rossi", email: "maria.rossi@novaconsulting.it", isGmail: false },
  ],
  company: {
    industry: "Management Consulting", size: "48 employees", revenue: "€6-8M",
    location: "Milan, Italy", founded: "2016", website: "www.novaconsulting.it",
    description: "Milan-based management consulting firm supporting mid-sized enterprises with strategy, operations, and organizational transformation.",
  },
  intelligence: {
    keyPoints: [
      "Prospect mentioned budget freeze in last interaction",
      "Decision-making involves 3 stakeholders including CFO",
      "Currently using competitor solution (McKinsey framework)",
    ],
    risks: [
      "Budget constraints may delay procurement decision",
      "Technical team not yet involved in evaluation",
    ],
    suggestedAngle: "Focus on ROI and cost-saving narrative. Emphasize quick deployment and minimal disruption to existing workflows.",
  },
  dealStage: "Discovery",
  interactionHistory: [
    { date: "Feb 9, 2026", type: "Meeting", summary: "Initial discovery call — discussed pain points in operations workflow" },
    { date: "Jan 28, 2026", type: "Email", summary: "Outreach email with case study for consulting firms" },
    {
      date: "Dec 12, 2025", type: "Meeting",
      summary: "Previous Atlas intelligence review meeting — open the linked workspace page",
      link: "https://id-preview--8106e8a3-282e-410f-bcad-b956ea857807.lovable.app",
    },
  ],
  neuro: NEURO_PROFILE_DEFAULT,
};

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

export function ContactCard({ meeting, onClose, onBotJoin }: ContactCardProps) {
  const isGmailMeeting = meeting.id === "6";
  const data = isGmailMeeting ? GMAIL_MOCK_DATA : MOCK_DATA;
  const neuro = data.neuro;

  const [dealStage, setDealStage] = useState(data.dealStage);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [enrichingParticipant, setEnrichingParticipant] = useState<string | null>(null);
  const [enrichedProfiles, setEnrichedProfiles] = useState<Set<string>>(new Set());
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [addProfileTarget, setAddProfileTarget] = useState<string | null>(null);

  const handleEnrichClick = (name: string) => setEnrichingParticipant(name);

  const handleEnrichComplete = useCallback(() => {
    if (enrichingParticipant) {
      setEnrichedProfiles((prev) => new Set(prev).add(enrichingParticipant));
      setEnrichingParticipant(null);
      setViewingProfile(enrichingParticipant);
    }
  }, [enrichingParticipant]);

  const handleEnrichClose = () => setEnrichingParticipant(null);

  const handleAddProfile = (linkedinUrl: string) => {
    if (addProfileTarget) {
      toast.success(`LinkedIn profile linked for ${addProfileTarget}`);
      setAddProfileTarget(null);
      setEnrichingParticipant(addProfileTarget);
    }
  };

  const handleCopyScript = () => {
    if (neuro) {
      navigator.clipboard.writeText(neuro.openingScript.text);
      toast.success("Opening script copied to clipboard");
    }
  };

  const profileData = viewingProfile ? getEnrichedProfile(viewingProfile) : null;

  return (
    <>
      <div className="flex w-[380px] flex-col border-l bg-card">
        {/* ── Streamlined Contact Header ── */}
        <div className="border-b px-4 py-3 bg-gradient-to-br from-secondary to-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {data.primaryContact.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-forskale-teal border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{data.primaryContact.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {data.primaryContact.jobTitle} @ {data.companyName}
              </p>
              <p className="text-[11px] text-primary mt-0.5 truncate">{data.primaryContact.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="h-8 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0">
              Join Meeting
            </button>
            <button className="h-8 rounded-lg border border-forskale-teal/30 bg-transparent px-3 text-xs font-semibold text-forskale-teal transition-all hover:-translate-y-0.5 hover:bg-forskale-teal/10 hover:shadow-[0_4px_12px_hsl(var(--forskale-teal)/0.2)]" onClick={onBotJoin}>
              Bot Join
            </button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Enrich
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 scrollbar-thin space-y-4">

          {/* ── 🧠 Cognitive Profile (Primary Section) ── */}
          {neuro && (
            <section className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">Cognitive Profile</h4>
                <Badge variant="outline" className="ml-auto text-[10px] border-purple-200 dark:border-purple-700">
                  <Zap className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
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
                        <p className="text-[10px] text-destructive">Personal email — auto-enrich unavailable</p>
                      )}
                    </div>
                    {isEnriched ? (
                      <button
                        className="flex h-7 items-center gap-1 rounded-lg border border-forskale-teal/30 bg-transparent px-3 text-xs font-semibold text-forskale-teal transition-all hover:-translate-y-0.5 hover:bg-forskale-teal/10"
                        onClick={() => setViewingProfile(p.name)}
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
                          onClick={() => setAddProfileTarget(p.name)}
                        >
                          <UserPlus className="h-3 w-3" /> Add Profile
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5"
                        onClick={() => handleEnrichClick(p.name)}
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
              {data.interactionHistory.map((item, i) => (
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
              ))}
            </div>
          </section>
        </div>
      </div>

      {profileData && viewingProfile && (
        <EnrichedProfileCard data={profileData} onClose={() => setViewingProfile(null)} />
      )}
      <EnrichmentLoadingModal open={!!enrichingParticipant} onComplete={handleEnrichComplete} onClose={handleEnrichClose} participantName={enrichingParticipant || ""} />
      <AddProfileDialog open={!!addProfileTarget} onClose={() => setAddProfileTarget(null)} onSubmit={handleAddProfile} participantName={addProfileTarget || ""} />
    </>
  );
}
