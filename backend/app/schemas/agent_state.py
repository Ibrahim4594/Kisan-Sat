"""LangGraph AgentState TypedDict definition."""

import operator
from typing import Annotated, TypedDict

from app.schemas.advisory import AdvisoryOutput
from app.schemas.common import QueryInput
from app.schemas.market import MarketOutput
from app.schemas.pest_disease import PestDiseaseOutput
from app.schemas.soil_crop import SoilCropOutput
from app.schemas.weather import WeatherOutput


def merge_dicts(a: dict, b: dict) -> dict:
    """Merge two dicts — used for concurrent agent_statuses updates."""
    merged = dict(a)
    merged.update(b)
    return merged


class AgentState(TypedDict, total=False):
    """Shared state passed through the LangGraph pipeline.

    Each agent reads `query` and writes its own output key.
    The supervisor reads all outputs to produce the final advisory.
    """
    # Input
    query: QueryInput
    query_id: str

    # Agent outputs (populated by each agent node)
    weather_output: WeatherOutput | None
    soil_crop_output: SoilCropOutput | None
    pest_disease_output: PestDiseaseOutput | None
    market_output: MarketOutput | None
    advisory_output: AdvisoryOutput | None

    # Execution metadata — Annotated for concurrent parallel writes
    agent_statuses: Annotated[dict[str, dict[str, str | float | None]], merge_dicts]
    errors: Annotated[list[str], operator.add]
