"""Brain management endpoints."""
import logging
import time
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from ..models.schemas import (
    BrainCreate,
    BrainList,
    BrainResponse,
    QueryRequest,
    QueryResponse,
)
from ..services.brain_manager import brain_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/brains", tags=["brains"])


@router.post(
    "",
    response_model=BrainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new brain",
)
async def create_brain(brain_data: BrainCreate):
    """Create a new brain instance for document processing."""
    try:
        brain = await brain_manager.create_brain(brain_data)
        return brain
    except Exception as e:
        logger.error(f"Failed to create brain: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create brain: {str(e)}",
        )


@router.get(
    "",
    response_model=BrainList,
    summary="List all brains",
)
async def list_brains():
    """Retrieve all available brains."""
    brains = await brain_manager.list_brains()
    return BrainList(brains=brains, total=len(brains))


@router.get(
    "/{brain_id}",
    response_model=BrainResponse,
    summary="Get brain details",
)
async def get_brain(brain_id: UUID):
    """Retrieve information about a specific brain."""
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )
    return brain


@router.delete(
    "/{brain_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a brain",
)
async def delete_brain(brain_id: UUID):
    """Delete a brain and its associated data."""
    success = await brain_manager.delete_brain(brain_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )
    return JSONResponse(
        status_code=status.HTTP_204_NO_CONTENT,
        content=None,
    )


@router.post(
    "/{brain_id}/documents",
    status_code=status.HTTP_201_CREATED,
    summary="Upload documents to a brain",
)
async def upload_documents(
    brain_id: UUID,
    files: list[UploadFile] = File(...),
):
    """Upload one or more documents to a brain for processing."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided",
        )

    # Validate brain exists
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )

    try:
        # Save uploaded files temporarily
        temp_paths = []
        for file in files:
            temp_path = Path(f"/tmp/{file.filename}")
            content = await file.read()
            temp_path.write_bytes(content)
            temp_paths.append(temp_path)

        # Add documents to brain
        count, filenames = await brain_manager.add_documents(brain_id, temp_paths)

        # Cleanup temp files
        for path in temp_paths:
            path.unlink(missing_ok=True)

        return {
            "message": f"Successfully uploaded {count} document(s)",
            "files": filenames,
            "brain_id": str(brain_id),
        }

    except Exception as e:
        logger.error(f"Failed to upload documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload documents: {str(e)}",
        )


@router.post(
    "/{brain_id}/query",
    response_model=QueryResponse,
    summary="Query a brain",
)
async def query_brain(brain_id: UUID, query: QueryRequest):
    """Ask a question to a brain and get an AI-generated answer."""
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

    try:
        start_time = time.time()

        answer, sources = await brain_manager.query_brain(
            brain_id,
            query.question,
            max_tokens=query.max_tokens,
            temperature=query.temperature,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return QueryResponse(
            answer=answer,
            sources=sources,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        logger.error(f"Failed to query brain: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query brain: {str(e)}",
        )


@router.get(
    "/{brain_id}/documents",
    summary="List documents in a brain",
)
async def list_documents(brain_id: UUID):
    """List all documents in a brain."""
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )

    try:
        documents = await brain_manager.list_documents(brain_id)
        return {"documents": documents, "total": len(documents)}
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )


@router.delete(
    "/{brain_id}/documents/{document_name}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document from a brain",
)
async def delete_document(brain_id: UUID, document_name: str):
    """Delete a specific document from a brain."""
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )

    try:
        success = await brain_manager.delete_document(brain_id, document_name)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_name} not found",
            )
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )


@router.get(
    "/{brain_id}/documents/{document_name}",
    summary="Get document metadata",
)
async def get_document(brain_id: UUID, document_name: str):
    """Get metadata for a specific document."""
    brain = await brain_manager.get_brain(brain_id)
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain {brain_id} not found",
        )

    try:
        doc_metadata = await brain_manager.get_document_metadata(
            brain_id, document_name
        )
        if not doc_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_name} not found",
            )
        return doc_metadata
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document metadata: {str(e)}",
        )
