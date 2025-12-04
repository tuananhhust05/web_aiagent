from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.campaign_workflow_script import (
    CampaignWorkflowNodeScriptCreate,
    CampaignWorkflowNodeScriptUpdate,
    CampaignWorkflowNodeScriptResponse
)

router = APIRouter()

@router.get("", response_model=List[CampaignWorkflowNodeScriptResponse])
async def get_campaign_workflow_scripts(
    campaign_id: str = Query(..., description="Campaign ID"),
    workflow_function: str = Query(..., description="Workflow function name"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all node scripts for a campaign workflow"""
    db = get_database()
    
    # Verify campaign belongs to user
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Get all scripts for this campaign and workflow
    scripts = await db.campaign_workflow_scripts.find({
        "campaign_id": campaign_id,
        "workflow_function": workflow_function,
        "user_id": current_user.id
    }).to_list(length=None)
    
    # Convert ObjectId to string
    script_responses = []
    for script in scripts:
        script_dict = dict(script)
        script_dict['id'] = str(script_dict['_id'])
        del script_dict['_id']
        script_responses.append(CampaignWorkflowNodeScriptResponse(**script_dict))
    
    return script_responses

@router.get("/by-node", response_model=Optional[CampaignWorkflowNodeScriptResponse])
async def get_campaign_workflow_node_script(
    campaign_id: str = Query(..., description="Campaign ID"),
    workflow_function: str = Query(..., description="Workflow function name"),
    node_id: str = Query(..., description="Node ID"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get script for a specific node in a campaign workflow"""
    db = get_database()
    
    # Verify campaign belongs to user
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Get script for this specific node
    script = await db.campaign_workflow_scripts.find_one({
        "campaign_id": campaign_id,
        "workflow_function": workflow_function,
        "node_id": node_id,
        "user_id": current_user.id
    })
    
    if not script:
        return None
    
    script_dict = dict(script)
    script_dict['id'] = str(script_dict['_id'])
    del script_dict['_id']
    
    return CampaignWorkflowNodeScriptResponse(**script_dict)

@router.post("", response_model=CampaignWorkflowNodeScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign_workflow_node_script(
    script_data: CampaignWorkflowNodeScriptCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create or update script for a campaign workflow node"""
    db = get_database()
    
    # Verify campaign belongs to user
    campaign = await db.campaigns.find_one({
        "_id": script_data.campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Check if script already exists
    existing = await db.campaign_workflow_scripts.find_one({
        "campaign_id": script_data.campaign_id,
        "workflow_function": script_data.workflow_function,
        "node_id": script_data.node_id,
        "user_id": current_user.id
    })
    
    script_dict = script_data.model_dump()
    script_dict["user_id"] = current_user.id
    script_dict["created_at"] = datetime.utcnow()
    script_dict["updated_at"] = datetime.utcnow()
    
    if existing:
        # Update existing script
        await db.campaign_workflow_scripts.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "script": script_dict["script"],
                "config": script_dict["config"],
                "updated_at": script_dict["updated_at"]
            }}
        )
        
        # Fetch updated script
        updated_script = await db.campaign_workflow_scripts.find_one({"_id": existing["_id"]})
        updated_script["id"] = str(updated_script["_id"])
        del updated_script["_id"]
        
        return CampaignWorkflowNodeScriptResponse(**updated_script)
    else:
        # Create new script
        result = await db.campaign_workflow_scripts.insert_one(script_dict)
        
        # Fetch created script
        created_script = await db.campaign_workflow_scripts.find_one({"_id": result.inserted_id})
        created_script["id"] = str(created_script["_id"])
        del created_script["_id"]
        
        return CampaignWorkflowNodeScriptResponse(**created_script)

@router.put("/{script_id}", response_model=CampaignWorkflowNodeScriptResponse)
async def update_campaign_workflow_node_script(
    script_id: str,
    script_update: CampaignWorkflowNodeScriptUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update script for a campaign workflow node"""
    db = get_database()
    
    # Find script
    script = await db.campaign_workflow_scripts.find_one({
        "_id": script_id,
        "user_id": current_user.id
    })
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Script not found"
        )
    
    # Build update data
    update_data = {"updated_at": datetime.utcnow()}
    if script_update.script is not None:
        update_data["script"] = script_update.script
    if script_update.config is not None:
        update_data["config"] = script_update.config
    
    # Update script
    await db.campaign_workflow_scripts.update_one(
        {"_id": script["_id"]},
        {"$set": update_data}
    )
    
    # Fetch updated script
    updated_script = await db.campaign_workflow_scripts.find_one({"_id": script["_id"]})
    updated_script["id"] = str(updated_script["_id"])
    del updated_script["_id"]
    
    return CampaignWorkflowNodeScriptResponse(**updated_script)

@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign_workflow_node_script(
    script_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete script for a campaign workflow node"""
    db = get_database()
    
    result = await db.campaign_workflow_scripts.delete_one({
        "_id": script_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Script not found"
        )
    
    return None

@router.get("/all-nodes", response_model=Dict[str, CampaignWorkflowNodeScriptResponse])
async def get_all_campaign_workflow_node_scripts(
    campaign_id: str = Query(..., description="Campaign ID"),
    workflow_function: str = Query(..., description="Workflow function name"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all node scripts for a campaign workflow as a dictionary keyed by node_id"""
    db = get_database()
    
    # Verify campaign belongs to user
    campaign = await db.campaigns.find_one({
        "_id": campaign_id,
        "user_id": current_user.id
    })
    
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    # Get all scripts for this campaign and workflow
    scripts = await db.campaign_workflow_scripts.find({
        "campaign_id": campaign_id,
        "workflow_function": workflow_function,
        "user_id": current_user.id
    }).to_list(length=None)
    
    # Convert to dictionary keyed by node_id
    scripts_dict = {}
    for script in scripts:
        script_dict = dict(script)
        script_dict['id'] = str(script_dict['_id'])
        del script_dict['_id']
        node_id = script_dict['node_id']
        scripts_dict[node_id] = CampaignWorkflowNodeScriptResponse(**script_dict)
    
    return scripts_dict

