"""Pest & Disease Agent — ML-powered pest risk + disease detection for Pakistani farmers.

Integrates XGBoost pest risk scoring, EfficientNet-B3 crop disease detection,
rule-based pest/disease database, and FAO Locust Watch API.
"""

import logging
import time
from datetime import datetime, timezone

import httpx

from app.schemas.agent_state import AgentState
from app.schemas.common import DataSourceInfo, RiskLevel, Season
from app.schemas.pest_disease import (
    DiseaseAlert,
    LocustWatch,
    PestAlert,
    PestDiseaseOutput,
)
from ml.efficientnet import CropDiseaseModel, DiseaseInput
from ml.xgboost_pest import PestRiskInput, PestRiskModel

logger = logging.getLogger("kisansat.pest_disease")

# ---------------------------------------------------------------------------
# Pakistan pest/disease database: conditions-based rule engine
# ---------------------------------------------------------------------------

PEST_DATABASE: list[dict] = [
    {
        "pest_name": "Pink Bollworm",
        "scientific_name": "Pectinophora gossypiella",
        "crops": ["cotton"],
        "season": Season.KHARIF,
        "temp_range": (25, 35),
        "humidity_min": 60,
        "symptoms": ["Rosetted flowers", "Stained lint", "Bore holes in bolls"],
        "conditions": "High humidity with temperatures 25-35C during boll formation",
        "prevention": ["Early sowing", "Remove crop residues", "Bt cotton varieties"],
        "treatment": ["Emamectin benzoate spray", "Chlorantraniliprole"],
        "organic": ["Pheromone traps", "Trichogramma releases", "Neem oil spray"],
    },
    {
        "pest_name": "Rice Stem Borer",
        "scientific_name": "Scirpophaga incertulas",
        "crops": ["rice"],
        "season": Season.KHARIF,
        "temp_range": (25, 35),
        "humidity_min": 70,
        "symptoms": ["Dead hearts in vegetative stage", "White heads at maturity", "Bore holes in stems"],
        "conditions": "High humidity and warm temperatures during tillering",
        "prevention": ["Clip seedling tips before transplanting", "Balanced nitrogen use"],
        "treatment": ["Cartap hydrochloride", "Fipronil granules"],
        "organic": ["Trichogramma egg parasitoids", "Light traps"],
    },
    {
        "pest_name": "American Bollworm",
        "scientific_name": "Helicoverpa armigera",
        "crops": ["cotton", "chickpea", "tomato"],
        "season": Season.KHARIF,
        "temp_range": (20, 35),
        "humidity_min": 50,
        "symptoms": ["Bore holes in bolls/pods", "Frass on fruits", "Damaged squares"],
        "conditions": "Warm temperatures with moderate humidity",
        "prevention": ["Intercropping with trap crops", "Bird perches in fields"],
        "treatment": ["Spinosad", "Indoxacarb spray"],
        "organic": ["HaNPV (nuclear polyhedrosis virus)", "Neem seed kernel extract"],
    },
    {
        "pest_name": "Wheat Aphid",
        "scientific_name": "Sitobion avenae",
        "crops": ["wheat", "barley"],
        "season": Season.RABI,
        "temp_range": (10, 25),
        "humidity_min": 60,
        "symptoms": ["Yellowing leaves", "Honeydew on leaves", "Stunted growth"],
        "conditions": "Cool humid weather during heading stage",
        "prevention": ["Timely sowing", "Avoid excess nitrogen"],
        "treatment": ["Imidacloprid", "Thiamethoxam"],
        "organic": ["Ladybird beetle conservation", "Neem oil spray"],
    },
    {
        "pest_name": "Sugarcane Pyrilla",
        "scientific_name": "Pyrilla perpusilla",
        "crops": ["sugarcane"],
        "season": Season.KHARIF,
        "temp_range": (25, 38),
        "humidity_min": 60,
        "symptoms": ["Honeydew secretion", "Sooty mold on leaves", "Leaf drying"],
        "conditions": "Hot humid conditions during monsoon",
        "prevention": ["Detrash lower leaves", "Avoid waterlogging"],
        "treatment": ["Acephate spray", "Buprofezin"],
        "organic": ["Epiricania melanoleuca (parasitoid)", "Light traps"],
    },
    {
        "pest_name": "Whitefly",
        "scientific_name": "Bemisia tabaci",
        "crops": ["cotton", "okra", "tomato"],
        "season": Season.KHARIF,
        "temp_range": (25, 38),
        "humidity_min": 40,
        "symptoms": ["Leaf curling", "Yellowing", "Sooty mold", "Cotton Leaf Curl Virus transmission"],
        "conditions": "Hot dry weather, transmitted CLCuV",
        "prevention": ["Resistant varieties", "Remove alternate hosts"],
        "treatment": ["Pyriproxyfen", "Spiromesifen"],
        "organic": ["Yellow sticky traps", "Neem oil", "Encarsia formosa releases"],
    },
]

