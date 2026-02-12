"""Streaming endpoints for real-time responses.

TODO: Future enhancements
- Implement native LLM streaming (instead of simulated streaming)
- Add WebSocket support for bidirectional communication
- Implement resume/pause streaming functionality
- Add streaming with conversation context retrieval
- Implement token usage tracking during streaming
- Add progress indicators for long-running queries
- Implement streaming cancellation
- Add streaming quality metrics (latency, throughput)
"""
import asyncio
import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from ..models.schemas import ConversationQueryRequest, QueryRequest
from ..services.brain_manager import brain_manager
from ..services.conversation_manager import conversation_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stream", tags=["streaming"])


async def generate_stream_response(brain_id: UUID, question: str, **kwargs):
    """Generate streaming response chunks.

    In a real implementation with streaming LLM support, this would yield
    token-by-token. For now, we simulate streaming behavior.
    """
    try:
        # Get the full response
        answer, sources = await brain_manager.query_brain(brain_id, question, **kwargs)

        # Simulate streaming by chunking the response
        # In production, this would use the LLM's native streaming capability
        words = answer.split()
        chunk_size = max(1, len(words) // 20)  # ~20 chunks

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            if i > 0:
                chunk = " " + chunk  # Add space before continuation chunks

            yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
            await asyncio.sleep(0.05)  # Simulate network delay

        # Send sources at the end
        if sources:
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        # Send completion signal
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.post(
    "/brains/{brain_id}/query",
    summary="Stream query response",
    responses={
        200: {
            "description": "Server-Sent Events stream",
            "content": {"text/event-stream": {}},
        }
    },
)
async def stream_query(brain_id: UUID, query: QueryRequest):
    """Stream a brain query response using Server-Sent Events.

    The response is streamed in chunks with the following event types:
    - content: Text chunks of the answer
    - sources: Source documents used
    - done: Stream completion signal
    - error: Error occurred

    Example event:
    data: {"type": "content", "content": "This is a chunk"}
    """
    # Validate brain exists
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )

    if brain.document_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brain has no documents. Upload documents first.",
        )

    return StreamingResponse(
        generate_stream_response(
            brain_id,
            query.question,
            max_tokens=query.max_tokens,
            temperature=query.temperature,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


async def generate_conversation_stream(
    conversation_id: UUID, brain_id: UUID, question: str, **kwargs
):
    """Generate streaming response with conversation context."""
    try:
        # Add user message first
        await conversation_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=question,
            metadata={"max_tokens": kwargs.get("max_tokens"), "temperature": kwargs.get("temperature")},
        )

        # Get the full response (in future, use streaming from LLM)
        answer, sources = await brain_manager.query_brain(brain_id, question, **kwargs)

        # Stream the response
        words = answer.split()
        chunk_size = max(1, len(words) // 20)
        full_answer = ""

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            if i > 0:
                chunk = " " + chunk

            full_answer += chunk
            yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
            await asyncio.sleep(0.05)

        # Add assistant message to conversation
        await conversation_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=full_answer,
            metadata={"sources": sources},
        )

        # Send sources and completion
        if sources:
            yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        logger.error(f"Conversation streaming error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.post(
    "/conversations/{conversation_id}/query",
    summary="Stream query with conversation context",
    responses={
        200: {
            "description": "Server-Sent Events stream",
            "content": {"text/event-stream": {}},
        }
    },
)
async def stream_conversation_query(
    conversation_id: UUID, query: ConversationQueryRequest
):
    """Stream a query response with conversation context using Server-Sent Events."""
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

    return StreamingResponse(
        generate_conversation_stream(
            conversation_id,
            conversation.brain_id,
            query.question,
            max_tokens=query.max_tokens,
            temperature=query.temperature,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
