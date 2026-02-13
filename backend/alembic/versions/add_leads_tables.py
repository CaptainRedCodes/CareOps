"""Add leads and lead activities tables

Revision ID: add_leads_tables
Revises: add_calendar_integration
Create Date: 2025-01-20

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_leads_tables"
down_revision = "add_calendar_integration"
branch_labels = None
depends_on = None


def upgrade():
    # Create leads table
    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contact_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "source",
            sa.Enum(
                "CONTACT_FORM",
                "BOOKING_FORM",
                "WEBHOOK",
                "MANUAL",
                "REFERRAL",
                "OTHER",
                name="leadsource",
            ),
            nullable=False,
        ),
        sa.Column("source_detail", sa.String(length=255), nullable=True),
        sa.Column("form_data", sa.JSON(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", name="leadstatus"
            ),
            nullable=False,
        ),
        sa.Column("assigned_to_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("estimated_value", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("first_contacted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("converted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_to_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create lead_activities table
    op.create_table(
        "lead_activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("activity_type", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("performed_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "old_status",
            sa.Enum(
                "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", name="leadstatus"
            ),
            nullable=True,
        ),
        sa.Column(
            "new_status",
            sa.Enum(
                "NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST", name="leadstatus"
            ),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["performed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(
            ["workspace_id"], ["workspaces.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes
    op.create_index("ix_leads_workspace_id", "leads", ["workspace_id"])
    op.create_index("ix_leads_contact_id", "leads", ["contact_id"])
    op.create_index("ix_leads_status", "leads", ["status"])
    op.create_index("ix_leads_source", "leads", ["source"])
    op.create_index("ix_leads_assigned_to", "leads", ["assigned_to_user_id"])
    op.create_index("ix_leads_submitted_at", "leads", ["submitted_at"])
    op.create_index("ix_lead_activities_lead_id", "lead_activities", ["lead_id"])
    op.create_index(
        "ix_lead_activities_workspace_id", "lead_activities", ["workspace_id"]
    )


def downgrade():
    # Drop indexes
    op.drop_index("ix_lead_activities_workspace_id", table_name="lead_activities")
    op.drop_index("ix_lead_activities_lead_id", table_name="lead_activities")
    op.drop_index("ix_leads_submitted_at", table_name="leads")
    op.drop_index("ix_leads_assigned_to", table_name="leads")
    op.drop_index("ix_leads_source", table_name="leads")
    op.drop_index("ix_leads_status", table_name="leads")
    op.drop_index("ix_leads_contact_id", table_name="leads")
    op.drop_index("ix_leads_workspace_id", table_name="leads")

    # Drop tables
    op.drop_table("lead_activities")
    op.drop_table("leads")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS leadstatus")
    op.execute("DROP TYPE IF EXISTS leadsource")
