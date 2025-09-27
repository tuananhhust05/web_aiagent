from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    MONGODB_URL: str = "mongodb://admin:password123@localhost:27017/agentvoice?authSource=admin"
    MONGODB_DATABASE: str = "agentvoice"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: str = "*"
    
    # CRM Integration
    HUBSPOT_CLIENT_ID: str = ""
    HUBSPOT_CLIENT_SECRET: str = ""
    SALESFORCE_CLIENT_ID: str = ""
    SALESFORCE_CLIENT_SECRET: str = ""
    PIPEDRIVE_CLIENT_ID: str = ""
    PIPEDRIVE_CLIENT_SECRET: str = ""
    
    # Email settings
    MAIL_USERNAME: str = "tuananhducly@gmail.com"
    MAIL_PASSWORD: str = "rrgo dqab rwtl cpng"
    MAIL_FROM: str = "tuananhducly@gmail.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_SSL_TLS: bool = False
    MAIL_STARTTLS: bool = True
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    
    # Frontend URL for password reset
    FRONTEND_URL: str = "https://4skale.com"
    
    # Twilio Configuration
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = "+16075249116"
    TWILIO_WEBHOOK_URL: str = "https://4skale.com/outbound-twiml"
    TWILIO_STATUS_CALLBACK_URL: str = "https://4skale.com/twilio/status-callback"
    
    # External AI Call API Configuration
    AI_CALL_API_URL: str = "http://13.210.192.27:5059/outbound-call"
    AI_CALL_DEFAULT_PROMPT: str = "You are an AI assistant"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"

settings = Settings() 