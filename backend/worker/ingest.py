import asyncio
import logging
from datetime import datetime, timedelta
import os
import sys
from typing import Dict, List, Any, Optional
from sqlalchemy import select, delete, func
from sqlalchemy.dialects.postgresql import insert

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_sources.hyperliquid import fetch_market_data
from data_sources.liquidations import get_liquidations_data
from data_sources.trades import get_recent_large_trades
from data_sources.stablecoins import fetch_daily_net_flows
from data_sources.binance_utils import get_funding_rates
from app.core.database import SessionLocal, engine
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.models.liquidation import Liquidation
from app.models.trade_large import TradeLarge
from app.models.macro_point import MacroPoint
from app.models.bubble_outlier import BubbleOutlier
from app.models.stablecoin_flow import StablecoinFlow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("worker.ingest")

# Data retention periods
MARKET_SNAPSHOT_RETENTION_DAYS = 14
LIQUIDATION_RETENTION_DAYS = 90
TRADES_RETENTION_DAYS = 90


async def upsert_assets(assets_data: List[Dict[str, Any]], session) -> None:
    """Upsert asset data into the database."""
    logger.info(f"Upserting {len(assets_data)} assets")
    
    for asset_data in assets_data:
        # Create the upsert statement for PostgreSQL
        stmt = insert(Asset).values(
            symbol=asset_data["symbol"],
            name=asset_data["name"],
            category=asset_data.get("category"),
            market_cap=asset_data.get("market_cap"),
            circulating_supply=asset_data.get("circulating_supply"),
            max_supply=asset_data.get("max_supply"),
            website_url=asset_data.get("website_url"),
            explorer_url=asset_data.get("explorer_url"),
            description=asset_data.get("description"),
            logo_url=asset_data.get("logo_url"),
            ts_updated=datetime.utcnow()
        )
        
        # On conflict, update all fields except the primary key
        stmt = stmt.on_conflict_do_update(
            index_elements=["symbol"],
            set_={
                "name": asset_data["name"],
                "category": asset_data.get("category"),
                "market_cap": asset_data.get("market_cap"),
                "circulating_supply": asset_data.get("circulating_supply"),
                "max_supply": asset_data.get("max_supply"),
                "website_url": asset_data.get("website_url"),
                "explorer_url": asset_data.get("explorer_url"),
                "description": asset_data.get("description"),
                "logo_url": asset_data.get("logo_url"),
                "ts_updated": datetime.utcnow()
            }
        )
        
        await session.execute(stmt)


async def bulk_insert_market_snapshots(snapshots_data: List[Dict[str, Any]], session) -> None:
    """Bulk insert market snapshots into the database."""
    logger.info(f"Bulk inserting {len(snapshots_data)} market snapshots")
    
    snapshot_objects = []
    for snapshot in snapshots_data:
        # Generate a unique ID for each snapshot
        snapshot_id = f"{snapshot['symbol']}_{snapshot['timestamp'].isoformat()}"
        
        snapshot_objects.append(MarketSnapshot(
            id=snapshot_id,
            symbol=snapshot["symbol"],
            timestamp=snapshot["timestamp"],
            price=snapshot["price"],
            open=snapshot.get("open"),
            high=snapshot.get("high"),
            low=snapshot.get("low"),
            close=snapshot.get("close"),
            volume=snapshot.get("volume"),
            volume_24h=snapshot.get("volume_24h"),
            percent_change_1h=snapshot.get("percent_change_1h"),
            percent_change_24h=snapshot.get("percent_change_24h"),
            percent_change_7d=snapshot.get("percent_change_7d"),
            funding_rate=snapshot.get("funding_rate"),
            ts_created=datetime.utcnow()
        ))
    
    session.add_all(snapshot_objects)


