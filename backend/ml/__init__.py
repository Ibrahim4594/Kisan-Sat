"""KisanSat ML models package.

Provides crop classification, disease detection, yield prediction,
and pest risk scoring for Pakistani agriculture.
"""

from ml.base import (
    BaseMLModel,
    DeviceType,
    ModelConfig,
    ModelPrediction,
    detect_device,
)
from ml.efficientnet import (
    CropDiseaseModel,
    DiseaseInput,
    DiseasePrediction,
    EfficientNetConfig,
)
from ml.lstm_yield import (
    LSTMConfig,
    WeatherRecord,
    YieldInput,
    YieldPrediction,
    YieldPredictionModel,
)
from ml.prithvi import (
    PrithviConfig,
    PrithviEOModel,
    PrithviInput,
    PrithviPrediction,
)
from ml.xgboost_pest import (
    PestRiskInput,
    PestRiskModel,
    PestRiskPrediction,
    XGBoostConfig,
)

__all__ = [
    # Base
    "BaseMLModel",
    "DeviceType",
    "ModelConfig",
    "ModelPrediction",
    "detect_device",
    # Prithvi-EO
    "PrithviEOModel",
    "PrithviConfig",
    "PrithviInput",
    "PrithviPrediction",
    # EfficientNet Disease
    "CropDiseaseModel",
    "EfficientNetConfig",
    "DiseaseInput",
    "DiseasePrediction",
    # LSTM Yield
    "YieldPredictionModel",
    "LSTMConfig",
    "YieldInput",
    "YieldPrediction",
    "WeatherRecord",
    # XGBoost Pest
    "PestRiskModel",
    "XGBoostConfig",
    "PestRiskInput",
    "PestRiskPrediction",
]