DISEASE_DATABASE: list[dict] = [
    {
        "disease_name": "Wheat Rust (Yellow/Brown)",
        "pathogen": "Puccinia striiformis / P. recondita",
        "crops": ["wheat"],
        "season": Season.RABI,
        "temp_range": (10, 20),
        "humidity_min": 80,
        "symptoms": ["Yellow/orange pustules on leaves", "Stripe patterns", "Reduced grain filling"],
        "conditions": "Cool, humid weather with dew formation",
        "prevention": ["Rust-resistant varieties", "Timely sowing", "Balanced fertilization"],
        "treatment": ["Propiconazole spray", "Tebuconazole"],
    },
    {
        "disease_name": "Rice Blast",
        "pathogen": "Magnaporthe oryzae",
        "crops": ["rice"],
        "season": Season.KHARIF,
        "temp_range": (20, 30),
        "humidity_min": 85,
        "symptoms": ["Diamond-shaped lesions on leaves", "Neck rot", "Node blast"],
        "conditions": "High humidity with moderate temperatures and prolonged leaf wetness",
        "prevention": ["Resistant varieties", "Balanced nitrogen", "Proper spacing"],
        "treatment": ["Tricyclazole", "Isoprothiolane"],
    },
    {
        "disease_name": "Cotton Leaf Curl Virus (CLCuV)",
        "pathogen": "Begomovirus (whitefly-transmitted)",
        "crops": ["cotton"],
        "season": Season.KHARIF,
        "temp_range": (25, 40),
        "humidity_min": 40,
        "symptoms": ["Upward/downward leaf curling", "Vein thickening", "Enations on veins", "Stunted growth"],
        "conditions": "Spread by whitefly, especially in hot weather",
        "prevention": ["CLCuV-tolerant varieties", "Whitefly management", "Early sowing"],
        "treatment": ["No cure — manage whitefly vector", "Remove infected plants"],
    },
    {
        "disease_name": "Sugarcane Red Rot",
        "pathogen": "Colletotrichum falcatum",
        "crops": ["sugarcane"],
        "season": Season.KHARIF,
        "temp_range": (25, 35),
        "humidity_min": 80,
        "symptoms": ["Red discoloration of internal tissue", "White patches in pith", "Withering"],
        "conditions": "Waterlogged fields with warm humid conditions",
        "prevention": ["Disease-free seed cane", "Resistant varieties", "Avoid waterlogging"],
        "treatment": ["Carbendazim sett treatment", "Remove infected clumps"],
    },
]

# Seasonal default weather for Pakistan (fallback when weather agent data missing)
SEASONAL_DEFAULTS: dict[str, dict[str, float]] = {
    "kharif": {"temperature": 35.0, "humidity": 70.0, "rainfall_mm": 8.0, "wind_speed": 5.0},
    "rabi": {"temperature": 18.0, "humidity": 55.0, "rainfall_mm": 2.0, "wind_speed": 4.0},
    "zaid": {"temperature": 38.0, "humidity": 50.0, "rainfall_mm": 1.0, "wind_speed": 6.0},
}

