from sqlalchemy import Column, String, Float, DateTime, func, Integer, Index
from backend.app.core.database import Base

class BubbleOutlier(Base):
    __tablename__ = "bubble_outliers"
    
    symbol = Column(String, primary_key=True)
    z_score = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    baseline_price = Column(Float, nullable=True)
    percent_deviation = Column(Float, nullable=True)
    rank = Column(Integer, nullable=True)
    direction = Column(String, nullable=True)  # "up" or "down"
    lookback_days = Column(Integer, nullable=True)
    detection_method = Column(String, nullable=True)
    ts_updated = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Create index for z_score to quickly find extremes
    __table_args__ = (
        Index('idx_bubble_outliers_z_score', 'z_score'),
    ) 