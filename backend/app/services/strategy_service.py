import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings
from app.services.llm_engine import chat_json

logger = logging.getLogger(__name__)

# ── Interest Scoring ──────────────────────────────────────────────────────────

STAGE_TO_BASE_INTEREST: dict[str, int] = {
    "new": 10,
    "lead": 15,
    "contacted": 25,
    "qualified": 35,
    "demo": 50,
    "proposal": 65,
    "negotiation": 75,
    "closed_won": 95,
    "closed_lost": 0,
}

COGNITIVE_STAGES: list[tuple[int, str]] = [
    (10,  "Cold Contact"),
    (20,  "Attention"),
    (30,  "Curiosity"),
    (40,  "Engagement"),
    (50,  "Problem Recognition"),
    (60,  "Trust"),
    (70,  "Evaluation"),
    (80,  "Validation"),
    (90,  "Hard Commitment"),
    (100, "Decision"),
]

# ── Guardrail Engine ──────────────────────────────────────────────────────────

STAGE_GUARDRAILS: dict[int, dict] = {
    0: {
        "allowed_actions": ["send_credentialized_introduction", "share_relevant_industry_insight", "connect_via_mutual_contact", "send_company_specific_research"],
        "blocked_actions": ["request_demo", "send_pricing", "request_meeting", "send_proposal"],
        "active_guardrails": ["credentialize_early", "schmooze_first_bargain_later", "lead_with_honesty_drawbacks"],
        "timing_constraint": "max_1_touchpoint_per_week",
        "tone_requirement": "conversational_non_sales",
    },
    1: {
        "allowed_actions": ["send_relevant_case_study", "schedule_discovery_call", "send_problem_focused_content", "share_peer_success_story"],
        "blocked_actions": ["send_pricing_information", "send_formal_proposal", "apply_urgency_pressure"],
        "active_guardrails": ["diagnose_top_pains", "social_proof", "lead_with_honesty_drawbacks"],
        "timing_constraint": "max_1_touchpoint_per_5_days",
        "tone_requirement": "educational_consultative",
    },
    2: {
        "allowed_actions": ["conduct_structured_discovery", "send_problem_quantification_framework", "schedule_stakeholder_mapping_call", "send_roi_methodology_without_pricing"],
        "blocked_actions": ["send_formal_pricing", "send_contract", "apply_closing_pressure"],
        "active_guardrails": ["diagnose_top_pains_intensive", "mirror_prospect_discreetly", "schmooze_first_bargain_later"],
        "timing_constraint": "1_touchpoint_every_3_days",
        "tone_requirement": "diagnostic_collaborative",
    },
    3: {
        "allowed_actions": ["send_value_anchor_document", "schedule_formal_demo", "send_roi_with_precise_numbers", "introduce_customer_reference", "present_bundled_pricing_framework"],
        "blocked_actions": ["send_final_contract", "apply_closing_pressure", "offer_discount_without_value_justification"],
        "active_guardrails": ["make_first_offer_set_anchor", "use_precise_numbers", "explain_premium_pricing"],
        "timing_constraint": "1_touchpoint_every_2_days",
        "tone_requirement": "authoritative_consultative",
    },
    4: {
        "allowed_actions": ["send_competitor_comparison_factual", "offer_pilot_program_option", "schedule_reference_customer_call", "send_security_compliance_docs", "invite_to_office_visit"],
        "blocked_actions": ["attack_competitors_directly", "reopen_pricing_without_justification", "apply_artificial_deadline_pressure"],
        "active_guardrails": ["rejection_then_retreat_prepare", "ensure_initial_demands_reasonable", "mirror_prospect_discreetly"],
        "timing_constraint": "1_touchpoint_every_1_to_2_days",
        "tone_requirement": "confident_collaborative",
    },
    5: {
        "allowed_actions": ["get_internal_champion", "map_procurement_process", "send_implementation_plan", "offer_pilot_program_structured", "schedule_executive_sponsor_call"],
        "blocked_actions": ["send_new_proposal", "introduce_pricing_changes", "bypass_blocking_stakeholder", "apply_artificial_urgency"],
        "active_guardrails": ["trigger_consistency_questions", "ask_for_next_step", "rejection_then_retreat_active"],
        "timing_constraint": "daily_touchpoints_acceptable",
        "tone_requirement": "warm_direct_confident",
    },
    6: {
        "allowed_actions": ["send_contract_for_review", "schedule_contract_signing_meeting", "send_final_value_summary_max_3_points", "introduce_implementation_team", "map_signature_logistics"],
        "blocked_actions": ["introduce_new_features", "reopen_agreed_terms", "apply_aggressive_deadline_pressure"],
        "active_guardrails": ["limit_claims_max_3", "trigger_consistency_questions", "negotiate_home_territory"],
        "timing_constraint": "respond_within_4_hours",
        "tone_requirement": "calm_confident_celebratory",
    },
    7: {
        "allowed_actions": ["schedule_implementation_kickoff", "introduce_dedicated_support_manager", "send_personalized_welcome_message", "schedule_week_1_checkin"],
        "blocked_actions": ["upsell_immediately", "send_generic_onboarding", "request_case_study_too_early"],
        "active_guardrails": ["trigger_consistency_post_sale", "schmooze_relationship_continuity"],
        "timing_constraint": "same_day_response",
        "tone_requirement": "warm_celebratory_reassuring",
    },
    8: {
        "allowed_actions": ["send_gracious_loss_acknowledgment", "add_to_quarterly_newsletter", "schedule_6_month_checkin_reminder"],
        "blocked_actions": ["attempt_immediate_re_pitch", "criticize_chosen_competitor", "offer_desperate_discount"],
        "active_guardrails": ["apologize_sincerely", "schmooze_recovery_mode", "lead_with_honesty"],
        "timing_constraint": "max_1_touchpoint_per_quarter",
        "tone_requirement": "humble_gracious_value_only",
    },
}


