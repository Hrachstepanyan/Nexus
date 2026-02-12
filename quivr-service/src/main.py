"""FastAPI application entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import settings
from .middleware.error_handler import error_handler_middleware
from .routes import brains, conversations, health, streaming, templates

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Quivr Brain Service",
    description="Production-grade RAG service powered by Quivr",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.is_development else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handling middleware
app.middleware("http")(error_handler_middleware)

# Register routers
app.include_router(health.router)
app.include_router(brains.router)
app.include_router(conversations.router)
app.include_router(streaming.router)
app.include_router(templates.router)


@app.on_event("startup")
async def startup_event():
    """Application startup tasks."""
    logger.info(f"Starting Quivr Brain Service (env={settings.env})")
    logger.info(f"Storage path: {settings.brains_storage_path}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks."""
    logger.info("Shutting down Quivr Brain Service")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
    )
