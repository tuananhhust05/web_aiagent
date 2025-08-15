from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from typing import List, Dict, Any
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from bson import ObjectId

router = APIRouter()

@router.get("/providers")
async def get_crm_providers():
    """Get available CRM providers"""
    return {
        "providers": [
            {
                "id": "hubspot",
                "name": "HubSpot",
                "description": "All-in-one CRM platform",
                "features": ["contact_sync", "deal_tracking", "email_marketing"]
            },
            {
                "id": "salesforce",
                "name": "Salesforce",
                "description": "Enterprise CRM solution",
                "features": ["contact_sync", "deal_tracking", "sales_automation"]
            },
            {
                "id": "pipedrive",
                "name": "Pipedrive",
                "description": "Sales-focused CRM",
                "features": ["contact_sync", "deal_tracking", "pipeline_management"]
            }
        ]
    }

@router.post("/connect/{provider}")
async def connect_crm(
    provider: str,
    credentials: Dict[str, Any],
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Connect to a CRM provider"""
    db = get_database()
    
    # Validate provider
    valid_providers = ["hubspot", "salesforce", "pipedrive"]
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider. Must be one of: {valid_providers}"
        )
    
    # TODO: Implement actual CRM OAuth flow
    # For now, just store the connection info
    
    # Check if connection already exists
    existing_connection = await db.crm_integrations.find_one({
        "user_id": current_user.id,
        "provider": provider
    })
    
    if existing_connection:
        # Update existing connection
        await db.crm_integrations.update_one(
            {"_id": existing_connection["_id"]},
            {
                "$set": {
                    "credentials": credentials,
                    "updated_at": datetime.utcnow(),
                    "is_active": True
                }
            }
        )
    else:
        # Create new connection
        connection_doc = {
            "_id": str(ObjectId()),
            "user_id": current_user.id,
            "provider": provider,
            "credentials": credentials,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.crm_integrations.insert_one(connection_doc)
    
    return {"message": f"Successfully connected to {provider}"}

@router.get("/connections")
async def get_crm_connections(current_user: UserResponse = Depends(get_current_active_user)):
    """Get user's CRM connections"""
    db = get_database()
    
    connections = await db.crm_integrations.find(
        {"user_id": current_user.id}
    ).to_list(None)
    
    # Remove sensitive credentials from response
    for connection in connections:
        if "credentials" in connection:
            del connection["credentials"]
    
    return {"connections": connections}

@router.delete("/disconnect/{provider}")
async def disconnect_crm(
    provider: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Disconnect from a CRM provider"""
    db = get_database()
    
    result = await db.crm_integrations.update_one(
        {
            "user_id": current_user.id,
            "provider": provider
        },
        {
            "$set": {
                "is_active": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active connection found for {provider}"
        )
    
    return {"message": f"Successfully disconnected from {provider}"}

@router.post("/sync/{provider}")
async def sync_contacts_from_crm(
    provider: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Sync contacts from CRM to local database"""
    db = get_database()
    
    # Check if connection exists and is active
    connection = await db.crm_integrations.find_one({
        "user_id": current_user.id,
        "provider": provider,
        "is_active": True
    })
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active connection found for {provider}"
        )
    
    # TODO: Implement actual CRM API calls to fetch contacts
    # For now, return a mock response
    
    return {
        "message": f"Sync initiated for {provider}",
        "status": "in_progress",
        "estimated_contacts": 150
    }

@router.get("/sync/status/{sync_id}")
async def get_sync_status(
    sync_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get status of a sync operation"""
    # TODO: Implement sync status tracking
    return {
        "sync_id": sync_id,
        "status": "completed",
        "progress": 100,
        "contacts_synced": 150,
        "errors": []
    }

@router.post("/export/{provider}")
async def export_contacts_to_crm(
    provider: str,
    contact_ids: List[str],
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Export contacts to CRM"""
    db = get_database()
    
    # Check if connection exists and is active
    connection = await db.crm_integrations.find_one({
        "user_id": current_user.id,
        "provider": provider,
        "is_active": True
    })
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active connection found for {provider}"
        )
    
    # Get contacts to export
    contacts = await db.contacts.find({
        "_id": {"$in": contact_ids},
        "user_id": current_user.id
    }).to_list(None)
    
    if not contacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No contacts found to export"
        )
    
    # TODO: Implement actual CRM API calls to create/update contacts
    
    return {
        "message": f"Export initiated to {provider}",
        "contacts_count": len(contacts),
        "status": "in_progress"
    } 