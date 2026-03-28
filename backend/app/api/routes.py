"""FastAPI routes — POST /api/query, GET /api/health, WebSocket /ws/agent-status."""

import asyncio
import json
import logging
import time
import traceback
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.agents.graph import kisansat_graph
from app.agents.supervisor import build_final_report, initialize_state
from app.schemas.common import QueryInput
from app.schemas.final_report import FinalReport

logger = logging.getLogger("kisansat.api")
router = APIRouter()

# Track active WebSocket connections for agent status updates
_ws_connections: dict[str, list[WebSocket]] = {}


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str


class QueryResponse(BaseModel):
    query_id: str
    report: FinalReport


@router.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/api/query", response_model=QueryResponse)
async def run_query(query: QueryInput) -> QueryResponse | JSONResponse:
    """Run the full multi-agent pipeline for a farmer query."""
    query_id = str(uuid.uuid4())
    start_time = time.time()

    logger.info(
        "Received query %s: location=(%.4f, %.4f), crop=%s, season=%s",
        query_id,
        query.location.latitude,
        query.location.longitude,
        query.crop,
        getattr(query, "season", "N/A"),
    )

    # Initialize state
    try:
        state = initialize_state(query, query_id)
    except Exception as exc:
        logger.error("Failed to initialize state for query %s: %s\n%s",
                     query_id, exc, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"State initialization error: {exc}", "query_id": query_id},
        )

    # Run the LangGraph pipeline
    try:
        final_state = await kisansat_graph.ainvoke(state)
    except Exception as exc:
        logger.error("Pipeline failed for query %s: %s\n%s",
                     query_id, exc, traceback.format_exc())
        final_state = state
        final_state["errors"] = list(state.get("errors", [])) + [str(exc)]

    # Build final report
    try:
        report = build_final_report(final_state, start_time)
    except Exception as exc:
        logger.error("Failed to build final report for query %s: %s\n%s",
                     query_id, exc, traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"detail": f"Report generation error: {exc}", "query_id": query_id},
        )

    # Notify WebSocket listeners
    await _notify_ws(query_id, {
        "type": "complete",
        "query_id": query_id,
        "duration_ms": report.total_duration_ms,
        "overall_confidence": report.overall_confidence,
    })

    logger.info(
        "Query %s completed in %.0fms (confidence=%.2f)",
        query_id,
        report.total_duration_ms or 0,
        report.overall_confidence or 0,
    )

    return QueryResponse(query_id=query_id, report=report)


@router.websocket("/ws/agent-status")
async def agent_status_ws(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time agent execution status updates."""
    await websocket.accept()
    ws_id = str(uuid.uuid4())
    _ws_connections.setdefault("global", []).append(websocket)

    logger.info("WebSocket client connected: %s", ws_id)

    try:
        await websocket.send_json({
            "type": "connected",
            "ws_id": ws_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # Keep connection alive, handle incoming messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                msg = json.loads(data)

                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif msg.get("type") == "subscribe":
                    query_id = msg.get("query_id")
                    if query_id:
                        _ws_connections.setdefault(query_id, []).append(websocket)
                        await websocket.send_json({
                            "type": "subscribed",
                            "query_id": query_id,
                        })

            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_json({"type": "ping"})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected: %s", ws_id)
    except Exception as e:
        logger.warning("WebSocket error for %s: %s", ws_id, e)
    finally:
        # Clean up connection from all subscription lists
        for key in list(_ws_connections.keys()):
            conns = _ws_connections[key]
            _ws_connections[key] = [c for c in conns if c != websocket]
            if not _ws_connections[key]:
                del _ws_connections[key]


async def _notify_ws(query_id: str, data: dict) -> None:
    """Send status update to all WebSocket clients subscribed to a query."""
    targets = _ws_connections.get(query_id, []) + _ws_connections.get("global", [])
    for ws in targets:
        try:
            await ws.send_json(data)
        except Exception:
            pass
