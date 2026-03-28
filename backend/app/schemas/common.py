"""Shared enums and base models used across all agents."""

from enum import Enum

from pydantic import BaseModel, Field


class Season(str, Enum):
    KHARIF = "kharif"      # Summer: Jun-Oct (rice, cotton, sugarcane, maize)
    RABI = "rabi"          # Winter: Nov-Apr (wheat, barley, lentils, chickpea)
    ZAID = "zaid"          # Spring: Mar-Jun (watermelon, muskmelon, cucumber)


class RiskLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Language(str, Enum):
    EN = "en"
    UR = "ur"


class TrendDirection(str, Enum):
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"
    VOLATILE = "volatile"


class GeoLocation(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    district: str | None = None
    province: str | None = None


class QueryInput(BaseModel):
    """User query input to the multi-agent system."""
    location: GeoLocation
    crop: str | None = None
    season: Season | None = None
    language: Language = Language.EN
    question: str | None = None


class DataSourceInfo(BaseModel):
    """Metadata about a data source used by an agent."""
    name: str
    url: str | None = None
    timestamp: str | None = None
    status: str = "success"


class AgentOutput(BaseModel):
    """Base model for all agent outputs."""
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0-1")
    reasoning: str = Field(..., description="Explanation of how the result was derived")
    warnings: list[str] = Field(default_factory=list)
    data_sources: list[DataSourceInfo] = Field(default_factory=list)