async def bulk_insert_liquidations(liquidations_data: List[Dict[str, Any]], session) -> None:
    """Bulk insert liquidation events into the database."""
    logger.info(f"Bulk inserting {len(liquidations_data)} liquidation events")
    
    liquidation_objects = []
    for liq in liquidations_data:
        # Convert timestamp to datetime if it's a string
        timestamp = liq.get("timestamp", datetime.utcnow())
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                # Fallback to current time if timestamp is invalid
                timestamp = datetime.utcnow()
        
        liquidation_objects.append(Liquidation(
            symbol=liq["coin"],
            side=liq["side"],
            price=liq["price"],
            quantity=liq["size"],
            timestamp=timestamp,
            exchange=liq.get("exchange"),
            value_usd=liq["value_usd"],
            position_size=liq.get("position_size"),
            leverage=liq.get("leverage"),
            ts_created=datetime.utcnow()
        ))
    
    session.add_all(liquidation_objects)


async def bulk_insert_trades(trades_data: List[Dict[str, Any]], session) -> None:
    """Bulk insert large trades into the database."""
    logger.info(f"Bulk inserting {len(trades_data)} large trades")
    
    trade_objects = []
    for trade in trades_data:
        # Convert timestamp to datetime if it's a string
        timestamp = trade.get("time", datetime.utcnow())
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                # Fallback to current time if timestamp is invalid
                timestamp = datetime.utcnow()
        
        trade_objects.append(TradeLarge(
            symbol=trade["symbol"],
            side=trade["side"],
            price=trade["price"],
            quantity=trade["quantity"],
            value_usd=trade["value_usd"],
            timestamp=timestamp,
            exchange=trade.get("exchange"),
            is_liquidation=trade.get("is_liquidation", "false"),
            ts_created=datetime.utcnow()
        ))
    
    session.add_all(trade_objects)


async def bulk_insert_macro_points(macro_data: List[Dict[str, Any]], session) -> None:
    """Bulk insert macro economic points into the database."""
    logger.info(f"Bulk inserting {len(macro_data)} macro data points")
    
    macro_objects = []
    for point in macro_data:
        # Convert timestamp to datetime if it's a string
        timestamp = point.get("timestamp", datetime.utcnow())
        if isinstance(timestamp, str):
            try:
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except ValueError:
                # Fallback to current time if timestamp is invalid
                timestamp = datetime.utcnow()
        
        macro_objects.append(MacroPoint(
            indicator=point["indicator"],
            value=point["value"],
            timestamp=timestamp,
            previous_value=point.get("previous_value"),
            percent_change=point.get("percent_change"),
            country=point.get("country", "US"),
            source=point.get("source"),
            notes=point.get("notes"),
            ts_created=datetime.utcnow()
        ))
    
    session.add_all(macro_objects)


async def upsert_bubble_outliers(bubble_data: List[Dict[str, Any]], session) -> None:
    """Upsert bubble outlier data into the database."""
    logger.info(f"Upserting {len(bubble_data)} bubble outliers")
    
    for bubble in bubble_data:
        # Create the upsert statement for PostgreSQL
        stmt = insert(BubbleOutlier).values(
            symbol=bubble["symbol"],
            z_score=bubble["z_score"],
            current_price=bubble["current_price"],
            baseline_price=bubble.get("baseline_price"),
            percent_deviation=bubble.get("percent_deviation"),
            rank=bubble.get("rank"),
            direction=bubble.get("direction"),
            lookback_days=bubble.get("lookback_days", 30),
            detection_method=bubble.get("detection_method", "zscore"),
            ts_updated=datetime.utcnow()
        )
        
        # On conflict, update all fields except the primary key
        stmt = stmt.on_conflict_do_update(
            index_elements=["symbol"],
            set_={
                "z_score": bubble["z_score"],
                "current_price": bubble["current_price"],
                "baseline_price": bubble.get("baseline_price"),
                "percent_deviation": bubble.get("percent_deviation"),
                "rank": bubble.get("rank"),
                "direction": bubble.get("direction"),
                "lookback_days": bubble.get("lookback_days", 30),
                "detection_method": bubble.get("detection_method", "zscore"),
                "ts_updated": datetime.utcnow()
            }
        )
        
        await session.execute(stmt)


async def upsert_stablecoin_flows(flow_data: List[Dict[str, Any]], session) -> None:
    """Upsert stablecoin flow data into the database."""
    logger.info(f"Upserting {len(flow_data)} stablecoin flow records")
    
    for flow in flow_data:
        # Create the upsert statement for PostgreSQL
        stmt = insert(StablecoinFlow).values(
            date=flow["date"],
            net=flow["net"],
            circulating=flow["circulating"]
        )
        
        # On conflict, update all fields except the primary key
        stmt = stmt.on_conflict_do_update(
            index_elements=["date"],
            set_={
                "net": flow["net"],
                "circulating": flow["circulating"]
            }
        )
        
        await session.execute(stmt)


