from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
import logging

# Setup logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

from ..core.database import get_database
from ..core.auth import get_current_active_user, UserResponse
from ..models.pipeline import (
    PipelineCreate,
    PipelineUpdate,
    PipelineResponse,
    PipelineListResponse,
    PipelineStageResponse,
    PipelineForecast,
    PipelineAnalytics,
    StageConversionRate,
    DealViewType,
    DEFAULT_PIPELINE_STAGES,
    PipelineLeadViewResponse,
    PipelineLeadStageView,
    PipelineLead,
    PipelineLeadStageUpdate
)
from ..models.deal import (
    DealResponse,
    PipelineViewResponse,
    PipelineStageView,
    DealStatus
)

router = APIRouter()
print("🔧 [PIPELINES] Router initialized - pipelines.py loaded successfully")


@router.get("/test")
async def get_pipelines(
    include_inactive: bool = Query(False, description="Include inactive pipelines"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all pipelines for the current user/company"""
    logger.info(f"📊 [PIPELINES] GET /api/pipelines called by user: {current_user.id}")
    print(f"📊 [PIPELINES] GET /api/pipelines called by user: {current_user.id}")
    
    filter_query = {"user_id": current_user.id}
    if not include_inactive:
        filter_query["is_active"] = True
    
    pipelines_cursor = db.pipelines.find(filter_query).sort("created_at", -1)
    pipelines = await pipelines_cursor.to_list(length=None)
    
    result = []
    for pipeline in pipelines:
        # Count deals in this pipeline
        deal_count = await db.deals.count_documents({
            "user_id": current_user.id,
            "pipeline_id": str(pipeline["_id"])
        })
        
        result.append(PipelineResponse(
            id=str(pipeline["_id"]),
            name=pipeline["name"],
            description=pipeline.get("description"),
            business_type=pipeline.get("business_type", "general"),
            is_default=pipeline.get("is_default", False),
            is_active=pipeline.get("is_active", True),
            stages=[
                PipelineStageResponse(
                    id=stage.get("id", str(uuid.uuid4())),
                    name=stage["name"],
                    probability=stage.get("probability", 0),
                    order=stage.get("order", i),
                    color=stage.get("color", "#3B82F6"),
                    description=stage.get("description"),
                    required_properties=stage.get("required_properties", [])
                )
                for i, stage in enumerate(pipeline.get("stages", []))
            ],
            created_at=pipeline["created_at"],
            updated_at=pipeline["updated_at"],
            deal_count=deal_count
        ))
    
    return PipelineListResponse(pipelines=result, total=len(result))



@router.get("/get_pipelines", response_model=PipelineListResponse)
async def get_pipelines(
    include_inactive: bool = Query(False, description="Include inactive pipelines"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get all pipelines for the current user/company"""
    logger.info(f"📊 [PIPELINES] GET /api/pipelines called by user: {current_user.id}")
    print(f"📊 [PIPELINES] GET /api/pipelines called by user: {current_user.id}")
    
    filter_query = {"user_id": current_user.id}
    if not include_inactive:
        filter_query["is_active"] = True
    
    pipelines_cursor = db.pipelines.find(filter_query).sort("created_at", -1)
    pipelines = await pipelines_cursor.to_list(length=None)
    
    result = []
    for pipeline in pipelines:
        # Count deals in this pipeline
        deal_count = await db.deals.count_documents({
            "user_id": current_user.id,
            "pipeline_id": str(pipeline["_id"])
        })
        
        result.append(PipelineResponse(
            id=str(pipeline["_id"]),
            name=pipeline["name"],
            description=pipeline.get("description"),
            business_type=pipeline.get("business_type", "general"),
            is_default=pipeline.get("is_default", False),
            is_active=pipeline.get("is_active", True),
            stages=[
                PipelineStageResponse(
                    id=stage.get("id", str(uuid.uuid4())),
                    name=stage["name"],
                    probability=stage.get("probability", 0),
                    order=stage.get("order", i),
                    color=stage.get("color", "#3B82F6"),
                    description=stage.get("description"),
                    required_properties=stage.get("required_properties", [])
                )
                for i, stage in enumerate(pipeline.get("stages", []))
            ],
            created_at=pipeline["created_at"],
            updated_at=pipeline["updated_at"],
            deal_count=deal_count
        ))
    
    return PipelineListResponse(pipelines=result, total=len(result))


@router.get("/default", response_model=PipelineResponse)
async def get_or_create_default_pipeline(
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get or create the default pipeline for the user"""
    
    # Try to find existing default pipeline
    pipeline = await db.pipelines.find_one({
        "user_id": current_user.id,
        "is_default": True
    })
    
    if not pipeline:
        # Create default pipeline
        now = datetime.utcnow()
        stages = [
            {
                "id": str(uuid.uuid4()),
                **stage
            }
            for stage in DEFAULT_PIPELINE_STAGES
        ]
        
        pipeline_doc = {
            "user_id": current_user.id,
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
    
    deal_count = await db.deals.count_documents({
        "user_id": current_user.id,
        "pipeline_id": str(pipeline["_id"])
    })
    
    return PipelineResponse(
        id=str(pipeline["_id"]),
        name=pipeline["name"],
        description=pipeline.get("description"),
        business_type=pipeline.get("business_type", "general"),
        is_default=pipeline.get("is_default", False),
        is_active=pipeline.get("is_active", True),
        stages=[
            PipelineStageResponse(
                id=stage.get("id", str(uuid.uuid4())),
                name=stage["name"],
                probability=stage.get("probability", 0),
                order=stage.get("order", i),
                color=stage.get("color", "#3B82F6"),
                description=stage.get("description"),
                required_properties=stage.get("required_properties", [])
            )
            for i, stage in enumerate(pipeline.get("stages", []))
        ],
        created_at=pipeline["created_at"],
        updated_at=pipeline["updated_at"],
        deal_count=deal_count
    )


@router.post("/create", response_model=PipelineResponse)
async def create_pipeline(
    pipeline_data: PipelineCreate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new pipeline"""
    
    # If this is set as default, unset other defaults
    if pipeline_data.is_default:
        await db.pipelines.update_many(
            {"user_id": current_user.id, "is_default": True},
            {"$set": {"is_default": False}}
        )
    
    now = datetime.utcnow()
    stages = [
        {
            "id": str(uuid.uuid4()),
            **stage.dict()
        }
        for stage in pipeline_data.stages
    ] if pipeline_data.stages else [
        {"id": str(uuid.uuid4()), **stage}
        for stage in DEFAULT_PIPELINE_STAGES
    ]
    
    pipeline_doc = {
        "user_id": current_user.id,
        "name": pipeline_data.name,
        "description": pipeline_data.description,
        "business_type": pipeline_data.business_type,
        "is_default": pipeline_data.is_default,
        "is_active": pipeline_data.is_active,
        "stages": stages,
        "created_at": now,
        "updated_at": now
    }
    
    result = await db.pipelines.insert_one(pipeline_doc)
    pipeline_doc["_id"] = result.inserted_id
    
    return PipelineResponse(
        id=str(result.inserted_id),
        name=pipeline_doc["name"],
        description=pipeline_doc.get("description"),
        business_type=pipeline_doc.get("business_type", "general"),
        is_default=pipeline_doc.get("is_default", False),
        is_active=pipeline_doc.get("is_active", True),
        stages=[
            PipelineStageResponse(
                id=stage["id"],
                name=stage["name"],
                probability=stage.get("probability", 0),
                order=stage.get("order", i),
                color=stage.get("color", "#3B82F6"),
                description=stage.get("description"),
                required_properties=stage.get("required_properties", [])
            )
            for i, stage in enumerate(stages)
        ],
        created_at=now,
        updated_at=now,
        deal_count=0
    )


@router.get("/{pipeline_id}", response_model=PipelineResponse)
async def get_pipeline(
    pipeline_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get pipeline by ID"""
    
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    
    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    deal_count = await db.deals.count_documents({
        "user_id": current_user.id,
        "pipeline_id": pipeline_id
    })
    
    return PipelineResponse(
        id=str(pipeline["_id"]),
        name=pipeline["name"],
        description=pipeline.get("description"),
        business_type=pipeline.get("business_type", "general"),
        is_default=pipeline.get("is_default", False),
        is_active=pipeline.get("is_active", True),
        stages=[
            PipelineStageResponse(
                id=stage.get("id", str(uuid.uuid4())),
                name=stage["name"],
                probability=stage.get("probability", 0),
                order=stage.get("order", i),
                color=stage.get("color", "#3B82F6"),
                description=stage.get("description"),
                required_properties=stage.get("required_properties", [])
            )
            for i, stage in enumerate(pipeline.get("stages", []))
        ],
        created_at=pipeline["created_at"],
        updated_at=pipeline["updated_at"],
        deal_count=deal_count
    )


@router.put("/{pipeline_id}", response_model=PipelineResponse)
async def update_pipeline(
    pipeline_id: str,
    pipeline_data: PipelineUpdate,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update pipeline"""
    
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    
    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # If setting as default, unset other defaults
    if pipeline_data.is_default:
        await db.pipelines.update_many(
            {"user_id": current_user.id, "is_default": True, "_id": {"$ne": ObjectId(pipeline_id)}},
            {"$set": {"is_default": False}}
        )
    
    update_data = {k: v for k, v in pipeline_data.dict().items() if v is not None}
    
    # Handle stages separately
    if pipeline_data.stages is not None:
        update_data["stages"] = [
            {
                "id": str(uuid.uuid4()),
                **stage.dict()
            }
            for stage in pipeline_data.stages
        ]
    
    update_data["updated_at"] = datetime.utcnow()
    
    await db.pipelines.update_one(
        {"_id": ObjectId(pipeline_id)},
        {"$set": update_data}
    )
    
    # Get updated pipeline
    updated_pipeline = await db.pipelines.find_one({"_id": ObjectId(pipeline_id)})
    
    deal_count = await db.deals.count_documents({
        "user_id": current_user.id,
        "pipeline_id": pipeline_id
    })
    
    return PipelineResponse(
        id=str(updated_pipeline["_id"]),
        name=updated_pipeline["name"],
        description=updated_pipeline.get("description"),
        business_type=updated_pipeline.get("business_type", "general"),
        is_default=updated_pipeline.get("is_default", False),
        is_active=updated_pipeline.get("is_active", True),
        stages=[
            PipelineStageResponse(
                id=stage.get("id", str(uuid.uuid4())),
                name=stage["name"],
                probability=stage.get("probability", 0),
                order=stage.get("order", i),
                color=stage.get("color", "#3B82F6"),
                description=stage.get("description"),
                required_properties=stage.get("required_properties", [])
            )
            for i, stage in enumerate(updated_pipeline.get("stages", []))
        ],
        created_at=updated_pipeline["created_at"],
        updated_at=updated_pipeline["updated_at"],
        deal_count=deal_count
    )


@router.delete("/{pipeline_id}")
async def delete_pipeline(
    pipeline_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete pipeline (soft delete - set inactive)"""
    
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    
    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Check if there are deals in this pipeline
    deal_count = await db.deals.count_documents({
        "user_id": current_user.id,
        "pipeline_id": pipeline_id
    })
    
    if deal_count > 0:
        # Soft delete
        await db.pipelines.update_one(
            {"_id": ObjectId(pipeline_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        return {"message": f"Pipeline deactivated (has {deal_count} deals)"}
    else:
        # Hard delete
        await db.pipelines.delete_one({"_id": ObjectId(pipeline_id)})
        return {"message": "Pipeline deleted"}


@router.get("/{pipeline_id}/view", response_model=PipelineViewResponse)
async def get_pipeline_view(
    pipeline_id: str,
    view_type: DealViewType = Query(DealViewType.ALL, description="Filter view type"),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get pipeline kanban view with deals organized by stages"""
    
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    
    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    # Build filter based on view type
    filter_query = {
        "user_id": current_user.id,
        "$or": [
            {"pipeline_id": pipeline_id},
            {"pipeline_id": {"$exists": False}},
            {"pipeline_id": None}
        ]
    }
    
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
            month_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            month_end = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_query["expected_close_date"] = {"$gte": month_start, "$lt": month_end}
    elif view_type == DealViewType.CLOSING_THIS_QUARTER:
        quarter = (now.month - 1) // 3
        quarter_start = now.replace(month=quarter * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        next_quarter = quarter + 1
        if next_quarter > 3:
            quarter_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            quarter_end = now.replace(month=next_quarter * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        filter_query["expected_close_date"] = {"$gte": quarter_start, "$lt": quarter_end}
    
    # Get all deals
    deals_cursor = db.deals.find(filter_query).sort("updated_at", -1)
    all_deals = await deals_cursor.to_list(length=None)
    
    # Create stage map
    stages = pipeline.get("stages", [])
    stage_map = {stage.get("id", stage["name"].lower().replace(" ", "_")): stage for stage in stages}
    
    # Also map by status for backward compatibility
    status_to_stage = {}
    for stage in stages:
        stage_id = stage.get("id", stage["name"].lower().replace(" ", "_"))
        status_to_stage[stage["name"].lower().replace(" ", "_")] = stage_id
        status_to_stage[stage["name"].lower().replace("/", "_").replace(" ", "_")] = stage_id
    
    # Initialize stages data
    stages_data = {stage.get("id", stage["name"].lower().replace(" ", "_")): [] for stage in stages}
    
    total_value = 0.0
    weighted_value = 0.0
    forecast_this_month = 0.0
    forecast_this_quarter = 0.0
    
    now = datetime.utcnow()
    month_end = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
    quarter = (now.month - 1) // 3
    quarter_end = now.replace(month=(quarter + 1) * 3 + 1 if quarter < 3 else 1, day=1)
    if quarter == 3:
        quarter_end = quarter_end.replace(year=now.year + 1)
    
    for deal in all_deals:
        # Get contact info
        contact = None
        try:
            contact = await db.contacts.find_one({"_id": deal["contact_id"]})
        except:
            pass
        
        if contact:
            contact_name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip() or "Unknown"
            contact_email = contact.get("email", "")
            contact_phone = contact.get("phone", "")
        else:
            contact_name = "Unknown"
            contact_email = ""
            contact_phone = ""
        
        # Calculate weighted value
        deal_value = deal.get("amount", deal.get("revenue", 0.0))
        stage_id = deal.get("stage_id") or deal.get("status", "lead")
        
        # Find probability from stage
        probability = deal.get("probability")
        if probability is None:
            stage = stage_map.get(stage_id, {})
            probability = stage.get("probability", 0)
        
        deal_weighted = deal_value * (probability / 100)
        
        # Calculate if stalled
        last_activity = deal.get("last_activity_date")
        is_stalled = False
        if last_activity:
            if isinstance(last_activity, str):
                last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
            is_stalled = last_activity < stalled_threshold
        else:
            is_stalled = True
        
        # Calculate days in stage
        stage_entered = deal.get("stage_entered_at", deal.get("updated_at"))
        if stage_entered:
            if isinstance(stage_entered, str):
                stage_entered = datetime.fromisoformat(stage_entered.replace('Z', '+00:00'))
            days_in_stage = (now - stage_entered).days
        else:
            days_in_stage = 0
        
        populated_deal = DealResponse(
            id=str(deal["_id"]),
            name=deal["name"],
            description=deal.get("description"),
            contact_id=deal["contact_id"],
            company_id=deal.get("company_id"),
            campaign_id=deal.get("campaign_id"),
            pipeline_id=deal.get("pipeline_id"),
            stage_id=stage_id,
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
            weighted_value=deal_weighted,
            days_in_stage=days_in_stage,
            is_stalled=is_stalled,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            campaign_name=None,
            pipeline_name=pipeline["name"],
            stage_name=stage_map.get(stage_id, {}).get("name", stage_id),
            owner_name=None
        )
        
        # Add to appropriate stage
        target_stage = stage_id
        if target_stage not in stages_data:
            # Try to map from status
            target_stage = status_to_stage.get(deal.get("status", "lead"), list(stages_data.keys())[0] if stages_data else "lead")
        
        if target_stage in stages_data:
            stages_data[target_stage].append(populated_deal)
        elif stages_data:
            # Default to first stage
            first_stage = list(stages_data.keys())[0]
            stages_data[first_stage].append(populated_deal)
        
        total_value += deal_value
        weighted_value += deal_weighted
        
        # Calculate forecasts
        expected_close = deal.get("expected_close_date")
        if expected_close:
            if isinstance(expected_close, str):
                expected_close = datetime.fromisoformat(expected_close.replace('Z', '+00:00'))
            if expected_close < month_end:
                forecast_this_month += deal_weighted
            if expected_close < quarter_end:
                forecast_this_quarter += deal_weighted
    
    # Build response
    stage_views = []
    for stage in stages:
        stage_id = stage.get("id", stage["name"].lower().replace(" ", "_"))
        stage_deals = stages_data.get(stage_id, [])
        stage_value = sum(d.amount for d in stage_deals)
        stage_weighted = sum(d.weighted_value or 0 for d in stage_deals)
        
        stage_views.append(PipelineStageView(
            id=stage_id,
            name=stage["name"],
            probability=stage.get("probability", 0),
            color=stage.get("color", "#3B82F6"),
            deals=stage_deals,
            total_value=stage_value,
            weighted_value=stage_weighted,
            count=len(stage_deals)
        ))
    
    return PipelineViewResponse(
        pipeline_id=pipeline_id,
        pipeline_name=pipeline["name"],
        stages=stage_views,
        total_deals=len(all_deals),
        total_value=total_value,
        weighted_value=weighted_value,
        forecast_this_month=forecast_this_month,
        forecast_this_quarter=forecast_this_quarter
    )


@router.get("/{pipeline_id}/analytics", response_model=PipelineAnalytics)
async def get_pipeline_analytics(
    pipeline_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get pipeline analytics and forecast"""
    
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    
    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    stages = pipeline.get("stages", [])
    stage_map = {stage.get("id", stage["name"].lower().replace(" ", "_")): stage for stage in stages}
    
    # Get all deals
    deals = await db.deals.find({
        "user_id": current_user.id,
        "$or": [
            {"pipeline_id": pipeline_id},
            {"pipeline_id": {"$exists": False}},
            {"pipeline_id": None}
        ]
    }).to_list(length=None)
    
    now = datetime.utcnow()
    stalled_threshold = now - timedelta(days=14)
    
    # Calculate metrics
    total_value = 0.0
    weighted_value = 0.0
    stalled_count = 0
    no_activity_count = 0
    won_deals = 0
    lost_deals = 0
    closed_deals = 0
    total_days_to_close = 0
    by_stage = {}
    
    for deal in deals:
        deal_value = deal.get("amount", deal.get("revenue", 0.0))
        stage_id = deal.get("stage_id") or deal.get("status", "lead")
        status = deal.get("status", "lead")
        
        # Get probability
        probability = deal.get("probability")
        if probability is None:
            stage = stage_map.get(stage_id, {})
            probability = stage.get("probability", 0)
        
        deal_weighted = deal_value * (probability / 100)
        total_value += deal_value
        weighted_value += deal_weighted
        
        # Count by stage
        if stage_id not in by_stage:
            by_stage[stage_id] = {"count": 0, "value": 0, "weighted": 0}
        by_stage[stage_id]["count"] += 1
        by_stage[stage_id]["value"] += deal_value
        by_stage[stage_id]["weighted"] += deal_weighted
        
        # Check stalled
        last_activity = deal.get("last_activity_date")
        if last_activity:
            if isinstance(last_activity, str):
                last_activity = datetime.fromisoformat(last_activity.replace('Z', '+00:00'))
            if last_activity < stalled_threshold and status not in ["closed_won", "closed_lost"]:
                stalled_count += 1
        elif status not in ["closed_won", "closed_lost"]:
            no_activity_count += 1
            stalled_count += 1
        
        # Win/Loss tracking
        if status == "closed_won":
            won_deals += 1
            closed_deals += 1
            if deal.get("actual_close_date") and deal.get("created_at"):
                close_date = deal["actual_close_date"]
                create_date = deal["created_at"]
                if isinstance(close_date, str):
                    close_date = datetime.fromisoformat(close_date.replace('Z', '+00:00'))
                if isinstance(create_date, str):
                    create_date = datetime.fromisoformat(create_date.replace('Z', '+00:00'))
                total_days_to_close += (close_date - create_date).days
        elif status == "closed_lost":
            lost_deals += 1
            closed_deals += 1
    
    # Calculate rates
    total_closed = won_deals + lost_deals
    win_rate = (won_deals / total_closed * 100) if total_closed > 0 else 0
    avg_deal_value = total_value / len(deals) if deals else 0
    avg_days_to_close = total_days_to_close / won_deals if won_deals > 0 else 0
    
    # Calculate expected close amounts
    month_end = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
    quarter = (now.month - 1) // 3
    quarter_end = now.replace(month=(quarter + 1) * 3 + 1 if quarter < 3 else 1, day=1)
    if quarter == 3:
        quarter_end = quarter_end.replace(year=now.year + 1)
    
    expected_this_month = 0.0
    expected_this_quarter = 0.0
    
    for deal in deals:
        if deal.get("status") in ["closed_won", "closed_lost"]:
            continue
        
        expected_close = deal.get("expected_close_date")
        if expected_close:
            if isinstance(expected_close, str):
                expected_close = datetime.fromisoformat(expected_close.replace('Z', '+00:00'))
            
            deal_value = deal.get("amount", deal.get("revenue", 0.0))
            probability = deal.get("probability", 0)
            deal_weighted = deal_value * (probability / 100)
            
            if expected_close < month_end:
                expected_this_month += deal_weighted
            if expected_close < quarter_end:
                expected_this_quarter += deal_weighted
    
    # Build stage breakdown
    stage_breakdown = []
    for stage in stages:
        stage_id = stage.get("id", stage["name"].lower().replace(" ", "_"))
        stage_data = by_stage.get(stage_id, {"count": 0, "value": 0, "weighted": 0})
        stage_breakdown.append({
            "stage_id": stage_id,
            "stage_name": stage["name"],
            "probability": stage.get("probability", 0),
            "count": stage_data["count"],
            "value": stage_data["value"],
            "weighted_value": stage_data["weighted"]
        })
    
    # Build forecast
    forecast = PipelineForecast(
        pipeline_id=pipeline_id,
        pipeline_name=pipeline["name"],
        total_deals=len(deals),
        total_value=total_value,
        weighted_value=weighted_value,
        by_stage=stage_breakdown,
        expected_close_this_month=expected_this_month,
        expected_close_this_quarter=expected_this_quarter
    )
    
    return PipelineAnalytics(
        forecast=forecast,
        conversion_rates=[],  # TODO: Calculate from historical stage changes
        avg_deal_value=avg_deal_value,
        avg_days_in_stage={},  # TODO: Calculate from stage change history
        stalled_deals_count=stalled_count,
        deals_without_activity=no_activity_count
    )


# IMPORTANT: This route must come BEFORE the PATCH route to avoid route conflicts
@router.get("/{pipeline_id}/leads/view", response_model=PipelineLeadViewResponse)
async def get_pipeline_leads_view(
    pipeline_id: str,
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Lead-centric pipeline view. Stage 1 (index 0) acts as the default bucket containing
    all leads unless explicitly mapped to another stage in this pipeline.
    """
    if not ObjectId.is_valid(pipeline_id):
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")

    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    stages = pipeline.get("stages", [])
    if not stages:
        raise HTTPException(status_code=400, detail="Pipeline has no stages")

    # Load lead-stage mappings
    mappings_cursor = db.pipeline_leads.find({
        "pipeline_id": pipeline_id,
        "user_id": current_user.id
    })
    mappings = await mappings_cursor.to_list(length=None)
    contact_stage_map = {m["contact_id"]: m["stage_id"] for m in mappings}

    # Load contacts
    contacts_cursor = db.contacts.find({"user_id": current_user.id})
    contacts = await contacts_cursor.to_list(length=None)

    # Prepare stage views
    stage_views = []
    stage_leads: dict[str, list] = {}
    for idx, stage in enumerate(stages):
        stage_id = stage.get("id", str(uuid.uuid4()))
        stage_leads[stage_id] = []
        stage_views.append(PipelineLeadStageView(
            id=stage_id,
            name=stage.get("name", f"Stage {idx+1}"),
            color=stage.get("color", "#3B82F6"),
            order=stage.get("order", idx),
            leads=[],
            count=0
        ))

    first_stage_id = stage_views[0].id
    total_leads = 0

    for contact in contacts:
        total_leads += 1
        contact_id = str(contact["_id"])
        stage_id = contact_stage_map.get(contact_id, first_stage_id)
        if stage_id not in stage_leads:
            stage_id = first_stage_id
        stage_leads[stage_id].append(PipelineLead(
            id=contact_id,
            first_name=contact.get("first_name"),
            last_name=contact.get("last_name"),
            email=contact.get("email"),
            phone=contact.get("phone"),
            status=contact.get("status"),
            stage_id=stage_id
        ))

    for view in stage_views:
        leads = stage_leads.get(view.id, [])
        view.leads = leads
        view.count = len(leads)

    return PipelineLeadViewResponse(
        pipeline_id=pipeline_id,
        pipeline_name=pipeline["name"],
        stages=stage_views,
        total_leads=total_leads
    )


@router.patch("/{pipeline_id}/leads/{contact_id}")
async def update_pipeline_lead_stage(
    pipeline_id: str,
    contact_id: str,
    stage_id: str = Body(..., embed=True),
    current_user: UserResponse = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Move a lead/contact to a stage within a pipeline.
    """
    logger.info(f"🔧 [update_pipeline_lead_stage] Request: pipeline_id={pipeline_id}, contact_id={contact_id}, stage_id={stage_id}, user_id={current_user.id}")
    
    if not ObjectId.is_valid(pipeline_id):
        logger.error(f"❌ [update_pipeline_lead_stage] Invalid pipeline ID: {pipeline_id}")
        raise HTTPException(status_code=400, detail="Invalid pipeline ID")
    if not ObjectId.is_valid(contact_id):
        logger.error(f"❌ [update_pipeline_lead_stage] Invalid contact ID: {contact_id}")
        raise HTTPException(status_code=400, detail="Invalid contact ID")

    pipeline = await db.pipelines.find_one({
        "_id": ObjectId(pipeline_id),
        "user_id": current_user.id
    })
    if not pipeline:
        logger.error(f"❌ [update_pipeline_lead_stage] Pipeline not found: pipeline_id={pipeline_id}, user_id={current_user.id}")
        raise HTTPException(status_code=404, detail="Pipeline not found")

    stages = pipeline.get("stages", [])
    stage_ids = {s.get("id") for s in stages}
    logger.info(f"🔧 [update_pipeline_lead_stage] Available stage_ids: {stage_ids}")
    if stage_id not in stage_ids:
        logger.error(f"❌ [update_pipeline_lead_stage] Invalid stage_id: {stage_id}, available: {stage_ids}")
        raise HTTPException(status_code=400, detail=f"Invalid stage ID for this pipeline. Available stages: {list(stage_ids)}")

    contact = await db.contacts.find_one({"_id": ObjectId(contact_id), "user_id": current_user.id})
    if not contact:
        logger.error(f"❌ [update_pipeline_lead_stage] Contact not found: contact_id={contact_id}, user_id={current_user.id}")
        # Check if contact exists but belongs to different user
        contact_exists = await db.contacts.find_one({"_id": ObjectId(contact_id)})
        if contact_exists:
            logger.error(f"❌ [update_pipeline_lead_stage] Contact exists but belongs to different user")
        raise HTTPException(status_code=404, detail="Contact not found")

    now = datetime.utcnow()
    await db.pipeline_leads.update_one(
        {
            "pipeline_id": pipeline_id,
            "contact_id": contact_id,
            "user_id": current_user.id
        },
        {
            "$set": {
                "stage_id": stage_id,
                "updated_at": now
            },
            "$setOnInsert": {
                "created_at": now
            }
        },
        upsert=True
    )

    return {"status": "ok", "pipeline_id": pipeline_id, "contact_id": contact_id, "stage_id": stage_id}

