from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowNode,
    WorkflowConnection
)

router = APIRouter()

@router.get("", response_model=Optional[WorkflowResponse])
async def get_workflow(
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get workflow by function for current user"""
    db = get_database()
    collection = db["workflows"]
    
    workflow = await collection.find_one({
        "user_id": current_user.id,
        "function": function
    })
    
    if not workflow:
        return None
    
    # Convert ObjectId to string
    workflow["id"] = str(workflow["_id"])
    del workflow["_id"]
    
    return WorkflowResponse(**workflow)

@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: WorkflowCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new workflow"""
    db = get_database()
    collection = db["workflows"]
    
    # Check if workflow already exists for this function
    existing = await collection.find_one({
        "user_id": current_user.id,
        "function": workflow.function
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow for function '{workflow.function}' already exists. Use PUT to update."
        )
    
    workflow_dict = workflow.model_dump()
    workflow_dict["user_id"] = current_user.id
    workflow_dict["created_at"] = datetime.utcnow()
    workflow_dict["updated_at"] = datetime.utcnow()
    
    result = await collection.insert_one(workflow_dict)
    
    # Fetch the created workflow
    created_workflow = await collection.find_one({"_id": result.inserted_id})
    created_workflow["id"] = str(created_workflow["_id"])
    del created_workflow["_id"]
    
    return WorkflowResponse(**created_workflow)

@router.put("", response_model=WorkflowResponse)
async def update_workflow(
    workflow: WorkflowUpdate,
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update existing workflow or create if not exists"""
    db = get_database()
    collection = db["workflows"]
    
    # Check if workflow exists
    existing = await collection.find_one({
        "user_id": current_user.id,
        "function": function
    })
    
    update_data = workflow.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    if existing:
        # Update existing workflow
        await collection.update_one(
            {"_id": existing["_id"]},
            {"$set": update_data}
        )
        
        # Fetch updated workflow
        updated_workflow = await collection.find_one({"_id": existing["_id"]})
        updated_workflow["id"] = str(updated_workflow["_id"])
        del updated_workflow["_id"]
        
        return WorkflowResponse(**updated_workflow)
    else:
        # Create new workflow if not exists
        new_workflow = WorkflowCreate(
            function=function,
            name=update_data.get("name"),
            description=update_data.get("description"),
            nodes=update_data.get("nodes", []),
            connections=update_data.get("connections", [])
        )
        
        workflow_dict = new_workflow.model_dump()
        workflow_dict["user_id"] = current_user.id
        workflow_dict["created_at"] = datetime.utcnow()
        workflow_dict["updated_at"] = datetime.utcnow()
        
        result = await collection.insert_one(workflow_dict)
        
        # Fetch the created workflow
        created_workflow = await collection.find_one({"_id": result.inserted_id})
        created_workflow["id"] = str(created_workflow["_id"])
        del created_workflow["_id"]
        
        return WorkflowResponse(**created_workflow)

@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete workflow by function"""
    db = get_database()
    collection = db["workflows"]
    
    result = await collection.delete_one({
        "user_id": current_user.id,
        "function": function
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow for function '{function}' not found"
        )
    
    return None

