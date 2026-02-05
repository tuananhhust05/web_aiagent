from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel
from twilio.rest import Client
import requests
import asyncio
import aiohttp
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse
from app.models.call import (
    CallCreate,
    CallUpdate,
    CallResponse,
    KPISummary,
    CallFilters,
    CallType,
    CallStatus,
    SentimentType,
)
from app.services.ai_sales_copilot import analyze_call_against_playbook
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()

class CallUpdateByPhone(BaseModel):
    """Model for updating call by phone number (for AI/webhooks)."""

    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = None
    feedback: Optional[str] = None
    meeting_booked: Optional[bool] = None
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None
    duration: Optional[int] = None
    status: Optional[CallStatus] = None


class PlaybookRuleResult(BaseModel):
    """Single rule evaluation result for a call vs sales playbook."""

    rule_id: Optional[str] = None
    label: str
    description: Optional[str] = None
    passed: bool
    what_you_said: Optional[str] = None
    what_you_should_say: Optional[str] = None


class CallPlaybookAnalysisResponse(BaseModel):
    """Response model for call playbook analysis used by Atlas /calls."""

    call_id: str
    template_id: Optional[str] = None
    template_name: Optional[str] = None
    source: str
    generated_at: Optional[datetime] = None
    rules: List[PlaybookRuleResult] = []
    overall_score: Optional[int] = None
    coaching_summary: Optional[str] = None
    message: Optional[str] = None


