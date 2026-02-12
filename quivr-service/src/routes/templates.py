"""Brain template endpoints."""
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ..models.schemas import BrainResponse
from ..services.brain_manager import brain_manager
from ..services.brain_templates import brain_template_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/templates", tags=["templates"])


class TemplateResponse(BaseModel):
    """Response model for brain template."""

    id: str
    name: str
    description: str
    llm_provider: str
    model: str
    suggested_temperature: float
    use_cases: list[str]


class BrainFromTemplate(BaseModel):
    """Request model for creating a brain from a template."""

    template_id: str
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


@router.get(
    "",
    response_model=dict[str, TemplateResponse],
    summary="List all brain templates",
)
async def list_templates():
    """List all available brain templates."""
    templates = brain_template_manager.list_templates()
    return {
        template_id: TemplateResponse(id=template_id, **template_data)
        for template_id, template_data in templates.items()
    }


@router.get(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Get template details",
)
async def get_template(template_id: str):
    """Get details for a specific template."""
    template = brain_template_manager.get_template(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found",
        )

    return TemplateResponse(id=template_id, **template)


@router.post(
    "/{template_id}/create",
    response_model=BrainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create brain from template",
)
async def create_brain_from_template(template_id: str, brain_data: BrainFromTemplate):
    """Create a new brain using a predefined template."""
    if not brain_template_manager.validate_template_id(template_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found",
        )

    try:
        # Get template configuration
        template_config = brain_template_manager.get_template_config(template_id)

        # Create brain using template settings
        from ..models.schemas import BrainCreate

        brain_create_data = BrainCreate(
            name=brain_data.name,
            description=brain_data.description or template_config["description"],
            llm_provider=template_config["llm_provider"],
            model=template_config["model"],
        )

        brain = await brain_manager.create_brain(brain_create_data)
        logger.info(f"Created brain from template '{template_id}': {brain.id}")
        return brain

    except Exception as e:
        logger.error(f"Failed to create brain from template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create brain: {str(e)}",
        )
