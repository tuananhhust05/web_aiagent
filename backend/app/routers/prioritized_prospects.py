from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime
from bson import ObjectId
from typing import List, Optional, Dict, Any
import httpx
import json

from app.core.database import get_database
from app.core.auth import get_current_active_user
from app.core.config import settings
from app.models.user import UserResponse
from app.models.prioritized_prospect import (
    PrioritizedProspectCreate,
    PrioritizedProspectUpdate,
    PrioritizedProspectResponse,
    PrioritizedProspectListResponse,
    Channel
)
router = APIRouter()

async def get_contacts_detailed_internal(
    search: Optional[str],
    status: Optional[str],
    source: Optional[str],
    limit: int,
    skip: int,
    current_user: UserResponse
):
    """
    Internal function to get detailed contacts (duplicated from contacts router to avoid circular import).
    """
    from app.core.database import get_database
    db = get_database()
    
    # Build filter query
    filter_query = {"user_id": current_user.id}
    
    if search:
        filter_query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}}
        ]
    
    if status:
        filter_query["status"] = status
    if source:
        filter_query["source"] = source
    
    # Get contacts
    cursor = db.contacts.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    contacts = await cursor.to_list(length=limit)
    
    # Get all contact IDs
    contact_ids = [str(contact["_id"]) for contact in contacts]
    
    # Get all campaigns that contain any of these contacts
    campaigns_cursor = db.campaigns.find({
        "user_id": current_user.id,
        "contacts": {"$in": contact_ids}
    })
    all_campaigns = await campaigns_cursor.to_list(length=None)
    
    # Get all campaign goal IDs and workflow IDs
    campaign_goal_ids = []
    workflow_ids = []
    for campaign in all_campaigns:
        if campaign.get("campaign_goal_id"):
            campaign_goal_ids.append(campaign["campaign_goal_id"])
        if campaign.get("workflow_id"):
            workflow_ids.append(campaign["workflow_id"])
    
    # Get all campaign goals
    campaign_goals = {}
    if campaign_goal_ids:
        unique_goal_ids = list(set([gid for gid in campaign_goal_ids if gid]))
        valid_goal_object_ids = []
        invalid_goal_ids = []
        goal_id_mapping = {}
        
        for gid in unique_goal_ids:
            try:
                goal_obj_id = ObjectId(gid)
                goal_str_id = str(goal_obj_id)
                valid_goal_object_ids.append(goal_obj_id)
                goal_id_mapping[gid] = goal_str_id
                goal_id_mapping[goal_str_id] = goal_str_id
            except:
                invalid_goal_ids.append(gid)
                goal_id_mapping[gid] = gid
        
        if valid_goal_object_ids:
            goals_cursor = db.campaign_goals.find({
                "user_id": current_user.id,
                "_id": {"$in": valid_goal_object_ids}
            })
            goals_list = await goals_cursor.to_list(length=None)
            for goal in goals_list:
                goal_id = str(goal["_id"])
                goal_data = {
                    "id": goal_id,
                    "name": goal.get("name", ""),
                    "description": goal.get("description"),
                    "color_gradient": goal.get("color_gradient"),
                    "is_active": goal.get("is_active", True),
                    "source": goal.get("source")
                }
                campaign_goals[goal_id] = goal_data
                for orig_id, mapped_id in goal_id_mapping.items():
                    if mapped_id == goal_id:
                        campaign_goals[orig_id] = goal_data
        
        if invalid_goal_ids:
            for gid in invalid_goal_ids:
                goal = await db.campaign_goals.find_one({
                    "user_id": current_user.id,
                    "_id": gid
                })
                if goal:
                    goal_id = str(goal["_id"])
                    goal_data = {
                        "id": goal_id,
                        "name": goal.get("name", ""),
                        "description": goal.get("description"),
                        "color_gradient": goal.get("color_gradient"),
                        "is_active": goal.get("is_active", True),
                        "source": goal.get("source")
                    }
                    campaign_goals[gid] = goal_data
                    campaign_goals[goal_id] = goal_data
    
    # Get all workflows
    workflows = {}
    if workflow_ids:
        valid_workflow_object_ids = []
        for wid in workflow_ids:
            if wid:
                try:
                    valid_workflow_object_ids.append(ObjectId(wid))
                except:
                    pass
        
        if valid_workflow_object_ids:
            workflows_cursor = db.workflows.find({
                "user_id": current_user.id,
                "_id": {"$in": valid_workflow_object_ids}
            })
            workflows_list = await workflows_cursor.to_list(length=None)
            for workflow in workflows_list:
                workflow_id = str(workflow["_id"])
                workflows[workflow_id] = {
                    "id": workflow_id,
                    "function": workflow.get("function", ""),
                    "name": workflow.get("name"),
                    "description": workflow.get("description"),
                    "nodes": workflow.get("nodes", []),
                    "connections": workflow.get("connections", [])
                }
        
        for wid in workflow_ids:
            if wid not in workflows:
                workflow_by_function = await db.workflows.find_one({
                    "user_id": current_user.id,
                    "function": wid
                })
                if workflow_by_function:
                    workflows[wid] = {
                        "id": str(workflow_by_function["_id"]),
                        "function": workflow_by_function.get("function", wid),
                        "name": workflow_by_function.get("name"),
                        "description": workflow_by_function.get("description"),
                        "nodes": workflow_by_function.get("nodes", []),
                        "connections": workflow_by_function.get("connections", [])
                    }
    
    # Get all deals for these contacts
    deals_cursor = db.deals.find({
        "user_id": current_user.id,
        "contact_id": {"$in": contact_ids}
    })
    all_deals = await deals_cursor.to_list(length=None)
    
    # Organize deals by contact_id
    deals_by_contact = {}
    for deal in all_deals:
        contact_id = deal.get("contact_id")
        if contact_id:
            if contact_id not in deals_by_contact:
                deals_by_contact[contact_id] = []
            deals_by_contact[contact_id].append({
                "id": str(deal["_id"]),
                "name": deal.get("name", ""),
                "description": deal.get("description"),
                "status": deal.get("status"),
                "priority": deal.get("priority"),
                "amount": deal.get("amount", 0.0),
                "revenue": deal.get("revenue", 0.0),
                "cost": deal.get("cost", 0.0),
                "probability": deal.get("probability"),
                "expected_close_date": deal.get("expected_close_date"),
                "created_at": deal.get("created_at"),
                "updated_at": deal.get("updated_at")
            })
    
    # Build response
    result = []
    for contact in contacts:
        contact_id = str(contact["_id"])
        
        # Find campaigns containing this contact (only campaigns with workflow)
        contact_campaigns = []
        for campaign in all_campaigns:
            workflow_id = campaign.get("workflow_id")
            if contact_id in campaign.get("contacts", []) and workflow_id:
                campaign_info = {
                    "id": str(campaign["_id"]),
                    "name": campaign.get("name", ""),
                    "description": campaign.get("description"),
                    "status": campaign.get("status", ""),
                    "type": campaign.get("type", ""),
                    "source": campaign.get("source"),
                    "created_at": campaign.get("created_at"),
                    "updated_at": campaign.get("updated_at")
                }
                
                goal_id = campaign.get("campaign_goal_id")
                if goal_id and goal_id in campaign_goals:
                    campaign_info["campaign_goal"] = campaign_goals[goal_id]
                
                if workflow_id:
                    workflow_data = None
                    if workflow_id in workflows:
                        workflow_data = workflows[workflow_id]
                    else:
                        try:
                            workflow_obj_id = ObjectId(workflow_id)
                            workflow_str_id = str(workflow_obj_id)
                            if workflow_str_id in workflows:
                                workflow_data = workflows[workflow_str_id]
                        except:
                            pass
                        
                        if not workflow_data:
                            workflow_by_function = await db.workflows.find_one({
                                "user_id": current_user.id,
                                "function": workflow_id
                            })
                            if workflow_by_function:
                                workflow_data = {
                                    "id": str(workflow_by_function["_id"]),
                                    "function": workflow_by_function.get("function", workflow_id),
                                    "name": workflow_by_function.get("name"),
                                    "description": workflow_by_function.get("description"),
                                    "nodes": workflow_by_function.get("nodes", []),
                                    "connections": workflow_by_function.get("connections", [])
                                }
                    
                    if workflow_data:
                        campaign_info["workflow"] = workflow_data
                
                contact_campaigns.append(campaign_info)
        
        contact_deals = deals_by_contact.get(contact_id, [])
        
        contact_dict = dict(contact)
        contact_dict['id'] = contact_id
        del contact_dict['_id']
        
        result.append({
            **contact_dict,
            "campaigns": contact_campaigns,
            "deals": contact_deals
        })
    
    return result

