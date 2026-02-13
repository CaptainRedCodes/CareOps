# app/services/automation_service.py
from uuid import UUID
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.automation import AutomationRule, AutomationLog, AutomationPausedContact
from app.models.workspace import Workspace
from app.schemas.automation import AutomationRuleCreate, AutomationRuleUpdate


async def list_automation_rules(
    db: AsyncSession, workspace_id: UUID
) -> list[AutomationRule]:
    """List all automation rules for a workspace."""
    result = await db.execute(
        select(AutomationRule)
        .where(AutomationRule.workspace_id == workspace_id)
        .order_by(AutomationRule.priority.asc())
    )
    return result.scalars().all()


async def get_automation_rule(
    db: AsyncSession, rule_id: UUID, workspace_id: UUID
) -> Optional[AutomationRule]:
    """Get a single automation rule."""
    result = await db.execute(
        select(AutomationRule).where(
            AutomationRule.id == rule_id, AutomationRule.workspace_id == workspace_id
        )
    )
    return result.scalar_one_or_none()


async def create_automation_rule(
    db: AsyncSession, workspace_id: UUID, data: AutomationRuleCreate
) -> AutomationRule:
    """Create a new automation rule."""
    rule = AutomationRule(
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        event_type=data.event_type,
        priority=data.priority,
        action_type=data.action_type,
        action_config=data.action_config,
        conditions=data.conditions,
        stop_on_reply=data.stop_on_reply,
        is_active=True,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def update_automation_rule(
    db: AsyncSession, rule_id: UUID, workspace_id: UUID, data: AutomationRuleUpdate
) -> Optional[AutomationRule]:
    """Update an automation rule."""
    rule = await get_automation_rule(db, rule_id, workspace_id)
    if not rule:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    await db.commit()
    await db.refresh(rule)
    return rule


async def delete_automation_rule(
    db: AsyncSession, rule_id: UUID, workspace_id: UUID
) -> bool:
    """Delete an automation rule."""
    rule = await get_automation_rule(db, rule_id, workspace_id)
    if not rule:
        return False

    await db.delete(rule)
    await db.commit()
    return True


async def list_automation_logs(
    db: AsyncSession, workspace_id: UUID, limit: int = 50
) -> list[AutomationLog]:
    """List automation logs for a workspace."""
    result = await db.execute(
        select(AutomationLog)
        .where(AutomationLog.workspace_id == workspace_id)
        .order_by(AutomationLog.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def trigger_automation(
    db: AsyncSession, workspace_id: UUID, event_type: str, trigger_data: Dict[str, Any]
) -> list[AutomationLog]:
    """
    Trigger automation for an event.
    Returns list of automation logs.
    """
    from app.services.communication_service import send_communication

    logs = []

    # Get active rules for this event type, ordered by priority
    result = await db.execute(
        select(AutomationRule)
        .where(
            AutomationRule.workspace_id == workspace_id,
            AutomationRule.event_type == event_type,
            AutomationRule.is_active == True,
        )
        .order_by(AutomationRule.priority.asc())
    )
    rules = result.scalars().all()

    # Get contact from trigger data
    contact_id = trigger_data.get("contact_id")
    contact_email = trigger_data.get("contact_email")
    contact_phone = trigger_data.get("contact_phone")

    # Check if automation is paused for this contact
    is_paused = False
    if contact_id:
        paused_result = await db.execute(
            select(AutomationPausedContact).where(
                AutomationPausedContact.workspace_id == workspace_id,
                AutomationPausedContact.contact_id == contact_id,
            )
        )
        is_paused = paused_result.scalar_one_or_none() is not None

    for rule in rules:
        # Skip if automation is paused
        if is_paused:
            log = AutomationLog(
                workspace_id=workspace_id,
                rule_id=rule.id,
                event_type=event_type,
                trigger_data=trigger_data,
                action_type=rule.action_type,
                status="skipped",
                stopped=True,
                message="Automation paused for contact (staff reply)",
            )
            db.add(log)
            logs.append(log)
            break

        # Check conditions if any
        if rule.conditions:
            if not _check_conditions(rule.conditions, trigger_data):
                continue

        # Execute action
        try:
            recipient = contact_email or contact_phone
            subject = rule.action_config.get("subject", "")
            message = rule.action_config.get("message", "")

            # Replace placeholders in message
            message = _replace_placeholders(message, trigger_data)
            subject = _replace_placeholders(subject, trigger_data)

            if rule.action_type == "send_email" and contact_email:
                await send_communication(
                    db=db,
                    workspace_id=workspace_id,
                    channel="email",
                    recipient=contact_email,
                    subject=subject,
                    message=message,
                )
            elif rule.action_type == "send_sms" and contact_phone:
                await send_communication(
                    db=db,
                    workspace_id=workspace_id,
                    channel="sms",
                    recipient=contact_phone,
                    message=message,
                )

            log = AutomationLog(
                workspace_id=workspace_id,
                rule_id=rule.id,
                event_type=event_type,
                trigger_data=trigger_data,
                action_type=rule.action_type,
                status="success",
                recipient=recipient,
                subject=subject,
                message=message,
            )
            db.add(log)
            logs.append(log)

        except Exception as e:
            log = AutomationLog(
                workspace_id=workspace_id,
                rule_id=rule.id,
                event_type=event_type,
                trigger_data=trigger_data,
                action_type=rule.action_type,
                status="failed",
                error_message=str(e),
            )
            db.add(log)
            logs.append(log)

    if logs:
        await db.commit()

    return logs


def _check_conditions(conditions: Dict[str, Any], trigger_data: Dict[str, Any]) -> bool:
    """Check if conditions are met."""
    # Simple condition checking - can be extended
    for key, expected in conditions.items():
        if key not in trigger_data:
            return False
        if trigger_data[key] != expected:
            return False
    return True


def _replace_placeholders(text: str, data: Dict[str, Any]) -> str:
    """Replace placeholders in text with data."""
    replacements = {
        "{{name}}": data.get("contact_name", "Customer"),
        "{{email}}": data.get("contact_email", ""),
        "{{phone}}": data.get("contact_phone", ""),
        "{{service}}": data.get("service_name", ""),
        "{{date}}": data.get("booking_date", ""),
        "{{time}}": data.get("booking_time", ""),
        "{{item}}": data.get("item_name", ""),
        "{{quantity}}": str(data.get("quantity", "")),
    }
    for placeholder, value in replacements.items():
        text = text.replace(placeholder, value)
    return text


async def pause_automation_for_contact(
    db: AsyncSession, workspace_id: UUID, contact_id: UUID
) -> None:
    """Pause automation for a contact (when staff replies)."""
    existing = await db.execute(
        select(AutomationPausedContact).where(
            AutomationPausedContact.workspace_id == workspace_id,
            AutomationPausedContact.contact_id == contact_id,
        )
    )
    if not existing.scalar_one_or_none():
        paused = AutomationPausedContact(
            workspace_id=workspace_id, contact_id=contact_id
        )
        db.add(paused)
        await db.commit()


async def resume_automation_for_contact(
    db: AsyncSession, workspace_id: UUID, contact_id: UUID
) -> None:
    """Resume automation for a contact."""
    result = await db.execute(
        select(AutomationPausedContact).where(
            AutomationPausedContact.workspace_id == workspace_id,
            AutomationPausedContact.contact_id == contact_id,
        )
    )
    paused = result.scalar_one_or_none()
    if paused:
        await db.delete(paused)
        await db.commit()
