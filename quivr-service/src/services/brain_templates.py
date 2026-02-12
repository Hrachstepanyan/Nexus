"""Brain template definitions and management."""
from typing import Any

# Predefined brain templates for common use cases
BRAIN_TEMPLATES = {
    "general": {
        "name": "General Purpose",
        "description": "A general-purpose brain for mixed content and queries",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.7,
        "use_cases": ["General Q&A", "Mixed documents", "Versatile knowledge base"],
    },
    "technical": {
        "name": "Technical Documentation",
        "description": "Optimized for technical documentation, code, and API references",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.3,
        "use_cases": ["API documentation", "Code repositories", "Technical manuals"],
    },
    "research": {
        "name": "Research Papers",
        "description": "Designed for academic papers and research documents",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.5,
        "use_cases": ["Academic papers", "Research analysis", "Literature review"],
    },
    "legal": {
        "name": "Legal Documents",
        "description": "Specialized for legal contracts, policies, and regulations",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.2,
        "use_cases": ["Contracts", "Legal policies", "Compliance documents"],
    },
    "customer_support": {
        "name": "Customer Support",
        "description": "Optimized for customer support documentation and FAQs",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.6,
        "use_cases": ["FAQs", "Support tickets", "Product documentation"],
    },
    "creative": {
        "name": "Creative Writing",
        "description": "For creative content, marketing materials, and storytelling",
        "llm_provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022",
        "suggested_temperature": 0.9,
        "use_cases": ["Marketing content", "Creative writing", "Brainstorming"],
    },
}


class BrainTemplateManager:
    """Manages brain templates."""

    @staticmethod
    def list_templates() -> dict[str, dict[str, Any]]:
        """List all available templates."""
        return BRAIN_TEMPLATES

    @staticmethod
    def get_template(template_id: str) -> dict[str, Any] | None:
        """Get a specific template by ID."""
        return BRAIN_TEMPLATES.get(template_id)

    @staticmethod
    def validate_template_id(template_id: str) -> bool:
        """Check if a template ID is valid."""
        return template_id in BRAIN_TEMPLATES

    @staticmethod
    def get_template_config(template_id: str) -> dict[str, Any]:
        """Get the configuration for creating a brain from a template."""
        template = BRAIN_TEMPLATES.get(template_id)
        if not template:
            raise ValueError(f"Template '{template_id}' not found")

        return {
            "llm_provider": template["llm_provider"],
            "model": template["model"],
            "description": template["description"],
        }


# Singleton instance
brain_template_manager = BrainTemplateManager()
