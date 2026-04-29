# Sentiment & Buying Signal Analysis Use Cases

This document contains test cases for the "Memory Signal" and "Campaign Analysis" features.
It evaluates the LLM's ability to read between the lines, identify true buying intent from ambiguous text, and generate DISC personality profiles.

## System Prompt (Used in Backend `analyze_conversation_with_ai` and `linkedin_enrichment_service`)
```
You are an AI Sales Copilot, an intelligent assistant that helps salespeople understand customers and make better sales decisions.

Conversation History / Message:
[Text]

Return JSON:
{
    "sentiment": "positive|neutral|negative",
    "buying_intent": "high|medium|low",
    "interest_level": "very_high|high|medium|low|very_low",
    "objections": ["objection1"],
    "key_topics": ["topic1"]
}
```

---

## Test Case 1: Passive Aggressive / Hesitant (False Positive Intent)

**Input Context:**
- Text: "Sure, your AI analytics feature looks very interesting, and I see how it could save time. However, our board just froze all new IT spending until Q4 due to the merger. I'll keep your deck on file, but we won't be moving forward right now. Have a good week."

**Expected Evaluation Criteria (Claude vs OpenAI):**
- **Sentiment:** Neutral to Negative (Polite but rejecting).
- **Buying Intent:** Low. (Even though they said the feature is "interesting," the budget freeze means they cannot buy).
- **Interest Level:** Medium (Interested in product, but timeline/budget is blocked).
- **Objections:** "Board froze IT spending until Q4", "Merger happening".
- **Crucial Check:** The model must not interpret "looks very interesting" as a high buying intent signal.

---

## Test Case 2: Hidden Urgency (High Intent disguised as complaints)

**Input Context:**
- Text: "This current legacy system is driving me crazy! It crashed three times this week during our peak hours. I saw your pricing is about 20% higher than what we pay now, which my boss won't love. But honestly, if your SLA guarantees 99.99% uptime and we can migrate the database over the weekend without downtime, I might just push this through myself."

**Expected Evaluation Criteria:**
- **Sentiment:** Frustrated (with current system), Hopeful/Positive (about your solution).
- **Buying Intent:** High. (Prospect is highly motivated by pain and is willing to "push it through" despite higher cost).
- **Interest Level:** Very High.
- **Objections:** "Pricing is 20% higher than legacy system", "Boss won't love the price".
- **Crucial Check:** The model must recognize that the "pain" is outweighing the "price objection," creating a strong buying signal.

---

## Test Case 3: DISC Personality Analysis (LinkedIn Enrichment)

**Backend Prompt Variation (`linkedin_enrichment_service.py`):**
```
You are a sales intelligence analyst. Analyze LinkedIn profiles to generate DISC personality assessments and communication strategies for sales teams.

Profile Text:
"Senior VP of Sales at Oracle. 15+ years scaling enterprise revenue from $10M to $100M. Data-driven leader focused on aggressive growth, crushing quotas, and building high-performance, ruthless execution teams. I don't do 'fluff'. Results speak louder than words."

Return JSON:
{
    "disc_type": "D|I|S|C",
    "personality_traits": ["trait1", "trait2"],
    "communication_dos": ["do1", "do2"],
    "communication_donts": ["dont1", "dont2"]
}
```

**Expected Evaluation Criteria:**
- **DISC Type:** Must classify as **"D" (Dominance)**.
- **Personality Traits:** "Data-driven", "Results-oriented", "Aggressive", "Direct".
- **Communication Dos:** "Get straight to the point", "Focus on ROI and results", "Use data/metrics".
- **Communication Donts:** "Don't use fluff or small talk", "Don't focus on emotions/feelings", "Don't waste time on long pleasantries".
