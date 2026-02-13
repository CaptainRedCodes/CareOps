# app/services/calendar_service.py
"""
Google Calendar Integration Service

Handles:
- OAuth2 flow for Google Calendar
- Syncing bookings to Google Calendar
- Checking availability against Google Calendar events
- Token refresh
"""

import logging
from datetime import datetime, timedelta, UTC
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import httpx

from app.models.calendar_integration import CalendarIntegration, CalendarEvent
from app.models.workspace import Workspace
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"


class CalendarService:
    """Google Calendar integration service"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/oauth/calendar/callback"

    def get_auth_url(self, workspace_id: UUID) -> str:
        """Generate Google OAuth URL for calendar connection"""
        if not self.client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google Calendar not configured",
            )

        scopes = [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
        ]

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(scopes),
            "access_type": "offline",
            "prompt": "consent",
            "state": str(workspace_id),
        }

        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{GOOGLE_AUTH_URL}?{query}"

    async def exchange_code(self, code: str) -> dict:
        """Exchange OAuth code for tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
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
                    detail="Failed to connect Google Calendar",
                )

            return response.json()

    async def save_integration(
        self, workspace_id: UUID, tokens: dict, calendar_id: str = "primary"
    ) -> CalendarIntegration:
        """Save or update calendar integration"""
        # Check if integration exists
        result = await self.db.execute(
            select(CalendarIntegration).where(
                CalendarIntegration.workspace_id == workspace_id
            )
        )
        existing = result.scalar_one_or_none()

        expires_in = tokens.get("expires_in", 3600)
        expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)

        if existing:
            existing.access_token = tokens["access_token"]
            existing.refresh_token = tokens.get("refresh_token", existing.refresh_token)
            existing.token_expires_at = expires_at
            existing.calendar_id = calendar_id
            existing.is_active = True
            integration = existing
        else:
            integration = CalendarIntegration(
                workspace_id=workspace_id,
                access_token=tokens["access_token"],
                refresh_token=tokens["refresh_token"],
                token_expires_at=expires_at,
                calendar_id=calendar_id,
                is_active=True,
            )
            self.db.add(integration)

        await self.db.commit()
        await self.db.refresh(integration)
        return integration

    async def refresh_token(self, integration: CalendarIntegration) -> bool:
        """Refresh expired access token"""
        if not integration.refresh_token:
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    GOOGLE_TOKEN_URL,
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

    async def get_valid_token(self, integration: CalendarIntegration) -> Optional[str]:
        """Get valid access token, refresh if needed"""
        now = datetime.now(UTC)

        # Refresh if expires in less than 5 minutes
        if integration.token_expires_at < now + timedelta(minutes=5):
            success = await self.refresh_token(integration)
            if not success:
                return None

        return integration.access_token

    async def get_calendar_events(
        self, integration: CalendarIntegration, start_time: datetime, end_time: datetime
    ) -> List[dict]:
        """Get events from Google Calendar for time range"""
        token = await self.get_valid_token(integration)
        if not token:
            logger.error("No valid token for calendar")
            return []

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{GOOGLE_CALENDAR_API}/calendars/{integration.calendar_id}/events",
                    headers={"Authorization": f"Bearer {token}"},
                    params={
                        "timeMin": start_time.isoformat(),
                        "timeMax": end_time.isoformat(),
                        "singleEvents": "true",
                        "orderBy": "startTime",
                    },
                )

                if response.status_code == 200:
                    data = response.json()
                    return data.get("items", [])
                else:
                    logger.error(f"Failed to fetch calendar events: {response.text}")
                    return []
        except Exception as e:
            logger.error(f"Error fetching calendar events: {e}")
            return []

    async def create_calendar_event(
        self,
        integration: CalendarIntegration,
        booking_id: UUID,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: str = "",
        location: str = "",
    ) -> Optional[str]:
        """Create event in Google Calendar"""
        token = await self.get_valid_token(integration)
        if not token:
            return None

        event_data = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start_time.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": end_time.isoformat(), "timeZone": "UTC"},
        }

        if location:
            event_data["location"] = location

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{GOOGLE_CALENDAR_API}/calendars/{integration.calendar_id}/events",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                    json=event_data,
                )

                if response.status_code == 200:
                    data = response.json()
                    event_id = data.get("id")

                    # Save reference to our database
                    calendar_event = CalendarEvent(
                        booking_id=booking_id,
                        workspace_id=integration.workspace_id,
                        external_event_id=event_id,
                        calendar_id=integration.calendar_id,
                    )
                    self.db.add(calendar_event)
                    await self.db.commit()

                    return event_id
                else:
                    logger.error(f"Failed to create calendar event: {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error creating calendar event: {e}")
            return None

    async def check_calendar_conflicts(
        self, workspace_id: UUID, start_time: datetime, end_time: datetime
    ) -> List[dict]:
        """Check if time range conflicts with existing calendar events"""
        result = await self.db.execute(
            select(CalendarIntegration).where(
                CalendarIntegration.workspace_id == workspace_id,
                CalendarIntegration.is_active == True,
                CalendarIntegration.check_conflicts == True,
            )
        )
        integration = result.scalar_one_or_none()

        if not integration:
            return []  # No calendar connected, no conflicts

        events = await self.get_calendar_events(integration, start_time, end_time)

        conflicts = []
        for event in events:
            event_start = event.get("start", {}).get("dateTime")
            event_end = event.get("end", {}).get("dateTime")

            if event_start and event_end:
                conflicts.append(
                    {
                        "summary": event.get("summary", "Busy"),
                        "start": event_start,
                        "end": event_end,
                    }
                )

        return conflicts

    async def disconnect_calendar(self, workspace_id: UUID) -> bool:
        """Disconnect Google Calendar integration"""
        result = await self.db.execute(
            select(CalendarIntegration).where(
                CalendarIntegration.workspace_id == workspace_id
            )
        )
        integration = result.scalar_one_or_none()

        if integration:
            integration.is_active = False
            await self.db.commit()
            return True

        return False
