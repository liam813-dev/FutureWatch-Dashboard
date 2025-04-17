import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.market_snapshot import MarketSnapshot
from data_sources.binance_utils import get_funding_rates

@pytest.mark.asyncio
async def test_funding_rates_fetch():
    """Test that funding rates are successfully fetched from Binance."""
    funding_rates = await get_funding_rates()
    
    # Verify we got some funding rates
    assert len(funding_rates) > 0, "No funding rates were fetched"
    
    # Check the format of the data
    for symbol, rate in funding_rates.items():
        assert isinstance(symbol, str), "Symbol should be a string"
        assert isinstance(rate, float), "Funding rate should be a float"
        assert -0.1 <= rate <= 0.1, f"Funding rate {rate} for {symbol} is outside expected range"

@pytest.mark.asyncio
async def test_funding_rates_storage():
    """Test that funding rates are properly stored in the database."""
    async with SessionLocal() as session:
        # Insert a test market snapshot
        test_snapshot = MarketSnapshot(
            id="BTC_2024-04-16T21:00:00",
            symbol="BTC",
            timestamp=datetime.utcnow(),
            price=50000.0,
            funding_rate=0.0001
        )
        session.add(test_snapshot)
        await session.commit()
        
        # Get the most recent market snapshot
        stmt = select(MarketSnapshot).order_by(MarketSnapshot.timestamp.desc()).limit(1)
        result = await session.execute(stmt)
        snapshot = result.scalar_one_or_none()
        
        assert snapshot is not None, "No market snapshots found in database"
        assert snapshot.funding_rate is not None, "Funding rate is not stored in the snapshot"
        assert isinstance(snapshot.funding_rate, float), "Funding rate should be stored as float"
        assert snapshot.funding_rate == 0.0001, "Funding rate value does not match"

@pytest.mark.asyncio
async def test_funding_rates_api():
    """Test that funding rates are included in the API response."""
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    response = client.get("/api/data")
    
    assert response.status_code == 200, "API request failed"
    data = response.json()
    
    # Check that funding rates are included in the market data
    assert "market_data" in data, "Market data not found in response"
    for symbol, metrics in data["market_data"].items():
        assert "funding_rate" in metrics, f"Funding rate not found for {symbol}"
        assert isinstance(metrics["funding_rate"], float), f"Funding rate for {symbol} is not a float"
        assert -0.1 <= metrics["funding_rate"] <= 0.1, f"Funding rate {metrics['funding_rate']} for {symbol} is outside expected range" 