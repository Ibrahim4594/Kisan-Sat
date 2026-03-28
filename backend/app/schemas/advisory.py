"""Advisory agent schemas."""

from pydantic import BaseModel, Field

from app.schemas.common import AgentOutput, RiskLevel


class ActionItem(BaseModel):
    priority: int = Field(..., ge=1, le=5, description="1=highest priority")
    action: str
    action_ur: str | None = None
    timeframe: str
    category: str
    estimated_cost_pkr: float | None = None


class RiskSummary(BaseModel):
    category: str
    level: RiskLevel
    description: str
    description_ur: str | None = None
    mitigation: str


class AdvisoryOutput(AgentOutput):
    """Synthesized advisory from all agent outputs."""
    summary_en: str = ""
    summary_ur: str = ""
    action_items: list[ActionItem] = Field(default_factory=list)
    risk_summary: list[RiskSummary] = Field(default_factory=list)
    seasonal_tips: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "This advisory is AI-generated using satellite and weather data. "
        "Always consult local agricultural extension officers for critical decisions."
    )
