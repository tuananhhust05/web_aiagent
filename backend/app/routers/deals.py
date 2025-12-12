from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, date, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

from ..core.database import get_database
from ..core.auth import get_current_active_user, UserResponse
from ..models.deal import (
    DealCreate, 
    DealUpdate, 
    DealResponse, 
    DealListResponse, 
    DealStats,
    DealStatus,
    DealPriority,
    PipelineResponse,
    PipelineStage,
    DealStageUpdate,
    PipelineViewResponse,
    PipelineStageView,
    DealActivityCreate,
    DealActivityResponse,
    DealActivityType
)
from ..models.pipeline import DealViewType, DEFAULT_PIPELINE_STAGES

router = APIRouter()


async def get_or_create_default_pipeline(user_id: str, db: AsyncIOMotorDatabase):
    """Get or create default pipeline for user"""
    pipeline = await db.pipelines.find_one({
        "user_id": user_id,
        "is_default": True
    })
    
    if not pipeline:
        now = datetime.utcnow()
        stages = [
            {"id": str(uuid.uuid4()), **stage}
            for stage in DEFAULT_PIPELINE_STAGES
        ]
        
        pipeline_doc = {
            "user_id": user_id,
            "name": "Sales Pipeline",
            "description": "Default sales pipeline",
            "business_type": "general",
            "is_default": True,
            "is_active": True,
            "stages": stages,
            "created_at": now,
            "updated_at": now
        }
        
        result = await db.pipelines.insert_one(pipeline_doc)
        pipeline = await db.pipelines.find_one({"_id": result.inserted_id})
    
    return pipeline


async def populate_deal(deal: dict, db: AsyncIOMotorDatabase, pipeline_map: dict = None) -> DealResponse:
    """Populate deal with related data"""
    
    # Get contact info
    contact_name = "Unknown"
    contact_email = ""
    contact_phone = ""
    
    try:
        contact = await db.contacts.find_one({"_id": deal["contact_id"]})
        if contact:
            contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
            contact_email = contact.get("email", "")
            contact_phone = contact.get("phone", "")
    except:
        pass
    
    # Get campaign info
    campaign_name = None
    if deal.get("campaign_id"):
        try:
            campaign = await db.campaigns.find_one({"_id": deal["campaign_id"]})
            campaign_name = campaign.get("name", "Unknown") if campaign else None
        except:
            pass
    
    # Get pipeline info
    pipeline_name = None
    stage_name = None
    probability = deal.get("probability")
    
    if deal.get("pipeline_id") and pipeline_map:
        pipeline = pipeline_map.get(deal["pipeline_id"])
        if pipeline:
            pipeline_name = pipeline.get("name")
            stages = {s.get("id", s["name"].lower().replace(" ", "_")): s for s in pipeline.get("stages", [])}
            stage_id = deal.get("stage_id") or deal.get("status", "lead")
            if stage_id in stages:
                stage_name = stages[stage_id]["name"]
                if probability is None:
                    probability = stages[stage_id].get("probability", 0)
    
    # Get owner info
    owner_name = None
    if deal.get("owner_id"):
        try:
            owner = await db.users.find_one({"_id": ObjectId(deal["owner_id"])})
            if owner:
                owner_name = f"{owner.get('first_name', '')} {owner.get('last_name', '')}".strip() or owner.get("username")
        except:
            pass
    
    # Calculate weighted value
    deal_value = deal.get("amount", deal.get("revenue", 0.0))
    weighted_value = deal_value * ((probability or 0) / 100)
    
    # Calculate days in stage
    now = datetime.utcnow()
    stage_entered = deal.get("stage_entered_at", deal.get("updated_at"))
    days_in_stage = 0
    if stage_entered:
        if isinstance(stage_entered, str):
            stage_entered = datetime.fromisoformat(stage_entered.replace('Z', '+00:00'))
        days_in_stage = (now - stage_entered).days
    
    # Calculate if stalled
    stalled_threshold = now - timedelta(days=14)
    last_activity = deal.get("last_activity_date")
    is_stalled = False
    if last_activity:
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
        is_stalled = last_activity < stalled_threshold
    elif deal.get("status") not in ["closed_won", "closed_lost"]:
        is_stalled = True
    
    return DealResponse(
        id=str(deal["_id"]),
        name=deal["name"],
        description=deal.get("description"),
        contact_id=deal["contact_id"],
        company_id=deal.get("company_id"),
        campaign_id=deal.get("campaign_id"),
        pipeline_id=deal.get("pipeline_id"),
        stage_id=deal.get("stage_id"),
        status=deal.get("status", "lead"),
        priority=deal.get("priority", "medium"),
        amount=deal_value,
        cost=deal.get("cost", 0.0),
        revenue=deal.get("revenue", deal_value),
        probability=probability,
        expected_close_date=deal.get("expected_close_date"),
        actual_close_date=deal.get("actual_close_date"),
        start_date=deal.get("start_date"),
        end_date=deal.get("end_date"),
        last_activity_date=deal.get("last_activity_date"),
        loss_reason=deal.get("loss_reason"),
        win_reason=deal.get("win_reason"),
        next_step=deal.get("next_step"),
        owner_id=deal.get("owner_id"),
        custom_properties=deal.get("custom_properties", {}),
        created_at=deal["created_at"],
        updated_at=deal["updated_at"],
        weighted_value=weighted_value,
        days_in_stage=days_in_stage,
        is_stalled=is_stalled,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        campaign_name=campaign_name,
        pipeline_name=pipeline_name,
        stage_name=stage_name,
        owner_name=owner_name
    )


