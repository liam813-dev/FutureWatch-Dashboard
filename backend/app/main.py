from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from typing import Dict, Any

from app.core.database import get_db
from app.models.market_snapshot import MarketSnapshot

app = FastAPI()

@app.get("/api/data")
async def get_dashboard_data(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    # Get the most recent market snapshots for BTC and ETH
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    stmt = (
        select(MarketSnapshot)
        .where(MarketSnapshot.timestamp >= cutoff)
        .where(MarketSnapshot.symbol.in_(["BTC", "ETH"]))
        .order_by(MarketSnapshot.timestamp.desc())
    )
    result = await db.execute(stmt)
    snapshots = result.scalars().all()

    # Convert snapshots to market data format
    market_data = {}
    for snapshot in snapshots:
        market_data[snapshot.symbol] = {
            "price": snapshot.price,
            "volume_24h": snapshot.volume_24h or 0,
            "funding_rate": snapshot.funding_rate or 0,
            "price_change_percent": snapshot.percent_change_24h or 0,
            "open_interest": 0,  # Not implemented yet
            "market_cap": 0,  # Not implemented yet
            "dominance": 0,  # Not implemented yet
            "volatility_7d": 0,  # Not implemented yet
            "volatility_30d": 0,  # Not implemented yet
        }

    return {
        "type": "dashboard",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "market_data": market_data,
            "recent_liquidations": [],  # Not implemented yet
            "recent_large_trades": [],  # Not implemented yet
            "macro_data": None  # Not implemented yet
        }
    } 