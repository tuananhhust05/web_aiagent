import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Building2,
  Sparkles,
  Zap,
  AlertTriangle,
  Users,
  Brain,
  Star,
  FileText,
  MessageSquare,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
  Target,
  CheckCircle,
  History,
  CalendarCheck,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PlaybookAnalysisLoader from "./PlaybookAnalysisLoader";
import { AddProfileDialog } from "./AddProfileDialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDealStageForMeeting } from "./DealStageIndicator";
import { getMeetingSequence, getStrategyStatusText, getStrategyStatusDotClass, getEnterCallSubtitle, getSectionBadge } from "@/lib/meetingSequence";

// ── Participant type ──
export interface Participant {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  avatar?: string;
  isGmail?: boolean;
  cognitiveProfile: CognitiveProfile | null;
}

export interface CognitiveProfile {
  decisionStyle: { score: number; label: string; description: string };
  riskTolerance: { score: number; label: string; description: string };
  disc: { type: string; code: string };
  triggers: { label: string; color: string }[];
  summary: string;
  approach: {
    do: { title: string; action: string };
    dont: { title: string; action: string };
    bias: { name: string; description: string };
  };
  openingScript: {
    text: string;
    reasons: { principle: string; explanation: string }[];
  };
  riskAlerts: { icon: string; title: string; description: string }[];
}

// ── Archetype extensions for prospect drawer ──
interface ArchetypeData {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  personalityText: (name: string) => string;
  meetingPrep: { type: string; title: string; body: string }[];
  engage: { type: "do" | "dont"; title: string; body: string }[];
}

