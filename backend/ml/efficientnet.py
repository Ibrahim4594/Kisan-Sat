"""EfficientNet-B3 crop disease detection for KisanSat.

Transfer-learned on PlantVillage dataset for identifying crop diseases
from leaf images. Returns disease name, confidence, and treatment suggestions.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import ClassVar

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from pydantic import BaseModel, Field

from ml.base import BaseMLModel, ModelConfig, ModelPrediction

logger = logging.getLogger(__name__)

# PlantVillage 38 classes: crop___disease format
PLANTVILLAGE_CLASSES: list[str] = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry___Powdery_mildew",
    "Cherry___healthy",
    "Corn___Cercospora_leaf_spot",
    "Corn___Common_rust",
    "Corn___Northern_Leaf_Blight",
    "Corn___healthy",
    "Grape___Black_rot",
    "Grape___Esca",
    "Grape___Leaf_blight",
    "Grape___healthy",
    "Orange___Haunglongbing",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper___Bacterial_spot",
    "Pepper___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Rice___Brown_spot",
    "Rice___Leaf_blast",
    "Rice___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Sugarcane___Red_rot",
    "Sugarcane___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___healthy",
]

# Treatment suggestions for Pakistan-relevant diseases
TREATMENT_MAP: dict[str, str] = {
    "Apple_scab": "Apply fungicide (mancozeb or captan). Remove fallen infected leaves. Prune for air circulation.",
    "Black_rot": "Remove infected fruit and cankers. Apply copper-based fungicide. Improve drainage.",
    "Cedar_apple_rust": "Apply fungicide in spring. Remove nearby juniper hosts if possible.",
    "Powdery_mildew": "Apply sulfur-based or potassium bicarbonate fungicide. Improve air circulation. Avoid overhead watering.",
    "Cercospora_leaf_spot": "Apply strobilurin fungicide. Rotate crops. Remove crop debris after harvest.",
    "Common_rust": "Apply foliar fungicide (azoxystrobin). Plant resistant varieties. Monitor humidity levels.",
    "Northern_Leaf_Blight": "Apply fungicide at first sign. Use resistant hybrids. Practice crop rotation.",
    "Esca": "No cure available. Prune infected wood. Avoid pruning in wet weather.",
    "Leaf_blight": "Apply copper-based fungicide. Remove infected leaves. Ensure proper spacing.",
    "Haunglongbing": "No cure. Remove infected trees. Control psyllid vector with insecticide.",
    "Bacterial_spot": "Apply copper-based bactericide. Use disease-free seed. Avoid overhead irrigation.",
    "Early_blight": "Apply chlorothalonil or mancozeb fungicide. Mulch around base. Rotate crops annually.",
    "Late_blight": "Apply metalaxyl fungicide immediately. Remove infected plants. Avoid excess moisture.",
    "Brown_spot": "Apply tricyclazole fungicide. Ensure balanced fertilization. Use resistant varieties.",
    "Leaf_blast": "Apply isoprothiolane or tricyclazole. Manage nitrogen fertilizer. Use resistant varieties.",
    "Red_rot": "Remove infected canes. Use disease-free setts. Apply carbendazim to sett treatment.",
    "Leaf_Mold": "Improve ventilation in greenhouse. Apply chlorothalonil. Reduce humidity.",
    "Leaf_scorch": "Remove infected leaves. Ensure adequate watering. Apply potassium-rich fertilizer.",
    "healthy": "No treatment needed. Continue regular monitoring and good agricultural practices.",
}

# ImageNet normalization stats
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class DiseaseInput(BaseModel):
    """Input for crop disease detection."""

    image_path: str | None = Field(
        default=None, description="Path to crop leaf image file"
    )
    image_array: list[list[list[float]]] | None = Field(
        default=None,
        description="Image as nested list [height, width, channels] with values 0-255",
    )


class DiseasePrediction(ModelPrediction):
    """Output from crop disease detection."""

    disease_name: str = Field(
        default="unknown", description="Detected disease name"
    )
    crop_type: str = Field(
        default="unknown", description="Detected crop species"
    )
    is_healthy: bool = Field(
        default=False, description="Whether the plant appears healthy"
    )
    top_predictions: list[dict[str, float]] = Field(
        default_factory=list,
        description="Top-5 predictions with confidence scores",
    )
    treatment_suggestion: str = Field(
        default="Consult local agricultural extension services.",
        description="Recommended treatment action",
    )


class EfficientNetConfig(ModelConfig):
    """Configuration for EfficientNet-B3 disease model."""

    model_path: str = "efficientnet-b3-plantvillage"
    image_size: int = Field(default=300, description="Input image size for EfficientNet-B3")
    num_classes: int = Field(default=38, description="Number of PlantVillage classes")
    class_names: list[str] = Field(
        default_factory=lambda: PLANTVILLAGE_CLASSES.copy()
    )
    pretrained_backbone: bool = Field(
        default=True, description="Use ImageNet pretrained backbone"
    )


class CropDiseaseModel(BaseMLModel[DiseaseInput, DiseasePrediction]):
    """EfficientNet-B3 for crop disease detection from leaf images.

    Transfer-learned on PlantVillage dataset (38 classes, 14 crop species).
    Falls back to a generic "unable to classify" response if model is unavailable.
    """

    _instance: ClassVar[CropDiseaseModel | None] = None

    def __init__(self, config: EfficientNetConfig | None = None) -> None:
        super().__init__(config or EfficientNetConfig())
        self._config: EfficientNetConfig = config or EfficientNetConfig()

    @classmethod
    def get_instance(cls, config: EfficientNetConfig | None = None) -> CropDiseaseModel:
        """Singleton access to avoid reloading the model."""
        if cls._instance is None:
            cls._instance = cls(config)
        return cls._instance

    def load_model(self) -> None:
        """Load EfficientNet-B3 with custom classification head."""
        try:
            from torchvision.models import efficientnet_b3, EfficientNet_B3_Weights

            if self._config.pretrained_backbone:
                model = efficientnet_b3(weights=EfficientNet_B3_Weights.IMAGENET1K_V1)
            else:
                model = efficientnet_b3(weights=None)

            # Replace classifier head for PlantVillage classes
            in_features = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.3, inplace=True),
                nn.Linear(in_features, self._config.num_classes),
            )

            # Load fine-tuned weights if available
            weights_path = Path(self._config.model_path)
            if weights_path.exists() and weights_path.suffix in (".pt", ".pth"):
                state_dict = torch.load(
                    weights_path, map_location=self.device, weights_only=True
                )
                model.load_state_dict(state_dict)
                logger.info("Loaded fine-tuned weights from %s", weights_path)
            else:
                logger.warning(
                    "No fine-tuned weights found at %s. Using ImageNet backbone only.",
                    self._config.model_path,
                )

            model.to(self.device)
            model.eval()
            self._model = model
            logger.info("EfficientNet-B3 loaded on %s", self.device)

        except Exception as exc:
            logger.warning("Failed to load EfficientNet-B3: %s", exc)
            self._model = None
            self._is_loaded = True

    def predict(self, input_data: DiseaseInput) -> DiseasePrediction:
        """Classify crop disease from leaf image."""
        image = self._load_image(input_data)
        if image is None:
            return DiseasePrediction(
                success=False,
                confidence=0.0,
                error="Could not load image from provided input",
                warnings=["No valid image data provided"],
            )

        if self._model is None:
            return DiseasePrediction(
                success=False,
                confidence=0.0,
                error="Model not loaded",
                warnings=["EfficientNet-B3 model unavailable -- cannot classify"],
            )

        tensor = self._preprocess(image)
        with torch.no_grad():
            logits = self._model(tensor)
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze(0)

        return self._build_prediction(probs)

    def _load_image(self, input_data: DiseaseInput) -> Image.Image | None:
        """Load image from path or array."""
        if input_data.image_path is not None:
            path = Path(input_data.image_path)
            if not path.exists():
                logger.warning("Image file not found: %s", path)
                return None
            try:
                return Image.open(path).convert("RGB")
            except Exception as exc:
                logger.warning("Failed to open image %s: %s", path, exc)
                return None

        if input_data.image_array is not None:
            try:
                arr = np.array(input_data.image_array, dtype=np.uint8)
                return Image.fromarray(arr, "RGB")
            except Exception as exc:
                logger.warning("Failed to create image from array: %s", exc)
                return None

        return None

    def _preprocess(self, image: Image.Image) -> torch.Tensor:
        """Resize, normalize, and convert to tensor."""
        size = self._config.image_size
        image = image.resize((size, size), Image.BILINEAR)
        arr = np.array(image, dtype=np.float32) / 255.0

        # Normalize with ImageNet stats
        for c in range(3):
            arr[:, :, c] = (arr[:, :, c] - IMAGENET_MEAN[c]) / IMAGENET_STD[c]

        # HWC -> CHW, add batch dim
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)
        return tensor.to(self.device)

    def _build_prediction(self, probs: torch.Tensor) -> DiseasePrediction:
        """Build structured prediction from probability tensor."""
        top5_values, top5_indices = torch.topk(probs, k=min(5, len(probs)))
        top5 = [
            {self._config.class_names[idx.item()]: round(val.item(), 4)}
            for val, idx in zip(top5_values, top5_indices)
        ]

        top_idx = top5_indices[0].item()
        top_class = self._config.class_names[top_idx]
        top_conf = top5_values[0].item()

        # Parse "Crop___Disease" format
        parts = top_class.split("___")
        crop_type = parts[0] if len(parts) >= 1 else "unknown"
        disease_raw = parts[1] if len(parts) >= 2 else "unknown"
        is_healthy = disease_raw.lower() == "healthy"

        # Look up treatment
        treatment = TREATMENT_MAP.get(
            disease_raw,
            "Consult local agricultural extension services for diagnosis and treatment.",
        )

        return DiseasePrediction(
            success=True,
            confidence=round(top_conf, 4),
            disease_name=disease_raw.replace("_", " "),
            crop_type=crop_type,
            is_healthy=is_healthy,
            top_predictions=top5,
            treatment_suggestion=treatment,
            device_used=str(self.device),
        )

    def _degraded_response(
        self,
        elapsed_ms: float,
        error: str,
        warnings: list[str],
    ) -> DiseasePrediction:
        return DiseasePrediction(
            success=False,
            confidence=0.0,
            inference_time_ms=elapsed_ms,
            device_used=str(self.device),
            error=error,
            warnings=warnings,
            disease_name="unknown",
            crop_type="unknown",
            is_healthy=False,
            treatment_suggestion="Unable to classify. Consult local agricultural extension services.",
        )
