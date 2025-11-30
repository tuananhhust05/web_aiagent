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
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_SECURE: bool = False
    SMTP_USER: str = "4skale.marketing@gmail.com"
    SMTP_PASS: str = "zgco rdxp kaul pjyf"
    SMTP_FROM_EMAIL: str = "4skale.marketing@gmail.com"
    SMTP_FROM_NAME: str = "4Skale"
    
    # Legacy email settings (for backward compatibility)
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
    AI_CALL_API_URL: str = "http://54.79.147.183:5059/outbound-call"
    AI_CALL_DEFAULT_PROMPT: str = "You are an AI assistant"
    
    # ElevenLabs API Configuration
    ELEVENLABS_API_KEY: str
    ELEVENLABS_AGENT_ID: str
    
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str 
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS string to list"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings() 