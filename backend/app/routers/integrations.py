from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from datetime import datetime
import httpx
import asyncio
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.integration import (
    IntegrationCreate, 
    IntegrationUpdate, 
    IntegrationResponse, 
    IntegrationStats,
    SyncResult,
    IntegrationType,
    IntegrationStatus,
    SyncFrequency
)

router = APIRouter()

@router.get("", response_model=List[IntegrationResponse])
async def get_integrations(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all integrations for the user"""
    db = get_database()
    
    integrations = await db.integrations.find({"user_id": current_user.id}).to_list(length=None)
    
    # Ensure each integration has an id field
    integration_responses = []
    for integration in integrations:
        integration_dict = dict(integration)
        integration_dict['id'] = integration_dict['_id']
        integration_responses.append(IntegrationResponse(**integration_dict))
    
    return integration_responses

@router.post("", response_model=IntegrationResponse)
async def create_integration(
    integration_data: IntegrationCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new integration"""
    db = get_database()
    
    # Test the API key by making a test request
    if not await test_integration_connection(integration_data.type, integration_data.api_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid API key or connection failed"
        )
    
    # Create integration document
    integration_doc = {
        "name": integration_data.name,
        "type": integration_data.type,
        "status": IntegrationStatus.CONNECTED,
        "settings": {
            "api_key": integration_data.api_key,
            "webhook_url": integration_data.webhook_url,
            "sync_frequency": integration_data.sync_frequency,
            "auto_sync": integration_data.auto_sync
        },
        "last_sync": None,
        "total_contacts": 0,
        "sync_frequency": integration_data.sync_frequency,
        "auto_sync": integration_data.auto_sync,
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert integration
    result = await db.integrations.insert_one(integration_doc)
    integration_doc['id'] = str(result.inserted_id)
    integration_doc['_id'] = result.inserted_id
    
    return IntegrationResponse(**integration_doc)

@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific integration"""
    db = get_database()
    
    integration = await db.integrations.find_one({
        "_id": integration_id,
        "user_id": current_user.id
    })
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    integration_dict = dict(integration)
    integration_dict['id'] = integration_dict['_id']
    return IntegrationResponse(**integration_dict)

@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    integration_update: IntegrationUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update an integration"""
    db = get_database()
    
    # Check if integration exists
    existing_integration = await db.integrations.find_one({
        "_id": integration_id,
        "user_id": current_user.id
    })
    
    if not existing_integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    
    # Update settings if provided
    if integration_update.api_key or integration_update.webhook_url or integration_update.sync_frequency or integration_update.auto_sync is not None:
        settings = existing_integration.get("settings", {})
        if integration_update.api_key:
            settings["api_key"] = integration_update.api_key
        if integration_update.webhook_url:
            settings["webhook_url"] = integration_update.webhook_url
        if integration_update.sync_frequency:
            settings["sync_frequency"] = integration_update.sync_frequency
        if integration_update.auto_sync is not None:
            settings["auto_sync"] = integration_update.auto_sync
        update_data["settings"] = settings
    
    # Update other fields
    for field, value in integration_update.dict(exclude_unset=True).items():
        if value is not None and field not in ["api_key", "webhook_url"]:
            update_data[field] = value
    
    # Test API key if it was updated
    if integration_update.api_key:
        if not await test_integration_connection(existing_integration["type"], integration_update.api_key):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid API key or connection failed"
            )
    
    # Update integration
    await db.integrations.update_one(
        {"_id": integration_id},
        {"$set": update_data}
    )
    
    # Get updated integration
    updated_integration = await db.integrations.find_one({"_id": integration_id})
    updated_integration_dict = dict(updated_integration)
    updated_integration_dict['id'] = updated_integration_dict['_id']
    
    return IntegrationResponse(**updated_integration_dict)

@router.delete("/{integration_id}")
async def delete_integration(
    integration_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete an integration"""
    db = get_database()
    
    result = await db.integrations.delete_one({
        "_id": integration_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    return {"message": "Integration deleted successfully"}

@router.post("/{integration_id}/sync", response_model=SyncResult)
async def sync_integration(
    integration_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Sync data from integration"""
    db = get_database()
    
    # Get integration
    integration = await db.integrations.find_one({
        "_id": integration_id,
        "user_id": current_user.id
    })
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    if integration["status"] != IntegrationStatus.CONNECTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Integration is not connected"
        )
    
    # Update status to syncing
    await db.integrations.update_one(
        {"_id": integration_id},
        {"$set": {
            "status": IntegrationStatus.SYNCING,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Start sync in background
    background_tasks.add_task(
        perform_sync,
        integration_id,
        integration["type"],
        integration["settings"]["api_key"],
        current_user.id
    )
    
    return SyncResult(
        success=True,
        message="Sync started successfully",
        contacts_synced=0,
        sync_time=datetime.utcnow()
    )

@router.get("/stats/summary", response_model=IntegrationStats)
async def get_integration_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get integration statistics"""
    db = get_database()
    
    # Get integration counts
    total_integrations = await db.integrations.count_documents({"user_id": current_user.id})
    connected_integrations = await db.integrations.count_documents({
        "user_id": current_user.id,
        "status": IntegrationStatus.CONNECTED
    })
    
    # Get total contacts synced
    integrations = await db.integrations.find({"user_id": current_user.id}).to_list(length=None)
    total_contacts_synced = sum(integration.get("total_contacts", 0) for integration in integrations)
    
    # Get last sync time
    last_sync_times = [integration.get("last_sync") for integration in integrations if integration.get("last_sync")]
    last_sync_time = max(last_sync_times) if last_sync_times else None
    
    # Count sync errors (mock data)
    sync_errors = await db.integrations.count_documents({
        "user_id": current_user.id,
        "status": IntegrationStatus.ERROR
    })
    
    return IntegrationStats(
        total_integrations=total_integrations,
        connected_integrations=connected_integrations,
        total_contacts_synced=total_contacts_synced,
        last_sync_time=last_sync_time,
        sync_errors=sync_errors
    )

async def test_integration_connection(integration_type: IntegrationType, api_key: str) -> bool:
    """Test connection to integration service"""
    try:
        if integration_type == IntegrationType.HUBSPOT:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.hubapi.com/crm/v3/objects/contacts",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=10.0
                )
                return response.status_code == 200
        
        elif integration_type == IntegrationType.SALESFORCE:
            # Mock Salesforce connection test
            return len(api_key) > 10
        
        elif integration_type == IntegrationType.PIPEDRIVE:
            # Mock Pipedrive connection test
            return len(api_key) > 10
        
        return False
    except Exception:
        return False

async def perform_sync(integration_id: str, integration_type: IntegrationType, api_key: str, user_id: str):
    """Perform the actual sync operation"""
    db = get_database()
    
    try:
        contacts_synced = 0
        errors = []
        
        if integration_type == IntegrationType.HUBSPOT:
            contacts_synced, errors = await sync_hubspot_contacts(api_key, user_id)
        
        # Update integration with sync results
        await db.integrations.update_one(
            {"_id": integration_id},
            {"$set": {
                "status": IntegrationStatus.CONNECTED,
                "last_sync": datetime.utcnow(),
                "total_contacts": contacts_synced,
                "updated_at": datetime.utcnow()
            }}
        )
        
    except Exception as e:
        # Update integration with error status
        await db.integrations.update_one(
            {"_id": integration_id},
            {"$set": {
                "status": IntegrationStatus.ERROR,
                "updated_at": datetime.utcnow()
            }}
        )

async def sync_hubspot_contacts(api_key: str, user_id: str) -> tuple[int, list]:
    """Sync contacts from HubSpot"""
    db = get_database()
    contacts_synced = 0
    errors = []
    
    try:
        async with httpx.AsyncClient() as client:
            # Get contacts from HubSpot
            response = await client.get(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                headers={"Authorization": f"Bearer {api_key}"},
                params={"limit": 100}
            )
            
            if response.status_code == 200:
                data = response.json()
                hubspot_contacts = data.get("results", [])
                
                for contact in hubspot_contacts:
                    try:
                        # Transform HubSpot contact to our format
                        contact_doc = {
                            "first_name": contact.get("properties", {}).get("firstname", ""),
                            "last_name": contact.get("properties", {}).get("lastname", ""),
                            "email": contact.get("properties", {}).get("email", ""),
                            "phone": contact.get("properties", {}).get("phone", ""),
                            "company_name": contact.get("properties", {}).get("company", ""),
                            "hubspot_id": contact.get("id"),
                            "user_id": user_id,
                            "created_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                        
                        # Check if contact already exists
                        existing_contact = await db.contacts.find_one({
                            "hubspot_id": contact.get("id"),
                            "user_id": user_id
                        })
                        
                        if existing_contact:
                            # Update existing contact
                            await db.contacts.update_one(
                                {"_id": existing_contact["_id"]},
                                {"$set": {
                                    **contact_doc,
                                    "updated_at": datetime.utcnow()
                                }}
                            )
                        else:
                            # Insert new contact
                            await db.contacts.insert_one(contact_doc)
                        
                        contacts_synced += 1
                        
                    except Exception as e:
                        errors.append(f"Error syncing contact {contact.get('id', 'unknown')}: {str(e)}")
            
            else:
                errors.append(f"HubSpot API error: {response.status_code}")
    
    except Exception as e:
        errors.append(f"Sync error: {str(e)}")
    
    return contacts_synced, errors
