"""Conversation and message models."""
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4


class Message:
    """Represents a single message in a conversation."""

    def __init__(
        self,
        role: str,
        content: str,
        timestamp: datetime | None = None,
        message_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self.id = message_id or uuid4()
        self.role = role  # 'user' or 'assistant'
        self.content = content
        self.timestamp = timestamp or datetime.utcnow()
        self.metadata = metadata or {}

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Message":
        """Create from dictionary."""
        return cls(
            message_id=UUID(data["id"]),
            role=data["role"],
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            metadata=data.get("metadata", {}),
        )


class Conversation:
    """Represents a conversation with multiple messages."""

    def __init__(
        self,
        brain_id: UUID,
        conversation_id: UUID | None = None,
        title: str | None = None,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        self.id = conversation_id or uuid4()
        self.brain_id = brain_id
        self.title = title or f"Conversation {self.id.hex[:8]}"
        self.messages: list[Message] = []
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def add_message(self, role: str, content: str, metadata: dict[str, Any] | None = None) -> Message:
        """Add a new message to the conversation."""
        message = Message(role=role, content=content, metadata=metadata)
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        return message

    def get_context(self, max_messages: int | None = None) -> list[dict[str, str]]:
        """Get conversation context for LLM.

        Args:
            max_messages: Maximum number of recent messages to include.
                         None means include all messages.

        Returns:
            List of messages in format suitable for LLM context.
        """
        messages = self.messages
        if max_messages:
            messages = messages[-max_messages:]

        return [{"role": msg.role, "content": msg.content} for msg in messages]

    def to_dict(self, include_messages: bool = True) -> dict[str, Any]:
        """Convert to dictionary."""
        result = {
            "id": str(self.id),
            "brain_id": str(self.brain_id),
            "title": self.title,
            "message_count": len(self.messages),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

        if include_messages:
            result["messages"] = [msg.to_dict() for msg in self.messages]

        return result

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Conversation":
        """Create from dictionary."""
        conv = cls(
            conversation_id=UUID(data["id"]),
            brain_id=UUID(data["brain_id"]),
            title=data["title"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )

        if "messages" in data:
            conv.messages = [Message.from_dict(msg) for msg in data["messages"]]

        return conv
