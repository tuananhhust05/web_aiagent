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

async def send_employee_invite_email(email: str, first_name: str, company_name: str, invite_token: str) -> bool:
    """Send employee invite email"""
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = f"Invitation to join {company_name} on ForSkale"
        
        # Create invite link
        invite_link = f"{settings.FRONTEND_URL}/accept-invite/{invite_token}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">ForSkale</h1>
                    <p style="color: #6b7280; margin: 10px 0;">Multi-Channel Workflow Platform</p>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
                    <h2 style="color: #1e40af; margin-top: 0;">You've been invited!</h2>
                    
                    <p>Hello {first_name},</p>
                    
                    <p>You have been invited to join <strong>{company_name}</strong> on ForSkale.</p>
                    
                    <p>ForSkale is a powerful multi-channel workflow platform that helps teams automate sales and customer success activities.</p>
                    
                    <p>Click the button below to accept the invitation and create your account:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{invite_link}" 
                           style="background: #2563eb; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Accept Invitation
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280;">
                        Or copy and paste this link into your browser:<br>
                        <a href="{invite_link}" style="color: #2563eb;">{invite_link}</a>
                    </p>
                    
                    <p><strong>This invitation will expire in 7 days.</strong></p>
                    
                    <p>If you have any questions, please contact your company administrator.</p>
                    
                    <p>Best regards,<br>The ForSkale Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"❌ [EMAIL_SERVICE] Error sending employee invite email: {e}")
        return False

async def send_colleague_link_email(email: str, first_name: str, company_name: str, requested_by_name: str, link_token: str, message: str = None) -> bool:
    """Send colleague link email"""
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = f"Join {company_name} on ForSkale"
        
        # Create link URL
        link_url = f"{settings.FRONTEND_URL}/accept-colleague-link/{link_token}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">ForSkale</h1>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #2563eb;">
                    <h2 style="color: #1e40af; margin-top: 0;">Colleague Invitation</h2>
                    
                    <p>Hello {first_name},</p>
                    
                    <p><strong>{requested_by_name}</strong> has invited you to join <strong>{company_name}</strong> as a colleague on ForSkale.</p>
                    
                    {f'<p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 3px solid #ffc107;"><em>{message}</em></p>' if message else ''}
                    
                    <p>Click the button below to accept the invitation and link your account:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{link_url}" 
                           style="background: #2563eb; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; display: inline-block;
                                  font-weight: bold;">
                            Accept & Join Company
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280;">
                        Or copy and paste this link:<br>
                        <a href="{link_url}" style="color: #2563eb;">{link_url}</a>
                    </p>
                    
                    <p><strong>This link will expire in 7 days.</strong></p>
                    
                    <p>Best regards,<br>The ForSkale Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"❌ [EMAIL_SERVICE] Error sending colleague link email: {e}")
        return False

async def send_admin_link_email(email: str, first_name: str, company_name: str, message: str = None) -> bool:
    """Send admin link notification email"""
    try:
        msg = MIMEMultipart()
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg['To'] = email
        msg['Subject'] = f"You are now an admin for {company_name}"
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0;">ForSkale</h1>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #10b981;">
                    <h2 style="color: #059669; margin-top: 0;">Admin Access Granted</h2>
                    
                    <p>Hello {first_name},</p>
                    
                    <p>Your account has been linked as a <strong>Company Admin</strong> for <strong>{company_name}</strong> on ForSkale.</p>
                    
                    {f'<p style="background: #d1fae5; padding: 15px; border-radius: 5px; border-left: 3px solid #10b981;"><em>{message}</em></p>' if message else ''}
                    
                    <p>As a Company Admin, you now have access to:</p>
                    <ul>
                        <li>Manage company workflows and templates</li>
                        <li>Invite and manage employees</li>
                        <li>Configure company settings</li>
                        <li>Approve workflow requests</li>
                    </ul>
                    
                    <p>You can log in to your account to start managing your company.</p>
                    
                    <p>Best regards,<br>The ForSkale Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"❌ [EMAIL_SERVICE] Error sending admin link email: {e}")
        return False
