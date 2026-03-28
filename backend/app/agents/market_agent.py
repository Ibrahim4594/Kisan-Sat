"""Market Agent — API Ninjas commodities + Pakistan reference prices + sell timing."""

import logging
from datetime import datetime, timezone

import httpx

from app.schemas.agent_state import AgentState
from app.schemas.common import DataSourceInfo, TrendDirection
from app.schemas.market import (
    CommodityPrice,
    MandiPrice,
    MarketOutput,
    SellTiming,
)
from app.core.config import settings

logger = logging.getLogger("kisansat.market")

API_NINJAS_BASE = "https://api.api-ninjas.com/v1/commodityprice"

# Pakistan reference prices (PKR per 40kg maund) — updated periodically
# These serve as fallback when API is unavailable
PAKISTAN_REFERENCE_PRICES: dict[str, dict] = {
    "wheat": {
        "min_pkr": 3900,
        "max_pkr": 4200,
        "modal_pkr": 4000,
        "usd_per_ton": 350,
        "major_mandis": ["Lahore", "Faisalabad", "Multan", "Hyderabad"],
    },
    "rice": {
        "min_pkr": 6500,
        "max_pkr": 9500,
        "modal_pkr": 8000,
        "usd_per_ton": 550,
        "major_mandis": ["Lahore", "Gujranwala", "Larkana", "Sukkur"],
    },
    "cotton": {
        "min_pkr": 8000,
        "max_pkr": 10000,
        "modal_pkr": 9000,
        "usd_per_ton": 1800,
        "major_mandis": ["Multan", "Rahim Yar Khan", "Nawabshah", "Sanghar"],
    },
    "sugarcane": {
        "min_pkr": 400,
        "max_pkr": 500,
        "modal_pkr": 450,
        "usd_per_ton": 45,
        "major_mandis": ["Faisalabad", "Mardan", "Dera Ismail Khan"],
    },
    "maize": {
        "min_pkr": 3200,
        "max_pkr": 3800,
        "modal_pkr": 3500,
        "usd_per_ton": 280,
        "major_mandis": ["Sahiwal", "Okara", "Peshawar"],
    },
    "chickpea": {
        "min_pkr": 8000,
        "max_pkr": 12000,
        "modal_pkr": 10000,
        "usd_per_ton": 800,
        "major_mandis": ["Lahore", "Rawalpindi", "Quetta"],
    },
    "lentil": {
        "min_pkr": 10000,
        "max_pkr": 14000,
        "modal_pkr": 12000,
        "usd_per_ton": 900,
        "major_mandis": ["Lahore", "Faisalabad", "Quetta"],
    },
    "onion": {
        "min_pkr": 2000,
        "max_pkr": 4000,
        "modal_pkr": 2800,
        "usd_per_ton": 250,
        "major_mandis": ["Lahore", "Karachi", "Quetta", "Peshawar"],
    },
}

# Crop name mapping to API Ninjas commodity names
CROP_TO_COMMODITY: dict[str, str] = {
    "wheat": "wheat",
    "rice": "rice",
    "cotton": "cotton",
    "maize": "corn",
    "sugarcane": "sugar",
    "chickpea": "chickpeas",
    "lentil": "lentils",
}

# Input cost estimates (PKR per acre)
INPUT_COSTS: dict[str, dict[str, float]] = {
    "wheat": {"seed": 3000, "fertilizer": 8000, "pesticide": 2000, "irrigation": 5000, "labor": 6000},
    "rice": {"seed": 2500, "fertilizer": 10000, "pesticide": 4000, "irrigation": 8000, "labor": 10000},
    "cotton": {"seed": 3500, "fertilizer": 9000, "pesticide": 8000, "irrigation": 6000, "labor": 8000},
    "sugarcane": {"seed": 12000, "fertilizer": 12000, "pesticide": 3000, "irrigation": 10000, "labor": 15000},
    "maize": {"seed": 4000, "fertilizer": 7000, "pesticide": 2000, "irrigation": 4000, "labor": 5000},
}


