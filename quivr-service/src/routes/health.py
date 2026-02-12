"""Health check endpoints."""
from datetime import datetime

from fastapi import APIRouter

from ..models.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check():
    """Check if the service is running."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow(),
    )


@router.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirect."""
    return {
        "service": "Quivr Brain Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
