# app/services/gmail_service.py
"""
Gmail Integration Service

Handles:
- OAuth2 authentication flow
- Receiving emails via Gmail API
- Parsing email content
- Sending emails with proper FROM address
- Token refresh
"""

import logging
import base64
import re
from datetime import datetime, timedelta, UTC
from typing import Optional, List, Dict, Any
from uuid import UUID
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import httpx

from app.models.gmail_integration import GmailIntegration, EmailMessage
from app.models.workspace import Workspace
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.communication import CommunicationIntegration
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Gmail API endpoints
GMAIL_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token"
GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1"
GMAIL_WATCH_URL = "https://www.googleapis.com/gmail/v1/users/me/watch"

# OAuth scopes needed
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
]


class GmailService:
    """Gmail integration service for receiving and sending emails"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/oauth/gmail/callback"

    def get_auth_url(self, workspace_id: UUID) -> str:
        """Generate Google OAuth URL for Gmail connection"""
        if not self.client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gmail integration not configured",
            )

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(GMAIL_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": str(workspace_id),
        }

        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{GMAIL_AUTH_URL}?{query}"

    async def exchange_code(self, code: str) -> dict:
        """Exchange OAuth code for tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GMAIL_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "grant_type": "authorization_code",
                },
            )

            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to connect Gmail",
                )

            return response.json()

    async def get_user_email(self, access_token: str) -> str:
        """Get the user's Gmail address"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("email", "")
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get user email",
                )

    async def save_integration(
        self, workspace_id: UUID, tokens: dict, email_address: str
    ) -> GmailIntegration:
        """Save or update Gmail integration"""
        # Check if integration exists
        result = await self.db.execute(
            select(GmailIntegration).where(
                GmailIntegration.workspace_id == workspace_id
            )
        )
        existing = result.scalar_one_or_none()

        expires_in = tokens.get("expires_in", 3600)
        expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)

        if existing:
            existing.access_token = tokens["access_token"]
            existing.refresh_token = tokens.get("refresh_token", existing.refresh_token)
            existing.token_expires_at = expires_at
            existing.email_address = email_address
            existing.is_active = True
            integration = existing
        else:
            integration = GmailIntegration(
                workspace_id=workspace_id,
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"],
                token_expires_at=expires_at,
                email_address=email_address,
                is_active=True,
            )
            self.db.add(integration)

        await self.db.commit()
        await self.db.refresh(integration)

        # Setup push notifications (watch)
        await self.setup_watch(integration)

        # Create/update CommunicationIntegration for email channel
        await self._sync_communication_integration(workspace_id, email_address)

        return integration

    async def refresh_token(self, integration: GmailIntegration) -> bool:
        """Refresh expired access token"""
        if not integration.refresh_token:
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GMAIL_TOKEN_URL,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": integration.refresh_token,
                        "grant_type": "refresh_token",
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    integration.access_token = data["access_token"]
                    expires_in = data.get("expires_in", 3600)
                    integration.token_expires_at = datetime.now(UTC) + timedelta(
                        seconds=expires_in
                    )
                    await self.db.commit()
                    return True
                else:
                    logger.error(f"Token refresh failed: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return False

    async def get_valid_token(self, integration: GmailIntegration) -> Optional[str]:
        """Get valid access token, refresh if needed"""
        now = datetime.now(UTC)

        # Refresh if expires in less than 5 minutes
        if integration.token_expires_at < now + timedelta(minutes=5):
            success = await self.refresh_token(integration)
            if not success:
                return None

        return integration.access_token

    async def setup_watch(self, integration: GmailIntegration) -> bool:
        """Setup Gmail push notifications (watch)"""
        token = await self.get_valid_token(integration)
        if not token:
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GMAIL_WATCH_URL,
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "labelIds": ["INBOX"],
                        "topicName": f"projects/{settings.GOOGLE_PROJECT_ID}/topics/gmail-notifications"
                        if hasattr(settings, "GOOGLE_PROJECT_ID")
                        else None,
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    integration.history_id = data.get("historyId")
                    # Watch expires in 7 days
                    integration.subscription_expires_at = datetime.now(UTC) + timedelta(
                        days=7
                    )
                    await self.db.commit()
                    logger.info(
                        f"Gmail watch setup successful for {integration.email_address}"
                    )
                    return True
                else:
                    logger.error(f"Failed to setup watch: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Error setting up watch: {e}")
            return False

    async def fetch_new_emails(self, integration: GmailIntegration) -> List[dict]:
        """Fetch new emails since last sync using history API"""
        token = await self.get_valid_token(integration)
        if not token:
            logger.error("No valid token for Gmail")
            return []

        try:
            async with httpx.AsyncClient() as client:
                # If we have a history ID, use history API for incremental sync
                if integration.history_id:
                    response = await client.get(
                        f"{GMAIL_API_BASE}/users/me/history",
                        headers={"Authorization": f"Bearer {token}"},
                        params={
                            "startHistoryId": integration.history_id,
                            "labelId": "INBOX",
                            "historyTypes": "messageAdded",
                        },
                    )

                    if response.status_code == 200:
                        data = response.json()
                        history = data.get("history", [])

                        messages = []
                        for record in history:
                            for msg_added in record.get("messagesAdded", []):
                                msg = msg_added.get("message", {})
                                if msg:
                                    # Fetch full message
                                    full_msg = await self.fetch_message(
                                        client, token, msg["id"]
                                    )
                                    if full_msg:
                                        messages.append(full_msg)

                        # Update history ID
                        integration.history_id = data.get("historyId")
                        await self.db.commit()

                        return messages
                    elif response.status_code == 404:
                        # History ID expired, do full sync
                        logger.warning("History ID expired, performing full sync")
                        return await self.full_sync(integration)
                    else:
                        logger.error(f"Failed to fetch history: {response.text}")
                        return []
                else:
                    # No history ID, do full sync
                    return await self.full_sync(integration)

        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            return []

    async def full_sync(
        self, integration: GmailIntegration, max_results: int = 50
    ) -> List[dict]:
        """Perform full sync of recent emails"""
        token = await self.get_valid_token(integration)
        if not token:
            return []

        try:
            async with httpx.AsyncClient() as client:
                # List recent messages
                response = await client.get(
                    f"{GMAIL_API_BASE}/users/me/messages",
                    headers={"Authorization": f"Bearer {token}"},
                    params={"labelIds": "INBOX", "maxResults": max_results},
                )

                if response.status_code == 200:
                    data = response.json()
                    messages = data.get("messages", [])

                    full_messages = []
                    for msg_ref in messages:
                        msg = await self.fetch_message(client, token, msg_ref["id"])
                        if msg:
                            full_messages.append(msg)

                    return full_messages
                else:
                    logger.error(f"Failed to list messages: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"Error in full sync: {e}")
            return []

    async def fetch_message(
        self, client: httpx.AsyncClient, token: str, message_id: str
    ) -> Optional[dict]:
        """Fetch a specific message by ID"""
        try:
            response = await client.get(
                f"{GMAIL_API_BASE}/users/me/messages/{message_id}",
                headers={"Authorization": f"Bearer {token}"},
                params={"format": "full"},
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to fetch message {message_id}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error fetching message {message_id}: {e}")
            return None

    def parse_email_message(self, msg: dict) -> Dict[str, Any]:
        """Parse Gmail message format into usable data"""
        payload = msg.get("payload", {})
        headers = payload.get("headers", [])

        # Extract headers
        subject = ""
        from_email = ""
        from_name = ""
        to_email = ""
        date = ""

        for header in headers:
            name = header.get("name", "").lower()
            value = header.get("value", "")

            if name == "subject":
                subject = value
            elif name == "from":
                # Parse "Name <email@example.com>"
                match = re.match(r'"?([^"]+)"?\s*<([^>]+)>', value)
                if match:
                    from_name = match.group(1).strip()
                    from_email = match.group(2).strip()
                else:
                    from_email = value.strip()
            elif name == "to":
                to_email = value
            elif name == "date":
                date = value

        # Extract body
        body = self._extract_body(payload)

        return {
            "gmail_message_id": msg["id"],
            "gmail_thread_id": msg["threadId"],
            "subject": subject,
            "from_email": from_email,
            "from_name": from_name,
            "to_email": to_email,
            "date": date,
            "body": body,
            "snippet": msg.get("snippet", ""),
        }

    def _extract_body(self, payload: dict) -> str:
        """Extract text body from message payload"""
        # Handle multipart messages
        if "parts" in payload:
            for part in payload["parts"]:
                mime_type = part.get("mimeType", "")
                if mime_type == "text/plain":
                    data = part.get("body", {}).get("data", "")
                    if data:
                        return base64.urlsafe_b64decode(data).decode("utf-8")
                elif mime_type == "text/html":
                    # Fallback to HTML if no plain text
                    data = part.get("body", {}).get("data", "")
                    if data:
                        html = base64.urlsafe_b64decode(data).decode("utf-8")
                        # Simple HTML to text conversion
                        return re.sub(r"<[^>]+>", "", html)

        # Handle single part messages
        body_data = payload.get("body", {}).get("data", "")
        if body_data:
            return base64.urlsafe_b64decode(body_data).decode("utf-8")

        return ""

    async def send_email(
        self,
        integration: GmailIntegration,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> Optional[str]:
        """Send email using Gmail API"""
        token = await self.get_valid_token(integration)
        if not token:
            return None

        try:
            # Create MIME message
            if html_body:
                msg = MIMEMultipart("alternative")
                msg.attach(MIMEText(body, "plain"))
                msg.attach(MIMEText(html_body, "html"))
            else:
                msg = MIMEText(body)

            msg["to"] = to_email
            msg["from"] = integration.email_address
            msg["subject"] = subject
            msg["reply-to"] = integration.email_address

            # Encode message
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{GMAIL_API_BASE}/users/me/messages/send",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json={"raw": raw_message},
                )

                if response.status_code == 200:
                    data = response.json()
                    return data.get("id")
                else:
                    logger.error(f"Failed to send email: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return None

    async def disconnect_gmail(self, workspace_id: UUID) -> bool:
        """Disconnect Gmail integration"""
        result = await self.db.execute(
            select(GmailIntegration).where(
                GmailIntegration.workspace_id == workspace_id
            )
        )
        integration = result.scalar_one_or_none()

        if integration:
            # Stop watch if active
            if integration.is_active:
                token = await self.get_valid_token(integration)
                if token:
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.post(
                                f"{GMAIL_API_BASE}/users/me/stop",
                                headers={"Authorization": f"Bearer {token}"},
                            )
                    except Exception as e:
                        logger.warning(f"Error stopping watch: {e}")

            integration.is_active = False
            await self.db.commit()

            # Also deactivate CommunicationIntegration for email channel
            await self._deactivate_communication_integration(workspace_id)

            return True

        return False

    async def _deactivate_communication_integration(self, workspace_id: UUID) -> None:
        """Deactivate CommunicationIntegration for email channel when Gmail is disconnected"""
        result = await self.db.execute(
            select(CommunicationIntegration).where(
                CommunicationIntegration.workspace_id == workspace_id,
                CommunicationIntegration.channel == "email",
                CommunicationIntegration.provider == "gmail",
            )
        )
        integration = result.scalar_one_or_none()

        if integration:
            integration.is_active = False
            await self.db.commit()

    async def get_integration(self, workspace_id: UUID) -> Optional[GmailIntegration]:
        """Get Gmail integration for workspace"""
        result = await self.db.execute(
            select(GmailIntegration).where(
                GmailIntegration.workspace_id == workspace_id
            )
        )
        return result.scalar_one_or_none()

    async def _sync_communication_integration(
        self, workspace_id: UUID, email_address: str
    ) -> None:
        """Sync Gmail integration with CommunicationIntegration for email channel"""
        result = await self.db.execute(
            select(CommunicationIntegration).where(
                CommunicationIntegration.workspace_id == workspace_id,
                CommunicationIntegration.channel == "email",
            )
        )
        existing = result.scalar_one_or_none()

        config = {
            "email_address": email_address,
            "connected_via": "gmail",
        }

        if existing:
            existing.provider = "gmail"
            existing.is_active = True
            existing.config = config
        else:
            comm_integration = CommunicationIntegration(
                workspace_id=workspace_id,
                channel="email",
                provider="gmail",
                is_active=True,
                config=config,
            )
            self.db.add(comm_integration)

        await self.db.commit()
