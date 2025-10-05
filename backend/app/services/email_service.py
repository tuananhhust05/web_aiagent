import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Any, Optional
from app.core.config import settings
import asyncio
from concurrent.futures import ThreadPoolExecutor
import re

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_secure = settings.SMTP_SECURE
        self.smtp_user = settings.SMTP_USER
        self.smtp_pass = settings.SMTP_PASS
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME

    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    def create_message(self, 
                      subject: str, 
                      content: str, 
                      is_html: bool, 
                      recipients: List[Dict],
                      attachments: List[Dict] = None) -> MIMEMultipart:
        """Create email message"""
        msg = MIMEMultipart()
        msg['From'] = f"{self.from_name} <{self.from_email}>"
        msg['Subject'] = subject
        
        # Add recipients
        to_emails = [recipient['email'] for recipient in recipients if self.validate_email(recipient['email'])]
        msg['To'] = ', '.join(to_emails)
        
        # Add content
        if is_html:
            msg.attach(MIMEText(content, 'html'))
        else:
            msg.attach(MIMEText(content, 'plain'))
        
        # Add attachments (placeholder - would need file handling)
        if attachments:
            for attachment in attachments:
                # This would need actual file handling implementation
                logger.info(f"📎 [EMAIL] Attachment: {attachment['filename']} ({attachment['size']} bytes)")
        
        return msg

    def send_email_sync(self, 
                       subject: str, 
                       content: str, 
                       is_html: bool, 
                       recipients: List[Dict],
                       attachments: List[Dict] = None) -> Dict[str, Any]:
        """Send email synchronously"""
        try:
            logger.info(f"📧 [EMAIL] Starting email send - Subject: '{subject}'")
            logger.info(f"📧 [EMAIL] Recipients: {len(recipients)} emails")
            logger.info(f"📧 [EMAIL] Content type: {'HTML' if is_html else 'Plain text'}")
            
            # Create message
            msg = self.create_message(subject, content, is_html, recipients, attachments)
            
            # Connect to SMTP server
            if self.smtp_secure:
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)
                server.starttls()
            
            # Login and send
            server.login(self.smtp_user, self.smtp_pass)
            
            # Get recipient emails
            to_emails = [recipient['email'] for recipient in recipients if self.validate_email(recipient['email'])]
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.from_email, to_emails, text)
            server.quit()
            
            logger.info(f"✅ [EMAIL] Successfully sent to {len(to_emails)} recipients")
            
            return {
                "success": True,
                "sent_count": len(to_emails),
                "failed_count": 0,
                "message": f"Email sent successfully to {len(to_emails)} recipients"
            }
            
        except Exception as e:
            logger.error(f"❌ [EMAIL] Failed to send email: {str(e)}")
            return {
                "success": False,
                "sent_count": 0,
                "failed_count": len(recipients),
                "error": str(e),
                "message": f"Failed to send email: {str(e)}"
            }

    async def send_email_async(self, 
                              subject: str, 
                              content: str, 
                              is_html: bool, 
                              recipients: List[Dict],
                              attachments: List[Dict] = None) -> Dict[str, Any]:
        """Send email asynchronously"""
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            result = await loop.run_in_executor(
                executor,
                self.send_email_sync,
                subject,
                content,
                is_html,
                recipients,
                attachments
            )
        return result

# Create global instance
email_service = EmailService()