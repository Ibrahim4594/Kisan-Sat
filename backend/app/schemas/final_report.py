"""Final consolidated report schema."""

from pydantic import BaseModel, Field

from app.schemas.advisory import AdvisoryOutput
from app.schemas.market import MarketOutput
from app.schemas.pest_disease import PestDiseaseOutput
from app.schemas.soil_crop import SoilCropOutput
from app.schemas.weather import WeatherOutput


class AgentStatusInfo(BaseModel):
    agent_name: str
    status: str = "pending"
    duration_ms: float | None = None
    error: str | None = None


class FinalReport(BaseModel):
    """Complete report combining all agent outputs."""
    query_id: str
    timestamp: str
    weather: WeatherOutput | None = None
    soil_crop: SoilCropOutput | None = None
    pest_disease: PestDiseaseOutput | None = None
    market: MarketOutput | None = None
    advisory: AdvisoryOutput | None = None
    agent_statuses: list[AgentStatusInfo] = Field(default_factory=list)
    total_duration_ms: float | None = None
    overall_confidence: float = Field(0.0, ge=0.0, le=1.0)
