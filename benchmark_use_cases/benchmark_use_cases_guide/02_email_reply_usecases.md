# Email Reply & Script Suggestion Use Cases

This document contains test cases for the "Reply Lab" and "Sales Script" feature.
It evaluates the LLM's ability to generate professional, empathetic, and concise sales responses (2-3 sentences max) based on context.

## System Prompt (Used in Backend `suggest_sales_script`)
```
You are an AI Sales Copilot. Generate professional, empathetic sales responses. Keep responses concise (2-3 sentences).

Context:
[Customer Context & Message History]

User Request:
[Sales Rep's goal for this email]
```

---

## Test Case 1: Handling a Competitor Objection

**Input Context:**
- Customer: "Hi, thanks for reaching out. We are currently using Salesforce and we just signed a 2-year renewal contract with them last month. It's working fine for us right now."
- Goal: Maintain a positive relationship, plant a seed of doubt regarding Salesforce's specific weak point (e.g., complexity/cost of custom reporting), and ask to stay in touch without being pushy.

**Expected Evaluation Criteria (Claude vs OpenAI):**
- **Length Constraint:** Must strictly be 2-3 sentences.
- **Empathy & Tone:** Must congratulate them on the renewal and sound professional.
- **Objection Handling:** Must smoothly pivot to a value proposition (e.g., "If you ever find custom reporting too complex...") without criticizing the competitor aggressively.

---

## Test Case 2: Post-Demo Follow-Up with Silence

**Input Context:**
- Message History: 
  - Last week: We had a great 45-minute demo showing our AI automation tool.
  - 3 days ago: I sent a follow-up email with the pricing deck. No reply.
  - Yesterday: I left a voicemail. No reply.
- Goal: Send a polite "breakup" or "re-engagement" email. Acknowledge they might be busy, ask if this project has been deprioritized, and offer an easy way out or a quick next step.

**Expected Evaluation Criteria:**
- **Length Constraint:** Must be concise (2-3 sentences).
- **Tone:** Professional, non-guilt-tripping.
- **Call to Action (CTA):** A low-friction question (e.g., "Has this fallen off your radar?") that makes it easy for the prospect to reply with a simple yes/no.

---

## Test Case 3: The "Too Expensive" Objection

**Input Context:**
- Customer: "We reviewed the proposal. Honestly, $15k a year is completely out of our budget for a team of our size. We were expecting something closer to $8k."
- Goal: Validate their budget concern, but pivot the conversation toward the Return on Investment (ROI). We save average teams 20 hours a week. Ask for a brief call to see if we can tailor a package or justify the cost.

**Expected Evaluation Criteria:**
- **Tone:** Empathetic to the sticker shock.
- **Value Proposition:** Must mention the ROI (saving 20 hours/week) seamlessly.
- **CTA:** Suggesting a brief call to explore options rather than instantly dropping the price or arguing.
