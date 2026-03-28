"""Soil & Crop Agent — Agromonitoring NDVI/soil + Pakistan crop recommendations."""

import logging
from datetime import datetime, timezone

import httpx

from app.schemas.agent_state import AgentState
from app.schemas.common import DataSourceInfo, RiskLevel, Season
from app.schemas.soil_crop import (
    CropRecommendation,
    IrrigationAdvice,
    NDVIData,
    SoilCropOutput,
    SoilData,
)
from app.core.config import settings

logger = logging.getLogger("kisansat.soil_crop")

AGRO_BASE = "https://api.agromonitoring.com/agro/1.0"

# Pakistan crop database by season
PAKISTAN_CROPS: dict[Season, list[dict]] = {
    Season.KHARIF: [
        {"name": "Rice (Basmati)", "water_mm": 1200, "yield_kg": 1800, "temp_min": 20, "temp_max": 38},
        {"name": "Cotton", "water_mm": 700, "yield_kg": 800, "temp_min": 21, "temp_max": 37},
        {"name": "Sugarcane", "water_mm": 1500, "yield_kg": 25000, "temp_min": 20, "temp_max": 40},
        {"name": "Maize", "water_mm": 500, "yield_kg": 2000, "temp_min": 18, "temp_max": 35},
        {"name": "Mung Bean", "water_mm": 350, "yield_kg": 600, "temp_min": 20, "temp_max": 40},
    ],
    Season.RABI: [
        {"name": "Wheat", "water_mm": 450, "yield_kg": 2500, "temp_min": 5, "temp_max": 25},
        {"name": "Chickpea (Gram)", "water_mm": 300, "yield_kg": 800, "temp_min": 5, "temp_max": 30},
        {"name": "Lentil (Masoor)", "water_mm": 250, "yield_kg": 600, "temp_min": 5, "temp_max": 25},
        {"name": "Barley", "water_mm": 350, "yield_kg": 1800, "temp_min": 3, "temp_max": 25},
        {"name": "Mustard/Rapeseed", "water_mm": 300, "yield_kg": 700, "temp_min": 5, "temp_max": 28},
    ],
    Season.ZAID: [
        {"name": "Watermelon", "water_mm": 400, "yield_kg": 12000, "temp_min": 22, "temp_max": 38},
        {"name": "Muskmelon", "water_mm": 350, "yield_kg": 8000, "temp_min": 22, "temp_max": 38},
        {"name": "Cucumber", "water_mm": 300, "yield_kg": 6000, "temp_min": 18, "temp_max": 35},
        {"name": "Okra (Bhindi)", "water_mm": 400, "yield_kg": 5000, "temp_min": 20, "temp_max": 40},
    ],
}


async def _fetch_ndvi(
    lat: float, lon: float, client: httpx.AsyncClient
) -> NDVIData:
    """Fetch NDVI from Agromonitoring satellite imagery."""
    if not settings.agromonitoring_api_key:
        return NDVIData()

    # Create a small polygon around the point (approx 1km)
    delta = 0.005
    polygon = [
        [lon - delta, lat - delta],
        [lon + delta, lat - delta],
        [lon + delta, lat + delta],
        [lon - delta, lat + delta],
        [lon - delta, lat - delta],
    ]

    try:
        # Create polygon first
        create_resp = await client.post(
            f"{AGRO_BASE}/polygons",
            params={"appid": settings.agromonitoring_api_key},
            json={
                "name": f"kisansat_{lat}_{lon}",
                "geo_json": {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {"type": "Polygon", "coordinates": [polygon]},
                },
            },
            timeout=15,
        )

        if create_resp.status_code == 201:
            poly_id = create_resp.json().get("id")
        else:
            # Try to get existing polygons
            list_resp = await client.get(
                f"{AGRO_BASE}/polygons",
                params={"appid": settings.agromonitoring_api_key},
                timeout=10,
            )
            polys = list_resp.json()
            poly_id = polys[0]["id"] if polys else None

        if not poly_id:
            return NDVIData()

        # Fetch satellite imagery stats
        stats_resp = await client.get(
            f"{AGRO_BASE}/ndvi",
            params={
                "polyid": poly_id,
                "appid": settings.agromonitoring_api_key,
            },
            timeout=15,
        )

        if stats_resp.status_code == 200:
            data = stats_resp.json()
            if data:
                latest = data[-1] if isinstance(data, list) else data
                ndvi_val = latest.get("data", {}).get("mean", latest.get("mean"))

                if ndvi_val is not None:
                    if ndvi_val > 0.6:
                        health = "healthy"
                    elif ndvi_val > 0.4:
                        health = "moderate"
                    elif ndvi_val > 0.2:
                        health = "stressed"
                    else:
                        health = "poor/bare"

                    return NDVIData(
                        current_ndvi=round(ndvi_val, 3),
                        health_status=health,
                        measurement_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    )
    except Exception as e:
        logger.warning("NDVI fetch failed: %s", e)

    return NDVIData()


