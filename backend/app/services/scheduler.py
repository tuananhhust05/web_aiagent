import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from bson import ObjectId
import aiohttp
from app.core.database import get_database
from app.core.config import settings
from app.models.campaign import CampaignType, ScheduleFrequency
from app.services.whatsapp_service import whatsapp_service
from app.services.telegram_service import telegram_service
from app.services.linkedin_service import linkedin_service
from app.services.email_service import email_service
import logging
import sys

# Configure logging to force flush
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class CampaignScheduler:
    def __init__(self):
        self.db = None
        self.running = False
        
    async def initialize(self):
        """Initialize database connection"""
        from app.core.database import get_database
        self.db = get_database()
        
    async def start(self):
        """Start the scheduler"""
        print("🔧 [DEBUG] scheduler.start() called")
        sys.stdout.flush()
        logger.info("🔧 [DEBUG] scheduler.start() called")
        
        if self.running:
            print("🔧 [DEBUG] Scheduler already running, returning")
            sys.stdout.flush()
            return
            
        self.running = True
        print("🔧 [DEBUG] Scheduler running flag set to True")
        sys.stdout.flush()
        logger.info("🚀 Campaign Scheduler started")
        
        while self.running:
            try:
                current_time = datetime.utcnow()
                print(f"🔄 [SCHEDULER] Scheduler loop running at {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
                sys.stdout.flush()  # Force flush stdout
                logger.info(f"🔄 [SCHEDULER] Scheduler loop running at {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
                await self.check_and_start_campaigns()
                # Check every 5 seconds
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"❌ Scheduler error: {str(e)}")
                sys.stdout.flush()  # Force flush on error
                await asyncio.sleep(5)
                
    async def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("🛑 Campaign Scheduler stopped")
        
    async def check_and_start_campaigns(self):
        """Check for scheduled campaigns that need to be started"""
        if self.db is None:
            logger.info("🔧 Initializing database connection...")
            await self.initialize()
            logger.info("✅ Database connection initialized")
            
        current_time = datetime.utcnow()
        logger.info(f"⏰ [SCHEDULER] Checking scheduled campaigns at {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Find all active scheduled campaigns
            filter_query = {
                "type": CampaignType.SCHEDULED,
                "status": "active",
                "schedule_settings": {"$exists": True}
            }
            
            logger.info(f"🔍 [SCHEDULER] Querying campaigns with filter: {filter_query}")
            
            campaigns_cursor = self.db.campaigns.find(filter_query)
            campaigns = await campaigns_cursor.to_list(length=None)
            
            logger.info(f"📊 [SCHEDULER] Found {len(campaigns)} campaigns matching criteria:")
            logger.info(f"   ✅ Type: {CampaignType.SCHEDULED}")
            logger.info(f"   ✅ Status: active")
            logger.info(f"   ✅ Has schedule_settings: true")
            
            if len(campaigns) == 0:
                logger.info("💤 [SCHEDULER] No active scheduled campaigns found, sleeping...")
                return
            
            # Log each scheduled campaign being checked
            for i, campaign in enumerate(campaigns, 1):
                campaign_name = campaign.get('name', 'Unknown')
                campaign_id = str(campaign.get('_id', 'Unknown'))
                campaign_type = campaign.get('type', 'unknown')
                campaign_status = campaign.get('status', 'unknown')
                schedule_settings = campaign.get('schedule_settings', {})
                frequency = schedule_settings.get('frequency', 'unknown')
                start_time = schedule_settings.get('start_time', 'Not set')
                
                logger.info(f"🎯 [SCHEDULER] Campaign {i}/{len(campaigns)} - '{campaign_name}' (ID: {campaign_id})")
                logger.info(f"   ✅ Type: {campaign_type} (matches filter)")
                logger.info(f"   ✅ Status: {campaign_status} (matches filter)")
                logger.info(f"   📅 Schedule: {frequency} at {start_time}")
                logger.info(f"   🔧 Schedule Settings: {schedule_settings}")
                
                try:
                    await self.check_campaign_schedule(campaign, current_time)
                except Exception as e:
                    logger.error(f"❌ [SCHEDULER] Error checking campaign '{campaign_name}': {str(e)}")
                    
        except Exception as e:
            logger.error(f"❌ [SCHEDULER] Database query error: {str(e)}")
                
    async def check_campaign_schedule(self, campaign: Dict[str, Any], current_time: datetime):
        """Check if a campaign should be started based on its schedule"""
        campaign_name = campaign.get('name', 'Unknown')
        schedule_settings = campaign.get("schedule_settings")
        
        if not schedule_settings:
            logger.info(f"⚠️  [SCHEDULE] Campaign '{campaign_name}' has no schedule settings, skipping")
            return
            
        frequency = schedule_settings.get("frequency")
        start_time = schedule_settings.get("start_time")
        
        if not frequency or not start_time:
            logger.info(f"⚠️  [SCHEDULE] Campaign '{campaign_name}' missing frequency or start_time, skipping")
            return
            
        # Convert start_time to datetime if it's a string
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        # Ensure start_time is timezone-aware (should be UTC from database)
        if start_time.tzinfo is None:
            import pytz
            start_time = pytz.UTC.localize(start_time)
            
        logger.info(f"🕐 [SCHEDULE] Campaign '{campaign_name}' - Current: {current_time.strftime('%Y-%m-%d %H:%M:%S')}, Scheduled: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Check if it's time to run the campaign
        should_run = False
        
        if frequency == ScheduleFrequency.DAILY:
            should_run = await self.should_run_daily(start_time, current_time, campaign)
            logger.info(f"📅 [SCHEDULE] Daily check for '{campaign_name}': {'✅ SHOULD RUN' if should_run else '❌ Not time yet'}")
        elif frequency == ScheduleFrequency.WEEKLY:
            should_run = await self.should_run_weekly(start_time, current_time, campaign, schedule_settings)
            days_of_week = schedule_settings.get("days_of_week", [])
            logger.info(f"📅 [SCHEDULE] Weekly check for '{campaign_name}' (days: {days_of_week}): {'✅ SHOULD RUN' if should_run else '❌ Not time yet'}")
        elif frequency == ScheduleFrequency.MONTHLY:
            should_run = await self.should_run_monthly(start_time, current_time, campaign, schedule_settings)
            day_of_month = schedule_settings.get("day_of_month")
            logger.info(f"📅 [SCHEDULE] Monthly check for '{campaign_name}' (day: {day_of_month}): {'✅ SHOULD RUN' if should_run else '❌ Not time yet'}")
        elif frequency == ScheduleFrequency.YEARLY:
            should_run = await self.should_run_yearly(start_time, current_time, campaign, schedule_settings)
            month_of_year = schedule_settings.get("month_of_year")
            day_of_month = schedule_settings.get("day_of_month")
            logger.info(f"📅 [SCHEDULE] Yearly check for '{campaign_name}' (month: {month_of_year}, day: {day_of_month}): {'✅ SHOULD RUN' if should_run else '❌ Not time yet'}")
        else:
            logger.warning(f"⚠️  [SCHEDULE] Unknown frequency '{frequency}' for campaign '{campaign_name}'")
            
        if should_run:
            # Check if campaign already ran today to avoid duplicate runs
            last_run = campaign.get("last_run")
            if last_run:
                last_run_date = last_run.date() if isinstance(last_run, datetime) else datetime.fromisoformat(last_run).date()
                if last_run_date == current_time.date():
                    logger.info(f"⏭️  [SCHEDULE] Campaign '{campaign_name}' already ran today ({last_run_date}), skipping")
                    return
                    
            logger.info(f"🎯 [SCHEDULE] ⭐ STARTING SCHEDULED CAMPAIGN: '{campaign_name}' ⭐")
            await self.start_campaign(campaign)
            
            # Update last_run timestamp
            await self.db.campaigns.update_one(
                {"_id": campaign["_id"]},
                {"$set": {"last_run": current_time}}
            )
            logger.info(f"✅ [SCHEDULE] Updated last_run timestamp for campaign '{campaign_name}'")
            
    async def should_run_daily(self, start_time: datetime, current_time: datetime, campaign: Dict[str, Any]) -> bool:
        """Check if daily campaign should run"""
        # Ensure both times are timezone-aware
        import pytz
        if current_time.tzinfo is None:
            current_time = pytz.UTC.localize(current_time)
        if start_time.tzinfo is None:
            start_time = pytz.UTC.localize(start_time)
        
        # Convert both to UTC for comparison
        current_utc = current_time.astimezone(pytz.UTC)
        start_utc = start_time.astimezone(pytz.UTC)
        
        # Check if current time matches the scheduled time (within 5 seconds tolerance)
        # Only check time, not date for daily campaigns
        current_time_only = current_utc.time()
        start_time_only = start_utc.time()
        
        # Calculate time difference in seconds
        current_seconds = current_time_only.hour * 3600 + current_time_only.minute * 60 + current_time_only.second
        start_seconds = start_time_only.hour * 3600 + start_time_only.minute * 60 + start_time_only.second
        
        time_diff = abs(current_seconds - start_seconds)
        
        logger.info(f"🕐 [TIMEZONE] Daily check - Current UTC: {current_utc}, Start UTC: {start_utc}, Time diff: {time_diff}s")
        
        return time_diff <= 5  # 5 seconds tolerance
        
    async def should_run_weekly(self, start_time: datetime, current_time: datetime, campaign: Dict[str, Any], schedule_settings: Dict[str, Any]) -> bool:
        """Check if weekly campaign should run"""
        days_of_week = schedule_settings.get("days_of_week", [])
        if not days_of_week:
            return False
            
        # Check if today is one of the scheduled days
        current_weekday = current_time.weekday()  # 0=Monday, 6=Sunday
        if current_weekday not in days_of_week:
            return False
            
        # Check if time matches (within 5 seconds tolerance)
        current_time_only = current_time.time()
        start_time_only = start_time.time()
        
        current_seconds = current_time_only.hour * 3600 + current_time_only.minute * 60 + current_time_only.second
        start_seconds = start_time_only.hour * 3600 + start_time_only.minute * 60 + start_time_only.second
        
        time_diff = abs(current_seconds - start_seconds)
        return time_diff <= 5
        
    async def should_run_monthly(self, start_time: datetime, current_time: datetime, campaign: Dict[str, Any], schedule_settings: Dict[str, Any]) -> bool:
        """Check if monthly campaign should run"""
        day_of_month = schedule_settings.get("day_of_month")
        if not day_of_month:
            return False
            
        # Check if today is the scheduled day of month
        if current_time.day != day_of_month:
            return False
            
        # Check if time matches (within 5 seconds tolerance)
        current_time_only = current_time.time()
        start_time_only = start_time.time()
        
        current_seconds = current_time_only.hour * 3600 + current_time_only.minute * 60 + current_time_only.second
        start_seconds = start_time_only.hour * 3600 + start_time_only.minute * 60 + start_time_only.second
        
        time_diff = abs(current_seconds - start_seconds)
        return time_diff <= 5
        
    async def should_run_yearly(self, start_time: datetime, current_time: datetime, campaign: Dict[str, Any], schedule_settings: Dict[str, Any]) -> bool:
        """Check if yearly campaign should run"""
        month_of_year = schedule_settings.get("month_of_year")
        day_of_month = schedule_settings.get("day_of_month")
        
        if not month_of_year or not day_of_month:
            return False
            
        # Check if today is the scheduled day and month
        if current_time.month != month_of_year or current_time.day != day_of_month:
            return False
            
        # Check if time matches (within 5 seconds tolerance)
        current_time_only = current_time.time()
        start_time_only = start_time.time()
        
        current_seconds = current_time_only.hour * 3600 + current_time_only.minute * 60 + current_time_only.second
        start_seconds = start_time_only.hour * 3600 + start_time_only.minute * 60 + start_time_only.second
        
        time_diff = abs(current_seconds - start_seconds)
        return time_diff <= 5
        
    async def start_campaign(self, campaign: Dict[str, Any]):
        """Start a campaign by calling the AI API, sending WhatsApp and Telegram messages for each contact"""
        campaign_id = str(campaign["_id"])
        campaign_name = campaign.get('name', 'Unknown')
        all_contact_ids = list(campaign.get("contacts", []))
        
        logger.info(f"🚀 [CAMPAIGN] Starting Campaign: '{campaign_name}' (ID: {campaign_id})")
        logger.info(f"👥 [CAMPAIGN] Total Contacts: {len(all_contact_ids)}")
        
        if not all_contact_ids:
            logger.warning(f"⚠️  [CAMPAIGN] No contacts found for campaign '{campaign_name}'")
            return
            
        # Query contacts from database
        logger.info(f"🔍 [CAMPAIGN] Querying contacts from database...")
        contacts_cursor = self.db.contacts.find({"_id": {"$in": all_contact_ids}})
        contacts = await contacts_cursor.to_list(length=None)
        logger.info(f"📋 [CAMPAIGN] Retrieved {len(contacts)} contacts from database")
        
        call_script = campaign.get("call_script", settings.AI_CALL_DEFAULT_PROMPT)
        logger.info(f"💬 [CAMPAIGN] Using call script: {call_script[:100]}{'...' if len(call_script) > 100 else ''}")
        
        # Try to load workflow from source (e.g., "convention-activities")
        workflow = None
        campaign_source = campaign.get("source")
        if campaign_source:
            logger.info(f"🔍 [CAMPAIGN] Looking for workflow with source: {campaign_source}")
            workflow = await self.db.workflows.find_one({
                "user_id": campaign["user_id"],
                "function": campaign_source
            })
            if workflow:
                logger.info(f"✅ [CAMPAIGN] Found workflow for source '{campaign_source}' with {len(workflow.get('nodes', []))} nodes")
            else:
                logger.info(f"⚠️ [CAMPAIGN] No workflow found for source '{campaign_source}', using campaign flow instead")
        
        # Get flow from campaign (default to ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        flow = campaign.get("flow", ['telegram', 'ai_voice', 'whatsapp', 'linkedin'])
        if not flow or len(flow) == 0:
            flow = ['telegram', 'ai_voice', 'whatsapp', 'linkedin']
        
        # Determine which nodes to execute
        nodes_to_execute = []
        if workflow and workflow.get("nodes") and len(workflow.get("nodes", [])) > 0:
            logger.info(f"📋 [CAMPAIGN] Using workflow nodes from source '{campaign_source}'")
            workflow_nodes = workflow.get("nodes", [])
            # Map workflow node types to channel names
            node_type_to_channel = {
                "whatsapp": "whatsapp",
                "ai-call": "ai_voice",
                "telegram": "telegram",
                "linkedin": "linkedin",
                "email": "email"
            }
            for node in workflow_nodes:
                node_type = node.get("type", "")
                channel = node_type_to_channel.get(node_type, node_type)
                nodes_to_execute.append(channel)
            logger.info(f"🔄 [CAMPAIGN] Workflow nodes: {[node.get('type') for node in workflow_nodes]}")
            logger.info(f"🎯 [CAMPAIGN] Will execute nodes in sequence: {nodes_to_execute}")
        else:
            # Use campaign flow as nodes
            nodes_to_execute = flow if flow else ['telegram']
            logger.info(f"🔄 [CAMPAIGN] Campaign flow: {nodes_to_execute}")
            logger.info(f"🎯 [CAMPAIGN] Will execute nodes in sequence: {nodes_to_execute}")
        
        # Initialize counters
        calls_made_count = 0
        whatsapp_sent_count = 0
        telegram_sent_count = 0
        linkedin_sent_count = 0
        email_sent_count = 0
        
        logger.info(f"📞 [CAMPAIGN] Starting sequential node execution for {len(contacts)} contacts...")
        
        for i, contact in enumerate(contacts, 1):
            phone = contact.get("phone", "N/A")
            whatsapp_number = contact.get("whatsapp_number")
            telegram_username = contact.get("telegram_username")
            linkedin_profile = contact.get("linkedin_profile")
            contact_email = contact.get("email")
            name = f"{contact.get('first_name', '')} {contact.get('last_name', '')}".strip()
            contact_id = str(contact.get('_id', 'Unknown'))
            
            logger.info(f"📞 [CAMPAIGN] Processing contact {i}/{len(contacts)}: {name} (ID: {contact_id})")
            
            # Execute nodes sequentially with 1 minute delay between nodes
            for node_index, node_channel in enumerate(nodes_to_execute):
                if node_index > 0:
                    # Wait 1 minute (60 seconds) before executing next node
                    logger.info(f"⏳ [CAMPAIGN] Waiting 60 seconds before executing next node...")
                    await asyncio.sleep(60)
                
                logger.info(f"🔄 [CAMPAIGN] [{node_index + 1}/{len(nodes_to_execute)}] Executing node: {node_channel} for {name}")
                
                if node_channel == 'whatsapp':
                    # Send WhatsApp message if contact has WhatsApp number
                    if whatsapp_number:
                        try:
                            logger.info(f"📱 [WHATSAPP] Sending WhatsApp message to {name} ({whatsapp_number})")
                            logger.info(f"📝 [WHATSAPP] Message content: {call_script[:100]}...")
                            
                            whatsapp_result = await whatsapp_service.send_message_to_contact(
                                whatsapp_number, 
                                call_script,
                                user_id=campaign["user_id"]
                            )
                    
                            if whatsapp_result.get("success"):
                                logger.info(f"✅ [WHATSAPP] WhatsApp message sent to {name}: {whatsapp_result}")
                                whatsapp_sent_count += 1
                            else:
                                logger.error(f"❌ [WHATSAPP] WhatsApp message failed for {name}: {whatsapp_result}")
                                # Log detailed error for debugging
                                if "error" in whatsapp_result:
                                    logger.error(f"🔍 [WHATSAPP] Error details: {whatsapp_result['error']}")
                                
                        except Exception as e:
                            logger.error(f"❌ [WHATSAPP] Failed to send WhatsApp message to {name}: {str(e)}")
                            logger.error(f"🔍 [WHATSAPP] Exception type: {type(e).__name__}")
                    else:
                        logger.warning(f"⚠️ [WHATSAPP] Contact {name} does not have WhatsApp number")
                
                elif node_channel == 'telegram':
                    # Send Telegram message if contact has Telegram username
                    if telegram_username:
                        try:
                            logger.info(f"📱 [TELEGRAM] Sending Telegram message to {name} (@{telegram_username})")
                            logger.info(f"📝 [TELEGRAM] Message content: {call_script[:100]}...")
                            
                            telegram_result = await telegram_service.send_message_to_contact(
                                telegram_username, 
                                call_script,
                                user_id=campaign["user_id"]
                            )
                    
                            if telegram_result.get("success"):
                                logger.info(f"✅ [TELEGRAM] Telegram message sent to {name}: {telegram_result}")
                                telegram_sent_count += 1
                            else:
                                logger.error(f"❌ [TELEGRAM] Telegram message failed for {name}: {telegram_result}")
                                # Log detailed error for debugging
                                if "error" in telegram_result:
                                    logger.error(f"🔍 [TELEGRAM] Error details: {telegram_result['error']}")
                                
                        except Exception as e:
                            logger.error(f"❌ [TELEGRAM] Failed to send Telegram message to {name}: {str(e)}")
                            logger.error(f"🔍 [TELEGRAM] Exception type: {type(e).__name__}")
                    else:
                        logger.warning(f"⚠️ [TELEGRAM] Contact {name} does not have Telegram username")
                
                elif node_channel == 'linkedin':
                    # Send LinkedIn message if contact has LinkedIn profile
                    # TEMPORARILY COMMENTED OUT - LinkedIn API has issues
                    if linkedin_profile:
                        logger.info(f"⏸️ [LINKEDIN] LinkedIn message skipped for {name} ({linkedin_profile}) - API temporarily disabled")
                    else:
                        logger.warning(f"⚠️ [LINKEDIN] Contact {name} does not have LinkedIn profile")
                
                elif node_channel == 'email':
                    # Send email if contact has email address
                    if contact_email:
                        try:
                            logger.info(f"📧 [EMAIL] Sending email to {name} ({contact_email})")
                            logger.info(f"📝 [EMAIL] Email content: {call_script[:100]}...")
                            
                            # Get email credentials from database
                            email_credentials = await self.db.email_credentials.find_one({"user_id": campaign["user_id"]})
                            
                            if not email_credentials:
                                logger.warning(f"⚠️ [EMAIL] Email credentials not found for user {campaign['user_id']}")
                                logger.warning(f"⚠️ [EMAIL] Skipping email for {name} - Please configure email credentials first")
                            else:
                                # Prepare email data
                                email_addr = email_credentials.get("email")
                                app_password = email_credentials.get("app_password")
                                from_name = email_credentials.get("from_name")
                                
                                if not email_addr or not app_password:
                                    logger.warning(f"⚠️ [EMAIL] Email credentials incomplete for user {campaign['user_id']}")
                                    logger.warning(f"⚠️ [EMAIL] Skipping email for {name}")
                                else:
                                    # Prepare recipients
                                    recipients = [{
                                        "email": contact_email,
                                        "name": name,
                                        "contact_id": contact_id
                                    }]
                                    
                                    # Use call_script as email content
                                    email_subject = "Email Marketing"
                                    email_content = call_script
                                    
                                    # Send email with custom credentials
                                    email_result = await email_service.send_email_with_credentials_async(
                                        email=email_addr,
                                        app_password=app_password,
                                        from_name=from_name,
                                        subject=email_subject,
                                        content=email_content,
                                        is_html=False,
                                        recipients=recipients
                                    )
                                    
                                    if email_result.get("success"):
                                        logger.info(f"✅ [EMAIL] Email sent to {name}: {email_result}")
                                        email_sent_count += 1
                                    else:
                                        logger.error(f"❌ [EMAIL] Email failed for {name}: {email_result}")
                                        if "error" in email_result:
                                            logger.error(f"🔍 [EMAIL] Error details: {email_result['error']}")
                                    
                        except Exception as e:
                            logger.error(f"❌ [EMAIL] Failed to send email to {name}: {str(e)}")
                            logger.error(f"🔍 [EMAIL] Exception type: {type(e).__name__}")
                    else:
                        logger.warning(f"⚠️ [EMAIL] Contact {name} does not have email address")
                
                elif node_channel == 'ai_voice':
                    # Make AI call if contact has phone number
                    if phone and phone != "N/A":
                        try:
                            # Prepare AI call API payload
                            ai_call_payload = {
                                "number": phone,
                                "prompt": call_script
                            }
                            
                            logger.info(f"🤖 [AI_CALL] Calling AI API for {name} ({phone})")
                            logger.info(f"📡 [AI_CALL] API URL: {settings.AI_CALL_API_URL}")
                            
                            # Make async HTTP request to AI call API
                            async with aiohttp.ClientSession() as session:
                                async with session.post(
                                    settings.AI_CALL_API_URL,
                                    json=ai_call_payload,
                                    headers={"Content-Type": "application/json"},
                                    timeout=aiohttp.ClientTimeout(total=30)
                                ) as response:
                                    if response.status == 200:
                                        ai_response = await response.json()
                                        logger.info(f"✅ [AI_CALL] AI call initiated for {name}: {ai_response}")
                                        
                                        # Create call record in database
                                        call_doc = {
                                            "_id": str(ObjectId()),
                                            "user_id": campaign["user_id"],
                                            "contact_id": contact_id,
                                            "campaign_id": campaign_id,
                                            "phone_number": phone,
                                            "call_type": "outbound",
                                            "status": "connecting",
                                            "created_at": datetime.utcnow(),
                                            "updated_at": datetime.utcnow(),
                                            "notes": f"Scheduled campaign call for {name}"
                                        }
                                        
                                        # Insert call record
                                        await self.db.calls.insert_one(call_doc)
                                        logger.info(f"📝 [AI_CALL] Call record created for {name} (Call ID: {call_doc['_id']})")
                                        calls_made_count += 1
                                        
                                    else:
                                        error_text = await response.text()
                                        logger.error(f"❌ [AI_CALL] AI call failed for {name}: {response.status} - {error_text}")
                                        
                        except Exception as e:
                            logger.error(f"❌ [AI_CALL] Failed to call AI API for {name}: {str(e)}")
                    else:
                        logger.warning(f"⚠️  [CAMPAIGN] Contact {name} has no valid phone number, skipping AI call")
                
                else:
                    logger.warning(f"⚠️ [CAMPAIGN] Unknown node channel: {node_channel}")
        
        logger.info(f"🎉 [CAMPAIGN] Completed processing all contacts for campaign '{campaign_name}'")
        logger.info(f"📊 [CAMPAIGN] Summary: {calls_made_count} calls made, {whatsapp_sent_count} WhatsApp messages sent, {telegram_sent_count} Telegram messages sent, {linkedin_sent_count} LinkedIn messages sent, {email_sent_count} emails sent")

# Global scheduler instance
scheduler = CampaignScheduler()

async def start_scheduler():
    return None
    """Start the campaign scheduler"""
    print("🔧 [DEBUG] start_scheduler() called")
    logger.info("🔧 [DEBUG] start_scheduler() called")
    
    await scheduler.initialize()
    print("🔧 [DEBUG] scheduler.initialize() completed")
    logger.info("🔧 [DEBUG] scheduler.initialize() completed")
    
    # Start scheduler in background task
    print("🔧 [DEBUG] Creating scheduler task...")
    task = asyncio.ensure_future(scheduler.start())
    print(f"🔧 [DEBUG] Scheduler task created: {task}")
    logger.info(f"🔧 [DEBUG] Scheduler task created: {task}")
    
    # Give the task a moment to start
    await asyncio.sleep(0.1)
    print(f"🔧 [DEBUG] Task done: {task.done()}")
    return task

async def stop_scheduler():
    """Stop the campaign scheduler"""
    return None
    await scheduler.stop()
