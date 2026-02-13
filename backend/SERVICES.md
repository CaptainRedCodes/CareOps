# CareOps Backend Services Documentation

This document provides a comprehensive overview of the service layer in the CareOps backend. Each service encapsulates specific business logic, decoupling it from the API routers.

## 1. Core Services

### `auth_service.py`
**Responsibility**: Manages user authentication, registration, and profile management.
- **Key Functions**:
    - `data`: Creates new user accounts (Admin/Staff).
    - `authenticate_user`: Validates email/password credentials.
    - `get_user_by_email`: Retrieves user for login/validation.
    - `update_user_profile`: Updates user details.
    - `change_password`: Handles password updates.

### `workspace_service.py`
**Responsibility**: Manages workspace lifecycle, settings, and business profiles.
- **Key Functions**:
    - `create_workspace`: Initializes a new workspace with default settings.
    - `get_workspace`: Retrieves workspace details.
    - `update_workspace`: Updates business info (name, slug, logo).
    - `list_user_workspaces`: Returns workspaces a user belongs to.

### `staff_service.py`
**Responsibility**: Manages staff attributes, invitations execution, and role assignments.
- **Key Functions**:
    - `list_workspace_staff`: Returns all staff in a workspace.
    - `add_staff_member`: Adds a user to a workspace (usually via invitation).
    - `update_staff_permissions`: Modifies access levels (admin/staff/custom).
    - `remove_staff_member`: Revokes access.

## 2. Operational Services

### `dashboard_service.py`
**Responsibility**: Aggregates data for the main operational dashboard.
- **Optimizations**: Uses `asyncio.gather` for concurrent execution of independent queries to minimize load time.
- **Key Functions**:
    - `get_dashboard_summary`: Returns a holistic view of bookings, conversations, forms, inventory, and alerts.
    - **Internal Helpers**:
        - `_get_booking_metrics`: Counts today's, upcoming, and completed bookings.
        - `_get_conversation_metrics`: Tracks new inquiries and unread messages.
        - `_get_form_metrics`: Monitors pending and overdue forms.
        - `_get_inventory_metrics`: Identifies low stock items.

### `booking_service.py`
**Responsibility**: Handles the entire booking lifecycle from creation to completion.
- **Key Functions**:
    - `create_booking_type`: Defines services offered (price, duration).
    - `get_available_slots`: Calculates free time slots based on staff availability and existing bookings.
    - `create_booking`: Creates a booking, emits `booking.created` event.
    - `update_booking_status`: Transitions booking (scheduled -> completed/cancelled).

### `inventory_service.py`
**Responsibility**: Tracks stock levels and handles reservations.
- **Key Functions**:
    - `create_inventory_item`: Adds new trackable items.
    - `update_stock`: Manual stock adjustments.
    - `reserve_inventory`: deducting stock for a booking (auto-triggered).
    - `check_low_stock`: Emits `INVENTORY_LOW` event if thresholds are breached.

## 3. Communication & Engagement

### `contact_form_service.py`
**Responsibility**: Manages public contact forms and lead generation.
- **Key Functions**:
    - `submit_contact_form`: Processes public form submissions.
    - `create_new_contact_from_submission`: Converts form data into a Contact.
    - `create_conversation_for_submission`: Starts a conversation thread.

### `communication_service.py`
**Responsibility**: Orchestrates messaging (Email/SMS).
- **Key Functions**:
    - `send_email`: Wrapper for email provider.
    - `send_sms`: Wrapper for SMS provider.
    - `log_communication`: Records sent messages in the database.

### `conversation_service.py`
**Responsibility**: Manages internal chat and customer message threads.
- **Key Functions**:
    - `get_workspace_conversations`: Lists active threads.
    - `add_message`: Appends a new message to a thread.
    - `mark_as_read`: Updates read status.

## 4. Workflows & Automation

### `workspace_form_service.py`
**Responsibility**: Manages internal forms (intake, checklists) sent to clients.
- **Key Functions**:
    - `create_form_template`: Defines a reusable form.
    - `assign_form_to_booking`: Associates a form with a booking.
    - `update_submission`: Handles client responses, emits `form.completed`.

### `event_handlers.py`
**Responsibility**: Reactive logic layer. Listens for system events and triggers side effects.
- **Key Events Handled**:
    - `booking.created`: Sends confirmation email, reserves inventory.
    - `form.completed`: Notifies staff, updates booking readiness.
    - `inventory.low`: Creates dashboard alert, emails admin.
    - `contact.created`: Logs activity.

---
**Note**: All services use `SQLAlchemy` async sessions (`db: AsyncSession`) and strictly follow the repository pattern by accessing models directly.
