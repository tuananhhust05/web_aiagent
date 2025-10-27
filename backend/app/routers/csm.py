from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from datetime import datetime
from ..models.csm import CSMCreate, CSMUpdate, CSMResponse, CSMListResponse, CSMStatsResponse, CSMStatus, CSMPriority
from ..core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
import math

router = APIRouter()

@router.get("/test")
async def test_csm():
    """Test endpoint for CSM"""
    return {"message": "CSM API is working", "status": "ok"}

@router.get("/getdata", response_model=CSMListResponse)
async def get_csm_records(
    search: Optional[str] = Query(None),
    status: Optional[CSMStatus] = Query(None),
    priority: Optional[CSMPriority] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get CSM records with filtering and pagination"""
    try:
        collection = db.csm_records
    
        # Build filter
        filter_query = {}
        if search:
            filter_query["$or"] = [
                {"contact_name": {"$regex": search, "$options": "i"}},
                {"contact_email": {"$regex": search, "$options": "i"}},
                {"notes": {"$regex": search, "$options": "i"}}
            ]
        if status:
            filter_query["status"] = status
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
        
        return CSMListResponse(
            csm_records=records,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    except Exception as e:
        print(f"Error in get_csm_records: {e}")
        # Return empty response on error
        return CSMListResponse(
            csm_records=[],
            total=0,
            page=page,
            limit=limit,
            total_pages=0
        )

@router.get("/{csm_id}", response_model=CSMResponse)
async def get_csm_record(
    csm_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific CSM record"""
    try:
        from bson import ObjectId
        collection = db.csm_records
        record = await collection.find_one({"_id": ObjectId(csm_id)})
        
        if not record:
            raise HTTPException(status_code=404, detail="CSM record not found")
        
        # Convert ObjectId to string
        if '_id' in record:
            record['id'] = str(record['_id'])
            del record['_id']
        
        return record
    except Exception as e:
        print(f"Error in get_csm_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=CSMResponse)
async def create_csm_record(
    csm_data: CSMCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new CSM record"""
    try:
        collection = db.csm_records
        
        # Convert to dict and add timestamps
        record_data = csm_data.dict()
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
        print(f"Error in create_csm_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{csm_id}", response_model=CSMResponse)
async def update_csm_record(
    csm_id: str,
    csm_data: CSMUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update a CSM record"""
    try:
        from bson import ObjectId
        collection = db.csm_records
        
        # Check if record exists
        existing_record = await collection.find_one({"_id": ObjectId(csm_id)})
        if not existing_record:
            raise HTTPException(status_code=404, detail="CSM record not found")
        
        # Update record
        update_data = {k: v for k, v in csm_data.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        await collection.update_one(
            {"_id": ObjectId(csm_id)},
            {"$set": update_data}
        )
        
        # Get updated record
        updated_record = await collection.find_one({"_id": ObjectId(csm_id)})
        
        # Convert ObjectId to string
        if updated_record and '_id' in updated_record:
            updated_record['id'] = str(updated_record['_id'])
            del updated_record['_id']
        
        return updated_record
    except Exception as e:
        print(f"Error in update_csm_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{csm_id}")
async def delete_csm_record(
    csm_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a CSM record"""
    try:
        from bson import ObjectId
        collection = db.csm_records
        
        result = await collection.delete_one({"_id": ObjectId(csm_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="CSM record not found")
        
        return {"message": "CSM record deleted successfully"}
    except Exception as e:
        print(f"Error in delete_csm_record: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/stats/overview", response_model=CSMStatsResponse)
async def get_csm_stats(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get CSM statistics overview"""
    collection = db.csm_records
    
    # Get all records
    cursor = collection.find({})
    records = await cursor.to_list(length=None)
    
    if not records:
        return CSMStatsResponse(
            total_customers=0,
            active_customers=0,
            at_risk_customers=0,
            churned_customers=0,
            average_health_score=0,
            total_account_value=0,
            high_priority_count=0,
            critical_priority_count=0
        )
    
    # Calculate stats
    total_customers = len(records)
    active_customers = len([r for r in records if r.get("status") == "active"])
    at_risk_customers = len([r for r in records if r.get("status") == "at_risk"])
    churned_customers = len([r for r in records if r.get("status") == "churned"])
    
    health_scores = [r.get("health_score", 0) for r in records if r.get("health_score") is not None]
    average_health_score = sum(health_scores) / len(health_scores) if health_scores else 0
    
    account_values = [r.get("account_value", 0) for r in records if r.get("account_value") is not None]
    total_account_value = sum(account_values)
    
    high_priority_count = len([r for r in records if r.get("priority") == "high"])
    critical_priority_count = len([r for r in records if r.get("priority") == "critical"])
    
    return CSMStatsResponse(
        total_customers=total_customers,
        active_customers=active_customers,
        at_risk_customers=at_risk_customers,
        churned_customers=churned_customers,
        average_health_score=round(average_health_score, 2),
        total_account_value=round(total_account_value, 2),
        high_priority_count=high_priority_count,
        critical_priority_count=critical_priority_count
    )