async def purge_old_data(session) -> None:
    """Delete data older than retention periods."""
    logger.info("Purging old data based on retention periods")
    
    # Calculate cutoff dates
    snapshot_cutoff = datetime.utcnow() - timedelta(days=MARKET_SNAPSHOT_RETENTION_DAYS)
    liquidation_cutoff = datetime.utcnow() - timedelta(days=LIQUIDATION_RETENTION_DAYS)
    trades_cutoff = datetime.utcnow() - timedelta(days=TRADES_RETENTION_DAYS)
    
    # Delete old market snapshots
    snapshot_delete = delete(MarketSnapshot).where(MarketSnapshot.timestamp < snapshot_cutoff)
    snapshot_result = await session.execute(snapshot_delete)
    logger.info(f"Deleted {snapshot_result.rowcount} old market snapshots")
    
    # Delete old liquidations
    liquidation_delete = delete(Liquidation).where(Liquidation.timestamp < liquidation_cutoff)
    liquidation_result = await session.execute(liquidation_delete)
    logger.info(f"Deleted {liquidation_result.rowcount} old liquidation events")
    
    # Delete old trades
    trades_delete = delete(TradeLarge).where(TradeLarge.timestamp < trades_cutoff)
    trades_result = await session.execute(trades_delete)
    logger.info(f"Deleted {trades_result.rowcount} old large trades")


async def process_market_data(market_data: Dict[str, Dict[str, Any]], session) -> None:
    """Process and store market data."""
    logger.info("Processing market data")
    
    # Fetch funding rates
    try:
        funding_rates = await get_funding_rates()
        logger.info(f"Fetched funding rates for {len(funding_rates)} pairs")
    except Exception as e:
        logger.error(f"Error fetching funding rates: {e}")
        funding_rates = {}
    
    # Prepare market snapshots
    snapshots_data = []
    for symbol, data in market_data.items():
        snapshot = {
            "symbol": symbol,
            "timestamp": datetime.utcnow(),
            "price": data["price"],
            "open": data.get("open"),
            "high": data.get("high"),
            "low": data.get("low"),
            "close": data.get("close"),
            "volume": data.get("volume"),
            "volume_24h": data.get("volume_24h"),
            "percent_change_1h": data.get("percent_change_1h"),
            "percent_change_24h": data.get("percent_change_24h"),
            "percent_change_7d": data.get("percent_change_7d"),
            "funding_rate": funding_rates.get(symbol)  # Add funding rate to snapshot
        }
        snapshots_data.append(snapshot)
    
    # Bulk insert market snapshots
    await bulk_insert_market_snapshots(snapshots_data, session)
    
    # Commit the transaction
    await session.commit()
    logger.info("Market data processing complete")


async def ingest_loop():
    """Main ingestion loop."""
    logger.info("Starting ingestion loop")
    
    while True:
        try:
            async with SessionLocal() as session:
                # Fetch market data
                market_data = await fetch_market_data()
                await process_market_data(market_data, session)
                
                # Fetch and store liquidations
                liquidations = await get_liquidations_data()
                await bulk_insert_liquidations(liquidations, session)
                
                # Fetch and store large trades
                trades = await get_recent_large_trades()
                await bulk_insert_trades(trades, session)
                
                # Fetch and store stablecoin flows
                stablecoin_flows = await fetch_daily_net_flows()
                await upsert_stablecoin_flows(stablecoin_flows, session)
                
                # Purge old data
                await purge_old_data(session)
                
                # Commit all changes
                await session.commit()
                
                logger.info("Successfully processed and stored data")
                
        except Exception as e:
            logger.error(f"Error in ingestion loop: {str(e)}")
            # Log the full traceback for debugging
            logger.exception("Full traceback:")
        
        # Wait before next iteration
        await asyncio.sleep(60)  # 1 minute delay


if __name__ == "__main__":
    logger.info("Ingest worker starting up")
    asyncio.run(ingest_loop()) 