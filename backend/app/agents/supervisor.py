"""Supervisor — orchestrates agent execution and builds final report."""

import logging
import time
from datetime import datetime, timezone

from app.schemas.agent_state import AgentState
from app.schemas.common import QueryInput
from app.schemas.final_report import AgentStatusInfo, FinalReport

logger = logging.getLogger("kisansat.supervisor")


def initialize_state(query: QueryInput, query_id: str) -> AgentState:
    """Create the initial agent state from a user query."""
    return AgentState(
        query=query,
        query_id=query_id,
        weather_output=None,
        soil_crop_output=None,
        pest_disease_output=None,
        market_output=None,
        advisory_output=None,
        agent_statuses={},
        errors=[],
    )


def build_final_report(state: AgentState, start_time: float) -> FinalReport:
    """Build the final consolidated report from completed agent state."""
    total_duration = (time.time() - start_time) * 1000  # ms

    statuses = []
    for name, info in state.get("agent_statuses", {}).items():
        statuses.append(AgentStatusInfo(
            agent_name=name,
            status=str(info.get("status", "unknown")),
            duration_ms=info.get("duration_ms"),
            error=info.get("error"),
        ))

    # Overall confidence = weighted average of available agents
    confidences = []
    weights = []
    if state.get("weather_output"):
        confidences.append(state["weather_output"].confidence)
        weights.append(0.25)
    if state.get("soil_crop_output"):
        confidences.append(state["soil_crop_output"].confidence)
        weights.append(0.25)
    if state.get("pest_disease_output"):
        confidences.append(state["pest_disease_output"].confidence)
        weights.append(0.2)
    if state.get("market_output"):
        confidences.append(state["market_output"].confidence)
        weights.append(0.15)
    if state.get("advisory_output"):
        confidences.append(state["advisory_output"].confidence)
        weights.append(0.15)

    if confidences:
        total_weight = sum(weights)
        overall = sum(c * w for c, w in zip(confidences, weights)) / total_weight
    else:
        overall = 0.0

    logger.info(
        "Final report built: %d agents completed, overall_confidence=%.2f, duration=%.0fms",
        len(statuses), overall, total_duration,
    )

    return FinalReport(
        query_id=state.get("query_id", "unknown"),
        timestamp=datetime.now(timezone.utc).isoformat(),
        weather=state.get("weather_output"),
        soil_crop=state.get("soil_crop_output"),
        pest_disease=state.get("pest_disease_output"),
        market=state.get("market_output"),
        advisory=state.get("advisory_output"),
        agent_statuses=statuses,
        total_duration_ms=round(total_duration, 1),
        overall_confidence=round(overall, 3),
    )
