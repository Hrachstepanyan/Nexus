"""Brain management service using Quivr.

TODO: Future enhancements (see ROADMAP.md and IMPLEMENTATION_STATUS.md)
- Migrate from file-based storage to PostgreSQL + pgvector
- Implement multi-LLM provider support (OpenAI, Gemini, Ollama)
- Add smart chunking strategies with configurable parameters
- Implement hybrid search (vector + keyword search)
- Add reranking algorithms for better relevance
- Implement brain sharing and collaboration features
- Add document versioning and history
- Implement automatic document summarization
- Add custom embedding model support
- Implement fine-tuning capabilities
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from quivr_core import Brain

from ..config.settings import settings
from ..models.schemas import BrainCreate, BrainResponse

logger = logging.getLogger(__name__)


class BrainMetadata:
    """Lightweight metadata for a brain instance."""

    def __init__(
        self,
        id: UUID,
        name: str,
        description: str | None,
        llm_provider: str,
        model: str,
        document_count: int = 0,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ):
        self.id = id
        self.name = name
        self.description = description
        self.llm_provider = llm_provider
        self.model = model
        self.document_count = document_count
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "llm_provider": self.llm_provider,
            "model": self.model,
            "document_count": self.document_count,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BrainMetadata":
        """Create from dictionary."""
        return cls(
            id=UUID(data["id"]),
            name=data["name"],
            description=data.get("description"),
            llm_provider=data["llm_provider"],
            model=data["model"],
            document_count=data.get("document_count", 0),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )


class BrainManager:
    """Manages brain instances and their lifecycle."""

    def __init__(self):
        self._brains: dict[UUID, Brain] = {}
        self._metadata: dict[UUID, BrainMetadata] = {}
        self._storage_path = settings.brains_storage_path
        self._load_existing_brains()

    def _load_existing_brains(self) -> None:
        """Load existing brain metadata from disk."""
        metadata_file = self._storage_path / "metadata.json"
        if not metadata_file.exists():
            return

        try:
            with open(metadata_file, "r") as f:
                data = json.load(f)
                for brain_data in data.get("brains", []):
                    metadata = BrainMetadata.from_dict(brain_data)
                    self._metadata[metadata.id] = metadata
            logger.info(f"Loaded {len(self._metadata)} brain(s) from disk")
        except Exception as e:
            logger.error(f"Failed to load brain metadata: {e}")

    def _save_metadata(self) -> None:
        """Persist brain metadata to disk."""
        metadata_file = self._storage_path / "metadata.json"
        try:
            data = {
                "brains": [meta.to_dict() for meta in self._metadata.values()],
                "last_updated": datetime.utcnow().isoformat(),
            }
            with open(metadata_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save brain metadata: {e}")
            raise

    def _get_brain_storage_path(self, brain_id: UUID) -> Path:
        """Get storage path for a specific brain."""
        path = self._storage_path / str(brain_id)
        path.mkdir(parents=True, exist_ok=True)
        return path

    async def create_brain(self, brain_data: BrainCreate) -> BrainResponse:
        """Create a new brain instance."""
        brain_id = uuid4()
        storage_path = self._get_brain_storage_path(brain_id)

        # Create metadata
        metadata = BrainMetadata(
            id=brain_id,
            name=brain_data.name,
            description=brain_data.description,
            llm_provider=brain_data.llm_provider,
            model=brain_data.model,
        )

        # Initialize empty brain (will add documents later)
        brain = Brain.from_files(
            name=brain_data.name,
            file_paths=[],  # Start empty
        )

        self._brains[brain_id] = brain
        self._metadata[brain_id] = metadata
        self._save_metadata()

        logger.info(f"Created brain: {brain_id} ({brain_data.name})")

        return BrainResponse(
            id=metadata.id,
            name=metadata.name,
            description=metadata.description,
            llm_provider=metadata.llm_provider,
            model=metadata.model,
            document_count=metadata.document_count,
            created_at=metadata.created_at,
            updated_at=metadata.updated_at,
        )

    async def get_brain(self, brain_id: UUID) -> BrainResponse | None:
        """Get brain information."""
        metadata = self._metadata.get(brain_id)
        if not metadata:
            return None

        return BrainResponse(
            id=metadata.id,
            name=metadata.name,
            description=metadata.description,
            llm_provider=metadata.llm_provider,
            model=metadata.model,
            document_count=metadata.document_count,
            created_at=metadata.created_at,
            updated_at=metadata.updated_at,
        )

    async def list_brains(self) -> list[BrainResponse]:
        """List all brains."""
        return [
            BrainResponse(
                id=meta.id,
                name=meta.name,
                description=meta.description,
                llm_provider=meta.llm_provider,
                model=meta.model,
                document_count=meta.document_count,
                created_at=meta.created_at,
                updated_at=meta.updated_at,
            )
            for meta in self._metadata.values()
        ]

    async def delete_brain(self, brain_id: UUID) -> bool:
        """Delete a brain."""
        if brain_id not in self._metadata:
            return False

        # Remove from memory
        self._brains.pop(brain_id, None)
        self._metadata.pop(brain_id, None)
        self._save_metadata()

        # Could also delete storage directory here if needed
        logger.info(f"Deleted brain: {brain_id}")
        return True

    async def add_documents(
        self, brain_id: UUID, file_paths: list[Path]
    ) -> tuple[int, list[str]]:
        """Add documents to a brain."""
        if brain_id not in self._metadata:
            raise ValueError(f"Brain {brain_id} not found")

        metadata = self._metadata[brain_id]
        storage_path = self._get_brain_storage_path(brain_id)

        # Copy files to brain storage
        saved_paths = []
        for file_path in file_paths:
            dest = storage_path / file_path.name
            dest.write_bytes(file_path.read_bytes())
            saved_paths.append(str(dest))

        # Recreate brain with new documents
        all_docs = list(storage_path.glob("*"))
        all_doc_paths = [str(p) for p in all_docs if p.is_file()]

        brain = Brain.from_files(
            name=metadata.name,
            file_paths=all_doc_paths,
        )

        self._brains[brain_id] = brain
        metadata.document_count = len(all_doc_paths)
        metadata.updated_at = datetime.utcnow()
        self._save_metadata()

        logger.info(f"Added {len(file_paths)} document(s) to brain {brain_id}")
        return len(file_paths), [p.name for p in file_paths]

    async def query_brain(
        self, brain_id: UUID, question: str, **kwargs
    ) -> tuple[str, list[str]]:
        """Query a brain with a question."""
        if brain_id not in self._brains:
            raise ValueError(f"Brain {brain_id} not found or not loaded")

        brain = self._brains[brain_id]

        # Query the brain
        answer = brain.ask(question)

        # Extract sources if available (Quivr may provide this in future versions)
        sources: list[str] = []

        return str(answer), sources

    async def list_documents(self, brain_id: UUID) -> list[dict[str, Any]]:
        """List all documents in a brain."""
        if brain_id not in self._metadata:
            raise ValueError(f"Brain {brain_id} not found")

        storage_path = self._get_brain_storage_path(brain_id)
        documents = []

        for doc_path in storage_path.glob("*"):
            if doc_path.is_file() and not doc_path.name.startswith("."):
                stat = doc_path.stat()
                documents.append(
                    {
                        "name": doc_path.name,
                        "size": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "modified_at": datetime.fromtimestamp(
                            stat.st_mtime
                        ).isoformat(),
                        "path": str(doc_path.relative_to(self._storage_path)),
                    }
                )

        return documents

    async def delete_document(self, brain_id: UUID, document_name: str) -> bool:
        """Delete a specific document from a brain."""
        if brain_id not in self._metadata:
            raise ValueError(f"Brain {brain_id} not found")

        storage_path = self._get_brain_storage_path(brain_id)
        doc_path = storage_path / document_name

        if not doc_path.exists() or not doc_path.is_file():
            return False

        # Delete the file
        doc_path.unlink()

        # Recreate brain without this document
        metadata = self._metadata[brain_id]
        remaining_docs = list(storage_path.glob("*"))
        remaining_doc_paths = [str(p) for p in remaining_docs if p.is_file()]

        if remaining_doc_paths:
            brain = Brain.from_files(
                name=metadata.name,
                file_paths=remaining_doc_paths,
            )
            self._brains[brain_id] = brain
        else:
            # No documents left, remove brain from active memory
            self._brains.pop(brain_id, None)

        metadata.document_count = len(remaining_doc_paths)
        metadata.updated_at = datetime.utcnow()
        self._save_metadata()

        logger.info(f"Deleted document {document_name} from brain {brain_id}")
        return True

    async def get_document_metadata(
        self, brain_id: UUID, document_name: str
    ) -> dict[str, Any] | None:
        """Get metadata for a specific document."""
        if brain_id not in self._metadata:
            raise ValueError(f"Brain {brain_id} not found")

        storage_path = self._get_brain_storage_path(brain_id)
        doc_path = storage_path / document_name

        if not doc_path.exists() or not doc_path.is_file():
            return None

        stat = doc_path.stat()
        return {
            "name": doc_path.name,
            "size": stat.st_size,
            "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "path": str(doc_path.relative_to(self._storage_path)),
        }


# Singleton instance
brain_manager = BrainManager()