@router.get("", response_model=List[CallResponse])
async def get_calls(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    phone_number: Optional[str] = Query(None),
    agent_name: Optional[str] = Query(None),
    call_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get calls with filtering options"""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    
    # Handle date filters
    if start_date and start_date.strip():
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filter_query["created_at"] = {"$gte": start_dt}
        except ValueError:
            pass
    
    if end_date and end_date.strip():
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if "created_at" in filter_query:
                filter_query["created_at"]["$lte"] = end_dt
            else:
                filter_query["created_at"] = {"$lte": end_dt}
        except ValueError:
            pass
    
    # Handle string filters
    if phone_number and phone_number.strip():
        filter_query["phone_number"] = {"$regex": phone_number.strip(), "$options": "i"}
    if agent_name and agent_name.strip():
        filter_query["agent_name"] = {"$regex": agent_name.strip(), "$options": "i"}
    
    # Handle enum filters
    if call_type and call_type.strip() and call_type.strip() in ['inbound', 'outbound']:
        filter_query["call_type"] = call_type.strip()
    if status and status.strip() and status.strip() in ['completed', 'failed', 'busy', 'no_answer', 'cancelled']:
        filter_query["status"] = status.strip()
    if sentiment and sentiment.strip() and sentiment.strip() in ['positive', 'negative', 'neutral']:
        filter_query["sentiment"] = sentiment.strip()
    
    # Handle unique calls filter
    # Get calls (removed unique_calls_only logic)
    calls = (
        await db.calls.find(filter_query)
        .sort("created_at", -1)
        .skip(offset)
        .limit(limit)
        .to_list(length=limit)
    )
    
    # Ensure each call has an id field
    calls_with_id = []
    for call in calls:
        call_dict = dict(call)
        call_dict["id"] = call_dict["_id"]  # Ensure id field is set
        calls_with_id.append(CallResponse(**call_dict))
    
    return calls_with_id

@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str, current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific call by ID"""
    db = get_database()
    
    call = await db.calls.find_one({"_id": call_id, "user_id": current_user.id})
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    return CallResponse(**call)

@router.post("", response_model=CallResponse)
async def create_call(
    call_data: CallCreate, current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new call record and optionally initiate Twilio call"""
    db = get_database()
    
    call_doc = {
        "_id": str(ObjectId()),
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        **call_data.dict()
    }
    
    # Insert call record first
    await db.calls.insert_one(call_doc)
    
    # If this is an outbound call, try to initiate AI call
    if call_data.call_type == CallType.OUTBOUND and call_data.phone_number:
        try:
            # Prepare AI call API payload
            ai_call_payload = {
                "number": call_data.phone_number,
                "prompt": settings.AI_CALL_DEFAULT_PROMPT
            }
            
            print(f"🤖 Initiating AI call to {call_data.phone_number}")
            print(f"📡 Calling AI API: {settings.AI_CALL_API_URL}")
            print(f"💬 Using prompt: {settings.AI_CALL_DEFAULT_PROMPT}")
            
            # Make async HTTP request to AI call API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    settings.AI_CALL_API_URL,
                    json=ai_call_payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 200:
                        ai_response = await response.json()
                        print(f"✅ AI call initiated successfully: {ai_response}")

                        # Update call record with success status
                        await db.calls.update_one(
                            {"_id": call_doc["_id"]},
                            {
                                "$set": {
                                    "status": CallStatus.CONNECTING,
                                    "updated_at": datetime.utcnow(),
                                }
                            },
                        )
                        call_doc["status"] = CallStatus.CONNECTING
                        call_doc["updated_at"] = datetime.utcnow()
                    else:
                        error_text = await response.text()
                        print(f"❌ AI call API error: {response.status} - {error_text}")
                        raise Exception(
                            f"AI call API returned {response.status}: {error_text}"
                        )
            
        except Exception as e:
            print(f"❌ Failed to initiate AI call: {str(e)}")
            # If AI call fails, update call status but don't fail the API
            await db.calls.update_one(
                {"_id": call_doc["_id"]},
                {
                    "$set": {
                        "status": CallStatus.FAILED,
                        "notes": f"AI call failed: {str(e)}",
                        "updated_at": datetime.utcnow(),
                    }
                },
            )
            
            # Update the call_doc for response
            call_doc["status"] = CallStatus.FAILED
            call_doc["notes"] = f"AI call failed: {str(e)}"
            call_doc["updated_at"] = datetime.utcnow()
    
    return CallResponse(**call_doc)

@router.put("/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: str,
    call_update: CallUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Update a call record"""
    db = get_database()
    
    # Check if call exists and belongs to user
    existing_call = await db.calls.find_one(
        {"_id": call_id, "user_id": current_user.id}
    )
    
    if not existing_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    for field, value in call_update.dict(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    # Update call
    await db.calls.update_one({"_id": call_id}, {"$set": update_data})
    
    # Get updated call
    updated_call = await db.calls.find_one({"_id": call_id})
    return CallResponse(**updated_call)

@router.delete("/{call_id}")
async def delete_call(
    call_id: str, current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete a call record"""
    db = get_database()
    
    result = await db.calls.delete_one({"_id": call_id, "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    return {"message": "Call deleted successfully"}

@router.put("/update-by-phone/{phone_number}", response_model=CallResponse)
async def update_call_by_phone(
    phone_number: str,
    update_data: CallUpdateByPhone,
    current_user: UserResponse = Depends(get_current_active_user),
):
    """
    Update the most recent call record for a specific phone number.
    This endpoint is designed for AI agents to update call data after processing.
    """
    db = get_database()
    
    # Find the most recent call for this phone number and user
    latest_call = await db.calls.find_one(
        {"phone_number": phone_number, "user_id": current_user.id},
        sort=[("created_at", -1)],
    )
    
    if not latest_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No call found for phone number {phone_number}"
        )
    
    # Build update data
    update_fields = {"updated_at": datetime.utcnow()}
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields[field] = value
    
    # Update the call
    await db.calls.update_one({"_id": latest_call["_id"]}, {"$set": update_fields})
    
    # Get updated call
    updated_call = await db.calls.find_one({"_id": latest_call["_id"]})
    
    return CallResponse(**updated_call)

@router.put("/auto-update/{phone_number}")
async def auto_update_call_by_phone(
    phone_number: str, update_data: CallUpdateByPhone
):
    """
    Auto update the most recent call record for a specific phone number.
    This endpoint is designed for AI agents to update call data without authentication.
    Updates duration and recording_url for the latest call with the given phone number.
    """
    db = get_database()
    
    # Find the most recent call for this phone number (any user)
    latest_call = await db.calls.find_one(
        {"phone_number": phone_number}, sort=[("created_at", -1)]
    )
    
    if not latest_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No call found for phone number {phone_number}"
        )
    
    # Build update data - focus on duration and recording_url
    update_fields = {"updated_at": datetime.utcnow()}
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields[field] = value
    
    # Update the call
    result = await db.calls.update_one(
        {"_id": latest_call["_id"]}, {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update call"
        )
    
    # Get updated call
    updated_call = await db.calls.find_one({"_id": latest_call["_id"]})
    
    return {
        "message": "Call updated successfully",
        "call_id": updated_call["_id"],
        "phone_number": phone_number,
        "updated_fields": list(update_fields.keys())
    }

@router.put("/auto-update-latest", dependencies=[])
async def auto_update_latest_call(update_data: CallUpdateByPhone):
    """
    Auto update the most recent call record in the entire calls collection.
    This endpoint is designed for AI agents to update call data without authentication.
    Automatically finds and updates the latest call record regardless of phone number.
    """
    db = get_database()
    
    # Find the most recent call in the entire collection
    latest_call = await db.calls.find_one({}, sort=[("created_at", -1)])
    
    if not latest_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calls found in the database"
        )
    
    # Build update data - focus on duration and recording_url
    update_fields = {"updated_at": datetime.utcnow()}
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields[field] = value
    
    # Update the call
    result = await db.calls.update_one(
        {"_id": latest_call["_id"]}, {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update call"
        )
    
    # Get updated call
    updated_call = await db.calls.find_one({"_id": latest_call["_id"]})
    
    return {
        "message": "Latest call updated successfully",
        "call_id": updated_call["_id"],
        "phone_number": updated_call.get("phone_number", "N/A"),
        "updated_fields": list(update_fields.keys())
    }


@router.get("/kpis/summary", response_model=KPISummary)
async def get_kpi_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get KPI summary for dashboard"""
    db = get_database()
    
    # Default to last 30 days if no date range provided
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Previous period for comparison (same duration before start_date)
    period_duration = end_date - start_date
    prev_start_date = start_date - period_duration
    prev_end_date = start_date
    
    # Current period filter
    current_filter = {
        "user_id": current_user.id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    }
    
    # Previous period filter
    prev_filter = {
        "user_id": current_user.id,
        "created_at": {"$gte": prev_start_date, "$lt": prev_end_date}
    }
    
    # Get current period data
    current_calls = await db.calls.find(current_filter).to_list(length=None)
    prev_calls = await db.calls.find(prev_filter).to_list(length=None)
    
    # Calculate current period KPIs
    total_calls = len(current_calls)
    successful_calls = len([c for c in current_calls if c["status"] == "completed"])
    call_success_rate = (successful_calls / total_calls * 100) if total_calls > 0 else 0
    
    # Calculate average duration (handle None values)
    durations = [c.get("duration", 0) for c in current_calls if c.get("duration") is not None]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    meetings_booked = len([c for c in current_calls if c.get("meeting_booked", False)])
    
    # Calculate previous period KPIs
    prev_total_calls = len(prev_calls)
    prev_successful_calls = len([c for c in prev_calls if c["status"] == "completed"])
    prev_success_rate = (prev_successful_calls / prev_total_calls * 100) if prev_total_calls > 0 else 0
    
    # Calculate previous average duration (handle None values)
    prev_durations = [c.get("duration", 0) for c in prev_calls if c.get("duration") is not None]
    prev_avg_duration = sum(prev_durations) / len(prev_durations) if prev_durations else 0
    
    prev_meetings_booked = len([c for c in prev_calls if c.get("meeting_booked", False)])
    
    # Calculate percentage changes
    total_calls_change = ((total_calls - prev_total_calls) / prev_total_calls * 100) if prev_total_calls > 0 else 0
    success_rate_change = call_success_rate - prev_success_rate
    duration_change = ((avg_duration - prev_avg_duration) / prev_avg_duration * 100) if prev_avg_duration > 0 else 0
    meetings_change = ((meetings_booked - prev_meetings_booked) / prev_meetings_booked * 100) if prev_meetings_booked > 0 else 0
    
    return KPISummary(
        total_calls=total_calls,
        call_success_rate=round(call_success_rate, 1),
        avg_call_duration=int(avg_duration),
        meetings_booked=meetings_booked,
        total_calls_change=round(total_calls_change, 1),
        success_rate_change=round(success_rate_change, 1),
        duration_change=round(duration_change, 1),
        meetings_change=round(meetings_change, 1)
    )

@router.get("/stats/sentiment")
async def get_sentiment_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: UserResponse = Depends(get_current_active_user),
):
    """Get sentiment analysis statistics"""
    db = get_database()
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    filter_query = {
        "user_id": current_user.id,
        "created_at": {"$gte": start_date, "$lte": end_date},
        "sentiment": {"$exists": True, "$ne": None},
    }
    
    pipeline = [
        {"$match": filter_query},
        {
            "$group": {
                "_id": "$sentiment",
                "count": {"$sum": 1},
                "avg_score": {"$avg": "$sentiment_score"},
            }
        },
        {"$sort": {"count": -1}},
    ]
    
    sentiment_stats = await db.calls.aggregate(pipeline).to_list(length=None)

    return {
        "sentiment_distribution": sentiment_stats,
        "total_analyzed_calls": sum(stat["count"] for stat in sentiment_stats),
    }


@router.get(
    "/{call_id}/playbook-analysis", response_model=CallPlaybookAnalysisResponse
)
async def get_call_playbook_analysis(
    call_id: str,
    force_refresh: bool = Query(
        False,
        description="If true, ignore cached analysis and re-run AI against playbook rules.",
    ),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Analyze a call transcript against the Sales Playbook template for this user.

    Used by Atlas `/atlas/calls` page when user clicks Playbook check:
    - If cached analysis exists and force_refresh is false, return it (source = cache)
    - Otherwise, ensure a playbook template exists (auto-generate default if needed),
      call the AI sales copilot, store result on the call, and return it (source = llm).
    """
    call_doc = await db.calls.find_one({"_id": call_id, "user_id": current_user.id})
    if not call_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Call not found"
        )

    transcript = call_doc.get("transcript")
    if not transcript or not str(transcript).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call has no transcript to analyze",
        )

    # 1) Return cached analysis if available and not forcing refresh
    existing = call_doc.get("playbook_analysis")
    if existing and not force_refresh:
        rules = [
            PlaybookRuleResult(
                rule_id=r.get("rule_id"),
                label=r.get("label") or "",
                description=r.get("description"),
                passed=bool(r.get("passed")),
                what_you_said=r.get("what_you_said") or None,
                what_you_should_say=r.get("what_you_should_say") or None,
            )
            for r in existing.get("rules", []) or []
        ]
        return CallPlaybookAnalysisResponse(
            call_id=call_id,
            template_id=existing.get("template_id"),
            template_name=existing.get("template_name"),
            source="cache",
            generated_at=existing.get("generated_at"),
            rules=rules,
            overall_score=existing.get("overall_score"),
            coaching_summary=existing.get("coaching_summary"),
            message=existing.get("message"),
        )

    # 2) Find or auto-create a default sales playbook template for this user
    tpl = await db.playbook_templates.find_one(
        {"user_id": current_user.id, "is_default": True}
    )
    if not tpl:
        tpl = await db.playbook_templates.find_one({"user_id": current_user.id})

    if not tpl:
        # Auto-generate a simple default playbook if user has none yet
        now = datetime.utcnow()
        default_rules = [
            {
                "id": "intro",
                "label": "Build rapport and introduce yourself clearly",
                "description": "Did you open the call with a warm greeting and a clear introduction of yourself and your company?",
            },
            {
                "id": "discovery",
                "label": "Ask discovery questions about challenges and goals",
                "description": "Did you ask specific questions to understand the prospect's current situation, pains, and objectives?",
            },
            {
                "id": "value",
                "label": "Connect product value to customer needs",
                "description": "Did you explain how your solution addresses the exact pains and goals mentioned by the prospect?",
            },
            {
                "id": "next_steps",
                "label": "Align on clear next steps",
                "description": "Did you agree on a concrete next step (e.g. follow-up meeting, sending materials, involving stakeholders)?",
            },
        ]
        doc = {
            "user_id": current_user.id,
            "name": "Default Sales Playbook",
            "rules": default_rules,
            "is_default": True,
            "created_at": now,
            "updated_at": now,
        }
        res = await db.playbook_templates.insert_one(doc)
        tpl = {**doc, "_id": res.inserted_id}

    template_id = str(tpl["_id"])
    template_name = tpl.get("name") or "Sales Playbook"
    rules_input = tpl.get("rules") or []

    # 3) Call AI sales copilot to analyze transcript vs playbook rules
    ai_result = await analyze_call_against_playbook(
        transcript=str(transcript),
        playbook_name=template_name,
        rules=rules_input,
    )

    if not ai_result:
        return CallPlaybookAnalysisResponse(
            call_id=call_id,
            template_id=template_id,
            template_name=template_name,
            source="none",
            rules=[],
            overall_score=None,
            coaching_summary=None,
            message="Playbook analysis failed. Please try again later.",
        )

    ai_rules = ai_result.get("rules") or []
    rules_out: List[PlaybookRuleResult] = []
    for r in ai_rules:
        # Make sure we always have a label
        label = r.get("label") or ""
        description = r.get("description")
        rules_out.append(
            PlaybookRuleResult(
                rule_id=r.get("rule_id"),
                label=label,
                description=description,
                passed=bool(r.get("passed")),
                what_you_said=(r.get("what_you_said") or "").strip() or None,
                what_you_should_say=(r.get("what_you_should_say") or "").strip() or None,
            )
        )

    generated_at = datetime.utcnow()
    analysis_doc = {
        "template_id": template_id,
        "template_name": template_name,
        "generated_at": generated_at,
        "rules": [
            {
                "rule_id": r.rule_id,
                "label": r.label,
                "description": r.description,
                "passed": r.passed,
                "what_you_said": r.what_you_said,
                "what_you_should_say": r.what_you_should_say,
            }
            for r in rules_out
        ],
        "overall_score": ai_result.get("overall_score"),
        "coaching_summary": ai_result.get("coaching_summary"),
    }

    # 4) Persist analysis on call document for future reuse
    await db.calls.update_one(
        {"_id": call_id},
        {
            "$set": {
                "playbook_analysis": analysis_doc,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    return CallPlaybookAnalysisResponse(
        call_id=call_id,
        template_id=template_id,
        template_name=template_name,
        source="llm",
        generated_at=generated_at,
        rules=rules_out,
        overall_score=ai_result.get("overall_score"),
        coaching_summary=ai_result.get("coaching_summary"),
        message=None,
    )