async def _fetch_soil(
    lat: float, lon: float, client: httpx.AsyncClient
) -> SoilData:
    """Fetch soil data from Agromonitoring."""
    if not settings.agromonitoring_api_key:
        return SoilData()

    try:
        resp = await client.get(
            f"{AGRO_BASE}/soil",
            params={
                "lat": lat,
                "lon": lon,
                "appid": settings.agromonitoring_api_key,
            },
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            moisture = data.get("moisture")
            temp = data.get("t0")
            temp_c = round(temp - 273.15, 1) if temp else None
            return SoilData(
                moisture_pct=round(moisture * 100, 1) if moisture else None,
                temperature_c=temp_c,
            )
    except Exception as e:
        logger.warning("Soil data fetch failed: %s", e)

    return SoilData()


def _get_current_season() -> Season:
    """Determine current agricultural season in Pakistan."""
    month = datetime.now(timezone.utc).month
    if month in (6, 7, 8, 9, 10):
        return Season.KHARIF
    elif month in (11, 12, 1, 2, 3, 4):
        return Season.RABI
    else:
        return Season.ZAID


def _recommend_crops(
    season: Season,
    ndvi: NDVIData,
    soil: SoilData,
    current_crop: str | None,
) -> list[CropRecommendation]:
    """Generate crop recommendations based on season, soil, and NDVI."""
    crops = PAKISTAN_CROPS.get(season, PAKISTAN_CROPS[Season.RABI])
    recommendations: list[CropRecommendation] = []

    for crop_info in crops:
        score = 0.7  # base suitability

        # Adjust by soil moisture
        if soil.moisture_pct is not None:
            if crop_info["water_mm"] > 800 and soil.moisture_pct > 30:
                score += 0.1
            elif crop_info["water_mm"] < 400 and soil.moisture_pct < 20:
                score += 0.1

        # Adjust by soil temperature
        if soil.temperature_c is not None:
            if crop_info["temp_min"] <= soil.temperature_c <= crop_info["temp_max"]:
                score += 0.1
            else:
                score -= 0.2

        # Boost if matches current crop
        if current_crop and current_crop.lower() in crop_info["name"].lower():
            score += 0.1

        score = max(0.1, min(1.0, score))

        recommendations.append(CropRecommendation(
            crop_name=crop_info["name"],
            suitability_score=round(score, 2),
            reason=f"Suitable for {season.value} season in Pakistan",
            expected_yield_kg_per_acre=crop_info["yield_kg"],
            water_requirement_mm=crop_info["water_mm"],
            season_match=True,
        ))

    recommendations.sort(key=lambda x: x.suitability_score, reverse=True)
    return recommendations[:5]


def _irrigation_advice(soil: SoilData, ndvi: NDVIData) -> IrrigationAdvice:
    """Generate irrigation advice based on soil moisture and crop health."""
    if soil.moisture_pct is None:
        return IrrigationAdvice()

    needs = soil.moisture_pct < 25
    if needs:
        return IrrigationAdvice(
            needs_irrigation=True,
            recommended_mm=30 if soil.moisture_pct < 15 else 20,
            frequency_days=3 if soil.moisture_pct < 15 else 5,
            method="drip irrigation recommended for water conservation",
        )
    return IrrigationAdvice(needs_irrigation=False)


async def soil_crop_agent(state: AgentState) -> dict:
    """Soil & Crop agent node for LangGraph."""
    query = state["query"]
    lat = query.location.latitude
    lon = query.location.longitude
    season = query.season or _get_current_season()
    sources: list[DataSourceInfo] = []
    warnings: list[str] = []

    logger.info("Soil/Crop agent starting for lat=%.4f, lon=%.4f, season=%s", lat, lon, season.value)

    async with httpx.AsyncClient() as client:
        ndvi = await _fetch_ndvi(lat, lon, client)
        soil = await _fetch_soil(lat, lon, client)

    if ndvi.current_ndvi is not None:
        sources.append(DataSourceInfo(
            name="Agromonitoring NDVI",
            url="https://agromonitoring.com",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))
    else:
        warnings.append("NDVI data unavailable — using defaults")

    if soil.moisture_pct is not None:
        sources.append(DataSourceInfo(
            name="Agromonitoring Soil",
            url="https://agromonitoring.com",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))
    else:
        warnings.append("Soil data unavailable — using defaults")

    recommendations = _recommend_crops(season, ndvi, soil, query.crop)
    irrigation = _irrigation_advice(soil, ndvi)

    # Crop health risk from NDVI
    if ndvi.current_ndvi is not None:
        if ndvi.current_ndvi < 0.2:
            crop_health_risk = RiskLevel.CRITICAL
        elif ndvi.current_ndvi < 0.4:
            crop_health_risk = RiskLevel.HIGH
        elif ndvi.current_ndvi < 0.6:
            crop_health_risk = RiskLevel.MODERATE
        else:
            crop_health_risk = RiskLevel.LOW
    else:
        crop_health_risk = RiskLevel.MODERATE

    confidence = 0.0
    if ndvi.current_ndvi is not None:
        confidence += 0.5
    if soil.moisture_pct is not None:
        confidence += 0.3
    confidence += 0.2  # crop DB is always available

    reasoning_parts = []
    if ndvi.current_ndvi is not None:
        reasoning_parts.append(f"NDVI={ndvi.current_ndvi:.3f} ({ndvi.health_status})")
    if soil.moisture_pct is not None:
        reasoning_parts.append(f"soil moisture={soil.moisture_pct:.1f}%")
    reasoning_parts.append(f"{season.value} season crop database for Pakistan")

    logger.info("Soil/Crop agent completed with confidence=%.2f", confidence)

    output = SoilCropOutput(
        confidence=confidence,
        reasoning="Soil/crop analysis based on: " + ", ".join(reasoning_parts),
        warnings=warnings,
        data_sources=sources,
        ndvi=ndvi,
        soil=soil,
        crop_health_risk=crop_health_risk,
        recommendations=recommendations,
        irrigation=irrigation,
    )

    return {"soil_crop_output": output}
