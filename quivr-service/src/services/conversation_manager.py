"""Conversation management service."""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from ..config.settings import settings
from ..models.conversation import Conversation, Message

logger = logging.getLogger(__name__)


class ConversationManager:
    """Manages conversation storage and retrieval."""

    def __init__(self):
        self._conversations: dict[UUID, Conversation] = {}
        self._storage_path = settings.brains_storage_path / "conversations"
        self._storage_path.mkdir(parents=True, exist_ok=True)
        self._load_conversations()

    def _load_conversations(self) -> None:
        """Load existing conversations from disk."""
        metadata_file = self._storage_path / "conversations.json"
        if not metadata_file.exists():
            return

        try:
            with open(metadata_file, "r") as f:
                data = json.load(f)
                for conv_data in data.get("conversations", []):
                    conv = Conversation.from_dict(conv_data)
                    self._conversations[conv.id] = conv
            logger.info(f"Loaded {len(self._conversations)} conversation(s)")
        except Exception as e:
            logger.error(f"Failed to load conversations: {e}")

    def _save_conversations(self) -> None:
        """Persist conversations to disk."""
        metadata_file = self._storage_path / "conversations.json"
        try:
            data = {
                "conversations": [
                    conv.to_dict(include_messages=True)
                    for conv in self._conversations.values()
                ],
                "last_updated": datetime.utcnow().isoformat(),
            }
            with open(metadata_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save conversations: {e}")
            raise

    async def create_conversation(
        self, brain_id: UUID, title: str | None = None
    ) -> Conversation:
        """Create a new conversation."""
        conversation = Conversation(brain_id=brain_id, title=title)
        self._conversations[conversation.id] = conversation
        self._save_conversations()

        logger.info(f"Created conversation: {conversation.id}")
        return conversation

    async def get_conversation(self, conversation_id: UUID) -> Conversation | None:
        """Get a conversation by ID."""
        return self._conversations.get(conversation_id)

    async def list_conversations(
        self, brain_id: UUID | None = None
    ) -> list[Conversation]:
        """List all conversations, optionally filtered by brain_id."""
        conversations = list(self._conversations.values())

        if brain_id:
            conversations = [c for c in conversations if c.brain_id == brain_id]

        # Sort by updated_at descending (most recent first)
        conversations.sort(key=lambda c: c.updated_at, reverse=True)
        return conversations

    async def delete_conversation(self, conversation_id: UUID) -> bool:
        """Delete a conversation."""
        if conversation_id not in self._conversations:
            return False

        del self._conversations[conversation_id]
        self._save_conversations()

        logger.info(f"Deleted conversation: {conversation_id}")
        return True

    async def add_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> Message:
        """Add a message to a conversation."""
        conversation = self._conversations.get(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        message = conversation.add_message(role, content, metadata)
        self._save_conversations()

        logger.info(f"Added message to conversation {conversation_id}")
        return message

    async def update_conversation_title(
        self, conversation_id: UUID, title: str
    ) -> bool:
        """Update a conversation's title."""
        conversation = self._conversations.get(conversation_id)
        if not conversation:
            return False

        conversation.title = title
        conversation.updated_at = datetime.utcnow()
        self._save_conversations()

        logger.info(f"Updated conversation title: {conversation_id}")
        return True

    async def clear_conversation(self, conversation_id: UUID) -> bool:
        """Clear all messages from a conversation."""
        conversation = self._conversations.get(conversation_id)
        if not conversation:
            return False

        conversation.messages = []
        conversation.updated_at = datetime.utcnow()
        self._save_conversations()

        logger.info(f"Cleared conversation: {conversation_id}")
        return True


# Singleton instance
conversation_manager = ConversationManager()
