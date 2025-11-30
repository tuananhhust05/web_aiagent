import aiohttp
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.telegram_listener import telegram_listener
import logging

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.telegram_api_url = "http://3.106.56.62:8000/telegram/send"
    
    def build_telegram_url(self, username: str) -> str:
        """
        Build Telegram URL from username
        
        Args:
            username: Telegram username (with or without @)
            
        Returns:
            Telegram URL
        """
        # Remove @ if present
        clean_username = username.lstrip('@')
        return f"https://web.telegram.org/k/#@{clean_username}"
    
    async def send_message(self, urls: List[str], message: str, user_id: str = None) -> Dict[str, Any]:
        """
        Send Telegram message to multiple URLs
        
        Args:
            urls: List of Telegram URLs (e.g., ["https://web.telegram.org/k/#@username"])
            message: Message content to send
            user_id: User ID to include in the request
            
        Returns:
            Dict containing response data
        """
        if not urls or not message:
            raise ValueError("URLs and message are required")
        
        payload = {
            "urls": urls,
            "message": message
        }
        
        if user_id:
            payload["user_id"] = user_id
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.telegram_api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    # Check content type before trying to parse JSON
                    content_type = response.headers.get('content-type', '')
                    
                    if 'application/json' in content_type:
                        try:
                            response_data = await response.json()
                        except Exception as json_error:
                            logger.error(f"❌ Failed to parse JSON response: {str(json_error)}")
                            response_data = {"error": "Invalid JSON response"}
                    else:
                        # If not JSON, get text response
                        response_text = await response.text()
                        logger.warning(f"⚠️ Non-JSON response received: {content_type}")
                        logger.warning(f"⚠️ Response content: {response_text[:200]}...")
                        response_data = {"error": f"Non-JSON response: {response_text[:100]}"}
                    
                    if response.status == 200:
                        logger.info(f"✅ Telegram message sent successfully to {len(urls)} URLs")
                        return {
                            "success": True,
                            "status_code": response.status,
                            "data": response_data,
                            "sent_to": urls
                        }
                    else:
                        logger.error(f"❌ Telegram API error: {response.status} - {response_data}")
                        return {
                            "success": False,
                            "status_code": response.status,
                            "error": response_data,
                            "sent_to": urls
                        }
                        
        except aiohttp.ClientError as e:
            logger.error(f"❌ Telegram API connection error: {str(e)}")
            return {
                "success": False,
                "error": f"Connection error: {str(e)}",
                "sent_to": urls
            }
        except Exception as e:
            logger.error(f"❌ Failed to send Telegram message: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "sent_to": urls
            }
    
    async def send_message_to_contact(self, telegram_username: str, message: str, user_id: str = None) -> Dict[str, Any]:
        """
        Send Telegram message to a single contact
        
        Args:
            telegram_username: Telegram username (e.g., "binhnt86" or "@binhnt86")
            message: Message content to send
            user_id: User ID to include in the request
            
        Returns:
            Dict containing response data
        """
        telegram_url = self.build_telegram_url(telegram_username)
        return await self.send_message([telegram_url], message, user_id)
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test Telegram API connection
        
        Returns:
            Dict containing connection test result
        """
        try:
            # Test with a dummy message
            test_urls = ["https://web.telegram.org/k/#@test"]
            test_message = "Test message"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.telegram_api_url,
                    json={"urls": test_urls, "message": test_message},
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status in [200, 400]:  # 400 might be expected for test data
                        return {"success": True, "status": "API is reachable"}
                    else:
                        return {"success": False, "status": f"API returned status {response.status}"}
        except Exception as e:
            return {"success": False, "status": f"Connection failed: {str(e)}"}

# Create global instance
telegram_service = TelegramService()


async def send_message_to_user(recipient: str, message: str, user_id: Optional[str] = None) -> bool:
    """
    Send a message to a user or chat using Telegram client from session.
    
    :param recipient: username (str) hoặc user_id (int) hoặc chat_id
    :param message: nội dung tin nhắn
    :param user_id: User ID để lấy Telegram client từ session
    :return: True nếu gửi thành công, False nếu thất bại
    """
    try:
        if not user_id:
            logger.error("❌ [TELEGRAM] user_id is required to get Telegram client from session")
            return False
        
        # Đảm bảo user_id là string (telegram_listener sử dụng string keys)
        user_id_str = str(user_id)
        
        # Lấy client từ telegram_listener
        client = telegram_listener.clients.get(user_id_str)
        if not client:
            logger.error(f"❌ [TELEGRAM] Telegram client not found for user_id: {user_id_str}")
            logger.info(f"📋 [TELEGRAM] Available clients: {list(telegram_listener.clients.keys())}")
            return False
        
        # Kiểm tra xem client có đang kết nối không
        if not client.is_connected():
            logger.warning(f"⚠️ [TELEGRAM] Client not connected for user_id: {user_id_str}, attempting to connect...")
            await client.connect()
        
        # Kiểm tra recipient có @ chưa, nếu chưa thì thêm vào
        if recipient and not recipient.startswith('@'):
            recipient = f"@{recipient}"
            logger.info(f"📝 [TELEGRAM] Added @ prefix to recipient: {recipient}")
        
        logger.info(f"📤 [TELEGRAM] Sending message to {recipient} (user_id: {user_id_str})")
        logger.info(f"📝 [TELEGRAM] Message content: {message[:100]}{'...' if len(message) > 100 else ''}")
        
        # Gửi tin nhắn
        await client.send_message(recipient, message)
        
        logger.info(f"✅ [TELEGRAM] Message sent successfully to {recipient}")
        print(f"✅ Message sent to {recipient}: {message[:50]}{'...' if len(message) > 50 else ''}")
        return True
        
    except Exception as e:
        logger.error(f"❌ [TELEGRAM] Failed to send message to {recipient}: {str(e)}")
        print(f"❌ Failed to send message to {recipient}: {e}")
        return False











