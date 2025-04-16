from sqlalchemy import Column, Date, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class StablecoinFlow(Base):
    __tablename__ = "stablecoin_flows"
    
    date = Column(Date, primary_key=True)
    net = Column(Float, nullable=False)
    circulating = Column(Float, nullable=False)
    
    def __repr__(self):
        return f"<StablecoinFlow(date={self.date}, net={self.net}, circulating={self.circulating})>" 