const ARCHETYPE_DATA: Record<string, ArchetypeData> = {
  DYNAMIC: {
    label: "DYNAMIC",
    colorClass: "text-forskale-teal",
    bgClass: "bg-forskale-teal/15",
    borderClass: "border-forskale-teal/30",
    personalityText: (name) =>
      `<strong>${name}</strong> makes fast decisions driven by momentum and vision. Drawn to bold ideas and responds well to stories of market wins. Prefers clear, simple paths forward rather than extended evaluation cycles.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Prospect is momentum-driven and impatient with slow processes. <strong>Needs to feel they're driving a bold, market-leading initiative.</strong> Frame your solution as a competitive weapon." },
      { type: "mention", title: "What to Mention First", body: "Lead with the <strong>30-day fast-track implementation plan</strong> and highlight a case study where a similar role saw immediate productivity gains." },
      { type: "avoid", title: "What to Avoid", body: "Do not pull up technical architecture diagrams unless explicitly asked. Avoid conditional language, use definitive, confident phrasing." },
      { type: "validate", title: "What to Validate", body: 'Confirm internal authority: <em>"Who else needs to see this momentum before we can pull the trigger next week?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What would make this decision easy for you today?"</em> Let them define the final blocker.' },
    ],
    engage: [
      { type: "do", title: "Push forward, don't slow down", body: "Lead with momentum. Share a fast win from a similar company." },
      { type: "do", title: "Give clear next steps", body: "Provide a path they can say yes to in the same meeting." },
      { type: "dont", title: "Avoid long theoretical presentations", body: "Detailed methodology slides will disengage them immediately." },
      { type: "dont", title: "Do not over-analyze before acting", body: "They may agree quickly and pull back later when details surface." },
    ],
  },
  METHODICAL: {
    label: "METHODICAL",
    colorClass: "text-purple-500",
    bgClass: "bg-purple-500/15",
    borderClass: "border-purple-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> needs precision and asks deep questions before committing. Slow to decide but thorough in evaluation. Appreciates completeness and structured information.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Highly sensitive to incomplete information. <strong>Needs cognitive safety through verifiable data and completeness.</strong> Do not attempt to rush." },
      { type: "mention", title: "What to Mention First", body: "Bring <strong>complete documentation</strong>, methodology, and detailed specifications. Provide materials they can study independently." },
      { type: "avoid", title: "What to Avoid", body: 'Skip the high-level vision presentation. Avoid broad statements like "industry-leading" without supporting evidence.' },
      { type: "validate", title: "What to Validate", body: '<em>"What specific details would help you feel confident about this decision?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What does your current evaluation process look like?"</em>' },
    ],
    engage: [
      { type: "do", title: "Reduce uncertainty, show completeness", body: "Frame everything with detailed evidence and thorough documentation." },
      { type: "do", title: "Show your methodology", body: "They want to understand how you arrived at your conclusions." },
      { type: "dont", title: "Do not rush the timeline", body: "Pressure tactics will backfire. Risk: Analysis Paralysis." },
      { type: "dont", title: "Do not leave gaps", body: "Incomplete answers will stall the process indefinitely." },
    ],
  },
  ANALYTICAL: {
    label: "ANALYTICAL",
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/15",
    borderClass: "border-blue-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> wants numbers, logical evaluation, and structured thinking. Focused on ROI and data models. Evaluates options through measurable criteria and clear business cases.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Wants clear ROI and data models. <strong>Needs logical justification for every claim.</strong> Co-create a business case rather than selling." },
      { type: "mention", title: "What to Mention First", body: "Lead with <strong>specific ROI metrics</strong>, calculations, and data models. Provide a spreadsheet they can interrogate." },
      { type: "avoid", title: "What to Avoid", body: "Skip storytelling without data. Avoid emotional appeals or vision-only presentations." },
      { type: "validate", title: "What to Validate", body: '<em>"What specific metrics will your internal model require to justify this investment?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What does your current baseline look like for operational efficiency?"</em>' },
    ],
    engage: [
      { type: "do", title: "Provide clear ROI and data models", body: "Frame everything in terms of efficiency gains, cost reduction, or revenue impact." },
      { type: "do", title: "Show structured analysis", body: "They want logical, step-by-step evaluation frameworks." },
      { type: "dont", title: "Do not rely on storytelling alone", body: "Narrative without data will feel thin." },
      { type: "dont", title: "Do not ignore alternatives", body: "They are likely comparing options. Help them see why yours wins." },
    ],
  },
  DIPLOMATIC: {
    label: "DIPLOMATIC",
    colorClass: "text-green-500",
    bgClass: "bg-green-500/15",
    borderClass: "border-green-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> needs buy-in from stakeholders and avoids conflict. Social validation is important. Values team consensus and collaborative decision-making over individual mandates.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Values collaborative decision-making. <strong>Needs to feel the team is part of the choice.</strong> Social validation drives their confidence." },
      { type: "mention", title: "What to Mention First", body: "Offer a <strong>group stakeholder session</strong> rather than one-on-one. Show how the solution builds consensus across teams." },
      { type: "avoid", title: "What to Avoid", body: "Don't position as a top-down mandate. They resist solutions that bypass team alignment." },
      { type: "validate", title: "What to Validate", body: '<em>"Who are the key stakeholders we should include in the evaluation?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"How does your team typically reach consensus on new initiatives?"</em>' },
    ],
    engage: [
      { type: "do", title: "Include stakeholders, build consensus", body: "Involve the team early and offer group sessions." },
      { type: "do", title: "Frame as collaborative choice", body: "They trust decisions that emerge from team alignment." },
      { type: "dont", title: "Avoid confrontational framing", body: "They resist conflict and adversarial positioning." },
      { type: "dont", title: "Do not rush the decision", body: "They need time for stakeholder alignment." },
    ],
  },
  INNOVATOR: {
    label: "INNOVATOR",
    colorClass: "text-violet-500",
    bgClass: "bg-violet-500/15",
    borderClass: "border-violet-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> thinks big picture and is future-oriented. Ignores early details in favor of transformative vision. Energized by ideas that feel ahead of the curve.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Wants to be seen as a strategic pioneer. <strong>Needs to feel this decision will define their legacy.</strong> Frame around transformation, not optimization." },
      { type: "mention", title: "What to Mention First", body: "Open with <strong>where the industry is heading in 18 months</strong> and position your solution as early access to that future." },
      { type: "avoid", title: "What to Avoid", body: "Do not bog them down with integration checklists or compliance requirements early. Keep the conversation visionary." },
      { type: "validate", title: "What to Validate", body: '<em>"How are you planning to translate this vision to the operational leads?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"Where do you see the company in two years, and where do you want to be positioned?"</em>' },
    ],
    engage: [
      { type: "do", title: "Paint the future vision, delay technical specifics", body: "Show them what the world looks like after the decision." },
      { type: "do", title: "Position as exclusive access", body: "Frame your solution as something forward-thinking companies are choosing." },
      { type: "dont", title: "Do not get lost in implementation", body: "They will tune out if the conversation becomes about rollout timelines." },
      { type: "dont", title: "Do not challenge their vision directly", body: "If you disagree, redirect rather than confront." },
    ],
  },
  PRUDENT: {
    label: "PRUDENT",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> wants authority and decision ownership with low ambiguity tolerance. Values control, security, and formal documentation. Needs to feel in charge of the process.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Needs to maintain authority and control. <strong>Low ambiguity tolerance requires formal documentation.</strong> Respect their decision ownership." },
      { type: "mention", title: "What to Mention First", body: "Lead with <strong>formal documentation, security guarantees</strong>, and compliance certifications. Show risk mitigation framework." },
      { type: "avoid", title: "What to Avoid", body: "Don't suggest informal processes or shortcuts. Avoid ambiguous timelines or vague commitments." },
      { type: "validate", title: "What to Validate", body: '<em>"What governance requirements need to be satisfied for this decision?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What are your primary concerns around control and security?"</em>' },
    ],
    engage: [
      { type: "do", title: "Respect control, mitigate risk", body: "Frame with formal documentation and security guarantees." },
      { type: "do", title: "Provide decision framework", body: "Give them structured options they can own and present." },
      { type: "dont", title: "Avoid informal approaches", body: "They need formal processes and documentation." },
      { type: "dont", title: "Do not bypass their authority", body: "Going around them will kill the deal." },
    ],
  },
  SCRUPULOUS: {
    label: "SCRUPULOUS",
    colorClass: "text-rose-500",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> challenges everything and is change-resistant, often due to previous disappointments. Low trust signals require patience and evidence-based engagement.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Low trust signals detected. <strong>Previous disappointments make them skeptical of promises.</strong> Build trust through evidence, not enthusiasm." },
      { type: "mention", title: "What to Mention First", body: "Lead with <strong>verified case studies and third-party validation</strong>. Provide references they can contact independently." },
      { type: "avoid", title: "What to Avoid", body: "Never over-promise or use superlatives. Avoid 'trust me' language. Let evidence speak." },
      { type: "validate", title: "What to Validate", body: '<em>"What would need to be true for you to feel confident in this decision?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What has your experience been with similar solutions in the past?"</em>' },
    ],
    engage: [
      { type: "do", title: "Build trust first, provide evidence", body: "Move slowly and let them verify claims independently." },
      { type: "do", title: "Acknowledge past challenges", body: "Show you understand their skepticism is earned." },
      { type: "dont", title: "Do not oversell or use hype", body: "They dismiss enthusiasm as a red flag." },
      { type: "dont", title: "Do not rush trust-building", body: "Patience is essential. Pushing will backfire." },
    ],
  },
  PRAGMATIC: {
    label: "PRAGMATIC",
    colorClass: "text-cyan-500",
    bgClass: "bg-cyan-500/15",
    borderClass: "border-cyan-500/30",
    personalityText: (name) =>
      `<strong>${name}</strong> evaluates upside quickly and is results-focused. Fast switching between options, driven by concrete ROI. Values direct communication and tangible outcomes.`,
    meetingPrep: [
      { type: "emotion", title: "Emotional Context", body: "Quick upside evaluation mindset. <strong>Needs to see concrete ROI immediately.</strong> Will switch to alternatives fast if value isn't clear." },
      { type: "mention", title: "What to Mention First", body: "Lead with <strong>concrete ROI numbers and quick wins</strong>. Show the fastest path to measurable results." },
      { type: "avoid", title: "What to Avoid", body: "Skip lengthy setup or background. Get to the numbers fast. Avoid theoretical frameworks." },
      { type: "validate", title: "What to Validate", body: '<em>"What ROI threshold would make this an easy yes?"</em>' },
      { type: "question", title: "Strategic Questions", body: '<em>"What results are you expecting in the first 90 days?"</em>' },
    ],
    engage: [
      { type: "do", title: "Show concrete ROI, maintain direct communication", body: "Frame everything around tangible, measurable results." },
      { type: "do", title: "Present quick wins", body: "Show what they get in week 1, month 1, quarter 1." },
      { type: "dont", title: "Do not waste time on theory", body: "They want outcomes, not frameworks." },
      { type: "dont", title: "Do not delay the value prop", body: "If they don't see ROI fast, they'll move on." },
    ],
  },
};

function getArchetype(discType: string): ArchetypeData {
  return ARCHETYPE_DATA[discType] || ARCHETYPE_DATA["DYNAMIC"];
}

// ── Per-participant cognitive profiles ──
const PROFILES: Record<string, CognitiveProfile> = {
  "luca-bianchi": {
    decisionStyle: { score: 75, label: "Analytical", description: "Needs concrete data and proof points" },
    riskTolerance: { score: 30, label: "Conservative", description: "Prefers proven solutions with minimal downside" },
    disc: { type: "DYNAMIC", code: "Id" },
    triggers: [
      { label: "ROI Focus", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
      { label: "Team Consensus", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
      { label: "Efficiency", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
    ],
    summary: "Data-driven operations leader who values team alignment and proven ROI",
    approach: {
      do: { title: "Lead with Authority & Data", action: '"We helped 3 consulting firms reduce delivery time by 40%", triggers authority bias' },
      dont: { title: "Avoid Pricing Before Value", action: "Loss aversion trigger, establish ROI first, then reveal investment" },
      bias: { name: "Confirmation Bias Active", description: "Ask discovery questions that reveal pain before proposing solutions" },
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
      { icon: "budget", title: "Budget Sensitivity Detected", description: 'Previous notes mention "budget freeze", reframe as ROI discussion, not cost' },
      { icon: "stakeholder", title: "Multi-Stakeholder Complexity", description: "Decision involves CFO + IT team, prepare consensus-building materials" },
    ],
  },
  "maria-rossi": {
    decisionStyle: { score: 85, label: "Analytical", description: "Requires detailed documentation and compliance proof" },
    riskTolerance: { score: 15, label: "Very Conservative", description: "Extremely risk-averse; needs guarantees and fallback plans" },
    disc: { type: "METHODICAL", code: "Cd" },
    triggers: [
      { label: "Data Accuracy", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" },
      { label: "Process Compliance", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
      { label: "Quality Assurance", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300" },
    ],
    summary: "Detail-oriented operations manager who prioritizes accuracy, compliance, and risk mitigation",
    approach: {
      do: { title: "Lead with Precision & Documentation", action: '"Our platform maintains 99.97% data accuracy with ISO-certified compliance"' },
      dont: { title: "Avoid Vague Promises", action: "Never say 'roughly' or 'approximately', she needs exact figures" },
      bias: { name: "Zero-Risk Bias Active", description: "She will gravitate toward options that eliminate risk entirely" },
    },
    openingScript: {
      text: "Maria, I appreciate your time. I know accuracy and process integrity are critical for your team. We've documented a case study with a consulting firm where we reduced data entry errors by 98.2% while maintaining full audit trail compliance. What are your current pain points around data accuracy?",
      reasons: [
        { principle: "Zero-risk bias", explanation: '"98.2%" precision appeals to perfectionist profile' },
        { principle: "Compliance framing", explanation: '"Audit trail compliance" matches her process focus' },
        { principle: "Specificity", explanation: "Exact percentages build trust with analytical minds" },
      ],
    },
    riskAlerts: [
      { icon: "stakeholder", title: "Gatekeeper Role Detected", description: "Maria likely vets solutions before escalating" },
      { icon: "budget", title: "Process Disruption Anxiety", description: "She fears operational disruption, emphasize phased rollout" },
    ],
  },
  "giuseppe-verdi": {
    decisionStyle: { score: 60, label: "Intuitive", description: "Makes gut-feel decisions backed by market instinct" },
    riskTolerance: { score: 70, label: "Aggressive", description: "Comfortable with bold bets if competitive advantage is clear" },
    disc: { type: "INNOVATOR", code: "Dc" },
    triggers: [
      { label: "Speed to Market", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
      { label: "Competitive Edge", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
      { label: "Bold Innovation", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
    ],
    summary: "Visionary director who prioritizes speed, competitive advantage, and market leadership",
    approach: {
      do: { title: "Lead with Vision & Speed", action: '"Companies using our platform launched 3x faster than competitors"' },
      dont: { title: "Avoid Over-Detailing", action: "Don't bury him in specs, he wants outcomes, not process" },
      bias: { name: "Optimism Bias Active", description: "He overestimates upside, match his energy but ground with realistic timelines" },
    },
    openingScript: {
      text: "Giuseppe, I'll get straight to the point. Your competitors in the FMCG space are moving fast on digital transformation. We helped a comparable brand cut their go-to-market cycle by 60%. What's holding Barilla back from moving faster?",
      reasons: [
        { principle: "Competitive framing", explanation: '"Your competitors are moving fast" triggers urgency' },
        { principle: "Directness", explanation: "Directors respect brevity, no fluff, straight to value" },
        { principle: "Challenge question", explanation: '"What\'s holding you back" appeals to action-oriented leaders' },
      ],
    },
    riskAlerts: [
      { icon: "stakeholder", title: "Bypasses Process", description: "May commit verbally but skip internal approvals" },
      { icon: "budget", title: "Budget Optimism Risk", description: "Tends to underestimate costs, present tiered pricing early" },
    ],
  },
  "anna-esposito": {
    decisionStyle: { score: 70, label: "Balanced", description: "Blends data analysis with product intuition" },
    riskTolerance: { score: 45, label: "Moderate", description: "Open to calculated risks with clear metrics" },
    disc: { type: "DIPLOMATIC", code: "Si" },
    triggers: [
      { label: "User Experience", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300" },
      { label: "Team Adoption", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
      { label: "Product Fit", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
    ],
    summary: "Product-focused leader who values team adoption, user experience, and measurable outcomes",
    approach: {
      do: { title: "Demo Over Deck", action: '"Let me show you how it works in practice"' },
      dont: { title: "Avoid Top-Down Framing", action: "Don't position as executive mandate" },
      bias: { name: "IKEA Effect Active", description: "Involve her in customization, she'll value what she helps build" },
    },
    openingScript: {
      text: "Anna, I'd love to show you something hands-on. We built this with product teams like yours in mind. Rather than walking through slides, can I give you a 5-minute live demo?",
      reasons: [
        { principle: "IKEA effect", explanation: "Interactive demo creates ownership feeling" },
        { principle: "Collaborative tone", explanation: '"Product teams like yours" creates belonging' },
        { principle: "Brevity promise", explanation: '"5-minute" reduces commitment anxiety' },
      ],
    },
    riskAlerts: [
      { icon: "stakeholder", title: "Team Consensus Required", description: "Won't commit without her team's buy-in" },
    ],
  },
  "marco-neri": {
    decisionStyle: { score: 90, label: "Analytical", description: "Deeply technical; evaluates architecture and scalability" },
    riskTolerance: { score: 25, label: "Conservative", description: "Cautious about unproven technology and vendor lock-in" },
    disc: { type: "ANALYTICAL", code: "Cs" },
    triggers: [
      { label: "Technical Depth", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300" },
      { label: "Scalability", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300" },
      { label: "API Quality", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
    ],
    summary: "Technical lead who evaluates solutions on architecture, API quality, and long-term scalability",
    approach: {
      do: { title: "Share Technical Docs First", action: '"Here\'s our API documentation and architecture diagram"' },
      dont: { title: "Avoid Marketing Speak", action: "Never say 'revolutionary' or 'game-changing'" },
      bias: { name: "Status Quo Bias Active", description: "He'll default to existing stack, show migration path" },
    },
    openingScript: {
      text: "Marco, I brought our technical documentation and architecture overview. Our REST and GraphQL endpoints handle 50K+ requests/sec with <50ms p99 latency. Happy to walk through the integration path with your current stack.",
      reasons: [
        { principle: "Technical credibility", explanation: "Leading with specs builds immediate trust" },
        { principle: "Specificity", explanation: '"50K+ req/sec" and "<50ms p99" are engineer-speak' },
        { principle: "Integration focus", explanation: '"Current stack" acknowledges his existing investments' },
      ],
    },
    riskAlerts: [
      { icon: "stakeholder", title: "Veto Power on Tech", description: "Can block deals on technical grounds" },
      { icon: "budget", title: "Vendor Lock-in Concern", description: "Worried about dependency, emphasize open standards" },
    ],
  },
  "roberto-nutella": {
    decisionStyle: { score: 75, label: "Analytical", description: "Needs concrete data and proof points" },
    riskTolerance: { score: 30, label: "Conservative", description: "Prefers proven solutions with minimal downside" },
    disc: { type: "PRAGMATIC", code: "Id" },
    triggers: [
      { label: "ROI Focus", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
      { label: "Efficiency", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
      { label: "Supply Chain", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
    ],
    summary: "Operations leader focused on supply chain efficiency and cost optimization",
    approach: {
      do: { title: "Lead with Operational Impact", action: '"We reduced supply chain overhead by 32%"' },
      dont: { title: "Avoid Abstract Value Props", action: "Skip high-level vision, focus on tangible improvements" },
      bias: { name: "Anchoring Bias Active", description: "Present your strongest metric first" },
    },
    openingScript: {
      text: "Roberto, I know your time is valuable so I'll be direct. We helped a comparable FMCG manufacturer reduce operational overhead by 32% within one quarter. What's your biggest operational bottleneck right now?",
      reasons: [
        { principle: "Anchoring bias", explanation: '"32%" anchors the value conversation high' },
        { principle: "Industry relevance", explanation: '"FMCG manufacturer" signals domain expertise' },
        { principle: "Respect framing", explanation: '"Your time is valuable" builds rapport' },
      ],
    },
    riskAlerts: [
      { icon: "budget", title: "Procurement Process", description: "Formal procurement, expect 60-90 day evaluation cycle" },
    ],
  },
  "giulia-venturi": {
    decisionStyle: { score: 70, label: "Balanced", description: "Blends market data with retail intuition" },
    riskTolerance: { score: 50, label: "Moderate", description: "Open to new partnerships if ROI is clear" },
    disc: { type: "PRUDENT", code: "Di" },
    triggers: [
      { label: "Retail Analytics", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
      { label: "Brand Alignment", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
      { label: "Distribution ROI", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
    ],
    summary: "Strategic retail partnerships leader who values data-driven distribution insights",
    approach: {
      do: { title: "Lead with Retail Performance Data", action: '"We helped a comparable FMCG brand increase sell-through by 27%"' },
      dont: { title: "Avoid Generic Platform Pitches", action: "She needs retail-specific examples" },
      bias: { name: "Social Proof Bias Active", description: "Reference other FMCG brands, she validates through peer adoption" },
    },
    openingScript: {
      text: "Giulia, thanks for making time. I know Lavazza is exploring ways to improve retail visibility and distributor performance tracking. We recently helped a comparable coffee brand increase sell-through by 27% across three European markets. What's your biggest challenge with retail execution?",
      reasons: [
        { principle: "Social proof", explanation: '"Comparable coffee brand" creates immediate relevance' },
        { principle: "Specificity", explanation: '"27% across three markets" provides concrete proof' },
        { principle: "Discovery focus", explanation: "Open question invites pain sharing" },
      ],
    },
    riskAlerts: [
      { icon: "stakeholder", title: "Multi-Market Complexity", description: "Decision involves regional sales directors across 5+ countries" },
      { icon: "budget", title: "SAP Integration Concern", description: "Lavazza runs on SAP, address integration path proactively" },
    ],
  },
};

// ── Meeting participant configurations ──
export const MEETING_PARTICIPANTS: Record<string, Participant[]> = {
  "1": [
    { id: "giulia-venturi", name: "Giulia Venturi", email: "giulia.venturi@lavazza.com", role: "Head of Retail Partnerships", company: "Lavazza Group", cognitiveProfile: PROFILES["giulia-venturi"] },
  ],
  "2": [
    { id: "luca-bianchi", name: "Luca Bianchi", email: "luca.bianchi@novaconsulting.it", role: "Head of Operations", company: "Nova Consulting", cognitiveProfile: PROFILES["luca-bianchi"] },
    { id: "maria-rossi", name: "Maria Rossi", email: "maria.rossi@novaconsulting.it", role: "Operations Manager", company: "Nova Consulting", cognitiveProfile: PROFILES["maria-rossi"] },
  ],
  "3": [
    { id: "giuseppe-verdi", name: "Giuseppe Verdi", email: "giuseppe.verdi@barilla.com", role: "Director", company: "Barilla Group", cognitiveProfile: PROFILES["giuseppe-verdi"] },
    { id: "anna-esposito", name: "Anna Esposito", email: "anna.esposito@barilla.com", role: "Product Lead", company: "Barilla Group", cognitiveProfile: PROFILES["anna-esposito"] },
    { id: "marco-neri", name: "Marco Neri", email: "marco.neri@barilla.com", role: "Technical Lead", company: "Barilla Group", cognitiveProfile: PROFILES["marco-neri"] },
  ],
  "4": [
    { id: "roberto-nutella", name: "Roberto Nutella", email: "roberto.nutella@ferrero.com", role: "Head of Operations", company: "Ferrero SpA", cognitiveProfile: PROFILES["roberto-nutella"] },
  ],
  "6": [
    { id: "marco-verdi", name: "Marco Verdi", email: "marco.verdi92@gmail.com", role: "Unknown", company: "Unknown", isGmail: true, cognitiveProfile: null },
  ],
};

function getParticipantsForMeeting(meetingId: string): Participant[] {
  if (MEETING_PARTICIPANTS[meetingId]) return MEETING_PARTICIPANTS[meetingId];
  return [{ id: "default", name: "Contact", email: "contact@company.com", role: "Unknown", company: "Unknown", cognitiveProfile: null }];
}

// ── Company data ──
const COMPANY_DATA: Record<string, { name: string; industry: string; size: string; revenue: string; location: string; founded: string; website: string; description: string }> = {
  "1": { name: "Lavazza Group", industry: "FMCG / Food & Beverage", size: "5,500+ employees", revenue: "€3.1B", location: "Turin, Italy", founded: "1895", website: "www.lavazza.com", description: "Global coffee brand with strong retail, horeca, vending, and D2C presence." },
  "2": { name: "Nova Consulting", industry: "Management Consulting", size: "48 employees", revenue: "€6-8M", location: "Milan, Italy", founded: "2016", website: "www.novaconsulting.it", description: "Milan-based management consulting firm supporting mid-sized enterprises." },
  "3": { name: "Barilla Group", industry: "FMCG / Food & Beverage", size: "8,000+ employees", revenue: "€3.9B", location: "Parma, Italy", founded: "1877", website: "www.barilla.com", description: "Global leader in pasta and bakery products." },
  "4": { name: "Ferrero SpA", industry: "FMCG / Confectionery", size: "40,000+ employees", revenue: "€14.6B", location: "Alba, Italy", founded: "1946", website: "www.ferrero.com", description: "Global confectionery giant known for Nutella, Kinder, and Ferrero Rocher." },
  "6": { name: "Unknown", industry: "Unknown", size: "Unknown", revenue: "Unknown", location: "Unknown", founded: "Unknown", website: "N/A", description: "Company information unavailable." },
};

// ── Avatar color assignments ──
const AVATAR_COLORS = [
  { bg: "bg-forskale-teal/15", text: "text-forskale-teal", border: "border-forskale-teal/25" },
  { bg: "bg-purple-500/15", text: "text-purple-500", border: "border-purple-500/25" },
  { bg: "bg-blue-500/15", text: "text-blue-500", border: "border-blue-500/25" },
  { bg: "bg-amber-500/15", text: "text-amber-500", border: "border-amber-500/25" },
  { bg: "bg-green-500/15", text: "text-green-500", border: "border-green-500/25" },
  { bg: "bg-red-500/15", text: "text-red-500", border: "border-red-500/25" },
];

function getAvatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

function getMeetingInitials(title: string) {
  const words = title.split(/[\s\-–—,]+/).filter((w) => w.length > 2 && w[0] === w[0].toUpperCase());
  return words.slice(0, 2).map((w) => w[0]).join("");
}


// ── ContactCard Props ──
interface ContactCardProps {
  meeting: { id: string; title: string; time: string };
  onClose: () => void;
  onBotJoin: () => void;
}

export function ContactCard({ meeting, onClose, onBotJoin }: ContactCardProps) {
  // Meeting Overview mode: shown from Prospect Intelligence "See Meeting Overview"
  const [meetingOverviewMode, setMeetingOverviewMode] = useState(false);
  const [overviewHoveredSection, setOverviewHoveredSection] = useState<string | null>(null);
  const overviewHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOverviewSectionHover = (key: string) => {
    if (overviewHideTimerRef.current) clearTimeout(overviewHideTimerRef.current);
    setOverviewHoveredSection(key);
  };

  const handleOverviewSectionLeave = () => {
    overviewHideTimerRef.current = setTimeout(() => setOverviewHoveredSection(null), 320);
  };

  const handleOverviewPanelEnter = () => {
    if (overviewHideTimerRef.current) clearTimeout(overviewHideTimerRef.current);
  };

  const handleOverviewPanelLeave = () => {
    handleOverviewSectionLeave();
  };
  const navigate = useNavigate();
  const { t } = useLanguage();
  const participants = getParticipantsForMeeting(meeting.id);
  const company = COMPANY_DATA[meeting.id] || COMPANY_DATA["6"];

  const [enrichedParticipants, setEnrichedParticipants] = useState<Set<string>>(new Set());
  const [enrichingParticipant, setEnrichingParticipant] = useState<string | null>(null);
  const [bulkEnriching, setBulkEnriching] = useState<string[]>([]);
  const [prospectDrawerOpen, setProspectDrawerOpen] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [addProfileTarget, setAddProfileTarget] = useState<string | null>(null);
  const [miniCardExpanded, setMiniCardExpanded] = useState(true);
  const [savedScrollPos, setSavedScrollPos] = useState(0);
  const mainCardScrollRef = useRef<HTMLDivElement>(null);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const anyEnriched = enrichedParticipants.size > 0;
  const sectionsUnlocked = anyEnriched;

  const dealStage = getDealStageForMeeting(meeting.id);
  const interestPercent = dealStage?.percentage ?? 35;

  const handleEnrichComplete = useCallback(() => {
    if (enrichingParticipant) {
      if (bulkEnriching.length > 0) {
        setEnrichedParticipants((prev) => {
          const next = new Set(prev);
          bulkEnriching.forEach(name => next.add(name));
          return next;
        });
        setBulkEnriching([]);
        setEnrichingParticipant(null);
        // Auto-open first participant's prospect intelligence
        const firstParticipant = participants.find(p => !p.isGmail);
        if (firstParticipant) {
          setMiniCardExpanded(true);
          setProspectDrawerOpen(firstParticipant.id);
        }
        return;
      }

      // Single enrichment — auto-open prospect intelligence
      setEnrichedParticipants((prev) => new Set(prev).add(enrichingParticipant));
      setEnrichingParticipant(null);
      const participant = participants.find((p) => p.name === enrichingParticipant);
      if (participant) {
        // Save scroll position before switching to split view
        if (mainCardScrollRef.current) {
          setSavedScrollPos(mainCardScrollRef.current.scrollTop);
        }
        setMiniCardExpanded(true);
        setProspectDrawerOpen(participant.id);
      }
    }
  }, [enrichingParticipant, participants, bulkEnriching]);

  const handleReturnToFullCard = useCallback(() => {
    setProspectDrawerOpen(null);
    // Restore scroll position after returning
    requestAnimationFrame(() => {
      if (mainCardScrollRef.current) {
        mainCardScrollRef.current.scrollTop = savedScrollPos;
      }
    });
  }, [savedScrollPos]);

  const handleAddProfile = (linkedinUrl: string) => {
    if (addProfileTarget) {
      toast.success(`LinkedIn profile linked for ${addProfileTarget}`);
      setAddProfileTarget(null);
      setEnrichingParticipant(addProfileTarget);
    }
  };

  const isEnriched = (p: Participant) => enrichedParticipants.has(p.name);

  const handleSectionHover = (key: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHoveredSection(key);
  };

  const handleSectionLeave = () => {
    hideTimerRef.current = setTimeout(() => setHoveredSection(null), 320);
  };

  const handlePanelEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const handlePanelLeave = () => {
    handleSectionLeave();
  };

  const meetingInitials = getMeetingInitials(meeting.title);

  const isProspectMode = !!prospectDrawerOpen;

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          PROSPECT MODE: Mini Card (left) + Prospect Panel (right)
         ══════════════════════════════════════════════════════════ */}
      {isProspectMode && (
        <div
          className="absolute inset-y-0 right-0 z-30 flex animate-slide-in-right"
          style={{
            width: meetingOverviewMode
              ? (miniCardExpanded ? "780px" : "540px")
              : (miniCardExpanded ? "780px" : "540px"),
          }}
        >
          {/* ── Meeting Overview Hover Panel (absolutely positioned left of container) ── */}
          {meetingOverviewMode && overviewHoveredSection && (
            <div
              className="absolute inset-y-0 right-full z-30 w-[420px] pointer-events-auto animate-slide-in-right"
              onMouseEnter={handleOverviewPanelEnter}
              onMouseLeave={handleOverviewPanelLeave}
            >
              <div className="sticky top-10 m-2 max-h-[calc(100vh-120px)]">
                <div className="rounded-[10px] border border-border bg-card shadow-lg overflow-hidden max-h-[calc(100vh-140px)] flex flex-col">
                  <HoverPanelContent
                    sectionKey={overviewHoveredSection}
                    meeting={meeting}
                    participants={participants}
                    company={company}
                    enrichedParticipants={enrichedParticipants}
                    navigate={navigate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Curved < Return Button ── */}
          <button
            onClick={() => {
              if (meetingOverviewMode) {
                setMeetingOverviewMode(false);
              } else {
                handleReturnToFullCard();
              }
            }}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-40 w-5 h-14 bg-card border border-border border-r-0 rounded-l-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all group shadow-lg"
            title="Return to meeting card"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180 group-hover:-translate-x-px transition-transform" />
          </button>

          {/* ── Meeting Overview Panel OR Mini Contact Card (left, collapsible) ── */}
          {meetingOverviewMode ? (
            <div className="h-full w-[320px] border border-border bg-card flex flex-col overflow-hidden rounded-2xl mt-2 mb-2 ml-1 flex-shrink-0">
              <div className="px-3 py-2.5 border-b border-border bg-gradient-to-br from-forskale-teal/[0.04] to-purple-500/[0.03] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.2)] to-[hsl(var(--forskale-blue)/0.3)] border border-forskale-teal/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-forskale-teal font-mono">{meetingInitials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-bold text-foreground leading-tight truncate">Meeting Overview</h3>
                    <span className="text-[10px] text-muted-foreground">{meeting.title}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {/* Current Strategy */}
                <MeetingOverviewSection
                  sectionKey="prep"
                  icon={<FileText className="h-[14px] w-[14px] text-amber-500" />}
                  iconBg="bg-amber-500/10"
                  title="Current Strategy"
                  desc="Meeting intelligence & engagement plan"
                  rightContent={
                    sectionsUnlocked
                      ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Ready</span>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                  }
                  locked={!sectionsUnlocked}
                  onHover={handleOverviewSectionHover}
                  onLeave={handleOverviewSectionLeave}
                  isActive={overviewHoveredSection === "prep"}
                />
                {/* Opening Script */}
                <MeetingOverviewSection
                  sectionKey="script"
                  icon={<MessageSquare className="h-[14px] w-[14px] text-forskale-teal" />}
                  iconBg="bg-forskale-teal/10"
                  title="Opening Script"
                  desc="First 30s calibrated to profiles"
                  rightContent={
                    sectionsUnlocked
                      ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Ready ({participants.filter(p => isEnriched(p)).length} profiles)</span>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                  }
                  locked={!sectionsUnlocked}
                  onHover={handleOverviewSectionHover}
                  onLeave={handleOverviewSectionLeave}
                  isActive={overviewHoveredSection === "script"}
                />
                {/* Best Way to Engage */}
                <MeetingOverviewSection
                  sectionKey="engage"
                  icon={<CheckCircle className="h-[14px] w-[14px] text-forskale-teal" />}
                  iconBg="bg-forskale-teal/10"
                  title="Best Way to Engage"
                  desc="Engagement tactics per profile"
                  rightContent={
                    sectionsUnlocked
                      ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Ready</span>
                      : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                  }
                  locked={!sectionsUnlocked}
                  onHover={handleOverviewSectionHover}
                  onLeave={handleOverviewSectionLeave}
                  isActive={overviewHoveredSection === "engage"}
                />
                {/* Company Profile */}
                <MeetingOverviewSection
                  sectionKey="company"
                  icon={<Building2 className="h-[14px] w-[14px] text-blue-500" />}
                  iconBg="bg-blue-500/10"
                  title="Company Profile"
                  desc={`${company.name} - ${company.size} - ${company.location.split(",")[0]}`}
                  rightContent={
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">{company.location.split(",")[0]}</span>
                  }
                  locked={false}
                  onHover={handleOverviewSectionHover}
                  onLeave={handleOverviewSectionLeave}
                  isActive={overviewHoveredSection === "company"}
                />
              </div>
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => setMeetingOverviewMode(false)}
                  className="w-full py-1.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  ← Back to Participants
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "h-full border border-border bg-card flex flex-col overflow-hidden transition-all duration-300 rounded-2xl mt-2 mb-2 ml-1",
                miniCardExpanded ? "w-[260px] opacity-100" : "w-0 opacity-0 border-0 ml-0"
              )}
            >
              {/* Mini card header */}
              <div className="px-3 py-2.5 border-b border-border bg-gradient-to-br from-forskale-teal/[0.04] to-purple-500/[0.03] flex-shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.2)] to-[hsl(var(--forskale-blue)/0.3)] border border-forskale-teal/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-forskale-teal font-mono">{meetingInitials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-bold text-foreground leading-tight truncate">{meeting.title}</h3>
                    <span className="text-[10px] text-muted-foreground">{meeting.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="h-6 rounded-md bg-gradient-to-r from-[hsl(145,60%,45%)] to-[hsl(190,70%,45%)] px-2.5 text-[10px] font-semibold text-white shadow-sm transition-all hover:brightness-110">
                    Join
                  </button>
                  <button
                    className="h-6 rounded-md bg-muted border border-border px-2.5 text-[10px] font-semibold text-muted-foreground transition-all hover:text-foreground"
                    onClick={onBotJoin}
                  >
                    Bot Join
                  </button>
                </div>
              </div>

              {/* Mini card participant list */}
              <div className="flex-1 overflow-y-auto px-2 py-2">
                <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 mb-1.5">
                  Participants ({participants.length})
                </div>
                <div className="space-y-0.5">
                  {participants.map((p, idx) => {
                    const color = getAvatarColor(idx);
                    const enriched = isEnriched(p);
                    const initials = getInitials(p.name);
                    const isActive = prospectDrawerOpen === p.id;
                    const pArchetype = enriched && p.cognitiveProfile ? getArchetype(p.cognitiveProfile.disc.type) : null;

                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          if (enriched) {
                            setProspectDrawerOpen(p.id);
                          } else if (p.isGmail) {
                            setAddProfileTarget(p.name);
                          } else {
                            setEnrichingParticipant(p.name);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-left",
                          isActive
                            ? "bg-forskale-teal/10 border border-forskale-teal/25"
                            : "hover:bg-muted/50 border border-transparent"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={cn("w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono", color.bg, color.text, color.border)}>
                            {initials}
                          </div>
                          {enriched && (
                            <div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-green-500 border border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={cn("text-[11px] font-semibold truncate", isActive ? "text-forskale-teal" : "text-foreground")}>{p.name}</span>
                            {pArchetype && (
                              <span className={cn("text-[8px] font-bold px-1 py-px rounded uppercase", pArchetype.bgClass, pArchetype.colorClass)}>
                                {pArchetype.label.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate">{p.role}</div>
                        </div>
                        {!enriched && !p.isGmail && (
                          <Sparkles className="h-3 w-3 text-purple-500/60 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Prospect Intelligence Panel (right) ── */}
          <div className="flex-1 h-full bg-card border border-border shadow-xl overflow-hidden flex flex-col rounded-2xl mt-2 mb-2 mr-2 ml-1">
            <ProspectDrawerInline
              participantId={prospectDrawerOpen}
              participants={participants}
              enrichedParticipants={enrichedParticipants}
              miniCardExpanded={miniCardExpanded}
              onToggleMiniCard={() => setMiniCardExpanded(!miniCardExpanded)}
              onClose={handleReturnToFullCard}
              onShowMeetingOverview={() => setMeetingOverviewMode(true)}
              onEnrich={(name) => {
                setEnrichingParticipant(name);
              }}
              onSwitchParticipant={(id) => setProspectDrawerOpen(id)}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          NORMAL MODE: Full Contact Card
         ══════════════════════════════════════════════════════════ */}
      {!isProspectMode && (
        <>
          {/* ── Hover Panel (left of card) ── */}
          {hoveredSection && (
            <div
              className="absolute inset-y-0 right-[394px] z-30 w-[420px] pointer-events-auto animate-slide-in-right"
              onMouseEnter={handlePanelEnter}
              onMouseLeave={handlePanelLeave}
            >
              <div className="sticky top-10 m-4 max-h-[calc(100vh-120px)]">
                <div className="rounded-[10px] border border-border bg-card shadow-lg overflow-hidden max-h-[calc(100vh-140px)] flex flex-col">
                  <HoverPanelContent
                    sectionKey={hoveredSection}
                    meeting={meeting}
                    participants={participants}
                    company={company}
                    enrichedParticipants={enrichedParticipants}
                    navigate={navigate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Main Contact Card ── */}
          <div className="absolute inset-y-0 right-0 z-30 flex w-[380px] flex-col border border-border bg-card shadow-xl rounded-2xl mt-2 mb-2 mx-2 animate-slide-in-right">
            {/* ── Meeting Header ── */}
            <div className="border-b border-border px-4 py-3.5 bg-gradient-to-br from-forskale-teal/[0.04] to-purple-500/[0.03]">
              {/* Close button row */}
              <div className="flex justify-end mb-1.5">
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-start gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[hsl(var(--forskale-teal)/0.2)] to-[hsl(var(--forskale-blue)/0.3)] border border-forskale-teal/25 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-forskale-teal font-mono">{meetingInitials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-foreground leading-tight mb-1">{meeting.title}</h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted border border-border text-[11px] text-muted-foreground">{meeting.time}</span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-md text-[11px] font-semibold",
                      (() => {
                        const seq = getMeetingSequence(meeting.id);
                        return seq.meetingNumber === 1
                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          : "bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/20";
                      })()
                    )}>
                      Meeting {getMeetingSequence(meeting.id).meetingNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                      {getMeetingSequence(meeting.id).cognitiveState}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button className="h-8 rounded-md bg-gradient-to-r from-[hsl(145,60%,45%)] to-[hsl(190,70%,45%)] px-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 hover:-translate-y-px">
                  Join Meeting
                </button>
                <button
                  className="h-8 rounded-md bg-muted border border-border px-3.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground hover:border-border/80"
                  onClick={onBotJoin}
                >
                  Bot Join
                </button>
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-forskale-teal bg-forskale-teal/10 border border-forskale-teal/20">
                  <Users className="h-3.5 w-3.5" />
                  {participants.length} participants
                </span>
              </div>
            </div>

            {/* ── Participants List ── */}
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Participants</span>
                <span className="px-1.5 py-px rounded bg-muted text-[10px] font-medium text-muted-foreground">{participants.length}</span>
                <span className="flex-1" />
                {(() => {
                  const enrichable = participants.filter(p => !p.isGmail);
                  const allEnriched = enrichable.length > 0 && enrichable.every(p => isEnriched(p));
                  if (allEnriched) {
                    return (
                      <span className="text-[10px] text-muted-foreground/60 italic flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        Hover on all sections to view
                      </span>
                    );
                  }
                  const unenriched = enrichable.filter(p => !isEnriched(p));
                  if (unenriched.length === 0 || participants.length <= 1) return null;
                  return (
                    <button
                      onClick={() => {
                        const names = unenriched.map(p => p.name);
                        setBulkEnriching(names);
                        setEnrichingParticipant(names[0]);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20 transition-all hover:bg-purple-500/20 hover:-translate-y-px"
                    >
                      <Zap className="h-3 w-3" />
                      Enrich All
                    </button>
                  );
                })()}
              </div>

              <div className="space-y-1">
                {participants.map((p, idx) => {
                  const color = getAvatarColor(idx);
                  const enriched = isEnriched(p);
                  const initials = getInitials(p.name);

                  const pArchetype = enriched && p.cognitiveProfile ? getArchetype(p.cognitiveProfile.disc.type) : null;

                  return (
                    <div
                      key={p.id}
                      className="flex items-start gap-2.5 px-2 py-2 rounded-md transition-colors hover:bg-muted/50"
                      onMouseEnter={() => enriched && handleSectionHover(`prospect-${p.id}`)}
                      onMouseLeave={() => enriched && handleSectionLeave()}
                    >
                      {/* Avatar */}
                      <div className="relative mt-0.5 flex-shrink-0">
                        <div className={cn("w-[36px] h-[36px] rounded-full border flex items-center justify-center text-xs font-bold font-mono", color.bg, color.text, color.border)}>
                          {initials}
                        </div>
                        {enriched && (
                          <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" title="Profile enriched" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-foreground truncate">{p.name}</span>
                          {pArchetype && (
                             <span className={cn("inline-flex items-center px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide", pArchetype.bgClass, pArchetype.colorClass, pArchetype.borderClass, "border")}>
                              {pArchetype.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{p.role}</div>
                      </div>

                      {/* Action */}
                      <div className="flex-shrink-0 mt-0.5">
                        {p.isGmail ? (
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20 transition-all hover:bg-purple-500/20 hover:-translate-y-px"
                            onClick={() => setAddProfileTarget(p.name)}
                          >
                            Add Profile
                          </button>
                        ) : enriched ? (
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/20 transition-all hover:bg-forskale-teal/20 hover:-translate-y-px"
                            onClick={() => {
                              if (mainCardScrollRef.current) {
                                setSavedScrollPos(mainCardScrollRef.current.scrollTop);
                              }
                              setMiniCardExpanded(true);
                              setProspectDrawerOpen(p.id);
                            }}
                          >
                            View Profile
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20 transition-all hover:bg-purple-500/20 hover:-translate-y-px"
                            onClick={() => setEnrichingParticipant(p.name)}
                          >
                            <Sparkles className="h-3 w-3" />
                            Enrich
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Unlock Nudge ── */}
            {!sectionsUnlocked && (
              <div className="mx-4 my-2.5 px-3 py-2 rounded-lg bg-purple-500/[0.06] border border-purple-500/15 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>Enrich a participant or all participants to unlock Meeting Preparation and Opening Script sections.</span>
              </div>
            )}

            {/* ── Intelligence Sections ── */}
            <div className="flex-1 overflow-auto" ref={mainCardScrollRef}>

              {/* Current Strategy - commented out, moved to Meeting Overview */}
              {/* <IntelSection
                sectionKey="prep"
                icon={<FileText className="h-[15px] w-[15px] text-amber-500" />}
                iconBg="bg-amber-500/10"
                title="Current Strategy"
                desc="Meeting intelligence & engagement plan"
                locked={!sectionsUnlocked}
                rightContent={
                  sectionsUnlocked
                    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">Ready</span>
                    : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                }
                onHover={handleSectionHover}
                onLeave={handleSectionLeave}
                isActive={hoveredSection === "prep"}
              /> */}

              {/* Opening Script - commented out, moved to Meeting Overview */}
              {/* <IntelSection
                sectionKey="script"
                icon={<MessageSquare className="h-[15px] w-[15px] text-forskale-teal" />}
                iconBg="bg-forskale-teal/10"
                title="Opening Script"
                desc="First 30s calibrated to profiles"
                locked={!sectionsUnlocked}
                rightContent={
                  sectionsUnlocked
                    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Ready ({participants.filter(p => isEnriched(p)).length} profiles)</span>
                    : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                }
                onHover={handleSectionHover}
                onLeave={handleSectionLeave}
                isActive={hoveredSection === "script"}
              /> */}

              {/* Best Way to Engage - commented out, moved to Meeting Overview */}
              {/* <IntelSection
                sectionKey="engage"
                icon={<CheckCircle className="h-[15px] w-[15px] text-forskale-teal" />}
                iconBg="bg-forskale-teal/10"
                title="Best Way to Engage"
                desc="Engagement tactics per profile"
                locked={!sectionsUnlocked}
                rightContent={
                  sectionsUnlocked
                    ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/20">Ready</span>
                    : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-muted text-muted-foreground/50">Locked</span>
                }
                onHover={handleSectionHover}
                onLeave={handleSectionLeave}
                isActive={hoveredSection === "engage"}
              /> */}

              {/* Company Profile */}
              <IntelSection
                sectionKey="company"
                icon={<Building2 className="h-[15px] w-[15px] text-blue-500" />}
                iconBg="bg-blue-500/10"
                title="Company Profile"
                desc={`${company.name} - ${company.size} - ${company.location.split(",")[0]}`}
                locked={false}
                rightContent={
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">{company.location.split(",")[0]}</span>
                }
                onHover={handleSectionHover}
                onLeave={handleSectionLeave}
                isActive={hoveredSection === "company"}
              />
            </div>
          </div>
        </>
      )}

      {/* Playbook Analysis Loader (enrichment animation) */}
      <PlaybookAnalysisLoader
        isOpen={!!enrichingParticipant}
        onComplete={handleEnrichComplete}
      />

      {/* Add Profile Dialog */}
      <AddProfileDialog
        open={!!addProfileTarget}
        onClose={() => setAddProfileTarget(null)}
        onSubmit={handleAddProfile}
        participantName={addProfileTarget || ""}
      />
    </>
  );
}

// ── Intelligence Section Row ──
function IntelSection({
  sectionKey,
  icon,
  iconBg,
  title,
  desc,
  locked,
  rightContent,
  onHover,
  onLeave,
  isActive,
}: {
  sectionKey: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  locked: boolean;
  rightContent: React.ReactNode;
  onHover: (key: string) => void;
  onLeave: () => void;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-border transition-all duration-150 relative",
        locked ? "opacity-40 pointer-events-none" : "cursor-pointer",
        !locked && isActive && "bg-muted/50 border-l-2 border-l-forskale-teal",
        !locked && !isActive && "hover:bg-muted/30"
      )}
      onMouseEnter={() => !locked && onHover(sectionKey)}
      onMouseLeave={() => !locked && onLeave()}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <div className={cn("w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{title}</div>
          <div className="text-[11px] text-muted-foreground mt-px">{desc}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rightContent}
          {locked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />
          ) : (
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-colors", isActive && "text-forskale-teal")} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Meeting Overview Section Row (compact version for overview panel) ──
function MeetingOverviewSection({
  sectionKey,
  icon,
  iconBg,
  title,
  desc,
  locked,
  rightContent,
  onHover,
  onLeave,
  isActive,
}: {
  sectionKey: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  locked: boolean;
  rightContent?: React.ReactNode;
  onHover: (key: string) => void;
  onLeave: () => void;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-border transition-all duration-150 relative",
        locked ? "opacity-40 pointer-events-none" : "cursor-pointer",
        !locked && isActive && "bg-muted/50 border-l-2 border-l-forskale-teal",
        !locked && !isActive && "hover:bg-muted/30"
      )}
      onMouseEnter={() => !locked && onHover(sectionKey)}
      onMouseLeave={() => !locked && onLeave()}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className={cn("w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-foreground">{title}</div>
          <div className="text-[10px] text-muted-foreground mt-px truncate">{desc}</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {rightContent}
          {locked ? (
            <Lock className="h-3 w-3 text-muted-foreground/40" />
          ) : (
            <ChevronRight className={cn("h-3 w-3 text-muted-foreground/40 transition-colors", isActive && "text-forskale-teal")} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Engage Panel Content (for hover panel) ──
function EngagePanelContent({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-5">
        <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2.5" />
        <div className="text-xs font-semibold text-foreground mb-1.5">Enrich Participants First</div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">Engagement tactics require enriched profiles.</div>
      </div>
    );
  }

  return (
    <>
      {participants.map((p) => {
        const profile = p.cognitiveProfile;
        if (!profile) return null;
        const archetype = getArchetype(profile.disc.type);
        return (
          <div key={p.id} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", archetype.bgClass, archetype.colorClass)}>{archetype.label}</span>
              <span className="text-[11px] font-semibold text-foreground">{p.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {archetype.engage.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "p-2.5 rounded-lg border",
                    item.type === "do"
                      ? "bg-green-500/[0.06] border-green-500/20"
                      : "bg-red-500/[0.06] border-red-500/15"
                  )}
                >
                  <div className={cn(
                    "text-[9px] font-bold uppercase tracking-wider mb-1",
                    item.type === "do" ? "text-green-500" : "text-red-500"
                  )}>
                    {item.type === "do" ? "Do" : "Avoid"}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">{item.title}.</strong> {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Hover Panel Content ──
function HoverPanelContent({
  sectionKey,
  meeting,
  participants,
  company,
  enrichedParticipants,
  navigate,
}: {
  sectionKey: string;
  meeting: { id: string; title: string; time: string };
  participants: Participant[];
  company: typeof COMPANY_DATA[string];
  enrichedParticipants: Set<string>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const enrichedPeople = participants.filter(
    (p) => enrichedParticipants.has(p.name)
  );

  const panelConfig: Record<string, { title: string; sub: string; icon: React.ReactNode; iconBg: string }> = {
    prep: { title: "Current Strategy", sub: "Meeting intelligence & engagement plan", icon: <FileText className="h-[15px] w-[15px] text-amber-500" />, iconBg: "bg-amber-500/10" },
    script: { title: "Opening Script", sub: "First 30s calibrated to profiles", icon: <MessageSquare className="h-[15px] w-[15px] text-forskale-teal" />, iconBg: "bg-forskale-teal/10" },
    engage: { title: "Best Way to Engage", sub: "Engagement tactics per profile", icon: <CheckCircle className="h-[15px] w-[15px] text-forskale-teal" />, iconBg: "bg-forskale-teal/10" },
    company: { title: "Company Profile", sub: `${company.name} - ${company.location.split(",")[0]}`, icon: <Building2 className="h-[15px] w-[15px] text-blue-500" />, iconBg: "bg-blue-500/10" },
  };

  // Handle prospect-specific hover panels
  const isProspectPanel = sectionKey.startsWith("prospect-");
  let prospectParticipant: Participant | null = null;
  if (isProspectPanel) {
    const pId = sectionKey.replace("prospect-", "");
    prospectParticipant = participants.find((p) => p.id === pId) || null;
  }

  const config = isProspectPanel
    ? prospectParticipant
      ? { title: "Prospect Intelligence", sub: prospectParticipant.name, icon: <Brain className="h-[15px] w-[15px] text-purple-500" />, iconBg: "bg-purple-500/10" }
      : null
    : panelConfig[sectionKey];
  if (!config) return null;

  return (
    <>
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.iconBg)}>
          {config.icon}
        </div>
        <div>
          <div className="text-xs font-bold text-foreground">{config.title}</div>
          <div className="text-[10px] text-muted-foreground mt-px">{config.sub}</div>
        </div>
      </div>

      {/* Panel Body */}
      <div className="px-4 py-3.5 space-y-2.5 overflow-y-auto flex-1">
        {sectionKey === "prep" && <PrepPanelContent participants={enrichedPeople} meetingId={meeting.id} />}
        {sectionKey === "script" && <ScriptPanelContent participants={enrichedPeople} />}
        {sectionKey === "engage" && <EngagePanelContent participants={enrichedPeople} />}
        {sectionKey === "company" && <CompanyPanelContent company={company} />}
        {isProspectPanel && prospectParticipant && <ProspectPanelContent participant={prospectParticipant} />}
      </div>
    </>
  );
}

// ── Meeting Strategy Data ──
interface SuggestionProContent {
  proposition: string;
  solution: string;
  hypothesis: string[];
}

function validateSuggestionProContent(content: SuggestionProContent): boolean {
  if (content.proposition.length > 120) return false;
  if (content.solution.length > 120) return false;
  if (content.hypothesis.some(h => h.length > 120)) return false;
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
  if (emojiRegex.test(content.proposition) || emojiRegex.test(content.solution)) return false;
  if (content.hypothesis.some(h => emojiRegex.test(h))) return false;
  if (content.proposition.includes('\u2014') || content.solution.includes('\u2014')) return false;
  if (content.hypothesis.some(h => h.includes('\u2014'))) return false;
  if (content.hypothesis.length === 0 || content.hypothesis.length > 2) return false;
  return true;
}

const SUGGESTION_PRO_DATA: Record<string, SuggestionProContent> = {
  "giulia-venturi": {
    proposition: "Retail execution visibility gaps are costing Lavazza measurable market share across regions.",
    solution: "Centralized governance dashboard with SAP integration for real-time multi-market oversight.",
    hypothesis: [
      "She will push back on timeline if SAP integration scope is not pre-defined.",
      "Budget approval may stall without quantified visibility cost per market."
    ]
  },
  "luca-bianchi": {
    proposition: "Manual operational steps are creating hidden time costs that compound across the team weekly.",
    solution: "Automated workflow engine that eliminates repetitive tasks and surfaces bottlenecks instantly.",
    hypothesis: [
      "He will question ROI if efficiency gains are not tied to headcount savings.",
      "Technical team may resist if migration complexity is not addressed upfront."
    ]
  },
  "maria-rossi": {
    proposition: "Manual operational steps are creating hidden time costs that compound across the team weekly.",
    solution: "Structured process automation with built-in measurement to quantify efficiency gains.",
    hypothesis: [
      "She may defer decision if process ownership across departments is unclear.",
      "Expect push for a pilot phase before any full commitment."
    ]
  },
};

const MEETING_STRATEGY_DATA: Record<string, {
  prospect_snapshot: string[];
  meeting_goal: string[];
  discovery: string[];
  hypothesis?: string[];
  value_alignment?: string[];
  value_angle: string[];
  objection_alert: string[];
  success_criteria: string[];
  enter_call: { who: string; uncover: string; ask: string; position: string };
}> = {
  // Lavazza: 62% → CONTINUATION
  "giulia-venturi": {
    prospect_snapshot: [
      "Confirmed in last meeting: authority-driven profile, low ambiguity tolerance, needs formal documentation.",
      "Owns the retail partnership budget directly. SAP integration flagged as key requirement."
    ],
    meeting_goal: [
      "Last meeting ended without governance clarity. Get formal requirements documented today.",
      "They mentioned multi-market rollout. Clarify whether this is an opportunity or constraint."
    ],
    discovery: [
      "Last time you mentioned SAP integration as a requirement. What specifically needs to connect?",
      "You said multi-market visibility was a gap. Has anything changed since we last spoke?"
    ],
    value_alignment: [
      "Confirmed problem: limited visibility into retail execution across multiple markets.",
      "Control and governance framing landed well. Continue this thread, do not restart with efficiency."
    ],
    value_angle: [
      "Control and visibility angle confirmed. She engaged strongly with governance examples.",
      "Avoid informal approaches. She disengaged when conversation lacked formal structure."
    ],
    objection_alert: [
      "She raised SAP integration as potential blocker. Come with integration documentation ready.",
      "If timeline comes up, redirect: the right question is what lack of visibility costs monthly."
    ],
    success_criteria: [
      "Governance requirements and decision authority formally documented.",
      "Multi-market rollout scope confirmed with specific regional priorities."
    ],
    enter_call: {
      who: "Giulia Venturi, Head of Retail. Prudent profile. Last meeting she flagged SAP integration.",
      uncover: "Whether multi-market rollout is real and what governance requirements must be met.",
      ask: "What governance requirements need to be satisfied before you can move forward?",
      position: "Build on control and visibility from last meeting. Bring integration documentation proactively."
    }
  },
  // Nova Consulting: 15% → FIRST_MEETING
  "luca-bianchi": {
    prospect_snapshot: [
      "Luca Bianchi, Head of Operations at Nova Consulting. Dynamic profile: momentum-driven, prefers fast decisions.",
      "Nova Consulting, 48 employees, Milan. Mid-market firm with efficiency-focused operational priorities."
    ],
    meeting_goal: [
      "Understand current operational process and identify the main friction point causing inefficiency.",
      "Map who is involved in decisions and how approval processes typically work."
    ],
    discovery: [
      "Can you walk me through your current process step by step and where it slows down?",
      "How do you measure whether this process is working well for your team today?"
    ],
    hypothesis: [
      "Likely problem: Manual operational steps creating hidden time costs across the team.",
      "Potential opportunity: Structured solution reducing repetitive work and improving visibility."
    ],
    value_angle: [
      "Primary angle: EFFICIENCY. Frame everything around reducing waste and optimizing processes.",
      "Lead with: How much time does your team currently spend on this process each week?"
    ],
    objection_alert: [
      "'We already have something' > Perfect, that gives us a benchmark. What works and what does not?",
      "'Need to involve others' > Who would be the right people for the next conversation?"
    ],
    success_criteria: [
      "A real operational problem with measurable time or cost impact has been identified.",
      "The decision process and the key people involved have been clearly mapped."
    ],
    enter_call: {
      who: "Luca Bianchi, Head of Operations. Dynamic profile, momentum-driven decisions.",
      uncover: "Main operational bottleneck and its measurable impact on the team.",
      ask: "Can you walk me through how this process works today, step by step?",
      position: "Confident consultant focused on fast wins and competitive advantage."
    }
  },
  // Nova Consulting: 15% → FIRST_MEETING
  "maria-rossi": {
    prospect_snapshot: [
      "Maria Rossi, Operations Manager at Nova Consulting. Methodical profile: needs structured evidence.",
      "Nova Consulting, 48 employees, Milan. Mid-market firm with efficiency-focused operational priorities."
    ],
    meeting_goal: [
      "Understand current operational process and identify the main friction point causing inefficiency.",
      "Map who is involved in decisions and how approval processes typically work."
    ],
    discovery: [
      "Can you walk me through your current process step by step and where it slows down?",
      "How do you measure whether this process is working well for your team today?"
    ],
    hypothesis: [
      "Likely problem: Manual operational steps creating hidden time costs across the team.",
      "Potential opportunity: Structured solution reducing repetitive work and improving visibility."
    ],
    value_angle: [
      "Primary angle: EFFICIENCY. Frame everything around reducing waste and optimizing processes.",
      "Lead with: How much time does your team currently spend on this process each week?"
    ],
    objection_alert: [
      "'We already have something' > Perfect, that gives us a benchmark. What works and what does not?",
      "'Not a priority right now' > What would need to change for this to move up the priority list?"
    ],
    success_criteria: [
      "A real operational problem with measurable time or cost impact has been identified.",
      "The decision process and the key people involved have been clearly mapped."
    ],
    enter_call: {
      who: "Maria Rossi, Operations Manager. Methodical profile: needs structured evidence before deciding.",
      uncover: "Main operational bottleneck and its measurable impact on the team.",
      ask: "Can you walk me through how this process works today, step by step?",
      position: "Structured consultant focused on efficiency. No product talk yet, just process discovery."
    }
  },
  // Barilla Group: 37% → CONTINUATION
  "giuseppe-verdi": {
    prospect_snapshot: [
      "Confirmed in last meeting: vision-oriented profile, engaged strongly with market positioning angle.",
      "Owns strategic direction for digital transformation. Mentioned competitor pressure as key driver."
    ],
    meeting_goal: [
      "Last meeting ended with interest but no concrete next step. Get commitment to stakeholder demo today.",
      "He mentioned Q3 board review. Clarify whether this is an opportunity or timeline constraint."
    ],
    discovery: [
      "Last time you mentioned competitor moves in digital. What has changed since we spoke?",
      "You said the board reviews strategic initiatives in Q3. What criteria will they use?"
    ],
    value_alignment: [
      "Confirmed problem: competitors moving faster on digital transformation in the market.",
      "Vision and market leadership framing landed well. Continue this thread, stay strategic."
    ],
    value_angle: [
      "Growth and market leadership angle confirmed. He engaged with competitive positioning examples.",
      "Avoid operational details early. He disengaged when conversation went into implementation specifics."
    ],
    objection_alert: [
      "He raised board approval as a factor. Come with executive summary and ROI one-pager ready.",
      "If budget comes up, redirect: the right question is what falling behind competitors costs them."
    ],
    success_criteria: [
      "A concrete next step with a specific date is agreed before the call ends.",
      "Q3 board review timeline confirmed and materials requirements understood."
    ],
    enter_call: {
      who: "Giuseppe Verdi, Director. Innovator profile. Last meeting he flagged competitor pressure.",
      uncover: "Whether Q3 board review is real and what will make the business case compelling.",
      ask: "What would make this an easy yes for the board in Q3?",
      position: "Build on market leadership from last meeting. Bring executive summary proactively."
    }
  },
  // Barilla Group: 37% → CONTINUATION
  "anna-esposito": {
    prospect_snapshot: [
      "Confirmed in last meeting: consensus-driven profile, values team alignment before any decision.",
      "Product team lead with 12 direct reports. Adoption and user experience are top priorities."
    ],
    meeting_goal: [
      "Last meeting identified team adoption as key concern. Get stakeholder demo session scheduled today.",
      "She mentioned needing team buy-in. Clarify who the key influencers are."
    ],
    discovery: [
      "Last time you mentioned team buy-in was essential. Who are the key voices you need aligned?",
      "You said adoption was the main risk. What would a successful rollout look like for your team?"
    ],
    value_alignment: [
      "Confirmed problem: difficulty getting team-wide adoption of new solutions without consensus.",
      "Collaborative evaluation framing landed well. Continue building on team-friendly approach."
    ],
    value_angle: [
      "Consensus and adoption angle confirmed. She engaged strongly with collaborative evaluation examples.",
      "Avoid top-down framing. She disengaged when conversation implied unilateral decision-making."
    ],
    objection_alert: [
      "She raised 'team needs to see it first' in last meeting. Come with group demo proposal ready.",
      "If timeline pressure comes up, respect it and provide materials for async team review."
    ],
    success_criteria: [
      "Group demo or evaluation session scheduled with key team stakeholders.",
      "Key influencers identified and their specific concerns understood."
    ],
    enter_call: {
      who: "Anna Esposito, Product Lead. Diplomatic profile. Last meeting she flagged team buy-in need.",
      uncover: "Who the key team influencers are and what their specific adoption concerns are.",
      ask: "Who are the key voices you need aligned before moving forward?",
      position: "Collaborative partner focused on team adoption. Bring group demo proposal."
    }
  },
  // Barilla Group: 37% → CONTINUATION
  "marco-neri": {
    prospect_snapshot: [
      "Confirmed in last meeting: data-driven profile, evaluates architecture and scalability rigorously.",
      "Technical lead with vendor lock-in concerns. Needs clear integration path and performance data."
    ],
    meeting_goal: [
      "Last meeting raised integration concerns. Provide architecture documentation and address scalability today.",
      "He mentioned needing benchmark data. Clarify what specific metrics would satisfy his evaluation."
    ],
    discovery: [
      "Last time you mentioned integration complexity. What specific systems need to connect?",
      "You said you needed benchmark data. What metrics would your internal model require?"
    ],
    value_alignment: [
      "Confirmed problem: integration complexity with existing enterprise stack is the main blocker.",
      "Data and architecture framing landed well. Continue with technical depth and specifics."
    ],
    value_angle: [
      "Efficiency and technical clarity angle confirmed. He engaged with performance benchmark examples.",
      "Avoid high-level vision talk. He disengaged when conversation lacked technical specifics."
    ],
    objection_alert: [
      "He raised vendor lock-in concern in last meeting. Come with open standards and migration path ready.",
      "If he asks to evaluate alternatives, help structure comparison framework proactively."
    ],
    success_criteria: [
      "Technical feasibility confirmed with clear integration path agreed.",
      "Specific benchmark metrics defined and data delivery timeline committed."
    ],
    enter_call: {
      who: "Marco Neri, Technical Lead. Analytical profile. Last meeting he flagged integration concerns.",
      uncover: "Specific integration requirements and benchmark metrics for evaluation.",
      ask: "What specific metrics would your internal model require to justify this investment?",
      position: "Technical expert with architecture proof. Bring integration documentation and benchmarks."
    }
  },
  // Ferrero: 78% → CONTINUATION
  "roberto-nutella": {
    prospect_snapshot: [
      "Confirmed in previous meetings: results-focused profile, evaluates upside quickly and moves fast.",
      "Owns operational budget directly. Has been tracking 32% overhead reduction benchmark we shared."
    ],
    meeting_goal: [
      "Previous meetings established strong fit. Get procurement process initiated and timeline confirmed today.",
      "He mentioned 90-day results expectation. Confirm implementation plan meets that window."
    ],
    discovery: [
      "Last time we discussed the 90-day target. What needs to be true for procurement to start this month?",
      "You mentioned supply chain overhead as the priority. Has the scope changed since we last spoke?"
    ],
    value_alignment: [
      "Confirmed problem: supply chain overhead creating measurable cost impact across operations.",
      "Quick ROI and results framing landed strongly. Continue with concrete implementation timeline."
    ],
    value_angle: [
      "Efficiency and quick wins angle confirmed. He engaged strongly with 90-day results framing.",
      "Avoid long-term strategy talk. He wants to see immediate operational impact and ROI."
    ],
    objection_alert: [
      "He raised procurement process as next step. Have compliance documentation and vendor forms ready.",
      "If scope expansion comes up, keep focused on initial quick win before expanding."
    ],
    success_criteria: [
      "Procurement process initiated with specific timeline and next steps confirmed.",
      "90-day implementation plan reviewed and approved by operations team."
    ],
    enter_call: {
      who: "Roberto Nutella, Head of Ops. Pragmatic profile. Previous meetings confirmed strong fit.",
      uncover: "What is needed to start procurement this month and confirm 90-day implementation.",
      ask: "What needs to be true for procurement to start this month?",
      position: "Direct, results-focused. Bring compliance docs and implementation timeline proactively."
    }
  },
};

function getStrategyForParticipant(participantId: string) {
  return MEETING_STRATEGY_DATA[participantId] || null;
}

function PrepPanelContent({ participants, meetingId }: { participants: Participant[]; meetingId: string }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  if (participants.length === 0) {
    return (
      <div className="text-center py-5">
        <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2.5" />
        <div className="text-xs font-semibold text-foreground mb-1.5">Enrich Participants First</div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">Meeting preparation requires enriched profiles to generate strategies.</div>
      </div>
    );
  }

  const primary = participants[0];
  const profile = primary.cognitiveProfile;
  if (!profile) return null;

  const strategy = getStrategyForParticipant(primary.id);
  if (!strategy) return null;

  const suggestionPro = SUGGESTION_PRO_DATA[primary.id] || null;
  const validSuggestionPro = suggestionPro && validateSuggestionProContent(suggestionPro) ? suggestionPro : null;

  const seqData = getMeetingSequence(meetingId);
  const isFirstMeeting = seqData.strategyMode === "FIRST_INTERACTION";

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sections = [
    { key: "snapshot", title: "Prospect Snapshot", items: strategy.prospect_snapshot },
    { key: "goal", title: "Meeting Goal", items: strategy.meeting_goal },
    { key: "discovery", title: "Discovery Core", items: strategy.discovery },
    { key: "hypothesis", title: isFirstMeeting ? "Hypothesis" : "Value Alignment", items: isFirstMeeting ? strategy.hypothesis || [] : strategy.value_alignment || [] },
    { key: "value", title: "Value Angle", items: strategy.value_angle },
    { key: "objection", title: "Objection Alert", items: strategy.objection_alert },
    { key: "success", title: "Success Criteria", items: strategy.success_criteria },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-bold text-foreground">
            {isFirstMeeting ? "First Meeting Preparation" : "Deal Continuation Strategy"}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">
          {getStrategyStatusText(seqData)}
        </div>
      </div>

      {/* Meeting State Indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStrategyStatusDotClass(seqData))} />
        <span className="text-[10px] text-muted-foreground">
          {getStrategyStatusText(seqData)}
        </span>
      </div>

      {/* Enter the Call Like This — permanent card (Prompt 2) */}
      <div className="relative px-3.5 py-3 rounded-lg bg-forskale-teal/[0.06] border border-forskale-teal/15 overflow-hidden mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-forskale-teal to-forskale-teal/50" />
        <div className="text-[11px] font-bold text-forskale-teal mb-0.5">Enter the Call Like This</div>
        <div className={cn("text-[10px] mt-0.5 mb-2", getEnterCallSubtitle(seqData).colorClass)}>
          {getEnterCallSubtitle(seqData).text}
        </div>
        <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
          <div><strong className="text-foreground">WHO:</strong> {strategy.enter_call.who}</div>
          <div><strong className="text-foreground">UNCOVER:</strong> {strategy.enter_call.uncover}</div>
          <div><strong className="text-foreground">ASK:</strong> <em>"{strategy.enter_call.ask}"</em></div>
          <div><strong className="text-foreground">POSITION:</strong> {strategy.enter_call.position}</div>
        </div>
      </div>

      {/* Suggestions Pro — collapsible wrapper */}
      {(() => {
        const allKeys = sections.map(s => s.key);
        const allOpen = allKeys.every(k => openSections.has(k));
        const isSuggestionsOpen = openSections.has("__suggestions_pro__");
        return (
          <div className="rounded-lg border border-border overflow-hidden mb-4">
            <button
              onClick={() => {
                setOpenSections(prev => {
                  const next = new Set(prev);
                  if (next.has("__suggestions_pro__")) {
                    next.delete("__suggestions_pro__");
                    allKeys.forEach(k => next.delete(k));
                  } else {
                    next.add("__suggestions_pro__");
                  }
                  return next;
                });
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors bg-muted/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-foreground flex-1">Suggestions Pro</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
                isSuggestionsOpen && "rotate-180 text-forskale-teal"
              )} />
            </button>
            {isSuggestionsOpen && (
              <div className="px-2.5 pb-2.5 pt-1.5">
                {/* Expand / Collapse All inner sections */}
                <div className="flex items-center justify-end mb-1.5">
                  <button
                    onClick={() => {
                      if (allOpen) {
                        setOpenSections(prev => {
                          const next = new Set(prev);
                          allKeys.forEach(k => next.delete(k));
                          return next;
                        });
                      } else {
                        setOpenSections(prev => new Set([...prev, ...allKeys]));
                      }
                    }}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {allOpen ? (
                      <>
                        <ChevronsDownUp className="h-3 w-3" />
                        Collapse All
                      </>
                    ) : (
                      <>
                        <ChevronsUpDown className="h-3 w-3" />
                        Expand All
                      </>
                    )}
                  </button>
                </div>
                {/* Suggestion Pro Card */}
                {validSuggestionPro && (
                  <div className="relative rounded-lg bg-gradient-to-br from-forskale-teal/[0.04] to-purple-500/[0.03] border border-border border-l-4 border-l-forskale-teal/60 overflow-hidden mb-2">
                    <div className="px-3 py-2.5">
                      {/* Section 1: Proposition */}
                      <div className="mb-2">
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground/60 mb-1">PROPOSITION</div>
                        <div className="text-sm text-foreground/80 leading-relaxed">{validSuggestionPro.proposition}</div>
                      </div>
                      {/* Section 2: Solution */}
                      <div className="mt-3">
                        <div className="text-[9px] uppercase tracking-wider text-forskale-teal/70 mb-1">SOLUTION</div>
                        <div className="border-l-2 border-forskale-teal/30 pl-3">
                          <div className="text-sm text-foreground font-medium leading-relaxed">{validSuggestionPro.solution}</div>
                        </div>
                      </div>
                      {/* Section 3: Hypothesis - Premium amber treatment */}
                      <div className="mt-4 rounded-lg bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] border border-amber-500/25 px-3 py-2.5 shadow-sm hover:shadow-md hover:bg-gradient-to-br hover:from-amber-500/[0.12] hover:to-orange-500/[0.08] hover:translate-y-[-1px] transition-all duration-200">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[9px] uppercase tracking-wider font-bold text-amber-600">HYPOTHESIS</div>
                          <AlertTriangle className="h-3 w-3 text-amber-500/60" />
                        </div>
                        {validSuggestionPro.hypothesis.map((h, i) => (
                          <div key={i}>
                            {i > 0 && <div className="border-t border-amber-500/15 my-2 pt-2" />}
                            <div className="flex items-start gap-2 py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              <div className="text-sm text-foreground/90 leading-relaxed">{h}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* 7 Collapsible Sections */}
                <div className="space-y-1">
                  {sections.map((section, idx) => {
                    const isOpen = openSections.has(section.key);
                    return (
                      <div key={section.key} className="rounded-md border border-border overflow-hidden">
                        <button
                          onClick={() => toggleSection(section.key)}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-[11px] font-semibold text-foreground flex-1 flex items-center gap-1.5">
                            {idx + 1}. {section.title}
                            {section.key === "hypothesis" && isFirstMeeting && (
                              <Info className="h-3 w-3 text-forskale-teal/70" />
                            )}
                          </span>
                          <ChevronDown className={cn(
                            "h-3 w-3 text-muted-foreground/50 transition-transform duration-200",
                            isOpen && "rotate-180 text-forskale-teal"
                          )} />
                        </button>
                        {isOpen && (
                          <div className="px-2.5 pb-2.5 space-y-1">
                            {section.items.map((item, i) => (
                              <div key={i} className="text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                                <span className="text-forskale-teal flex-shrink-0 font-medium mt-px">•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}

function ScriptPanelContent({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-5">
        <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2.5" />
        <div className="text-xs font-semibold text-foreground mb-1.5">Enrich Participants First</div>
        <div className="text-[10px] text-muted-foreground leading-relaxed">Opening scripts are calibrated to participant archetypes.</div>
      </div>
    );
  }

  const primary = participants[0];
  const profile = primary.cognitiveProfile;
  if (!profile) return null;

  return (
    <>
      <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed mb-2.5 italic">
        <span className="text-foreground not-italic">{profile.openingScript.text.slice(0, 200)}...</span>
      </div>
      <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-2">Neuroscience Analysis</div>
      {profile.openingScript.reasons.map((r) => (
        <ReasonRow key={r.principle} icon="+" color="text-forskale-teal" text={<><strong className="text-foreground">{r.principle}:</strong> {r.explanation}</>} />
      ))}
    </>
  );
}

function CompanyPanelContent({ company }: { company: typeof COMPANY_DATA[string] }) {
  return (
    <>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{company.name}</div>
          <div className="text-[10px] text-muted-foreground">{company.industry}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        {[
          { label: "Size", value: company.size },
          { label: "Revenue", value: company.revenue },
          { label: "Location", value: company.location },
          { label: "Founded", value: company.founded },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50">{item.label}</div>
            <div className="text-[11px] text-foreground font-medium mt-0.5">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground leading-relaxed">{company.description}</div>
    </>
  );
}

function ProspectPanelContent({ participant }: { participant: Participant }) {
  const profile = participant.cognitiveProfile;
  if (!profile) return null;

  const archetype = getArchetype(profile.disc.type);
  const firstName = participant.name.split(" ")[0];

  return (
    <>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-bold font-mono", archetype.bgClass, archetype.colorClass, archetype.borderClass, "border")}>
          {getInitials(participant.name)}
        </div>
        <div>
          <div className="text-[13px] font-bold text-foreground">{participant.name}</div>
          <div className="text-[10px] text-muted-foreground">{participant.role} · {participant.company}</div>
        </div>
      </div>
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-3", archetype.bgClass, archetype.colorClass, archetype.borderClass, "border")}>
        {archetype.label}
      </div>
      <div className="text-[10px] text-muted-foreground leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: archetype.personalityText(firstName).slice(0, 200) + "..." }} />
      <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-2">Behavioral Insight</div>
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="font-semibold text-foreground">Decision Style</span>
            <span className="font-bold text-foreground font-mono">{profile.decisionStyle.score}%</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${profile.decisionStyle.score}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="font-semibold text-foreground">Risk Tolerance</span>
            <span className="font-bold text-foreground font-mono">{profile.riskTolerance.score}%</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-500" style={{ width: `${profile.riskTolerance.score}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {profile.triggers.map((t) => (
          <span key={t.label} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-muted text-forskale-teal border border-forskale-teal/25">
            {t.label}
          </span>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-2">Quick Engage</div>
      <ReasonRow icon="✓" color="text-green-500" text={<><strong className="text-foreground">{archetype.engage[0]?.title}:</strong> {archetype.engage[0]?.body}</>} />
      <ReasonRow icon="✗" color="text-red-500" text={<><strong className="text-foreground">{archetype.engage[2]?.title}:</strong> {archetype.engage[2]?.body}</>} />
    </>
  );
}

function CoachPanelContent({ meeting, navigate }: { meeting: { id: string }; navigate: ReturnType<typeof useNavigate> }) {
  const seqData = getMeetingSequence(meeting.id);

  return (
    <>
      <div className="px-3 py-2 rounded-lg bg-purple-500/[0.06] border border-purple-500/15 text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2 mb-3">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div><strong className="text-foreground">Meeting {seqData.meetingNumber} ({seqData.cognitiveState}).</strong> {seqData.strategyMode === "FIRST_INTERACTION" ? "Focus on building awareness and social proof." : "Build on previous engagement context."}</div>
      </div>
      <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-2">Suggested Next Actions</div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { icon: <History className="h-[18px] w-[18px]" />, title: "Previous Meetings", sub: "Review CRM history", onClick: () => navigate("/meeting-insights") },
          { icon: <Target className="h-[18px] w-[18px]" />, title: "Plan Strategy", sub: "Prepare approach", onClick: () => navigate("/strategy") },
          { icon: <CalendarCheck className="h-[18px] w-[18px]" />, title: "Set Reminder", sub: "48h follow-up", onClick: () => navigate("/action-ready") },
        ].map((item) => (
          <button
            key={item.title}
            onClick={item.onClick}
            className="flex flex-col items-center text-center rounded-lg bg-muted/50 border border-border p-2 transition-all hover:bg-muted hover:-translate-y-px cursor-pointer"
          >
            <div className="mb-1 text-muted-foreground">{item.icon}</div>
            <div className="text-[9px] font-bold text-foreground leading-tight">{item.title}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{item.sub}</div>
          </button>
        ))}
      </div>
    </>
  );
}

function ReasonRow({ icon, color, text }: { icon: string; color: string; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 mb-1.5">
      <span className={cn("text-xs font-bold flex-shrink-0", color)}>{icon}</span>
      <div className="text-[10px] text-muted-foreground leading-relaxed">{text}</div>
    </div>
  );
}

// ── Prospect Intelligence Inline Panel (replaces old full-screen drawer) ──
function ProspectDrawerInline({
  participantId,
  participants,
  enrichedParticipants,
  miniCardExpanded,
  onToggleMiniCard,
  onClose,
  onShowMeetingOverview,
  onEnrich,
  onSwitchParticipant,
}: {
  participantId: string;
  participants: Participant[];
  enrichedParticipants: Set<string>;
  miniCardExpanded: boolean;
  onToggleMiniCard: () => void;
  onClose: () => void;
  onShowMeetingOverview: () => void;
  onEnrich: (name: string) => void;
  onSwitchParticipant: (id: string) => void;
}) {
  const participant = participants.find((p) => p.id === participantId);
  if (!participant) return null;

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const enriched = enrichedParticipants.has(participant.name);
  const profile = participant.cognitiveProfile;
  const archetype = profile ? getArchetype(profile.disc.type) : null;
  const initials = getInitials(participant.name);
  const avatarIdx = participants.findIndex((p) => p.id === participantId);
  const color = getAvatarColor(avatarIdx);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      {/* Drawer Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-bold text-foreground truncate">Prospect Intelligence</span>
          {enriched && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-purple-500/15 to-forskale-teal/10 border border-purple-500/30 text-purple-500">
              Neuroscience Powered
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-[30px] h-[30px] rounded-full bg-muted border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Profile Hero — compact horizontal layout */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3 bg-gradient-to-b from-forskale-teal/[0.03] to-transparent">
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-mono relative shrink-0", color.bg, color.text, color.border, "border")}>
          {initials}
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-card" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground truncate">{participant.name}</span>
            {enriched && archetype && (
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0", archetype.bgClass, archetype.colorClass, archetype.borderClass, "border")}>
                {archetype.label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {participant.role} - {participant.company}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 mt-0.5">
            <span>{COMPANY_DATA[participants[0]?.company === participant.company ? Object.keys(COMPANY_DATA).find(k => COMPANY_DATA[k].name === participant.company) || "6" : "6"]?.location || "Italy"}</span>
            <span>8+ yrs exp</span>
            {enriched && archetype && (
              <span className={cn("font-medium", archetype.colorClass)}>
                {archetype.label === "DYNAMIC" ? "Momentum-driven" : archetype.label === "METHODICAL" ? "Precision-focused" : archetype.label === "ANALYTICAL" ? "Numbers-driven" : archetype.label === "DIPLOMATIC" ? "Consensus builder" : archetype.label === "INNOVATOR" ? "Future-oriented" : archetype.label === "PRUDENT" ? "Authority-driven" : archetype.label === "SCRUPULOUS" ? "Trust-first" : archetype.label === "PRAGMATIC" ? "Results-focused" : "Structured"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!enriched ? (
          /* Locked State */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
            <div className="w-[52px] h-[52px] rounded-full bg-muted border border-border flex items-center justify-center mb-4">
              <Lock className="h-[22px] w-[22px] text-muted-foreground/40" />
            </div>
            <div className="text-base font-bold text-foreground mb-2">Analysis Locked</div>
            <div className="text-xs text-muted-foreground leading-relaxed text-center max-w-[400px] mb-5">
              Enrich this participant to unlock their behavioral analysis, engagement tactics, and risk alerts, all powered by neuroscience research.
            </div>
            <button
              onClick={() => onEnrich(participant.name)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/30 transition-all hover:bg-purple-500/20 hover:-translate-y-px"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Enrich Profile
            </button>
          </div>
        ) : profile && archetype ? (
          /* Enriched State */
          <>
            {/* Personality Bio, highlighted */}
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">About {participant.name.split(" ")[0]}</span>
              </div>
              <div className="rounded-lg bg-purple-500/[0.06] border border-purple-500/20 px-4 py-3">
                <p className="text-[12px] font-medium text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: archetype.personalityText(participant.name) }} />
              </div>

              {/* Scores */}
              <div className="space-y-4 mt-5 mb-5">
                <ScoreBar
                  label="Decision Style"
                  value={profile.decisionStyle.score}
                  desc={profile.decisionStyle.description}
                  gradient="from-pink-500 to-purple-500"
                />
                <ScoreBar
                  label="Risk Tolerance"
                  value={profile.riskTolerance.score}
                  desc={profile.riskTolerance.description}
                  gradient="from-green-500 to-amber-500"
                />
              </div>

              {/* Triggers */}
              <div>
                <div className="text-[11px] font-semibold text-muted-foreground mb-2">Decision Triggers:</div>
                <div className="flex gap-2 flex-wrap">
                  {profile.triggers.map((t) => (
                    <span key={t.label} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-muted text-forskale-teal border border-forskale-teal/25">
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>


            {/* See Meeting Overview Button */}
            <button
              onClick={onShowMeetingOverview}
              className="w-1/2 mx-auto mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0"
            >
              <Eye className="h-4 w-4" />
              See Meeting Overview
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

// ── Score Bar ──
function ScoreBar({ label, value, desc, gradient }: { label: string; value: number; desc: string; gradient: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-semibold text-foreground">{label}</span>
        <span className="text-[13px] font-bold text-foreground font-mono">{value}%</span>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">{desc}</div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", gradient)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Prep Item ──
function PrepItem({ type, title, body }: { type: string; title: string; body: string }) {
  const typeConfig: Record<string, { bg: string; accent: string; icon: string }> = {
    emotion: { bg: "bg-purple-500/15", accent: "bg-purple-500", icon: "💭" },
    mention: { bg: "bg-forskale-teal/15", accent: "bg-forskale-teal", icon: "✓" },
    avoid: { bg: "bg-red-500/15", accent: "bg-red-500", icon: "✗" },
    validate: { bg: "bg-amber-500/15", accent: "bg-amber-500", icon: "!" },
    question: { bg: "bg-blue-500/15", accent: "bg-blue-500", icon: "?" },
  };

  const config = typeConfig[type] || typeConfig.mention;

  return (
    <div className="relative flex gap-3 items-start px-3.5 py-3 rounded-lg bg-muted/50 border border-border overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", config.accent)} />
      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 text-xs", config.bg)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-foreground mb-1">{title}</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </div>
  );
}

// ── Collapsible Section ──
function CollapsibleSection({
  title,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
          {badge}
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200", isOpen && "rotate-180 text-forskale-teal")} />
      </button>
      {isOpen && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}
