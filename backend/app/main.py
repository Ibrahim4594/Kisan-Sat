"""KisanSat FastAPI application entry point."""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("kisansat")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    logger.info("KisanSat multi-agent system starting up")
    logger.info("CORS allowed origins: %s", settings.cors_origin_list)
    logger.info("Debug mode: %s", settings.debug)
    yield
    logger.info("KisanSat shutting down")


app = FastAPI(
    title="KisanSat",
    description="Multi-agent crop advisory system for Pakistani farmers",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routes after app creation to avoid circular imports
from app.api.routes import router  # noqa: E402

app.include_router(router)
