import { useState } from "react";
import { CheckCircle, AlertTriangle, MinusCircle, ArrowUpRight, ArrowDownRight, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type MomentType = "positive" | "negative" | "neutral" | "stakeholder" | "next-step";
type SceneKey = "up" | "down" | "flat";

interface KeyMoment {
  text: string;
  type: MomentType;
  category: string;
  categoryColor: "green" | "amber" | "red" | "teal" | "blue";
}

interface KeyMomentsScene {
  status: "successful" | "needs-attention" | "stable";
  statusLabel: string;
  subtitle: string;
  interestFrom: { label: string; pctRange: string; color: string };
  interestTo: { label: string; pctRange: string; color: string };
  direction: "up" | "down" | "flat";
  directionBadge: { label: string; color: "green" | "amber" | "red" };
  moments: KeyMoment[];
  conclusion: string;
  ctaLabel: string;
  ctaPrompt: string;
}

const categoryColorMap = {
  green: "bg-[#EAF3DE] text-[#27500A] border-[rgba(59,109,17,0.3)]",
  amber: "bg-[#FAEEDA] text-[#633806] border-[rgba(186,117,23,0.3)]",
  red: "bg-[#FCEBEB] text-[#791F1F] border-[rgba(162,45,45,0.3)]",
  teal: "bg-[#E1F5EE] text-[#085041] border-[rgba(15,110,86,0.3)]",
  blue: "bg-[#E6F1FB] text-[#0C447C] border-[rgba(24,95,165,0.3)]",
};

const iconBgMap = {
  green: "bg-[#EAF3DE]",
  amber: "bg-[#FAEEDA]",
  red: "bg-[#FCEBEB]",
  teal: "bg-[#E1F5EE]",
  blue: "bg-[#E6F1FB]",
};

const iconColorMap = {
  green: "text-[#3B6D11]",
  amber: "text-[#854F0B]",
  red: "text-[#A32D2D]",
  teal: "text-[#0F6E56]",
  blue: "text-[#185FA5]",
};

const dotColorMap = {
  green: "bg-[#1D9E75]",
  amber: "bg-[#BA7517]",
  red: "bg-[#E24B4A]",
};

const statusConfig = {
  successful: {
    Icon: CheckCircle,
    iconStroke: "#1D9E75",
    badgeClass: "bg-[#EAF3DE] text-[#27500A] border-[rgba(59,109,17,0.3)]",
    dotColor: "green" as const,
  },
  "needs-attention": {
    Icon: AlertTriangle,
    iconStroke: "#E24B4A",
    badgeClass: "bg-[#FCEBEB] text-[#791F1F] border-[rgba(162,45,45,0.3)]",
    dotColor: "red" as const,
  },
  stable: {
    Icon: MinusCircle,
    iconStroke: "#BA7517",
    badgeClass: "bg-[#FAEEDA] text-[#633806] border-[rgba(186,117,23,0.3)]",
    dotColor: "amber" as const,
  },
};

const directionBadgeColorMap = {
  green: "bg-[#EAF3DE] text-[#27500A] border-[rgba(59,109,17,0.3)]",
  amber: "bg-[#FAEEDA] text-[#633806] border-[rgba(186,117,23,0.3)]",
  red: "bg-[#FCEBEB] text-[#791F1F] border-[rgba(162,45,45,0.3)]",
};

const scenes: Record<SceneKey, KeyMomentsScene> = {
  up: {
    status: "successful",
    statusLabel: "Successful progression",
    subtitle: "The most strategically relevant developments from this call",
    interestFrom: { label: "Curiosity", pctRange: "20–30%", color: "#BA7517" },
    interestTo: { label: "Problem recognition", pctRange: "40–50%", color: "#1D9E75" },
    direction: "up",
    directionBadge: { label: "Problem recognition", color: "amber" },
    moments: [
      { text: "Prospect confirmed visibility as their main operational challenge — downstream retail tracking is fragmented across regions", type: "positive", category: "Pain confirmed", categoryColor: "green" },
      { text: "CFO involvement confirmed as required before any final commitment — new stakeholder added to the decision process", type: "stakeholder", category: "Stakeholder added", categoryColor: "teal" },
      { text: "Concern emerged around implementation complexity at scale — prospect cited potential operational disruption as a risk", type: "negative", category: "Objection", categoryColor: "amber" },
      { text: "Team aligned on phased rollout as mitigation — prospect responded positively, reducing adoption risk concern", type: "positive", category: "Risk reduced", categoryColor: "green" },
      { text: "Two other vendors are in preliminary discussions — no formal evaluation underway, but competitive pressure is present", type: "negative", category: "Competition", categoryColor: "red" },
      { text: "Next step agreed: ROI session early next month with finance team — format explicitly requested by prospect", type: "next-step", category: "Next step", categoryColor: "blue" },
    ],
    conclusion: "Prospect has a clear pain point and budget availability, but internal urgency and stakeholder alignment are still developing. CFO engagement in the next meeting will be decisive for deal progression.",
    ctaLabel: "See strategy",
    ctaPrompt: "Help me prepare the strategy for the next Lavazza meeting based on the key moments from this call",
  },
  down: {
    status: "needs-attention",
    statusLabel: "Needs attention",
    subtitle: "Slowdown signals detected — strategic action required",
    interestFrom: { label: "Evaluation", pctRange: "60–70%", color: "#1D9E75" },
    interestTo: { label: "Problem recognition", pctRange: "40–50%", color: "#E24B4A" },
    direction: "down",
    directionBadge: { label: "Interest dropped", color: "red" },
    moments: [
      { text: "Budget previously confirmed is now under internal review — CFO approval no longer guaranteed", type: "negative", category: "Budget at risk", categoryColor: "red" },
      { text: "New decision-maker introduced — the board now requires review before any progression", type: "negative", category: "New blocker", categoryColor: "red" },
      { text: "Discussion shifted toward legal and compliance concerns — topic not anticipated in call preparation", type: "negative", category: "Topic shift", categoryColor: "amber" },
      { text: "Prospect mentioned a competitor has already completed a detailed demo — competitive urgency increased", type: "negative", category: "Competitive risk", categoryColor: "amber" },
      { text: "Previously agreed next step was not honored — prospect deferred without proposing an alternative date", type: "negative", category: "Step blocked", categoryColor: "red" },
    ],
    conclusion: "The deal has slowed significantly. New decision-making blockers and a shift in approval structure require immediate strategic realignment and direct contact with newly identified stakeholders.",
    ctaLabel: "See strategy",
    ctaPrompt: "The Lavazza deal has lost interest. Help me recover and realign the strategy",
  },
  flat: {
    status: "stable",
    statusLabel: "Stable interest",
    subtitle: "No progression generated — a change of approach is needed",
    interestFrom: { label: "Trust", pctRange: "50–60%", color: "#BA7517" },
    interestTo: { label: "Trust", pctRange: "50–60%", color: "#BA7517" },
    direction: "flat",
    directionBadge: { label: "No change", color: "amber" },
    moments: [
      { text: "Prospect showed general interest but did not identify an urgent problem requiring immediate resolution", type: "neutral", category: "Low urgency", categoryColor: "amber" },
      { text: "Topics discussed remained generic — no specific use cases or concrete business metrics explored", type: "neutral", category: "Surface conversation", categoryColor: "amber" },
      { text: "Primary contact was absent — call conducted with a junior profile without decision-making authority", type: "stakeholder", category: "Limited contact", categoryColor: "teal" },
      { text: "Prospect confirmed they will invite the Head of Operations to the next session — positive signal of future engagement", type: "positive", category: "Future opportunity", categoryColor: "green" },
      { text: "Next step agreed but vague — prospect will follow up next week without a defined date or format", type: "next-step", category: "Vague step", categoryColor: "blue" },
    ],
    conclusion: "The call generated no measurable progression. Prospect maintains interest but without urgency or concrete commitment. The next meeting must include the right decision-maker and a more focused agenda on expected business outcomes.",
    ctaLabel: "See strategy",
    ctaPrompt: "Interest is flat on the Lavazza deal. Help me build a strategy to create urgency and progress",
  },
};

const MomentIcon = ({ color }: { color: string }) => {
  const bgClass = iconBgMap[color as keyof typeof iconBgMap] || iconBgMap.green;
  const textClass = iconColorMap[color as keyof typeof iconColorMap] || iconColorMap.green;

  return (
    <div className={cn("w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 mt-0.5", bgClass)}>
      <CheckCircle className={cn("h-2.5 w-2.5", textClass)} />
    </div>
  );
};

const KeyMomentsSection = () => {
  const [activeScene] = useState<SceneKey>("up");
  const scene = scenes[activeScene];
  const config = statusConfig[scene.status];
  const StatusIcon = config.Icon;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <StatusIcon className="h-[17px] w-[17px] flex-shrink-0" style={{ color: config.iconStroke }} />
        <h3 className="text-[15px] font-medium text-foreground">Key moments</h3>
        <Badge variant="outline" className={cn("text-[11px] font-medium", config.badgeClass)}>
          {scene.statusLabel}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{scene.subtitle}</p>

      {/* Interest Level Bar */}
      <div className="flex items-center gap-1.5 flex-wrap p-2.5 px-3 bg-secondary/60 rounded-lg border border-border mb-4">
        <span className="text-[11px] text-muted-foreground">Interest level:</span>
        <span className="text-sm font-medium" style={{ color: scene.interestFrom.color }}>
          {scene.interestFrom.label}
        </span>
        <span className="text-xs text-muted-foreground">{scene.interestFrom.pctRange}</span>
        <span className="text-[11px] text-muted-foreground">→</span>
        <span className="text-sm font-medium" style={{ color: scene.interestTo.color }}>
          {scene.interestTo.label}
        </span>
        <span className="text-xs text-muted-foreground">{scene.interestTo.pctRange}</span>
        {scene.direction === "up" && <ArrowUpRight className="h-3 w-3" style={{ color: "#1D9E75" }} />}
        {scene.direction === "down" && <ArrowDownRight className="h-3 w-3" style={{ color: "#E24B4A" }} />}
        {scene.direction === "flat" && <Minus className="h-3 w-3" style={{ color: "#BA7517" }} />}
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium", directionBadgeColorMap[scene.directionBadge.color])}
        >
          {scene.directionBadge.label}
        </Badge>
      </div>

      {/* Section label with pulsing dot */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="relative flex items-center justify-center w-[7px] h-[7px]">
          <span className={cn("absolute inset-[-3px] rounded-full border-[1.5px] animate-pulse opacity-35", {
            "border-[#1D9E75]": config.dotColor === "green",
            "border-[#BA7517]": config.dotColor === "amber",
            "border-[#E24B4A]": config.dotColor === "red",
          })} />
          <span className={cn("w-[7px] h-[7px] rounded-full", dotColorMap[config.dotColor])} />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Key moments</span>
      </div>

      {/* Moments List */}
      <div className="flex flex-col gap-1.5 mb-4">
        {scene.moments.map((m, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-2 px-2.5 rounded-lg border border-border bg-secondary/40"
          >
            <MomentIcon color={m.categoryColor} />
            <span className="text-[13px] text-foreground leading-relaxed flex-1">{m.text}</span>
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 self-start mt-0.5",
                categoryColorMap[m.categoryColor]
              )}
            >
              {m.category}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mb-4" />

      {/* Conclusion */}
      <div className="bg-secondary/60 border border-border rounded-lg p-3 mb-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Conclusion</p>
        <p className="text-[13px] text-foreground leading-relaxed">{scene.conclusion}</p>
      </div>

      {/* CTA */}
      <button
        onClick={() => toast.info("Opening strategy view...", { description: scene.ctaPrompt })}
        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-full bg-[hsl(var(--forskale-green))] text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
      >
        <Sparkles className="h-4 w-4" />
        Strategia
      </button>
    </div>
  );
};

export default KeyMomentsSection;
