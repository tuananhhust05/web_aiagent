import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from bson import ObjectId
import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr, parsedate_to_datetime

from app.core.database import get_database
from app.services.telegram_service import telegram_service, send_message_to_user
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

    async def _log_campaign_message(
        self,
        campaign: Dict,
        contact: Dict,
        channel: str,
    ) -> None:
        """
        Log a sent campaign message so that KPI stats can use real send counts.
        """
        try:
            db = self._get_db()
            campaign_id = str(campaign.get("_id", "")) if campaign.get("_id") else campaign.get("id")
            contact_id = str(contact.get("_id", "")) if contact.get("_id") else contact.get("id")
            if not campaign_id or not contact_id:
                return

            doc = {
                "campaign_id": campaign_id,
                "contact_id": contact_id,
                "user_id": campaign.get("user_id"),
                "channel": channel,
                "created_at": datetime.utcnow(),
            }
            await db.campaign_messages.insert_one(doc)
        except Exception as e:
            logger.error(f"❌ [WORKFLOW] Failed to log campaign message for channel {channel}: {str(e)}")
    
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
        - If has_response: return nodes connected by "yes" label
        - If not has_response: return nodes connected by "no" label
        """
        next_nodes = []
        for conn in connections:
            if conn.get("source") == current_node_id:
                label = conn.get("label", "yes")  # Default to "yes" if not specified
                # If we have response, use "yes" connections
                # If no response, use "no" connections
                if has_response and label == "yes":
                    next_nodes.append(conn)
                elif not has_response and label == "no":
                    next_nodes.append(conn)
        return next_nodes
    
    def _get_node_by_id(self, node_id: str, nodes: List[Dict]) -> Optional[Dict]:
        """Find node by ID."""
        for node in nodes:
            if node.get("id") == node_id:
                return node
        return None
    
    def _decode_email_text(self, raw):
        """Decode email header text."""
        if raw is None:
            return ""
        decoded, enc = decode_header(raw)[0]
        if isinstance(decoded, bytes):
            return decoded.decode(enc if enc else "utf-8", errors="ignore")
        return decoded
    
    def _get_email_body(self, msg):
        """Extract email body from message."""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    return part.get_payload(decode=True).decode("utf-8", errors="ignore")
        else:
            return msg.get_payload(decode=True).decode("utf-8", errors="ignore")
        return ""
    
    async def _fetch_email_responses(
        self,
        email_credentials: Dict,
        contact_emails: List[str],
        node_executed_at: datetime
    ) -> List[Dict]:
        """
        Fetch email responses from IMAP server.
        
        Args:
            email_credentials: Dict with email, app_password
            contact_emails: List of contact email addresses to check
            node_executed_at: When the email was sent (to filter recent emails)
            
        Returns:
            List of email dicts with from, subject, body
        """
        try:
            # Run IMAP operations in thread pool since imaplib is blocking
            def _fetch_emails_sync():
                IMAP_SERVER = "imap.gmail.com"  # Gmail
                email_user = email_credentials.get("email")
                app_password = email_credentials.get("app_password")
                
                if not email_user or not app_password:
                    logger.error("❌ [EMAIL] Missing email credentials")
                    return []
                
                mail = imaplib.IMAP4_SSL(IMAP_SERVER)
                mail.login(email_user, app_password)
                mail.select("INBOX")
                
                # Search for recent emails (last 10 to be safe)
                result, data = mail.search(None, "ALL")
                mail_ids = data[0].split()
                latest_10 = mail_ids[-10:] if len(mail_ids) >= 10 else mail_ids
                
                emails = []
                for i in latest_10[::-1]:  # Reverse to get newest first
                    try:
                        _, msg_data = mail.fetch(i, "(RFC822)")
                        msg = email.message_from_bytes(msg_data[0][1])
                        
                        # Get sender email
                        raw_from = msg.get("From")
                        _, email_addr = parseaddr(raw_from)
                        
                        # Only process emails from contacts in campaign
                        if email_addr.lower() not in [e.lower() for e in contact_emails]:
                            continue
                        
                        subject = self._decode_email_text(msg.get("Subject"))
                        body = self._get_email_body(msg)
                        
                        # Check if email is after node execution (with small buffer before)
                        email_date = msg.get("Date")
                        if email_date:
                            try:
                                email_datetime = parsedate_to_datetime(email_date)
                                # Only include emails after node execution (with 1 minute buffer before)
                                if email_datetime < (node_executed_at - timedelta(minutes=1)):
                                    continue
                            except:
                                pass  # If date parsing fails, include the email anyway
                        
                        emails.append({
                            "from": email_addr,
                            "subject": subject,
                            "body": body.strip()
                        })
                    except Exception as e:
                        logger.warning(f"⚠️ [EMAIL] Error processing email {i}: {str(e)}")
                        continue
                
                mail.close()
                mail.logout()
                return emails
            
            # Run blocking IMAP operations in thread pool
            emails = await asyncio.to_thread(_fetch_emails_sync)
            logger.info(f"📧 [EMAIL] Fetched {len(emails)} email responses from IMAP")
            return emails
            
        except Exception as e:
            logger.error(f"❌ [EMAIL] Failed to fetch email responses: {str(e)}")
            return []
    
    async def _check_and_save_email_responses(
        self,
        campaign_id: str,
        contact_id: str,
        contact: Dict,
        campaign: Dict,
        node_executed_at: datetime
    ) -> bool:
        """
        Check for email responses from IMAP and save to inbox_responses.
        Returns True if response found and saved.
        """
        try:
            # Get email credentials
            email_credentials = await self._get_db().email_credentials.find_one({
                "user_id": campaign.get("user_id")
            })
            
            if not email_credentials:
                logger.warning("⚠️ [EMAIL] Email credentials not found for checking responses")
                return False
            
            # Get contact email
            contact_email = contact.get("email")
            if not contact_email:
                logger.warning("⚠️ [EMAIL] Contact has no email address")
                return False
            
            # Fetch email responses from IMAP
            emails = await self._fetch_email_responses(
                email_credentials,
                [contact_email],
                node_executed_at
            )
            
            if not emails:
                logger.info(f"📧 [EMAIL] No email responses found for {contact_email}")
                return False
            
            # Save the first (newest) email response to inbox_responses
            db = self._get_db()
            for email_response in emails:
                # Check if this response already exists
                existing = await db.inbox_responses.find_one({
                    "platform": "email",
                    "contact": email_response["from"],
                    "contact_id": contact_id,
                    "campaign_id": campaign_id,
                    "content": email_response["body"][:100]  # Match by first 100 chars
                })
                
                if existing:
                    logger.info(f"📧 [EMAIL] Email response already exists in inbox")
                    continue
                
                # Create inbox response document
                inbox_doc = {
                    "_id": str(datetime.utcnow().timestamp()).replace(".", ""),
                    "user_id": campaign.get("user_id"),
                    "platform": "email",
                    "contact": email_response["from"],
                    "content": email_response["body"],
                    "campaign_id": campaign_id,
                    "contact_id": contact_id,
                    "created_at": datetime.utcnow(),
                }
                
                await db.inbox_responses.insert_one(inbox_doc)
                logger.info(
                    f"✅ [EMAIL] Saved email response to inbox: from={email_response['from']}, "
                    f"subject={email_response['subject'][:50]}"
                )
                print(f"✅ [EMAIL] Email response saved: {email_response['from']} - {email_response['subject'][:50]}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ [EMAIL] Failed to check and save email responses: {str(e)}")
            return False
    
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
            elif platform == "email":
                contact_email = contact.get("email")
                if contact_email:
                    contact_field_query["contact"] = contact_email
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
        """Execute a single workflow node. Returns True if executed successfully.

        On success, this will also log a campaign_messages entry for message-based
        channels so that goal KPIs can use actual sent counts instead of estimates.
        """
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
                    success = result.get("success", False)
                    if success:
                        await self._log_campaign_message(campaign, contact, "whatsapp")
                    return success
                else:
                    logger.warning(f"⚠️ [WORKFLOW] Contact {name} has no WhatsApp number")
                    return False
            
            elif channel == 'telegram':
                telegram_username = contact.get("telegram_username")
                if telegram_username:
                    # Kiểm tra và thêm @ nếu chưa có
                    if not telegram_username.startswith('@'):
                        telegram_username = f"@{telegram_username}"
                        logger.info(f"📝 [WORKFLOW] Added @ prefix to telegram_username: {telegram_username}")
                    
                    user_id = campaign.get("user_id")
                    logger.info(f"📤 [WORKFLOW] Sending Telegram message to {telegram_username} for contact {name} (user_id: {user_id})")
                    
                    # Sử dụng hàm send_message_to_user thay vì API call
                    success = await send_message_to_user(
                        recipient=telegram_username,
                        message=call_script,
                        user_id=user_id
                    )
                    
                    if success:
                        logger.info(f"✅ [WORKFLOW] Telegram message sent successfully to {name} ({telegram_username})")
                    else:
                        logger.error(f"❌ [WORKFLOW] Failed to send Telegram message to {name} ({telegram_username})")
                    
                    if success:
                        await self._log_campaign_message(campaign, contact, "telegram")
                    return success
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
                    success = result.get("success", False)
                    if success:
                        await self._log_campaign_message(campaign, contact, "linkedin")
                    return success
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
                        success = email_result.get("success", False)
                        if success:
                            await self._log_campaign_message(campaign, contact, "email")
                        return success
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
                                # For AI voice we track attempts via calls collection,
                                # no need to log into campaign_messages for now.
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
            
            # Get script for this campaign from node.data.scripts array
            # Priority: 1. Node script for this campaign, 2. Campaign call_script (default)
            node_script = call_script  # Default to campaign call_script
            node_data = current_node.get("data", {})
            scripts_array = node_data.get("scripts", [])
            
            logger.info(f"📝 [WORKFLOW] Script selection for node {node_id}:")
            logger.info(f"   - Campaign ID: {campaign_id}")
            logger.info(f"   - Default call_script length: {len(call_script) if call_script else 0} chars")
            logger.info(f"   - Node has scripts array: {bool(scripts_array)}")
            logger.info(f"   - Scripts array length: {len(scripts_array) if scripts_array else 0}")
            
            if scripts_array and campaign_id:
                # Find script for this campaign
                campaign_script_obj = next((s for s in scripts_array if s.get("campaign_id") == campaign_id), None)
                if campaign_script_obj and campaign_script_obj.get("script"):
                    node_script = campaign_script_obj["script"]
                    logger.info(f"✅ [WORKFLOW] Using campaign-specific script for node {node_id} (length: {len(node_script)} chars)")
                    logger.info(f"   - Script preview: {node_script[:100]}...")
                else:
                    logger.info(f"📝 [WORKFLOW] No campaign-specific script found for node {node_id}, using default campaign call_script")
                    logger.info(f"   - Available campaign_ids in scripts: {[s.get('campaign_id') for s in scripts_array]}")
            else:
                if not scripts_array:
                    logger.info(f"📝 [WORKFLOW] Node {node_id} has no scripts array, using default campaign call_script")
                if not campaign_id:
                    logger.info(f"📝 [WORKFLOW] No campaign_id provided, using default campaign call_script")
            
            # Ensure node_script is not empty - fallback to call_script if empty
            if not node_script or not node_script.strip():
                logger.warning(f"⚠️ [WORKFLOW] Node {node_id} script is empty, falling back to campaign call_script")
                node_script = call_script
            
            logger.info(f"📝 [WORKFLOW] Final script to use for node {node_id}: {len(node_script)} chars")
            if len(node_script) > 0:
                logger.info(f"   - Script preview: {node_script[:150]}...")
            
            # Execute current node
            node_executed_at = datetime.utcnow()
            success = await self._execute_node(current_node, contact, campaign, node_script)
            
            if not success:
                logger.warning(f"⚠️ [WORKFLOW] Node {node_id} execution failed for {name}, continuing...")
            
            # Wait for max_no_response_time
            logger.info(f"⏳ [WORKFLOW] Waiting {max_wait_time} seconds for response...")
            await asyncio.sleep(max_wait_time)
            
            # For email nodes, check IMAP for responses and save to inbox_responses
            if node_type == "email":
                logger.info(f"📧 [WORKFLOW] Checking email responses from IMAP for {name}...")
                await self._check_and_save_email_responses(
                    campaign_id,
                    contact_id,
                    contact,
                    campaign,
                    node_executed_at
                )
            
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

