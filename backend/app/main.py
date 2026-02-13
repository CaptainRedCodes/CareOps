"""
CareOps API - Main Application

Unified Operations Platform for service-based businesses.

Architecture:
- API Layer (routers) - HTTP handling
- Domain Layer (services) - Business logic
- Event Layer - Automation handlers
- Infrastructure (models, database)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.utils.logging import setup_logging, get_logger
from app.routers import (
    auth,
    oauth,
    workspace,
    bookings,
    contact_form,
    contacts,
    conversation,
    inventory,
    workspace_forms,
    staff,
    dashboard,
    calendar,
    leads,
    form_webhooks,
    gmail,
    gmail_webhook,
    automation,
)

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    setup_logging("INFO")
    logger.info("Starting CareOps API...")

    # Register event handlers
    from app.services.event_handlers import register_all_handlers

    register_all_handlers()
    logger.info("Event-driven architecture initialized")

    yield

    # Shutdown
    logger.info("Shutting down CareOps API...")


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="CareOps API",
    description="Unified Operations Platform — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1")
app.include_router(workspace.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(bookings.public_router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(contact_form.router, prefix="/api/v1")
app.include_router(contact_form.public_router, prefix="/api/v1")
app.include_router(contacts.router, prefix="/api/v1")
app.include_router(conversation.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(workspace_forms.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")
app.include_router(calendar.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(form_webhooks.router, prefix="/api/v1")
app.include_router(gmail.router, prefix="/api/v1")
app.include_router(gmail_webhook.router, prefix="/api/v1")
app.include_router(automation.router, prefix="/api/v1")


@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe."""
    return {"status": "healthy", "service": "careops-api", "version": "1.0.0"}


@app.get("/ready", tags=["System"])
async def readiness_check():
    """Readiness probe - check database connection"""
    try:
        from app.database import engine

        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(e),
            },
        )
