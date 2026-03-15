"""
To-Do Ready Router - Unified task management for emails and meetings.
Implements the To-Do Ready feature with:
- Auto-load and analyze emails/meetings
- Track analyzed items to avoid re-analysis
- Memory signals (SLA breach, promises, overdue)
- CRUD for todo items
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import httpx

from app.models.user import UserResponse
from app.core.auth import get_current_active_user
from app.core.database import get_database, get_weaviate
from app.core.config import settings
from app.services.vectorization import vectorize_text
from app.models.todo_item import (
    TodoItemCreate, TodoItemUpdate, TodoItemResponse, TodoListResponse,
    TodoSource, TodoStatus, TodoPriority, TodoTaskType, IntentCategory,
    DealIntelligence, PreparedAction, TaskStrategy, AlternativeAction, NextStepType,
    MemorySignal, MemorySignalType, MemorySignalsResponse,
    EmailAnalysisState, MeetingAnalysisState,
)
from app.services.gmail_service import gmail_service

logger = logging.getLogger(__name__)

# Knowledge categories matching atlas.py config (Weaviate collections for RAG)
KNOWLEDGE_CATEGORIES = [
    {"weaviate": "AtlasProductInfo", "name": "Product Info"},
    {"weaviate": "AtlasPricingPlan", "name": "Pricing"},
    {"weaviate": "AtlasObjectionHandling", "name": "Objection Handling"},
    {"weaviate": "AtlasCompetitiveIntel", "name": "Competitive Intel"},
    {"weaviate": "AtlasCustomerFaqs", "name": "FAQs"},
    {"weaviate": "AtlasCompanyPolicies", "name": "Company Policies"},
]

router = APIRouter()


async def _get_or_create_email_analysis_state(db, user_id: str) -> dict:
    """Get or create email analysis state for user."""
    state = await db.email_analysis_state.find_one({"user_id": user_id})
    if not state:
        state = {
            "user_id": user_id,
            "analyzed_email_ids": [],
            "last_analyzed_internal_date": None,
            "last_analysis_at": None,
        }
        await db.email_analysis_state.insert_one(state)
    return state


async def _get_or_create_meeting_analysis_state(db, user_id: str) -> dict:
    """Get or create meeting analysis state for user."""
    state = await db.meeting_analysis_state.find_one({"user_id": user_id})
    if not state:
        state = {
            "user_id": user_id,
            "analyzed_meeting_ids": [],
            "last_analysis_at": None,
        }
        await db.meeting_analysis_state.insert_one(state)
    return state


def _doc_to_response(doc: dict) -> TodoItemResponse:
    """Convert DB document to TodoItemResponse."""
    deal_intel = doc.get("deal_intelligence")
    prepared = doc.get("prepared_action")
    intent_raw = doc.get("intent_category")
    intent_category = None
    if intent_raw and intent_raw in [c.value for c in IntentCategory]:
        intent_category = IntentCategory(intent_raw)
    return TodoItemResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        title=doc["title"],
        description=doc.get("description"),
        task_type=doc.get("task_type", TodoTaskType.GENERAL_FOLLOWUP),
        priority=doc.get("priority", TodoPriority.MEDIUM),
        status=doc.get("status", TodoStatus.READY),
        due_at=doc.get("due_at"),
        assignee=doc.get("assignee"),
        source=doc.get("source", TodoSource.MANUAL),
        source_id=doc.get("source_id"),
        deal_intelligence=DealIntelligence(**deal_intel) if deal_intel else None,
        thread_id=doc.get("thread_id"),
        prepared_action=PreparedAction(**prepared) if prepared else None,
        task_strategy=_doc_to_task_strategy(doc.get("task_strategy")),
        intent_category=intent_category,
        reviewed_at=doc.get("reviewed_at"),
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow()),
    )


def _doc_to_task_strategy(data: Optional[dict]) -> Optional[TaskStrategy]:
    """Convert DB task_strategy dict to TaskStrategy model."""
    if not data or not isinstance(data, dict):
        return None
    alts = data.get("alternative_actions")
    if alts and isinstance(alts, list):
        alts = [AlternativeAction(**a) if isinstance(a, dict) else a for a in alts]
    else:
        alts = None
    return TaskStrategy(
        recommended_next_step_type=data.get("recommended_next_step_type", "send_email"),
        recommended_next_step_label=data.get("recommended_next_step_label"),
        objective=data.get("objective"),
        key_topics=data.get("key_topics") or None,
        strategic_reasoning=data.get("strategic_reasoning"),
        decision_factors=data.get("decision_factors") or None,
        alternative_actions=alts,
    )


INTENT_CATEGORIES = [
    "interested", "not_interested", "do_not_contact", "not_now",
    "forwarded", "meeting_intent", "non_in_target",
]


async def _classify_intent_for_text(text: str) -> Optional[str]:
    """Use Groq to classify intent category from task/email/meeting text. Returns one of INTENT_CATEGORIES or None."""
    if not text or not text.strip():
        return None
    if not getattr(settings, "GROQ_API_KEY", None) or not settings.GROQ_API_KEY:
        logger.debug("GROQ_API_KEY not set, skipping intent classification")
        return None
    prompt = f"""You are a B2B sales intent classifier. Classify the prospect/customer message into exactly ONE category.

RULES:
- Use only the exact category key (one word or snake_case).
- Base your answer on commercial intent and next-step implications, not tone alone.

CATEGORIES (use exact key):
- interested: High intent. Positive buying signal: "interesting", "send more info", "let's explore", asked for demo/pricing/details.
- not_interested: Low intent. Clear rejection: "not looking", "no budget", "we're not evaluating", declined.
- do_not_contact: Hard opt-out. "Stop contacting me", "remove me", "unsubscribe", legal/compliance block.
- not_now: Interest but wrong timing. "Reach out next quarter", "ping me in 2 months", "not in budget this year".
- forwarded: Message was forwarded to another person. "Looping in X", "I've forwarded this to...".
- meeting_intent: Explicit meeting/demo request. "Let's schedule", "are you free next week", "can you demo".
- non_in_target: Out of ideal customer profile: wrong industry, size, or geography; not a fit.

CONTENT TO CLASSIFY:
---
{text[:3000]}
---

