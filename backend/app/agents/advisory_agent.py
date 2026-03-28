"""Advisory Agent — Claude Sonnet 4 synthesis with EN+UR bilingual output."""

import json
import logging
from datetime import datetime, timezone

from app.schemas.advisory import ActionItem, AdvisoryOutput, RiskSummary
from app.schemas.agent_state import AgentState
from app.schemas.common import DataSourceInfo, RiskLevel
from app.core.config import settings

logger = logging.getLogger("kisansat.advisory")


def _build_synthesis_prompt(state: AgentState) -> str:
    """Build the prompt for Claude to synthesize all agent outputs."""
    query = state["query"]
    parts = [
        "You are KisanSat, an agricultural advisory AI for Pakistani farmers.",
        f"Location: lat={query.location.latitude}, lon={query.location.longitude}",
    ]
    if query.location.district:
        parts.append(f"District: {query.location.district}")
    if query.location.province:
        parts.append(f"Province: {query.location.province}")
    if query.crop:
        parts.append(f"Crop: {query.crop}")
    if query.season:
        parts.append(f"Season: {query.season.value}")
    if query.question:
        parts.append(f"Farmer's question: {query.question}")

    parts.append("\n--- AGENT DATA ---\n")

    # Weather
    weather = state.get("weather_output")
    if weather:
        parts.append("WEATHER ANALYSIS:")
        parts.append(f"  Temperature: {weather.current_temp_c}C, Humidity: {weather.current_humidity_pct}%")
        parts.append(f"  Condition: {weather.current_condition}")
        parts.append(f"  Drought risk: {weather.drought.risk_level.value}")
        parts.append(f"  Flood risk: {weather.flood_risk.risk_level.value}")
        if weather.forecast_7day:
            parts.append(f"  7-day forecast: {len(weather.forecast_7day)} days available")
        parts.append(f"  Confidence: {weather.confidence}")
        parts.append("")

    # Soil/Crop
    soil_crop = state.get("soil_crop_output")
    if soil_crop:
        parts.append("SOIL & CROP ANALYSIS:")
        if soil_crop.ndvi.current_ndvi is not None:
            parts.append(f"  NDVI: {soil_crop.ndvi.current_ndvi} ({soil_crop.ndvi.health_status})")
        if soil_crop.soil.moisture_pct is not None:
            parts.append(f"  Soil moisture: {soil_crop.soil.moisture_pct}%")
        parts.append(f"  Crop health risk: {soil_crop.crop_health_risk.value}")
        if soil_crop.recommendations:
            top3 = soil_crop.recommendations[:3]
            parts.append(f"  Top crops: {', '.join(r.crop_name for r in top3)}")
        parts.append(f"  Irrigation needed: {soil_crop.irrigation.needs_irrigation}")
        parts.append(f"  Confidence: {soil_crop.confidence}")
        parts.append("")

    # Pest/Disease
    pest = state.get("pest_disease_output")
    if pest:
        parts.append("PEST & DISEASE ANALYSIS:")
        parts.append(f"  Overall risk: {pest.overall_risk.value}")
        for alert in pest.pest_alerts[:3]:
            parts.append(f"  Pest: {alert.pest_name} ({alert.risk_level.value})")
        for alert in pest.disease_alerts[:3]:
            parts.append(f"  Disease: {alert.disease_name} ({alert.risk_level.value})")
        parts.append(f"  Locust risk: {pest.locust.risk_level.value}")
        parts.append(f"  Confidence: {pest.confidence}")
        parts.append("")

    # Market
    market = state.get("market_output")
    if market:
        parts.append("MARKET ANALYSIS:")
        for p in market.commodity_prices[:3]:
            parts.append(f"  {p.commodity}: {p.trend.value} trend")
            if p.price_pkr_per_40kg:
                parts.append(f"    PKR {p.price_pkr_per_40kg}/40kg")
        if market.sell_timing:
            parts.append(f"  Sell timing: {market.sell_timing.recommendation}")
        if market.profit_estimate_pkr_per_acre:
            parts.append(f"  Est. profit: PKR {market.profit_estimate_pkr_per_acre}/acre")
        parts.append(f"  Confidence: {market.confidence}")

    parts.append("\n--- INSTRUCTIONS ---\n")
    parts.append("Based on ALL the above data, provide a comprehensive advisory in this JSON format:")
    parts.append(json.dumps({
        "summary_en": "2-3 paragraph summary in English covering weather, crop health, pest risks, and market advice",
        "summary_ur": "Same summary in Urdu (use Urdu script)",
        "action_items": [
            {
                "priority": 1,
                "action": "Most important action in English",
                "action_ur": "Same action in Urdu",
                "timeframe": "e.g., Immediate / This week / This month",
                "category": "e.g., irrigation / pest_control / harvest / market",
                "estimated_cost_pkr": 0,
            }
        ],
        "risk_summary": [
            {
                "category": "e.g., weather / pest / disease / market",
                "level": "low/moderate/high/critical",
                "description": "Risk description in English",
                "description_ur": "Risk description in Urdu",
                "mitigation": "How to mitigate",
            }
        ],
        "seasonal_tips": ["Tip 1 relevant to current season", "Tip 2"],
    }))
    parts.append("\nProvide actionable, practical advice for a Pakistani farmer. Be specific about quantities, timing, and local practices. Output ONLY valid JSON.")

    return "\n".join(parts)


