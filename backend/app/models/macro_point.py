from sqlalchemy import Column, String, Float, DateTime, func, Index
from app.core.database import Base
import uuid

class MacroPoint(Base):
    __tablename__ = "macro_points"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    indicator = Column(String, nullable=False, index=True)  # e.g., "cpi", "fed_rate"
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    previous_value = Column(Float, nullable=True)
    percent_change = Column(Float, nullable=True)
    country = Column(String, nullable=True, default="US")
    source = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    ts_created = Column(DateTime, default=func.now())
    
    # Create index for indicator + timestamp queries
    __table_args__ = (
        Index('idx_macro_points_indicator_timestamp', 'indicator', 'timestamp'),
    ) 