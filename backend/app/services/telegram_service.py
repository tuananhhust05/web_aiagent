import aiohttp
import asyncio
from typing import List, Dict, Any
from app.core.config import settings
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
    
    async def send_message(self, urls: List[str], message: str) -> Dict[str, Any]:
        """
        Send Telegram message to multiple URLs
        
        Args:
            urls: List of Telegram URLs (e.g., ["https://web.telegram.org/k/#@username"])
            message: Message content to send
            
        Returns:
            Dict containing response data
        """
        if not urls or not message:
            raise ValueError("URLs and message are required")
        
        payload = {
            "urls": urls,
            "message": message
        }
        
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
    
    async def send_message_to_contact(self, telegram_username: str, message: str) -> Dict[str, Any]:
        """
        Send Telegram message to a single contact
        
        Args:
            telegram_username: Telegram username (e.g., "binhnt86" or "@binhnt86")
            message: Message content to send
            
        Returns:
            Dict containing response data
        """
        telegram_url = self.build_telegram_url(telegram_username)
        return await self.send_message([telegram_url], message)
    
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


