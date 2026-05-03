/**
 * ============================================================
 * CLAUDE API PROMPTS — 3-STAGE EMAIL GENERATION SYSTEM
 * ============================================================
 *
 * STAGE 1 → Tone Detection
 *   Reads meeting notes, interaction history, deal context.
 *   Outputs: detected tone label + reasoning + confidence.
 *
 * STAGE 2 → Primary Email Draft (detected tone)
 *   Uses the Stage 1 output + full context to write a
 *   detailed, specific, multi-paragraph email.
 *
 * STAGE 3 → Alternate Tone Variants (Formal & Conversational)
 *   Re-writes the Stage 2 draft in the two other tones,
 *   preserving all specific facts and asks.
 *
 * Each stage is a self-contained function that calls
 * POST https://api.anthropic.com/v1/messages
 * ============================================================
 */

// ─── Shared types ────────────────────────────────────────────

export interface DealContext {
  companyName: string;           // e.g. "Legacy Systems Co"
  dealName: string;              // e.g. "Quarterly industry newsletter"
  dealStage: string;             // e.g. "Proposal Sent", "Negotiation", "Discovery"
  dealValue?: string;            // e.g. "€42,000"
  contactName: string;           // e.g. "Marco Bianchi"
  contactRole: string;           // e.g. "Head of Operations"
  senderName: string;            // e.g. "Andrea Marino"
  senderRole: string;            // e.g. "Account Executive"
  actionType: string;            // e.g. "Email Reply", "Follow-up", "Proposal"
  dueInDays: number;             // e.g. 2
  lastTouchpointSummary: string; // e.g. "Last email 2 days ago re: interest in Q3 content"
  meetingNotes?: string;         // Raw notes from last meeting / call transcript
  interactionHistory?: string;   // Chronological summary of past interactions
  keyTopics?: string[];          // e.g. ["ROI", "Budget", "Timeline", "Urgency", "Pricing"]
  neuroscientificPrinciples?: string[]; // e.g. ["Loss Aversion", "Social Proof", "Urgency"]
  openConcerns?: string;         // Any objections or open questions from the contact
  nextMilestone?: string;        // e.g. "Schedule product demo"
}

export interface ToneDetectionResult {
  detectedTone: "Professional" | "Formal" | "Conversational";
  confidence: "high" | "medium" | "low";
  reasoning: string;
  signals: string[];             // specific signals that drove the decision
}

export interface EmailDraftResult {
  subject: string;
  body: string;                  // plain text, paragraphs separated by \n\n
  tone: "Professional" | "Formal" | "Conversational";
}

// ─── Anthropic API wrapper ────────────────────────────────────

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1800
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await response.json();

  // Extract text content
  const text = (data.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  return text.trim();
}

// ════════════════════════════════════════════════════════════
// STAGE 1 — TONE DETECTION
// ════════════════════════════════════════════════════════════

const TONE_DETECTION_SYSTEM = `
You are a senior B2B communication strategist and behavioural analyst embedded inside a sales intelligence platform.

Your single job is to analyse a sales context — including meeting notes, interaction history, deal stage, company signals, and open concerns — and determine the most effective EMAIL TONE for the next outreach.

You choose from exactly three tones:
• "Formal"         — Reserved for highly corporate, regulated, or risk-averse contacts. Long tenured relationships or first senior-executive contacts. Language is precise, structured, third-person-friendly.
• "Professional"   — The default for B2B. Warm but structured. First name, clear value framing, no jargon. Balances credibility with approachability.
• "Conversational" — For contacts who have shown informality in past exchanges, younger companies, strong existing rapport, or SDR-to-peer situations. Reads like a message from a trusted colleague.

CRITICAL rules:
1. Base your decision PRIMARILY on behavioural signals in the interaction history and meeting notes — NOT on company size alone.
2. If you see language like "let me know", "sounds good", "quick call?" in past interactions → lean Conversational.
3. If you see formal salutations, legal review mentions, procurement committees → lean Formal.
4. If the deal is in Negotiation or Proposal stage → prefer Professional unless a strong signal overrides.
5. You MUST return a JSON object. No preamble. No markdown fences. Raw JSON only.

Output schema:
{
  "detectedTone": "Professional" | "Formal" | "Conversational",
  "confidence": "high" | "medium" | "low",
  "reasoning": "2-3 sentence explanation of why this tone fits this specific situation",
  "signals": ["signal 1 from the data", "signal 2", "signal 3"]
}
`.trim();

