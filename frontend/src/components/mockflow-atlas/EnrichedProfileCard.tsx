import { useState } from "react";
import { X, MapPin, Building2, Globe, Heart, Linkedin, Lock, Check, XCircle, MessageSquare, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { type EnrichedProfileData } from "@/lib/api";

interface EnrichedProfileCardProps {
  data: EnrichedProfileData;
  onClose: () => void;
}


export function EnrichedProfileCard({ data: rawData, onClose }: EnrichedProfileCardProps) {
  const [openSection, setOpenSection] = useState<string>("communication");

  const data: EnrichedProfileData = {
    name: rawData.name || "—",
    title: rawData.title || "—",
    company: rawData.company || "—",
    tenure: rawData.tenure || "—",
    location: rawData.location || "—",
    linkedinUrl: rawData.linkedinUrl || "#",
    languages: rawData.languages || [],
    interests: rawData.interests || [],
    disc: rawData.disc || { type: "—", label: "—", color: "bg-gray-400", traits: [] },
    compatibility: rawData.compatibility || { level: "Medium", percentage: 65 },
    communicationStrategy: rawData.communicationStrategy || { dos: [], donts: [] },
    personalityTraits: rawData.personalityTraits || { archetype: "—", traits: [] },
  };

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
