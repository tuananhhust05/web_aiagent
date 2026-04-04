import { ActionCardData } from "@/components/atlas/action-card/types";

export interface AttentionRequiredItem {
  id: string;
  title: string;
  type: "email" | "call";
  prospect: string;
  overdueLabel: string;
  tags: string[];
  decisionEngine: {
    detectedSituation: string;
    primaryRecommendation: string;
    confidence: number;
    decisionFactors: string[];
    whyThis: string[];
    objective: string;
  };
  generatedDraft: string;
}

export const attentionRequiredItems: AttentionRequiredItem[] = [
  {
    id: "ar1",
    title: "Reply to: Invito: Atlas DEMO - Security & Enablement Deep Dive",
    type: "email",
    prospect: "Marco Bianchi",
    overdueLabel: "0 days overdue",
    tags: ["Pricing clarification promised 2 days ago", "Demo not scheduled yet", "Prospect waiting for case study"],
    decisionEngine: {
      detectedSituation: "Pricing hesitation after Sept 12 call.",
      primaryRecommendation: "Send Email",
      confidence: 82,
      decisionFactors: [
        "Sentiment: Cautious",
        "Deal Stage: Negotiation",
        "Time Since Objection: 48h",
        "Prospect Response Pattern: Reflective",
      ],
      whyThis: [
        "Prospect is reflective, not reactive",
        "Objection surfaced but no escalation",
        "Written framing enables ROI anchoring",
      ],
      objective: "Reinforce ROI and reduce price sensitivity.",
    },
    generatedDraft:
      "Hi Marco,\n\nFollowing up on our last discussion, I'd like to clarify how the pricing aligns with your Q4 ROI targets...",
  },
  {
    id: "ar2",
    title: "Reply to: Evento annullato: Atlas DEMO - Security & Enablement Deep Di",
    type: "email",
    prospect: "Sara Rossi",
    overdueLabel: "0 days overdue",
    tags: ["Event cancelled unexpectedly", "No reschedule proposed", "Engagement dropping"],
    decisionEngine: {
      detectedSituation: "Event cancelled without follow-up. Risk of disengagement.",
      primaryRecommendation: "Send Email",
      confidence: 75,
      decisionFactors: [
        "Sentiment: Disengaged",
        "Deal Stage: Discovery",
        "Time Since Last Contact: 5 days",
        "Prospect Response Pattern: Passive",
      ],
      whyThis: [
        "Prospect hasn't initiated any follow-up",
        "Cancellation could signal priority shift",
        "Proactive outreach prevents deal going cold",
      ],
      objective: "Re-engage and propose alternative meeting.",
    },
    generatedDraft:
      "Hi Sara,\n\nI noticed the event was cancelled. I understand schedules can shift — would it be helpful to set up a shorter 20-minute call instead?",
  },
  {
    id: "ar3",
    title: "Reply to: Invito: Atlas DEMO - Security & Enablement Deep Dive - Iun 2",
    type: "email",
    prospect: "Luca Ferretti",
    overdueLabel: "0 days overdue",
    tags: ["Demo confirmed but no prep", "Technical questions pending", "Budget approval needed"],
    decisionEngine: {
      detectedSituation: "Demo scheduled but prospect has unresolved technical concerns.",
      primaryRecommendation: "Send Email",
      confidence: 88,
      decisionFactors: [
        "Sentiment: Interested but cautious",
        "Deal Stage: Evaluation",
        "Time Since Objection: 24h",
        "Prospect Response Pattern: Detail-oriented",
      ],
      whyThis: [
        "Addressing questions before demo increases close rate",
        "Prospect values thoroughness",
        "Pre-demo alignment reduces objections in live session",
      ],
      objective: "Pre-address technical concerns to maximize demo impact.",
    },
    generatedDraft:
      "Hi Luca,\n\nAhead of our demo on June 2nd, I wanted to address the technical questions you raised. Here's a brief overview of our architecture...",
  },
  {
    id: "ar4",
    title: "Reply to: For you in Ritam Pramanik's Space: UTM RULES",
    type: "email",
    prospect: "Ritam Pramanik",
    overdueLabel: "0 days overdue",
    tags: ["Shared resource pending review", "Collaboration stalled", "Awaiting feedback"],
    decisionEngine: {
      detectedSituation: "Shared content not acknowledged. Collaboration momentum fading.",
      primaryRecommendation: "Send Email",
      confidence: 70,
      decisionFactors: [
        "Sentiment: Neutral",
        "Deal Stage: Nurturing",
        "Time Since Last Contact: 3 days",
        "Prospect Response Pattern: Collaborative",
      ],
      whyThis: [
        "Content was specifically shared for review",
        "Silence may indicate missed notification",
        "A nudge maintains collaborative relationship",
      ],
      objective: "Prompt review and maintain engagement.",
    },
    generatedDraft:
      "Hi Ritam,\n\nJust wanted to check if you had a chance to review the UTM rules I shared. Happy to walk through them together if that'd be helpful.",
  },
  {
    id: "ar5",
    title: "Reply to: Invitation: Atlas Demo - Q&A Intelligence Validation @ Mon M",
    type: "call",
    prospect: "Elena Marchetti",
    overdueLabel: "0 days overdue",
    tags: ["Q&A session overdue", "Validation pending", "Stakeholder alignment needed"],
    decisionEngine: {
      detectedSituation: "Q&A validation session not confirmed. Stakeholder buy-in at risk.",
      primaryRecommendation: "Schedule Call",
      confidence: 79,
      decisionFactors: [
        "Sentiment: Interested",
        "Deal Stage: Validation",
        "Time Since Last Contact: 4 days",
        "Prospect Response Pattern: Committee-driven",
      ],
      whyThis: [
        "Multiple stakeholders involved in decision",
        "Written communication may not address all concerns",
        "Live session enables real-time objection handling",
      ],
      objective: "Secure stakeholder alignment through direct conversation.",
    },
    generatedDraft:
      "Hi Elena,\n\nI'd love to schedule a quick call to walk through the Q&A validation together. Would Tuesday or Wednesday work for your team?",
  },
];

