import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.models.user import GoogleUserInfo
import logging

logger = logging.getLogger(__name__)

class GoogleAuthService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.token_url = "https://oauth2.googleapis.com/token"
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "grant_type": "authorization_code",
                        "redirect_uri": self.redirect_uri,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    timeout=30.0
                )
                
                if not response.is_success:
                    logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                    raise Exception(f"Failed to exchange code for token: {response.text}")
                
                return response.json()
                
        except httpx.RequestError as e:
            logger.error(f"Request error during token exchange: {str(e)}")
            raise Exception(f"Network error during token exchange: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during token exchange: {str(e)}")
            raise
    
    async def get_user_info(self, access_token: str) -> GoogleUserInfo:
        """
        Get user information from Google using access token
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.user_info_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=30.0
                )
                
                if not response.is_success:
                    logger.error(f"User info request failed: {response.status_code} - {response.text}")
                    raise Exception(f"Failed to get user info: {response.text}")
                
                user_data = response.json()
                return GoogleUserInfo(**user_data)
                
        except httpx.RequestError as e:
            logger.error(f"Request error during user info fetch: {str(e)}")
            raise Exception(f"Network error during user info fetch: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during user info fetch: {str(e)}")
            raise
    
    def get_google_auth_url(self, state: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://accounts.google.com/o/oauth2/auth?{query_string}"

# Create global instance
google_auth_service = GoogleAuthService()

