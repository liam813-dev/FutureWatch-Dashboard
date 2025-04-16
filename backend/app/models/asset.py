from sqlalchemy import Column, String, Float, DateTime, func
from app.core.database import Base

class Asset(Base):
    __tablename__ = "assets"
    
    symbol = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    market_cap = Column(Float, nullable=True)
    circulating_supply = Column(Float, nullable=True)
    max_supply = Column(Float, nullable=True)
    website_url = Column(String, nullable=True)
    explorer_url = Column(String, nullable=True)
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    ts_updated = Column(DateTime, default=func.now(), onupdate=func.now()) 