@router.get("/all", response_model=DealListResponse)
async def get_deals(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[DealStatus] = Query(None, description="Filter by status"),
    pipeline_id: Optional[str] = Query(None, description="Filter by pipeline"),
    view_type: Optional[DealViewType] = Query(None, description="Filter view type"),
    priority: Optional[DealPriority] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deals with pagination, filtering and statistics"""
    
    # Build filter
    filter_query = {"user_id": current_user.id}
    
    if status:
        filter_query["status"] = status.value
    
    if pipeline_id:
        filter_query["pipeline_id"] = pipeline_id
    
    if priority:
        filter_query["priority"] = priority.value
    
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Apply view type filters
    now = datetime.utcnow()
    stalled_threshold = now - timedelta(days=14)
    
    if view_type == DealViewType.OPEN:
        filter_query["status"] = {"$nin": ["closed_won", "closed_lost"]}
    elif view_type == DealViewType.CLOSED_WON:
        filter_query["status"] = "closed_won"
    elif view_type == DealViewType.CLOSED_LOST:
        filter_query["status"] = "closed_lost"
    elif view_type == DealViewType.STALLED:
        filter_query["status"] = {"$nin": ["closed_won", "closed_lost"]}
        filter_query["$or"] = [
            {"last_activity_date": {"$lt": stalled_threshold}},
            {"last_activity_date": {"$exists": False}}
        ]
    elif view_type == DealViewType.NO_ACTIVITY:
        filter_query["last_activity_date"] = {"$exists": False}
    elif view_type == DealViewType.CLOSING_THIS_MONTH:
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            month_end = now.replace(year=now.year + 1, month=1, day=1)
        else:
            month_end = now.replace(month=now.month + 1, day=1)
        filter_query["expected_close_date"] = {"$gte": month_start, "$lt": month_end}
    elif view_type == DealViewType.CLOSING_THIS_QUARTER:
        quarter = (now.month - 1) // 3
        quarter_start = now.replace(month=quarter * 3 + 1, day=1)
        next_quarter = quarter + 1
        if next_quarter > 3:
            quarter_end = now.replace(year=now.year + 1, month=1, day=1)
        else:
            quarter_end = now.replace(month=next_quarter * 3 + 1, day=1)
        filter_query["expected_close_date"] = {"$gte": quarter_start, "$lt": quarter_end}
    
    # Get total count
    total = await db.deals.count_documents(filter_query)
    
    # Get deals with pagination
    skip = (page - 1) * limit
    deals_cursor = db.deals.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    deals = await deals_cursor.to_list(length=limit)
    
    # Get pipelines for populating
    pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
    pipeline_map = {str(p["_id"]): p for p in pipelines}
    
    # Populate deals
    populated_deals = []
    for deal in deals:
        populated_deal = await populate_deal(deal, db, pipeline_map)
        populated_deals.append(populated_deal)
    
    # Calculate statistics
    stats_pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": None,
                "total_deals": {"$sum": 1},
                "total_revenue": {"$sum": {"$ifNull": ["$revenue", "$amount"]}},
                "total_cost": {"$sum": "$cost"},
                "total_value": {"$sum": {"$ifNull": ["$amount", "$revenue"]}},
                "open_deals": {
                    "$sum": {"$cond": [{"$not": {"$in": ["$status", ["closed_won", "closed_lost"]]}}, 1, 0]}
                },
                "won_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "closed_won"]}, 1, 0]}
                },
                "lost_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "closed_lost"]}, 1, 0]}
                },
                "new_deals": {
                    "$sum": {"$cond": [{"$in": ["$status", ["new", "lead"]]}, 1, 0]}
                },
                "contacted_deals": {
                    "$sum": {"$cond": [{"$in": ["$status", ["contacted", "qualified"]]}, 1, 0]}
                },
                "negotiation_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "negotiation"]}, 1, 0]}
                }
            }
        }
    ]
    
    stats_result = await db.deals.aggregate(stats_pipeline).to_list(1)
    stats_data = stats_result[0] if stats_result else {
        "total_deals": 0,
        "total_revenue": 0.0,
        "total_cost": 0.0,
        "total_value": 0.0,
        "open_deals": 0,
        "won_deals": 0,
        "lost_deals": 0,
        "new_deals": 0,
        "contacted_deals": 0,
        "negotiation_deals": 0
    }
    
    stats_data["total_profit"] = stats_data["total_revenue"] - stats_data["total_cost"]
    
    # Calculate win rate and weighted value
    closed_deals = stats_data["won_deals"] + stats_data["lost_deals"]
    stats_data["win_rate"] = (stats_data["won_deals"] / closed_deals * 100) if closed_deals > 0 else 0
    stats_data["avg_deal_value"] = stats_data["total_value"] / stats_data["total_deals"] if stats_data["total_deals"] > 0 else 0
    stats_data["weighted_value"] = 0  # Would need to calculate based on probabilities
    stats_data["avg_days_to_close"] = 0  # Would need historical data
    stats_data["stalled_deals"] = 0  # Would need to query
    
    return DealListResponse(
        deals=populated_deals,
        total=total,
        page=page,
        limit=limit,
        stats=DealStats(**stats_data)
    )


@router.get("/stats", response_model=DealStats)
async def get_deal_stats(
    pipeline_id: Optional[str] = Query(None, description="Filter by pipeline"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deal statistics"""
    
    match_query = {"user_id": current_user.id}
    if pipeline_id:
        match_query["pipeline_id"] = pipeline_id
    
    stats_pipeline = [
        {"$match": match_query},
        {
            "$group": {
                "_id": None,
                "total_deals": {"$sum": 1},
                "total_revenue": {"$sum": {"$ifNull": ["$revenue", "$amount"]}},
                "total_cost": {"$sum": "$cost"},
                "total_value": {"$sum": {"$ifNull": ["$amount", "$revenue"]}},
                "open_deals": {
                    "$sum": {"$cond": [{"$not": {"$in": ["$status", ["closed_won", "closed_lost"]]}}, 1, 0]}
                },
                "won_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "closed_won"]}, 1, 0]}
                },
                "lost_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "closed_lost"]}, 1, 0]}
                },
                "new_deals": {
                    "$sum": {"$cond": [{"$in": ["$status", ["new", "lead"]]}, 1, 0]}
                },
                "contacted_deals": {
                    "$sum": {"$cond": [{"$in": ["$status", ["contacted", "qualified"]]}, 1, 0]}
                },
                "negotiation_deals": {
                    "$sum": {"$cond": [{"$eq": ["$status", "negotiation"]}, 1, 0]}
                }
            }
        }
    ]
    
    stats_result = await db.deals.aggregate(stats_pipeline).to_list(1)
    stats = stats_result[0] if stats_result else {
        "total_deals": 0,
        "total_revenue": 0.0,
        "total_cost": 0.0,
        "total_value": 0.0,
        "open_deals": 0,
        "won_deals": 0,
        "lost_deals": 0,
        "new_deals": 0,
        "contacted_deals": 0,
        "negotiation_deals": 0
    }
    
    stats["total_profit"] = stats["total_revenue"] - stats["total_cost"]
    
    closed_deals = stats["won_deals"] + stats["lost_deals"]
    stats["win_rate"] = (stats["won_deals"] / closed_deals * 100) if closed_deals > 0 else 0
    stats["avg_deal_value"] = stats["total_value"] / stats["total_deals"] if stats["total_deals"] > 0 else 0
    stats["weighted_value"] = 0
    stats["avg_days_to_close"] = 0
    stats["stalled_deals"] = 0
    
    return DealStats(**stats)


