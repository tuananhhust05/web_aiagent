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

from app.models.user import UserResponse
from app.core.auth import get_current_active_user
from app.core.database import get_database
from app.core.config import settings
from app.models.todo_item import (
    TodoItemCreate, TodoItemUpdate, TodoItemResponse, TodoListResponse,
    TodoSource, TodoStatus, TodoPriority, TodoTaskType,
    DealIntelligence, PreparedAction,
    MemorySignal, MemorySignalType, MemorySignalsResponse,
    EmailAnalysisState, MeetingAnalysisState,
)
from app.services.gmail_service import gmail_service

logger = logging.getLogger(__name__)

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
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow()),
    )


@router.get("/items", response_model=TodoListResponse)
async def list_todo_items(
    status: Optional[TodoStatus] = None,
    source: Optional[TodoSource] = None,
    priority: Optional[TodoPriority] = None,
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


@router.post("/items/{item_id}/send-email")
async def send_email_for_task(
    item_id: str,
    request: Request,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Send the prepared email reply for a task.
    Uses the user's Gmail account to send the email.
    
    If the user doesn't have send permission, returns needs_reauthorization=true
    with the auth_url to reconnect Gmail.
    """
    from app.services.google_gmail_oauth_service import get_gmail_auth_url
    from jose import jwt
    
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
    
    # Check if task is an email task
    if task.get("source") != TodoSource.EMAIL.value:
        raise HTTPException(status_code=400, detail="This task is not from an email")
    
    # Get the draft text
    prepared_action = task.get("prepared_action", {})
    draft_text = prepared_action.get("draft_text")
    if not draft_text:
        raise HTTPException(status_code=400, detail="No draft text to send")
    
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
    - Loads 10 latest emails not yet analyzed
    - Loads 10 latest meetings not yet analyzed
    - Extracts action items and creates todos
    - Tracks analyzed IDs to avoid re-analysis
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
                new_todos.append(todo_doc)
                
    except Exception as e:
        logger.warning(f"Failed to fetch emails for user {user_id}: {e}")
    
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
    
    return {
        "success": True,
        "new_todos_created": len(new_todos),
        "emails_analyzed": len(new_email_ids),
        "meetings_analyzed": len(new_meeting_ids),
        "message": f"Created {len(new_todos)} new tasks from {len(new_email_ids)} emails and {len(new_meeting_ids)} meetings",
    }


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
