import asyncio
import logging
from contextlib import suppress
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from telethon import TelegramClient, events

from app.core.database import get_database

logger = logging.getLogger(__name__)


class TelegramSessionListener:
    """Manage long-running Telethon clients for verified user sessions."""

    def __init__(self, session_dir: str = "session_telegram"):
        self.session_dir = Path(session_dir)
        self.clients: Dict[str, TelegramClient] = {}
        self.tasks: Dict[str, asyncio.Task] = {}
        self.handlers: Dict[str, any] = {}
        self.running = False
        self._lock = asyncio.Lock()

    async def start(self):
        async with self._lock:
            if self.running:
                return
            self.running = True
        logger.info("🔄 Starting Telegram session listener service")
        await self.reload_all_sessions()

    async def stop(self):
        async with self._lock:
            self.running = False
        logger.info("🛑 Stopping Telegram session listener service")
        await asyncio.gather(*(self._stop_session(user_id) for user_id in list(self.clients.keys())), return_exceptions=True)

    async def reload_all_sessions(self):
        if not self.running:
            return

        database = get_database()
        cursor = database.telegram_app_configs.find({
            "is_verified": True,
            "session_file": {"$exists": True, "$ne": None},
            "api_id": {"$exists": True, "$ne": None},
            "api_hash": {"$exists": True, "$ne": None},
        })

        active_user_ids = set()
        async for config in cursor:
            user_id = str(config["user_id"])
            active_user_ids.add(user_id)
            await self._ensure_session_running(user_id, config)

        # Stop listeners for users that are no longer verified
        for user_id in list(self.clients.keys()):
            if user_id not in active_user_ids:
                await self._stop_session(user_id)

    async def reload_user_session(self, user_id: str):
        if not self.running:
            return
        await self._stop_session(user_id)

        database = get_database()
        config = await database.telegram_app_configs.find_one({
            "user_id": user_id,
            "is_verified": True,
            "session_file": {"$exists": True, "$ne": None},
        })

        if config:
            await self._ensure_session_running(user_id, config)

    async def stop_user_session(self, user_id: str):
        await self._stop_session(user_id)

    async def _ensure_session_running(self, user_id: str, config: dict):
        if user_id in self.clients:
            return

        session_path_raw = config.get("session_file") or str(self.session_dir / user_id)
        session_path = Path(session_path_raw)
        # Telethon automatically adds .session extension, so check both
        if not session_path.exists() and not session_path.with_suffix('.session').exists():
            logger.warning(f"⚠️ Telegram session file missing for user {user_id}: {session_path} or {session_path.with_suffix('.session')}")
            return
        
        # Use .session path if the raw path doesn't exist
        if not session_path.exists():
            session_path = session_path.with_suffix('.session')

        api_id = self._parse_api_id(config.get("api_id"))
        api_hash = config.get("api_hash")
        if not api_hash:
            logger.warning(f"⚠️ Missing api_hash for user {user_id}")
            return

        self.session_dir.mkdir(parents=True, exist_ok=True)
        # Ensure we use the .session path for Telethon
        session_file = str(session_path) if session_path.suffix == '.session' else str(session_path.with_suffix('.session'))
        logger.info(f"📡 Starting Telegram listener for user {user_id} (session: {session_file})")

        client = TelegramClient(session_file, api_id, api_hash)
        await client.connect()
        
        # Check if client is connected and authorized
        if await client.is_user_authorized():
            logger.info(f"✅ Telegram client connected and authorized for user {user_id}")
        else:
            logger.warning(f"⚠️ Telegram client connected but not authorized for user {user_id}")

        handler = self._make_event_handler(user_id)
        client.add_event_handler(handler, events.NewMessage(incoming=True))

        task = asyncio.create_task(self._run_client(user_id, client))
        self.clients[user_id] = client
        self.tasks[user_id] = task
        self.handlers[user_id] = handler
        
        logger.info(f"🎧 Telegram listener started and listening for messages (user: {user_id})")

    async def _stop_session(self, user_id: str):
        client = self.clients.pop(user_id, None)
        task = self.tasks.pop(user_id, None)
        handler = self.handlers.pop(user_id, None)

        if client:
            if handler:
                with suppress(Exception):
                    client.remove_event_handler(handler)
            await client.disconnect()

        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task

        logger.info(f"🛑 Stopped Telegram listener for user {user_id}")

    async def _run_client(self, user_id: str, client: TelegramClient):
        try:
            await client.run_until_disconnected()
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error(f"❌ Telegram client error for user {user_id}: {exc}")
        finally:
            self.clients.pop(user_id, None)
            self.handlers.pop(user_id, None)
            self.tasks.pop(user_id, None)
            logger.info(f"🔌 Telegram client disconnected for user {user_id}")

    def _make_event_handler(self, user_id: str):
        async def _handler(event):
            await self._handle_new_message(user_id, event)
        return _handler

    async def _handle_new_message(self, user_id: str, event):
        try:
            sender = await event.get_sender()
            chat = await event.get_chat()
            sender_username = getattr(sender, "username", None) or "(no username)"
            sender_name = f"{getattr(sender, 'first_name', '')} {getattr(sender, 'last_name', '')}".strip() or "(no name)"
            sender_id = getattr(sender, "id", "unknown")
            chat_title = getattr(chat, "title", "Private Chat")
            message_text = event.raw_text

            logger.info(
                "📩 [Telegram][user=%s] From %s (@%s | %s) in %s: %s",
                user_id,
                sender_name,
                sender_username,
                sender_id,
                chat_title,
                message_text,
            )
            
            # Process message and insert to inbox (similar to /api/inbox/receive)
            await self._process_message_to_inbox(user_id, sender_username, message_text)
            
        except Exception as exc:
            logger.error(f"❌ Failed to process incoming Telegram message for user {user_id}: {exc}")
    
    async def _process_message_to_inbox(self, telegram_user_id: str, sender_username: str, message_text: str):
        """
        Process incoming Telegram message and insert to inbox_responses collection.
        Logic similar to /api/inbox/receive but without triggering campaign calls.
        """
        try:
            db = get_database()
            
            # Skip if sender has no username (can't match to contact)
            if not sender_username or sender_username == "(no username)":
                logger.debug(f"⚠️ Skipping inbox insert for message from user without username (user_id: {telegram_user_id})")
                return
            
            # Find ALL contacts with matching telegram_username
            query_username = sender_username.lstrip('@')
            contacts_cursor = db.contacts.find({
                "telegram_username": {"$in": [sender_username, query_username, f"@{query_username}"]},
            })
            all_contacts = await contacts_cursor.to_list(length=None)
            
            logger.debug(f"🔍 Found {len(all_contacts)} contact(s) with telegram_username: {sender_username}")
            
            if not all_contacts:
                logger.debug(f"⚠️ No contacts found with telegram_username: {sender_username}")
            else:
                # Use set to track processed campaigns globally (campaign_id -> contact_id)
                # This ensures each campaign is only processed once per message
                processed_campaigns = {}  # {campaign_id: contact_id} - track which contact was used for each campaign
                processed_contacts = set()  # Track processed contact IDs to avoid duplicates
                total_inserted = 0
                
                # Process each contact
                for contact in all_contacts:
                    contact_id = str(contact["_id"])
                    
                    # Skip if this contact was already processed (duplicate in query results)
                    if contact_id in processed_contacts:
                        logger.debug(f"   ⚠️ Contact {contact_id} already processed, skipping duplicate")
                        continue
                    
                    processed_contacts.add(contact_id)
                    resolved_user_id = contact.get("user_id")
                    
                    logger.debug(f"📋 Processing Contact: {contact_id} (user: {resolved_user_id})")
                    logger.debug(f"   - Name: {contact.get('first_name', '')} {contact.get('last_name', '')}")
                    
                    if not resolved_user_id:
                        logger.debug(f"   ⚠️ Contact has no user_id, skipping campaign lookup")
                        # Still insert inbox record without campaign
                        inbox_doc = {
                            "_id": f"{str(datetime.utcnow().timestamp()).replace('.', '')}_{contact_id}_no_campaign",
                            "user_id": None,
                            "platform": "telegram",
                            "contact": sender_username,
                            "content": message_text,
                            "campaign_id": None,
                            "contact_id": contact_id,
                            "type": "incoming",
                            "created_at": datetime.utcnow(),
                        }
                        try:
                            await db.inbox_responses.insert_one(inbox_doc)
                            total_inserted += 1
                            logger.debug(f"   ✅ Inbox record created (no campaign)")
                        except Exception as e:
                            if "duplicate key" not in str(e).lower() and "E11000" not in str(e):
                                logger.error(f"   ❌ Failed to insert inbox: {e}")
                        continue
                    
                    # Find ALL ACTIVE campaigns containing this contact
                    contact_object_id = contact["_id"]  # Use ObjectId directly
                    campaigns_cursor = db.campaigns.find({
                        "contacts": {"$in": [contact_object_id]},
                        "user_id": resolved_user_id,
                        "status": "active",  # Only process active campaigns
                    })
                    campaigns = await campaigns_cursor.to_list(length=None)
                    
                    logger.debug(f"   🔍 Found {len(campaigns)} active campaign(s) for this contact")
                    
                    if campaigns and len(campaigns) > 0:
                        # Process each campaign
                        for campaign in campaigns:
                            campaign_id = str(campaign["_id"])
                            campaign_name = campaign.get("name", "Unknown")
                            
                            # Skip if this campaign was already processed for this message
                            # Use the first contact that found this campaign
                            if campaign_id in processed_campaigns:
                                logger.debug(f"   ⚠️ Campaign {campaign_id} already processed with contact {processed_campaigns[campaign_id]}, skipping duplicate")
                                continue
                            
                            # Mark this campaign as processed with this contact
                            processed_campaigns[campaign_id] = contact_id
                            
                            logger.debug(f"   📊 Processing Campaign: {campaign_id} ({campaign_name}) with contact {contact_id}")
                            
                            # Create unique inbox record for each campaign
                            # Use campaign_id and contact_id in _id to ensure uniqueness
                            timestamp = str(datetime.utcnow().timestamp()).replace('.', '')
                            inbox_doc = {
                                "_id": f"{timestamp}_{campaign_id}_{contact_id}",
                                "user_id": resolved_user_id,
                                "platform": "telegram",
                                "contact": sender_username,
                                "content": message_text,
                                "campaign_id": campaign_id,
                                "contact_id": contact_id,
                                "type": "incoming",
                                "created_at": datetime.utcnow(),
                            }
                            
                            try:
                                await db.inbox_responses.insert_one(inbox_doc)
                                inbox_doc["id"] = inbox_doc["_id"]
                                total_inserted += 1
                                logger.debug(f"      ✅ Inserted inbox for campaign {campaign_id} with contact {contact_id}")
                            except Exception as e:
                                # Skip if duplicate (same message for same campaign+contact combination)
                                if "duplicate key" in str(e).lower() or "E11000" in str(e):
                                    logger.debug(f"      ⚠️ Inbox record already exists for campaign {campaign_id} and contact {contact_id}, skipping")
                                else:
                                    logger.error(f"      ❌ Failed to insert inbox for campaign {campaign_id}: {e}")
                    else:
                        logger.debug(f"   ⚠️ No active campaigns found for this contact")
                        # Still insert inbox record without campaign_id if contact exists
                        inbox_doc = {
                            "_id": f"{str(datetime.utcnow().timestamp()).replace('.', '')}_{contact_id}_no_campaign",
                            "user_id": resolved_user_id,
                            "platform": "telegram",
                            "contact": sender_username,
                            "content": message_text,
                            "campaign_id": None,
                            "contact_id": contact_id,
                            "type": "incoming",
                            "created_at": datetime.utcnow(),
                        }
                        try:
                            await db.inbox_responses.insert_one(inbox_doc)
                            total_inserted += 1
                            logger.debug(f"   ✅ Inbox record created (no active campaign)")
                        except Exception as e:
                            if "duplicate key" not in str(e).lower() and "E11000" not in str(e):
                                logger.error(f"   ❌ Failed to insert inbox: {e}")
                
                logger.info(
                    "💾 [Inbox] Message processed: contact=%s, total_contacts=%d, total_campaigns=%d, total_inserted=%d",
                    sender_username,
                    len(all_contacts),
                    len(processed_campaigns),
                    total_inserted
                )
            
        except Exception as exc:
            logger.error(f"❌ Failed to insert message to inbox (user: {telegram_user_id}, sender: {sender_username}): {exc}")

    @staticmethod
    def _parse_api_id(api_id_value: Optional[str]) -> int:
        try:
            return int(api_id_value)  # type: ignore[arg-type]
        except (TypeError, ValueError):
            raise ValueError("api_id must be a numeric value")


telegram_listener = TelegramSessionListener()