export const mockActions: ActionCardData[] = [
  {
    id: "1",
    type: "email_response",
    title: "Reply to: How to write the perfect prompt",
    prospect: "Lovable",
    sentiment: "not_interested",
    triggeredFrom: "Email",
    dueLabel: "Due in 18h",
    strategicStep: "Schedule follow-up call to check-in on interest",
    objective: "Re-establish interest",
    interactionSummary: "Prospect showed initial curiosity about prompt engineering but hasn't engaged further. No objections raised — likely evaluating alternatives quietly.",
    interactionHistory: [
      { type: "email", timeAgo: "2d ago", summary: "Asked about pricing tiers" },
      { type: "email", timeAgo: "5d ago", summary: "Downloaded prompt guide" },
      { type: "meeting", timeAgo: "1w ago", summary: "Initial discovery call — positive" },
    ],
    keyTopics: ["Current project status", "Potential pain points", "Lovable.dev value proposition"],
    whyThisStep: "Since the intent is not_interested, it's best to schedule a follow-up call to check-in on their interest and address any potential concerns.",
    decisionFactors: [
      { label: "Intent", value: "not interested" },
      { label: "Source", value: "email" },
      { label: "Deal stage", value: "awareness" },
    ],
    alternativeOptions: [
      { label: "Send email with design tips and case studies", confidence: 60 },
      { label: "Share a relevant app development success story", confidence: 40 },
      { label: "Set a meeting", confidence: 20 },
    ],
    draftContent: "Hi there,\n\nThank you for your email regarding How to write the perfect prompt. I appreciate you reaching out.\n\nI'd love to schedule a quick 15-minute call to discuss how our platform can help streamline your workflow. Would you be available this week?\n\nBest regards",
    toneDrafts: {
      Professional: "Hi there,\n\nThank you for your email regarding How to write the perfect prompt. I appreciate you reaching out.\n\nI'd love to schedule a quick 15-minute call to discuss how our platform can help streamline your workflow. Would you be available this week?\n\nBest regards",
      Warm: "Hi there,\n\nThanks so much for reaching out about How to write the perfect prompt. I'd love to help you explore whether Lovable could be a fit for what you're building.\n\nWould you be open to a short call this week so we can talk through your goals together?\n\nBest regards",
      Direct: "Hi there,\n\nFollowing up on How to write the perfect prompt — I suggest a quick 15-minute call to review your current workflow and see if Lovable fits.\n\nAre you free this week?",
    },
  },
  {
    id: "2",
    type: "email_response",
    title: "Reply to: Your receipt from Lovable #2782-7360",
    prospect: "Lovable",
    sentiment: "not_interested",
    triggeredFrom: "Email",
    dueLabel: "6 days overdue",
    isOverdue: true,
    strategicStep: "Discuss design requirements and app development",
    objective: "Move to demo",
    interactionSummary: "Prospect mentioned wanting a design refresh for their project. Engagement has been steady but no demo scheduled yet. Budget might be a concern.",
    interactionHistory: [
      { type: "email", timeAgo: "1d ago", summary: "Replied asking about visual editor" },
      { type: "email", timeAgo: "3d ago", summary: "Received receipt, no follow-up" },
    ],
    keyTopics: ["app design", "development process", "visual edits", "design suggestions"],
    whyThisStep: "The prospect has shown interest in giving their project a glow-up, indicating they are looking to move forward with their app development. A call can help discuss their specific design requirements and showcase how Lovable can meet their needs.",
    decisionFactors: [
      { label: "Intent", value: "interested" },
      { label: "Source", value: "email" },
      { label: "Deal stage", value: "awareness" },
    ],
    alternativeOptions: [
      { label: "Send email with design tips and case studies", confidence: 60 },
      { label: "Share a relevant app development success story", confidence: 40 },
      { label: "Set a meeting", confidence: 20 },
    ],
    draftContent: "Thank you for your email regarding Your receipt from Lovable #2782-7360. I'll review and get back to you shortly.",
    toneDrafts: {
      Professional: "Hi there,\n\nThank you for your email regarding Your receipt from Lovable #2782-7360. I'll review the details and get back to you shortly with the next steps.\n\nBest regards",
      Warm: "Hi there,\n\nThanks for your note. I’m taking a look at Your receipt from Lovable #2782-7360 and will follow up shortly with a helpful next step.\n\nBest regards",
      Direct: "Hi there,\n\nI reviewed Your receipt from Lovable #2782-7360 and suggest we set a quick meeting to align on the next step.\n\nLet me know a good time.",
    },
  },
  {
    id: "3",
    type: "call_followup",
    title: "Send sandbox access to simulate a call",
    prospect: "Acme Corp",
    sentiment: "interested",
    triggeredFrom: "Meeting",
    dueLabel: "Due in 19h",
    strategicStep: "Share sandbox credentials and schedule a guided walkthrough",
    objective: "Accelerate evaluation by providing hands-on experience",
    interactionSummary: "Strong interest expressed during call. Team wants hands-on testing before committing. CTO involved in evaluation.",
    interactionHistory: [
      { type: "call", timeAgo: "1d ago", summary: "Positive demo feedback — asked for sandbox" },
      { type: "email", timeAgo: "3d ago", summary: "Shared feature comparison doc" },
      { type: "meeting", timeAgo: "1w ago", summary: "Initial discovery with product team" },
    ],
    keyTopics: ["Product demo", "Technical requirements", "Integration timeline"],
    whyThisStep: "Prospect expressed strong interest during the call. Providing immediate sandbox access will maintain momentum.",
    draftContent: "Hi team,\n\nGreat speaking with you today! As discussed, here are your sandbox credentials to test the platform:\n\n🔗 Sandbox URL: [link]\n📧 Login: [email]\n🔑 Password: [auto-generated]\n\nI've pre-loaded some sample data so you can see the full experience. Would Thursday work for a guided walkthrough?\n\nLooking forward to your feedback!",
  },
  {
    id: "4",
    type: "call_followup",
    title: "Send access for a sandbox test",
    prospect: "TechStart Inc",
    sentiment: "interested",
    triggeredFrom: "Meeting",
    dueLabel: "Due in 18h",
    draftContent: "Hi,\n\nFollowing up on our conversation today. I'm setting up your sandbox environment and will share the access details shortly.\n\nIn the meantime, here's a quick overview doc that covers the key features we discussed.\n\nBest,",
  },
  {
    id: "5",
    type: "schedule_demo",
    title: "Schedule technical deep-dive with engineering team",
    prospect: "Enterprise Co",
    sentiment: "interested",
    triggeredFrom: "Meeting",
    dueLabel: "Due in 2 days",
    strategicStep: "Book a 45-min technical deep-dive with their CTO",
    objective: "Address security & integration concerns to unblock procurement",
    interactionSummary: "CTO raised security concerns during initial call. Procurement is blocked until technical validation is complete. Team is otherwise enthusiastic.",
    interactionHistory: [
      { type: "meeting", timeAgo: "2d ago", summary: "Initial call — security questions raised" },
      { type: "email", timeAgo: "4d ago", summary: "Sent SOC2 compliance overview" },
    ],
    keyTopics: ["Security architecture", "API documentation", "SSO integration"],
    whyThisStep: "The CTO raised security concerns during the initial call. A dedicated technical session will build confidence in the platform.",
    draftContent: "Hi [Name],\n\nThank you for the productive conversation yesterday. As discussed, I'd like to schedule a technical deep-dive with your engineering team to cover:\n\n1. Security architecture & SOC2 compliance\n2. API integration patterns\n3. SSO/SAML setup\n\nI've included a calendar link below — please pick a time that works for your team.\n\n📅 [Calendar Link]\n\nLooking forward to it!",
  },
];