@router.post("/generate", response_model=List[PrioritizedProspectResponse])
async def generate_prioritized_prospects(
    limit: int = Query(50, ge=1, le=100, description="Number of contacts to analyze"),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Generate prioritized prospects using AI based on contacts with campaigns, goals, and deals.
    """
    db = get_database()
    
    # Get detailed contacts data
    contacts_data = await get_contacts_detailed_internal(
        search=None,
        status=None,
        source=None,
        limit=limit,
        skip=0,
        current_user=current_user
    )
    
    if not contacts_data:
        return []
    
    # Prepare data for AI
    contacts_for_ai = []
    for contact in contacts_data:
        contact_dict = contact.dict() if hasattr(contact, 'dict') else contact
        contacts_for_ai.append({
            "id": contact_dict.get("id"),
            "name": f"{contact_dict.get('first_name', '')} {contact_dict.get('last_name', '')}".strip(),
            "email": contact_dict.get("email"),
            "company": contact_dict.get("company"),
            "campaigns": contact_dict.get("campaigns", []),
            "deals": contact_dict.get("deals", [])
        })
    
    # Call AI to generate prioritized prospects
    prioritized_prospects_data = await generate_prioritized_prospects_with_ai(
        contacts_for_ai,
        current_user.id
    )
    
    if not prioritized_prospects_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate prioritized prospects"
        )
    
    # Delete old prospects for this user
    await db.prioritized_prospects.delete_many({"user_id": current_user.id})
    
    # Create mapping of contact_id to full contact data
    contact_data_map = {}
    for contact in contacts_data:
        contact_dict = contact.dict() if hasattr(contact, 'dict') else contact
        contact_id = contact_dict.get("id")
        if contact_id:
            contact_data_map[contact_id] = contact_dict
    
    # Insert new prospects
    created_prospects = []
    for prospect_data in prioritized_prospects_data:
        prospect_id_from_ai = prospect_data.get("prospect_id", "")
        
        # Find matching contact data
        contact_data = contact_data_map.get(prospect_id_from_ai)
        campaign_data = []
        deal_data = []
        
        if contact_data:
            campaign_data = contact_data.get("campaigns", [])
            deal_data = contact_data.get("deals", [])
        
        # Parse AI tips
        ai_tips = []
        tips_data = prospect_data.get("ai_tips", [])
        if tips_data and isinstance(tips_data, list):
            for tip in tips_data:
                if isinstance(tip, dict) and tip.get("title") and tip.get("content"):
                    ai_tips.append({
                        "title": tip.get("title", ""),
                        "content": tip.get("content", ""),
                        "category": tip.get("category", "general")
                    })
        
        # If no tips from AI, generate default professional tips
        if not ai_tips:
            ai_tips = [
                {
                    "title": "Use Personalization",
                    "content": "Research shows that personalized messages have a 26% higher open rate. Use their name, reference their company, and mention specific details from previous interactions to create a genuine connection that demonstrates you've done your homework and value their business.",
                    "category": "personalization"
                },
                {
                    "title": "Timing Matters",
                    "content": "Strike while it's fresh in mind by following up shortly after your last interaction. Neuroscience research indicates that memory consolidation happens within 24-48 hours, making this the optimal window for maximum recall and engagement. This timing leverages the recency effect, where recent information is more easily remembered.",
                    "category": "timing"
                },
                {
                    "title": "Spark Curiosity",
                    "content": "Ask a thoughtful question that sparks curiosity and makes it easy to reply. Questions trigger the brain's reward system, creating anticipation and increasing the likelihood of a response by up to 50% compared to statements. Open-ended questions that relate to their business challenges work best.",
                    "category": "engagement"
                }
            ]
        
        # Get generated content from AI response
        generated_content = prospect_data.get("generated_content", "")
        
        # If no generated content from AI, create a default based on channel
        if not generated_content:
            contact_name = prospect_data.get("prospect_name", "").split(' ')[0] if prospect_data.get("prospect_name") else "there"
            channel = prospect_data.get("channel", "Gmail")
            
            if channel in ["Gmail", "Linkedin"]:
                generated_content = f"""Hi {contact_name},

I wanted to follow up regarding our recent discussion about {prospect_data.get("what", "your business needs")}. I hope everything is going well since our last interaction.

{prospect_data.get("reasoning", "I believe this could be valuable for you.")}

Are you available to discuss this further sometime this week? Let me know your availability.

Best regards,
[Your Name]"""
            elif channel in ["Telegram", "Whatsapp"]:
                generated_content = f"""Hi {contact_name}! 👋

I wanted to follow up on our recent discussion about {prospect_data.get("what", "your business needs")}. 

{prospect_data.get("reasoning", "I think this could be really valuable for you.")}

Would you be available to chat this week? Let me know what works for you!"""
            elif channel == "AI Call":
                generated_content = f"""Call Script for {contact_name}:

Opening:
- Greet warmly and reference previous interaction
- "Hi {contact_name}, this is [Your Name] from [Company]. I wanted to follow up on our recent discussion about {prospect_data.get("what", "your business needs")}."

Main Points:
- {prospect_data.get("what", "Discuss the main topic")}
- {prospect_data.get("reasoning", "Explain the value proposition")}
- Address any questions or concerns

Closing:
- Summarize next steps
- Confirm availability for follow-up
- Thank them for their time"""
        
        prospect_doc = {
            "_id": str(ObjectId()),
            "user_id": current_user.id,
            "prospect_id": prospect_id_from_ai,
            "prospect_name": prospect_data.get("prospect_name", ""),
            "what": prospect_data.get("what", ""),
            "when": prospect_data.get("when", ""),
            "channel": prospect_data.get("channel", "Gmail"),
            "priority": prospect_data.get("priority"),
            "confidence": prospect_data.get("confidence"),
            "reasoning": prospect_data.get("reasoning"),
            "generated_content": generated_content,
            "ai_tips": ai_tips if ai_tips else None,
            "contact_data": contact_data,
            "campaign_data": campaign_data,
            "deal_data": deal_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.prioritized_prospects.insert_one(prospect_doc)
        
        prospect_doc['id'] = prospect_doc['_id']
        del prospect_doc['_id']
        created_prospects.append(PrioritizedProspectResponse(**prospect_doc))
    
    return created_prospects

async def generate_prioritized_prospects_with_ai(
    contacts: List[Dict[str, Any]],
    user_id: str
) -> Optional[List[Dict[str, Any]]]:
    """
    Use AI to generate prioritized prospects from contacts data.
    """
    try:
        if not settings.GROQ_API_KEY:
            print("⚠️ [PRIORITIZED PROSPECTS] GROQ_API_KEY not configured")
            return None
        
        # Prepare context for AI
        contacts_summary = []
        for contact in contacts:
            campaigns_info = []
            for campaign in contact.get("campaigns", []):
                campaign_info = f"- Campaign: {campaign.get('name', 'N/A')}"
                if campaign.get("campaign_goal"):
                    campaign_info += f" (Goal: {campaign.get('campaign_goal', {}).get('name', 'N/A')})"
                campaigns_info.append(campaign_info)
            
            deals_info = []
            for deal in contact.get("deals", []):
                deals_info.append(f"- Deal: {deal.get('name', 'N/A')} - ${deal.get('amount', 0):,.0f}")
            
            # Build detailed contact summary for better AI context
            campaign_details = []
            for campaign in contact.get('campaigns', [])[:3]:
                campaign_name = campaign.get('name', 'N/A')
                campaign_goal = campaign.get('campaign_goal', {})
                goal_name = campaign_goal.get('name', '') if campaign_goal else ''
                workflow = campaign.get('workflow', {})
                workflow_name = workflow.get('name', '') if workflow else ''
                campaign_details.append(f"  • {campaign_name}" + (f" (Goal: {goal_name})" if goal_name else "") + (f" [Workflow: {workflow_name}]" if workflow_name else ""))
            
            deal_details = []
            for deal in contact.get('deals', [])[:3]:
                deal_name = deal.get('name', 'N/A')
                deal_amount = deal.get('amount', 0)
                deal_stage = deal.get('stage', '')
                deal_details.append(f"  • {deal_name} - ${deal_amount:,.0f}" + (f" ({deal_stage})" if deal_stage else ""))
            
            contact_summary = f"""
Contact: {contact.get('name', 'N/A')}
- Email: {contact.get('email', 'N/A')}
- Company: {contact.get('company', 'N/A')}
- Phone: {contact.get('phone', 'N/A')}
- Status: {contact.get('status', 'N/A')}
- Campaigns ({len(contact.get('campaigns', []))} total):
{chr(10).join(campaign_details) if campaign_details else '  • No active campaigns'}
- Deals ({len(contact.get('deals', []))} total):
{chr(10).join(deal_details) if deal_details else '  • No active deals'}
"""
            contacts_summary.append(contact_summary)
        
        # Create AI prompt
        prompt = f"""You are an AI Sales Assistant. Analyze the following contacts and their associated campaigns, goals, and deals to generate prioritized prospects.

For each contact, determine:
1. What action should be taken (e.g., "Send introduction email about the new product", "Follow up on proposal", "Schedule a demo call")
2. When to take action (e.g., "Today", "This week", "Within 3 days", "Next Monday")
3. Best channel to use: Gmail, Telegram, AI Call, Linkedin, or Whatsapp
4. Priority score (1-10, where 10 is highest priority)
5. Confidence score (0-100%)
6. Generated Content: Create a complete, ready-to-send email/message content based on the channel. For Gmail/Linkedin: write a professional email with greeting, body, and closing. For Telegram/Whatsapp: write a friendly, conversational message. For AI Call: write a call script with talking points. Make it personalized, specific to the contact's situation, campaigns, and deals.
7. AI Tips: Generate 3-5 professional, detailed sales coaching tips (each tip should be 3-5 sentences long, providing comprehensive, actionable advice based on neuroscience and sales psychology)

Available channels: Gmail, Telegram, AI Call, Linkedin, Whatsapp

Contacts Data:
{chr(10).join(contacts_summary)}

Return a JSON array with this exact format:
[
  {{
    "prospect_id": "contact_id_here",
    "prospect_name": "Contact Name",
    "what": "Specific action to take",
    "when": "When to take action",
    "channel": "Gmail|Telegram|AI Call|Linkedin|Whatsapp",
    "priority": 8,
    "confidence": 85.5,
    "reasoning": "Brief explanation why this prospect is prioritized",
    "generated_content": "Complete, ready-to-send email/message content. IMPORTANT: Reference specific details from the contact's data (company name, campaigns, deals, previous interactions). For Gmail/Linkedin: include greeting (Hi [Name],), 2-3 professional body paragraphs that mention their company, relevant campaigns/goals, or deals, include a clear call-to-action, and closing (Best regards, [Your Name]). For Telegram/Whatsapp: friendly, conversational tone but still professional, 2-3 short paragraphs, use emojis sparingly. For AI Call: structured call script with opening greeting, main talking points (reference their campaigns/deals), questions to ask, and closing. Make it highly personalized and specific to their situation.",
    "ai_tips": [
      {{
        "title": "Tip title (e.g., 'Use Personalization', 'Timing Matters', 'Engagement Strategy', 'Build Trust', 'Create Urgency')",
        "content": "Detailed, professional tip content (3-5 sentences minimum). Explain the strategy in depth, provide scientific reasoning based on sales psychology and neuroscience research, give specific examples of how to apply it, and explain the expected outcome. Make it actionable and professional. Each tip should be comprehensive and educational.",
        "category": "personalization|timing|engagement|communication|relationship|psychology|neuroscience"
      }}
    ]
  }}
]

IMPORTANT:
- Return ONLY valid JSON array, no additional text
- Include all contacts provided
- Prioritize contacts with active campaigns and deals
- Choose the most appropriate channel based on contact data
- Be specific and actionable in "what" field
- Use realistic timing in "when" field
- Priority should reflect urgency and potential value
- Generated Content must be complete, professional, and ready to send. CRITICAL: Reference specific details from the contact's information:
  * Use their actual name and company name
  * Mention specific campaigns they're involved in (use campaign names and goals)
  * Reference their deals if relevant (deal names, amounts, stages)
  * Show you understand their business context
- For Gmail/Linkedin emails: Use professional business tone, include proper greeting and closing, write 2-3 well-structured paragraphs that flow naturally, include a clear call-to-action, and make it actionable. Reference their company and specific campaigns/deals naturally in the content.
- For Telegram/Whatsapp: Use friendly, conversational tone, write 2-3 short paragraphs, use emojis sparingly (1-2 max), but maintain professionalism. Reference their company and campaigns naturally.
- For AI Call: Provide structured call script with: opening greeting, main talking points (reference their campaigns/deals specifically), questions to ask, objection handling points, and closing. Make it conversational and natural.
- AI Tips must be professional, detailed (3-5 sentences minimum each), and based on sales psychology/neuroscience
- Each tip should provide actionable advice that helps the salesperson improve their approach
- Tips should be relevant to the specific prospect and their situation
- Include scientific reasoning, specific application methods, and expected outcomes
- Make tips comprehensive, educational, and professional - think like a sales coach providing expert guidance
- Tips should cover different aspects: personalization, timing, engagement strategies, communication techniques, relationship building, psychological triggers
"""

        # Call Groq API
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Assistant that generates prioritized prospects based on contact data, campaigns, goals, and deals. Always return a valid JSON array. Generate detailed, professional sales coaching tips based on neuroscience and sales psychology."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 8000  # Increased for detailed tips
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(groq_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Parse JSON response
            try:
                # Clean content - remove markdown code blocks if present
                import re
                content_clean = content.strip()
                
                # Remove markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', content_clean, re.DOTALL)
                if json_match:
                    content_clean = json_match.group(1)
                else:
                    # Try to find JSON array directly
                    json_match = re.search(r'(\[.*\])', content_clean, re.DOTALL)
                    if json_match:
                        content_clean = json_match.group(1)
                
                # Parse JSON
                parsed = json.loads(content_clean)
                
                # Ensure it's a list
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    # Look for common keys
                    prospects = parsed.get("prospects") or parsed.get("results") or parsed.get("data") or parsed.get("items")
                    if prospects and isinstance(prospects, list):
                        return prospects
                    # If dict values are lists, return first list value
                    for value in parsed.values():
                        if isinstance(value, list):
                            return value
                
                print(f"⚠️ [PRIORITIZED PROSPECTS] Unexpected response format: {type(parsed)}")
                return []
            except json.JSONDecodeError as e:
                print(f"⚠️ [PRIORITIZED PROSPECTS] JSON decode error: {str(e)}")
                print(f"⚠️ [PRIORITIZED PROSPECTS] Content preview: {content[:500]}")
                return []
            
            print(f"⚠️ [PRIORITIZED PROSPECTS] Failed to parse AI response: {content[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ [PRIORITIZED PROSPECTS] Error generating prospects: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

@router.get("", response_model=PrioritizedProspectListResponse)
async def get_prioritized_prospects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get prioritized prospects for the current user.
    """
    db = get_database()
    
    # Build query
    query = {"user_id": current_user.id}
    
    # Get total count
    total = await db.prioritized_prospects.count_documents(query)
    
    # Get prospects with pagination
    skip = (page - 1) * limit
    cursor = db.prioritized_prospects.find(query).skip(skip).limit(limit).sort("priority", -1)
    prospects = await cursor.to_list(length=limit)
    
    # Convert to response format
    prospect_responses = []
    for prospect in prospects:
        prospect_dict = dict(prospect)
        prospect_dict['id'] = str(prospect_dict['_id'])
        del prospect_dict['_id']
        prospect_responses.append(PrioritizedProspectResponse(**prospect_dict))
    
    return PrioritizedProspectListResponse(
        prospects=prospect_responses,
        total=total,
        page=page,
        limit=limit
    )

@router.get("/{prospect_id}", response_model=PrioritizedProspectResponse)
async def get_prioritized_prospect(
    prospect_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Get a specific prioritized prospect by ID.
    """
    db = get_database()
    
    prospect = await db.prioritized_prospects.find_one({
        "_id": prospect_id,
        "user_id": current_user.id
    })
    
    if not prospect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prioritized prospect not found"
        )
    
    prospect_dict = dict(prospect)
    prospect_dict['id'] = str(prospect_dict['_id'])
    del prospect_dict['_id']
    
    return PrioritizedProspectResponse(**prospect_dict)

@router.delete("/{prospect_id}")
async def delete_prioritized_prospect(
    prospect_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Delete a prioritized prospect.
    """
    db = get_database()
    
    result = await db.prioritized_prospects.delete_one({
        "_id": prospect_id,
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prioritized prospect not found"
        )
    
    return {"message": "Prioritized prospect deleted successfully"}

@router.post("/{prospect_id}/shorten")
async def shorten_content(
    prospect_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Generate a shorter version of the generated content using AI.
    """
    db = get_database()
    
    # Get the prospect
    prospect = await db.prioritized_prospects.find_one({
        "_id": prospect_id,
        "user_id": current_user.id
    })
    
    if not prospect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prioritized prospect not found"
        )
    
    original_content = prospect.get("generated_content", "")
    if not original_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No content to shorten"
        )
    
    # Call Groq to shorten the content
    try:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GROQ_API_KEY not configured"
            )
        
        prompt = f"""You are an AI assistant. Take the following email/message content and create a shorter version that maintains the key message and call-to-action, but is more concise.

Original content:
{original_content}

Requirements:
- Keep the same tone and style
- Maintain the key message and purpose
- Preserve the call-to-action
- Make it significantly shorter (aim for 50-60% of original length)
- Keep it professional and clear

Return ONLY the shortened content, no additional text or explanation."""

        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant that shortens email/message content while maintaining key messages and professionalism."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.5,
            "max_tokens": 2000
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(groq_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Clean content
            content = content.strip()
            if content.startswith("```"):
                # Remove markdown code blocks
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if len(lines) > 2 else content
            
            return {"shortened_content": content}
    
    except Exception as e:
        print(f"Error shortening content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to shorten content: {str(e)}"
        )

@router.post("/{prospect_id}/different-approach")
async def generate_different_approach(
    prospect_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """
    Generate a different approach/strategy using contact data and previous content.
    """
    db = get_database()
    
    # Get the prospect
    prospect = await db.prioritized_prospects.find_one({
        "_id": prospect_id,
        "user_id": current_user.id
    })
    
    if not prospect:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prioritized prospect not found"
        )
    
    original_content = prospect.get("generated_content", "")
    contact_data = prospect.get("contact_data") or {}
    campaign_data = prospect.get("campaign_data") or []
    deal_data = prospect.get("deal_data") or []
    channel = prospect.get("channel", "Gmail")
    
    # Build context from contact data
    contact_name = contact_data.get("name", "Contact") if isinstance(contact_data, dict) else "Contact"
    contact_company = contact_data.get("company", "") if isinstance(contact_data, dict) else ""
    contact_email = contact_data.get("email", "") if isinstance(contact_data, dict) else ""
    
    campaigns_info = []
    if isinstance(campaign_data, list):
        for campaign in campaign_data[:3]:
            if isinstance(campaign, dict):
                campaign_name = campaign.get("name", "")
                campaign_goal = campaign.get("campaign_goal", {})
                goal_name = campaign_goal.get("name", "") if isinstance(campaign_goal, dict) and campaign_goal else ""
                if campaign_name:
                    campaigns_info.append(f"- {campaign_name}" + (f" (Goal: {goal_name})" if goal_name else ""))
    
    deals_info = []
    if isinstance(deal_data, list):
        for deal in deal_data[:3]:
            if isinstance(deal, dict):
                deal_name = deal.get("name", "")
                deal_amount = deal.get("amount", 0)
                if deal_name:
                    deals_info.append(f"- {deal_name} - ${deal_amount:,.0f}")
    
    # Call Groq to generate different approach
    try:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GROQ_API_KEY not configured"
            )
        
        channel_instruction = ""
        if channel in ["Gmail", "Linkedin"]:
            channel_instruction = "Write a professional email with greeting, body, and closing."
        elif channel in ["Telegram", "Whatsapp"]:
            channel_instruction = "Write a friendly, conversational message."
        elif channel == "AI Call":
            channel_instruction = "Write a structured call script with talking points."
        
        prompt = f"""You are an AI Sales Assistant. Create a COMPLETELY DIFFERENT approach/strategy for reaching out to this contact. The previous approach was:

Previous content:
{original_content}

Contact Information:
- Name: {contact_name}
- Company: {contact_company}
- Email: {contact_email}

Campaigns:
{chr(10).join(campaigns_info) if campaigns_info else "- No active campaigns"}

Deals:
{chr(10).join(deals_info) if deals_info else "- No active deals"}

Requirements:
- Create a COMPLETELY DIFFERENT strategy/angle than the previous content
- Use a different tone, approach, or value proposition
- Still address the contact's needs based on their campaigns and deals
- {channel_instruction}
- Make it professional and personalized
- Include a clear call-to-action

Return ONLY the new content, no additional text or explanation."""

        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI Sales Assistant that creates alternative outreach strategies. Always return only the content, no explanations."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.8,  # Higher temperature for more creative/different approaches
            "max_tokens": 3000
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(groq_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            # Clean content
            content = content.strip()
            if content.startswith("```"):
                # Remove markdown code blocks
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if len(lines) > 2 else content
            
            return {"new_content": content}
    
    except Exception as e:
        print(f"Error generating different approach: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate different approach: {str(e)}"
        )