@router.get("/pipeline/view", response_model=PipelineResponse)
async def get_pipeline_view(
    pipeline_id: Optional[str] = Query(None, description="Pipeline ID (uses default if not provided)"),
    view_type: DealViewType = Query(DealViewType.ALL, description="Filter view type"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deals organized by pipeline stages for Kanban view"""
    
    # Get pipeline
    if pipeline_id:
        if not ObjectId.is_valid(pipeline_id):
            raise HTTPException(status_code=400, detail="Invalid pipeline ID")
        pipeline = await db.pipelines.find_one({
            "_id": ObjectId(pipeline_id),
            "user_id": current_user.id
        })
    else:
        pipeline = await get_or_create_default_pipeline(current_user.id, db)
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Get stages from pipeline
    stages = pipeline.get("stages", [])
    if not stages:
        stages = DEFAULT_PIPELINE_STAGES
    
    # Build filter based on view type
    filter_query = {"user_id": current_user.id}
    
    now = datetime.utcnow()
    stalled_threshold = now - timedelta(days=14)
    
    if view_type == DealViewType.OPEN:
        filter_query["status"] = {"$nin": ["closed_won", "closed_lost"]}
    elif view_type == DealViewType.CLOSED_WON:
        filter_query["status"] = "closed_won"
    elif view_type == DealViewType.CLOSED_LOST:
        filter_query["status"] = "closed_lost"
    elif view_type == DealViewType.STALLED:
        filter_query["status"] = {"$nin": ["closed_won", "closed_lost"]}
        filter_query["$or"] = [
            {"last_activity_date": {"$lt": stalled_threshold}},
            {"last_activity_date": {"$exists": False}}
        ]
    elif view_type == DealViewType.NO_ACTIVITY:
        filter_query["last_activity_date"] = {"$exists": False}
    
    # Get all deals for user
    deals_cursor = db.deals.find(filter_query).sort("updated_at", -1)
    all_deals = await deals_cursor.to_list(length=None)
    
    # Create stage map
    stage_map = {}
    status_to_stage = {}
    for stage in stages:
        stage_id = stage.get("id", stage["name"].lower().replace(" ", "_").replace("/", "_"))
        stage_map[stage_id] = stage
        # Map common status names
        status_name = stage["name"].lower().replace(" ", "_").replace("/", "_")
        status_to_stage[status_name] = stage_id
    
    # Map legacy statuses
    status_to_stage["new"] = status_to_stage.get("lead", list(stage_map.keys())[0] if stage_map else "lead")
    status_to_stage["contacted"] = status_to_stage.get("qualified", status_to_stage.get("demo_meeting", list(stage_map.keys())[1] if len(stage_map) > 1 else "qualified"))
    
    # Initialize stages data
    stages_data = {stage.get("id", stage["name"].lower().replace(" ", "_").replace("/", "_")): [] for stage in stages}
    total_value = 0.0
    
    # Get pipelines for populating
    pipeline_map = {str(pipeline["_id"]): pipeline}
    
    for deal in all_deals:
        populated_deal = await populate_deal(deal, db, pipeline_map)
        
        # Determine which stage to put the deal in
        stage_id = deal.get("stage_id") or deal.get("status", "lead")
        
        # Try to find the stage
        target_stage = None
        if stage_id in stages_data:
            target_stage = stage_id
        elif stage_id in status_to_stage and status_to_stage[stage_id] in stages_data:
            target_stage = status_to_stage[stage_id]
        else:
            # Default to first stage
            target_stage = list(stages_data.keys())[0] if stages_data else None
        
        if target_stage and target_stage in stages_data:
            stages_data[target_stage].append(populated_deal)
        
        total_value += deal.get("amount", deal.get("revenue", 0.0))
    
    # Build response
    response_stages = []
    for stage in stages:
        stage_id = stage.get("id", stage["name"].lower().replace(" ", "_").replace("/", "_"))
        stage_deals = stages_data.get(stage_id, [])
        stage_value = sum(d.amount for d in stage_deals)
        response_stages.append(PipelineStage(
            id=stage_id,
            name=stage["name"],
            deals=stage_deals,
            total_value=stage_value,
            count=len(stage_deals)
        ))
    
    return PipelineResponse(
        stages=response_stages,
        total_deals=len(all_deals),
        total_value=total_value
    )


@router.patch("/{deal_id}/stage", response_model=DealResponse)
async def update_deal_stage(
    deal_id: str,
    stage_data: DealStageUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update deal stage (for drag and drop in pipeline)"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    # Check if deal exists
    deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    now = datetime.utcnow()
    
    # Determine stage value - support both stage_id (UUID) and stage (enum)
    stage_value = None
    stage_id_to_save = None
    
    if stage_data.stage_id:
        # If stage_id (UUID) is provided, find the stage name from pipeline
        # Try pipeline_id from request first, then from deal, then search all pipelines
        pipeline_id_to_search = stage_data.pipeline_id or deal.get("pipeline_id")
        
        if pipeline_id_to_search:
            # Search in specific pipeline
            pipeline = await db.pipelines.find_one({
                "_id": ObjectId(pipeline_id_to_search),
                "user_id": current_user.id
            })
            if pipeline:
                stages = pipeline.get("stages", [])
                for stage in stages:
                    if stage.get("id") == stage_data.stage_id:
                        # Map stage name to DealStatus enum
                        stage_name = stage.get("name", "").lower().replace(" ", "_").replace("/", "_")
                        # Try to map to DealStatus
                        stage_mapping = {
                            "lead": "lead",
                            "qualified": "qualified",
                            "demo": "demo",
                            "demo/meeting": "demo",
                            "proposal": "proposal",
                            "proposal_sent": "proposal",
                            "negotiation": "negotiation",
                            "closed_won": "closed_won",
                            "closed_lost": "closed_lost",
                            "new": "new",
                            "contacted": "contacted"
                        }
                        stage_value = stage_mapping.get(stage_name, "lead")
                        stage_id_to_save = stage_data.stage_id
                        break
        
        # If not found, search in all pipelines of the user
        if not stage_value:
            pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
            for pipeline in pipelines:
                stages = pipeline.get("stages", [])
                for stage in stages:
                    if stage.get("id") == stage_data.stage_id:
                        # Map stage name to DealStatus enum
                        stage_name = stage.get("name", "").lower().replace(" ", "_").replace("/", "_")
                        stage_mapping = {
                            "lead": "lead",
                            "qualified": "qualified",
                            "demo": "demo",
                            "demo/meeting": "demo",
                            "proposal": "proposal",
                            "proposal_sent": "proposal",
                            "negotiation": "negotiation",
                            "closed_won": "closed_won",
                            "closed_lost": "closed_lost",
                            "new": "new",
                            "contacted": "contacted"
                        }
                        stage_value = stage_mapping.get(stage_name, "lead")
                        stage_id_to_save = stage_data.stage_id
                        # Update deal's pipeline_id if it was missing
                        if not deal.get("pipeline_id"):
                            update_data["pipeline_id"] = str(pipeline["_id"])
                        break
                if stage_value:
                    break
        
        if not stage_value:
            raise HTTPException(status_code=400, detail=f"Stage ID {stage_data.stage_id} not found in any pipeline")
    elif stage_data.stage:
        # If stage enum is provided, use it directly
        stage_value = stage_data.stage.value
        stage_id_to_save = stage_value
    else:
        raise HTTPException(status_code=400, detail="Either 'stage' or 'stage_id' must be provided")
    
    # Update the stage
    update_data = {
        "status": stage_value,
        "stage_id": stage_id_to_save,
        "stage_entered_at": now,
        "updated_at": now,
        "last_activity_date": now
    }
    
    # If moving to closed_won or closed_lost, set actual close date
    if stage_value in ["closed_won", "closed_lost"]:
        update_data["actual_close_date"] = now.date()
    
    await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": update_data}
    )
    
    # Log the stage change activity
    activity_doc = {
        "deal_id": deal_id,
        "user_id": current_user.id,
        "activity_type": "stage_change",
        "subject": f"Stage changed to {stage_value}",
        "content": f"Deal moved from {deal.get('status', 'unknown')} to {stage_value}",
        "is_completed": True,
        "completed_at": now,
        "created_at": now,
        "created_by": current_user.id
    }
    await db.deal_activities.insert_one(activity_doc)
    
    # Get updated deal
    updated_deal = await db.deals.find_one({"_id": ObjectId(deal_id)})
    
    # Get pipeline for populating
    pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
    pipeline_map = {str(p["_id"]): p for p in pipelines}
    
    return await populate_deal(updated_deal, db, pipeline_map)


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get deal by ID"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Get pipelines for populating
    pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
    pipeline_map = {str(p["_id"]): p for p in pipelines}
    
    return await populate_deal(deal, db, pipeline_map)


@router.post("/create", response_model=DealResponse)
async def create_deal(
    deal_data: DealCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new deal"""
    
    # Validate contact exists
    contact = await db.contacts.find_one({
        "_id": deal_data.contact_id,
        "user_id": current_user.id
    })
    
    if not contact:
        # Try without user_id for legacy contacts
        contact = await db.contacts.find_one({"_id": deal_data.contact_id})
    
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Validate campaign exists if provided
    if deal_data.campaign_id:
        if not ObjectId.is_valid(deal_data.campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")
        
        campaign = await db.campaigns.find_one({
            "_id": ObjectId(deal_data.campaign_id),
            "user_id": current_user.id
        })
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get or create default pipeline if not specified
    pipeline_id = deal_data.pipeline_id
    if not pipeline_id:
        pipeline = await get_or_create_default_pipeline(current_user.id, db)
        pipeline_id = str(pipeline["_id"])
    
    # Map stage_id (UUID) to status if stage_id provided
    # Handle status - if it's a valid enum, use it; otherwise ignore and map from stage_id
    mapped_status = None
    if deal_data.status:
        try:
            if isinstance(deal_data.status, Enum):
                mapped_status = deal_data.status.value
            elif isinstance(deal_data.status, str):
                # Check if it's a valid enum value
                from ..models.deal import DealStatus
                try:
                    DealStatus(deal_data.status)
                    mapped_status = deal_data.status
                except (ValueError, TypeError):
                    # If status is not a valid enum (e.g., UUID), ignore it
                    mapped_status = None
        except:
            mapped_status = None
    
    if deal_data.stage_id:
        # Try the specified pipeline first, then fallback to all pipelines of the user
        pipelines_to_search = []
        if pipeline_id:
            pipelines_to_search.append(pipeline_id)
        user_pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
        for p in user_pipelines:
            pid = str(p["_id"])
            if pid not in pipelines_to_search:
                pipelines_to_search.append(pid)
        stage_found = False
        for pid in pipelines_to_search:
            pipeline_doc = next((p for p in user_pipelines if str(p["_id"]) == pid), None)
            if not pipeline_doc:
                pipeline_doc = await db.pipelines.find_one({"_id": ObjectId(pid), "user_id": current_user.id})
            if not pipeline_doc:
                continue
            for stage in pipeline_doc.get("stages", []):
                if stage.get("id") == deal_data.stage_id:
                    stage_name = stage.get("name", "").lower().replace(" ", "_").replace("/", "_")
                    stage_mapping = {
                        "lead": "lead",
                        "qualified": "qualified",
                        "demo": "demo",
                        "demo/meeting": "demo",
                        "proposal": "proposal",
                        "proposal_sent": "proposal",
                        "negotiation": "negotiation",
                        "closed_won": "closed_won",
                        "closed_lost": "closed_lost",
                        "new": "new",
                        "contacted": "contacted"
                    }
                    mapped_status = stage_mapping.get(stage_name, "lead")
                    stage_found = True
                    # If pipeline_id was not provided, set it to the pipeline that contains the stage
                    if not deal_data.pipeline_id:
                        pipeline_id = pid
                    break
            if stage_found:
                break

    # Create deal
    now = datetime.utcnow()
    deal_dict = deal_data.dict(exclude_unset=True)
    
    # Convert date fields to datetime for MongoDB compatibility
    for field in ["start_date", "end_date", "expected_close_date", "actual_close_date"]:
        if deal_dict.get(field) and isinstance(deal_dict[field], date):
            deal_dict[field] = datetime.combine(deal_dict[field], datetime.min.time())
    
    # Set status and stage_id - use mapped_status if available, otherwise default to "lead"
    if mapped_status:
        deal_dict["status"] = mapped_status
    else:
        deal_dict["status"] = "lead"
    
    # Set stage_id - use provided stage_id or default to status
    if not deal_dict.get("stage_id"):
        deal_dict["stage_id"] = deal_dict.get("status", "lead")
    
    deal_doc = {
        **deal_dict,
        "user_id": current_user.id,
        "pipeline_id": pipeline_id,
        "owner_id": current_user.id,
        "stage_entered_at": now,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.deals.insert_one(deal_doc)
    deal_doc["_id"] = result.inserted_id
    
    # Get pipelines for populating
    pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
    pipeline_map = {str(p["_id"]): p for p in pipelines}
    
    return await populate_deal(deal_doc, db, pipeline_map)


@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str,
    deal_data: DealUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    # Check if deal exists
    existing_deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not existing_deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Validate contact if provided
    if deal_data.contact_id:
        contact = await db.contacts.find_one({"_id": deal_data.contact_id})
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
    
    # Validate campaign if provided
    if deal_data.campaign_id:
        if not ObjectId.is_valid(deal_data.campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID")
        
        campaign = await db.campaigns.find_one({
            "_id": ObjectId(deal_data.campaign_id),
            "user_id": current_user.id
        })
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Prepare update data
    now = datetime.utcnow()
    update_data = {k: v for k, v in deal_data.dict().items() if v is not None}
    
    # Convert date fields
    for field in ["start_date", "end_date", "expected_close_date", "actual_close_date"]:
        if update_data.get(field) and isinstance(update_data[field], date):
            update_data[field] = datetime.combine(update_data[field], datetime.min.time())
    
    # Check if stage changed
    old_status = existing_deal.get("status")
    new_status = update_data.get("status")
    
    if new_status and new_status != old_status:
        update_data["stage_entered_at"] = now
        update_data["stage_id"] = new_status if isinstance(new_status, str) else new_status.value
        
        # Log stage change
        activity_doc = {
            "deal_id": deal_id,
            "user_id": current_user.id,
            "activity_type": "stage_change",
            "subject": f"Stage changed to {new_status}",
            "content": f"Deal moved from {old_status} to {new_status}",
            "is_completed": True,
            "completed_at": now,
            "created_at": now,
            "created_by": current_user.id
        }
        await db.deal_activities.insert_one(activity_doc)
    
    update_data["updated_at"] = now
    update_data["last_activity_date"] = now
    
    await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": update_data}
    )
    
    # Get updated deal
    updated_deal = await db.deals.find_one({"_id": ObjectId(deal_id)})
    
    # Get pipelines for populating
    pipelines = await db.pipelines.find({"user_id": current_user.id}).to_list(length=None)
    pipeline_map = {str(p["_id"]): p for p in pipelines}
    
    return await populate_deal(updated_deal, db, pipeline_map)


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    result = await db.deals.delete_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Also delete related activities
    await db.deal_activities.delete_many({"deal_id": deal_id})
    
    return {"message": "Deal deleted successfully"}


# Deal Activities
@router.get("/{deal_id}/activities", response_model=List[DealActivityResponse])
async def get_deal_activities(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get activities for a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    # Verify deal exists and belongs to user
    deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    activities_cursor = db.deal_activities.find({"deal_id": deal_id}).sort("created_at", -1)
    activities = await activities_cursor.to_list(length=100)
    
    result = []
    for activity in activities:
        # Get creator name
        created_by_name = None
        if activity.get("created_by"):
            try:
                creator = await db.users.find_one({"_id": ObjectId(activity["created_by"])})
                if creator:
                    created_by_name = f"{creator.get('first_name', '')} {creator.get('last_name', '')}".strip() or creator.get("username")
            except:
                pass
        
        result.append(DealActivityResponse(
            id=str(activity["_id"]),
            deal_id=activity["deal_id"],
            activity_type=activity["activity_type"],
            subject=activity.get("subject"),
            content=activity.get("content"),
            scheduled_at=activity.get("scheduled_at"),
            completed_at=activity.get("completed_at"),
            is_completed=activity.get("is_completed", False),
            created_at=activity["created_at"],
            created_by=activity.get("created_by"),
            created_by_name=created_by_name
        ))
    
    return result


@router.post("/{deal_id}/activities", response_model=DealActivityResponse)
async def create_deal_activity(
    deal_id: str,
    activity_data: DealActivityCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create an activity for a deal"""
    
    if not ObjectId.is_valid(deal_id):
        raise HTTPException(status_code=400, detail="Invalid deal ID")
    
    # Verify deal exists and belongs to user
    deal = await db.deals.find_one({
        "_id": ObjectId(deal_id),
        "user_id": current_user.id
    })
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    now = datetime.utcnow()
    
    activity_doc = {
        **activity_data.dict(),
        "deal_id": deal_id,
        "created_at": now,
        "created_by": current_user.id
    }
    
    result = await db.deal_activities.insert_one(activity_doc)
    
    # Update deal's last activity date
    await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": {"last_activity_date": now, "updated_at": now}}
    )
    
    return DealActivityResponse(
        id=str(result.inserted_id),
        deal_id=deal_id,
        activity_type=activity_data.activity_type,
        subject=activity_data.subject,
        content=activity_data.content,
        scheduled_at=activity_data.scheduled_at,
        completed_at=activity_data.completed_at,
        is_completed=activity_data.is_completed,
        created_at=now,
        created_by=current_user.id,
        created_by_name=f"{current_user.first_name} {current_user.last_name}".strip() if hasattr(current_user, 'first_name') else None
    )


@router.get("/contacts/list")
async def get_contacts_for_deals(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get contacts list for deal creation"""
    
    contacts_cursor = db.contacts.find(
        {"user_id": current_user.id},
        {"name": 1, "email": 1, "phone": 1, "first_name": 1, "last_name": 1}
    ).sort("name", 1)
    
    contacts = await contacts_cursor.to_list(length=None)
    
    return [
        {
            "id": str(contact["_id"]),
            "name": f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown",
            "email": contact.get("email", ""),
            "phone": contact.get("phone", "")
        }
        for contact in contacts
    ]


@router.get("/campaigns/list")
async def get_campaigns_for_deals(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get campaigns list for deal creation"""
    
    campaigns_cursor = db.campaigns.find(
        {"user_id": current_user.id},
        {"name": 1, "status": 1}
    ).sort("name", 1)
    
    campaigns = await campaigns_cursor.to_list(length=None)
    
    return [
        {
            "id": str(campaign["_id"]),
            "name": campaign.get("name", "Unknown"),
            "status": campaign.get("status", "draft")
        }
        for campaign in campaigns
    ]