Reply with ONLY the category key. No punctuation, no explanation."""
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 20,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        raw = content.strip().lower().replace(".", "").strip()
        # Map back to snake_case key
        for cat in INTENT_CATEGORIES:
            if cat.replace("_", " ") == raw or cat == raw:
                return cat
        mapping = {
            "interested": "interested",
            "not interested": "not_interested",
            "do not contact": "do_not_contact",
            "not now": "not_now",
            "forwarded": "forwarded",
            "meeting intent": "meeting_intent",
            "non in target": "non_in_target",
            "non-in-target": "non_in_target",
        }
        return mapping.get(raw)
    except Exception as e:
        logger.warning(f"Intent classification failed: {e}")
        return None


async def _get_full_context_for_task(db, user_id: str, task: dict) -> Optional[str]:
    """Fetch full email body or meeting summary+transcript for richer AI analysis."""
    source = task.get("source")
    source_id = task.get("source_id")
    if not source_id:
        return (task.get("title") or "") + " " + (task.get("description") or "")
    if source == TodoSource.EMAIL.value:
        try:
            email_data = await gmail_service.get_email_by_id(user_id, source_id)
            if email_data:
                parts = [
                    email_data.get("subject") or "",
                    email_data.get("snippet") or "",
                    (email_data.get("body") or "")[:4000],
                ]
                return "\n".join(p for p in parts if p)
        except Exception as e:
            logger.warning(f"Failed to fetch email for context: {e}")
        return (task.get("title") or "") + " " + (task.get("description") or "")
    if source == TodoSource.MEETING.value:
        try:
            meeting = await db.meetings.find_one({"_id": ObjectId(source_id), "user_id": user_id})
            if meeting:
                parts = [meeting.get("title") or ""]
                summary = meeting.get("atlas_summary")
                if summary:
                    parts.append(summary if isinstance(summary, str) else str(summary)[:2000])
                for line in meeting.get("transcript_lines", [])[:50]:
                    parts.append(line.get("text", ""))
                return "\n".join(p for p in parts if p)
        except Exception as e:
            logger.warning(f"Failed to fetch meeting for context: {e}")
        return (task.get("title") or "") + " " + (task.get("description") or "")
    return (task.get("title") or "") + " " + (task.get("description") or "")


async def _search_knowledge_for_context(query_text: str, top_k: int = 3) -> Optional[str]:
    """
    Search Weaviate Knowledge base across all 6 categories to find relevant content
    for enriching AI-generated strategies and scripts.

    Args:
        query_text: The text to search for (email content, meeting summary, task title/description)
        top_k: Max number of results per category

    Returns:
        Combined relevant knowledge text, or None if nothing found / Weaviate unavailable.
    """
    if not query_text or not query_text.strip():
        logger.debug("📚 [KNOWLEDGE RETRIEVE] Skipped — empty query text")
        return None

    logger.info(f"📚 [KNOWLEDGE RETRIEVE] Starting knowledge search across {len(KNOWLEDGE_CATEGORIES)} categories (top_k={top_k})")
    logger.info(f"📚 [KNOWLEDGE RETRIEVE] Query text preview: {query_text[:150].strip()}...")

    try:
        weaviate_client = get_weaviate()
        if not weaviate_client:
            logger.warning("📚 [KNOWLEDGE RETRIEVE] Weaviate client not available — skipping knowledge enrichment")
            return None

        logger.info("📚 [KNOWLEDGE RETRIEVE] Weaviate client connected ✓")

        # Vectorize the query text
        logger.info("📚 [KNOWLEDGE RETRIEVE] Vectorizing query text...")
        query_vector = vectorize_text(query_text[:1500])  # Cap input length
        if not query_vector:
            logger.warning("📚 [KNOWLEDGE RETRIEVE] Vectorization returned empty — aborting search")
            return None
        logger.info(f"📚 [KNOWLEDGE RETRIEVE] Query vectorized ✓ (dimension: {len(query_vector)})")

        all_results = []

        for cat in KNOWLEDGE_CATEGORIES:
            try:
                collection = weaviate_client.collections.get(cat["weaviate"])
                results = collection.query.near_vector(
                    near_vector=query_vector,
                    limit=top_k,
                    return_metadata=["distance"],
                )
                cat_hits = 0
                for obj in results.objects:
                    props = obj.properties
                    distance = obj.metadata.distance if obj.metadata else 1.0
                    similarity = 1 - distance
                    if similarity > 0.5:  # Only include meaningfully relevant results
                        all_results.append({
                            "content": props.get("content", ""),
                            "category": cat["name"],
                            "similarity": round(similarity, 3),
                        })
                        cat_hits += 1
                if cat_hits > 0:
                    logger.info(f"📚 [KNOWLEDGE RETRIEVE]   ✓ {cat['name']} ({cat['weaviate']}): {cat_hits} relevant chunks found")
                else:
                    logger.debug(f"📚 [KNOWLEDGE RETRIEVE]   ○ {cat['name']} ({cat['weaviate']}): no relevant chunks (similarity ≤ 0.5)")
            except Exception as e:
                logger.warning(f"📚 [KNOWLEDGE RETRIEVE]   ✗ {cat['name']} ({cat['weaviate']}): search failed — {e}")
                continue

        if not all_results:
            logger.info("📚 [KNOWLEDGE RETRIEVE] No relevant knowledge found across any category")
            return None

        # Sort by similarity, take top results across all categories
        all_results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = all_results[:top_k * 2]  # Max ~6 chunks

        # Log top results summary
        logger.info(f"📚 [KNOWLEDGE RETRIEVE] Total relevant chunks: {len(all_results)}, using top {len(top_results)}")
        for i, r in enumerate(top_results):
            content_preview = r["content"][:80].replace("\n", " ").strip()
            logger.info(f"📚 [KNOWLEDGE RETRIEVE]   #{i+1} [{r['category']}] sim={r['similarity']} — \"{content_preview}...\"")

        knowledge_context = "\n\n".join([
            f"[{r['category']}] {r['content']}"
            for r in top_results
        ])

        # Cap total length to avoid blowing up the LLM prompt
        if len(knowledge_context) > 2000:
            logger.info(f"📚 [KNOWLEDGE RETRIEVE] Trimming knowledge context from {len(knowledge_context)} to 2000 chars")
            knowledge_context = knowledge_context[:2000]

        logger.info(f"✅ [KNOWLEDGE RETRIEVE] Knowledge enrichment complete: {len(top_results)} chunks, {len(knowledge_context)} chars injected into prompt")
        return knowledge_context

    except Exception as e:
        logger.warning(f"❌ [KNOWLEDGE RETRIEVE] Knowledge search failed (non-blocking): {e}")
        return None


def _default_task_strategy(doc: dict) -> dict:
    """Build default strategy from task source/type/intent (no AI)."""
    source = doc.get("source", "email")
    task_type = doc.get("task_type", "general_followup")
    intent = doc.get("intent_category")
    title = (doc.get("title") or "")[:200]
    desc = (doc.get("description") or "")[:300]
    if source == TodoSource.EMAIL.value:
        next_type = NextStepType.SEND_EMAIL.value
        label = "Send email addressing key points from their message"
        objective = "Maintain engagement and move conversation forward"
        reasoning = "Prospect reached out via email; recommended next step is to reply with clarity on value and next steps."
        topics = ["Acknowledge their message", "Address main question or concern", "Propose clear next step"]
        alts = [
            {"action_type": NextStepType.MAKE_CALL.value, "label": "Schedule follow-up call", "confidence": 65},
            {"action_type": NextStepType.SHARE_CASE_STUDY.value, "label": "Share case study", "confidence": 45},
        ]
    else:
        next_type = NextStepType.SCHEDULE_FOLLOWUP_CALL.value
        label = "Follow up on meeting with agreed next steps"
        objective = "Confirm commitments and schedule next touchpoint"
        reasoning = "Meeting follow-up; recommended to schedule a call to reinforce outcomes."
        topics = ["Recap agreed actions", "Confirm timeline", "Offer calendar link"]
        alts = [
            {"action_type": NextStepType.SEND_EMAIL.value, "label": "Send recap email", "confidence": 75},
            {"action_type": NextStepType.SHARE_CASE_STUDY.value, "label": "Share case study", "confidence": 40},
        ]
    factors = [f"Source: {source}", f"Task type: {task_type}"]
    if intent:
        factors.append(f"Intent: {intent}")
    return {
        "recommended_next_step_type": next_type,
        "recommended_next_step_label": label,
        "objective": objective,
        "key_topics": topics,
        "strategic_reasoning": reasoning,
        "decision_factors": factors,
        "alternative_actions": alts,
    }


async def _generate_task_strategy_with_ai(doc: dict, full_context: Optional[str] = None, knowledge_context: Optional[str] = None) -> Optional[dict]:
    """Use Groq to generate strategy (objective, key_topics, reasoning, alternatives with confidence).
    Now enriched with knowledge base context from Weaviate when available."""
    if not getattr(settings, "GROQ_API_KEY", None) or not settings.GROQ_API_KEY:
        return None
    title = (doc.get("title") or "")[:200]
    desc = (doc.get("description") or "")[:500]
    source = doc.get("source", "email")
    intent = doc.get("intent_category") or ""
    context_block = f"\nFull context (email/meeting):\n{full_context[:2500]}" if full_context else ""
    knowledge_block = ""
    if knowledge_context:
        knowledge_block = f"\n\nRelevant Knowledge Base (use this to make your strategy concrete and grounded):\n{knowledge_context}"
    prompt = f"""You are a B2B sales strategy advisor. For this task, output a JSON object (no markdown, no code block) with:

