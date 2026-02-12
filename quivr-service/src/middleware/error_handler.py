"""Global error handling middleware."""
import logging
from uuid import uuid4

from fastapi import Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def error_handler_middleware(request: Request, call_next):
    """Catch and format all unhandled exceptions."""
    request_id = str(uuid4())

    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logger.error(
            f"Unhandled exception [request_id={request_id}]: {exc}",
            exc_info=True
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "detail": str(exc) if logger.level == logging.DEBUG else None,
                "request_id": request_id,
            },
        )
