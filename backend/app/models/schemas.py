from typing import Dict, List, Optional
from pydantic import BaseModel

# --- New Macro Data Schemas ---
class MacroDataPoint(BaseModel):
    name: str          # e.g., "CPI", "Fed Rate", "Unemployment"
    value: Optional[str] = None # The latest value (as string, might include %)
    date: Optional[str] = None  # The date for the latest value (YYYY-MM-DD)
    error: Optional[str] = None # Error message if fetching failed

class MacroData(BaseModel):
    cpi: MacroDataPoint
    fed_rate: MacroDataPoint
    unemployment: MacroDataPoint
    # New commodity fields
    wti_oil: Optional[MacroDataPoint] = None
    brent_oil: Optional[MacroDataPoint] = None
    natural_gas: Optional[MacroDataPoint] = None
    copper: Optional[MacroDataPoint] = None
    corn: Optional[MacroDataPoint] = None
    wheat: Optional[MacroDataPoint] = None
    coffee: Optional[MacroDataPoint] = None
    sugar: Optional[MacroDataPoint] = None
# --- End New Macro Data Schemas ---

class MarketMetric(BaseModel):
    price: float
    # Order book data
    bid_price: Optional[float] = None
    bid_qty: Optional[float] = None
    ask_price: Optional[float] = None
    ask_qty: Optional[float] = None
    spread: Optional[float] = None
    spread_percent: Optional[float] = None
    depth: Optional[Dict] = None  # Contains lists of bids and asks with price levels
    # Other market data
    volume_24h: float
    open_interest: float
    funding_rate: float
    price_change_percent: float
    # Market cap and volatility data
    market_cap: Optional[float] = None
    dominance: Optional[float] = None
    volatility_7d: Optional[float] = None
    volatility_30d: Optional[float] = None

class MarketData(BaseModel):
    btc: MarketMetric
    eth: MarketMetric

class RecentLiquidation(BaseModel):
    coin: str
    side: str
    size: float
    price: float
    value_usd: float
    timestamp: str

class RecentTrade(BaseModel):
    symbol: str
    side: str # 'buy' or 'sell'
    price: float
    quantity: float
    value_usd: float
    time: str

class DashboardData(BaseModel):
    market_data: MarketData
    recent_liquidations: List[RecentLiquidation] = []
    recent_large_trades: List[RecentTrade] = []
    macro_data: Optional[MacroData] = None

class ApiResponse(BaseModel):
    type: str
    timestamp: str
    data: DashboardData 