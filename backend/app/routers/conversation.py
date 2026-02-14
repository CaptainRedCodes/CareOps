# app/routers/conversations.py
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.database import get_db
from app.dependencies import require_permission
from app.models.user import User
from app.schemas.conversation import (
    MessageCreate,
    MessageOut,
    ConversationOut,
    ConversationWithContact,
)
from app.services.conversation_service import (
    get_conversation,
    get_conversation_messages,
    send_staff_reply,
    list_conversations,
    close_conversation,
    reopen_conversation,
)


router = APIRouter(
    prefix="/workspaces/{workspace_id}/conversations", tags=["Conversations"]
)


@router.get("/inbox", response_model=List[ConversationWithContact])
async def get_inbox(
    workspace_id: UUID,
    status: Optional[str] = Query(
        None, description="Filter by status: active, closed, waiting"
    ),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """
    Get inbox - all conversations with contact info (requires inbox permission)

    Staff daily workflow starts here
    """
    return await list_conversations(db, workspace_id, status)


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation_detail(
    workspace_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Get a specific conversation (requires inbox permission)"""
    return await get_conversation(db, conversation_id, workspace_id)


@router.get("/{conversation_id}/messages", response_model=List[MessageOut])
async def get_messages(
    workspace_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Get all messages in a conversation (requires inbox permission)"""
    return await get_conversation_messages(db, conversation_id, workspace_id)


@router.post(
    "/{conversation_id}/reply",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def reply_to_conversation(
    workspace_id: UUID,
    conversation_id: UUID,
    data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """
    Send a staff reply to a contact (requires inbox permission)

    This automatically pauses automation for this conversation
    """
    return await send_staff_reply(db, conversation_id, workspace_id, data, user.id)


@router.patch("/{conversation_id}/close", response_model=ConversationOut)
async def close_conv(
    workspace_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Close a conversation (requires inbox permission)"""
    return await close_conversation(db, conversation_id, workspace_id)


@router.patch("/{conversation_id}/reopen", response_model=ConversationOut)
async def reopen_conv(
    workspace_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Reopen a closed conversation (requires inbox permission)"""
    return await reopen_conversation(db, conversation_id, workspace_id)


@router.post("/{conversation_id}/messages/{message_id}/read")
async def mark_message_read(
    workspace_id: UUID,
    conversation_id: UUID,
    message_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Mark a message as read (requires inbox permission)"""
    from app.services.conversation_service import mark_message_as_read

    return await mark_message_as_read(db, message_id, conversation_id, workspace_id)


@router.post("/{conversation_id}/read-all")
async def mark_all_messages_read(
    workspace_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission("inbox")),
):
    """Mark all messages in a conversation as read (requires inbox permission)"""
    from app.services.conversation_service import mark_all_messages_as_read

    return await mark_all_messages_as_read(db, conversation_id, workspace_id)
