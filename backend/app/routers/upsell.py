from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime
from ..models.upsell import UpsellCreate, UpsellUpdate, UpsellResponse, UpsellListResponse, UpsellStatsResponse, UpsellStatus, UpsellType, UpsellPriority
from ..core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import math

router = APIRouter()

@router.get("/test")
async def test_upsell():
    """Test endpoint for Upsell"""
    return {"message": "Upsell API is working", "status": "ok"}

@router.get("/getdata", response_model=UpsellListResponse)
async def get_upsell_records(
    search: Optional[str] = Query(None),
    status: Optional[UpsellStatus] = Query(None),
    upsell_type: Optional[UpsellType] = Query(None),
    priority: Optional[UpsellPriority] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get upsell records with filtering and pagination"""
    try:
        collection = db.upsell_records
    
        # Build filter
        filter_query = {}
        if search:
            filter_query["$or"] = [
                {"contact_name": {"$regex": search, "$options": "i"}},
                {"contact_email": {"$regex": search, "$options": "i"}},
                {"current_product": {"$regex": search, "$options": "i"}},
                {"target_product": {"$regex": search, "$options": "i"}},
                {"notes": {"$regex": search, "$options": "i"}}
            ]
        if status:
            filter_query["status"] = status
        if upsell_type:
            filter_query["upsell_type"] = upsell_type
        if priority:
            filter_query["priority"] = priority
        
        # Get total count
        total = await collection.count_documents(filter_query)
        total_pages = math.ceil(total / limit)
        
        # Get records
        skip = (page - 1) * limit
        cursor = collection.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        records = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for each record
        for record in records:
            if '_id' in record:
                record['id'] = str(record['_id'])
                del record['_id']
        
        return UpsellListResponse(
            upsell_records=records,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"Error in get_upsell_records: {e}")
        # Return empty response on error
        return UpsellListResponse(
            upsell_records=[],
            total=0,
            page=page,
            limit=limit,
            total_pages=0
        )

@router.get("/{upsell_id}", response_model=UpsellResponse)
async def get_upsell_record(
    upsell_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific upsell record"""
    try:
        from bson import ObjectId
        collection = db.upsell_records
        record = await collection.find_one({"_id": ObjectId(upsell_id)})
        
        if not record:
            raise HTTPException(status_code=404, detail="Upsell record not found")
        
        # Convert ObjectId to string
        if '_id' in record:
            record['id'] = str(record['_id'])
            del record['_id']
        
        return record
    except Exception as e:
        print(f"Error in get_upsell_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=UpsellResponse)
async def create_upsell_record(
    upsell_data: UpsellCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new upsell record"""
    try:
        collection = db.upsell_records
        
        # Convert to dict and add timestamps
        record_data = upsell_data.dict()
        record_data["created_at"] = datetime.utcnow()
        record_data["updated_at"] = datetime.utcnow()
        
        result = await collection.insert_one(record_data)
        
        # Get the created record
        created_record = await collection.find_one({"_id": result.inserted_id})
        
        # Convert ObjectId to string
        if created_record and '_id' in created_record:
            created_record['id'] = str(created_record['_id'])
            del created_record['_id']
        
        return created_record
    except Exception as e:
        print(f"Error in create_upsell_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{upsell_id}", response_model=UpsellResponse)
async def update_upsell_record(
    upsell_id: str,
    upsell_data: UpsellUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update an upsell record"""
    try:
        from bson import ObjectId
        collection = db.upsell_records
        
        # Check if record exists
        existing_record = await collection.find_one({"_id": ObjectId(upsell_id)})
        if not existing_record:
            raise HTTPException(status_code=404, detail="Upsell record not found")
        
        # Update record
        update_data = {k: v for k, v in upsell_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(upsell_id)},
            {"$set": update_data}
        )
        
        # Get updated record
        updated_record = await collection.find_one({"_id": ObjectId(upsell_id)})
        
        # Convert ObjectId to string
        if updated_record and '_id' in updated_record:
            updated_record['id'] = str(updated_record['_id'])
            del updated_record['_id']
        
        return updated_record
    except Exception as e:
        print(f"Error in update_upsell_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{upsell_id}")
async def delete_upsell_record(
    upsell_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete an upsell record"""
    try:
        from bson import ObjectId
        collection = db.upsell_records
        
        result = await collection.delete_one({"_id": ObjectId(upsell_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Upsell record not found")
        
        return {"message": "Upsell record deleted successfully"}
    except Exception as e:
        print(f"Error in delete_upsell_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats/overview", response_model=UpsellStatsResponse)
async def get_upsell_stats(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get upsell statistics overview"""
    collection = db.upsell_records
    
    # Get all records
    cursor = collection.find({})
    records = await cursor.to_list(length=None)
    
    if not records:
        return UpsellStatsResponse(
            total_opportunities=0,
            in_progress_opportunities=0,
            closed_won_opportunities=0,
            closed_lost_opportunities=0,
            total_estimated_value=0,
            weighted_pipeline_value=0,
            average_probability=0,
            high_priority_count=0,
            critical_priority_count=0
        )
    
    # Calculate stats
    total_opportunities = len(records)
    in_progress_opportunities = len([r for r in records if r.get("status") == "in_progress"])
    closed_won_opportunities = len([r for r in records if r.get("status") == "closed_won"])
    closed_lost_opportunities = len([r for r in records if r.get("status") == "closed_lost"])
    
    estimated_values = [r.get("estimated_value", 0) for r in records if r.get("estimated_value") is not None]
    total_estimated_value = sum(estimated_values)
    
    # Calculate weighted pipeline value
    weighted_values = []
    for record in records:
        estimated_value = record.get("estimated_value", 0)
        probability = record.get("probability", 0)
        weighted_values.append(estimated_value * (probability / 100))
    weighted_pipeline_value = sum(weighted_values)
    
    probabilities = [r.get("probability", 0) for r in records if r.get("probability") is not None]
    average_probability = sum(probabilities) / len(probabilities) if probabilities else 0
    
    high_priority_count = len([r for r in records if r.get("priority") == "high"])
    critical_priority_count = len([r for r in records if r.get("priority") == "critical"])
    
    return UpsellStatsResponse(
        total_opportunities=total_opportunities,
        in_progress_opportunities=in_progress_opportunities,
        closed_won_opportunities=closed_won_opportunities,
        closed_lost_opportunities=closed_lost_opportunities,
        total_estimated_value=round(total_estimated_value, 2),
        weighted_pipeline_value=round(weighted_pipeline_value, 2),
        average_probability=round(average_probability, 2),
        high_priority_count=high_priority_count,
        critical_priority_count=critical_priority_count
    )