export async function detectTone(ctx: DealContext): Promise<ToneDetectionResult> {
  const userMessage = `
Analyse the following sales context and return the optimal email tone.

COMPANY: ${ctx.companyName}
DEAL: ${ctx.dealName}
DEAL STAGE: ${ctx.dealStage}
${ctx.dealValue ? `DEAL VALUE: ${ctx.dealValue}` : ""}
CONTACT: ${ctx.contactName} — ${ctx.contactRole}
ACTION REQUIRED: ${ctx.actionType} (due in ${ctx.dueInDays} day(s))

LAST TOUCHPOINT:
${ctx.lastTouchpointSummary}

${ctx.meetingNotes ? `MEETING NOTES / CALL TRANSCRIPT:\n${ctx.meetingNotes}` : ""}

${ctx.interactionHistory ? `FULL INTERACTION HISTORY:\n${ctx.interactionHistory}` : ""}

${ctx.keyTopics?.length ? `KEY TOPICS IN THIS DEAL: ${ctx.keyTopics.join(", ")}` : ""}

${ctx.openConcerns ? `OPEN CONCERNS / OBJECTIONS: ${ctx.openConcerns}` : ""}

Return raw JSON only.
`.trim();

  const raw = await callClaude(TONE_DETECTION_SYSTEM, userMessage, 600);

  // Safe JSON parse — strip any accidental fences
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as ToneDetectionResult;
}

// ════════════════════════════════════════════════════════════
// STAGE 2 — PRIMARY EMAIL DRAFT (AI-DETECTED TONE)
// ════════════════════════════════════════════════════════════

const EMAIL_DRAFT_SYSTEM = `
You are an elite B2B sales email writer working inside a CRM intelligence platform.
You write emails that are sent by sales professionals to their prospects and customers.

Your emails are:
• SPECIFIC — every sentence references something concrete about THIS deal, THIS company, THIS contact.
• DETAILED — not one-liners. A proper email has an opening that shows contextual awareness, a value body of 2-3 paragraphs addressing the specific situation, a concrete single call to action, and a professional close. Total length: 180-320 words.
• PERSUASIVE — you apply the exact neuroscientific principles flagged in the deal context (loss aversion, social proof, urgency, reciprocity) without being manipulative.
• NATURAL — the email sounds like it was written by the sender, not generated. No corporate clichés like "I hope this email finds you well", "touching base", "circle back", or "synergy".

Tone instructions will be provided per request.

Output ONLY the email — subject on the first line prefixed with "Subject: ", then a blank line, then the body. No JSON. No extra commentary.
`.trim();

