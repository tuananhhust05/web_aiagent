# Call Analysis & Insights (Playbook Analysis) Use Cases

This document contains test cases for the "Call Analysis" feature.
It evaluates the LLM's ability to analyze sales conversations, extract needs, identify intent, and provide actionable recommendations.

## System Prompt (Used in Backend `analyze_conversation_with_ai`)
```
You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand customers and make better sales decisions.

Customer Profile:
- Name: [Customer Name]
- Company: [Company Name]
- Job Title: [Job Title]
- Email: [Email]

Campaign Context:
- Campaign Name: [Campaign Name]
- Campaign Type: [Type]

Conversation History:
[Transcript Data]

Analyze this conversation and provide insights in the following JSON format:
{
    "customer_needs": ["need1", "need2", "need3"],
    "buying_intent": "high|medium|low",
    "interest_level": "very_high|high|medium|low|very_low",
    "pain_points": ["pain1", "pain2"],
    "sentiment": "positive|neutral|negative",
    "funnel_stage": "lead|qualified|negotiation|close",
    "key_topics": ["topic1", "topic2", "topic3"],
    "objections": ["objection1", "objection2"],
    "recommended_actions": [
        {
            "action": "action_description",
            "priority": "high|medium|low",
            "reason": "why this action is recommended"
        }
    ],
    "suggested_responses": [
        {
            "situation": "when to use this response",
            "response": "the suggested response text"
        }
    ]
}
```

---

## Test Case 1: Early Discovery Call (Identifying Hidden Pain Points)

**Input Context:**
- Customer: John Doe, VP of Marketing at TechCorp
- Campaign: Outbound SaaS Outreach

**Transcript:**
[Sales Rep - 10:00]: Hi John, thanks for joining. I noticed TechCorp has been scaling rapidly. How is your current marketing analytics stack holding up?
[Customer - 10:01]: It's okay. We use a mix of Google Analytics and some custom spreadsheets. It gets the job done.
[Sales Rep - 10:02]: Spreadsheets can get tricky at scale. How much time does your team spend building weekly reports?
[Customer - 10:04]: Hmm, probably around 15 hours a week across the team. It's annoying, and sometimes the data is out of sync, which frustrated our CEO last quarter. But changing systems right now feels like a huge headache.

**Expected Evaluation Criteria (Claude vs OpenAI):**
- **Pain Points:** Must identify "data out of sync", "15 hours/week manual reporting", and "CEO frustration".
- **Objections:** Must catch the "changing systems feels like a headache" (migration friction).
- **Funnel Stage:** Should be "lead" or "qualified".
- **Recommended Action:** Suggesting a way to address the migration headache (e.g., showing how easy onboarding is) rather than just pushing for a sale.

---

## Test Case 2: Pricing Negotiation (Handling Budget Objections)

**Input Context:**
- Customer: Sarah Smith, Director of Operations at LogistiX
- Campaign: Enterprise Upgrade

**Transcript:**
[Sales Rep - 14:00]: Sarah, based on our trial, your team saved 30% on route planning time. The Enterprise tier is $2,000/month.
[Customer - 14:02]: I agree the trial went well, and my team loves it. But $2,000 is double what we currently pay for our legacy system. My CFO will never approve that without a guaranteed ROI within 3 months.
[Sales Rep - 14:03]: I understand. What if we could do a phased rollout?
[Customer - 14:05]: That might work, but I need to see a hard ROI calculation first. Can you send me a template? I'm meeting the CFO on Friday.

**Expected Evaluation Criteria:**
- **Buying Intent:** High (team loves it, saved 30% time).
- **Objections:** Price is double the legacy system; needs CFO approval; requires 3-month ROI proof.
- **Funnel Stage:** "negotiation".
- **Recommended Action:** High priority: Prepare and send an ROI calculation template before Friday's CFO meeting.

---

## Test Case 3: Disengaged Prospect (Detecting Low Intent)

**Input Context:**
- Customer: Mike Johnson, IT Manager
- Campaign: Cold Email Follow-up

**Transcript:**
[Sales Rep - 09:00]: Hi Mike, following up on my email regarding our cybersecurity audit tool. Did you have a chance to review the brief?
[Customer - 09:15]: Yeah, I skimmed it.
[Sales Rep - 09:16]: Great. We're helping companies like yours reduce audit times by 50%. Are you currently evaluating any tools in this space?
[Customer - 10:30]: Not really a priority right now. Maybe next year. We're busy with a data center migration.
[Sales Rep - 10:35]: Understood. The migration must be taking a lot of resources. Does your current tool support cloud migrations?
[Customer - 14:00]: Yes. Thanks.

**Expected Evaluation Criteria:**
- **Interest Level:** "low" or "very_low".
- **Sentiment:** "neutral" to "negative".
- **Pain Points:** Busy with data center migration (competing priority).
- **Recommended Action:** Put prospect in a long-term nurture sequence (check back next year), do not push for a meeting now.
