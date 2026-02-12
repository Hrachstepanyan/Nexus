"""Conversation management endpoints."""
import logging
import time
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse

from ..models.schemas import (
    ConversationCreate,
    ConversationList,
    ConversationQueryRequest,
    ConversationResponse,
    ConversationUpdateTitle,
    MessageCreate,
    MessageResponse,
    QueryResponse,
)
from ..services.brain_manager import brain_manager
from ..services.conversation_manager import conversation_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
)
async def create_conversation(conv_data: ConversationCreate):
    """Create a new conversation for a brain."""
    # Verify brain exists
    brain = await brain_manager.get_brain(conv_data.brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {conv_data.brain_id} not found",
        )

    try:
        conversation = await conversation_manager.create_conversation(
            brain_id=conv_data.brain_id, title=conv_data.title
        )
        return ConversationResponse(**conversation.to_dict(include_messages=False))
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}",
        )


@router.get(
    "",
    response_model=ConversationList,
    summary="List conversations",
)
async def list_conversations(
    brain_id: UUID | None = Query(None, description="Filter by brain ID")
):
    """List all conversations, optionally filtered by brain."""
    try:
        conversations = await conversation_manager.list_conversations(brain_id=brain_id)
        return ConversationList(
            conversations=[
                ConversationResponse(**c.to_dict(include_messages=False))
                for c in conversations
            ],
            total=len(conversations),
        )
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list conversations: {str(e)}",
        )


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get conversation details",
)
async def get_conversation(conversation_id: UUID, include_messages: bool = Query(True)):
    """Get a specific conversation with optional message history."""
    conversation = await conversation_manager.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    conv_dict = conversation.to_dict(include_messages=include_messages)
    if include_messages and conv_dict.get("messages"):
        conv_dict["messages"] = [
            MessageResponse(**msg) for msg in conv_dict["messages"]
        ]

    return ConversationResponse(**conv_dict)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
)
async def delete_conversation(conversation_id: UUID):
    """Delete a conversation and all its messages."""
    success = await conversation_manager.delete_conversation(conversation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)


@router.patch(
    "/{conversation_id}/title",
    response_model=ConversationResponse,
    summary="Update conversation title",
)
async def update_conversation_title(
    conversation_id: UUID, title_data: ConversationUpdateTitle
):
    """Update the title of a conversation."""
    success = await conversation_manager.update_conversation_title(
        conversation_id, title_data.title
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    conversation = await conversation_manager.get_conversation(conversation_id)
    return ConversationResponse(**conversation.to_dict(include_messages=False))


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a message to conversation",
)
async def add_message(conversation_id: UUID, msg_data: MessageCreate):
    """Add a message to a conversation."""
    try:
        message = await conversation_manager.add_message(
            conversation_id=conversation_id,
            role=msg_data.role,
            content=msg_data.content,
            metadata=msg_data.metadata,
        )
        return MessageResponse(**message.to_dict())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to add message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add message: {str(e)}",
        )


@router.post(
    "/{conversation_id}/query",
    response_model=QueryResponse,
    summary="Query with conversation context",
)
async def query_with_context(conversation_id: UUID, query: ConversationQueryRequest):
    """Query a brain with conversation history as context."""
    # Get conversation
    conversation = await conversation_manager.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    # Verify brain exists
    brain = await brain_manager.get_brain(conversation.brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {conversation.brain_id} not found",
        )

    if brain.document_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brain has no documents. Upload documents first.",
        )

    try:
        start_time = time.time()

        # Add user message to conversation
        await conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=query.question,
            metadata={"max_tokens": query.max_tokens, "temperature": query.temperature},
        )

        # TODO: In future, pass conversation context to brain.ask()
        # For now, just query normally
        answer, sources = await brain_manager.query_brain(
            conversation.brain_id,
            query.question,
            max_tokens=query.max_tokens,
            temperature=query.temperature,
        )

        # Add assistant response to conversation
        await conversation_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=answer,
            metadata={"sources": sources},
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return QueryResponse(
            answer=answer,
            sources=sources,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        logger.error(f"Failed to query with context: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query: {str(e)}",
        )


@router.delete(
    "/{conversation_id}/messages",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all messages",
)
async def clear_conversation(conversation_id: UUID):
    """Clear all messages from a conversation."""
    success = await conversation_manager.clear_conversation(conversation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )
    return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
