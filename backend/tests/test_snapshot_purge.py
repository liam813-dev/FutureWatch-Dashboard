import pytest
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from app.models.market_snapshot import MarketSnapshot

# Test data with different timestamps
async def create_test_snapshots(session, days_range):
    """Create test snapshots with timestamps ranging back several days."""
    snapshots = []
    
    # Create a snapshot for each day in the range
    for days_ago in range(days_range):
        timestamp = datetime.utcnow() - timedelta(days=days_ago)
        snapshot_id = f"BTC_{timestamp.isoformat()}"
        
        snapshot = MarketSnapshot(
            id=snapshot_id,
            symbol="BTC",
            timestamp=timestamp,
            price=30000.0 + days_ago * 100,  # Different price each day
            open=30000.0,
            high=31000.0,
            low=29000.0,
            close=30000.0 + days_ago * 100,
            volume=1000000.0,
            volume_24h=25000000.0,
            percent_change_1h=0.1,
            percent_change_24h=1.5,
            percent_change_7d=5.0,
            ts_created=datetime.utcnow()
        )
        snapshots.append(snapshot)
    
    # Add all snapshots to the session
    session.add_all(snapshots)
    await session.commit()
    
    return snapshots


async def purge_old_snapshots(session, retention_days):
    """Delete snapshots older than the retention period."""
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    delete_stmt = delete(MarketSnapshot).where(MarketSnapshot.timestamp < cutoff_date)
    result = await session.execute(delete_stmt)
    return result.rowcount


@pytest.mark.asyncio
async def test_snapshot_purge(session):
    """Test purging old market snapshots."""
    # Create 30 days of snapshots
    await create_test_snapshots(session, 30)
    
    # Check initial count
    query = select(MarketSnapshot)
    result = await session.execute(query)
    initial_count = len(result.scalars().all())
    assert initial_count == 30
    
    # Purge snapshots older than 14 days
    retention_days = 14
    deleted_count = await purge_old_snapshots(session, retention_days)
    await session.commit()
    
    # Check that old snapshots were deleted
    query = select(MarketSnapshot)
    result = await session.execute(query)
    remaining_snapshots = result.scalars().all()
    
    # Should have 14 days of data remaining
    assert len(remaining_snapshots) == retention_days
    
    # All remaining snapshots should be newer than the cutoff date
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
    for snapshot in remaining_snapshots:
        assert snapshot.timestamp > cutoff_date


@pytest.mark.asyncio
async def test_snapshot_purge_no_deletion(session):
    """Test purge function when all snapshots are within retention period."""
    # Create only 7 days of snapshots
    await create_test_snapshots(session, 7)
    
    # Check initial count
    query = select(MarketSnapshot)
    result = await session.execute(query)
    initial_count = len(result.scalars().all())
    assert initial_count == 7
    
    # Purge snapshots older than 14 days
    retention_days = 14
    deleted_count = await purge_old_snapshots(session, retention_days)
    await session.commit()
    
    # Check that no snapshots were deleted
    query = select(MarketSnapshot)
    result = await session.execute(query)
    remaining_count = len(result.scalars().all())
    
    assert remaining_count == initial_count
    assert deleted_count == 0  # No rows should be deleted 