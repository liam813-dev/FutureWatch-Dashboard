from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# --- New Macro Data Schemas ---
class MacroDataPoint(BaseModel):
    timestamp: datetime
    value: float

class MacroData(BaseModel):
    dxy: Optional[List[MacroDataPoint]] = None
    gold: Optional[List[MacroDataPoint]] = None
    oil: Optional[List[MacroDataPoint]] = None
    gas: Optional[List[MacroDataPoint]] = None

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
    volume_24h: Optional[float] = None
    percent_change_1h: Optional[float] = None
    percent_change_24h: Optional[float] = None
    percent_change_7d: Optional[float] = None

class MarketData(BaseModel):
    btc: Optional[MarketMetric] = None
    eth: Optional[MarketMetric] = None

class RecentLiquidation(BaseModel):
    symbol: str
    side: str
    size: float
    price: float
    timestamp: datetime

class RecentTrade(BaseModel):
    symbol: str
    side: str
    size: float
    price: float
    timestamp: datetime

class DashboardData(BaseModel):
    market_data: Optional[MarketData] = None
    recent_liquidations: Optional[List[RecentLiquidation]] = None
    recent_large_trades: Optional[List[RecentTrade]] = None
    macro_data: Optional[MacroData] = None
    stablecoin_flow_24h: Optional[float] = None
    stablecoin_circ: Optional[float] = None

class ApiResponse(BaseModel):
    success: bool
    data: Optional[DashboardData] = None
    error: Optional[str] = None

class MarketSnapshot(BaseModel):
    id: str  # Composite key: symbol + timestamp
    symbol: str
    timestamp: datetime
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    volume_24h: Optional[float] = None
    percent_change_1h: Optional[float] = None
    percent_change_24h: Optional[float] = None
    percent_change_7d: Optional[float] = None
    funding_rate: Optional[float] = None
    ts_created: datetime = Field(default_factory=datetime.utcnow)

Base = declarative_base()

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False)
    symbol = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    volume_24h = Column(Float, nullable=False)
    funding_rate = Column(Float, nullable=True)  # Added funding rate field
    market_metadata = Column(JSON, nullable=True)
    
    # Relationships
    asset_id = Column(Integer, ForeignKey("assets.id"))
    asset = relationship("Asset", back_populates="snapshots")
    
    def __repr__(self):
        return f"<MarketSnapshot(symbol={self.symbol}, price={self.price}, funding_rate={self.funding_rate})>" 