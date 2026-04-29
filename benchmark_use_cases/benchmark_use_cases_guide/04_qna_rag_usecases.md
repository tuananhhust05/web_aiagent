# Q&A Engine (RAG) & Sales Coach Use Cases

This document contains test cases for the "Q&A Engine" and "Sales Coach" RAG capabilities.
It evaluates the LLM's ability to strictly adhere to provided knowledge (Context Adherence) and avoid Hallucination when answering sales-related questions.

## System Prompt (Used in Backend `generate_grounded_answer`)
```
Answer using ONLY this knowledge:

[Extracted Knowledge Base Chunks from Weaviate]

Question: [Salesperson's Question]

Return JSON: {"answer": "2-3 sentences", "confidence": 0.85, "sources_used": true}
```

---

## Test Case 1: Strict Policy Adherence (Anti-Hallucination)

**Input Context:**
- Knowledge Base:
  "Pricing Model 2026:
  - Starter Plan: $99/mo (Max 5 users, standard support)
  - Pro Plan: $299/mo (Max 20 users, priority email support)
  - Enterprise Plan: Custom pricing (Unlimited users, 24/7 phone support, dedicated CSM)
  Discount Policy: Account Executives can offer a maximum 10% discount on Pro Plans only. No discounts allowed for Starter. Enterprise discounts require VP approval."
- Question: "My customer wants the Starter Plan but asks for a 5% discount to sign today. Can I approve it? What if they upgrade to Pro later?"

**Expected Evaluation Criteria (Claude vs OpenAI):**
- **Answer:** Must clearly state "No" for the Starter plan discount.
- **Accuracy:** Should mention they can get a max 10% discount if they switch/upgrade to the Pro Plan.
- **Hallucination Check:** If the model invents a "manager approval for Starter" or a "promotional code," it fails.

---

## Test Case 2: Handling Out-of-Scope Questions (Graceful Degradation)

**Input Context:**
- Knowledge Base:
  "Product Features (v2.4):
  - Advanced Analytics Dashboard (Export to CSV, PDF)
  - Single Sign-On (SSO) via SAML/Okta
  - Automated Email Workflows (up to 5,000 emails/day)
  - CRM Integrations: Salesforce, HubSpot, Pipedrive."
- Question: "Does our platform integrate with Zoho CRM, and do we support sending SMS messages?"

**Expected Evaluation Criteria:**
- **Answer:** Must explicitly state that the platform integrates with Salesforce, HubSpot, and Pipedrive, but Zoho is NOT listed.
- **Accuracy:** Must explicitly state that there is no mention of SMS support (only Email Workflows).
- **Confidence:** Should be lower (e.g., ~0.6) or specifically note the limitations of the knowledge base.

---

## Test Case 3: Complex Coaching Advice (Using the `Atlas` Sales Coach Prompt)

**Backend Prompt Variation (`analyze_goal_with_ai` in `ai_sales_copilot.py`):**
```
You are an Atlas, a personal sales coach that helps salespeople improve their sales performance.

User's Question/Request: "I have a call with a very technical CTO who hates 'sales fluff'. Our product is an AI developer tool. How should I open the call and what objections should I prepare for?"

Return JSON:
{
    "answer": "Coaching response",
    "call_preparation": {
        "key_points": ["point1"],
        "potential_objections": ["objection1"],
        "responses": ["response1"]
    }
}
```

**Expected Evaluation Criteria:**
- **Answer Tone:** Direct, technical, cutting out standard "fluff" (e.g., skipping small talk, getting straight to architecture/API docs).
- **Potential Objections:** Identifying CTO-specific concerns (e.g., Data Privacy/Security, Latency, API Rate Limits, Lock-in).
- **Responses:** Providing concrete, non-salesy answers (e.g., "Our models run locally in your VPC, zero data leaves your network").
