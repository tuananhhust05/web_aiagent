import aiohttp
import asyncio
from typing import List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.whatsapp_api_url = "http://3.106.56.62:8000/whatsapp/send"
    
    async def send_message(self, phone_numbers: List[str], message: str, user_id: str = None) -> Dict[str, Any]:
        """
        Send WhatsApp message to multiple phone numbers
        
        Args:
            phone_numbers: List of phone numbers (e.g., ["+84 33 917 0155"])
            message: Message content to send
            user_id: User ID to include in the request
            
        Returns:
            Dict containing response data
        """
        if not phone_numbers or not message:
            raise ValueError("Phone numbers and message are required")
        
        payload = {
            "phone_numbers": phone_numbers,
            "message": message
        }
        
        if user_id:
            payload["user_id"] = user_id
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.whatsapp_api_url,
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
                        logger.info(f"✅ WhatsApp message sent successfully to {len(phone_numbers)} numbers")
                        return {
                            "success": True,
                            "status_code": response.status,
                            "data": response_data,
                            "sent_to": phone_numbers
                        }
                    else:
                        logger.error(f"❌ WhatsApp API error: {response.status} - {response_data}")
                        return {
                            "success": False,
                            "status_code": response.status,
                            "error": response_data,
                            "sent_to": phone_numbers
                        }
                        
        except aiohttp.ClientError as e:
            logger.error(f"❌ WhatsApp API connection error: {str(e)}")
            return {
                "success": False,
                "error": f"Connection error: {str(e)}",
                "sent_to": phone_numbers
            }
        except Exception as e:
            logger.error(f"❌ Failed to send WhatsApp message: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "sent_to": phone_numbers
            }
    
    async def send_message_to_contact(self, whatsapp_number: str, message: str, user_id: str = None) -> Dict[str, Any]:
        """
        Send WhatsApp message to a single contact
        
        Args:
            whatsapp_number: Phone number (e.g., "+84 33 917 0155")
            message: Message content to send
            user_id: User ID to include in the request
            
        Returns:
            Dict containing response data
        """
        return await self.send_message([whatsapp_number], message, user_id)
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test WhatsApp API connection
        
        Returns:
            Dict containing connection test result
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.whatsapp_api_url.replace('/send', '/health'),
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        return {"success": True, "status": "API is reachable"}
                    else:
                        return {"success": False, "status": f"API returned status {response.status}"}
        except Exception as e:
            return {"success": False, "status": f"Connection failed: {str(e)}"}

# Create global instance
whatsapp_service = WhatsAppService()
