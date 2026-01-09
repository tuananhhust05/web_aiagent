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
                "label": "yes"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node2_id,
                "target": node3_id,
                "sourceHandle": None,
                "targetHandle": None,
                "label": "yes"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node3_id,
                "target": node4_id,
                "sourceHandle": None,
                "targetHandle": None,
                "label": "yes"
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
                "label": "yes"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node2_id,
                "target": node3_id,
                "sourceHandle": None,
                "targetHandle": None,
                "label": "yes"
            },
            {
                "id": str(uuid.uuid4()),
                "source": node3_id,
                "target": node4_id,
                "sourceHandle": None,
                "targetHandle": None,
                "label": "yes"
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

@router.get("/{goal_id}/kpi", response_model=dict)
async def get_goal_kpi(
    goal_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get aggregated KPI data for a goal (sum of all campaigns in the goal)"""
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
    
    # Parse date filters
    start_datetime = None
    end_datetime = None
    if start_date:
        try:
            # Handle both ISO format and YYYY-MM-DD format
            if 'T' in start_date or 'Z' in start_date:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                # YYYY-MM-DD format from date input
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
        except Exception as e:
            print(f"Error parsing start_date: {e}")
            pass
    if end_date:
        try:
            # Handle both ISO format and YYYY-MM-DD format
            if 'T' in end_date or 'Z' in end_date:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                # YYYY-MM-DD format from date input - set to end of day
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
                end_datetime = datetime.combine(end_datetime.date(), datetime.max.time())
        except Exception as e:
            print(f"Error parsing end_date: {e}")
            pass
    
    # Get all campaigns for this goal
    campaign_query = {
        "campaign_goal_id": goal_id,
        "user_id": current_user.id
    }
    
    campaigns = await db.campaigns.find(campaign_query).to_list(length=None)
    campaign_ids = [str(c["_id"]) for c in campaigns]
    
    if not campaign_ids:
        # Return empty KPI structure
        return {
            "outreach": {"attempts": 0},
            "delivery": {"success": 0, "rate": 0},
            "engagement": {
                "rate": 0,
                "view_open": 0,
                "interaction": 0,
                "details": {}
            },
            "response": {"rate": 0, "count": 0},
            "goal_conversions": {"count": 0, "rate": 0},
            "channels": {
                "email": {"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "replied": 0, "conversions": 0},
                "whatsapp": {"sent": 0, "delivered": 0, "read": 0, "clicked": 0, "replied": 0, "conversions": 0},
                "telegram": {"sent": 0, "delivered": 0, "read": 0, "clicked": 0, "replied": 0, "conversions": 0},
                "linkedin": {"sent": 0, "delivered": 0, "viewed": 0, "clicked": 0, "replied": 0, "conversions": 0},
                "ai_voice": {"attempted": 0, "answered": 0, "duration_10s": 0, "duration_30s": 0, "completed": 0, "positive": 0, "conversions": 0}
            }
        }
    
    # Initialize metrics
    metrics = {
        "email": {"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "replied": 0, "conversions": 0},
        "whatsapp": {"sent": 0, "delivered": 0, "read": 0, "clicked": 0, "replied": 0, "conversions": 0},
        "telegram": {"sent": 0, "delivered": 0, "read": 0, "clicked": 0, "replied": 0, "conversions": 0},
        "linkedin": {"sent": 0, "delivered": 0, "viewed": 0, "clicked": 0, "replied": 0, "conversions": 0},
        "ai_voice": {"attempted": 0, "answered": 0, "duration_10s": 0, "duration_30s": 0, "completed": 0, "positive": 0, "conversions": 0}
    }

    # Aggregate real sent counts from campaign_messages (logged when flows execute)
    send_query = {
        "campaign_id": {"$in": campaign_ids},
        "user_id": current_user.id
    }
    if start_datetime:
        send_query["created_at"] = {"$gte": start_datetime}
    if end_datetime:
        if "created_at" in send_query:
            send_query["created_at"]["$lte"] = end_datetime
        else:
            send_query["created_at"] = {"$lte": end_datetime}

    campaign_messages = await db.campaign_messages.find(send_query).to_list(length=None)

    for msg in campaign_messages:
        channel = msg.get("channel")
        if channel in metrics and "sent" in metrics[channel]:
            metrics[channel]["sent"] += 1
            # For now, consider sent == delivered so delivery stats work
            if "delivered" in metrics[channel]:
                metrics[channel]["delivered"] += 1
    
    # Aggregate data from calls
    # campaign_id is stored as string in calls collection
    call_query = {
        "campaign_id": {"$in": campaign_ids},
        "user_id": current_user.id
    }
    if start_datetime:
        call_query["created_at"] = {"$gte": start_datetime}
    if end_datetime:
        if "created_at" in call_query:
            call_query["created_at"]["$lte"] = end_datetime
        else:
            call_query["created_at"] = {"$lte": end_datetime}
    
    calls = await db.calls.find(call_query).to_list(length=None)
    
    for call in calls:
        metrics["ai_voice"]["attempted"] += 1
        if call.get("status") == "completed":
            metrics["ai_voice"]["answered"] += 1
            duration = call.get("duration", 0)
            if duration >= 10:
                metrics["ai_voice"]["duration_10s"] += 1
            if duration >= 30:
                metrics["ai_voice"]["duration_30s"] += 1
            if call.get("meeting_booked"):
                metrics["ai_voice"]["completed"] += 1
            if call.get("sentiment") == "positive":
                metrics["ai_voice"]["positive"] += 1
    
    # Aggregate data from inbox responses
    # campaign_id is stored as string in inbox_responses collection
    inbox_query = {
        "campaign_id": {"$in": campaign_ids},
        "user_id": current_user.id
    }
    if start_datetime:
        inbox_query["created_at"] = {"$gte": start_datetime}
    if end_datetime:
        if "created_at" in inbox_query:
            inbox_query["created_at"]["$lte"] = end_datetime
        else:
            inbox_query["created_at"] = {"$lte": end_datetime}
    
    inbox_responses = await db.inbox_responses.find(inbox_query).to_list(length=None)
    
    # Count responses by platform
    for response in inbox_responses:
        platform = response.get("platform", "").lower()
        if platform == "email":
            metrics["email"]["replied"] += 1
        elif platform == "whatsapp":
            metrics["whatsapp"]["replied"] += 1
        elif platform == "telegram":
            metrics["telegram"]["replied"] += 1
        elif platform == "linkedin":
            metrics["linkedin"]["replied"] += 1
    
    # If we don't have any logged sends yet (older campaigns), fall back to estimation
    if not campaign_messages:
        # Calculate sent/delivered from campaigns
        # For active campaigns, estimate based on contacts and workflow execution
        # Note: This is a simplified calculation - in production, should track each actual message send
        total_contacts = set()
        active_campaigns = [c for c in campaigns if c.get("status") == "active"]
        
        for campaign in active_campaigns:
            total_contacts.update(campaign.get("contacts", []))
            contacts_count = len(campaign.get("contacts", []))
            flow = campaign.get("flow", ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
            
            # Estimate sent based on flow channels (each channel sends to all contacts)
            for channel in flow:
                if channel == 'email':
                    metrics["email"]["sent"] += contacts_count
                    metrics["email"]["delivered"] += int(contacts_count * 0.95)  # Estimate 95% delivery rate
                elif channel == 'whatsapp':
                    metrics["whatsapp"]["sent"] += contacts_count
                    metrics["whatsapp"]["delivered"] += int(contacts_count * 0.98)  # Estimate 98% delivery rate
                elif channel == 'telegram':
                    metrics["telegram"]["sent"] += contacts_count
                    metrics["telegram"]["delivered"] += int(contacts_count * 0.97)  # Estimate 97% delivery rate
                elif channel == 'linkedin':
                    metrics["linkedin"]["sent"] += contacts_count
                    metrics["linkedin"]["delivered"] += int(contacts_count * 0.90)  # Estimate 90% delivery rate
    
    # For AI Voice, use actual data from calls collection (already calculated above)
    # metrics["ai_voice"] is already populated from calls query
    
    # Calculate aggregated metrics
    total_outreach = (
        metrics["email"]["sent"] +
        metrics["whatsapp"]["sent"] +
        metrics["telegram"]["sent"] +
        metrics["linkedin"]["sent"] +
        metrics["ai_voice"]["attempted"]
    )
    
    total_delivered = (
        metrics["email"]["delivered"] +
        metrics["whatsapp"]["delivered"] +
        metrics["telegram"]["delivered"] +
        metrics["linkedin"]["delivered"] +
        metrics["ai_voice"]["answered"]
    )
    
    total_view_open = (
        metrics["email"]["opened"] +
        metrics["whatsapp"]["read"] +
        metrics["telegram"]["read"] +
        metrics["linkedin"]["viewed"]
    )
    
    total_interaction = (
        metrics["email"]["clicked"] +
        metrics["whatsapp"]["clicked"] +
        metrics["telegram"]["clicked"] +
        metrics["linkedin"]["clicked"] +
        metrics["ai_voice"]["duration_30s"]
    )
    
    total_response = (
        metrics["email"]["replied"] +
        metrics["whatsapp"]["replied"] +
        metrics["telegram"]["replied"] +
        metrics["linkedin"]["replied"] +
        metrics["ai_voice"]["positive"]
    )
    
    total_conversions = (
        metrics["email"]["conversions"] +
        metrics["whatsapp"]["conversions"] +
        metrics["telegram"]["conversions"] +
        metrics["linkedin"]["conversions"] +
        metrics["ai_voice"]["conversions"]
    )
    
    delivery_rate = (total_delivered / total_outreach * 100) if total_outreach > 0 else 0
    engagement_rate = (total_interaction / total_delivered * 100) if total_delivered > 0 else 0
    response_rate = (total_response / total_delivered * 100) if total_delivered > 0 else 0
    conversion_rate = (total_conversions / total_delivered * 100) if total_delivered > 0 else 0
    
    return {
        "outreach": {"attempts": total_outreach},
        "delivery": {"success": total_delivered, "rate": round(delivery_rate, 2)},
        "engagement": {
            "rate": round(engagement_rate, 2),
            "view_open": total_view_open,
            "interaction": total_interaction,
            "details": {
                "email": {
                    "opened": metrics["email"]["opened"],
                    "clicked": metrics["email"]["clicked"]
                },
                "whatsapp": {
                    "read": metrics["whatsapp"]["read"],
                    "clicked": metrics["whatsapp"]["clicked"]
                },
                "telegram": {
                    "read": metrics["telegram"]["read"],
                    "clicked": metrics["telegram"]["clicked"]
                },
                "linkedin": {
                    "viewed": metrics["linkedin"]["viewed"],
                    "clicked": metrics["linkedin"]["clicked"]
                },
                "ai_voice": {
                    "answered": metrics["ai_voice"]["answered"],
                    "duration_10s": metrics["ai_voice"]["duration_10s"],
                    "duration_30s": metrics["ai_voice"]["duration_30s"],
                    "completed": metrics["ai_voice"]["completed"]
                }
            }
        },
        "response": {"rate": round(response_rate, 2), "count": total_response},
        "goal_conversions": {"count": total_conversions, "rate": round(conversion_rate, 2)},
        "channels": metrics
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
