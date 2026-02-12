from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.routers import auth, oauth, workspace, bookings, contact_form, contacts, conversation

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CareOps API",
    description="Unified Operations Platform — Backend API",
    version="0.2.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1")
app.include_router(workspace.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(bookings.public_router, prefix="/api/v1")
app.include_router(contact_form.router, prefix="/api/v1")
app.include_router(contact_form.public_router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(conversation.router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "healthy", "service": "careops-api", "version": "1.0.0"}
