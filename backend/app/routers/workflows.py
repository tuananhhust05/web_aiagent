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

@router.get("/by-goal/{goal_id}", response_model=List[dict])
async def get_workflows_by_goal(
    goal_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all workflows for a specific goal"""
    db = get_database()
    
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID format"
        )
    
    # Verify goal belongs to user
    goal = await db.campaign_goals.find_one({
        "_id": goal_object_id,
        "user_id": current_user.id
    })
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign goal not found"
        )
    
    # Get workflows for this goal
    workflows = await db.workflows.find({
        "user_id": current_user.id,
        "campaign_goal_id": goal_id
    }).to_list(length=None)
    
    result = []
    for workflow in workflows:
        workflow_dict = dict(workflow)
        workflow_dict["id"] = str(workflow_dict["_id"])
        del workflow_dict["_id"]
        result.append(workflow_dict)
    
    return result

@router.get("/{workflow_id}", response_model=Optional[WorkflowResponse])
async def get_workflow_by_id(
    workflow_id: str,
    campaign_id: Optional[str] = Query(None, description="Optional campaign ID to load campaign-specific scripts"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get workflow by ID"""
    db = get_database()
    collection = db["workflows"]
    
    try:
        workflow_object_id = ObjectId(workflow_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID format"
        )
    
    workflow = await collection.find_one({
        "_id": workflow_object_id,
        "user_id": current_user.id
    })
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    # Convert ObjectId to string
    workflow["id"] = str(workflow["_id"])
    del workflow["_id"]
    
    # If campaign_id is provided, load campaign-specific scripts and merge with nodes
    if campaign_id:
        # Verify campaign belongs to user
        campaign = await db.campaigns.find_one({
            "_id": campaign_id,
            "user_id": current_user.id
        })
        
        if campaign:
            # Get workflow function for script lookup
            workflow_function = workflow.get("function", "")
            
            # Get all scripts for this campaign and workflow
            scripts = await db.campaign_workflow_scripts.find({
                "campaign_id": campaign_id,
                "workflow_function": workflow_function,
                "user_id": current_user.id
            }).to_list(length=None)
            
            # Create a dictionary of scripts by node_id
            scripts_by_node = {script["node_id"]: script for script in scripts}
            
            # Merge scripts into workflow nodes
            if "nodes" in workflow and workflow["nodes"]:
                for node in workflow["nodes"]:
                    node_id = node.get("id")
                    if node_id and node_id in scripts_by_node:
                        script_data = scripts_by_node[node_id]
                        # Add campaign script to node data
                        if "data" not in node:
                            node["data"] = {}
                        node["data"]["campaign_script"] = script_data.get("script", "")
                        node["data"]["campaign_script_id"] = str(script_data["_id"])
                        node["data"]["campaign_config"] = script_data.get("config", {})
    
    return WorkflowResponse(**workflow)

@router.get("", response_model=Optional[WorkflowResponse])
async def get_workflow(
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    campaign_id: Optional[str] = Query(None, description="Optional campaign ID to load campaign-specific scripts"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get workflow by function for current user. If campaign_id is provided, also load campaign-specific node scripts."""
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
    
    # If campaign_id is provided, load campaign-specific scripts and merge with nodes
    if campaign_id:
        # Verify campaign belongs to user
        campaign = await db.campaigns.find_one({
            "_id": campaign_id,
            "user_id": current_user.id
        })
        
        if campaign:
            # Get all scripts for this campaign and workflow
            scripts = await db.campaign_workflow_scripts.find({
                "campaign_id": campaign_id,
                "workflow_function": function,
                "user_id": current_user.id
            }).to_list(length=None)
            
            # Create a dictionary of scripts by node_id
            scripts_by_node = {script["node_id"]: script for script in scripts}
            
            # Merge scripts into workflow nodes
            if "nodes" in workflow and workflow["nodes"]:
                for node in workflow["nodes"]:
                    node_id = node.get("id")
                    if node_id and node_id in scripts_by_node:
                        script_data = scripts_by_node[node_id]
                        # Add campaign script to node data
                        if "data" not in node:
                            node["data"] = {}
                        node["data"]["campaign_script"] = script_data.get("script", "")
                        node["data"]["campaign_script_id"] = str(script_data["_id"])
                        node["data"]["campaign_config"] = script_data.get("config", {})
    
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

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow_by_id(
    workflow_id: str,
    workflow: WorkflowUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update existing workflow by ID or create if not exists"""
    db = get_database()
    collection = db["workflows"]
    
    try:
        workflow_object_id = ObjectId(workflow_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID format"
        )
    
    # Check if workflow exists
    existing = await collection.find_one({
        "_id": workflow_object_id,
        "user_id": current_user.id
    })
    
    update_data = workflow.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    if existing:
        # Update existing workflow
        await collection.update_one(
            {"_id": workflow_object_id},
            {"$set": update_data}
        )
        
        # Fetch updated workflow
        updated_workflow = await collection.find_one({"_id": workflow_object_id})
        updated_workflow["id"] = str(updated_workflow["_id"])
        del updated_workflow["_id"]
        
        return WorkflowResponse(**updated_workflow)
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )

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


@router.get("/company-workflows", response_model=List[dict])
async def get_company_workflows(
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get all workflows for a function from colleagues in the same company.
    Returns list of workflows with owner info.
    """
    db = get_database()
    
    # User must belong to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must belong to a company to view company workflows"
        )
    
    # Get all users in the same company (excluding current user)
    company_users = await db.users.find({
        "company_id": current_user.company_id,
        "_id": {"$ne": current_user.id}
    }).to_list(length=None)
    
    company_user_ids = [user["_id"] for user in company_users]
    user_map = {user["_id"]: user for user in company_users}
    
    # Get workflows from company users for this function
    workflows = await db.workflows.find({
        "user_id": {"$in": company_user_ids},
        "function": function
    }).to_list(length=None)
    
    # Add owner info to each workflow
    result = []
    for workflow in workflows:
        owner = user_map.get(workflow["user_id"], {})
        result.append({
            "id": str(workflow["_id"]),
            "function": workflow.get("function"),
            "name": workflow.get("name"),
            "description": workflow.get("description"),
            "nodes": workflow.get("nodes", []),
            "connections": workflow.get("connections", []),
            "created_at": workflow.get("created_at"),
            "updated_at": workflow.get("updated_at"),
            "owner": {
                "id": workflow["user_id"],
                "first_name": owner.get("first_name", "Unknown"),
                "last_name": owner.get("last_name", "User"),
                "email": owner.get("email", ""),
                "avatar_url": owner.get("avatar_url")
            }
        })
    
    return result


@router.get("/colleagues-with-workflow", response_model=List[dict])
async def get_colleagues_with_workflow(
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get list of colleagues who have a workflow for this function.
    """
    db = get_database()
    
    # User must belong to a company
    if not current_user.company_id:
        return []
    
    # Get all users in the same company (excluding current user)
    company_users = await db.users.find({
        "company_id": current_user.company_id,
        "_id": {"$ne": current_user.id}
    }).to_list(length=None)
    
    company_user_ids = [user["_id"] for user in company_users]
    user_map = {user["_id"]: user for user in company_users}
    
    # Get workflows from company users for this function
    workflows = await db.workflows.find({
        "user_id": {"$in": company_user_ids},
        "function": function
    }).to_list(length=None)
    
    # Return list of colleagues who have workflows
    colleagues = []
    seen_ids = set()
    for workflow in workflows:
        user_id = workflow["user_id"]
        if user_id not in seen_ids:
            seen_ids.add(user_id)
            owner = user_map.get(user_id, {})
            colleagues.append({
                "id": user_id,
                "first_name": owner.get("first_name", "Unknown"),
                "last_name": owner.get("last_name", "User"),
                "email": owner.get("email", ""),
                "avatar_url": owner.get("avatar_url")
            })
    
    return colleagues


@router.get("/colleague/{colleague_id}", response_model=Optional[WorkflowResponse])
async def get_colleague_workflow(
    colleague_id: str,
    function: str = Query(..., description="Function name (e.g., convention-activities)"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get a specific colleague's workflow for a function.
    User must be in the same company as the colleague.
    """
    db = get_database()
    
    # User must belong to a company
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must belong to a company to view colleague workflows"
        )
    
    # Verify colleague is in the same company
    colleague = await db.users.find_one({
        "_id": colleague_id,
        "company_id": current_user.company_id
    })
    
    if not colleague:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colleague not found or not in your company"
        )
    
    # Get colleague's workflow
    workflow = await db.workflows.find_one({
        "user_id": colleague_id,
        "function": function
    })
    
    if not workflow:
        return None
    
    # Convert ObjectId to string
    workflow["id"] = str(workflow["_id"])
    del workflow["_id"]
    
    return WorkflowResponse(**workflow)