function buildEmailUserMessage(
  ctx: DealContext,
  tone: ToneDetectionResult,
  targetTone: "Professional" | "Formal" | "Conversational"
): string {
  const toneInstructions: Record<string, string> = {
    Professional: `
TONE — PROFESSIONAL:
- Address the contact by first name.
- Open with a specific reference to the last interaction or a relevant business signal.
- Use clear, direct language. No buzzwords.
- Warm but purposeful. Every paragraph has a job.
- Close with a single, frictionless call to action (e.g. "Does Thursday at 3pm work for a 20-minute call?").
    `.trim(),

    Formal: `
TONE — FORMAL:
- Use full name or title in salutation if role is senior (e.g. "Dear Mr. Bianchi,").
- Third-person references where appropriate ("our respective organisations", "your team's evaluation").
- Structured paragraphs: context → value proposition → evidence → ask.
- Measured language. No contractions. No exclamation marks.
- Close with a professional sign-off ("I look forward to your response at your earliest convenience.").
    `.trim(),

    Conversational: `
TONE — CONVERSATIONAL:
- Open casually — like a smart colleague, not a sales rep ("Hey Marco," or just "Marco —").
- Short punchy sentences mixed with one or two longer explanatory ones.
- Use contractions freely ("we're", "I'd", "you've").
- Reference something personal or informal from past interactions if available.
- CTA should feel like a natural next step between two people who already know each other.
    `.trim(),
  };

  return `
Write a ${targetTone} email from ${ctx.senderName} (${ctx.senderRole}) to ${ctx.contactName} (${ctx.contactRole} at ${ctx.companyName}).

${toneInstructions[targetTone]}

DEAL CONTEXT:
- Deal: ${ctx.dealName}
- Stage: ${ctx.dealStage}
  ${ctx.dealValue ? `- Value: ${ctx.dealValue}` : ""}
- Action required: ${ctx.actionType}
- Next milestone: ${ctx.nextMilestone ?? "Move deal forward"}

WHAT HAPPENED SO FAR:
${ctx.lastTouchpointSummary}
${ctx.interactionHistory ? `\n${ctx.interactionHistory}` : ""}
${ctx.meetingNotes ? `\nMEETING NOTES:\n${ctx.meetingNotes}` : ""}

OPEN CONCERNS TO ADDRESS:
${ctx.openConcerns ?? "None explicitly flagged — but pre-empt any hesitation around commitment."}

KEY TOPICS THIS EMAIL SHOULD TOUCH:
${ctx.keyTopics?.join(", ") ?? "ROI, next steps, timeline"}

PERSUASION LEVERS TO WEAVE IN NATURALLY:
${ctx.neuroscientificPrinciples?.join(", ") ?? "Urgency, Social Proof"}

AI TONE DETECTION CONTEXT (for your reference only, do not quote in the email):
Detected tone: ${tone.detectedTone} (confidence: ${tone.confidence})
Reasoning: ${tone.reasoning}

Now write the email. Output subject line first ("Subject: ..."), blank line, then the body.
`.trim();
}

export async function generatePrimaryDraft(
  ctx: DealContext,
  toneResult: ToneDetectionResult
): Promise<EmailDraftResult> {
  const raw = await callClaude(
    EMAIL_DRAFT_SYSTEM,
    buildEmailUserMessage(ctx, toneResult, toneResult.detectedTone),
    1800
  );

  // Parse subject from first line
  const lines = raw.split("\n");
  const subjectLine = lines.find((l) => l.startsWith("Subject:")) ?? "Subject: Follow-up";
  const subject = subjectLine.replace("Subject:", "").trim();
  const bodyStart = lines.findIndex((l) => l.startsWith("Subject:")) + 2;
  const body = lines.slice(bodyStart).join("\n").trim();

  return { subject, body, tone: toneResult.detectedTone };
}

// ════════════════════════════════════════════════════════════
// STAGE 3 — ALTERNATE TONE VARIANTS
// ════════════════════════════════════════════════════════════
//
// Takes the Stage 2 draft as reference (to preserve all facts)
// and rewrites it in each of the two other tones.
//
// The system prompt instructs the model to keep all specific
// information (names, dates, asks, facts) identical — only
// the register and style change.

const VARIANT_SYSTEM = `
You are a master B2B email stylist.
You are given an original email draft and asked to rewrite it in a different tone.

Rules:
1. PRESERVE every specific fact, name, date, ask, and business detail from the original. Do not invent new information or remove existing information.
2. ONLY change: sentence structure, vocabulary register, salutation, formality level, contractions, and sign-off.
3. The rewritten email must be similarly detailed to the original — do not shorten it significantly.
4. Output only the rewritten email (subject + body, same format as input). No commentary.
`.trim();

export async function generateToneVariant(
  ctx: DealContext,
  toneResult: ToneDetectionResult,
  primaryDraft: EmailDraftResult,
  targetTone: "Formal" | "Conversational"
): Promise<EmailDraftResult> {
  const toneDescriptions: Record<string, string> = {
    Formal: `
FORMAL TONE RULES:
- Salutation: "Dear [Full Name]," or "Dear [Title] [Last Name],"
- No contractions. No exclamation marks. No casual phrasing.
- Structured paragraphs, measured language, third-person organisational references where suitable.
- Sign-off: "I look forward to your response." / "Best regards,"
    `.trim(),

    Conversational: `
CONVERSATIONAL TONE RULES:
- Salutation: "Hey ${ctx.contactName}," or "${ctx.contactName} —"
- Contractions throughout ("we're", "I'd love", "you've").
- Mix short punchy sentences with natural explanatory ones.
- Feels like a message from a trusted colleague, not a vendor.
- Sign-off: "Talk soon," / "Cheers,"
    `.trim(),
  };

  const userMessage = `
Rewrite the following email in a ${targetTone} tone.

${toneDescriptions[targetTone]}

ORIGINAL EMAIL:
Subject: ${primaryDraft.subject}

${primaryDraft.body}

Output the rewritten email starting with "Subject: ..." on the first line.
`.trim();

  const raw = await callClaude(VARIANT_SYSTEM, userMessage, 1800);

  const lines = raw.split("\n");
  const subjectLine = lines.find((l) => l.startsWith("Subject:")) ?? `Subject: ${primaryDraft.subject}`;
  const subject = subjectLine.replace("Subject:", "").trim();
  const bodyStart = lines.findIndex((l) => l.startsWith("Subject:")) + 2;
  const body = lines.slice(bodyStart).join("\n").trim();

  return { subject, body, tone: targetTone };
}

