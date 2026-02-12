# app/services/conversation_service.py
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.contact import Contact
from app.schemas.conversation import MessageCreate
from app.services.communication_service import send_communication


async def get_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    workspace_id: UUID
) -> Conversation:
    """Get a conversation by ID"""
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.workspace_id == workspace_id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


async def get_conversation_messages(
    db: AsyncSession,
    conversation_id: UUID,
    workspace_id: UUID
) -> list[Message]:
    """Get all messages in a conversation"""
    # First verify conversation exists and belongs to workspace
    await get_conversation(db, conversation_id, workspace_id)
    
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    
    return result.scalars().all()


async def send_staff_reply(
    db: AsyncSession,
    conversation_id: UUID,
    workspace_id: UUID,
    data: MessageCreate,
    user_id: UUID = None
) -> Message:
    """
    Send a staff reply to a contact
    
    Flow:
    1. Get conversation and contact
    2. Pause automation for this conversation
    3. Send message via communication service
    4. Create message record
    5. Update conversation metadata
    """
    
    # Get conversation with contact
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.workspace_id == workspace_id
        )
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get contact
    result = await db.execute(
        select(Contact).where(Contact.id == conversation.contact_id)
    )
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Determine recipient
    recipient = contact.email if data.channel == "email" else contact.phone
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contact does not have {data.channel} information"
        )
    
    # Pause automation when staff replies
    conversation.automation_paused = True
    conversation.last_message_at = datetime.now()
    conversation.last_message_from = "staff"
    
    # Send via communication service
    try:
        await send_communication(
            db=db,
            workspace_id=workspace_id,
            channel=data.channel,
            recipient=recipient,
            subject=data.subject,
            message=data.body,
            sent_by_staff=True,
            automated=False
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )
    
    # Create message record
    message = Message(
        conversation_id=conversation_id,
        channel=data.channel,
        direction="outbound",
        sender="staff",  # Could store actual staff email/user_id
        recipient=recipient,
        subject=data.subject,
        body=data.body,
        sent_by_staff=True,
        automated=False,
        status="sent"
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    return message


async def list_conversations(
    db: AsyncSession,
    workspace_id: UUID,
    status: str = None
) -> list[dict]:
    """
    List all conversations for workspace inbox
    
    Returns conversations with contact info and last message preview
    """
    query = select(Conversation, Contact).join(
        Contact, Conversation.contact_id == Contact.id
    ).where(
        Conversation.workspace_id == workspace_id
    )
    
    if status:
        query = query.where(Conversation.status == status)
    
    query = query.order_by(Conversation.last_message_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
    conversations_data = []
    for conversation, contact in rows:
        # Get last message
        last_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_message = last_msg_result.scalar_one_or_none()
        
        conversations_data.append({
            "conversation_id": conversation.id,
            "contact_id": contact.id,
            "contact_name": contact.name,
            "contact_email": contact.email,
            "contact_phone": contact.phone,
            "status": conversation.status,
            "last_message_at": conversation.last_message_at,
            "last_message_from": conversation.last_message_from,
            "automation_paused": conversation.automation_paused,
            "last_message_preview": last_message.body[:100] if last_message else None,
            "unread_count": 0  # TODO: Implement read tracking
        })
    
    return conversations_data


async def close_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    workspace_id: UUID
) -> Conversation:
    """Close a conversation"""
    conversation = await get_conversation(db, conversation_id, workspace_id)
    
    conversation.status = "closed"
    
    await db.commit()
    await db.refresh(conversation)
    
    return conversation


async def reopen_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    workspace_id: UUID
) -> Conversation:
    """Reopen a closed conversation"""
    conversation = await get_conversation(db, conversation_id, workspace_id)
    
    conversation.status = "active"
    
    await db.commit()
    await db.refresh(conversation)
    
    return conversation