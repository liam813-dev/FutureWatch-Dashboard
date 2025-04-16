import pytest
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.models.bubble_outlier import BubbleOutlier

# Test data for bubble outliers
BUBBLE_DATA = [
    {
        "symbol": "BTC",
        "z_score": 2.5,
        "current_price": 50000.0,
        "baseline_price": 45000.0,
        "percent_deviation": 11.11,
        "rank": 1,
        "direction": "up",
        "lookback_days": 30,
        "detection_method": "zscore"
    },
    {
        "symbol": "ETH",
        "z_score": 1.8,
        "current_price": 3000.0,
        "baseline_price": 2800.0,
        "percent_deviation": 7.14,
        "rank": 2,
        "direction": "up",
        "lookback_days": 30,
        "detection_method": "zscore"
    },
    {
        "symbol": "SOL",
        "z_score": -2.2,
        "current_price": 80.0,
        "baseline_price": 100.0,
        "percent_deviation": -20.0,
        "rank": 3,
        "direction": "down",
        "lookback_days": 30,
        "detection_method": "zscore"
    }
]

# Updated data for testing updates
UPDATED_BUBBLE_DATA = [
    {
        "symbol": "BTC",
        "z_score": 3.0,  # Changed value
        "current_price": 52000.0,  # Changed value
        "baseline_price": 45000.0,
        "percent_deviation": 15.56,  # Changed value
        "rank": 1,
        "direction": "up",
        "lookback_days": 30,
        "detection_method": "zscore"
    }
]

async def upsert_bubble_outliers(bubble_data, session):
    """Upsert bubble outlier data into the database."""
    for bubble in bubble_data:
        # Create insert statement (using SQLite compatible syntax for testing)
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
        
        # For SQLite testing, use a different approach than PostgreSQL's on_conflict_do_update
        # First check if the record exists
        query = select(BubbleOutlier).where(BubbleOutlier.symbol == bubble["symbol"])
        result = await session.execute(query)
        existing = result.scalars().first()
        
        if existing:
            # Update the existing record
            existing.z_score = bubble["z_score"]
            existing.current_price = bubble["current_price"]
            existing.baseline_price = bubble.get("baseline_price")
            existing.percent_deviation = bubble.get("percent_deviation")
            existing.rank = bubble.get("rank")
            existing.direction = bubble.get("direction")
            existing.lookback_days = bubble.get("lookback_days", 30)
            existing.detection_method = bubble.get("detection_method", "zscore")
            existing.ts_updated = datetime.utcnow()
        else:
            # Insert new record
            session.add(BubbleOutlier(
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
            ))


@pytest.mark.asyncio
async def test_bubble_outlier_insert(session):
    """Test inserting bubble outliers."""
    # Insert bubble outliers
    await upsert_bubble_outliers(BUBBLE_DATA, session)
    await session.commit()
    
    # Query all bubble outliers
    query = select(BubbleOutlier)
    result = await session.execute(query)
    bubbles = result.scalars().all()
    
    # Check that all were inserted
    assert len(bubbles) == 3
    
    # Check specific values
    symbols = set(bubble.symbol for bubble in bubbles)
    assert symbols == {"BTC", "ETH", "SOL"}
    
    # Find BTC and check its z-score
    btc_bubble = next(bubble for bubble in bubbles if bubble.symbol == "BTC")
    assert btc_bubble.z_score == 2.5
    assert btc_bubble.current_price == 50000.0


@pytest.mark.asyncio
async def test_bubble_outlier_update(session):
    """Test updating existing bubble outliers."""
    # First insert initial data
    await upsert_bubble_outliers(BUBBLE_DATA, session)
    await session.commit()
    
    # Now update BTC record
    await upsert_bubble_outliers(UPDATED_BUBBLE_DATA, session)
    await session.commit()
    
    # Query all bubble outliers
    query = select(BubbleOutlier)
    result = await session.execute(query)
    bubbles = result.scalars().all()
    
    # Check that we still have the same number of records (3)
    assert len(bubbles) == 3
    
    # Find BTC and check its updated values
    btc_bubble = next(bubble for bubble in bubbles if bubble.symbol == "BTC")
    assert btc_bubble.z_score == 3.0
    assert btc_bubble.current_price == 52000.0
    assert btc_bubble.percent_deviation == 15.56 