async def _fetch_commodity_price(
    commodity: str, client: httpx.AsyncClient
) -> dict | None:
    """Fetch live commodity price from API Ninjas."""
    if not settings.api_ninjas_api_key:
        return None

    try:
        resp = await client.get(
            API_NINJAS_BASE,
            params={"name": commodity},
            headers={"X-Api-Key": settings.api_ninjas_api_key},
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return data[0] if isinstance(data, list) else data
    except Exception as e:
        logger.warning("API Ninjas fetch for %s failed: %s", commodity, e)

    return None


def _determine_trend(price_data: dict | None) -> TrendDirection:
    """Determine price trend from API data."""
    if not price_data:
        return TrendDirection.STABLE

    change = price_data.get("change_percent", 0)
    if isinstance(change, str):
        try:
            change = float(change)
        except ValueError:
            return TrendDirection.STABLE

    if change > 3:
        return TrendDirection.RISING
    elif change < -3:
        return TrendDirection.FALLING
    elif abs(change) > 1:
        return TrendDirection.VOLATILE
    return TrendDirection.STABLE


def _generate_sell_timing(
    crop: str, trend: TrendDirection, month: int
) -> SellTiming:
    """Generate sell timing recommendation based on market trends and seasonality."""
    # Pakistan harvest seasons
    harvest_peaks = {
        "wheat": (4, 5),       # April-May
        "rice": (10, 11),      # October-November
        "cotton": (9, 11),     # September-November
        "sugarcane": (11, 3),  # November-March
        "maize": (9, 10),      # September-October
    }

    crop_lower = crop.lower()
    peak = harvest_peaks.get(crop_lower)

    if trend == TrendDirection.RISING:
        return SellTiming(
            recommendation="Hold and sell in 2-3 weeks — prices are trending upward",
            optimal_window="2-3 weeks from now",
            reasoning=f"Market prices for {crop} are rising. Holding stock may yield better returns.",
            expected_price_trend=TrendDirection.RISING,
        )
    elif trend == TrendDirection.FALLING:
        return SellTiming(
            recommendation="Sell now — prices are declining",
            optimal_window="Immediate",
            reasoning=f"Market prices for {crop} are falling. Selling sooner reduces losses.",
            expected_price_trend=TrendDirection.FALLING,
        )
    elif peak and month in range(peak[0], peak[1] + 1 if peak[1] >= peak[0] else 13):
        return SellTiming(
            recommendation="Peak harvest season — prices may be lower due to high supply",
            optimal_window="Consider storage if possible, sell in 1-2 months",
            reasoning=f"Harvest glut typically depresses {crop} prices. Storage could yield 10-20% better returns.",
            expected_price_trend=TrendDirection.STABLE,
        )
    else:
        return SellTiming(
            recommendation="Stable market — sell based on your cash flow needs",
            optimal_window="Flexible",
            reasoning=f"No strong price signals for {crop}. Market is stable.",
            expected_price_trend=TrendDirection.STABLE,
        )


async def market_agent(state: AgentState) -> dict:
    """Market agent node for LangGraph."""
    query = state["query"]
    crop = query.crop or "wheat"
    district = query.location.district or "unknown"
    sources: list[DataSourceInfo] = []
    warnings: list[str] = []

    logger.info("Market agent starting for crop=%s, district=%s", crop, district)

    crop_lower = crop.lower()
    commodity_name = CROP_TO_COMMODITY.get(crop_lower, crop_lower)

    # Fetch live commodity price
    live_price: dict | None = None
    async with httpx.AsyncClient() as client:
        live_price = await _fetch_commodity_price(commodity_name, client)

    commodity_prices: list[CommodityPrice] = []
    trend = TrendDirection.STABLE

    if live_price:
        price_usd = live_price.get("price")
        change_pct = live_price.get("change_percent")
        trend = _determine_trend(live_price)

        commodity_prices.append(CommodityPrice(
            commodity=crop,
            price_usd_per_ton=float(price_usd) if price_usd else None,
            trend=trend,
            change_pct_7d=float(change_pct) if change_pct else None,
        ))
        sources.append(DataSourceInfo(
            name="API Ninjas Commodities",
            url="https://api-ninjas.com",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))
        logger.info("Live commodity price fetched: %s", live_price)
    else:
        warnings.append("Live commodity prices unavailable — using reference prices")

    # Pakistan reference mandi prices
    mandi_prices: list[MandiPrice] = []
    ref = PAKISTAN_REFERENCE_PRICES.get(crop_lower)
    if ref:
        for mandi_name in ref["major_mandis"]:
            mandi_prices.append(MandiPrice(
                mandi_name=f"{mandi_name} Mandi",
                district=mandi_name,
                commodity=crop,
                min_price_pkr=ref["min_pkr"],
                max_price_pkr=ref["max_pkr"],
                modal_price_pkr=ref["modal_pkr"],
                date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            ))

        # Add USD reference if no live price
        if not commodity_prices:
            commodity_prices.append(CommodityPrice(
                commodity=crop,
                price_pkr_per_40kg=ref["modal_pkr"],
                price_usd_per_ton=ref["usd_per_ton"],
                trend=trend,
            ))

        sources.append(DataSourceInfo(
            name="KisanSat Pakistan Price Database",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ))

    # Sell timing
    month = datetime.now(timezone.utc).month
    sell_timing = _generate_sell_timing(crop, trend, month)

    # Input costs and profit estimate
    costs = INPUT_COSTS.get(crop_lower, {})
    total_cost = sum(costs.values()) if costs else 0
    profit_estimate = None
    if ref and total_cost:
        # Rough estimate: yield * price - costs
        yield_kg = {"wheat": 100, "rice": 72, "cotton": 32, "sugarcane": 1000, "maize": 80}.get(crop_lower, 80)
        revenue = yield_kg * ref["modal_pkr"] / 40  # per acre
        profit_estimate = round(revenue - total_cost)

    confidence = 0.5  # base
    if live_price:
        confidence += 0.3
    if ref:
        confidence += 0.2
    confidence = min(1.0, confidence)

    logger.info("Market agent completed: trend=%s, confidence=%.2f", trend.value, confidence)

    output = MarketOutput(
        confidence=confidence,
        reasoning=f"Market analysis for {crop}: {'live API data + ' if live_price else ''}Pakistan reference prices, {trend.value} trend",
        warnings=warnings,
        data_sources=sources,
        commodity_prices=commodity_prices,
        local_mandi_prices=mandi_prices,
        sell_timing=sell_timing,
        input_costs=costs,
        profit_estimate_pkr_per_acre=profit_estimate,
    )

    return {"market_output": output}