- recommended_next_step_type: one of send_email, make_call, share_case_study, escalate_technical_validation, schedule_followup_call
- recommended_next_step_label: short phrase e.g. "Send email addressing pricing and timeline"
- objective: one clear commercial objective, e.g. "Re-anchor value", "Reduce pricing resistance", "Confirm timeline", "Move to demo"
- key_topics: array of 2-4 short strings (specific topics to cover in email or call; be concrete)
- strategic_reasoning: 1-2 sentences explaining why this step and why now
- decision_factors: array of 2-4 short strings (e.g. "Intent: interested", "Source: email", "Deal stage: negotiation")
- alternative_actions: array of 2-3 objects, each with action_type (same enum), label (string), confidence (0-100). Give lower confidence to less ideal options.

Consider intent when choosing: do_not_contact → no execution; not_now → schedule follow-up; meeting_intent → prioritize calendar/demo; interested → move deal forward.

Task:
Title: {title}
Description: {desc}
Source: {source}
Intent: {intent}{context_block}{knowledge_block}

Output only valid JSON, no other text."""
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "max_tokens": 600,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
        content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        import json
        out = json.loads(content)
        if not isinstance(out.get("alternative_actions"), list):
            out["alternative_actions"] = _default_task_strategy(doc).get("alternative_actions", [])
        return out
    except Exception as e:
        logger.warning(f"AI strategy generation failed: {e}")
        return None


@router.get("/items", response_model=TodoListResponse)
async def list_todo_items(
    status: Optional[TodoStatus] = None,
    source: Optional[TodoSource] = None,
    priority: Optional[TodoPriority] = None,
    unreviewed_only: bool = Query(False, description="If true, only items with reviewed_at null"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """List todo items with optional filters."""
    db = get_database()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    # Auto-update overdue tasks: if due_at < now and status is ready/needs_input, mark as overdue
    await db.todo_items.update_many(
        {
            "user_id": user_id,
            "status": {"$in": [TodoStatus.READY.value, TodoStatus.NEEDS_INPUT.value]},
            "due_at": {"$lt": now, "$ne": None},
        },
        {
            "$set": {"status": TodoStatus.OVERDUE.value, "updated_at": now}
        }
    )
    
    query = {"user_id": user_id}
    if status:
        query["status"] = status.value
    if source:
        query["source"] = source.value
    if priority:
        query["priority"] = priority.value
    if unreviewed_only:
        query["reviewed_at"] = None
    
    total = await db.todo_items.count_documents(query)
    skip = (page - 1) * limit
    
    cursor = db.todo_items.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    
    items = [_doc_to_response(doc) for doc in docs]
    
    return TodoListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/items/{item_id}", response_model=TodoItemResponse)
async def get_todo_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get a single todo item by ID."""
    db = get_database()
    user_id = str(current_user.id)
    
    try:
        doc = await db.todo_items.find_one({"_id": ObjectId(item_id), "user_id": user_id})
    except Exception:
        doc = await db.todo_items.find_one({"_id": item_id, "user_id": user_id})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    return _doc_to_response(doc)


