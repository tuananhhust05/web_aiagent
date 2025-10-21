import aiohttp
import logging
from typing import Dict, List, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class LinkedInService:
    def __init__(self):
        self.api_url = "http://3.106.56.62:8000/linkedin/send"
        
    async def send_message_to_contact(self, linkedin_profile: str, message: str) -> Dict[str, Any]:
        """
        Send a LinkedIn message to a contact
        
        Args:
            linkedin_profile: LinkedIn profile URL
            message: Message content to send
            
        Returns:
            Dict with success status and response data
        """
        try:
            logger.info(f"🔗 [LINKEDIN] Sending message to LinkedIn profile: {linkedin_profile}")
            logger.info(f"📝 [LINKEDIN] Message content: {message[:100]}...")
            
            payload = {
                "profile_urls": [linkedin_profile],
                "message": message
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        response_data = await response.json()
                        logger.info(f"✅ [LINKEDIN] Message sent successfully: {response_data}")
                        return {
                            "success": True,
                            "data": response_data,
                            "profile_url": linkedin_profile
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ [LINKEDIN] Failed to send message: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}",
                            "profile_url": linkedin_profile
                        }
                        
        except Exception as e:
            logger.error(f"❌ [LINKEDIN] Exception while sending message: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "profile_url": linkedin_profile
            }
    
    async def send_messages_to_contacts(self, linkedin_profiles: List[str], message: str) -> Dict[str, Any]:
        """
        Send LinkedIn messages to multiple contacts
        
        Args:
            linkedin_profiles: List of LinkedIn profile URLs
            message: Message content to send
            
        Returns:
            Dict with success status and response data
        """
        try:
            logger.info(f"🔗 [LINKEDIN] Sending messages to {len(linkedin_profiles)} LinkedIn profiles")
            logger.info(f"📝 [LINKEDIN] Message content: {message[:100]}...")
            
            payload = {
                "profile_urls": linkedin_profiles,
                "message": message
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        response_data = await response.json()
                        logger.info(f"✅ [LINKEDIN] Messages sent successfully: {response_data}")
                        return {
                            "success": True,
                            "data": response_data,
                            "profile_urls": linkedin_profiles
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ [LINKEDIN] Failed to send messages: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}: {error_text}",
                            "profile_urls": linkedin_profiles
                        }
                        
        except Exception as e:
            logger.error(f"❌ [LINKEDIN] Exception while sending messages: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "profile_urls": linkedin_profiles
            }
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test LinkedIn API connection
        
        Returns:
            Dict with test result
        """
        try:
            logger.info("🔗 [LINKEDIN] Testing API connection...")
            
            # Test with a dummy profile URL
            test_payload = {
                "profile_urls": ["https://www.linkedin.com/in/test"],
                "message": "Test message"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=test_payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status in [200, 400, 404]:  # Accept various responses as connection success
                        logger.info(f"✅ [LINKEDIN] API connection test successful: {response.status}")
                        return {
                            "success": True,
                            "status_code": response.status,
                            "message": "LinkedIn API is reachable"
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ [LINKEDIN] API connection test failed: {response.status} - {error_text}")
                        return {
                            "success": False,
                            "status_code": response.status,
                            "error": error_text
                        }
                        
        except Exception as e:
            logger.error(f"❌ [LINKEDIN] API connection test exception: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Global LinkedIn service instance
linkedin_service = LinkedInService()
