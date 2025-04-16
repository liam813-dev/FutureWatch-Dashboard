from sqlalchemy import Column, String, Float, DateTime, func, Integer, Index
from app.core.database import Base
import uuid

class Liquidation(Base):
    __tablename__ = "liquidations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String, nullable=False, index=True)
    side = Column(String, nullable=False)  # "buy" or "sell"
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    exchange = Column(String, nullable=True)
    value_usd = Column(Float, nullable=False)
    position_size = Column(Float, nullable=True)
    leverage = Column(Integer, nullable=True)
    ts_created = Column(DateTime, default=func.now())
    
    # Create index for time-based queries
    __table_args__ = (
        Index('idx_liquidations_timestamp', 'timestamp'),
    ) 