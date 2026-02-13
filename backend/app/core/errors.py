"""
Standardized Error Handling System

Provides consistent API error responses across all endpoints.
"""

from typing import Any
from fastapi import HTTPException, status


class ErrorCode:
    WORKSPACE_NOT_ACTIVATED = "WORKSPACE_NOT_ACTIVATED"
    BOOKING_CONFLICT = "BOOKING_CONFLICT"
    INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION"
    UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    VALIDATION_FAILURE = "VALIDATION_FAILURE"
    ACTIVATION_CONSTRAINTS_NOT_MET = "ACTIVATION_CONSTRAINTS_NOT_MET"
    AVAILABILITY_NOT_DEFINED = "AVAILABILITY_NOT_DEFINED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    WORKSPACE_ID_MISMATCH = "WORKSPACE_ID_MISMATCH"
    INVALID_WORKSPACE = "INVALID_WORKSPACE"
    NO_AVAILABLE_SLOTS = "NO_AVAILABLE_SLOTS"
    CONTACT_NOT_FOUND = "CONTACT_NOT_FOUND"
    BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND"
    FORM_NOT_FOUND = "FORM_NOT_FOUND"
    INTEGRATION_NOT_FOUND = "INTEGRATION_NOT_FOUND"
    STAFF_NOT_FOUND = "STAFF_NOT_FOUND"
    LEAD_NOT_FOUND = "LEAD_NOT_FOUND"
    CONVERSATION_NOT_FOUND = "CONVERSATION_NOT_FOUND"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
    WORKSPACE_ALREADY_ACTIVATED = "WORKSPACE_ALREADY_ACTIVATED"
    WORKSPACE_NOT_OWNED = "WORKSPACE_NOT_OWNED"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED"
    INVALID_FORM_SLUG = "INVALID_FORM_SLUG"
    FORM_SUBMISSION_FAILED = "FORM_SUBMISSION_FAILED"
    CALENDAR_CONFLICT = "CALENDAR_CONFLICT"
    INVENTORY_INSUFFICIENT = "INVENTORY_INSUFFICIENT"
    INVALID_JSON = "INVALID_JSON"


class CareOpsException(Exception):
    """Base exception for CareOps application errors."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class NotFoundException(CareOpsException):
    """Resource not found error."""

    def __init__(self, resource: str, resource_id: str | None = None):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with id '{resource_id}' not found"
        super().__init__(
            code=ErrorCode.RESOURCE_NOT_FOUND,
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details={
                "resource": resource,
                "resource_id": str(resource_id) if resource_id else None,
            },
        )


class UnauthorizedException(CareOpsException):
    """Unauthorized access error."""

    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(
            code=ErrorCode.UNAUTHORIZED_ACCESS,
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class ForbiddenException(CareOpsException):
    """Forbidden access error."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(
            code=ErrorCode.PERMISSION_DENIED,
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ValidationException(CareOpsException):
    """Validation error."""

    def __init__(self, message: str, field: str | None = None):
        super().__init__(
            code=ErrorCode.VALIDATION_FAILURE,
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"field": field} if field else {},
        )


class ConflictException(CareOpsException):
    """Conflict error (e.g., booking conflict)."""

    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class WorkspaceException(CareOpsException):
    """Workspace-related errors."""

    @staticmethod
    def not_activated():
        return CareOpsException(
            code=ErrorCode.WORKSPACE_NOT_ACTIVATED,
            message="Workspace is not activated",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    def already_activated():
        return CareOpsException(
            code=ErrorCode.WORKSPACE_ALREADY_ACTIVATED,
            message="Workspace is already activated",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    def not_owned():
        return CareOpsException(
            code=ErrorCode.WORKSPACE_NOT_OWNED,
            message="You do not own this workspace",
            status_code=status.HTTP_403_FORBIDDEN,
        )

    @staticmethod
    def activation_constraints_not_met(checks: list[str]):
        return CareOpsException(
            code=ErrorCode.ACTIVATION_CONSTRAINTS_NOT_MET,
            message="Workspace activation requirements not met",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"failed_checks": checks},
        )


class BookingException(CareOpsException):
    """Booking-related errors."""

    @staticmethod
    def conflict():
        return ConflictException(
            code=ErrorCode.BOOKING_CONFLICT,
            message="Selected time slot is no longer available.",
        )

    @staticmethod
    def invalid_transition(current: str, requested: str):
        return CareOpsException(
            code=ErrorCode.INVALID_STATUS_TRANSITION,
            message=f"Cannot transition from '{current}' to '{requested}'",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"current_status": current, "requested_status": requested},
        )

    @staticmethod
    def not_found(booking_id: str):
        return NotFoundException("Booking", booking_id)


def http_exception_from_careops(error: CareOpsException) -> HTTPException:
    """Convert CareOps exception to FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail=error.to_dict(),
    )


def careops_exception_handler(request, exc: CareOpsException):
    """FastAPI exception handler for CareOps exceptions."""
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )
