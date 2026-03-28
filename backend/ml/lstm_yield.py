"""LSTM time-series crop yield prediction for KisanSat.

Predicts crop yield from historical NASA POWER weather data and NDVI
time series using a 2-layer LSTM network.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import ClassVar, Literal

import numpy as np
import torch
import torch.nn as nn
from pydantic import BaseModel, Field

from ml.base import BaseMLModel, ModelConfig, ModelPrediction

logger = logging.getLogger(__name__)

# Regional average yields (tonnes/hectare) for Pakistan crops -- fallback estimates
PAKISTAN_AVG_YIELDS: dict[str, float] = {
    "wheat": 2.9,
    "rice": 2.5,
    "cotton": 0.8,
    "sugarcane": 55.0,
    "maize": 4.8,
    "potato": 22.0,
    "onion": 13.0,
    "tomato": 10.5,
    "chickpea": 0.5,
    "lentil": 0.5,
    "mustard": 0.9,
    "sunflower": 1.2,
    "barley": 2.0,
    "mango": 7.0,
    "citrus": 10.0,
}

# Weather feature columns expected from NASA POWER
WEATHER_FEATURES: list[str] = [
    "temperature_max",
    "temperature_min",
    "temperature_mean",
    "precipitation",
    "humidity",
    "wind_speed",
    "solar_radiation",
]

INPUT_FEATURES = len(WEATHER_FEATURES) + 1  # +1 for NDVI
SEQUENCE_LENGTH = 90  # One growing season in days


class WeatherRecord(BaseModel):
    """Single day of weather data."""

    temperature_max: float = Field(description="Max temp in Celsius")
    temperature_min: float = Field(description="Min temp in Celsius")
    temperature_mean: float = Field(description="Mean temp in Celsius")
    precipitation: float = Field(default=0.0, ge=0.0, description="Precipitation in mm")
    humidity: float = Field(default=50.0, ge=0, le=100, description="Relative humidity %")
    wind_speed: float = Field(default=0.0, ge=0.0, description="Wind speed m/s")
    solar_radiation: float = Field(default=0.0, ge=0.0, description="Solar radiation MJ/m2/day")


class YieldInput(BaseModel):
    """Input for yield prediction."""

    weather_series: list[WeatherRecord] = Field(
        description="Daily weather records for the growing season"
    )
    ndvi_series: list[float] = Field(
        description="NDVI values over the growing season (one per day or interpolated)"
    )
    crop_type: str = Field(description="Crop being grown")
    region: str = Field(default="punjab", description="Province or district")
    season: str = Field(default="rabi", description="Growing season (rabi/kharif)")


class YieldPrediction(ModelPrediction):
    """Output from yield prediction model."""

    predicted_yield_tonnes_per_hectare: float = Field(
        default=0.0, ge=0.0, description="Predicted crop yield"
    )
    confidence_interval_low: float = Field(
        default=0.0, ge=0.0, description="Lower bound of 90% confidence interval"
    )
    confidence_interval_high: float = Field(
        default=0.0, ge=0.0, description="Upper bound of 90% confidence interval"
    )
    yield_trend: Literal["increasing", "stable", "decreasing"] = Field(
        default="stable", description="Yield trend based on recent NDVI trajectory"
    )
    crop_type: str = Field(default="unknown")
    region: str = Field(default="unknown")


class YieldLSTM(nn.Module):
    """2-layer LSTM for yield prediction from weather + NDVI sequences."""

    def __init__(
        self,
        input_size: int = INPUT_FEATURES,
        hidden_size: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2,
    ) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.head = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 2),  # [mean, log_variance] for confidence interval
        )

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """Forward pass returning predicted mean and log-variance."""
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]
        output = self.head(last_hidden)
        mean = output[:, 0]
        log_var = output[:, 1]
        return mean, log_var


class LSTMConfig(ModelConfig):
    """Configuration for LSTM yield model."""

    model_path: str = "lstm-yield-pakistan"
    hidden_size: int = Field(default=128, description="LSTM hidden state size")
    num_layers: int = Field(default=2, description="Number of LSTM layers")
    sequence_length: int = Field(default=SEQUENCE_LENGTH, description="Input sequence length in days")
    dropout: float = Field(default=0.2, ge=0.0, le=0.5)


class YieldPredictionModel(BaseMLModel[YieldInput, YieldPrediction]):
    """LSTM model for crop yield prediction from weather and NDVI time series.

    Uses a 2-layer LSTM trained on historical NASA POWER weather data
    combined with NDVI values. Falls back to regional average yields
    when model weights are unavailable.
    """

    _instance: ClassVar[YieldPredictionModel | None] = None

    def __init__(self, config: LSTMConfig | None = None) -> None:
        super().__init__(config or LSTMConfig())
        self._config: LSTMConfig = config or LSTMConfig()
        self._feature_means: np.ndarray | None = None
        self._feature_stds: np.ndarray | None = None

    @classmethod
    def get_instance(cls, config: LSTMConfig | None = None) -> YieldPredictionModel:
        """Singleton access."""
        if cls._instance is None:
            cls._instance = cls(config)
        return cls._instance

    def load_model(self) -> None:
        """Load LSTM model weights."""
        try:
            model = YieldLSTM(
                input_size=INPUT_FEATURES,
                hidden_size=self._config.hidden_size,
                num_layers=self._config.num_layers,
                dropout=self._config.dropout,
            )

            weights_path = Path(self._config.model_path)
            if weights_path.exists() and weights_path.suffix in (".pt", ".pth"):
                checkpoint = torch.load(
                    weights_path, map_location=self.device, weights_only=True
                )
                if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                    model.load_state_dict(checkpoint["model_state_dict"])
                    self._feature_means = checkpoint.get("feature_means")
                    self._feature_stds = checkpoint.get("feature_stds")
                else:
                    model.load_state_dict(checkpoint)
                logger.info("Loaded LSTM weights from %s", weights_path)
            else:
                logger.warning(
                    "No LSTM weights at %s. Model will produce untrained outputs.",
                    self._config.model_path,
                )

            model.to(self.device)
            model.eval()
            self._model = model
            logger.info("LSTM yield model loaded on %s", self.device)

        except Exception as exc:
            logger.warning("Failed to load LSTM model: %s", exc)
            self._model = None
            self._is_loaded = True

    def predict(self, input_data: YieldInput) -> YieldPrediction:
        """Predict crop yield from weather and NDVI series."""
        if self._model is None:
            return self._regional_average_fallback(input_data)

        tensor = self._prepare_sequence(input_data)
        if tensor is None:
            return self._regional_average_fallback(
                input_data,
                extra_warnings=["Insufficient data for time-series prediction"],
            )

        with torch.no_grad():
            mean, log_var = self._model(tensor)

        predicted_yield = max(0.0, mean.item())
        std = float(torch.exp(0.5 * log_var).item())

        # 90% confidence interval
        ci_low = max(0.0, predicted_yield - 1.645 * std)
        ci_high = predicted_yield + 1.645 * std

        # Determine yield trend from NDVI trajectory
        trend = self._compute_trend(input_data.ndvi_series)

        return YieldPrediction(
            success=True,
            confidence=self._std_to_confidence(std),
            predicted_yield_tonnes_per_hectare=round(predicted_yield, 2),
            confidence_interval_low=round(ci_low, 2),
            confidence_interval_high=round(ci_high, 2),
            yield_trend=trend,
            crop_type=input_data.crop_type,
            region=input_data.region,
            device_used=str(self.device),
        )

    def _prepare_sequence(self, input_data: YieldInput) -> torch.Tensor | None:
        """Convert weather records + NDVI into a padded/truncated tensor."""
        weather = input_data.weather_series
        ndvi = input_data.ndvi_series

        if len(weather) < 7:
            return None

        seq_len = self._config.sequence_length
        features = []

        for i in range(min(len(weather), seq_len)):
            w = weather[i]
            ndvi_val = ndvi[i] if i < len(ndvi) else (ndvi[-1] if ndvi else 0.0)
            row = [
                w.temperature_max,
                w.temperature_min,
                w.temperature_mean,
                w.precipitation,
                w.humidity,
                w.wind_speed,
                w.solar_radiation,
                ndvi_val,
            ]
            features.append(row)

        arr = np.array(features, dtype=np.float32)

        # Pad to sequence_length if shorter
        if arr.shape[0] < seq_len:
            pad = np.zeros((seq_len - arr.shape[0], arr.shape[1]), dtype=np.float32)
            arr = np.concatenate([arr, pad], axis=0)

        # Normalize features
        if self._feature_means is not None and self._feature_stds is not None:
            arr = (arr - self._feature_means) / (self._feature_stds + 1e-8)
        else:
            # Simple z-score normalization per feature
            means = arr.mean(axis=0, keepdims=True)
            stds = arr.std(axis=0, keepdims=True)
            arr = (arr - means) / (stds + 1e-8)

        tensor = torch.from_numpy(arr).unsqueeze(0)  # [1, seq_len, features]
        return tensor.to(self.device)

    def _regional_average_fallback(
        self,
        input_data: YieldInput,
        extra_warnings: list[str] | None = None,
    ) -> YieldPrediction:
        """Return regional average yield when model is unavailable."""
        warnings = ["LSTM model unavailable -- using regional average estimate"]
        if extra_warnings:
            warnings.extend(extra_warnings)

        crop = input_data.crop_type.lower()
        avg_yield = PAKISTAN_AVG_YIELDS.get(crop, 2.0)

        # Wide confidence interval for fallback
        ci_low = avg_yield * 0.6
        ci_high = avg_yield * 1.4

        trend = self._compute_trend(input_data.ndvi_series)

        return YieldPrediction(
            success=True,
            confidence=0.2,
            predicted_yield_tonnes_per_hectare=round(avg_yield, 2),
            confidence_interval_low=round(ci_low, 2),
            confidence_interval_high=round(ci_high, 2),
            yield_trend=trend,
            crop_type=input_data.crop_type,
            region=input_data.region,
            warnings=warnings,
            device_used="cpu",
        )

    @staticmethod
    def _compute_trend(ndvi_series: list[float]) -> Literal["increasing", "stable", "decreasing"]:
        """Determine trend from the last portion of NDVI series."""
        if len(ndvi_series) < 10:
            return "stable"
        recent = ndvi_series[-10:]
        first_half = np.mean(recent[:5])
        second_half = np.mean(recent[5:])
        diff = second_half - first_half
        if diff > 0.05:
            return "increasing"
        elif diff < -0.05:
            return "decreasing"
        return "stable"

    @staticmethod
    def _std_to_confidence(std: float) -> float:
        """Convert prediction standard deviation to a confidence score."""
        # Higher std -> lower confidence, capped at [0.1, 0.95]
        confidence = max(0.1, min(0.95, 1.0 / (1.0 + std)))
        return round(confidence, 4)

    def _degraded_response(
        self,
        elapsed_ms: float,
        error: str,
        warnings: list[str],
    ) -> YieldPrediction:
        return YieldPrediction(
            success=False,
            confidence=0.0,
            inference_time_ms=elapsed_ms,
            device_used=str(self.device),
            error=error,
            warnings=warnings,
            predicted_yield_tonnes_per_hectare=0.0,
            confidence_interval_low=0.0,
            confidence_interval_high=0.0,
            yield_trend="stable",
        )
