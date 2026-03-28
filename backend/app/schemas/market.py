"""Market agent schemas."""

from pydantic import BaseModel, Field

from app.schemas.common import AgentOutput, TrendDirection


class CommodityPrice(BaseModel):
    commodity: str
    price_pkr_per_40kg: float | None = None
    price_usd_per_ton: float | None = None
    trend: TrendDirection = TrendDirection.STABLE
    change_pct_7d: float | None = None
    change_pct_30d: float | None = None


class MandiPrice(BaseModel):
    """Local mandi (market) price reference."""
    mandi_name: str
    district: str
    commodity: str
    min_price_pkr: float
    max_price_pkr: float
    modal_price_pkr: float
    date: str


class SellTiming(BaseModel):
    recommendation: str
    optimal_window: str | None = None
    reasoning: str
    expected_price_trend: TrendDirection = TrendDirection.STABLE


class MarketOutput(AgentOutput):
    """Complete market analysis output."""
    commodity_prices: list[CommodityPrice] = Field(default_factory=list)
    local_mandi_prices: list[MandiPrice] = Field(default_factory=list)
    sell_timing: SellTiming | None = None
    input_costs: dict[str, float] = Field(default_factory=dict)
    profit_estimate_pkr_per_acre: float | None = None
