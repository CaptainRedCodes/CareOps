import httpx
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import AuthProvider, User, UserRole
from app.services.auth_service import generate_tokens

settings = get_settings()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url() -> str:
    """Build the Google OAuth2 consent screen URL."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env.",
        )
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"


async def exchange_code_for_tokens(code: str) -> dict:
    """Exchange the authorization code for Google tokens."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code with Google.",
            )
        return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """Fetch the user's profile from Google."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch user info from Google.",
            )
        return response.json()


async def oauth_upsert_user(db: AsyncSession, google_user: dict) -> dict:
    """
    Find or create a user from Google profile data, then return JWT tokens.

    If the email already exists with local auth, link the Google provider.
    If it's a new email, create a new admin account.
    """
    email = google_user["email"].strip().lower()
    google_id = str(google_user["id"])
    full_name = google_user.get("name", email.split("@")[0])

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if user:
        # Link Google to existing account if not already linked
        if user.auth_provider == AuthProvider.LOCAL:
            user.auth_provider = AuthProvider.GOOGLE
            user.provider_id = google_id
        elif user.provider_id != google_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is linked to a different Google account.",
            )
        # Reset any lockout on successful OAuth
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.flush()
    else:
        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            role=UserRole.ADMIN,
            auth_provider=AuthProvider.GOOGLE,
            provider_id=google_id,
            hashed_password=None,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    return generate_tokens(user)
