# Action Extraction & To-Do Generation Use Cases

This document contains test cases for the "Atlas" Action Extraction feature.
It evaluates the LLM's ability to extract structured to-do items from chaotic, multi-party text and assign proper metadata.

## System Prompt (Used in Backend `generate_to_dos`)
```
You are an Atlas, an intelligent assistant that helps salespeople manage their sales activities efficiently.

[Goal Context]
[Prospect Context]
[Campaign Context]

Analyze the provided context and generate a prioritized list of actionable to-do items for the salesperson.
Focus ONLY on actions that the salesperson needs to take. Ignore actions assigned to the prospect or other team members.

Return your response in the following JSON format:
{
    "todos": [
        {
            "title": "Clear, concise title (max 50 chars)",
            "description": "Detailed explanation of what needs to be done and why",
            "type": "email|call|video_call|research|proposal|crm_update",
            "priority": "high|medium|low",
            "suggested_deadline": "YYYY-MM-DD",
            "contact_name": "Name of the prospect to contact (if applicable)",
            "contact_id": "ID of the prospect",
            "message": "Suggested complete email/message content (only for email type)",
            "call_script": "Suggested talking points/script (only for call/video_call type)",
            "topics": ["topic1", "topic2"]
        }
    ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- For email type: MUST have "message" and "topics", NO "call_script"
- For call/video_call: MUST have "call_script" and "topics", NO "message"
- Messages must be complete and ready to send (personalized with prospect name/company)
- Prioritize actions that directly contribute to achieving the goal
```

---

## Test Case 1: Post-Call Messy Notes (Entity Extraction)

**Input Context:**
- Today's Date: 2026-04-15
- Notes from Sales Rep (Me): "Great chat with Acme Corp. I need to send the security whitepaper to their CTO, Bob. Also, Mary from Legal said she'll review our MSA by Friday. Remind me to update the HubSpot deal stage to 'Legal Review' before I leave today. Next week Tuesday, I should call Bob to see if he has questions on the whitepaper."
- Goal: Close Acme Corp Deal this month.

**Expected Evaluation Criteria (Claude vs OpenAI):**
- **JSON Formatting:** Strict adherence to JSON schema.
- **Filtering Noise:** Should ignore Mary's task (she is reviewing the MSA, not the Sales Rep).
- **Task 1:** Type: `email`, Title: "Send security whitepaper to Bob", Deadline: 2026-04-15 or 16, Message: generated draft email.
- **Task 2:** Type: `crm_update`, Title: "Update HubSpot deal stage to Legal Review", Deadline: 2026-04-15.
- **Task 3:** Type: `call`, Title: "Follow up with Bob on whitepaper", Deadline: 2026-04-21, Call Script: generated bullet points.

---

## Test Case 2: Multi-Prospect Campaign Execution

**Input Context:**
- Today's Date: 2026-04-15
- Goal: Secure 3 meetings with VPs of Engineering in Q2.
- Prospects:
  - Prospect 1: Alex Mercer (VP Eng at CloudNet) - Status: Downloaded eBook "AI in DevOps" yesterday.
  - Prospect 2: Sarah Connor (Head of Infra at GlobalTech) - Status: Cold lead, no interaction.
- Campaign: "Q2 DevOps Outreach"

**Expected Evaluation Criteria:**
- **Prioritization:** Task for Alex Mercer should be `high` priority (warm lead), Sarah Connor should be `medium` or `low`.
- **Personalization:** Email for Alex must reference the specific eBook he downloaded ("AI in DevOps"). Email for Sarah should be a standard cold outreach template but personalized with her name and company.
- **Task Accuracy:** Type: `email` for both, with `message` field fully drafted.

---

## Test Case 3: Vague Instructions (Inferring Action)

**Input Context:**
- Today's Date: 2026-04-15
- Goal: Expand account at TechNova.
- Notes: "Meeting with TechNova went well. They might need more seats. Look into their current usage stats and put something together."

**Expected Evaluation Criteria:**
- **Inferred Task 1:** Type: `research`, Title: "Analyze TechNova current usage stats".
- **Inferred Task 2:** Type: `proposal` or `email`, Title: "Draft seat expansion proposal for TechNova".
- **Logic:** The LLM must intelligently break down the vague "put something together" into logical sales steps (Research -> Proposal).
