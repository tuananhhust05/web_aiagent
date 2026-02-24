"""
Gmail Service for reading and sending emails using user's Gmail account
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from bson import ObjectId
from app.core.config import settings
from app.core.database import get_database
import logging

logger = logging.getLogger(__name__)


class GmailService:
    """Service to interact with Gmail API using user's OAuth tokens"""
    
    GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    
    async def _find_user_by_id(self, db, user_id: str):
        """Find user by _id trying both string and ObjectId."""
        uid_str = str(user_id) if user_id else ""
        logger.info(f"[GMAIL] _find_user_by_id: Looking for user_id={uid_str}")
        
        # Try as string first
        user = await db.users.find_one({"_id": uid_str})
        if user:
            logger.info(f"[GMAIL] _find_user_by_id: Found user by string _id")
            return user
        
        # Try as ObjectId
        if len(uid_str) == 24 and all(c in "0123456789abcdefABCDEF" for c in uid_str):
            try:
                user = await db.users.find_one({"_id": ObjectId(uid_str)})
                if user:
                    logger.info(f"[GMAIL] _find_user_by_id: Found user by ObjectId _id")
                    return user
            except Exception as e:
                logger.warning(f"[GMAIL] _find_user_by_id: ObjectId lookup failed: {e}")
        
        logger.warning(f"[GMAIL] _find_user_by_id: User not found for {uid_str}")
        return None
    
    async def _refresh_access_token(self, user_id: str) -> Optional[str]:
        """
        Refresh the access token using refresh token stored in database
        Returns new access_token or None if refresh fails
        """
        db = get_database()
        user = await self._find_user_by_id(db, user_id)
        
        if not user:
            logger.error(f"User {user_id} not found")
            return None
        
        refresh_token = user.get("google_refresh_token")
        if not refresh_token:
            logger.warning(f"No refresh token found for user {user_id}")
            return None
        
        # Decrypt refresh token if encrypted
        try:
            from app.services.calendar_crypto import decrypt_refresh_token
            refresh_token = decrypt_refresh_token(refresh_token)
        except Exception as e:
            logger.warning(f"Failed to decrypt refresh token, trying as plain text: {e}")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.GOOGLE_TOKEN_URL,
                    data={
                        "client_id": settings.GOOGLE_CLIENT_ID,
                        "client_secret": settings.GOOGLE_CLIENT_SECRET,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token"
                    }
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    new_access_token = token_data.get("access_token")
                    expires_in = token_data.get("expires_in", 3600)
                    
                    # Update access token in database - use the actual user _id
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {
                            "$set": {
                                "google_access_token": new_access_token,
                                "google_token_expiry": datetime.utcnow() + timedelta(seconds=expires_in)
                            }
                        }
                    )
                    
                    logger.info(f"✅ Refreshed access token for user {user_id}")
                    return new_access_token
                else:
                    logger.error(f"❌ Failed to refresh token: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error refreshing access token: {str(e)}")
            return None
    
    async def check_token_scope(self, access_token: str) -> Optional[List[str]]:
        """
        Check what scopes the access token has by calling Google tokeninfo endpoint
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v1/tokeninfo",
                    params={"access_token": access_token},
                    timeout=10.0
                )
                if response.status_code == 200:
                    token_info = response.json()
                    scope_string = token_info.get("scope", "")
                    scopes = scope_string.split() if scope_string else []
                    return scopes
                else:
                    logger.warning(f"⚠️ Failed to check token scope: {response.status_code}")
                    return None
        except Exception as e:
            logger.warning(f"⚠️ Error checking token scope: {str(e)}")
            return None
    
    async def _get_valid_access_token(self, user_id: str) -> Optional[str]:
        """
        Get a valid access token for the user, refreshing if necessary
        Also checks if token has Gmail scopes
        """
        db = get_database()
        user = await self._find_user_by_id(db, user_id)
        
        if not user:
            logger.error(f"❌ User {user_id} not found")
            return None
        
        access_token = user.get("google_access_token")
        token_expiry = user.get("google_token_expiry")
        stored_scope = user.get("google_gmail_scope", "")
        
        logger.info(f"🔍 [GMAIL] User {user_id}: has_token={bool(access_token)}, stored_scope={stored_scope}")
        
        # Check if token is expired or about to expire (within 5 minutes)
        if not access_token or not token_expiry:
            logger.info(f"🔄 No access token or expiry found, refreshing for user {user_id}")
            new_token = await self._refresh_access_token(user_id)
            return new_token
        
        # Check if token is expired
        if isinstance(token_expiry, datetime):
            if datetime.utcnow() >= token_expiry - timedelta(minutes=5):
                logger.info(f"🔄 Token expired or expiring soon, refreshing for user {user_id}")
                new_token = await self._refresh_access_token(user_id)
                return new_token
        
        # Log token info for debugging
        if access_token:
            token_preview = access_token[:20] + "..." if len(access_token) > 20 else access_token
            logger.info(f"🔑 [GMAIL] Using access token: {token_preview}")
        
        return access_token
    
    async def get_latest_emails(
        self, 
        user_id: str, 
        max_results: int = 10,
        query: str = ""
    ) -> List[Dict]:
        """
        Get latest emails from user's Gmail inbox (excluding sent emails).
        Returns list of email dictionaries with id, subject, from, snippet, date
        Only returns emails that need a reply (incoming emails, not sent by user).
        """
        access_token = await self._get_valid_access_token(user_id)
        if not access_token:
            raise Exception("Failed to get valid access token. Please re-authenticate with Google.")
        
        try:
            # First, get list of message IDs - filter to inbox only (exclude sent)
            list_url = f"{self.GMAIL_API_BASE}/users/me/messages"
            
            # Build query: inbox emails only, exclude sent and drafts
            base_query = "in:inbox -in:sent -in:drafts"
            if query:
                base_query = f"{base_query} {query}"
            
            params = {
                "maxResults": max_results,
                "q": base_query,
            }
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                
                # Get message list
                list_response = await client.get(list_url, headers=headers, params=params)
                
                if list_response.status_code != 200:
                    error_text = list_response.text
                    logger.error(f"❌ Gmail API list error: {list_response.status_code} - {error_text}")
                    raise Exception(f"Gmail API error: {error_text}")
                
                messages_data = list_response.json()
                message_ids = [msg["id"] for msg in messages_data.get("messages", [])]
                
                if not message_ids:
                    return []
                
                # Get full message details for each message
                emails = []
                for msg_id in message_ids:
                    try:
                        msg_url = f"{self.GMAIL_API_BASE}/users/me/messages/{msg_id}"
                        msg_response = await client.get(
                            msg_url,
                            headers=headers,
                            params={"format": "full"}
                        )
                        
                        if msg_response.status_code == 200:
                            msg_data = msg_response.json()
                            
                            # Extract email details
                            email_headers = msg_data.get("payload", {}).get("headers", [])
                            
                            def get_header(name: str) -> str:
                                for h in email_headers:
                                    if h.get("name", "").lower() == name.lower():
                                        return h.get("value", "")
                                return ""
                            
                            subject = get_header("Subject")
                            sender = get_header("From")
                            date_str = get_header("Date")
                            
                            # Parse date
                            email_date = None
                            if date_str:
                                try:
                                    # Try to parse RFC 2822 date
                                    from email.utils import parsedate_to_datetime
                                    email_date = parsedate_to_datetime(date_str)
                                except:
                                    pass
                            
                            snippet = msg_data.get("snippet", "")
                            thread_id = msg_data.get("threadId", "")
                            
                            emails.append({
                                "id": msg_id,
                                "thread_id": thread_id,
                                "subject": subject,
                                "from": sender,
                                "snippet": snippet,
                                "date": email_date.isoformat() if email_date else None,
                                "internal_date": msg_data.get("internalDate"),
                            })
                    except Exception as e:
                        logger.warning(f"⚠️ Error fetching message {msg_id}: {str(e)}")
                        continue
                
                logger.info(f"✅ Retrieved {len(emails)} emails for user {user_id}")
                return emails
                
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ HTTP error getting emails: {str(e)}")
            raise Exception(f"Gmail API HTTP error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error getting emails: {str(e)}")
            raise Exception(f"Failed to get emails: {str(e)}")

    async def get_email_by_id(self, user_id: str, email_id: str) -> Optional[Dict]:
        """
        Get full email content by ID including body text
        """
        access_token = await self._get_valid_access_token(user_id)
        if not access_token:
            raise Exception("Failed to get valid access token. Please re-authenticate with Google.")
        
        try:
            msg_url = f"{self.GMAIL_API_BASE}/users/me/messages/{email_id}"
            
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                msg_response = await client.get(
                    msg_url,
                    headers=headers,
                    params={"format": "full"}
                )
                
                if msg_response.status_code != 200:
                    logger.error(f"❌ Gmail API error: {msg_response.status_code} - {msg_response.text}")
                    return None
                
                msg_data = msg_response.json()
                
                # Extract headers
                email_headers = msg_data.get("payload", {}).get("headers", [])
                
                def get_header(name: str) -> str:
                    for h in email_headers:
                        if h.get("name", "").lower() == name.lower():
                            return h.get("value", "")
                    return ""
                
                subject = get_header("Subject")
                sender = get_header("From")
                to = get_header("To")
                date_str = get_header("Date")
                
                # Parse date
                email_date = None
                if date_str:
                    try:
                        from email.utils import parsedate_to_datetime
                        email_date = parsedate_to_datetime(date_str)
                    except:
                        pass
                
                # Extract body
                body_text = self._extract_email_body(msg_data.get("payload", {}))
                
                return {
                    "id": email_id,
                    "thread_id": msg_data.get("threadId", ""),
                    "subject": subject,
                    "from": sender,
                    "to": to,
                    "date": email_date.isoformat() if email_date else None,
                    "snippet": msg_data.get("snippet", ""),
                    "body": body_text,
                    "labels": msg_data.get("labelIds", []),
                }
                
        except Exception as e:
            logger.error(f"❌ Error getting email {email_id}: {str(e)}")
            return None
    
    def _extract_email_body(self, payload: Dict) -> str:
        """
        Extract plain text body from email payload
        Handles multipart messages
        """
        import base64
        
        body_text = ""
        
        # Check if body is directly in payload
        body_data = payload.get("body", {}).get("data")
        if body_data:
            try:
                body_text = base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
            except Exception:
                pass
        
        # Check parts for multipart messages
        parts = payload.get("parts", [])
        for part in parts:
            mime_type = part.get("mimeType", "")
            
            # Prefer text/plain
            if mime_type == "text/plain":
                data = part.get("body", {}).get("data")
                if data:
                    try:
                        body_text = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                        break
                    except Exception:
                        pass
            
            # Fallback to text/html if no plain text
            elif mime_type == "text/html" and not body_text:
                data = part.get("body", {}).get("data")
                if data:
                    try:
                        html = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                        # Simple HTML to text conversion
                        import re
                        body_text = re.sub(r'<[^>]+>', '', html)
                        body_text = body_text.replace('&nbsp;', ' ')
                        body_text = body_text.replace('&amp;', '&')
                        body_text = body_text.replace('&lt;', '<')
                        body_text = body_text.replace('&gt;', '>')
                    except Exception:
                        pass
            
            # Recursively check nested parts
            nested_parts = part.get("parts", [])
            if nested_parts and not body_text:
                body_text = self._extract_email_body(part)
        
        return body_text.strip()

    async def send_email(
        self,
        user_id: str,
        to: str,
        subject: str,
        body: str,
        reply_to_message_id: Optional[str] = None,
        thread_id: Optional[str] = None,
    ) -> Dict:
        """
        Send an email using the user's Gmail account.
        
        Args:
            user_id: The user's ID
            to: Recipient email address
            subject: Email subject
            body: Email body (plain text)
            reply_to_message_id: If replying, the original message ID
            thread_id: If replying, the thread ID to keep conversation together
            
        Returns:
            Dict with id, threadId, labelIds of the sent message
        """
        access_token = await self._get_valid_access_token(user_id)
        if not access_token:
            raise Exception("Failed to get valid access token. Please re-authenticate with Google.")
        
        import base64
        from email.mime.text import MIMEText
        
        # Create email message
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        
        # If replying, add headers to keep in same thread
        if reply_to_message_id:
            # Get original message to extract Message-ID header for In-Reply-To
            original = await self.get_email_by_id(user_id, reply_to_message_id)
            if original:
                # For replies, prepend "Re: " if not already there
                if not subject.lower().startswith('re:'):
                    message['subject'] = f"Re: {subject}"
        
        # Encode to base64url
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # Build request body
        request_body: Dict[str, str] = {"raw": raw}
        if thread_id:
            request_body["threadId"] = thread_id
        
        try:
            send_url = f"{self.GMAIL_API_BASE}/users/me/messages/send"
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                }
                response = await client.post(
                    send_url,
                    headers=headers,
                    json=request_body,
                    timeout=30.0,
                )
                
                if response.status_code != 200:
                    error_text = response.text
                    logger.error(f"❌ Gmail send error: {response.status_code} - {error_text}")
                    
                    # Check for permission error
                    if response.status_code == 403:
                        raise Exception("Permission denied. Please reconnect Gmail with send access.")
                    raise Exception(f"Failed to send email: {error_text}")
                
                result = response.json()
                logger.info(f"✅ Email sent successfully. Message ID: {result.get('id')}")
                return result
                
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ HTTP error sending email: {str(e)}")
            raise Exception(f"Failed to send email: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error sending email: {str(e)}")
            raise

    async def check_send_permission(self, user_id: str) -> bool:
        """
        Check if the user's Gmail token has permission to send emails.
        First checks stored scope in DB, then validates with Google API if needed.
        Returns True if can send, False otherwise.
        """
        try:
            db = get_database()
            user = await self._find_user_by_id(db, user_id)
            
            if not user:
                logger.warning(f"[GMAIL] check_send_permission: User {user_id} not found in DB")
                return False
            
            # First check stored scope from OAuth
            stored_scope = user.get("google_gmail_scope", "")
            gmail_connected = user.get("google_gmail_connected", False)
            access_token = user.get("google_access_token", "")
            
            logger.info(f"[GMAIL] check_send_permission for user {user_id}:")
            logger.info(f"  - gmail_connected: {gmail_connected}")
            logger.info(f"  - stored_scope: {stored_scope}")
            logger.info(f"  - has_access_token: {bool(access_token)}")
            
            if not gmail_connected:
                logger.warning(f"[GMAIL] check_send_permission: gmail_connected is False")
                return False
            
            if not access_token:
                logger.warning(f"[GMAIL] check_send_permission: No access token")
                return False
            
            # Check if stored scope includes modify/send permission
            has_send_scope = (
                "gmail.modify" in stored_scope.lower() or
                "gmail.send" in stored_scope.lower() or
                "gmail.compose" in stored_scope.lower()
            )
            
            logger.info(f"  - has_send_scope: {has_send_scope}")
            
            if has_send_scope:
                logger.info(f"[GMAIL] check_send_permission: User {user_id} has send permission!")
                return True
            
            logger.warning(f"[GMAIL] check_send_permission: User does not have send permission. Scope: {stored_scope}")
            return False
            
        except Exception as e:
            logger.exception(f"Error checking send permission: {e}")
            return False


# Create global instance
gmail_service = GmailService()