# Spray schedule templates by risk level
SPRAY_SCHEDULES: dict[str, list[str]] = {
    "low": [
        "No immediate spraying needed",
        "Continue routine field scouting every 7-10 days",
        "Maintain preventive neem oil spray bi-weekly",
    ],
    "moderate": [
        "Apply preventive bio-pesticide spray within 3-5 days",
        "Increase field scouting to every 3-5 days",
        "Set up monitoring traps if not already installed",
        "Prepare chemical pesticide as backup if pest population increases",
    ],
    "high": [
        "Apply recommended pesticide immediately (consult local extension office for product)",
        "Scout fields daily for pest population assessment",
        "Consider spot treatment before full-field application",
        "Schedule follow-up spray in 7-10 days",
    ],
    "critical": [
        "URGENT: Apply broad-spectrum insecticide immediately",
        "Contact district agriculture emergency helpline",
        "Coordinate with neighboring farmers for area-wide treatment",
        "Document damage for insurance/compensation claims",
        "Daily scouting until pest population declines below threshold",
    ],
}


# ---------------------------------------------------------------------------
# Rule-based evaluation (original logic)
# ---------------------------------------------------------------------------

def _evaluate_pest_risk(
    pest: dict,
    temp: float | None,
    humidity: float | None,
    crop: str | None,
    season: Season,
) -> PestAlert | None:
    """Evaluate if conditions favor a pest outbreak."""
    if crop and not any(c in crop.lower() for c in pest["crops"]):
        return None

    if pest["season"] != season and crop is None:
        return None

    risk_score = 0.0

    if temp is not None:
        t_min, t_max = pest["temp_range"]
        if t_min <= temp <= t_max:
            risk_score += 0.4
        elif abs(temp - t_min) < 5 or abs(temp - t_max) < 5:
            risk_score += 0.2

    if humidity is not None and humidity >= pest["humidity_min"]:
        risk_score += 0.3

    if pest["season"] == season:
        risk_score += 0.3

    if risk_score < 0.3:
        return None

    if risk_score >= 0.8:
        level = RiskLevel.CRITICAL
    elif risk_score >= 0.6:
        level = RiskLevel.HIGH
    elif risk_score >= 0.4:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.LOW

    return PestAlert(
        pest_name=pest["pest_name"],
        scientific_name=pest.get("scientific_name"),
        risk_level=level,
        affected_crops=pest["crops"],
        symptoms=pest["symptoms"],
        conditions_favorable=pest["conditions"],
        prevention=pest["prevention"],
        treatment=pest["treatment"],
        organic_options=pest.get("organic", []),
    )


def _evaluate_disease_risk(
    disease: dict,
    temp: float | None,
    humidity: float | None,
    crop: str | None,
    season: Season,
) -> DiseaseAlert | None:
    """Evaluate if conditions favor a disease outbreak."""
    if crop and not any(c in crop.lower() for c in disease["crops"]):
        return None

    if disease["season"] != season and crop is None:
        return None

    risk_score = 0.0

    if temp is not None:
        t_min, t_max = disease["temp_range"]
        if t_min <= temp <= t_max:
            risk_score += 0.4
        elif abs(temp - t_min) < 5 or abs(temp - t_max) < 5:
            risk_score += 0.2

    if humidity is not None and humidity >= disease["humidity_min"]:
        risk_score += 0.3

    if disease["season"] == season:
        risk_score += 0.3

    if risk_score < 0.3:
        return None

    if risk_score >= 0.8:
        level = RiskLevel.CRITICAL
    elif risk_score >= 0.6:
        level = RiskLevel.HIGH
    elif risk_score >= 0.4:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.LOW

    return DiseaseAlert(
        disease_name=disease["disease_name"],
        pathogen_type=disease.get("pathogen"),
        risk_level=level,
        affected_crops=disease["crops"],
        symptoms=disease["symptoms"],
        conditions_favorable=disease["conditions"],
        prevention=disease["prevention"],
        treatment=disease["treatment"],
    )


# ---------------------------------------------------------------------------
# ML model integration
# ---------------------------------------------------------------------------

