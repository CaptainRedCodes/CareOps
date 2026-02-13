"""
Logging Configuration

Centralized logging setup for observability.
"""

import logging
import sys
from typing import Any


def setup_logging(level: str = "INFO") -> None:
    """
    Configure structured logging for the application.

    Format: JSON for production, human-readable for development
    """
    log_level = getattr(logging, level.upper(), logging.INFO)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler with structured format
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # Format
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)

    # Set third-party loggers to WARNING
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)

    root_logger.info(f"Logging configured at {level} level")


class LoggerMixin:
    """Mixin to add logger to any class"""

    @property
    def logger(self) -> logging.Logger:
        name = f"{self.__class__.__module__}.{self.__class__.__name__}"
        return logging.getLogger(name)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)