# ── Context Fetcher ───────────────────────────────────────────────────────────

async def fetch_deal_context(db, deal: dict, user_id: str) -> dict:
    """
    Fetch meetings, interactions, and activities linked to this deal.
    Returns structured context dict ready to be embedded in the AI prompt.
    """
    deal_id_str = str(deal.get("_id", deal.get("id", "")))
    company_name = (
        deal.get("company")
        or deal.get("company_name")
        or deal.get("name", "")
    ).strip()

    # ── 1. Meetings ────────────────────────────────────────────────────────────
    # Link by deal_id first (exact), then fallback to company name match
    meeting_filter: dict = {"user_id": user_id}
    if deal_id_str:
        meeting_filter["$or"] = [
            {"deal_id": deal_id_str},
            {"company": {"$regex": company_name, "$options": "i"}} if company_name else {},
            {"company_name": {"$regex": company_name, "$options": "i"}} if company_name else {},
        ]
    elif company_name:
        meeting_filter["$or"] = [
            {"company": {"$regex": company_name, "$options": "i"}},
            {"company_name": {"$regex": company_name, "$options": "i"}},
        ]

    meeting_projection = {
        "title": 1,
        "created_at": 1,
        "deal_stage": 1,
        "stage": 1,
        "atlas_summary": 1,
        "atlas_smart_summary": 1,
        "atlas_next_steps": 1,
        "atlas_questions_and_objections": 1,
        "atlas_evaluation": 1,
        "transcript_lines": 1,
    }

    meetings_cursor = db.meetings.find(meeting_filter, meeting_projection).sort("created_at", -1).limit(5)
    meetings_raw = await meetings_cursor.to_list(length=5)

    meetings_context: list[dict] = []
    for m in meetings_raw:
        entry: dict = {
            "title": m.get("title", "Meeting"),
            "date": _fmt_date(m.get("created_at")),
            "stage_at_meeting": m.get("deal_stage") or m.get("stage") or "unknown",
        }

        # AI summary (prefer atlas_smart_summary → atlas_summary)
        smart = m.get("atlas_smart_summary") or {}
        summary = m.get("atlas_summary") or {}
        summary_text = (
            smart.get("summary")
            or smart.get("overview")
            or summary.get("summary")
            or summary.get("overview")
            or summary.get("content")
            or ""
        )
        if summary_text:
            entry["summary"] = str(summary_text)[:400]

        # Objections & questions
        qna_raw = m.get("atlas_questions_and_objections") or []
        objections = []
        for q in qna_raw[:5]:
            if isinstance(q, dict):
                text = q.get("question") or q.get("text") or q.get("objection") or ""
                answer = q.get("answer") or q.get("response") or ""
                if text:
                    objections.append(f"Q: {text[:120]}" + (f" → A: {answer[:120]}" if answer else ""))
            elif isinstance(q, str):
                objections.append(q[:120])
        if objections:
            entry["objections"] = objections

        # Next steps from AI
        next_steps_raw = m.get("atlas_next_steps") or []
        next_steps = []
        for ns in next_steps_raw[:3]:
            if isinstance(ns, dict):
                text = ns.get("text") or ns.get("action") or ns.get("description") or ""
                if text:
                    next_steps.append(str(text)[:120])
            elif isinstance(ns, str):
                next_steps.append(ns[:120])
        if next_steps:
            entry["next_steps"] = next_steps

        # Evaluation signals
        eval_data = m.get("atlas_evaluation") or {}
        pulse = eval_data.get("interest_score") or eval_data.get("pulse_score") or eval_data.get("win_probability")
        outcome = eval_data.get("outcome") or eval_data.get("overall_assessment") or ""
        if pulse is not None:
            entry["interest_pulse"] = pulse
        if outcome:
            entry["outcome"] = str(outcome)[:200]

        # Transcript highlights: first 3 non-trivial exchanges
        transcript_lines = m.get("transcript_lines") or []
        highlights = []
        for line in transcript_lines[:80]:
            if isinstance(line, dict):
                text = (line.get("text") or "").strip()
                speaker = line.get("speaker") or line.get("role") or ""
                if len(text) > 30:
                    highlights.append(f"{speaker}: {text[:120]}")
                    if len(highlights) >= 4:
                        break
        if highlights:
            entry["transcript_highlights"] = highlights

        meetings_context.append(entry)

    # ── 2. Interactions (email / call / note linked to deal_id) ───────────────
    interactions_context: list[dict] = []
    if deal_id_str:
        interactions_cursor = db.interactions.find(
            {"deal_id": deal_id_str, "user_id": user_id},
            {"type": 1, "date": 1, "description": 1, "metadata": 1},
        ).sort("date", -1).limit(10)
        interactions_raw = await interactions_cursor.to_list(length=10)

        for ix in interactions_raw:
            itype = ix.get("type", "unknown")
            date = _fmt_date(ix.get("date"))
            desc = (ix.get("description") or "").strip()
            meta = ix.get("metadata") or {}

            entry_parts = [f"[{itype.upper()}] {date}"]
            if desc:
                entry_parts.append(desc[:200])
            # Pull useful metadata fields
            for key in ("subject", "outcome", "sentiment", "summary", "notes"):
                val = meta.get(key)
                if val:
                    entry_parts.append(f"{key}: {str(val)[:120]}")
            interactions_context.append(" | ".join(entry_parts))

    # ── 3. Activities from deals collection ───────────────────────────────────
    activities_context: list[str] = []
    if deal_id_str:
        try:
            from bson import ObjectId
            act_cursor = db.deal_activities.find(
                {"deal_id": deal_id_str},
                {"type": 1, "subject": 1, "content": 1, "created_at": 1},
            ).sort("created_at", -1).limit(6)
            activities_raw = await act_cursor.to_list(length=6)
            for act in activities_raw:
                atype = act.get("type", "activity")
                subj = act.get("subject") or act.get("content") or ""
                date = _fmt_date(act.get("created_at"))
                if subj:
                    activities_context.append(f"[{atype.upper()}] {date}: {str(subj)[:150]}")
        except Exception:
            pass

    return {
        "meetings": meetings_context,
        "interactions": interactions_context,
        "activities": activities_context,
        "meeting_count": len(meetings_context),
    }


