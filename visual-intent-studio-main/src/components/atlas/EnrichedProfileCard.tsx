import { useState } from "react";
import {
  X,
  Brain,
  Sparkles,
  Target,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Zap,
  Users,
  Shield,
  BarChart3,
  Linkedin,
  MapPin,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Data Model ──────────────────────────────────────────────────────

interface CognitiveProfile {
  decisionStyle: { score: number; label: string; description: string };
  riskTolerance: { score: number; label: string; description: string };
  decisionTriggers: { label: string; color: string }[];
}

interface ApproachGuidance {
  dos: { action: string; example: string }[];
  donts: { action: string; example: string }[];
  biasAlert: { name: string; description: string };
}

interface OpeningScript {
  text: string;
  whyItWorks: { label: string; reason: string }[];
}

interface CognitiveRisk {
  title: string;
  description: string;
  icon?: "users" | "shield" | "alert";
}

export interface EnrichedProfileData {
  name: string;
  title: string;
  company: string;
  summary: string;
  location?: string;
  experience?: string;
  linkedinUrl?: string;
  cognitiveProfile: CognitiveProfile;
  approach: ApproachGuidance;
  openingScript: OpeningScript;
  cognitiveRisks: CognitiveRisk[];
  // Legacy fields kept for backward compat
  tenure?: string;
  languages?: string[];
  interests?: string[];
  disc?: { type: string; label: string; color: string; traits: string[] };
  compatibility?: { level: string; percentage: number };
  communicationStrategy?: { dos: { action: string; example: string }[]; donts: { action: string; example: string }[] };
  personalityTraits?: { archetype: string; traits: { name: string; description: string }[] };
}

interface EnrichedProfileCardProps {
  data: EnrichedProfileData;
  onClose: () => void;
}

// ── Mock Data ───────────────────────────────────────────────────────

const MOCK_PROFILES: Record<string, EnrichedProfileData> = {
  "Luca Bianchi": {
    name: "Luca Bianchi",
    title: "CTIO @ MESA",
    company: "MESA",
    summary: "Visionary tech leader who moves fast on bold ideas",
    location: "Milan, IT",
    experience: "8+ years",
    linkedinUrl: "#",
    cognitiveProfile: {
      decisionStyle: { score: 80, label: "Analytical", description: "Data-driven but swayed by vision and momentum" },
      riskTolerance: { score: 72, label: "Risk-Seeking", description: "Embraces bold moves, early adopter mindset" },
      decisionTriggers: [
        { label: "Innovation Edge", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
        { label: "Speed to Market", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
        { label: "Technical Fit", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
      ],
    },
    approach: {
      dos: [
        {
          action: "Lead with technical differentiation",
          example: '"Here\'s what makes this architecturally unique..."',
        },
        {
          action: "Propose next steps while excitement is high",
          example: '"Should we book a working session this week?"',
        },
      ],
      donts: [
        { action: "Don't slow down with excessive process", example: "Present maximum 2 paths forward" },
        { action: "Don't lead with ROI spreadsheets", example: "He values vision over financial justification" },
      ],
      biasAlert: {
        name: "Authority Bias Active",
        description: "Reference industry leaders and technical pioneers to build credibility",
      },
    },
    openingScript: {
      text: "\"Luca, I know you're pushing the envelope on serverless. We just helped a similar CTO cut deployment cycles by 60% while scaling to 10x traffic. What's the biggest bottleneck you're hitting right now?\"",
      whyItWorks: [
        { label: "Specificity", reason: "Concrete metrics signal competence" },
        { label: "Peer framing", reason: "References similar technical leaders" },
        { label: "Discovery focus", reason: "Open question invites problem-sharing" },
      ],
    },
    cognitiveRisks: [
      {
        title: "Shiny Object Syndrome",
        icon: "alert",
        description: "May lose interest if implementation timeline is long — keep momentum",
      },
      {
        title: "Stakeholder Bypass",
        icon: "users",
        description: "Tends to decide solo — confirm if others need buy-in",
      },
    ],
  },
  "Maria Rossi": {
    name: "Maria Rossi",
    title: "Account Executive @ Nova Consulting",
    company: "Nova Consulting",
    summary: "Relationship-driven sales leader who values social proof and team consensus",
    location: "Clinton, NJ",
    experience: "2+ years",
    linkedinUrl: "#",
    cognitiveProfile: {
      decisionStyle: {
        score: 65,
        label: "Emotional",
        description: "Responds to stories, relationships, and social proof over raw data",
      },
      riskTolerance: {
        score: 55,
        label: "Moderate",
        description: "Comfortable with change when peers validate the decision",
      },
      decisionTriggers: [
        { label: "Social Proof", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
        { label: "Relationship", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
        { label: "Simplicity", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
      ],
    },
    approach: {
      dos: [
        {
          action: "Lead with Customer Success Stories",
          example:
            '"Here\'s how a similar company achieved 40% growth" — triggers social proof bias and reduces perceived risk',
        },
        {
          action: "Confirm commitment explicitly when enthusiasm is high",
          example: '"What would you need to say yes to this?"',
        },
      ],
      donts: [
        {
          action: "Avoid Technical Specifications First",
          example: "Overwhelming cognitive load — build emotional connection before introducing complexity",
        },
        { action: "Don't assume excitement means the deal is moving", example: "Validate with concrete next steps" },
      ],
      biasAlert: {
        name: "Social Proof Dependency",
        description:
          "Needs peer validation — prepare customer references and case studies before proposing new solutions",
      },
    },
    openingScript: {
      text: "\"Maria, thanks for making time. I wanted to share how we helped CPP Associates' peer company increase their client retention by 35% in just 90 days. The team was initially skeptical, but once they saw the results, they became our biggest advocates. What's your biggest challenge right now with client relationships?\"",
      whyItWorks: [
        { label: "Social proof", reason: '"Peer company" creates immediate relevance and trust' },
        { label: "Skepticism acknowledgment", reason: "Shows understanding of natural resistance" },
        { label: "Discovery focus", reason: "Ends with open question to invite sharing" },
      ],
    },
    cognitiveRisks: [
      {
        title: "High Social Proof Dependency",
        icon: "users",
        description:
          "Needs peer validation before committing — prepare customer references and industry case studies before proposing solutions",
      },
      {
        title: "Status Quo Bias Active",
        icon: "shield",
        description:
          "Comfortable with current processes — frame changes as improvements to existing systems rather than replacements",
      },
    ],
  },
  "Marco Verdi": {
    name: "Marco Verdi",
    title: "Product Designer @ Self-employed",
    company: "Self-employed",
    summary: "Methodical designer who values clarity and structure",
    location: "Rome, IT",
    experience: "5+ years",
    linkedinUrl: "#",
    cognitiveProfile: {
      decisionStyle: {
        score: 50,
        label: "Balanced",
        description: "Weighs options carefully, values both logic and intuition",
      },
      riskTolerance: { score: 30, label: "Conservative", description: "Prefers proven approaches with clear outcomes" },
      decisionTriggers: [
        { label: "Quality Assurance", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
        { label: "User Impact", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
        { label: "Process Clarity", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
      ],
    },
    approach: {
      dos: [
        {
          action: "Give them time to process before asking for decisions",
          example: '"Take your time — happy to revisit this next week."',
        },
        {
          action: "Show genuine interest in their perspective",
          example: "\"I'd love to hear how you've approached this before.\"",
        },
      ],
      donts: [
        { action: "Don't rush into snap decisions", example: "Avoid artificial urgency" },
        { action: "Don't overwhelm with aggressive sales tactics", example: "Patience builds trust with this profile" },
      ],
      biasAlert: {
        name: "Status Quo Bias Active",
        description: "Show how your solution integrates with their existing workflow",
      },
    },
    openingScript: {
      text: "\"Marco, I really admire the design systems work you've been doing. We've been helping freelance designers streamline their client handoff process — one reduced revision cycles by 40%. What's the most time-consuming part of your current workflow?\"",
      whyItWorks: [
        { label: "Personalization", reason: "References his specific expertise" },
        { label: "Empathy", reason: "Shows understanding of freelance challenges" },
        { label: "Practical focus", reason: "Targets workflow efficiency" },
      ],
    },
    cognitiveRisks: [
      {
        title: "Decision Delay Risk",
        icon: "alert",
        description: "May over-analyze — provide clear comparison framework",
      },
      {
        title: "Scope Sensitivity",
        icon: "shield",
        description: "Needs to see how it fits within existing design system approach",
      },
    ],
  },
};

export function getEnrichedProfile(name: string): EnrichedProfileData | undefined {
  return MOCK_PROFILES[name];
}

// ── Sub-components ──────────────────────────────────────────────────

function NeuroGauge({
  label,
  score,
  description,
  variant,
}: {
  label: string;
  score: number;
  description: string;
  variant: "decision" | "risk";
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {score}% {variant === "decision" ? (score >= 60 ? "Emotional" : score >= 40 ? "Balanced" : "Analytical") : ""}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            variant === "decision"
              ? "bg-gradient-to-r from-pink-500 to-purple-500"
              : "bg-gradient-to-r from-green-500 to-amber-500",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CopyableScript({ text }: { text: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    toast.success("Script copied to clipboard");
  };

  return (
    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200/50 dark:border-blue-800/30">
      <div className="flex items-start justify-between gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed italic">{text}</p>
    </div>
  );
}

function RiskIcon({ type }: { type?: string }) {
  switch (type) {
    case "users":
      return <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />;
    case "shield":
      return <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />;
  }
}

// ── Main Component ──────────────────────────────────────────────────

export function EnrichedProfileCard({ data, onClose }: EnrichedProfileCardProps) {
  const [openSection, setOpenSection] = useState<string>("approach");
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  const firstName = data.name.split(" ")[0];

  return (
    <div className="flex w-[420px] flex-col border-l bg-card h-full">
      {/* ─── Panel Header ─── */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Prospect Intelligence</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* ─── Cognitive-Focused Contact Header ─── */}
        <div className="border-b px-4 py-3 bg-gradient-to-br from-muted/50 to-primary/[0.03]">
          <div className="flex items-center gap-3">
            {/* Compact Avatar with status dot */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{initials}</span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-forskale-teal border-2 border-card" />
            </div>

            {/* Essential Identity + Cognitive Summary */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{data.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{data.title}</p>
              {/* One-line cognitive summary instead of LinkedIn bio */}
              <p className="text-xs text-primary mt-0.5 font-medium truncate">{data.summary}</p>
            </div>

            {/* Minimal Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {data.linkedinUrl && (
                <a href={data.linkedinUrl} className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs border border-forskale-teal/30 hover:bg-forskale-teal/10"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Micro Context Row */}
          <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            {data.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {data.location}
              </span>
            )}
            {data.experience && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {data.experience} experience
              </span>
            )}
          </div>
        </div>

        {/* ─── Cognitive Profile (Always Visible) ─── */}
        <section className="px-4 py-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-semibold text-foreground">Cognitive Profile</h4>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
            >
              <Zap className="h-3 w-3 mr-1" />
              Neurosales-Powered
            </Badge>
          </div>

          <div className="space-y-4">
            <NeuroGauge
              label="Decision Style"
              score={data.cognitiveProfile.decisionStyle.score}
              description={data.cognitiveProfile.decisionStyle.description}
              variant="decision"
            />
            <NeuroGauge
              label="Risk Tolerance"
              score={data.cognitiveProfile.riskTolerance.score}
              description={data.cognitiveProfile.riskTolerance.description}
              variant="risk"
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Decision Triggers:</p>
            <div className="flex flex-wrap gap-1.5">
              {data.cognitiveProfile.decisionTriggers.map((trigger) => (
                <Badge key={trigger.label} variant="secondary" className={cn("text-[10px]", trigger.color)}>
                  {trigger.label}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Neuroscience Action Accordions ─── */}
        <div className="px-4 py-4">
          <Accordion
            type="single"
            collapsible
            value={openSection}
            onValueChange={(v) => setOpenSection(v)}
            className="space-y-2"
          >
            {/* Section 1: How to Influence This Brain (personalized) */}
            <AccordionItem value="approach" className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-3 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-forskale-teal" />
                  <span className="text-sm font-semibold text-foreground">How to Influence {firstName}'s Brain</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 pt-1">
                <div className="space-y-2.5">
                  {data.approach.dos.map((item, i) => (
                    <div
                      key={`do-${i}`}
                      className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200/50 dark:border-green-800/30"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-900 dark:text-green-100 mb-1 text-xs">{item.action}</p>
                          <p className="text-green-700 dark:text-green-300 text-[11px] leading-relaxed">
                            {item.example}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.approach.donts.map((item, i) => (
                    <div
                      key={`dont-${i}`}
                      className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200/50 dark:border-red-800/30"
                    >
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-900 dark:text-red-100 mb-1 text-xs">{item.action}</p>
                          <p className="text-red-700 dark:text-red-300 text-[11px] leading-relaxed">{item.example}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Bias Alert */}
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1 text-xs">
                          {data.approach.biasAlert.name}
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
                          {data.approach.biasAlert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>


            {/* Section 3: Cognitive Risk Alerts - commented out */}
            {/*
            <AccordionItem value="risks" className="border rounded-lg overflow-hidden">
              ...Risk Alerts section removed...
            </AccordionItem>
            */}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

// ── Multi-Participant Group Dynamics ────────────────────────────────

interface GroupDynamicsProps {
  participants: { name: string; initials: string; role: string }[];
  alignment: number;
  riskCompat: string;
  commComplexity: string;
  decisionMaker: string;
  keyInfluencer: string;
  strategicInsight: string;
}

export function GroupDynamicsCard({
  participants,
  alignment,
  riskCompat,
  commComplexity,
  decisionMaker,
  keyInfluencer,
  strategicInsight,
}: GroupDynamicsProps) {
  return (
    <section className="px-4 py-3 mx-4 mt-3 rounded-xl border border-forskale-teal/20 bg-gradient-to-br from-forskale-teal/[0.04] to-forskale-blue/[0.04] space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-forskale-teal" />
        <h4 className="text-xs font-semibold text-foreground">Group Dynamics</h4>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card/60 border p-2 text-center">
          <Brain className="h-3.5 w-3.5 mx-auto text-purple-500 mb-1" />
          <p className="text-sm font-bold text-foreground">{alignment}%</p>
          <p className="text-[9px] text-muted-foreground">Decision Align</p>
        </div>
        <div className="rounded-lg bg-card/60 border p-2 text-center">
          <Shield className="h-3.5 w-3.5 mx-auto text-green-500 mb-1" />
          <p className="text-sm font-bold text-green-500">{riskCompat}</p>
          <p className="text-[9px] text-muted-foreground">Risk Compat.</p>
        </div>
        <div className="rounded-lg bg-card/60 border p-2 text-center">
          <BarChart3 className="h-3.5 w-3.5 mx-auto text-amber-500 mb-1" />
          <p className="text-sm font-bold text-amber-500">{commComplexity}</p>
          <p className="text-[9px] text-muted-foreground">Comm. Complex</p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-forskale-green" />
          <span className="text-muted-foreground">Decision Maker:</span>
          <span className="font-semibold text-foreground">{decisionMaker}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-forskale-teal" />
          <span className="text-muted-foreground">Key Influencer:</span>
          <span className="font-semibold text-foreground">{keyInfluencer}</span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic leading-relaxed">{strategicInsight}</p>
    </section>
  );
}

// ── Participant Selector ────────────────────────────────────────────

interface ParticipantSelectorProps {
  participants: { id: string; name: string; initials: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ParticipantSelector({ participants, activeId, onSelect }: ParticipantSelectorProps) {
  if (participants.length <= 1) return null;

  return (
    <div className="border-b px-3 py-2 bg-muted/30">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {participants.map((p) => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-300 min-w-[60px] flex-shrink-0",
                isActive ? "bg-gradient-to-br from-forskale-green/10 to-forskale-teal/10" : "hover:bg-muted/50",
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isActive
                    ? "bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue text-white shadow-[0_0_12px_hsl(var(--forskale-green)/0.4)] ring-2 ring-forskale-teal/30"
                    : "bg-primary/10 text-primary",
                )}
              >
                {p.initials}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium truncate max-w-[56px]",
                  isActive ? "text-forskale-teal" : "text-muted-foreground",
                )}
              >
                {p.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
