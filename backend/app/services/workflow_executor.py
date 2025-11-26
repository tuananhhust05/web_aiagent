import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from bson import ObjectId

from app.core.database import get_database
from app.services.telegram_service import telegram_service
from app.services.whatsapp_service import whatsapp_service
from app.services.linkedin_service import linkedin_service
from app.services.email_service import email_service
from app.core.config import settings
import aiohttp

logger = logging.getLogger(__name__)


class WorkflowExecutor:
    """Execute workflow nodes with response-based routing logic."""
    
    def __init__(self):
        self.db = None
    
    def _get_db(self):
        if self.db is None:
            self.db = get_database()
        return self.db
    
    def _get_node_type_to_channel(self, node_type: str) -> str:
        """Map workflow node type to channel name."""
        mapping = {
            "whatsapp": "whatsapp",
            "ai-call": "ai_voice",
            "telegram": "telegram",
            "linkedin": "linkedin",
            "email": "email"
        }
        return mapping.get(node_type, node_type)
    
    def _get_channel_to_platform(self, channel: str) -> str:
        """Map channel name to platform name for inbox response checking."""
        mapping = {
            "whatsapp": "whatsapp",
            "ai_voice": "ai-call",  # AI calls might not have direct responses
            "telegram": "telegram",
            "linkedin": "linkedin",
            "email": "email"
        }
        return mapping.get(channel, channel)
    
    def _get_node_type_to_platform(self, node_type: str) -> str:
        """Map node type directly to platform name for inbox response checking."""
        # Node type matches platform name directly
        return node_type
    
    def _find_start_node(self, nodes: List[Dict]) -> Optional[Dict]:
        """Find the start node (node with no incoming connections)."""
        if not nodes:
            return None
        
        # If only one node, it's the start
        if len(nodes) == 1:
            return nodes[0]
        
        # For now, return first node (can be improved to find actual start)
        return nodes[0]
    
    def _find_next_nodes(self, current_node_id: str, connections: List[Dict], has_response: bool) -> List[Dict]:
        """
        Find next nodes based on current node and response status.
        - If has_response: return nodes connected by solid lines
        - If not has_response: return nodes connected by dashed lines
        """
        next_nodes = []
        for conn in connections:
            if conn.get("source") == current_node_id:
                stroke_type = conn.get("strokeType", "solid")
                # If we have response, use solid connections
                # If no response, use dashed connections
                if has_response and stroke_type == "solid":
                    next_nodes.append(conn)
                elif not has_response and stroke_type == "dashed":
                    next_nodes.append(conn)
        return next_nodes
    
    def _get_node_by_id(self, node_id: str, nodes: List[Dict]) -> Optional[Dict]:
        """Find node by ID."""
        for node in nodes:
            if node.get("id") == node_id:
                return node
        return None
    
    async def _check_response(
        self, 
        campaign_id: str, 
        contact_id: str, 
        platform: str, 
        node_executed_at: datetime,
        contact: dict = None
    ) -> bool:
        """
        Check if there's a response in inbox_responses for this campaign/contact/platform.
        Check responses created within a reasonable time window (5 minutes before to after node execution).
        Uses flexible matching: matches by contact_id if available, or by contact username/phone as fallback.
        """
        db = self._get_db()
        
        # Check responses within 5 minutes before and after node execution
        # (to account for real-time listener that might insert before node completes)
        from datetime import timedelta
        time_window_start = node_executed_at - timedelta(minutes=5)
        time_window_end = node_executed_at + timedelta(minutes=5)
        
        # Build base query with platform and time window
        base_query = {
            "platform": platform,
            "created_at": {
                "$gte": time_window_start,
                "$lte": time_window_end
            }
        }
        
        # Build flexible matching: try contact_id first, then fallback to contact field (username/phone)
        or_conditions = []
        
        # Primary match: contact_id (most reliable)
        if contact_id:
            contact_id_query = base_query.copy()
            contact_id_query["contact_id"] = contact_id
            if campaign_id:
                contact_id_query["campaign_id"] = campaign_id
            or_conditions.append(contact_id_query)
            
            # Also match if campaign_id is None in inbox (listener might not find campaign)
            if campaign_id:
                contact_id_no_campaign = base_query.copy()
                contact_id_no_campaign["contact_id"] = contact_id
                contact_id_no_campaign["campaign_id"] = None
                or_conditions.append(contact_id_no_campaign)
        
        # Fallback match: by contact field (telegram_username, whatsapp_number, etc.)
        if contact:
            contact_field_query = base_query.copy()
            # Try different contact identifiers based on platform
            if platform == "telegram":
                telegram_username = contact.get("telegram_username")
                if telegram_username:
                    contact_field_query["contact"] = telegram_username
                    if campaign_id:
                        contact_field_query["campaign_id"] = campaign_id
                    or_conditions.append(contact_field_query)
            elif platform == "whatsapp":
                whatsapp_number = contact.get("whatsapp_number") or contact.get("phone")
                if whatsapp_number:
                    contact_field_query["contact"] = whatsapp_number
                    if campaign_id:
                        contact_field_query["campaign_id"] = campaign_id
                    or_conditions.append(contact_field_query)
        
        # If no conditions, use base query only
        if not or_conditions:
            query = base_query
        elif len(or_conditions) == 1:
            query = or_conditions[0]
        else:
            query = {"$or": or_conditions}
        
        logger.info(f"🔍 [WORKFLOW] Checking response with query: {query}")
        
        # Find response in inbox_responses
        response = await db.inbox_responses.find_one(query)
        
        if response:
            logger.info(
                f"✅ [WORKFLOW] Response found: id={response.get('_id')}, "
                f"contact_id={response.get('contact_id')}, campaign_id={response.get('campaign_id')}, "
                f"created_at={response.get('created_at')}"
            )
        else:
            logger.warning(
                f"⚠️ [WORKFLOW] No response found for campaign={campaign_id}, "
                f"contact_id={contact_id}, platform={platform}, "
                f"time_window=[{time_window_start} to {time_window_end}]"
            )
            # Debug: check what responses exist
            all_responses = await db.inbox_responses.find({
                "platform": platform,
                "created_at": {"$gte": time_window_start, "$lte": time_window_end}
            }).to_list(length=10)
            if all_responses:
                logger.debug(f"📋 [WORKFLOW] Found {len(all_responses)} responses in time window (not matching):")
                for r in all_responses:
                    logger.debug(
                        f"  - id={r.get('_id')}, contact_id={r.get('contact_id')}, "
                        f"campaign_id={r.get('campaign_id')}, contact={r.get('contact')}"
                    )
        
        return response is not None
    
    async def _execute_node(
        self,
        node: Dict,
        contact: Dict,
        campaign: Dict,
        call_script: str
    ) -> bool:
        """Execute a single workflow node. Returns True if executed successfully."""
        node_type = node.get("type", "")
        channel = self._get_node_type_to_channel(node_type)
        contact_id = str(contact.get("_id", ""))
        name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
        
        logger.info(f"🔄 [WORKFLOW] Executing node: {node_type} (channel: {channel}) for {name}")
        
        try:
            if channel == 'whatsapp':
                whatsapp_number = contact.get("whatsapp_number")
                if whatsapp_number:
                    result = await whatsapp_service.send_message_to_contact(
                        whatsapp_number,
                        call_script,
                        user_id=campaign.get("user_id")
                    )
                    return result.get("success", False)
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no WhatsApp number")
                    return False
            
            elif channel == 'telegram':
                telegram_username = contact.get("telegram_username")
                if telegram_username:
                    result = await telegram_service.send_message_to_contact(
                        telegram_username,
                        call_script,
                        user_id=campaign.get("user_id")
                    )
                    return result.get("success", False)
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no Telegram username")
                    return False
            
            elif channel == 'linkedin':
                linkedin_profile = contact.get("linkedin_profile")
                if linkedin_profile:
                    result = await linkedin_service.send_message_to_contact(
                        linkedin_profile,
                        call_script
                    )
                    return result.get("success", False)
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no LinkedIn profile")
                    return False
            
            elif channel == 'email':
                contact_email = contact.get("email")
                if contact_email:
                    email_credentials = await self._get_db().email_credentials.find_one({
                        "user_id": campaign.get("user_id")
                    })
                    if email_credentials:
                        email_result = await email_service.send_email_with_credentials_async(
                            email=email_credentials.get("email"),
                            app_password=email_credentials.get("app_password"),
                            from_name=email_credentials.get("from_name"),
                            subject="Email Marketing",
                            content=call_script,
                            is_html=False,
                            recipients=[{
                                "email": contact_email,
                                "name": name,
                                "contact_id": contact_id
                            }]
                        )
                        return email_result.get("success", False)
                    else:
                        logger.warning(f"⚠️ [WORKFLOW] Email credentials not found for user")
                        return False
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no email")
                    return False
            
            elif channel == 'ai_voice':
                phone = contact.get("phone", "N/A")
                if phone and phone != "N/A":
                    ai_call_payload = {
                        "number": phone,
                        "prompt": call_script
                    }
                    async with aiohttp.ClientSession() as session:
                        async with session.post(
                            settings.AI_CALL_API_URL,
                            json=ai_call_payload,
                            headers={"Content-Type": "application/json"},
                            timeout=aiohttp.ClientTimeout(total=30)
                        ) as response:
                            if response.status == 200:
                                # Create call record
                                call_doc = {
                                    "_id": str(ObjectId()),
                                    "user_id": campaign.get("user_id"),
                                    "contact_id": contact_id,
                                    "campaign_id": str(campaign.get("_id", "")),
                                    "phone_number": phone,
                                    "call_type": "outbound",
                                    "status": "connecting",
                                    "created_at": datetime.utcnow(),
                                    "updated_at": datetime.utcnow(),
                                    "notes": f"Workflow campaign call for {name}"
                                }
                                await self._get_db().calls.insert_one(call_doc)
                                return True
                            else:
                                return False
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no valid phone number")
                    return False
            
            else:
                logger.warning(f"⚠️ [WORKFLOW] Unknown node type: {node_type}")
                return False
                
        except Exception as e:
            logger.error(f"❌ [WORKFLOW] Failed to execute node {node_type} for {name}: {str(e)}")
            return False
    
    async def execute_workflow_for_contact(
        self,
        workflow: Dict,
        contact: Dict,
        campaign: Dict,
        call_script: str
    ):
        """
        Execute workflow for a single contact with response-based routing.
        
        Logic:
        1. Start with first node (or find actual start node)
        2. Execute node
        3. Wait max_no_response_time seconds
        4. Check for response in inbox_responses
        5. Find next node based on connection type (solid if response, dashed if no response)
        6. Repeat until no more nodes
        """
        nodes = workflow.get("nodes", [])
        connections = workflow.get("connections", [])
        campaign_id = str(campaign.get("_id", ""))
        contact_id = str(contact.get("_id", ""))
        name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
        
        if not nodes:
            logger.warning(f"⚠️ [WORKFLOW] No nodes in workflow for {name}")
            return
        
        # Find start node
        current_node = self._find_start_node(nodes)
        if not current_node:
            logger.warning(f"⚠️ [WORKFLOW] No start node found for {name}")
            return
        
        visited_nodes = set()
        
        while current_node:
            node_id = current_node.get("id")
            
            # Prevent infinite loops
            if node_id in visited_nodes:
                logger.warning(f"⚠️ [WORKFLOW] Cycle detected, stopping workflow for {name}")
                break
            visited_nodes.add(node_id)
            
            # Get max_no_response_time from node data (default to 60 seconds)
            max_wait_time = current_node.get("data", {}).get("max_no_response_time", 60)
            node_type = current_node.get("type", "")
            channel = self._get_node_type_to_channel(node_type)
            
            logger.info(f"🔄 [WORKFLOW] Executing node {node_id} ({node_type}) for {name}")
            
            # Execute current node
            node_executed_at = datetime.utcnow()
            success = await self._execute_node(current_node, contact, campaign, call_script)
            
            if not success:
                logger.warning(f"⚠️ [WORKFLOW] Node {node_id} execution failed for {name}, continuing...")
            
            # Wait for max_no_response_time
            logger.info(f"⏳ [WORKFLOW] Waiting {max_wait_time} seconds for response...")
            await asyncio.sleep(max_wait_time)
            
            # Check for response - use node_type directly as platform
            # Example: node_type="telegram" → platform="telegram"
            platform = self._get_node_type_to_platform(node_type)
            has_response = await self._check_response(
                campaign_id,
                contact_id,
                platform,
                node_executed_at,
                contact
            )
            
            if has_response:
                logger.info(f"✅ [WORKFLOW] Response found for {name} after node {node_id}")
            else:
                logger.info(f"⚠️ [WORKFLOW] No response found for {name} after node {node_id}")
            
            # Find next nodes based on response
            next_connections = self._find_next_nodes(node_id, connections, has_response)
            
            if not next_connections:
                logger.info(f"🏁 [WORKFLOW] No more nodes to execute for {name}")
                break
            
            # Get next node (for now, take first connection)
            # TODO: Handle multiple connections if needed
            next_connection = next_connections[0]
            next_node_id = next_connection.get("target")
            current_node = self._get_node_by_id(next_node_id, nodes)
            
            if not current_node:
                logger.warning(f"⚠️ [WORKFLOW] Next node {next_node_id} not found for {name}")
                break
        
        logger.info(f"✅ [WORKFLOW] Workflow execution completed for {name}")


workflow_executor = WorkflowExecutor()

