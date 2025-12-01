import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import secrets
import string

def generate_reset_token(length: int = 32) -> str:
    """Generate a secure random token for password reset"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def send_password_reset_email(email: str, reset_token: str, username: str = None) -> bool:
    """Send password reset email to user"""
    try:
        # Print email configuration
        print("📧 [EMAIL_SERVICE] Email configuration before sending:")
        print(f"   SMTP Server: {settings.SMTP_HOST}")
        print(f"   SMTP Port: {settings.SMTP_PORT}")
        print(f"   From: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>")
        print(f"   To: {email}")
        print(f"   Username: {settings.SMTP_USER}")
        print(f"   Password: {'*' * len(settings.SMTP_PASS) if settings.SMTP_PASS else 'NOT SET'}")
        print(f"   Frontend URL: {settings.FRONTEND_URL}")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = "Password Reset Request - AgentVoice"
        
        # Create reset link
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        print(f"   Raw reset token: {reset_token}")
        print(f"   Reset Link: {reset_link}")
        
        # Email body
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">AgentVoice</h1>
                    <p style="color: #6b7280; margin: 10px 0;">AI Voice Agent Platform</p>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
                    <h2 style="color: #1e40af; margin-top: 0;">Password Reset Request</h2>
                    
                    <p>Hello {username or 'there'},</p>
                    
                    <p>We received a request to reset your password for your AgentVoice account. 
                    If you didn't make this request, you can safely ignore this email.</p>
                    
                    <p>To reset your password, click the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background: #2563eb; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280;">
                        Or copy and paste this link into your browser:<br>
                        <a href="{reset_link}" style="color: #2563eb;">{reset_link}</a>
                    </p>
                    
                    <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <p>Best regards,<br>The AgentVoice Team</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        © 2024 AgentVoice. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Create SMTP session
        print(f"📧 [EMAIL_SERVICE] Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        print("📧 [EMAIL_SERVICE] Starting TLS...")
        server.starttls()
        
        # Login
        print(f"📧 [EMAIL_SERVICE] Logging in with username: {settings.SMTP_USER}")
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        print("📧 [EMAIL_SERVICE] Login successful!")
        
        # Send email
        print(f"📧 [EMAIL_SERVICE] Sending email to {email}...")
        text = msg.as_string()
        server.sendmail(settings.SMTP_FROM_EMAIL, email, text)
        server.quit()
        print("📧 [EMAIL_SERVICE] Email sent successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ [EMAIL_SERVICE] Error sending email: {e}")
        print(f"❌ [EMAIL_SERVICE] Error type: {type(e).__name__}")
        import traceback
        print(f"❌ [EMAIL_SERVICE] Traceback:\n{traceback.format_exc()}")
        return False