@router.post("/items", response_model=TodoItemResponse)
async def create_todo_item(
    item: TodoItemCreate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Create a new todo item (manual or from paste)."""
    db = get_database()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    doc = {
        "_id": ObjectId(),
        "user_id": user_id,
        "title": item.title,
        "description": item.description,
        "task_type": item.task_type.value,
        "priority": item.priority.value,
        "status": item.status.value,
        "due_at": item.due_at,
        "assignee": item.assignee,
        "source": item.source.value,
        "source_id": item.source_id,
        "deal_intelligence": item.deal_intelligence.model_dump() if item.deal_intelligence else None,
        "prepared_action": item.prepared_action.model_dump() if item.prepared_action else None,
        "intent_category": item.intent_category.value if item.intent_category else None,
        "task_strategy": item.task_strategy.model_dump() if item.task_strategy else None,
        "created_at": now,
        "updated_at": now,
    }
    
    await db.todo_items.insert_one(doc)
    logger.info(f"Created todo item {doc['_id']} for user {user_id}")
    
    return _doc_to_response(doc)


@router.patch("/items/{item_id}", response_model=TodoItemResponse)
async def update_todo_item(
    item_id: str,
    update: TodoItemUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Update a todo item."""
    db = get_database()
    user_id = str(current_user.id)
    
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    update_data = {"updated_at": datetime.utcnow()}
    if update.title is not None:
        update_data["title"] = update.title
    if update.description is not None:
        update_data["description"] = update.description
    if update.status is not None:
        update_data["status"] = update.status.value
    if update.priority is not None:
        update_data["priority"] = update.priority.value
    if update.due_at is not None:
        update_data["due_at"] = update.due_at
    if update.prepared_action is not None:
        update_data["prepared_action"] = update.prepared_action.model_dump()
    if update.intent_category is not None:
        update_data["intent_category"] = update.intent_category.value
    if update.reviewed_at is not None:
        update_data["reviewed_at"] = update.reviewed_at
    if update.task_strategy is not None:
        update_data["task_strategy"] = update.task_strategy.model_dump()

    await db.todo_items.update_one(query, {"$set": update_data})
    
    updated_doc = await db.todo_items.find_one(query)
    return _doc_to_response(updated_doc)


@router.delete("/items/{item_id}")
async def delete_todo_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Delete a todo item."""
    db = get_database()
    user_id = str(current_user.id)
    
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    
    result = await db.todo_items.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    return {"success": True, "deleted_id": item_id}


@router.post("/items/{item_id}/complete", response_model=TodoItemResponse)
async def complete_todo_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Mark a todo item as done."""
    db = get_database()
    user_id = str(current_user.id)
    
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    
    await db.todo_items.update_one(query, {"$set": {
        "status": TodoStatus.DONE.value,
        "updated_at": datetime.utcnow(),
    }})
    
    updated_doc = await db.todo_items.find_one(query)
    return _doc_to_response(updated_doc)


@router.post("/items/{item_id}/generate-strategy", response_model=TodoItemResponse)
async def generate_strategy_for_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Generate or refresh task strategy (objective, key topics, reasoning, alternative actions)."""
    db = get_database()
    user_id = str(current_user.id)
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    full_context = await _get_full_context_for_task(db, user_id, doc)
    # Enrich with knowledge base
    logger.info(f"🎯 [GENERATE STRATEGY] item={item_id} — searching knowledge base for enrichment...")
    search_text = full_context or (doc.get("title") or "") + " " + (doc.get("description") or "")
    knowledge_context = await _search_knowledge_for_context(search_text)
    logger.info(f"🎯 [GENERATE STRATEGY] item={item_id} — knowledge {'enriched ✓' if knowledge_context else 'not available (proceeding without)'}")
    strategy_dict = await _generate_task_strategy_with_ai(doc, full_context, knowledge_context)
    if not strategy_dict:
        strategy_dict = _default_task_strategy(doc)
    now = datetime.utcnow()
    await db.todo_items.update_one(
        query,
        {"$set": {"task_strategy": strategy_dict, "updated_at": now}},
    )
    updated_doc = await db.todo_items.find_one(query)
    return _doc_to_response(updated_doc)


@router.post("/items/{item_id}/suggest-script", response_model=TodoItemResponse)
async def suggest_script_for_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Generate draft script from strategy key_topics (or keep existing draft). Updates prepared_action."""
    db = get_database()
    user_id = str(current_user.id)
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    strategy = doc.get("task_strategy") or {}
    key_topics = strategy.get("key_topics") or []
    objective = strategy.get("objective") or "Follow up"
    prepared = doc.get("prepared_action") or {}
    draft = prepared.get("draft_text") or ""
    if key_topics and getattr(settings, "GROQ_API_KEY", None):
        # Enrich with knowledge base for more grounded email drafts
        logger.info(f"✍️ [SUGGEST SCRIPT] item={item_id} — searching knowledge base for email draft enrichment...")
        search_text = (doc.get("title") or "") + " " + (doc.get("description") or "") + " " + " ".join(key_topics)
        knowledge_context = await _search_knowledge_for_context(search_text)
        logger.info(f"✍️ [SUGGEST SCRIPT] item={item_id} — knowledge {'enriched ✓' if knowledge_context else 'not available (draft without knowledge)'}")
        knowledge_block = ""
        if knowledge_context:
            knowledge_block = f"\n\nRelevant product/company knowledge (use to make the reply specific and accurate):\n{knowledge_context}\n"
        prompt = f"""Write a professional B2B reply email (2-5 sentences) that:
- Achieves this commercial objective: {objective}
- Addresses these key topics in order: {', '.join(key_topics)}
- Tone: professional, clear, action-oriented. No fluff.
- Do not include subject line or greeting if the thread already has one; output only the body paragraphs.
- If knowledge base info is provided, use specific facts (pricing, features, policies) to make the reply concrete.

Task: {doc.get('title', '')}
Context: {doc.get('description', '')[:300]}{knowledge_block}

Output only the email body text, no subject line."""
        try:
            import httpx as _httpx
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 400,
            }
            async with _httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(url, headers=headers, json=payload)
                r.raise_for_status()
                data = r.json()
            content = (((data or {}).get("choices") or [{}])[0].get("message") or {}).get("content") or ""
            draft = content.strip()
        except Exception as e:
            logger.warning(f"Suggest script AI failed: {e}")
    if not draft:
        draft = f"Thank you for your message. Regarding: {', '.join(key_topics[:3]) if key_topics else 'your inquiry'}. I'll follow up shortly."
    new_prepared = {
        **prepared,
        "strategy_label": strategy.get("recommended_next_step_label") or prepared.get("strategy_label", "Prepared Response"),
        "explanation": strategy.get("strategic_reasoning") or prepared.get("explanation", "AI-suggested draft from strategy."),
        "draft_text": draft,
    }
    now = datetime.utcnow()
    await db.todo_items.update_one(
        query,
        {"$set": {"prepared_action": new_prepared, "updated_at": now}},
    )
    updated_doc = await db.todo_items.find_one(query)
    return _doc_to_response(updated_doc)


