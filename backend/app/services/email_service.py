import logging
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def send_email(to: str, subject: str, html_body: str) -> bool:
    """
    Send an HTML email. Returns True on success.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(
            f"\nEMAIL (console mode — SMTP not configured)"
            + f"\n   To:      {to}"
            + f"\n   Subject: {subject}"
            + f"\n   Body:\n{html_body}"
        )
        return True

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart("alternative")
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


async def send_email_from_admin(
    smtp_host: str,
    smtp_port: int,
    username: str,
    password: str,
    from_email: str,
    to: str,
    subject: str,
    html_body: str,
) -> bool:
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        message = MIMEMultipart("alternative")
        message["From"] = from_email
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=username,
            password=password,
            start_tls=True,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


async def send_verification_email(email: str, token: str) -> bool:
    """Send account verification email with a link."""
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FDFCFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFCFA; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 32px 32px 24px; text-align: center;">
                                <div style="display: inline-block; margin-bottom: 8px;">
                                    <span style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 18px; letter-spacing: 1px;">CO</span>
                                </div>
                                <div style="color: #78716C; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">CareOps</div>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <h1 style="color: #1C1917; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                                    Verify your email
                                </h1>
                                <p style="color: #78716C; font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
                                    Welcome to CareOps! Click the button below to verify your email address and activate your account.
                                </p>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{link}" style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                Verify Email
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Expiry Notice -->
                                <p style="color: #78716C; font-size: 13px; margin: 32px 0 0; text-align: center;">
                                    This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours.<br>
                                    If you didn't create an account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 32px; border-top: 1px solid #E7E5E4; text-align: center;">
                                <p style="color: #78716C; font-size: 12px; margin: 0;">
                                    © 2024 CareOps. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(email, "Verify your CareOps account", html)


async def send_password_reset_email(email: str, token: str) -> bool:
    """Send password reset email with a link."""
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FDFCFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFCFA; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 32px 32px 24px; text-align: center;">
                                <div style="display: inline-block; margin-bottom: 8px;">
                                    <span style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 18px; letter-spacing: 1px;">CO</span>
                                </div>
                                <div style="color: #78716C; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">CareOps</div>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <h1 style="color: #1C1917; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                                    Reset your password
                                </h1>
                                <p style="color: #78716C; font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
                                    We received a request to reset your password. Click the button below to set a new one.
                                </p>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{link}" style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Expiry Notice -->
                                <p style="color: #78716C; font-size: 13px; margin: 32px 0 0; text-align: center;">
                                    This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours.<br>
                                    If you didn't request this, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 32px; border-top: 1px solid #E7E5E4; text-align: center;">
                                <p style="color: #78716C; font-size: 12px; margin: 0;">
                                    © 2024 CareOps. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(email, "Reset your CareOps password", html)


async def send_staff_invitation_email(
    email: str, workspace_name: str, temp_password: str
) -> bool:
    """Send staff invitation email with temporary credentials."""
    login_link = f"{settings.FRONTEND_URL}/login"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FDFCFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFCFA; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E7E5E4;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 32px 32px 24px; text-align: center;">
                                <div style="display: inline-block; margin-bottom: 8px;">
                                    <span style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 18px; letter-spacing: 1px;">CO</span>
                                </div>
                                <div style="color: #78716C; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px;">CareOps</div>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 0 32px 32px;">
                                <h1 style="color: #1C1917; font-size: 24px; font-weight: 600; margin: 0 0 16px; text-align: center;">
                                    You've been invited!
                                </h1>
                                <p style="color: #78716C; font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: center;">
                                    You've been added as staff to <strong style="color: #5046E5;">{workspace_name}</strong>.
                                </p>
                                
                                <!-- Credentials Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F4F0; border: 1px solid #E7E5E4; border-radius: 8px; margin: 24px 0;">
                                    <tr>
                                        <td style="padding: 20px;">
                                            <p style="color: #78716C; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your temporary credentials:</p>
                                            <p style="color: #1C1917; font-size: 14px; margin: 6px 0;"><strong>Email:</strong> {email}</p>
                                            <p style="color: #1C1917; font-size: 14px; margin: 6px 0;"><strong>Password:</strong> {temp_password}</p>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{login_link}" style="display: inline-block; background: linear-gradient(135deg, #5046E5 0%, #3F37C9 100%); color: #FFFFFF; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                Sign In Now
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Warning Notice -->
                                <p style="color: #DC2626; font-size: 13px; margin: 32px 0 0; text-align: center; font-weight: 600;">
                                    ⚠️ You will be required to change your password on first login.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 32px; border-top: 1px solid #E7E5E4; text-align: center;">
                                <p style="color: #78716C; font-size: 12px; margin: 0;">
                                    © 2024 CareOps. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return await send_email(
        email, f"You're invited to {workspace_name} on CareOps", html
    )
