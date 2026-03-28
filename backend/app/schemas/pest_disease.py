"""Pest and disease agent schemas."""

from pydantic import BaseModel, Field

from app.schemas.common import AgentOutput, RiskLevel


class PestAlert(BaseModel):
    pest_name: str
    scientific_name: str | None = None
    risk_level: RiskLevel
    affected_crops: list[str]
    symptoms: list[str]
    conditions_favorable: str
    prevention: list[str]
    treatment: list[str]
    organic_options: list[str] = Field(default_factory=list)


class DiseaseAlert(BaseModel):
    disease_name: str
    pathogen_type: str | None = None
    risk_level: RiskLevel
    affected_crops: list[str]
    symptoms: list[str]
    conditions_favorable: str
    prevention: list[str]
    treatment: list[str]


class LocustWatch(BaseModel):
    active_swarms: bool = False
    nearest_swarm_km: float | None = None
    risk_level: RiskLevel = RiskLevel.LOW
    fao_bulletin: str | None = None
    last_updated: str | None = None


class PestDiseaseOutput(AgentOutput):
    """Complete pest and disease analysis output."""
    pest_alerts: list[PestAlert] = Field(default_factory=list)
    disease_alerts: list[DiseaseAlert] = Field(default_factory=list)
    locust: LocustWatch = Field(default_factory=LocustWatch)
    overall_risk: RiskLevel = RiskLevel.LOW
    spray_schedule: list[str] = Field(default_factory=list)
    integrated_pest_management: list[str] = Field(default_factory=list)