// ════════════════════════════════════════════════════════════
// ORCHESTRATOR — runs all 3 stages in sequence
// ════════════════════════════════════════════════════════════

export interface AllEmailVariants {
  toneDetection: ToneDetectionResult;
  professional: EmailDraftResult;
  formal: EmailDraftResult;
  conversational: EmailDraftResult;
}

export async function generateAllVariants(ctx: DealContext): Promise<AllEmailVariants> {
  // Stage 1: detect tone
  const toneDetection = await detectTone(ctx);

  // Stage 2: generate primary draft in detected tone
  const primaryDraft = await generatePrimaryDraft(ctx, toneDetection);

  // Stage 3: generate the two alternate tones in parallel
  const otherTones = (["Formal", "Conversational"] as const).filter(
    (t) => t !== toneDetection.detectedTone
  );

  const [variantA, variantB] = await Promise.all(
    otherTones.map((t) => generateToneVariant(ctx, toneDetection, primaryDraft, t as "Formal" | "Conversational"))
  );

  // Assemble all three variants keyed by tone
  const byTone: Record<string, EmailDraftResult> = {
    [primaryDraft.tone]: primaryDraft,
    [variantA.tone]: variantA,
    [variantB.tone]: variantB,
  };

  return {
    toneDetection,
    professional: byTone["Professional"] as EmailDraftResult,
    formal: byTone["Formal"] as EmailDraftResult,
    conversational: byTone["Conversational"] as EmailDraftResult,
  };
}

// ════════════════════════════════════════════════════════════
// USAGE EXAMPLE
// ════════════════════════════════════════════════════════════
//
// const ctx: DealContext = {
//   companyName: "Legacy Systems Co",
//   dealName: "Quarterly industry newsletter",
//   dealStage: "Proposal Sent",
//   dealValue: "€18,000/year",
//   contactName: "Marco Bianchi",
//   contactRole: "Head of Operations",
//   senderName: "Andrea Marino",
//   senderRole: "Account Executive",
//   actionType: "Email Reply",
//   dueInDays: 2,
//   lastTouchpointSummary:
//     "Sent proposal 5 days ago. Marco opened it twice but hasn't replied. " +
//     "In the last call he said budget approval was pending CFO sign-off.",
//   meetingNotes:
//     "Call on Apr 1: Marco liked the newsletter concept, mentioned 3 competitors already doing it. " +
//     "CFO wants ROI proof before committing. Timeline concern: needs to launch by Q2.",
//   interactionHistory:
//     "Mar 15 — Discovery call, positive. Mar 22 — Demo, requested proposal. " +
//     "Mar 28 — Proposal sent. Apr 1 — Follow-up call, pending CFO.",
//   keyTopics: ["ROI", "Budget", "Timeline", "Urgency"],
//   neuroscientificPrinciples: ["Loss Aversion", "Social Proof", "Urgency"],
//   openConcerns: "CFO sign-off pending. ROI not yet quantified. Q2 deadline pressure.",
//   nextMilestone: "Get CFO-facing ROI one-pager approved and schedule closing call",
// };
//
// const result = await generateAllVariants(ctx);
// console.log("Detected tone:", result.toneDetection.detectedTone);
// console.log("Professional draft:\n", result.professional.body);
// console.log("Formal draft:\n", result.formal.body);
// console.log("Conversational draft:\n", result.conversational.body);
