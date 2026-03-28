"""LangGraph StateGraph — parallel fan-out for data agents, then advisory synthesis."""

import logging
import time
from typing import Any

from langgraph.graph import StateGraph, START, END

from app.schemas.agent_state import AgentState
from app.agents.weather_agent import weather_agent
from app.agents.soil_crop_agent import soil_crop_agent
from app.agents.pest_disease_agent import pest_disease_agent
from app.agents.market_agent import market_agent
from app.agents.advisory_agent import advisory_agent

logger = logging.getLogger("kisansat.graph")


async def _timed_agent(
    name: str,
    agent_fn: Any,
    state: AgentState,
) -> dict:
    """Wrap an agent call with timing and error handling."""
    start = time.time()
    try:
        logger.info("Starting agent: %s", name)
        result = await agent_fn(state)
        duration = (time.time() - start) * 1000
        logger.info("Agent %s completed in %.0fms", name, duration)

        # Only write single-key status dict — merge_dicts handles concurrent writes
        result["agent_statuses"] = {name: {"status": "completed", "duration_ms": round(duration, 1)}}
        return result

    except Exception as e:
        duration = (time.time() - start) * 1000
        logger.error("Agent %s failed after %.0fms: %s", name, duration, e)

        return {
            "agent_statuses": {name: {"status": "failed", "duration_ms": round(duration, 1), "error": str(e)}},
            "errors": [f"{name}: {e}"],
        }


async def weather_node(state: AgentState) -> dict:
    return await _timed_agent("weather", weather_agent, state)


async def soil_crop_node(state: AgentState) -> dict:
    return await _timed_agent("soil_crop", soil_crop_agent, state)


async def pest_disease_node(state: AgentState) -> dict:
    return await _timed_agent("pest_disease", pest_disease_agent, state)


async def market_node(state: AgentState) -> dict:
    return await _timed_agent("market", market_agent, state)


async def advisory_node(state: AgentState) -> dict:
    return await _timed_agent("advisory", advisory_agent, state)


def build_graph() -> StateGraph:
    """Build the KisanSat multi-agent LangGraph.

    Topology:
        START
          |
          +---> weather_node ----+
          |                      |
          +---> soil_crop_node --+---> pest_disease_node ---> advisory_node ---> END
          |                      |
          +---> market_node -----+

    Weather, soil_crop, and market run in parallel (fan-out).
    Pest/disease runs after weather + soil_crop (needs their data).
    Advisory runs last (synthesizes everything).
    """
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("weather", weather_node)
    graph.add_node("soil_crop", soil_crop_node)
    graph.add_node("market", market_node)
    graph.add_node("pest_disease", pest_disease_node)
    graph.add_node("advisory", advisory_node)

    # Fan-out from START: weather, soil_crop, market run in parallel
    graph.add_edge(START, "weather")
    graph.add_edge(START, "soil_crop")
    graph.add_edge(START, "market")

    # Pest/disease needs weather data for temperature/humidity conditions
    graph.add_edge("weather", "pest_disease")
    graph.add_edge("soil_crop", "pest_disease")

    # Advisory synthesizes all outputs — runs after everything else
    graph.add_edge("pest_disease", "advisory")
    graph.add_edge("market", "advisory")

    # Advisory is the final node
    graph.add_edge("advisory", END)

    return graph


def compile_graph():
    """Compile the graph for execution."""
    graph = build_graph()
    return graph.compile()


# Module-level compiled graph (reused across requests)
kisansat_graph = compile_graph()