@router.post("/items/{item_id}/ensure-analyzed", response_model=TodoItemResponse)
async def ensure_item_analyzed(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    When user opens an item: run intent classification and/or strategy generation if data is incomplete.
    Runs intent first (with full email/meeting context), then strategy so strategy can use intent.
    Returns the updated todo item.
    """
    db = get_database()
    user_id = str(current_user.id)
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")
    now = datetime.utcnow()
    full_context = await _get_full_context_for_task(db, user_id, doc)
    text_for_intent = full_context or (doc.get("title") or "") + " " + (doc.get("description") or "")

    # 1) Missing intent: classify with full context (email body / meeting transcript)
    if not doc.get("intent_category") and doc.get("source") in (TodoSource.EMAIL.value, TodoSource.MEETING.value):
        intent = await _classify_intent_for_text(text_for_intent.strip() or doc.get("title") or "")
        if intent:
            await db.todo_items.update_one(query, {"$set": {"intent_category": intent, "updated_at": now}})
            doc["intent_category"] = intent
            doc["updated_at"] = now
            logger.info(f"ensure-analyzed: set intent_category={intent} for item {item_id}")

    # 2) Reload so strategy sees latest intent
    doc = await db.todo_items.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Todo item not found")

    # 3) Missing strategy: generate with full context + knowledge enrichment
    if not doc.get("task_strategy") or not isinstance(doc.get("task_strategy"), dict):
        logger.info(f"🔍 [ENSURE ANALYZED] item={item_id} — searching knowledge base for strategy enrichment...")
        knowledge_context = await _search_knowledge_for_context(
            text_for_intent[:1500] if text_for_intent else (doc.get("title") or "")
        )
        logger.info(f"🔍 [ENSURE ANALYZED] item={item_id} — knowledge {'enriched ✓' if knowledge_context else 'not available (proceeding without)'}")
        strategy_dict = await _generate_task_strategy_with_ai(doc, full_context, knowledge_context)
        if not strategy_dict:
            strategy_dict = _default_task_strategy(doc)
        await db.todo_items.update_one(
            query,
            {"$set": {"task_strategy": strategy_dict, "updated_at": datetime.utcnow()}},
        )
        doc = await db.todo_items.find_one(query)
        logger.info(f"ensure-analyzed: set task_strategy for item {item_id}")

    return _doc_to_response(doc)


@router.post("/items/{item_id}/send-email")
async def send_email_for_task(
    item_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Send the prepared email reply for a task.
    Uses the user's Gmail account (Google OAuth token) to send the email.

    Accepts optional JSON body: { "draft_text": "..." }
    If draft_text is provided in body, it overrides the stored draft (for edited drafts).
    
    If the user doesn't have send permission, returns needs_reauthorization=true
    with the auth_url to reconnect Gmail.
    """
    from app.services.google_gmail_oauth_service import get_gmail_auth_url
    from jose import jwt
    
    db = get_database()
    user_id = str(current_user.id)

    # Parse optional request body for edited draft
    body_draft_text: Optional[str] = None
    try:
        body = await request.json()
        if isinstance(body, dict):
            body_draft_text = body.get("draft_text")
    except Exception:
        pass  # No body or invalid JSON is fine — we fall back to stored draft
    
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    
    task = await db.todo_items.find_one(query)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.get("intent_category") == IntentCategory.DO_NOT_CONTACT.value:
        raise HTTPException(
            status_code=400,
            detail="Do not contact: execution is disabled for this contact. Block future suggestions and automation.",
        )
    # Check if task is an email task
    if task.get("source") != TodoSource.EMAIL.value:
        raise HTTPException(status_code=400, detail="This task is not from an email")
    
    # Get the draft text — prefer body override, then stored draft
    prepared_action = task.get("prepared_action", {})
    draft_text = body_draft_text or prepared_action.get("draft_text")
    if not draft_text:
        raise HTTPException(status_code=400, detail="No draft text to send")

    # If user passed an edited draft, persist it back to the task for audit trail
    if body_draft_text and body_draft_text != prepared_action.get("draft_text"):
        await db.todo_items.update_one(query, {"$set": {
            "prepared_action.draft_text": body_draft_text,
            "updated_at": datetime.utcnow(),
        }})
        logger.info(f"[SEND EMAIL] Updated draft_text for task {item_id} before sending")
    
    # Check if user has send permission
    can_send = await gmail_service.check_send_permission(user_id)
    logger.info(f"[SEND EMAIL] User {user_id} can_send={can_send}")
    
    if not can_send:
        # Generate auth URL for reauthorization with proper JWT state
        from urllib.parse import urlparse
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin:
            parsed = urlparse(origin)
            redirect_origin = f"{parsed.scheme}://{parsed.netloc}"
        else:
            redirect_origin = getattr(settings, "FRONTEND_URL", "https://forskale.com")
        
        state_payload = {
            "sub": user_id,
            "purpose": "gmail_connect",
            "redirect_origin": redirect_origin,
            "exp": datetime.utcnow() + timedelta(minutes=10),
        }
        state = jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        auth_url = get_gmail_auth_url(state=state)
        
        logger.info(f"[SEND EMAIL] User {user_id} needs reauthorization, auth_url generated")
        
        return {
            "success": False,
            "needs_reauthorization": True,
            "auth_url": auth_url,
            "message": "Gmail needs to be reconnected with send permission.",
        }
    
    # Get original email info
    source_id = task.get("source_id")
    if not source_id:
        raise HTTPException(status_code=400, detail="No source email ID found")
    
    original_email = await gmail_service.get_email_by_id(user_id, source_id)
    if not original_email:
        raise HTTPException(status_code=400, detail="Could not fetch original email")
    
    # Extract recipient (reply to sender)
    sender = original_email.get("from", "")
    # Parse email from "Name <email@domain.com>" format
    import re
    email_match = re.search(r'<([^>]+)>', sender)
    to_email = email_match.group(1) if email_match else sender
    
    # Get subject (add Re: if not already there)
    subject = original_email.get("subject", "")
    if not subject.lower().startswith("re:"):
        subject = f"Re: {subject}"
    
    try:
        result = await gmail_service.send_email(
            user_id=user_id,
            to=to_email,
            subject=subject,
            body=draft_text,
            reply_to_message_id=source_id,
            thread_id=original_email.get("thread_id"),
        )
        
        # Mark task as done after sending
        await db.todo_items.update_one(query, {"$set": {
            "status": TodoStatus.DONE.value,
            "updated_at": datetime.utcnow(),
            "sent_at": datetime.utcnow(),
            "sent_message_id": result.get("id"),
        }})
        
        return {
            "success": True,
            "message": f"Email sent to {to_email}",
            "message_id": result.get("id"),
            "thread_id": result.get("threadId"),
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to send email for task {item_id}: {error_msg}")
        
        # Check if it's a permission error
        if "permission" in error_msg.lower() or "reconnect" in error_msg.lower():
            from urllib.parse import urlparse
            from jose import jwt as jose_jwt
            
            origin = request.headers.get("origin") or request.headers.get("referer")
            if origin:
                parsed = urlparse(origin)
                redirect_origin = f"{parsed.scheme}://{parsed.netloc}"
            else:
                redirect_origin = getattr(settings, "FRONTEND_URL", "https://forskale.com")
            
            state_payload = {
                "sub": user_id,
                "purpose": "gmail_connect",
                "redirect_origin": redirect_origin,
                "exp": datetime.utcnow() + timedelta(minutes=10),
            }
            state = jose_jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
            auth_url = get_gmail_auth_url(state=state)
            
            return {
                "success": False,
                "needs_reauthorization": True,
                "auth_url": auth_url,
                "message": error_msg,
            }
        
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/gmail-send-status")
async def check_gmail_send_status(
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Check if the user's Gmail has send permission.
    Returns can_send=true if ready, or needs_reauthorization=true with auth_url.
    """
    from app.services.google_gmail_oauth_service import get_gmail_auth_url
    from jose import jwt as jose_jwt
    from urllib.parse import urlparse
    
    user_id = str(current_user.id)
    
    can_send = await gmail_service.check_send_permission(user_id)
    
    if can_send:
        return {
            "can_send": True,
            "needs_reauthorization": False,
        }
    
    # Generate auth URL with proper JWT state
    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        parsed = urlparse(origin)
        redirect_origin = f"{parsed.scheme}://{parsed.netloc}"
    else:
        redirect_origin = getattr(settings, "FRONTEND_URL", "https://forskale.com")
    
    state_payload = {
        "sub": user_id,
        "purpose": "gmail_connect",
        "redirect_origin": redirect_origin,
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    state = jose_jwt.encode(state_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    auth_url = get_gmail_auth_url(state=state)
    
    return {
        "can_send": False,
        "needs_reauthorization": True,
        "auth_url": auth_url,
        "message": "Gmail needs to be reconnected with send permission.",
    }


@router.get("/memory-signals", response_model=MemorySignalsResponse)
async def get_memory_signals(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Get memory signals (reminders) for the user.
    Detects: SLA breach, promises pending, overdue tasks.
    """
    db = get_database()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    signals: List[MemorySignal] = []
    
    overdue_query = {
        "user_id": user_id,
        "status": {"$ne": TodoStatus.DONE.value},
        "due_at": {"$lt": now},
    }
    overdue_cursor = db.todo_items.find(overdue_query).limit(10)
    overdue_docs = await overdue_cursor.to_list(length=10)
    
    for doc in overdue_docs:
        due_at = doc.get("due_at")
        days_overdue = (now - due_at).days if due_at else 0
        severity = "critical" if days_overdue > 3 else "warning"
        
        signals.append(MemorySignal(
            id=f"signal-overdue-{doc['_id']}",
            type=MemorySignalType.FOLLOWUP_OVERDUE,
            label=f"{doc['title']} - {days_overdue} days overdue",
            task_id=str(doc["_id"]),
            severity=severity,
            detected_at=now,
        ))
    
    needs_input_query = {
        "user_id": user_id,
        "status": TodoStatus.NEEDS_INPUT.value,
    }
    needs_input_cursor = db.todo_items.find(needs_input_query).limit(5)
    needs_input_docs = await needs_input_cursor.to_list(length=5)
    
    for doc in needs_input_docs:
        created = doc.get("created_at", now)
        days_pending = (now - created).days
        if days_pending >= 2:
            signals.append(MemorySignal(
                id=f"signal-pending-{doc['_id']}",
                type=MemorySignalType.PROMISE_PENDING,
                label=f"{doc['title']} - pending {days_pending} days",
                task_id=str(doc["_id"]),
                severity="warning",
                detected_at=now,
            ))
    
    return MemorySignalsResponse(signals=signals[:10], total=len(signals))


@router.post("/analyze")
async def analyze_new_items(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Analyze new emails and meetings to extract todo items.
    - Only fetches 10 latest emails and 10 latest meetings (no more).
    - Skips any email/meeting already in analyzed_email_ids / analyzed_meeting_ids (no re-analysis).
    - Creates todo items only for new items; marks processed IDs so next run skips them.
    """
    db = get_database()
    user_id = str(current_user.id)
    now = datetime.utcnow()
    
    email_state = await _get_or_create_email_analysis_state(db, user_id)
    meeting_state = await _get_or_create_meeting_analysis_state(db, user_id)
    
    analyzed_email_ids = set(email_state.get("analyzed_email_ids", []))
    analyzed_meeting_ids = set(meeting_state.get("analyzed_meeting_ids", []))
    
    new_todos = []
    new_email_ids = []
    new_meeting_ids = []
    gmail_auth_error = False
    gmail_auth_message = ""
    
    # Get user's email to filter out self-sent emails
    user_email = current_user.email.lower() if current_user.email else ""
    
    try:
        emails = await gmail_service.get_latest_emails(user_id=user_id, max_results=10)
        for email in emails:
            email_id = email.get("id")
            if email_id and email_id not in analyzed_email_ids:
                # Skip emails FROM the user (their own replies/sent)
                sender = email.get("from", "").lower()
                if user_email and user_email in sender:
                    new_email_ids.append(email_id)  # Mark as analyzed but don't create task
                    logger.info(f"Skipping email {email_id} - sent by user")
                    continue
                
                # Double-check: skip if task already exists for this email
                existing_task = await db.todo_items.find_one({
                    "user_id": user_id,
                    "source": TodoSource.EMAIL.value,
                    "source_id": email_id,
                })
                if existing_task:
                    new_email_ids.append(email_id)  # Mark as analyzed but don't create
                    continue
                
                # Also check if we already have a task for this thread (avoid duplicate tasks for same conversation)
                thread_id = email.get("thread_id")
                if thread_id:
                    existing_thread_task = await db.todo_items.find_one({
                        "user_id": user_id,
                        "source": TodoSource.EMAIL.value,
                        "thread_id": thread_id,
                        "status": {"$ne": TodoStatus.DONE.value},  # Only check non-completed tasks
                    })
                    if existing_thread_task:
                        new_email_ids.append(email_id)  # Mark as analyzed but don't create
                        logger.info(f"Skipping email {email_id} - task already exists for thread {thread_id}")
                        continue
                
                new_email_ids.append(email_id)
                
                # Set due date: 24 hours from email received date or now
                email_date_str = email.get("date")
                if email_date_str:
                    try:
                        from email.utils import parsedate_to_datetime
                        email_date = parsedate_to_datetime(email_date_str)
                        due_at = email_date + timedelta(hours=24)
                    except Exception:
                        due_at = now + timedelta(hours=24)
                else:
                    due_at = now + timedelta(hours=24)
                
                todo_doc = {
                    "_id": ObjectId(),
                    "user_id": user_id,
                    "title": f"Reply to: {email.get('subject', 'No subject')[:60]}",
                    "description": email.get("snippet", "")[:200],
                    "task_type": TodoTaskType.RESPOND_TO_EMAIL.value,
                    "priority": TodoPriority.MEDIUM.value,
                    "status": TodoStatus.READY.value,
                    "source": TodoSource.EMAIL.value,
                    "source_id": email_id,
                    "thread_id": email.get("thread_id"),  # Track thread to avoid duplicates
                    "due_at": due_at,
                    "deal_intelligence": {
                        "company_name": _extract_company_from_email(email.get("from", "")),
                    },
                    "prepared_action": {
                        "strategy_label": "Email Response",
                        "explanation": "AI-suggested response based on email context",
                        "draft_text": f"Thank you for your email regarding {email.get('subject', 'your inquiry')}. I'll review and get back to you shortly.",
                    },
                    "created_at": now,
                    "updated_at": now,
                }
                intent = await _classify_intent_for_text(
                    (todo_doc["title"] or "") + " " + (todo_doc.get("description") or "")
                )
                if intent:
                    todo_doc["intent_category"] = intent
                new_todos.append(todo_doc)
                
    except Exception as e:
        error_msg = str(e)
        logger.warning(f"Failed to fetch emails for user {user_id}: {error_msg}")
        # Detect token expiry / re-authentication errors
        if "re-authenticate" in error_msg.lower() or "access token" in error_msg.lower():
            gmail_auth_error = True
            gmail_auth_message = error_msg
    
    try:
        meetings_cursor = db.meetings.find({
            "user_id": user_id,
            "_id": {"$nin": [ObjectId(mid) for mid in analyzed_meeting_ids if len(mid) == 24]},
        }).sort("created_at", -1).limit(10)
        meetings = await meetings_cursor.to_list(length=10)
        
        for meeting in meetings:
            meeting_id = str(meeting["_id"])
            if meeting_id not in analyzed_meeting_ids:
                # Double-check: skip if any task already exists for this meeting
                existing_task = await db.todo_items.find_one({
                    "user_id": user_id,
                    "source": TodoSource.MEETING.value,
                    "source_id": meeting_id,
                })
                if existing_task:
                    new_meeting_ids.append(meeting_id)  # Mark as analyzed but don't create
                    continue
                
                new_meeting_ids.append(meeting_id)
                
                next_steps = meeting.get("atlas_next_steps", [])
                meeting_date = meeting.get("created_at", now)
                
                for i, step in enumerate(next_steps[:3]):
                    if isinstance(step, dict):
                        desc = step.get("description", step.get("text", ""))
                        assignee = step.get("assignee", "")
                    else:
                        desc = str(step)
                        assignee = ""
                    
                    if not desc:
                        continue
                    
                    # Set due date: 48 hours from meeting date
                    due_at = meeting_date + timedelta(hours=48) if isinstance(meeting_date, datetime) else now + timedelta(hours=48)
                    
                    todo_doc = {
                        "_id": ObjectId(),
                        "user_id": user_id,
                        "title": desc[:100],
                        "description": f"From meeting: {meeting.get('title', 'Untitled')}",
                        "task_type": TodoTaskType.GENERAL_FOLLOWUP.value,
                        "priority": TodoPriority.MEDIUM.value,
                        "status": TodoStatus.READY.value,
                        "source": TodoSource.MEETING.value,
                        "source_id": meeting_id,
                        "assignee": assignee,
                        "due_at": due_at,
                        "deal_intelligence": {
                            "company_name": _extract_company_from_meeting(meeting),
                        },
                        "prepared_action": {
                            "strategy_label": "Meeting Follow-up",
                            "explanation": f"Action item from meeting on {meeting.get('created_at', now).strftime('%Y-%m-%d') if isinstance(meeting.get('created_at'), datetime) else 'recent'}",
                            "draft_text": desc,
                        },
                        "created_at": now,
                        "updated_at": now,
                    }
                    intent = await _classify_intent_for_text(
                        (todo_doc["title"] or "") + " " + (todo_doc.get("description") or "")
                    )
                    if intent:
                        todo_doc["intent_category"] = intent
                    new_todos.append(todo_doc)
                    
    except Exception as e:
        logger.warning(f"Failed to fetch meetings for user {user_id}: {e}")
    
    if new_todos:
        await db.todo_items.insert_many(new_todos)
        logger.info(f"Created {len(new_todos)} new todo items for user {user_id}")
    
    if new_email_ids:
        await db.email_analysis_state.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"analyzed_email_ids": {"$each": new_email_ids}},
                "$set": {"last_analysis_at": now},
            },
            upsert=True,
        )
    
    if new_meeting_ids:
        await db.meeting_analysis_state.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"analyzed_meeting_ids": {"$each": new_meeting_ids}},
                "$set": {"last_analysis_at": now},
            },
            upsert=True,
        )
    
    response = {
        "success": True,
        "new_todos_created": len(new_todos),
        "emails_analyzed": len(new_email_ids),
        "meetings_analyzed": len(new_meeting_ids),
        "message": f"Created {len(new_todos)} new tasks from {len(new_email_ids)} emails and {len(new_meeting_ids)} meetings",
        "gmail_auth_error": gmail_auth_error,
        "needs_reauthorization": gmail_auth_error,
    }
    if gmail_auth_error:
        response["message"] = gmail_auth_message or "Gmail token expired. Please re-connect your Gmail account."
        logger.warning(f"Returning gmail_auth_error=True for user {user_id}")
    return response


@router.get("/analysis-state")
async def get_analysis_state(
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get current analysis state (which emails/meetings have been analyzed)."""
    db = get_database()
    user_id = str(current_user.id)
    
    email_state = await _get_or_create_email_analysis_state(db, user_id)
    meeting_state = await _get_or_create_meeting_analysis_state(db, user_id)
    
    return {
        "email": {
            "analyzed_count": len(email_state.get("analyzed_email_ids", [])),
            "last_analysis_at": email_state.get("last_analysis_at"),
        },
        "meeting": {
            "analyzed_count": len(meeting_state.get("analyzed_meeting_ids", [])),
            "last_analysis_at": meeting_state.get("last_analysis_at"),
        },
    }


@router.post("/reset-analysis")
async def reset_analysis_state(
    source: Optional[Literal["email", "meeting", "all"]] = "all",
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Reset analysis state to re-analyze emails/meetings."""
    db = get_database()
    user_id = str(current_user.id)
    
    if source in ("email", "all"):
        await db.email_analysis_state.update_one(
            {"user_id": user_id},
            {"$set": {"analyzed_email_ids": [], "last_analysis_at": None}},
        )
    
    if source in ("meeting", "all"):
        await db.meeting_analysis_state.update_one(
            {"user_id": user_id},
            {"$set": {"analyzed_meeting_ids": [], "last_analysis_at": None}},
        )
    
    return {"success": True, "reset": source}


def _extract_company_from_email(from_field: str) -> str:
    """Extract company name from email sender."""
    if not from_field:
        return "Unknown"
    if "@" in from_field:
        domain = from_field.split("@")[-1].split(">")[0].strip()
        parts = domain.split(".")
        if len(parts) >= 2:
            return parts[-2].capitalize()
    name_part = from_field.split("<")[0].strip().strip('"')
    return name_part if name_part else "Unknown"


def _extract_company_from_meeting(meeting: dict) -> str:
    """Extract company name from meeting data."""
    title = meeting.get("title", "")
    if " - " in title:
        return title.split(" - ")[0].strip()
    if " with " in title.lower():
        idx = title.lower().find(" with ")
        return title[idx + 6:].strip().split()[0] if idx >= 0 else title[:30]
    return title[:30] if title else "Unknown"


@router.get("/items/{item_id}/source-content")
async def get_task_source_content(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Get the source content for a task (email body or meeting transcript).
    Returns the original content that generated this task.
    """
    db = get_database()
    user_id = str(current_user.id)
    
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    
    task = await db.todo_items.find_one(query)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    source = task.get("source")
    source_id = task.get("source_id")
    
    if not source_id:
        return {
            "type": "manual",
            "content": None,
            "message": "This task was created manually, no source content available.",
        }
    
    if source == TodoSource.EMAIL.value:
        try:
            email_data = await gmail_service.get_email_by_id(user_id, source_id)
            if email_data:
                return {
                    "type": "email",
                    "content": {
                        "id": email_data.get("id"),
                        "subject": email_data.get("subject"),
                        "from": email_data.get("from"),
                        "to": email_data.get("to"),
                        "date": email_data.get("date"),
                        "body": email_data.get("body"),
                        "snippet": email_data.get("snippet"),
                    },
                }
            else:
                return {
                    "type": "email",
                    "content": None,
                    "message": "Could not fetch email content. It may have been deleted.",
                }
        except Exception as e:
            logger.warning(f"Failed to fetch email {source_id}: {e}")
            return {
                "type": "email",
                "content": None,
                "message": f"Failed to fetch email: {str(e)}",
            }
    
    elif source == TodoSource.MEETING.value:
        try:
            meeting = await db.meetings.find_one({"_id": ObjectId(source_id), "user_id": user_id})
            if meeting:
                transcript_lines = meeting.get("transcript_lines", [])
                transcript_text = ""
                if transcript_lines:
                    for line in transcript_lines:
                        speaker = line.get("speaker", "Unknown")
                        time = line.get("time", "")
                        text = line.get("text", "")
                        transcript_text += f"[{time}] {speaker}: {text}\n"
                
                return {
                    "type": "meeting",
                    "content": {
                        "id": str(meeting["_id"]),
                        "title": meeting.get("title"),
                        "created_at": meeting.get("created_at").isoformat() if meeting.get("created_at") else None,
                        "platform": meeting.get("platform"),
                        "transcript": transcript_text if transcript_text else None,
                        "summary": meeting.get("atlas_summary"),
                        "next_steps": meeting.get("atlas_next_steps"),
                        "questions_and_objections": meeting.get("atlas_questions_and_objections"),
                    },
                }
            else:
                return {
                    "type": "meeting",
                    "content": None,
                    "message": "Meeting not found.",
                }
        except Exception as e:
            logger.warning(f"Failed to fetch meeting {source_id}: {e}")
            return {
                "type": "meeting",
                "content": None,
                "message": f"Failed to fetch meeting: {str(e)}",
            }
    
    return {
        "type": source,
        "content": None,
        "message": "Unknown source type.",
    }


@router.post("/items/{item_id}/analyze-intent", response_model=TodoItemResponse)
async def analyze_intent_for_item(
    item_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    If the item has no intent_category, run AI to classify and save it.
    Returns the updated todo item.
    """
    db = get_database()
    user_id = str(current_user.id)
    try:
        oid = ObjectId(item_id)
        query = {"_id": oid, "user_id": user_id}
    except Exception:
        query = {"_id": item_id, "user_id": user_id}
    task = await db.todo_items.find_one(query)
    if not task:
        raise HTTPException(status_code=404, detail="Todo item not found")
    if task.get("intent_category"):
        return _doc_to_response(task)
    text_parts = [task.get("title") or "", task.get("description") or ""]
    source = task.get("source")
    source_id = task.get("source_id")
    if source == TodoSource.EMAIL.value and source_id:
        try:
            email_data = await gmail_service.get_email_by_id(user_id, source_id)
            if email_data:
                text_parts.append(email_data.get("subject") or "")
                text_parts.append(email_data.get("snippet") or "")
                text_parts.append((email_data.get("body") or "")[:1500])
        except Exception as e:
            logger.warning(f"Failed to fetch email for intent: {e}")
    elif source == TodoSource.MEETING.value and source_id:
        try:
            meeting = await db.meetings.find_one({"_id": ObjectId(source_id), "user_id": user_id})
            if meeting:
                text_parts.append(meeting.get("title") or "")
                summary = meeting.get("atlas_summary")
                if summary:
                    text_parts.append(summary if isinstance(summary, str) else str(summary)[:1500])
                for line in meeting.get("transcript_lines", [])[:30]:
                    text_parts.append(line.get("text", ""))
        except Exception as e:
            logger.warning(f"Failed to fetch meeting for intent: {e}")
    text = " ".join(p for p in text_parts if p).strip()
    intent = await _classify_intent_for_text(text)
    now = datetime.utcnow()
    if intent:
        await db.todo_items.update_one(query, {"$set": {"intent_category": intent, "updated_at": now}})
        task["intent_category"] = intent
        task["updated_at"] = now
    updated = await db.todo_items.find_one(query)
    return _doc_to_response(updated)
