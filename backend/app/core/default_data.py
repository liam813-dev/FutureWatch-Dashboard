import random

def default_market_data():
    """Generate realistic sample market data for the dashboard."""
    # Base market data with realistic values
    btc_price = 60000 + random.randint(-2000, 2000)
    eth_price = 3500 + random.randint(-200, 200)
    
    # Generate realistic funding rates
    # Funding rates are typically very small, ranging from -0.01% to 0.01% hourly
    # For Hyperliquid they're calculated over 8 hours and capped at 0.05% per hour
    # So realistic values would be around 0.001% to 0.01% (0.00001 to 0.0001)
    btc_funding = round(random.uniform(-0.0001, 0.0001), 6)
    eth_funding = round(random.uniform(-0.0001, 0.0001), 6)
    
    return {
        "btc": {
            "price": btc_price,
            "price_change_percent": round(random.uniform(-0.05, 0.05), 4),
            "volume_24h": random.randint(15000000000, 25000000000),
            "market_cap": btc_price * 19000000,  # Approximate BTC circulating supply
            "funding_rate": btc_funding,
            "open_interest": random.randint(8000000000, 16000000000),
            "dominance": round(random.uniform(45, 55), 1),
            "volatility_7d": round(random.uniform(0.02, 0.06), 4),
            "volatility_30d": round(random.uniform(0.04, 0.10), 4),
        },
        "eth": {
            "price": eth_price,
            "price_change_percent": round(random.uniform(-0.07, 0.07), 4),
            "volume_24h": random.randint(8000000000, 15000000000),
            "market_cap": eth_price * 120000000,  # Approximate ETH circulating supply
            "funding_rate": eth_funding,
            "open_interest": random.randint(4000000000, 8000000000),
            "dominance": round(random.uniform(15, 22), 1),
            "volatility_7d": round(random.uniform(0.03, 0.07), 4),
            "volatility_30d": round(random.uniform(0.05, 0.12), 4),
        }
    } 