def _run_xgboost_pest_risk(
    temp: float | None,
    humidity: float | None,
    rainfall_mm: float,
    wind_speed: float,
    season: str,
    region: str,
    crop: str,
) -> tuple[list[PestAlert], DataSourceInfo, list[str]]:
    """Run XGBoost model for ML-based pest risk scoring."""
    source = DataSourceInfo(name="XGBoost Pest Risk Model")
    warnings: list[str] = []

    pest_input = PestRiskInput(
        temperature=temp or 25.0,
        humidity=humidity or 50.0,
        rainfall_mm=rainfall_mm,
        season=season,
        region=region,
        crop_type=crop,
        wind_speed=wind_speed,
    )

    model = PestRiskModel.get_instance()
    prediction = model.safe_predict(pest_input)

    source.status = "success" if prediction.success else f"degraded: {prediction.error}"
    if prediction.warnings:
        warnings.extend(prediction.warnings)

    ml_alerts: list[PestAlert] = []
    for detail in prediction.pest_details:
        pest_name = detail.get("pest", "Unknown")
        risk_score = detail.get("risk_score", 0.0)
        if not isinstance(risk_score, float):
            risk_score = 0.0
        factors = detail.get("factors", "")

        if risk_score >= 0.75:
            level = RiskLevel.CRITICAL
        elif risk_score >= 0.55:
            level = RiskLevel.HIGH
        elif risk_score >= 0.35:
            level = RiskLevel.MODERATE
        else:
            level = RiskLevel.LOW

        ml_alerts.append(PestAlert(
            pest_name=pest_name,
            risk_level=level,
            affected_crops=[crop],
            symptoms=[f"ML model prediction (confidence: {prediction.confidence:.0%})"],
            conditions_favorable=str(factors),
            prevention=["Consult local agriculture extension office"],
            treatment=["Consult local agriculture extension office"],
        ))

    return ml_alerts, source, warnings


def _run_disease_detection(
    image_path: str,
    crop: str,
) -> tuple[DiseaseAlert | None, DataSourceInfo, list[str]]:
    """Run EfficientNet-B3 for crop disease detection from leaf image."""
    source = DataSourceInfo(name="EfficientNet-B3 Disease Detection")
    warnings: list[str] = []

    model = CropDiseaseModel.get_instance()
    prediction = model.safe_predict(DiseaseInput(image_path=image_path))

    source.status = "success" if prediction.success else f"degraded: {prediction.error}"
    if prediction.warnings:
        warnings.extend(prediction.warnings)

    if not prediction.success or prediction.is_healthy:
        return None, source, warnings

    if prediction.confidence >= 0.75:
        level = RiskLevel.HIGH
    elif prediction.confidence >= 0.5:
        level = RiskLevel.MODERATE
    else:
        level = RiskLevel.LOW

    alert = DiseaseAlert(
        disease_name=prediction.disease_name,
        pathogen_type="Identified via image analysis",
        risk_level=level,
        affected_crops=[prediction.crop_type or crop],
        symptoms=[f"Visual detection confidence: {prediction.confidence:.0%}"],
        conditions_favorable="Detected from uploaded crop leaf image",
        prevention=["Regular crop monitoring", "Maintain field hygiene"],
        treatment=[prediction.treatment_suggestion],
    )

    return alert, source, warnings


# ---------------------------------------------------------------------------
# FAO Locust Watch
# ---------------------------------------------------------------------------

async def _check_fao_locust(lat: float, lon: float) -> tuple[LocustWatch, DataSourceInfo | None]:
    """Check FAO Locust Watch for nearby swarm activity."""
    source = DataSourceInfo(
        name="FAO Locust Watch",
        url="https://locust-hub-hqfao.hub.arcgis.com",
    )
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://locust-hub-hqfao.hub.arcgis.com/api/feed/locust/v1",
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                features = data.get("features", [])

                min_dist = float("inf")
                for feat in features:
                    coords = feat.get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        dlat = abs(coords[1] - lat)
                        dlon = abs(coords[0] - lon)
                        dist_approx = ((dlat * 111) ** 2 + (dlon * 111 * 0.85) ** 2) ** 0.5
                        min_dist = min(min_dist, dist_approx)

                if min_dist < 100:
                    risk = RiskLevel.CRITICAL
                elif min_dist < 300:
                    risk = RiskLevel.HIGH
                elif min_dist < 500:
                    risk = RiskLevel.MODERATE
                else:
                    risk = RiskLevel.LOW

                source.status = "success"
                source.timestamp = datetime.now(timezone.utc).isoformat()
                return LocustWatch(
                    active_swarms=min_dist < 500,
                    nearest_swarm_km=round(min_dist, 0) if min_dist < float("inf") else None,
                    risk_level=risk,
                    last_updated=datetime.now(timezone.utc).isoformat(),
                ), source

    except Exception as e:
        logger.warning("FAO Locust Watch check failed: %s", e)
        source.status = f"error: {e}"

    return LocustWatch(), source


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_season() -> Season:
    month = datetime.now(timezone.utc).month
    if month in (6, 7, 8, 9, 10):
        return Season.KHARIF
    elif month in (11, 12, 1, 2, 3, 4):
        return Season.RABI
    else:
        return Season.ZAID


