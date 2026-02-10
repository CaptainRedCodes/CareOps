from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.services.oauth_service import (
    exchange_code_for_tokens,
    get_google_auth_url,
    get_google_user_info,
    oauth_upsert_user,
)

settings = get_settings()

router = APIRouter(prefix="/auth/oauth", tags=["OAuth"])


@router.get("/google")
async def google_login():
    """Redirect user to Google consent screen."""
    return RedirectResponse(url=get_google_auth_url())


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Google OAuth callback.
    Exchanges code for tokens, upserts user, then redirects to frontend with JWT.
    """
    google_tokens = await exchange_code_for_tokens(code)
    google_user = await get_google_user_info(google_tokens["access_token"])
    tokens = await oauth_upsert_user(db, google_user)

    # Redirect to frontend with tokens as query params
    params = urlencode({
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
    })
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/oauth/callback?{params}")
