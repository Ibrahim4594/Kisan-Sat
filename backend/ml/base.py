"""Base ML model infrastructure for KisanSat.

Provides abstract base class with GPU/CPU detection, Pydantic configs,
try/except inference wrappers, and confidence score output patterns.
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Generic, TypeVar

import torch
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

InputT = TypeVar("InputT", bound=BaseModel)
OutputT = TypeVar("OutputT", bound=BaseModel)


class DeviceType(str, Enum):
    CPU = "cpu"
    CUDA = "cuda"
    MPS = "mps"
    AUTO = "auto"


class ModelConfig(BaseModel):
    """Configuration for any ML model."""

    model_path: str = Field(
        ..., description="HuggingFace model ID or local path to model weights"
    )
    device: DeviceType = Field(
        default=DeviceType.AUTO,
        description="Device for inference. AUTO detects GPU availability.",
    )
    batch_size: int = Field(default=1, ge=1, description="Inference batch size")
    max_retries: int = Field(
        default=1, ge=1, description="Max retries on transient failure"
    )
    timeout_seconds: float = Field(
        default=30.0, gt=0, description="Inference timeout in seconds"
    )


class ModelPrediction(BaseModel):
    """Base prediction output returned by all models."""

    success: bool = Field(default=True, description="Whether inference succeeded")
    confidence: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Model confidence score"
    )
    inference_time_ms: float = Field(
        default=0.0, ge=0.0, description="Inference time in milliseconds"
    )
    device_used: str = Field(
        default="cpu", description="Device used for this inference"
    )
    warnings: list[str] = Field(
        default_factory=list, description="Degradation or quality warnings"
    )
    error: str | None = Field(
        default=None, description="Error message if inference failed"
    )


def detect_device(requested: DeviceType) -> torch.device:
    """Detect the best available device for inference."""
    if requested == DeviceType.AUTO:
        if torch.cuda.is_available():
            device = torch.device("cuda")
            logger.info("GPU detected: %s", torch.cuda.get_device_name(0))
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = torch.device("mps")
            logger.info("Apple MPS detected")
        else:
            device = torch.device("cpu")
            logger.info("No GPU detected, using CPU")
    else:
        device = torch.device(requested.value)

    return device


class BaseMLModel(ABC, Generic[InputT, OutputT]):
    """Abstract base for all KisanSat ML models.

    Subclasses must implement:
        - load_model(): Load weights / initialize the model
        - predict(input_data): Run inference, return typed prediction
    """

    _model: Any = None
    _is_loaded: bool = False

    def __init__(self, config: ModelConfig) -> None:
        self.config = config
        self.device = detect_device(config.device)
        logger.info(
            "%s initialized (device=%s, model_path=%s)",
            self.__class__.__name__,
            self.device,
            config.model_path,
        )

    @abstractmethod
    def load_model(self) -> None:
        """Load model weights into memory. Called lazily on first predict."""
        ...

    @abstractmethod
    def predict(self, input_data: InputT) -> OutputT:
        """Run model inference. Must return a Pydantic model with confidence."""
        ...

    def ensure_loaded(self) -> None:
        """Lazily load the model on first use."""
        if not self._is_loaded:
            logger.info("Loading model: %s", self.config.model_path)
            self.load_model()
            self._is_loaded = True
            logger.info("Model loaded: %s", self.config.model_path)

    def safe_predict(self, input_data: InputT) -> OutputT:
        """Inference wrapper with error handling and timing.

        Never raises -- returns a degraded response on failure with
        success=False, an error message, and appropriate warnings.
        """
        start = time.perf_counter()
        try:
            self.ensure_loaded()
            result = self.predict(input_data)
            elapsed_ms = (time.perf_counter() - start) * 1000
            result.inference_time_ms = elapsed_ms
            result.device_used = str(self.device)
            return result
        except torch.cuda.OutOfMemoryError:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.error("GPU OOM during inference for %s", self.__class__.__name__)
            return self._degraded_response(
                elapsed_ms=elapsed_ms,
                error="GPU out of memory. Consider reducing batch size or using CPU.",
                warnings=["GPU OOM -- falling back to degraded response"],
            )
        except FileNotFoundError as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.error("Model weights not found: %s", exc)
            return self._degraded_response(
                elapsed_ms=elapsed_ms,
                error=f"Model weights not found: {exc}",
                warnings=["Model unavailable -- returning degraded response"],
            )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "Inference failed for %s: %s", self.__class__.__name__, exc, exc_info=True
            )
            return self._degraded_response(
                elapsed_ms=elapsed_ms,
                error=str(exc),
                warnings=["Inference failed -- returning degraded response"],
            )

    @abstractmethod
    def _degraded_response(
        self,
        elapsed_ms: float,
        error: str,
        warnings: list[str],
    ) -> OutputT:
        """Return a safe fallback response when inference fails.

        Each model subclass defines what a degraded response looks like
        (e.g., default risk level, average yield, etc.).
        """
        ...

    def unload(self) -> None:
        """Release model from memory."""
        self._model = None
        self._is_loaded = False
        if self.device.type == "cuda":
            torch.cuda.empty_cache()
        logger.info("Model unloaded: %s", self.config.model_path)