def _merge_alerts(rule_alerts: list[PestAlert], ml_alerts: list[PestAlert]) -> list[PestAlert]:
    """Merge rule-based and ML alerts, preferring rule-based for known pests."""
    seen_pests: set[str] = set()
    merged: list[PestAlert] = []

    # Rule-based alerts have richer data (symptoms, treatments, scientific names)
    for alert in rule_alerts:
        seen_pests.add(alert.pest_name.lower())
        merged.append(alert)

    # Add ML-only alerts that weren't caught by rules
    for alert in ml_alerts:
        if alert.pest_name.lower() not in seen_pests:
            merged.append(alert)

    return merged


def _compute_overall_risk(
    pest_alerts: list[PestAlert],
    disease_alerts: list[DiseaseAlert],
    locust: LocustWatch,
) -> RiskLevel:
    """Compute overall risk from all alerts."""
    all_risks = (
        [a.risk_level for a in pest_alerts]
        + [a.risk_level for a in disease_alerts]
        + [locust.risk_level]
    )
    risk_order = {RiskLevel.LOW: 0, RiskLevel.MODERATE: 1, RiskLevel.HIGH: 2, RiskLevel.CRITICAL: 3}
    return max(all_risks, key=lambda r: risk_order[r]) if all_risks else RiskLevel.LOW


# ---------------------------------------------------------------------------
# Main agent function
# ---------------------------------------------------------------------------

