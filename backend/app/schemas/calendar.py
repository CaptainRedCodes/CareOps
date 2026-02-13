# app/schemas/calendar.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CalendarAuthUrl(BaseModel):
    """Google OAuth URL response"""

    auth_url: str


class CalendarStatus(BaseModel):
    """Calendar connection status"""

    connected: bool
    calendar_id: Optional[str]
    sync_enabled: bool
    check_conflicts: bool


class CalendarConflict(BaseModel):
    """Calendar conflict check response"""

    has_conflict: bool
    conflicts: List[dict]


class CalendarEventCreate(BaseModel):
    """Create calendar event"""

    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
    location: Optional[str] = None


class CalendarEventOut(BaseModel):
    """Calendar event response"""

    id: str
    summary: str
    start: datetime
    end: datetime
    description: Optional[str]
    location: Optional[str]


class CalendarSettingsUpdate(BaseModel):
    """Update calendar settings"""

    sync_enabled: Optional[bool] = None
    check_conflicts: Optional[bool] = None