def _fmt_date(val) -> str:
    if not val:
        return "unknown date"
    if isinstance(val, datetime):
        return val.strftime("%b %d, %Y")
    try:
        d = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
        return d.strftime("%b %d, %Y")
    except Exception:
        return str(val)[:10]


# ── Main Service Class ────────────────────────────────────────────────────────

class StrategyService:

    def compute_interest_score(self, deal: dict) -> int:
        status = (deal.get("status") or "new").lower()
        base = STAGE_TO_BASE_INTEREST.get(status, 20)

        recency_penalty = 0
        last_activity = deal.get("last_activity_date")
        if last_activity:
            try:
                if isinstance(last_activity, str):
                    last_activity = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                days_idle = (now - last_activity).days
                recency_penalty = min(days_idle, 15)
            except Exception:
                pass

        stall_penalty = 5 if deal.get("is_stalled") else 0

        probability = deal.get("probability")
        if probability is not None:
            try:
                prob = float(probability)
                base = int(base * 0.4 + prob * 0.6)
            except (TypeError, ValueError):
                pass

        raw = base - recency_penalty - stall_penalty
        return round(max(0, min(100, raw)) / 5) * 5

    def get_cognitive_stage(self, score: int) -> tuple[str, int]:
        for idx, (threshold, name) in enumerate(COGNITIVE_STAGES):
            if score <= threshold:
                return name, idx
        return "Decision", len(COGNITIVE_STAGES) - 1

    def get_guardrails(self, stage_index: int) -> dict:
        bucket_map = {0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6}
        bucket = bucket_map.get(stage_index, 7 if stage_index >= 8 else 0)
        return STAGE_GUARDRAILS.get(bucket, STAGE_GUARDRAILS[0])

    def detect_rule_of_one_blocker(self, deal: dict, score: int) -> dict:
        candidates: list[tuple[int, dict]] = []

        days_in_stage = deal.get("days_in_stage", 0) or 0
        if deal.get("is_stalled") and days_in_stage > 14:
            candidates.append((100, {
                "title": "Deal stalled — no progression in over 2 weeks",
                "friction_level": "HIGH",
                "blocking_percent": 60,
                "why_it_matters": "Deals stalled over 14 days have significantly lower close rates; momentum is lost.",
                "how_to_remove": [
                    "Identify the root cause of the stall (budget freeze, stakeholder change, competitor?)",
                    "Schedule a re-engagement call with a new angle",
                    "Offer a pilot or phased approach to lower perceived risk",
                ],
            }))

        if not (deal.get("next_step") or "").strip():
            candidates.append((80, {
                "title": "No defined next step",
                "friction_level": "HIGH",
                "blocking_percent": 45,
                "why_it_matters": "Deals without a committed next action are 3× more likely to go cold.",
                "how_to_remove": [
                    "Before ending any interaction, confirm a specific action with a date",
                    "Send a recap email proposing the next step explicitly",
                ],
            }))

        probability = deal.get("probability")
        if probability is not None:
            try:
                if float(probability) < 30 and score > 50:
                    candidates.append((70, {
                        "title": "Internal confidence low despite advanced stage",
                        "friction_level": "HIGH",
                        "blocking_percent": 40,
                        "why_it_matters": "Low close probability at advanced stage signals unresolved objections or weak champion.",
                        "how_to_remove": [
                            "Run a direct discovery session to surface hidden objections",
                            "Identify and develop an internal champion",
                        ],
                    }))
            except (TypeError, ValueError):
                pass

        last_activity = deal.get("last_activity_date")
        if last_activity:
            try:
                if isinstance(last_activity, str):
                    last_activity = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                days_idle = (now - last_activity).days
                if days_idle > 21:
                    candidates.append((60, {
                        "title": f"No contact for {days_idle} days",
                        "friction_level": "MEDIUM",
                        "blocking_percent": 30,
                        "why_it_matters": "Prolonged silence allows competitors to fill the gap.",
                        "how_to_remove": [
                            "Send a value-led re-engagement message (no sales pressure)",
                            "Share a relevant industry insight or case study",
                        ],
                    }))
            except Exception:
                pass

        candidates.append((20, {
            "title": "Stakeholder alignment not fully confirmed",
            "friction_level": "LOW",
            "blocking_percent": 20,
            "why_it_matters": "Unaligned stakeholders can surface objections late in the process.",
            "how_to_remove": [
                "Map all stakeholders and their positions",
                "Identify the economic buyer and ensure they are engaged",
            ],
        }))

        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _build_prompt(
        self,
        deal: dict,
        contact: Optional[dict],
        score: int,
        stage_name: str,
        stage_idx: int,
        guardrails: dict,
        blocker: dict,
        context: dict,
    ) -> str:
        deal_name = deal.get("name") or "Unknown Deal"
        status = deal.get("status") or "unknown"
        stage_label = deal.get("stage_name") or status
        amount = deal.get("amount") or 0
        days_in_stage = deal.get("days_in_stage") or 0

        contact_name = "Unknown contact"
        if contact:
            fn = contact.get("first_name") or ""
            ln = contact.get("last_name") or ""
            contact_name = f"{fn} {ln}".strip() or contact.get("email") or "Unknown"

        days_since_activity = 0
        last_activity = deal.get("last_activity_date")
        if last_activity:
            try:
                if isinstance(last_activity, str):
                    last_activity = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
                now = datetime.now(timezone.utc)
                if last_activity.tzinfo is None:
                    last_activity = last_activity.replace(tzinfo=timezone.utc)
                days_since_activity = (now - last_activity).days
            except Exception:
                pass

        urgency = "HIGH" if days_in_stage <= 3 or (deal.get("expected_close_date") and days_in_stage < 7) else "NORMAL"
        deal_tier = "enterprise" if (amount or 0) > 50000 else "smb"

        allowed = ", ".join(guardrails.get("allowed_actions", []))
        blocked = ", ".join(guardrails.get("blocked_actions", []))
        active_g = ", ".join(guardrails.get("active_guardrails", []))

        # ── Format meeting context ──────────────────────────────────────────
        meetings = context.get("meetings", [])
        meetings_text = ""
        if meetings:
            parts = []
            for i, m in enumerate(meetings, 1):
                lines = [f"Meeting {i}: {m['title']} ({m['date']}) — stage: {m['stage_at_meeting']}"]
                if m.get("summary"):
                    lines.append(f"  Summary: {m['summary']}")
                if m.get("interest_pulse") is not None:
                    lines.append(f"  Interest pulse: {m['interest_pulse']}")
                if m.get("outcome"):
                    lines.append(f"  Outcome: {m['outcome']}")
                if m.get("objections"):
                    lines.append("  Objections/Questions:")
                    for o in m["objections"]:
                        lines.append(f"    - {o}")
                if m.get("next_steps"):
                    lines.append("  AI-suggested next steps:")
                    for ns in m["next_steps"]:
                        lines.append(f"    - {ns}")
                if m.get("transcript_highlights"):
                    lines.append("  Transcript highlights:")
                    for th in m["transcript_highlights"]:
                        lines.append(f"    > {th}")
                parts.append("\n".join(lines))
            meetings_text = "\n\n".join(parts)
        else:
            meetings_text = "No meeting data available."

        # ── Format interactions ──────────────────────────────────────────
        interactions = context.get("interactions", [])
        interactions_text = "\n".join(f"  - {ix}" for ix in interactions) if interactions else "  No interactions recorded."

        # ── Format activities ────────────────────────────────────────────
        activities = context.get("activities", [])
        activities_text = "\n".join(f"  - {a}" for a in activities) if activities else "  No activities recorded."

        return f"""You are a B2B sales strategy AI. Generate a precise strategic briefing grounded in the REAL interaction history below. Return ONLY valid JSON. No markdown. No preamble.

=== DEAL CONTEXT ===
Company/Deal: {deal_name}
Contact: {contact_name}
CRM Stage: {status} / {stage_label}
Deal Value: €{amount:,.0f}
Days in Stage: {days_in_stage}
Last Activity: {days_since_activity} days ago
Next Step Defined: {"Yes — " + deal.get("next_step", "") if (deal.get("next_step") or "").strip() else "No"}

=== INTEREST INTELLIGENCE ===
Interest Score: {score}/100
Cognitive Stage: {stage_name} (stage {stage_idx + 1} of 10)
Urgency: {urgency}
Deal Value Tier: {deal_tier}

=== MEETING HISTORY ({context.get('meeting_count', 0)} meetings) ===
{meetings_text}

=== INTERACTION & ACTIVITY LOG ===
Interactions:
{interactions_text}
Activities:
{activities_text}

=== GUARDRAILS (MUST FOLLOW) ===
Allowed Actions: {allowed}
Blocked Actions: {blocked}
Active Guardrails: {active_g}
Timing: {guardrails.get("timing_constraint", "")}
Tone: {guardrails.get("tone_requirement", "")}

=== PRIMARY BLOCKER (Rule of One) ===
{blocker.get("title", "")}: {blocker.get("why_it_matters", "")}
How to remove: {"; ".join(blocker.get("how_to_remove", []))}

=== INSTRUCTIONS ===
- Base your narrative and task_cards on the REAL meeting summaries, objections, and signals above
- If objections were raised in meetings, address them directly in top_priorities
- If AI next steps were suggested in meetings, reference them in task_cards
- Do NOT invent facts not present in the context above
- task_cards must be actionable moves referencing actual signals found in meetings/interactions

=== REQUIRED OUTPUT (valid JSON only) ===
{{
  "narrative": "<2-3 sentences: current situation based on meeting history, primary friction, recommended strategic angle>",
  "cognitive_state_explanation": "<1 sentence: what {stage_name} stage means specifically for this deal>",
  "top_priorities": ["<priority 1 referencing actual signals>", "<priority 2>", "<priority 3>"],
  "risk_warnings": ["<risk 1 based on meeting signals>", "<risk 2>"],
  "adaptation_strategy": "<1 sentence: specific move to progress from {stage_name} to next stage, grounded in context>",
  "task_cards": [
    {{
      "id": 1,
      "title": "<imperative action, max 12 words>",
      "priority": "Critical",
      "guardrail_ref": "<one of: {active_g}>",
      "interest_impact": "<e.g. +8-12%>",
      "timing_constraint": "<e.g. Within 48 hours>",
      "success_criteria": "<observable outcome, max 15 words>",
      "reasoning": "<1 sentence referencing specific meeting/interaction signal>",
      "how_steps": ["<step 1>", "<step 2>", "<step 3>"]
    }}
  ]
}}

Rules:
- Generate 1 to 3 task_cards, grounded in real meeting/interaction data
- task_cards[0].priority MUST be "Critical"
- NEVER suggest blocked actions: {blocked}
- Every task_card must reference one guardrail: {active_g}
- Return ONLY the JSON object, nothing else"""

    async def generate(self, deal: dict, contact: Optional[dict] = None, db=None, user_id: str = "") -> dict:
        score = self.compute_interest_score(deal)
        stage_name, stage_idx = self.get_cognitive_stage(score)
        guardrails = self.get_guardrails(stage_idx)
        blocker = self.detect_rule_of_one_blocker(deal, score)

        # Fetch real interaction context from DB
        context: dict = {"meetings": [], "interactions": [], "activities": [], "meeting_count": 0}
        if db is not None and user_id:
            try:
                context = await fetch_deal_context(db, deal, user_id)
            except Exception as exc:
                logger.warning("[StrategyService] Context fetch failed (non-fatal): %s", exc)

        prompt = self._build_prompt(deal, contact, score, stage_name, stage_idx, guardrails, blocker, context)

        ai_result: dict = {}
        ai_error = False

        try:
            if not settings.OPEN_AI_KEY:
                raise RuntimeError("Missing OPEN_AI_KEY")
            out = await chat_json(
                prompt=prompt,
                system="You are a sales strategy AI. Return ONLY valid JSON. No markdown. No extra text.",
                temperature=0.3,
                max_tokens=2000,
            )
            if not isinstance(out, dict):
                raise ValueError("AI did not return a JSON object")
            ai_result = out

        except Exception as exc:
            logger.warning("[StrategyService] AI call failed: %s", exc)
            ai_error = True

            # Build fallback referencing real context
            meeting_signal = ""
            if context["meetings"]:
                first = context["meetings"][0]
                meeting_signal = first.get("summary") or (first["objections"][0] if first.get("objections") else "")

            ai_result = {
                "narrative": (
                    f"{deal.get('name', 'This deal')} is at the {stage_name} stage (score {score}/100). "
                    + (f"Last meeting insight: {meeting_signal[:150]}. " if meeting_signal else "")
                    + f"Primary blocker: {blocker.get('title', 'unknown')}."
                ),
                "cognitive_state_explanation": f"At {stage_name} stage, the buyer needs specific evidence before moving forward.",
                "top_priorities": [
                    blocker.get("title", "Remove primary blocker"),
                    "Address objections raised in last meeting" if context["meetings"] else "Confirm next step with prospect",
                    "Validate stakeholder alignment",
                ],
                "risk_warnings": [
                    blocker.get("why_it_matters", "Unresolved friction slows deal progression."),
                    "Unresolved objections from previous meetings may re-surface." if context["meetings"] else "No next step increases deal mortality rate.",
                ],
                "adaptation_strategy": f"Progress from {stage_name} by resolving: {blocker.get('title', 'primary blocker')}.",
                "task_cards": [{
                    "id": 1,
                    "title": blocker.get("title", "Address primary blocker"),
                    "priority": "Critical",
                    "guardrail_ref": (guardrails.get("active_guardrails") or ["none"])[0],
                    "interest_impact": "+5-10%",
                    "timing_constraint": guardrails.get("timing_constraint", "Within 48 hours"),
                    "success_criteria": "Blocker resolved and next step confirmed",
                    "reasoning": f"Highest-weight friction at {stage_name} stage.",
                    "how_steps": blocker.get("how_to_remove", ["Identify root cause", "Address directly", "Confirm resolution"]),
                }],
            }

        deal_id = str(deal.get("_id", deal.get("id", "")))
        return {
            "deal_id": deal_id,
            "interest_score": score,
            "cognitive_stage": stage_name,
            "stage_index": stage_idx,
            "guardrails": {
                "allowed_actions": guardrails.get("allowed_actions", []),
                "blocked_actions": guardrails.get("blocked_actions", []),
                "active_guardrails": guardrails.get("active_guardrails", []),
            },
            "rule_of_one_blocker": blocker,
            "context_signals": {
                "meetings_analyzed": context.get("meeting_count", 0),
                "interactions_analyzed": len(context.get("interactions", [])),
            },
            **ai_result,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            **({"ai_error": True} if ai_error else {}),
        }