async def pest_disease_agent(state: AgentState) -> dict:
    """Pest & Disease agent node for LangGraph.

    Combines rule-based pest/disease database with XGBoost ML pest risk
    scoring and EfficientNet-B3 disease detection from leaf images.
    Also checks FAO Locust Watch for desert locust activity.
    """
    start = time.perf_counter()
    query = state["query"]
    lat = query.location.latitude
    lon = query.location.longitude
    season = query.season or _get_current_season()
    season_str = season.value
    crop = query.crop or "wheat"
    region = (query.location.province or "punjab").lower()
    sources: list[DataSourceInfo] = []
    warnings: list[str] = []

    logger.info("Pest/Disease agent starting for crop=%s, season=%s, region=%s", crop, season_str, region)

    # Get weather data from previous agent if available
    weather = state.get("weather_output")
    temp = weather.current_temp_c if weather else None
    humidity = weather.current_humidity_pct if weather else None

    if weather is None:
        warnings.append("Weather data unavailable -- using seasonal defaults for pest risk assessment")
        defaults = SEASONAL_DEFAULTS.get(season_str, SEASONAL_DEFAULTS["kharif"])
        temp = defaults["temperature"]
        humidity = defaults["humidity"]
        rainfall_mm = defaults["rainfall_mm"]
        wind_speed = defaults["wind_speed"]
    else:
        # Compute average rainfall/wind from forecast
        if weather.forecast_7day:
            recent = weather.forecast_7day[:3]
            rainfall_mm = sum(d.precipitation_mm for d in recent) / len(recent)
            wind_speed = sum(d.wind_speed_kmh for d in recent) / len(recent) / 3.6
        else:
            rainfall_mm = 0.0
            wind_speed = 0.0

    # 1) Rule-based pest evaluation
    rule_pest_alerts: list[PestAlert] = []
    for pest in PEST_DATABASE:
        alert = _evaluate_pest_risk(pest, temp, humidity, crop, season)
        if alert:
            rule_pest_alerts.append(alert)

    # 2) Rule-based disease evaluation
    disease_alerts: list[DiseaseAlert] = []
    for disease in DISEASE_DATABASE:
        alert = _evaluate_disease_risk(disease, temp, humidity, crop, season)
        if alert:
            disease_alerts.append(alert)

    sources.append(DataSourceInfo(
        name="KisanSat Pakistan Pest/Disease Database",
        timestamp=datetime.now(timezone.utc).isoformat(),
        status="success",
    ))

    # 3) XGBoost ML pest risk scoring
    ml_pest_alerts, ml_source, ml_warnings = _run_xgboost_pest_risk(
        temp=temp,
        humidity=humidity,
        rainfall_mm=rainfall_mm,
        wind_speed=wind_speed,
        season=season_str,
        region=region,
        crop=crop,
    )
    sources.append(ml_source)
    warnings.extend(ml_warnings)

    # Merge rule-based and ML alerts
    pest_alerts = _merge_alerts(rule_pest_alerts, ml_pest_alerts)

    # 4) EfficientNet disease detection (if image provided)
    image_path = state.get("crop_image_path")  # type: ignore[typeddict-item]
    if image_path:
        disease_alert, disease_source, disease_warnings = _run_disease_detection(
            image_path=image_path,
            crop=crop,
        )
        sources.append(disease_source)
        warnings.extend(disease_warnings)
        if disease_alert:
            disease_alerts.append(disease_alert)

    # 5) FAO Locust Watch
    locust, locust_source = await _check_fao_locust(lat, lon)
    if locust_source:
        sources.append(locust_source)
    if not locust.last_updated:
        warnings.append("FAO Locust Watch data unavailable")

    # 6) Compute overall risk and recommendations
    overall_risk = _compute_overall_risk(pest_alerts, disease_alerts, locust)
    spray_schedule = SPRAY_SCHEDULES.get(overall_risk.value, SPRAY_SCHEDULES["low"])

    # IPM recommendations
    ipm: list[str] = [
        "Monitor fields weekly for early pest detection",
        "Use pheromone traps for major lepidopteran pests",
        "Conserve natural enemies (ladybirds, spiders, parasitic wasps)",
        "Rotate crops to break pest cycles",
        "Apply pesticides only when economic threshold is crossed",
    ]

    # 7) Compute confidence
    confidence = 0.5  # base
    if temp is not None:
        confidence += 0.15
    if humidity is not None:
        confidence += 0.1
    if locust.last_updated:
        confidence += 0.1
    if ml_source.status == "success":
        confidence += 0.15  # ML model boost
    confidence = min(1.0, confidence)

    # 8) Build reasoning chain
    reasoning_parts = [f"Analyzed pest/disease risk for {crop} in {region} ({season_str} season)."]
    if temp is not None:
        reasoning_parts.append(f"Conditions: {temp:.1f}C, {humidity:.0f}% humidity.")
    reasoning_parts.append(
        f"Rule engine: {len(rule_pest_alerts)} pest alerts, {len(disease_alerts)} disease alerts."
    )
    if ml_pest_alerts:
        reasoning_parts.append(f"XGBoost ML model identified {len(ml_pest_alerts)} additional pest risks.")
    if image_path:
        reasoning_parts.append("EfficientNet-B3 disease detection applied to uploaded leaf image.")
    reasoning_parts.append(f"Locust status: {'active swarms nearby' if locust.active_swarms else 'no nearby swarms'}.")
    reasoning_parts.append(f"Overall risk: {overall_risk.value}.")

    elapsed = time.perf_counter() - start
    logger.info("Pest/Disease agent completed in %.2fs: %d pests, %d diseases, overall=%s",
                elapsed, len(pest_alerts), len(disease_alerts), overall_risk.value)

    output = PestDiseaseOutput(
        confidence=round(confidence, 4),
        reasoning=" ".join(reasoning_parts),
        warnings=warnings,
        data_sources=sources,
        pest_alerts=pest_alerts,
        disease_alerts=disease_alerts,
        locust=locust,
        overall_risk=overall_risk,
        spray_schedule=spray_schedule,
        integrated_pest_management=ipm,
    )

    return {
        "pest_disease_output": output,
        "agent_statuses": {
            **state.get("agent_statuses", {}),
            "pest_disease": {
                "status": "completed",
                "elapsed_seconds": round(elapsed, 2),
                "risk_level": overall_risk.value,
            },
        },
    }
