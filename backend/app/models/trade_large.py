from sqlalchemy import Column, String, Float, DateTime, func, Index
from app.core.database import Base
import uuid

class TradeLarge(Base):
    __tablename__ = "trades_large"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)  # "buy" or "sell"
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    value_usd = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    exchange = Column(String, nullable=True)
    is_liquidation = Column(String, nullable=True, default=False)
    ts_created = Column(DateTime, default=func.now())
    
    # Create index for time-based queries
    __table_args__ = (
        Index('idx_trades_large_timestamp', 'timestamp'),
    ) 