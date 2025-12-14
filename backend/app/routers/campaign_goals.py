from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import random
import uuid
from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.models.user import UserResponse
from app.models.campaign_goal import (
    CampaignGoalCreate, 
    CampaignGoalUpdate, 
    CampaignGoalResponse,
    CampaignGoalStats
)

router = APIRouter()

# Predefined gradient colors with 3+ colors like in the image
# 4 specific gradient colors based on the provided design
GRADIENT_COLORS = [
    "linear-gradient(to right, #667eea, #764ba2, #f093fb)",  # Blue-purple-pink (Book a Meeting)
    "linear-gradient(to right, #f093fb, #a18cd1, #667eea)",  # Pink-purple-blue (Revitalize Pipeline)
    "linear-gradient(to right, #4facfe, #00f2fe, #43e97b)",  # Blue-cyan-green (Trial Conversion)
    "linear-gradient(to right, #ffecd2, #fcb69f, #a8edea)",  # Orange-peach-light teal (Lead Nurturing)
]

@router.get("", response_model=List[CampaignGoalResponse])
async def get_campaign_goals(
    source: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get all campaign goals for the current user, optionally filtered by source"""
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    if source:
        filter_query["source"] = source
    
    goals_cursor = db.campaign_goals.find(filter_query).sort("created_at", -1)
    goals = await goals_cursor.to_list(length=None)
    
    result = []
    for goal in goals:
        goal_dict = dict(goal)
        goal_dict['id'] = str(goal_dict['_id'])
        del goal_dict['_id']
        result.append(CampaignGoalResponse(**goal_dict))
    
    return result

@router.post("", response_model=CampaignGoalResponse)
async def create_campaign_goal(
    goal_data: CampaignGoalCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new campaign goal"""
    db = get_database()
    
    # Check if goal name already exists for this user
    existing_goal = await db.campaign_goals.find_one({
        "user_id": current_user.id,
        "name": goal_data.name
    })
    
    if existing_goal:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign goal with this name already exists"
        )
    
    # Auto-assign a random gradient color if not provided
    color_gradient = goal_data.color_gradient
    if not color_gradient:
        # Get existing gradient colors for this user to avoid duplicates
        existing_goals = await db.campaign_goals.find(
            {"user_id": current_user.id}, 
            {"color_gradient": 1}
        ).to_list(length=None)
        
        used_gradients = {goal.get("color_gradient") for goal in existing_goals if goal.get("color_gradient")}
        available_gradients = [grad for grad in GRADIENT_COLORS if grad not in used_gradients]
        
        # If all gradients are used, use any random one
        if available_gradients:
            color_gradient = random.choice(available_gradients)
        else:
            color_gradient = random.choice(GRADIENT_COLORS)
    
    # Create goal document
    goal_doc = {
        "name": goal_data.name,
        "description": goal_data.description,
        "color_gradient": color_gradient,
        "source": goal_data.source,
        "is_active": goal_data.is_active,
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert goal
    result = await db.campaign_goals.insert_one(goal_doc)
    goal_id = str(result.inserted_id)
    goal_doc['id'] = goal_id
    del goal_doc['_id']
    
    # Automatically create 2 workflows for this goal
    source = goal_data.source or "convention-activities"
    
    try:
        # 1. Create ForSkale template workflow with default nodes
        forskale_function = f"{source}-forskale"
        
        # Create nodes first
        node1_id = str(uuid.uuid4())
        node2_id = str(uuid.uuid4())
        node3_id = str(uuid.uuid4())
        node4_id = str(uuid.uuid4())
        
        forskale_nodes = [
            {
                "id": node1_id,
                "type": "telegram",
                "position": {"x": 100, "y": 100},
                "data": {"max_no_response_time": 24},
                "title": "Telegram Message"
            },
            {
                "id": node2_id,
                "type": "ai-call",
                "position": {"x": 300, "y": 100},
                "data": {"max_no_response_time": 48},
                "title": "AI Voice Call"
            },
            {
                "id": node3_id,
                "type": "whatsapp",
                "position": {"x": 500, "y": 100},
                "data": {"max_no_response_time": 24},
                "title": "WhatsApp Message"
            },
            {
                "id": node4_id,
                "type": "linkedin",
                "position": {"x": 700, "y": 100},
                "data": {"max_no_response_time": 48},
                "title": "LinkedIn Message"
            }
        ]
        
        # Create connections using node IDs
        forskale_connections = [
            {
                "id": str(uuid.uuid4()),
                "source": node1_id,
                "target": node2_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node2_id,
                "target": node3_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node3_id,
                "target": node4_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            }
        ]
        
        forskale_workflow = {
            "function": forskale_function,
            "name": f"ForSkale Template - {goal_data.name}",
            "description": f"Default ForSkale template workflow for {goal_data.name}",
            "user_id": current_user.id,
            "campaign_goal_id": goal_id,
            "template_type": "forskale",
            "nodes": forskale_nodes,
            "connections": forskale_connections,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Validate nodes before inserting
        if not forskale_nodes or len(forskale_nodes) == 0:
            raise ValueError("ForSkale template must have nodes!")
        
        result = await db.workflows.insert_one(forskale_workflow)
        
        # Verify the workflow was created correctly
        created_workflow = await db.workflows.find_one({"_id": result.inserted_id})
        if not created_workflow:
            raise ValueError("Failed to create ForSkale workflow")
        
        created_nodes = created_workflow.get("nodes", [])
        if len(created_nodes) == 0:
            raise ValueError(f"ForSkale workflow created but has no nodes! Workflow ID: {result.inserted_id}")
        
        print(f"✅ Created ForSkale template workflow with {len(forskale_nodes)} nodes and {len(forskale_connections)} connections")
        print(f"   Workflow ID: {result.inserted_id}")
        print(f"   Nodes: {[node['type'] for node in forskale_nodes]}")
        print(f"   Verified: Workflow in DB has {len(created_nodes)} nodes")
    except Exception as e:
        print(f"❌ Error creating ForSkale template workflow: {str(e)}")
        import traceback
        traceback.print_exc()
        # Re-raise exception to prevent creating goal without ForSkale template
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create ForSkale template workflow: {str(e)}"
        )
    
    # 2. Create Personal template workflow (empty, for user to configure)
    personal_function = f"{source}-user"
    personal_workflow = {
        "function": personal_function,
        "name": f"Personal Template - {goal_data.name}",
        "description": f"Personal template workflow for {goal_data.name} (configure as needed)",
        "user_id": current_user.id,
        "campaign_goal_id": goal_id,
        "template_type": "user",
        "nodes": [],
        "connections": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.workflows.insert_one(personal_workflow)
    
    return CampaignGoalResponse(**goal_doc)

@router.get("/{goal_id}", response_model=CampaignGoalResponse)
async def get_campaign_goal(
    goal_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific campaign goal"""
    db = get_database()
    
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal ID format: {str(e)}"
        )
    
    goal = await db.campaign_goals.find_one({
        "_id": goal_object_id,
        "user_id": current_user.id
    })
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign goal not found"
        )
    
    goal_dict = dict(goal)
    goal_dict['id'] = str(goal_dict['_id'])
    del goal_dict['_id']
    
    return CampaignGoalResponse(**goal_dict)

@router.put("/{goal_id}", response_model=CampaignGoalResponse)
async def update_campaign_goal(
    goal_id: str,
    goal_data: CampaignGoalUpdate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Update a campaign goal"""
    db = get_database()
    
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal ID format: {str(e)}"
        )
    
    # Check if goal exists
    goal = await db.campaign_goals.find_one({
        "_id": goal_object_id,
        "user_id": current_user.id
    })
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign goal not found"
        )
    
    # Check if new name conflicts with existing goals
    if goal_data.name and goal_data.name != goal["name"]:
        existing_goal = await db.campaign_goals.find_one({
            "user_id": current_user.id,
            "name": goal_data.name,
            "_id": {"$ne": goal_object_id}
        })
        
        if existing_goal:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campaign goal with this name already exists"
            )
    
    # Prepare update data
    update_data = {"updated_at": datetime.utcnow()}
    
    if goal_data.name is not None:
        update_data["name"] = goal_data.name
    if goal_data.description is not None:
        update_data["description"] = goal_data.description
    if goal_data.color_gradient is not None:
        update_data["color_gradient"] = goal_data.color_gradient
    if goal_data.is_active is not None:
        update_data["is_active"] = goal_data.is_active
    
    # Update goal
    result = await db.campaign_goals.update_one(
        {"_id": goal_object_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update campaign goal"
        )
    
    # Return updated goal
    updated_goal = await db.campaign_goals.find_one({"_id": goal_object_id})
    goal_dict = dict(updated_goal)
    goal_dict['id'] = str(goal_dict['_id'])
    del goal_dict['_id']
    
    return CampaignGoalResponse(**goal_dict)

@router.delete("/{goal_id}")
async def delete_campaign_goal(
    goal_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Delete a campaign goal"""
    db = get_database()
    
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal ID format: {str(e)}"
        )
    
    # Check if goal exists
    goal = await db.campaign_goals.find_one({
        "_id": goal_object_id,
        "user_id": current_user.id
    })
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign goal not found"
        )
    
    # Delete goal
    result = await db.campaign_goals.delete_one({"_id": goal_object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete campaign goal"
        )
    
    return {"message": "Campaign goal deleted successfully"}

@router.post("/{goal_id}/recreate-workflows")
async def recreate_workflows_for_goal(
    goal_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Recreate workflows for a goal if they don't exist or are empty"""
    db = get_database()
    
    try:
        goal_object_id = ObjectId(goal_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid goal ID format: {str(e)}"
        )
    
    # Check if goal exists
    goal = await db.campaign_goals.find_one({
        "_id": goal_object_id,
        "user_id": current_user.id
    })
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign goal not found"
        )
    
    source = goal.get("source") or "convention-activities"
    
    # Check existing workflows
    existing_workflows = await db.workflows.find({
        "user_id": current_user.id,
        "campaign_goal_id": goal_id
    }).to_list(length=None)
    
    forskale_workflow = next((w for w in existing_workflows if w.get("template_type") == "forskale"), None)
    personal_workflow = next((w for w in existing_workflows if w.get("template_type") == "user"), None)
    
    created_count = 0
    
    # Recreate ForSkale template if missing or empty
    if not forskale_workflow or not forskale_workflow.get("nodes") or len(forskale_workflow.get("nodes", [])) == 0:
        # Create nodes
        node1_id = str(uuid.uuid4())
        node2_id = str(uuid.uuid4())
        node3_id = str(uuid.uuid4())
        node4_id = str(uuid.uuid4())
        
        forskale_nodes = [
            {
                "id": node1_id,
                "type": "telegram",
                "position": {"x": 100, "y": 100},
                "data": {"max_no_response_time": 24},
                "title": "Telegram Message"
            },
            {
                "id": node2_id,
                "type": "ai-call",
                "position": {"x": 300, "y": 100},
                "data": {"max_no_response_time": 48},
                "title": "AI Voice Call"
            },
            {
                "id": node3_id,
                "type": "whatsapp",
                "position": {"x": 500, "y": 100},
                "data": {"max_no_response_time": 24},
                "title": "WhatsApp Message"
            },
            {
                "id": node4_id,
                "type": "linkedin",
                "position": {"x": 700, "y": 100},
                "data": {"max_no_response_time": 48},
                "title": "LinkedIn Message"
            }
        ]
        
        forskale_connections = [
            {
                "id": str(uuid.uuid4()),
                "source": node1_id,
                "target": node2_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node2_id,
                "target": node3_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node3_id,
                "target": node4_id,
                "sourceHandle": None,
                "targetHandle": None,
                "strokeType": "solid"
            }
        ]
        
        if forskale_workflow:
            # Update existing workflow
            await db.workflows.update_one(
                {"_id": forskale_workflow["_id"]},
                {"$set": {
                    "nodes": forskale_nodes,
                    "connections": forskale_connections,
                    "updated_at": datetime.utcnow()
                }}
            )
            print(f"✅ Updated ForSkale template workflow with {len(forskale_nodes)} nodes")
        else:
            # Create new workflow
            forskale_function = f"{source}-forskale"
            new_forskale_workflow = {
                "function": forskale_function,
                "name": f"ForSkale Template - {goal.get('name', '')}",
                "description": f"Default ForSkale template workflow for {goal.get('name', '')}",
                "user_id": current_user.id,
                "campaign_goal_id": goal_id,
                "template_type": "forskale",
                "nodes": forskale_nodes,
                "connections": forskale_connections,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.workflows.insert_one(new_forskale_workflow)
            print(f"✅ Created ForSkale template workflow with {len(forskale_nodes)} nodes")
        created_count += 1
    
    # Recreate Personal template if missing
    if not personal_workflow:
        personal_function = f"{source}-user"
        new_personal_workflow = {
            "function": personal_function,
            "name": f"Personal Template - {goal.get('name', '')}",
            "description": f"Personal template workflow for {goal.get('name', '')} (configure as needed)",
            "user_id": current_user.id,
            "campaign_goal_id": goal_id,
            "template_type": "user",
            "nodes": [],
            "connections": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.workflows.insert_one(new_personal_workflow)
        print(f"✅ Created Personal template workflow (empty)")
        created_count += 1
    
    return {
        "message": f"Workflows recreated successfully. {created_count} workflow(s) created/updated.",
        "created_count": created_count
    }

@router.get("/stats/summary", response_model=CampaignGoalStats)
async def get_campaign_goal_stats(
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get campaign goal statistics"""
    db = get_database()
    
    total_goals = await db.campaign_goals.count_documents({"user_id": current_user.id})
    active_goals = await db.campaign_goals.count_documents({
        "user_id": current_user.id,
        "is_active": True
    })
    inactive_goals = total_goals - active_goals
    
    return CampaignGoalStats(
        total_goals=total_goals,
        active_goals=active_goals,
        inactive_goals=inactive_goals
    )
