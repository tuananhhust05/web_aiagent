"""
Gmail Service for reading and sending emails using user's Gmail account
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from app.core.config import settings
from app.core.database import get_database
import logging

logger = logging.getLogger(__name__)


class GmailService:
    """Service to interact with Gmail API using user's OAuth tokens"""
    
    GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    
    async def _refresh_access_token(self, user_id: str) -> Optional[str]:
        """
        Refresh the access token using refresh token stored in database
        Returns new access_token or None if refresh fails
        """
        db = get_database()
        user = await db.users.find_one({"_id": user_id})
        
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
                    
                    # Update access token in database
                    await db.users.update_one(
                        {"_id": user_id},
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
        user = await db.users.find_one({"_id": user_id})
        
        if not user:
            logger.error(f"❌ User {user_id} not found")
            return None
        
        access_token = user.get("google_access_token")
        token_expiry = user.get("google_token_expiry")
        
        # Log token info for debugging
        if access_token:
            # Only log first 20 chars of token for security
            token_preview = access_token[:20] + "..." if len(access_token) > 20 else access_token
            logger.info(f"🔑 [GMAIL] Using access token: {token_preview}")
            
            # Check token scope
            scopes = await self.check_token_scope(access_token)
            if scopes:
                logger.info(f"📋 [GMAIL] Token scopes: {', '.join(scopes)}")
                has_gmail_scope = any("gmail" in scope.lower() for scope in scopes)
                if not has_gmail_scope:
                    logger.error(f"❌ [GMAIL] Token does NOT have Gmail scopes! User needs to re-authorize.")
                    logger.error(f"❌ [GMAIL] Current scopes: {scopes}")
                    return None
        
        # Check if token is expired or about to expire (within 5 minutes)
        if not access_token or not token_expiry:
            logger.info(f"🔄 No access token or expiry found, refreshing for user {user_id}")
            new_token = await self._refresh_access_token(user_id)
            if new_token:
                # Check scope of new token
                scopes = await self.check_token_scope(new_token)
                if scopes:
                    logger.info(f"📋 [GMAIL] Refreshed token scopes: {', '.join(scopes)}")
            return new_token
        
        # Check if token is expired
        if isinstance(token_expiry, datetime):
            if datetime.utcnow() >= token_expiry - timedelta(minutes=5):
                logger.info(f"🔄 Token expired or expiring soon, refreshing for user {user_id}")
                new_token = await self._refresh_access_token(user_id)
                if new_token:
                    # Check scope of new token
                    scopes = await self.check_token_scope(new_token)
                    if scopes:
                        logger.info(f"📋 [GMAIL] Refreshed token scopes: {', '.join(scopes)}")
                return new_token
        
        return access_token
    
    async def get_latest_emails(
        self, 
        user_id: str, 
        max_results: int = 10,
        query: str = ""
    ) -> List[Dict]:
        """
        Get latest emails from user's Gmail inbox
        Returns list of email dictionaries with id, subject, from, snippet, date
        """
        access_token = await self._get_valid_access_token(user_id)
        if not access_token:
            raise Exception("Failed to get valid access token. Please re-authenticate with Google.")
        
        try:
            # First, get list of message IDs
            list_url = f"{self.GMAIL_API_BASE}/users/me/messages"
            params = {
                "maxResults": max_results,
            }
            if query:
                params["q"] = query
            
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

# Create global instance
gmail_service = GmailService()