def _fallback_advisory(state: AgentState) -> AdvisoryOutput:
    """Generate a rule-based advisory when Claude API is unavailable."""
    warnings_list: list[str] = ["Advisory generated without AI synthesis — using rule-based fallback"]
    action_items: list[ActionItem] = []
    risk_summary: list[RiskSummary] = []
    priority = 1

    weather = state.get("weather_output")
    if weather:
        if weather.drought.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            action_items.append(ActionItem(
                priority=priority,
                action="Increase irrigation frequency — drought conditions detected",
                timeframe="Immediate",
                category="irrigation",
            ))
            priority += 1
        if weather.flood_risk.risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            action_items.append(ActionItem(
                priority=priority,
                action="Clear drainage channels and protect stored grain",
                timeframe="Immediate",
                category="flood_preparedness",
            ))
            priority += 1
        risk_summary.append(RiskSummary(
            category="weather",
            level=max(weather.drought.risk_level, weather.flood_risk.risk_level,
                      key=lambda r: ["low", "moderate", "high", "critical"].index(r.value)),
            description=f"Drought: {weather.drought.risk_level.value}, Flood: {weather.flood_risk.risk_level.value}",
            mitigation="Monitor weather forecasts daily",
        ))

    pest = state.get("pest_disease_output")
    if pest and pest.pest_alerts:
        top_pest = pest.pest_alerts[0]
        action_items.append(ActionItem(
            priority=priority,
            action=f"Monitor for {top_pest.pest_name}: {top_pest.symptoms[0] if top_pest.symptoms else 'check fields'}",
            timeframe="This week",
            category="pest_control",
        ))
        priority += 1

    market = state.get("market_output")
    if market and market.sell_timing:
        action_items.append(ActionItem(
            priority=priority,
            action=market.sell_timing.recommendation,
            timeframe=market.sell_timing.optimal_window or "Flexible",
            category="market",
        ))

    return AdvisoryOutput(
        confidence=0.5,
        reasoning="Rule-based advisory from agent outputs (Claude API unavailable)",
        warnings=warnings_list,
        data_sources=[DataSourceInfo(name="KisanSat Rule Engine", timestamp=datetime.now(timezone.utc).isoformat())],
        summary_en="Based on available data: monitor weather conditions, check crops for pest activity, and review market prices before selling.",
        summary_ur="دستیاب ڈیٹا کی بنیاد پر: موسمی حالات پر نظر رکھیں، فصلوں میں کیڑوں کی سرگرمی چیک کریں، اور فروخت سے پہلے بازار کی قیمتوں کا جائزہ لیں۔",
        action_items=action_items,
        risk_summary=risk_summary,
    )


async def advisory_agent(state: AgentState) -> dict:
    """Advisory agent node — synthesizes all agent outputs using Claude."""
    logger.info("Advisory agent starting synthesis")

    if not settings.anthropic_api_key:
        logger.warning("Anthropic API key not set — using fallback advisory")
        return {"advisory_output": _fallback_advisory(state)}

    try:
        from langchain_anthropic import ChatAnthropic

        llm = ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=settings.anthropic_api_key,
            max_tokens=4096,
            temperature=0.3,
        )

        prompt = _build_synthesis_prompt(state)
        logger.info("Sending synthesis prompt to Claude (%d chars)", len(prompt))

        response = await llm.ainvoke(prompt)
        content = response.content

        # Parse JSON response
        # Handle potential markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        data = json.loads(content.strip())

        action_items = [
            ActionItem(
                priority=item.get("priority", i + 1),
                action=item["action"],
                action_ur=item.get("action_ur"),
                timeframe=item.get("timeframe", "This week"),
                category=item.get("category", "general"),
                estimated_cost_pkr=item.get("estimated_cost_pkr"),
            )
            for i, item in enumerate(data.get("action_items", []))
        ]

        risk_levels_map = {"low": RiskLevel.LOW, "moderate": RiskLevel.MODERATE,
                           "high": RiskLevel.HIGH, "critical": RiskLevel.CRITICAL}
        risk_summary = [
            RiskSummary(
                category=r["category"],
                level=risk_levels_map.get(r.get("level", "low"), RiskLevel.LOW),
                description=r["description"],
                description_ur=r.get("description_ur"),
                mitigation=r.get("mitigation", ""),
            )
            for r in data.get("risk_summary", [])
        ]

        output = AdvisoryOutput(
            confidence=0.85,
            reasoning="AI-synthesized advisory combining weather, soil/crop, pest/disease, and market data",
            data_sources=[
                DataSourceInfo(
                    name="Claude Sonnet 4 (Anthropic)",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
            ],
            summary_en=data.get("summary_en", ""),
            summary_ur=data.get("summary_ur", ""),
            action_items=action_items,
            risk_summary=risk_summary,
            seasonal_tips=data.get("seasonal_tips", []),
        )

        logger.info("Advisory agent completed: %d action items, %d risks",
                     len(action_items), len(risk_summary))
        return {"advisory_output": output}

    except json.JSONDecodeError as e:
        logger.error("Failed to parse Claude response as JSON: %s", e)
        fallback = _fallback_advisory(state)
        fallback.warnings.append(f"AI response parsing failed: {e}")
        return {"advisory_output": fallback}

    except Exception as e:
        logger.error("Advisory agent failed: %s", e)
        fallback = _fallback_advisory(state)
        fallback.warnings.append(f"AI synthesis failed: {e}")
        return {"advisory_output": fallback}
