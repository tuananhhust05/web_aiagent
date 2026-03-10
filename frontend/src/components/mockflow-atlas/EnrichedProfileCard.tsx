import { useState } from "react";
import { X, MapPin, Building2, Globe, Heart, Linkedin, Lock, Check, XCircle, MessageSquare, Brain, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { cn } from "../../lib/utils";

interface EnrichedProfileData {
  name: string;
  title: string;
  company: string;
  tenure: string;
  location: string;
  linkedinUrl: string;
  languages: string[];
  interests: string[];
  disc: {
    type: string;
    label: string;
    color: string;
    traits: string[];
  };
  compatibility: {
    level: string;
    percentage: number;
  };
  communicationStrategy: {
    dos: { action: string; example: string }[];
    donts: { action: string; example: string }[];
  };
  personalityTraits: {
    archetype: string;
    traits: { name: string; description: string }[];
  };
}

interface EnrichedProfileCardProps {
  data: EnrichedProfileData;
  onClose: () => void;
}

const MOCK_PROFILES: Record<string, EnrichedProfileData> = {
  "Luca Bianchi": {
    name: "Luca Bianchi",
    title: "CTIO @ MESA | AWS Serverless Hero | Cursor Ambassador | 10+ yrs Scaling AI & Cloud Platforms | International Speaker | Technologist",
    company: "MESA",
    tenure: "1 year",
    location: "Pavia, IT",
    linkedinUrl: "#",
    languages: ["English", "Italian"],
    interests: ["Serverless Technologies", "Teaching", "Podcasting", "Community Building", "Blockchain Technologies"],
    disc: {
      type: "GO-GETTER",
      label: "Id",
      color: "bg-amber-500",
      traits: ["Energetic", "Expressive", "Visionary", "Confident", "Fast-Moving"],
    },
    compatibility: { level: "High", percentage: 75 },
    communicationStrategy: {
      dos: [
        { action: "Propose next steps while excitement is high", example: '"While this is fresh, should we book a working session?"' },
        { action: "Actively steer the conversation back when it drifts", example: '"That\'s a great idea! Let\'s tie it back to next steps."' },
        { action: "Use expressive language that still points to outcomes", example: '"This helps teams move faster without added friction."' },
      ],
      donts: [
        { action: "Delay momentum to follow up later", example: '"I\'ll send a recap and we\'ll decide."' },
        { action: "Let enthusiasm derail progress", example: '"Totally!"' },
        { action: "Use purely technical or dry language", example: '"This optimizes operational throughput."' },
      ],
    },
    personalityTraits: {
      archetype: "Influential-Dominant",
      traits: [
        { name: "Energetic", description: "radiates intensity and drive" },
        { name: "Expressive", description: "openly shares thoughts and feelings" },
        { name: "Visionary", description: "sees the big picture" },
        { name: "Confident", description: "shows self-belief in speech" },
        { name: "Fast-Moving", description: "moves quickly in decision-making" },
        { name: "Persuasive", description: "influences others by combining vision and confidence" },
      ],
    },
  },
  "Maria Rossi": {
    name: "Maria Rossi",
    title: 'Account Executive | Driving Revenue Growth and Building Lasting Client Relationships',
    company: "CPP Associates, Inc.",
    tenure: "2 years, 7 months",
    location: "Clinton, New Jersey, US",
    linkedinUrl: "#",
    languages: ["English"],
    interests: ["Networking With Local Organizations", "Wine Expertise", "Sustainable Business Practices", "Culinary Management", "Cloud Technology"],
    disc: {
      type: "ENTHUSIAST",
      label: "I",
      color: "bg-green-500",
      traits: ["Optimistic", "Social", "Outgoing", "Talkative", "People-Centric"],
    },
    compatibility: { level: "Medium", percentage: 65 },
    communicationStrategy: {
      dos: [
        { action: "Use one clear example to prove a point.", example: '"This is how one team rolled this out."' },
        { action: "Confirm commitment explicitly when enthusiasm is high.", example: '"This sounds exciting – what would you need to say yes to this?"' },
        { action: "Reference other customers to reinforce trust.", example: '"Teams similar to yours moved fast with this."' },
      ],
      donts: [
        { action: "Stack multiple examples to convince.", example: '"Let me show you three different cases."' },
        { action: "Assume excitement means the deal is moving.", example: '"Sounds like you\'re sold."' },
        { action: "Rely only on logic or specs.", example: '"Here\'s the detailed technical breakdown."' },
      ],
    },
    personalityTraits: {
      archetype: "Influential",
      traits: [
        { name: "Optimistic", description: "maintains a positive outlook" },
        { name: "Social", description: "enjoys being around others" },
        { name: "Outgoing", description: "naturally connects with people" },
        { name: "Talkative", description: "comfortable in ongoing dialogue" },
        { name: "People-Centric", description: "focused on relationships" },
        { name: "Inspiring", description: "energizes others through enthusiasm and encouragement" },
      ],
    },
  },
  "Marco Verdi": {
    name: "Marco Verdi",
    title: "Freelance Product Designer | UX Strategy & Design Systems | Helping Startups Ship Faster",
    company: "Self-employed",
    tenure: "3 years",
    location: "Rome, IT",
    linkedinUrl: "#",
    languages: ["English", "Italian", "Spanish"],
    interests: ["Design Systems", "Figma Plugins", "Remote Work Culture", "Startup Ecosystems", "Photography"],
    disc: {
      type: "COUNSELOR",
      label: "Si",
      color: "bg-blue-500",
      traits: ["Patient", "Empathetic", "Reliable", "Thoughtful", "Supportive"],
    },
    compatibility: { level: "High", percentage: 80 },
    communicationStrategy: {
      dos: [
        { action: "Give them time to process before asking for decisions.", example: '"Take your time — happy to revisit this next week."' },
        { action: "Show genuine interest in their perspective.", example: '"I\'d love to hear how you\'ve approached this before."' },
        { action: "Provide clear structure and next steps.", example: '"Here\'s a simple roadmap so we stay aligned."' },
      ],
      donts: [
        { action: "Rush them into snap decisions.", example: '"We need an answer today."' },
        { action: "Overwhelm with aggressive sales tactics.", example: '"This deal expires in 24 hours."' },
        { action: "Dismiss their need for consensus.", example: '"You don\'t need anyone else\'s input."' },
      ],
    },
    personalityTraits: {
      archetype: "Steady-Influential",
      traits: [
        { name: "Patient", description: "takes time to evaluate before acting" },
        { name: "Empathetic", description: "deeply understands others' needs" },
        { name: "Reliable", description: "follows through on commitments" },
        { name: "Thoughtful", description: "considers impacts before speaking" },
        { name: "Supportive", description: "prioritizes harmony and collaboration" },
        { name: "Diplomatic", description: "navigates conflict with grace and tact" },
      ],
    },
  },
};

export function getEnrichedProfile(name: string): EnrichedProfileData | undefined {
  return MOCK_PROFILES[name];
}

export function EnrichedProfileCard({ data, onClose }: EnrichedProfileCardProps) {
  const [openSection, setOpenSection] = useState<string>("communication");

  const compatColor = data.compatibility.percentage >= 70 ? "text-atlas-success" : "text-atlas-warning";
  const freeCreditsRemaining = 5;

  return (
    <div className="flex w-[420px] flex-col border-l bg-card h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Prospect Intelligence</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 scrollbar-thin space-y-5">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar placeholder with ring */}
          <div className="relative mb-3">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {data.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            {/* Decorative ring arc */}
            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-atlas-warning" />
          </div>

          <h2 className="text-base font-semibold text-primary">{data.name}</h2>
          <p className="mt-1 max-w-[280px] text-xs text-muted-foreground leading-relaxed">{data.title}</p>
          <a href={data.linkedinUrl} className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <Linkedin className="h-3 w-3" /> LinkedIn Profile
          </a>
        </div>

        {/* Details */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground">{data.location}</span>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <span className="font-medium text-foreground">{data.company}</span>
              <p className="text-muted-foreground">{data.tenure}</p>
            </div>
          </div>
          {data.languages.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex gap-1.5">
                {data.languages.map((l) => (
                  <Badge key={l} variant="outline" className="text-[10px] px-2 py-0">{l}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interests */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Personal Interests ({data.interests.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.interests.map((interest) => (
              <Badge key={interest} variant="secondary" className="text-[10px]">{interest}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* DISC */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-foreground">{data.disc.type}</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">DISC:</span>
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white", data.disc.color)}>
              {data.disc.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.disc.traits.map((trait) => (
              <Badge key={trait} className="border-primary/30 bg-primary/10 text-primary text-[10px]">{trait}</Badge>
            ))}
          </div>
        </div>

        {/* Compatibility */}
        <div>
          <p className="text-xs font-medium text-muted-foreground">Compatibility</p>
          <p className={cn("text-sm font-semibold", compatColor)}>
            {data.compatibility.level}: {data.compatibility.percentage}%
          </p>
        </div>

        <Separator />

        {/* Premium Section: Communication Strategy & Personality */}
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Prospect Intelligence</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Basic intelligence is free. Deeper psychological insights use premium credits.
                </p>
              </div>
              <Badge className="border-primary/30 bg-background text-primary">
                <Sparkles className="h-3 w-3" />
                {freeCreditsRemaining} free credits
              </Badge>
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            value={openSection}
            onValueChange={(value) => setOpenSection(value)}
            className="space-y-3"
          >
            <AccordionItem value="communication" className="overflow-hidden rounded-xl border bg-card">
              <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">Communication Strategy</h4>
                      <Badge variant="outline" className="border-primary/30 text-primary">Premium</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Expand to view sales-specific do's and don'ts powered by 1 free credit.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      Premium insight unlocked with free credit
                    </div>
                    <span className="text-[11px] text-muted-foreground">Unlimited access on paid plan</span>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border/70">
                    <div className="grid grid-cols-2 border-b border-border/70 bg-background/80 text-xs font-semibold">
                      <div className="flex items-center gap-2 px-3 py-2 text-atlas-success">
                        <Check className="h-3.5 w-3.5" /> Do
                      </div>
                      <div className="flex items-center gap-2 border-l border-border/70 px-3 py-2 text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Don't
                      </div>
                    </div>
                    {data.communicationStrategy.dos.map((item, i) => (
                      <div key={i} className="grid grid-cols-2 border-b border-border/70 last:border-b-0">
                        <div className="bg-background/60 px-3 py-3">
                          <p className="text-[12px] font-semibold text-atlas-success">{item.action}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.example}</p>
                        </div>
                        <div className="border-l border-border/70 bg-background/30 px-3 py-3">
                          <p className="text-[12px] font-semibold text-destructive">
                            {data.communicationStrategy.donts[i]?.action}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {data.communicationStrategy.donts[i]?.example}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="personality" className="overflow-hidden rounded-xl border bg-card">
              <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-atlas-warning/10 text-atlas-warning">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">Personality Traits</h4>
                      <Badge variant="outline" className="border-primary/30 text-primary">Premium</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Expand to view deeper psychological analysis and buying behavior cues.
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="rounded-xl border border-atlas-warning/30 bg-atlas-warning/5 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-atlas-warning">{data.personalityTraits.archetype}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Advanced behavioral intelligence available now via your free credits.
                      </p>
                    </div>
                    <Badge variant="outline" className="border-atlas-warning/40 bg-background/80 text-atlas-warning">
                      Paid after trial
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {data.personalityTraits.traits.map((trait, i) => (
                      <div key={i} className="rounded-lg border border-atlas-warning/20 bg-background/70 p-2.5 text-[11px]">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-[10px] font-bold text-atlas-warning">0{i + 1}</span>
                          <div>
                            <p className="font-semibold text-foreground">{trait.name}</p>
                            <p className="mt-1 text-muted-foreground">{trait.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
