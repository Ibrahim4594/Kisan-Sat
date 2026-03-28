"""Weather Agent — NASA POWER + OpenWeatherMap parallel fetch with drought/flood scoring."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from app.schemas.agent_state import AgentState
from app.schemas.common import DataSourceInfo
from app.schemas.weather import (
    DailyForecast,
    DroughtIndicator,
    FloodRisk,
    HistoricalComparison,
    WeatherOutput,
)
from app.core.config import settings

logger = logging.getLogger("kisansat.weather")

NASA_POWER_BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
OWM_BASE = "https://api.openweathermap.org/data/2.5"


async def _fetch_nasa_power(
    lat: float, lon: float, client: httpx.AsyncClient
) -> dict:
    """Fetch historical climate data from NASA POWER (free, no key required)."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)
    params = {
        "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M",
        "community": "AG",
        "longitude": lon,
        "latitude": lat,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    resp = await client.get(NASA_POWER_BASE, params=params, timeout=20)
    resp.raise_for_status()
    return resp.json()


async def _fetch_owm_current(
    lat: float, lon: float, client: httpx.AsyncClient
) -> dict:
    """Fetch current weather from OpenWeatherMap."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweathermap_api_key,
        "units": "metric",
    }
    resp = await client.get(f"{OWM_BASE}/weather", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


async def _fetch_owm_forecast(
    lat: float, lon: float, client: httpx.AsyncClient
) -> dict:
    """Fetch 5-day / 3-hour forecast from OpenWeatherMap."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweathermap_api_key,
        "units": "metric",
    }
    resp = await client.get(f"{OWM_BASE}/forecast", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _compute_drought_score(nasa_data: dict) -> DroughtIndicator:
    """Compute drought indicators from NASA POWER precipitation data."""
    try:
        precip = nasa_data.get("properties", {}).get("parameter", {}).get("PRECTOTCORR", {})
        values = [v for v in precip.values() if isinstance(v, (int, float)) and v >= 0]
        if not values:
            return DroughtIndicator()

        total_rain = sum(values)
        dry_days = sum(1 for v in values if v < 1.0)
        avg_daily = total_rain / len(values) if values else 0

        from app.schemas.common import RiskLevel

        if avg_daily < 1.0 and dry_days > 20:
            risk = RiskLevel.CRITICAL
        elif avg_daily < 2.0 and dry_days > 15:
            risk = RiskLevel.HIGH
        elif avg_daily < 3.0 and dry_days > 10:
            risk = RiskLevel.MODERATE
        else:
            risk = RiskLevel.LOW

        return DroughtIndicator(
            days_without_rain=dry_days,
            soil_moisture_deficit=avg_daily < 2.0,
            risk_level=risk,
        )
    except Exception as e:
        logger.warning("Drought score computation failed: %s", e)
        return DroughtIndicator()


def _compute_flood_risk(nasa_data: dict, forecast_data: dict | None) -> FloodRisk:
    """Compute flood risk from cumulative rainfall."""
    from app.schemas.common import RiskLevel

    try:
        precip = nasa_data.get("properties", {}).get("parameter", {}).get("PRECTOTCORR", {})
        values = [v for v in precip.values() if isinstance(v, (int, float)) and v >= 0]
        cumulative_7d = sum(sorted(values, reverse=True)[:7]) if values else 0

        # Also check forecast for heavy rain
        forecast_rain = 0.0
        if forecast_data:
            for entry in forecast_data.get("list", [])[:8]:  # next 24h
                rain = entry.get("rain", {}).get("3h", 0)
                forecast_rain += rain

        total_risk_rain = cumulative_7d + forecast_rain

        if total_risk_rain > 150:
            risk = RiskLevel.CRITICAL
            advisory = "Severe flood risk. Protect crops and livestock immediately."
        elif total_risk_rain > 100:
            risk = RiskLevel.HIGH
            advisory = "High flood risk. Ensure drainage systems are clear."
        elif total_risk_rain > 60:
            risk = RiskLevel.MODERATE
            advisory = "Moderate flood risk. Monitor water levels."
        else:
            risk = RiskLevel.LOW
            advisory = "Flood risk is low."

        return FloodRisk(
            cumulative_rainfall_mm=round(cumulative_7d, 1),
            risk_level=risk,
            advisory=advisory,
        )
    except Exception as e:
        logger.warning("Flood risk computation failed: %s", e)
        return FloodRisk()


def _parse_owm_forecast(forecast_data: dict) -> list[DailyForecast]:
    """Aggregate 3-hour OWM forecast into daily summaries."""
    daily: dict[str, list[dict]] = {}
    for entry in forecast_data.get("list", []):
        date_str = entry["dt_txt"].split(" ")[0]
        daily.setdefault(date_str, []).append(entry)

    result: list[DailyForecast] = []
    for date_str, entries in list(daily.items())[:7]:
        temps = [e["main"]["temp"] for e in entries]
        humidities = [e["main"]["humidity"] for e in entries]
        precips = [e.get("rain", {}).get("3h", 0) for e in entries]
        winds = [e["wind"]["speed"] * 3.6 for e in entries]  # m/s -> km/h
        conditions = [e["weather"][0]["description"] for e in entries]

        result.append(DailyForecast(
            date=date_str,
            temp_min_c=round(min(temps), 1),
            temp_max_c=round(max(temps), 1),
            humidity_pct=round(sum(humidities) / len(humidities), 1),
            precipitation_mm=round(sum(precips), 1),
            wind_speed_kmh=round(sum(winds) / len(winds), 1),
            condition=max(set(conditions), key=conditions.count),
        ))
    return result


def _compute_historical_comparison(nasa_data: dict) -> HistoricalComparison:
    """Compare recent 30-day data against long-term norms for Pakistan."""
    try:
        params = nasa_data.get("properties", {}).get("parameter", {})
        temps = params.get("T2M", {})
        precip = params.get("PRECTOTCORR", {})

        temp_vals = [v for v in temps.values() if isinstance(v, (int, float))]
        precip_vals = [v for v in precip.values() if isinstance(v, (int, float)) and v >= 0]

        avg_temp = sum(temp_vals) / len(temp_vals) if temp_vals else 25.0
        avg_precip = sum(precip_vals) / len(precip_vals) if precip_vals else 3.0

        # Pakistan long-term averages (approximate)
        norm_temp = 25.0
        norm_precip = 3.0

        temp_dev = round(avg_temp - norm_temp, 1)
        precip_dev = round(avg_precip - norm_precip, 1)

        from app.schemas.common import TrendDirection

        if abs(temp_dev) < 1.0:
            trend = TrendDirection.STABLE
        elif temp_dev > 0:
            trend = TrendDirection.RISING
        else:
            trend = TrendDirection.FALLING

        return HistoricalComparison(
            avg_temp_deviation_c=temp_dev,
            avg_rainfall_deviation_mm=precip_dev,
            trend=trend,
        )
    except Exception as e:
        logger.warning("Historical comparison failed: %s", e)
        return HistoricalComparison()


async def weather_agent(state: AgentState) -> dict:
    """Weather agent node for LangGraph. Fetches parallel data and computes risk scores."""
    query = state["query"]
    lat = query.location.latitude
    lon = query.location.longitude
    sources: list[DataSourceInfo] = []
    warnings: list[str] = []

    logger.info("Weather agent starting for lat=%.4f, lon=%.4f", lat, lon)

    nasa_data: dict = {}
    owm_current: dict = {}
    owm_forecast: dict = {}

    async with httpx.AsyncClient() as client:
        # Parallel fetch: NASA POWER + OWM current + OWM forecast
        tasks = [
            _fetch_nasa_power(lat, lon, client),
            _fetch_owm_current(lat, lon, client) if settings.openweathermap_api_key else asyncio.sleep(0),
            _fetch_owm_forecast(lat, lon, client) if settings.openweathermap_api_key else asyncio.sleep(0),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # NASA POWER result
        if isinstance(results[0], dict):
            nasa_data = results[0]
            sources.append(DataSourceInfo(
                name="NASA POWER",
                url="https://power.larc.nasa.gov",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))
            logger.info("NASA POWER data fetched successfully")
        else:
            warnings.append(f"NASA POWER unavailable: {results[0]}")
            logger.warning("NASA POWER fetch failed: %s", results[0])

        # OWM current result
        if isinstance(results[1], dict):
            owm_current = results[1]
            sources.append(DataSourceInfo(
                name="OpenWeatherMap",
                url="https://openweathermap.org",
                timestamp=datetime.now(timezone.utc).isoformat(),
            ))
            logger.info("OpenWeatherMap current data fetched")
        elif settings.openweathermap_api_key:
            warnings.append(f"OpenWeatherMap current unavailable: {results[1]}")
            logger.warning("OWM current fetch failed: %s", results[1])
        else:
            warnings.append("OpenWeatherMap API key not configured")

        # OWM forecast result
        if isinstance(results[2], dict):
            owm_forecast = results[2]
            logger.info("OpenWeatherMap forecast data fetched")
        elif settings.openweathermap_api_key:
            warnings.append(f"OpenWeatherMap forecast unavailable: {results[2]}")

    # Build output with graceful degradation
    current_temp = None
    current_humidity = None
    current_condition = None
    if owm_current:
        current_temp = owm_current.get("main", {}).get("temp")
        current_humidity = owm_current.get("main", {}).get("humidity")
        weather_desc = owm_current.get("weather", [{}])
        current_condition = weather_desc[0].get("description") if weather_desc else None

    forecast_7day = _parse_owm_forecast(owm_forecast) if owm_forecast else []
    drought = _compute_drought_score(nasa_data) if nasa_data else DroughtIndicator()
    flood_risk = _compute_flood_risk(nasa_data, owm_forecast) if nasa_data else FloodRisk()
    historical = _compute_historical_comparison(nasa_data) if nasa_data else HistoricalComparison()

    # Confidence based on data availability
    confidence = 0.0
    if nasa_data:
        confidence += 0.5
    if owm_current:
        confidence += 0.3
    if owm_forecast:
        confidence += 0.2

    reasoning_parts = []
    if nasa_data:
        reasoning_parts.append("30-day historical analysis from NASA POWER")
    if owm_current:
        reasoning_parts.append("real-time conditions from OpenWeatherMap")
    if owm_forecast:
        reasoning_parts.append("5-day forecast from OpenWeatherMap")
    reasoning = "Weather analysis based on: " + ", ".join(reasoning_parts) if reasoning_parts else "No weather data sources available"

    logger.info("Weather agent completed with confidence=%.2f", confidence)

    output = WeatherOutput(
        confidence=confidence,
        reasoning=reasoning,
        warnings=warnings,
        data_sources=sources,
        current_temp_c=current_temp,
        current_humidity_pct=current_humidity,
        current_condition=current_condition,
        forecast_7day=forecast_7day,
        drought=drought,
        flood_risk=flood_risk,
        historical=historical,
    )

    return {"weather_output": output}
