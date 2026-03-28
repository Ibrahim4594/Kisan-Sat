"""Soil and crop agent schemas."""

from pydantic import BaseModel, Field

from app.schemas.common import AgentOutput, RiskLevel


class NDVIData(BaseModel):
    current_ndvi: float | None = Field(None, ge=-1.0, le=1.0)
    ndvi_trend: str = "unknown"
    health_status: str = "unknown"
    measurement_date: str | None = None


class SoilData(BaseModel):
    moisture_pct: float | None = None
    temperature_c: float | None = None
    soil_type: str | None = None
    ph: float | None = None
    organic_matter_pct: float | None = None


class CropRecommendation(BaseModel):
    crop_name: str
    suitability_score: float = Field(..., ge=0.0, le=1.0)
    reason: str
    expected_yield_kg_per_acre: float | None = None
    water_requirement_mm: float | None = None
    season_match: bool = True


class IrrigationAdvice(BaseModel):
    needs_irrigation: bool = False
    recommended_mm: float | None = None
    frequency_days: int | None = None
    method: str | None = None


class SoilCropOutput(AgentOutput):
    """Complete soil and crop analysis output."""
    ndvi: NDVIData = Field(default_factory=NDVIData)
    soil: SoilData = Field(default_factory=SoilData)
    crop_health_risk: RiskLevel = RiskLevel.LOW
    recommendations: list[CropRecommendation] = Field(default_factory=list)
    irrigation: IrrigationAdvice = Field(default_factory=IrrigationAdvice)
    current_crop_stage: str | None = None
