from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from typing import Dict, List, Any

from app.core.database import get_db
from app.models.market_snapshot import MarketSnapshot
from app.models.liquidation import Liquidation
from app.models.trade_large import TradeLarge
from app.models.macro_point import MacroPoint
from app.models.bubble_outlier import BubbleOutlier
from app.models.stablecoin_flow import StablecoinFlow

router = APIRouter()

@router.get("/api/data")
async def get_dashboard_data(db: AsyncSession = Depends(get_db)):
    """
    Get dashboard data combining the latest snapshots, macro data, bubble outliers, and stablecoin flows.
    """
    try:
        # Get the latest snapshot for each symbol
        subquery = select(
            MarketSnapshot.symbol,
            func.max(MarketSnapshot.timestamp).label("max_timestamp")
        ).group_by(MarketSnapshot.symbol).subquery()
        
        latest_snapshots_query = select(MarketSnapshot).join(
            subquery,
            and_(
                MarketSnapshot.symbol == subquery.c.symbol,
                MarketSnapshot.timestamp == subquery.c.max_timestamp
            )
        )
        
        result = await db.execute(latest_snapshots_query)
        latest_snapshots = result.scalars().all()
        
        # Get recent macro data
        macro_query = select(MacroPoint).order_by(MacroPoint.timestamp.desc()).limit(10)
        result = await db.execute(macro_query)
        macro_data = result.scalars().all()
        
        # Get recent liquidations
        liquidations_query = select(Liquidation).order_by(Liquidation.timestamp.desc()).limit(50)
        result = await db.execute(liquidations_query)
        recent_liquidations = result.scalars().all()
        
        # Get recent large trades
        trades_query = select(TradeLarge).order_by(TradeLarge.timestamp.desc()).limit(50)
        result = await db.execute(trades_query)
        recent_trades = result.scalars().all()
        
        # Get latest stablecoin flow data
        stablecoin_query = select(StablecoinFlow).order_by(StablecoinFlow.date.desc()).limit(1)
        result = await db.execute(stablecoin_query)
        latest_stablecoin_flow = result.scalar()
        
        # Format market data
        market_data = {}
        for snapshot in latest_snapshots:
            market_data[snapshot.symbol] = {
                "price": snapshot.price,
                "volume_24h": snapshot.volume_24h,
                "percent_change_1h": snapshot.percent_change_1h,
                "percent_change_24h": snapshot.percent_change_24h,
                "percent_change_7d": snapshot.percent_change_7d,
            }
        
        # Format macro data
        formatted_macro_data = []
        for item in macro_data:
            formatted_macro_data.append({
                "indicator": item.indicator,
                "value": item.value,
                "timestamp": item.timestamp.isoformat(),
                "previous_value": item.previous_value,
                "percent_change": item.percent_change,
                "country": item.country,
            })
        
        # Format liquidations
        formatted_liquidations = []
        for liq in recent_liquidations:
            formatted_liquidations.append({
                "coin": liq.symbol,
                "side": liq.side,
                "size": liq.quantity,
                "price": liq.price,
                "value_usd": liq.value_usd,
                "timestamp": liq.timestamp.isoformat(),
                "exchange": liq.exchange,
            })
        
        # Format trades
        formatted_trades = []
        for trade in recent_trades:
            formatted_trades.append({
                "symbol": trade.symbol,
                "side": trade.side,
                "price": trade.price,
                "quantity": trade.quantity,
                "value_usd": trade.value_usd,
                "time": trade.timestamp.isoformat(),
                "exchange": trade.exchange,
            })
        
        # Build the complete response
        dashboard_data = {
            "market_data": market_data,
            "macro_data": formatted_macro_data,
            "recent_liquidations": formatted_liquidations,
            "recent_large_trades": formatted_trades,
            "stablecoin_flow_24h": latest_stablecoin_flow.net if latest_stablecoin_flow else None,
            "stablecoin_circ": latest_stablecoin_flow.circulating if latest_stablecoin_flow else None,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return dashboard_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")


@router.get("/api/bubbles")
async def get_bubble_outliers(db: AsyncSession = Depends(get_db)):
    """
    Get bubble outlier data with recent updates, ordered by Z-score magnitude.
    """
    try:
        # Get bubbles updated in the last 2 minutes
        two_min_ago = datetime.utcnow() - timedelta(minutes=2)
        
        # Query for bubble outliers with recent updates
        query = select(BubbleOutlier).where(
            BubbleOutlier.ts_updated > two_min_ago
        ).order_by(
            func.abs(BubbleOutlier.z_score).desc()
        ).limit(20)
        
        result = await db.execute(query)
        bubble_outliers = result.scalars().all()
        
        # Format the results
        formatted_outliers = []
        for outlier in bubble_outliers:
            formatted_outliers.append({
                "symbol": outlier.symbol,
                "z_score": outlier.z_score,
                "current_price": outlier.current_price,
                "baseline_price": outlier.baseline_price,
                "percent_deviation": outlier.percent_deviation,
                "direction": outlier.direction,
                "updated_at": outlier.ts_updated.isoformat(),
            })
        
        return {
            "bubble_outliers": formatted_outliers,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bubble outliers: {str(e)}")


# Add a health check endpoint
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Health check endpoint that verifies database connectivity and table existence.
    Returns 200 if market_snapshots table is not empty, 500 otherwise.
    """
    try:
        # Check if market_snapshots table has any records
        query = select(func.count()).select_from(MarketSnapshot)
        result = await db.execute(query)
        count = result.scalar()
        
        if count is None or count == 0:
            return {"status": "unhealthy", "message": "market_snapshots table is empty"}
        
        return {"status": "healthy", "message": "Database connection successful", "count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}") 