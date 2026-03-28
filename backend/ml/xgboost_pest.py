"""XGBoost pest risk scoring for KisanSat.

Predicts pest risk level from weather, season, and region features
using an XGBoost ensemble model. Falls back to rule-based heuristics
when the trained model is unavailable.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import ClassVar, Literal

import numpy as np
from pydantic import BaseModel, Field

from ml.base import BaseMLModel, ModelConfig, ModelPrediction

logger = logging.getLogger(__name__)

# Pakistan-specific pest profiles: pest -> (temp_range, humidity_range, seasons, regions)
PAKISTAN_PESTS: dict[str, dict] = {
    "desert_locust": {
        "temp_range": (25, 40),
        "humidity_range": (30, 70),
        "seasons": ["kharif"],
        "regions": ["sindh", "balochistan", "southern_punjab"],
        "crops": ["wheat", "cotton", "sugarcane", "maize", "rice"],
    },
    "whitefly": {
        "temp_range": (25, 38),
        "humidity_range": (60, 90),
        "seasons": ["kharif"],
        "regions": ["punjab", "sindh"],
        "crops": ["cotton", "tomato", "pepper"],
    },
    "pink_bollworm": {
        "temp_range": (20, 35),
        "humidity_range": (40, 75),
        "seasons": ["kharif"],
        "regions": ["punjab", "sindh"],
        "crops": ["cotton"],
    },
    "armyworm": {
        "temp_range": (20, 32),
        "humidity_range": (60, 85),
        "seasons": ["kharif", "rabi"],
        "regions": ["punjab", "sindh", "kpk"],
        "crops": ["maize", "wheat", "rice", "sugarcane"],
    },
    "aphid": {
        "temp_range": (10, 25),
        "humidity_range": (50, 80),
        "seasons": ["rabi"],
        "regions": ["punjab", "sindh", "kpk"],
        "crops": ["wheat", "mustard", "chickpea", "lentil"],
    },
    "stem_borer": {
        "temp_range": (22, 35),
        "humidity_range": (60, 90),
        "seasons": ["kharif"],
        "regions": ["punjab", "sindh"],
        "crops": ["rice", "sugarcane", "maize"],
    },
    "fruit_fly": {
        "temp_range": (25, 38),
        "humidity_range": (60, 85),
        "seasons": ["kharif"],
        "regions": ["sindh", "punjab", "balochistan"],
        "crops": ["mango", "citrus"],
    },
    "jassid": {
        "temp_range": (25, 38),
        "humidity_range": (50, 80),
        "seasons": ["kharif"],
        "regions": ["punjab", "sindh"],
        "crops": ["cotton"],
    },
    "rice_leaf_folder": {
        "temp_range": (25, 35),
        "humidity_range": (70, 95),
        "seasons": ["kharif"],
        "regions": ["punjab", "sindh"],
        "crops": ["rice"],
    },
    "rust": {
        "temp_range": (10, 22),
        "humidity_range": (70, 95),
        "seasons": ["rabi"],
        "regions": ["punjab", "sindh", "kpk"],
        "crops": ["wheat"],
    },
}

# Feature encoding maps
SEASON_ENCODING: dict[str, int] = {"rabi": 0, "kharif": 1, "zaid": 2}
REGION_ENCODING: dict[str, int] = {
    "punjab": 0,
    "sindh": 1,
    "kpk": 2,
    "balochistan": 3,
    "gilgit_baltistan": 4,
    "azad_kashmir": 5,
    "islamabad": 6,
    "southern_punjab": 7,
}
CROP_ENCODING: dict[str, int] = {
    crop: i
    for i, crop in enumerate(
        [
            "wheat", "rice", "cotton", "sugarcane", "maize", "potato",
            "onion", "tomato", "chickpea", "lentil", "mustard",
            "sunflower", "barley", "mango", "citrus", "pepper",
        ]
    )
}


class PestRiskInput(BaseModel):
    """Input features for pest risk scoring."""

    temperature: float = Field(description="Current temperature in Celsius")
    humidity: float = Field(ge=0, le=100, description="Relative humidity %")
    rainfall_mm: float = Field(default=0.0, ge=0.0, description="Recent rainfall in mm")
    season: str = Field(description="Growing season: rabi, kharif, or zaid")
    region: str = Field(description="Province or district name")
    crop_type: str = Field(description="Crop being grown")
    wind_speed: float | None = Field(default=None, ge=0.0, description="Wind speed m/s")


class PestRiskPrediction(ModelPrediction):
    """Output from pest risk scoring."""

    risk_level: Literal["Low", "Medium", "High"] = Field(
        default="Low", description="Overall pest risk level"
    )
    risk_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Numerical risk score"
    )
    likely_pests: list[str] = Field(
        default_factory=list, description="Most likely pest threats"
    )
    pest_details: list[dict[str, str | float]] = Field(
        default_factory=list,
        description="Per-pest risk details with individual scores",
    )
    season: str = Field(default="unknown")
    region: str = Field(default="unknown")
    crop_type: str = Field(default="unknown")
    method: str = Field(
        default="model",
        description="Prediction method used: 'model' or 'rule_based'",
    )


class XGBoostConfig(ModelConfig):
    """Configuration for XGBoost pest risk model."""

    model_path: str = "xgboost-pest-risk-pakistan"
    risk_threshold_medium: float = Field(
        default=0.35, description="Score threshold for Medium risk"
    )
    risk_threshold_high: float = Field(
        default=0.65, description="Score threshold for High risk"
    )


class PestRiskModel(BaseMLModel[PestRiskInput, PestRiskPrediction]):
    """XGBoost ensemble for pest risk prediction.

    Trained on weather/season/region pest occurrence data for Pakistan.
    Falls back to rule-based heuristics using known pest temperature
    and humidity profiles when the model is unavailable.
    """

    _instance: ClassVar[PestRiskModel | None] = None

    def __init__(self, config: XGBoostConfig | None = None) -> None:
        super().__init__(config or XGBoostConfig())
        self._config: XGBoostConfig = config or XGBoostConfig()

    @classmethod
    def get_instance(cls, config: XGBoostConfig | None = None) -> PestRiskModel:
        """Singleton access."""
        if cls._instance is None:
            cls._instance = cls(config)
        return cls._instance

    def load_model(self) -> None:
        """Load XGBoost model from file."""
        try:
            import xgboost as xgb

            model_path = Path(self._config.model_path)
            if model_path.exists() and model_path.suffix in (".json", ".ubj", ".model"):
                self._model = xgb.XGBClassifier()
                self._model.load_model(str(model_path))
                logger.info("XGBoost pest model loaded from %s", model_path)
            else:
                logger.warning(
                    "No XGBoost model at %s. Will use rule-based fallback.",
                    self._config.model_path,
                )
                self._model = None
                self._is_loaded = True

        except Exception as exc:
            logger.warning("Failed to load XGBoost model: %s", exc)
            self._model = None
            self._is_loaded = True

    def predict(self, input_data: PestRiskInput) -> PestRiskPrediction:
        """Predict pest risk from environmental features."""
        if self._model is not None:
            return self._model_predict(input_data)
        return self._rule_based_predict(input_data)

    def _model_predict(self, input_data: PestRiskInput) -> PestRiskPrediction:
        """Run XGBoost model inference."""
        features = self._encode_features(input_data)
        feature_array = np.array([features], dtype=np.float32)

        proba = self._model.predict_proba(feature_array)[0]

        # Assume 3-class output: [Low, Medium, High]
        risk_classes = ["Low", "Medium", "High"]
        pred_idx = int(np.argmax(proba))
        risk_level = risk_classes[pred_idx]
        risk_score = float(proba[2]) + float(proba[1]) * 0.5  # Weighted risk score

        # Identify likely pests using rule-based analysis (model gives overall risk)
        likely_pests, pest_details = self._identify_likely_pests(input_data)

        return PestRiskPrediction(
            success=True,
            confidence=round(float(proba[pred_idx]), 4),
            risk_level=risk_level,
            risk_score=round(min(1.0, risk_score), 4),
            likely_pests=likely_pests,
            pest_details=pest_details,
            season=input_data.season,
            region=input_data.region,
            crop_type=input_data.crop_type,
            method="model",
            device_used=str(self.device),
        )

    def _rule_based_predict(self, input_data: PestRiskInput) -> PestRiskPrediction:
        """Rule-based heuristic prediction using known pest profiles."""
        likely_pests, pest_details = self._identify_likely_pests(input_data)

        if not likely_pests:
            risk_score = 0.1
        else:
            # Average individual pest scores
            scores = [d["risk_score"] for d in pest_details if isinstance(d.get("risk_score"), float)]
            risk_score = sum(scores) / len(scores) if scores else 0.1

        risk_level = self._score_to_level(risk_score)

        return PestRiskPrediction(
            success=True,
            confidence=round(min(0.6, 0.3 + len(likely_pests) * 0.1), 4),
            risk_level=risk_level,
            risk_score=round(risk_score, 4),
            likely_pests=likely_pests,
            pest_details=pest_details,
            season=input_data.season,
            region=input_data.region,
            crop_type=input_data.crop_type,
            method="rule_based",
            warnings=["XGBoost model unavailable -- using rule-based heuristic"],
            device_used="cpu",
        )

    def _encode_features(self, input_data: PestRiskInput) -> list[float]:
        """Encode input features for XGBoost."""
        season_enc = SEASON_ENCODING.get(input_data.season.lower(), 0)
        region_enc = REGION_ENCODING.get(input_data.region.lower(), 0)
        crop_enc = CROP_ENCODING.get(input_data.crop_type.lower(), 0)

        return [
            input_data.temperature,
            input_data.humidity,
            input_data.rainfall_mm,
            input_data.wind_speed or 0.0,
            float(season_enc),
            float(region_enc),
            float(crop_enc),
            input_data.temperature * input_data.humidity / 100.0,  # temp-humidity interaction
            max(0.0, input_data.temperature - 25) * input_data.humidity / 100.0,  # heat-humidity stress
        ]

    def _identify_likely_pests(
        self, input_data: PestRiskInput
    ) -> tuple[list[str], list[dict[str, str | float]]]:
        """Identify likely pests based on environmental conditions and pest profiles."""
        temp = input_data.temperature
        humidity = input_data.humidity
        season = input_data.season.lower()
        region = input_data.region.lower()
        crop = input_data.crop_type.lower()

        likely: list[str] = []
        details: list[dict[str, str | float]] = []

        for pest_name, profile in PAKISTAN_PESTS.items():
            temp_lo, temp_hi = profile["temp_range"]
            hum_lo, hum_hi = profile["humidity_range"]

            # Check if current conditions match pest profile
            temp_match = temp_lo <= temp <= temp_hi
            hum_match = hum_lo <= humidity <= hum_hi
            season_match = season in profile["seasons"]
            region_match = region in profile["regions"]
            crop_match = crop in profile["crops"]

            if not crop_match:
                continue

            # Calculate individual risk score
            score = 0.0
            factors = []

            if temp_match:
                # How centered in the optimal range
                temp_center = (temp_lo + temp_hi) / 2
                temp_range = (temp_hi - temp_lo) / 2
                temp_score = max(0, 1.0 - abs(temp - temp_center) / temp_range)
                score += temp_score * 0.3
                factors.append("temperature in pest range")

            if hum_match:
                hum_center = (hum_lo + hum_hi) / 2
                hum_range = (hum_hi - hum_lo) / 2
                hum_score = max(0, 1.0 - abs(humidity - hum_center) / hum_range)
                score += hum_score * 0.3
                factors.append("humidity in pest range")

            if season_match:
                score += 0.2
                factors.append("active season")

            if region_match:
                score += 0.2
                factors.append("active region")

            if score >= 0.3:
                pest_display = pest_name.replace("_", " ").title()
                likely.append(pest_display)
                details.append({
                    "pest": pest_display,
                    "risk_score": round(score, 4),
                    "factors": ", ".join(factors),
                })

        # Sort by risk score descending
        details.sort(key=lambda d: d.get("risk_score", 0), reverse=True)
        likely = [d["pest"] for d in details]

        return likely, details

    def _score_to_level(self, score: float) -> Literal["Low", "Medium", "High"]:
        """Convert a numerical score to a risk level."""
        if score >= self._config.risk_threshold_high:
            return "High"
        if score >= self._config.risk_threshold_medium:
            return "Medium"
        return "Low"

    def _degraded_response(
        self,
        elapsed_ms: float,
        error: str,
        warnings: list[str],
    ) -> PestRiskPrediction:
        return PestRiskPrediction(
            success=False,
            confidence=0.0,
            inference_time_ms=elapsed_ms,
            device_used=str(self.device),
            error=error,
            warnings=warnings,
            risk_level="Low",
            risk_score=0.0,
            likely_pests=[],
            method="none",
        )
