from sqlalchemy import Column, String, Float, DateTime, func, Index
from app.core.database import Base

class MarketSnapshot(Base):
    __tablename__ = "market_snapshots"
    
    id = Column(String, primary_key=True)  # Composite key: symbol + timestamp
    symbol = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    price = Column(Float, nullable=False)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    close = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    volume_24h = Column(Float, nullable=True)
    percent_change_1h = Column(Float, nullable=True)
    percent_change_24h = Column(Float, nullable=True)
    percent_change_7d = Column(Float, nullable=True)
    funding_rate = Column(Float, nullable=True)
    ts_created = Column(DateTime, default=func.now())
    
    # Create indexes for efficient querying
    __table_args__ = (
        Index('idx_market_snapshots_symbol_timestamp', 'symbol', 'timestamp'),
        Index('idx_market_snapshots_timestamp', 'timestamp'),
    ) 