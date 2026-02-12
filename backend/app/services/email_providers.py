

from app.services.email_service import send_email_from_admin

#add other integrations later
async def send_email_via_provider(provider: str, config: dict, to: str, subject: str, html_body: str):
   await send_email_from_admin(
        smtp_host=config["smtp_host"],
        smtp_port=config["smtp_port"],
        username=config["email"],
        password=config["app_password"],
        from_email=config.get("from_email", config["email"]),
        to=to,
        subject=subject or "",
        html_body=html_body,
    )