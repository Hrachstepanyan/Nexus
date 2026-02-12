"""Pydantic models for request/response validation."""
from datetime import datetime
from typing import Any, Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class BrainCreate(BaseModel):
    """Request model for creating a brain."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    llm_provider: Literal["anthropic", "openai", "mistral"] = "anthropic"
    model: str = "claude-3-5-sonnet-20241022"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Ensure name contains valid characters."""
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()


class BrainResponse(BaseModel):
    """Response model for brain information."""

    id: UUID
    name: str
    description: str | None
    llm_provider: str
    model: str
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class BrainList(BaseModel):
    """Response model for listing brains."""

    brains: list[BrainResponse]
    total: int


class DocumentUpload(BaseModel):
    """Metadata for uploaded documents."""

    filename: str
    content_type: str | None = None


class QueryRequest(BaseModel):
    """Request model for querying a brain."""

    question: str = Field(..., min_length=1, max_length=2000)
    max_tokens: int = Field(1024, ge=100, le=4096)
    temperature: float = Field(0.7, ge=0.0, le=1.0)

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        """Ensure question is not empty."""
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()


class QueryResponse(BaseModel):
    """Response model for brain queries."""

    answer: str
    sources: list[str] = []
    tokens_used: int | None = None
    processing_time_ms: int


class ErrorResponse(BaseModel):
    """Standardized error response."""

    error: str
    detail: str | None = None
    request_id: UUID = Field(default_factory=uuid4)


class HealthResponse(BaseModel):
    """Health check response."""

    status: Literal["healthy", "degraded", "unhealthy"]
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Conversation Schemas
class ConversationCreate(BaseModel):
    """Request model for creating a conversation."""

    brain_id: UUID
    title: str | None = None


class MessageCreate(BaseModel):
    """Request model for adding a message."""

    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=10000)
    metadata: dict[str, Any] | None = None


class MessageResponse(BaseModel):
    """Response model for a message."""

    id: UUID
    role: str
    content: str
    timestamp: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConversationResponse(BaseModel):
    """Response model for a conversation."""

    id: UUID
    brain_id: UUID
    title: str
    message_count: int
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] | None = None


class ConversationList(BaseModel):
    """Response model for listing conversations."""

    conversations: list[ConversationResponse]
    total: int


class ConversationQueryRequest(BaseModel):
    """Request model for querying with conversation context."""

    question: str = Field(..., min_length=1, max_length=2000)
    max_tokens: int = Field(default=1024, ge=100, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_context_messages: int | None = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of previous messages to include as context",
    )

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        """Ensure question is not empty."""
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v.strip()


class ConversationUpdateTitle(BaseModel):
    """Request model for updating conversation title."""

    title: str = Field(..., min_length=1, max_length=200)
