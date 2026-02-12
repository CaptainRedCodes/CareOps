
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
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: #d4a04a; color: #09090b; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">CO</span>
            <span style="margin-left: 8px; color: #8a857d; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">CareOps</span>
        </div>
        <h2 style="color: #ece7df; text-align: center;">Verify your email</h2>
        <p style="color: #8a857d; text-align: center; font-size: 14px;">
            Click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{link}" style="background: #d4a04a; color: #09090b; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Verify Email
            </a>
        </div>
        <p style="color: #8a857d; font-size: 12px; text-align: center;">
            This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours. If you didn't create an account, ignore this email.
        </p>
    </div>
    """
    return await send_email(email, "Verify your CareOps account", html)


async def send_password_reset_email(email: str, token: str) -> bool:
    """Send password reset email with a link."""
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: #d4a04a; color: #09090b; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">CO</span>
            <span style="margin-left: 8px; color: #8a857d; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">CareOps</span>
        </div>
        <h2 style="color: #ece7df; text-align: center;">Reset your password</h2>
        <p style="color: #8a857d; text-align: center; font-size: 14px;">
            We received a request to reset your password. Click below to set a new one.
        </p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{link}" style="background: #d4a04a; color: #09090b; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Reset Password
            </a>
        </div>
        <p style="color: #8a857d; font-size: 12px; text-align: center;">
            This link expires in {settings.EMAIL_TOKEN_EXPIRE_HOURS} hours. If you didn't request this, ignore this email.
        </p>
    </div>
    """
    return await send_email(email, "Reset your CareOps password", html)


async def send_staff_invitation_email(
    email: str, workspace_name: str, temp_password: str
) -> bool:
    """Send staff invitation email with temporary credentials."""
    login_link = f"{settings.FRONTEND_URL}/login"
    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span style="background: #d4a04a; color: #09090b; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 14px;">CO</span>
            <span style="margin-left: 8px; color: #8a857d; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">CareOps</span>
        </div>
        <h2 style="color: #ece7df; text-align: center;">You've been invited!</h2>
        <p style="color: #8a857d; text-align: center; font-size: 14px;">
            You've been added as staff to <strong style="color: #d4a04a;">{workspace_name}</strong>.
        </p>
        <div style="background: #111113; border: 1px solid rgba(236,231,223,0.06); border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="color: #8a857d; font-size: 12px; margin: 0 0 8px;">Your temporary credentials:</p>
            <p style="color: #ece7df; font-size: 14px; margin: 4px 0;"><strong>Email:</strong> {email}</p>
            <p style="color: #ece7df; font-size: 14px; margin: 4px 0;"><strong>Password:</strong> {temp_password}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
            <a href="{login_link}" style="background: #d4a04a; color: #09090b; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Sign In Now
            </a>
        </div>
        <p style="color: #e54d4d; font-size: 12px; text-align: center; font-weight: 600;">
            ⚠️ You will be required to change your password on first login.
        </p>
    </div>
    """
    return await send_email(
        email, f"You're invited to {workspace_name} on CareOps", html
    )
