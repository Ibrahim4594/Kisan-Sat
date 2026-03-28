"""Weather agent schemas."""

from pydantic import BaseModel, Field

from app.schemas.common import AgentOutput, RiskLevel, TrendDirection


class DailyForecast(BaseModel):
    date: str
    temp_min_c: float
    temp_max_c: float
    humidity_pct: float
    precipitation_mm: float
    wind_speed_kmh: float
    condition: str


class DroughtIndicator(BaseModel):
    spi_index: float | None = Field(None, description="Standardized Precipitation Index")
    days_without_rain: int = 0
    soil_moisture_deficit: bool = False
    risk_level: RiskLevel = RiskLevel.LOW


class FloodRisk(BaseModel):
    cumulative_rainfall_mm: float = 0.0
    river_proximity_warning: bool = False
    risk_level: RiskLevel = RiskLevel.LOW
    advisory: str = ""


class HistoricalComparison(BaseModel):
    avg_temp_deviation_c: float = 0.0
    avg_rainfall_deviation_mm: float = 0.0
    trend: TrendDirection = TrendDirection.STABLE


class WeatherOutput(AgentOutput):
    """Complete weather analysis output."""
    current_temp_c: float | None = None
    current_humidity_pct: float | None = None
    current_condition: str | None = None
    forecast_7day: list[DailyForecast] = Field(default_factory=list)
    drought: DroughtIndicator = Field(default_factory=DroughtIndicator)
    flood_risk: FloodRisk = Field(default_factory=FloodRisk)
    historical: HistoricalComparison = Field(default_factory=HistoricalComparison)
    growing_degree_days: float | None = None
