import asyncio
from datetime import datetime, timedelta
# Import the cache from the new shared_state module
from shared_state import macro_data_cache 
# REMOVE: Import from server
# from server import macro_data_cache 
from data_sources.hyperliquid import fetch_market_data
from data_sources.liquidations import get_liquidations_data
from data_sources.trades import get_recent_large_trades
from typing import Dict, List, Any, Optional

# Use standard logging
import logging
# Make sure setup_logging is imported if needed, or remove if logging is configured elsewhere
# from app.core.logging import setup_logging 
from app.models.schemas import DashboardData, MarketData, MarketMetric # Import MacroData

# Get standard logger instance
logger = logging.getLogger(__name__)

# Replacement for the missing get_liquidation_positions function
async def generate_liquidation_positions():
    """Generate sample liquidation positions data"""
    logger.info("Using default liquidation positions data")
    # Return an empty list for now
    return []

# Function to create a MarketData object directly
def generate_default_market_data_object() -> MarketData:
    """Provide default market data with realistic values for all fields."""
    # Create default metrics with realistic values
    btc_metric = MarketMetric(
        price=30000.0,
        volume_24h=15000000000,
        open_interest=5000000000,
        funding_rate=0.0001,
        price_change_percent=2.5,
        market_cap=580000000000,
        dominance=51.2,
        volatility_7d=0.022,
        volatility_30d=0.035
    )
    
    eth_metric = MarketMetric(
        price=2300.0,
        volume_24h=8000000000,
        open_interest=2000000000,
        funding_rate=0.00008,
        price_change_percent=1.8,
        market_cap=276000000000,
        dominance=18.5,
        volatility_7d=0.025,
        volatility_30d=0.04
    )
    
    logger.info("Using default market data with realistic values (direct object)")
    return MarketData(btc=btc_metric, eth=eth_metric)

async def gather_dashboard_data() -> DashboardData:
    """Gather all dashboard data from various sources"""
    try:
        market_data_result = await fetch_market_data()
        
        # Debug the market data
        if isinstance(market_data_result, dict):
            logger.info(f"Market data retrieved: BTC=${market_data_result.get('btc', {}).get('price', 'N/A')}, "
                        f"ETH=${market_data_result.get('eth', {}).get('price', 'N/A')}")
            
            # Check if we have valid price data
            btc_price = market_data_result.get('btc', {}).get('price')
            eth_price = market_data_result.get('eth', {}).get('price')
            
            if not btc_price or not eth_price:
                logger.warning("Market data missing prices, using default values")
                market_data_result = generate_default_market_data()
        else:
            logger.warning("Market data not in expected format, using default values")
            market_data_result = generate_default_market_data()
            
        # Convert to proper schema
        market_data = convert_to_market_data(market_data_result)
        
        # Log the final market data being sent
        btc_metrics = market_data.btc
        eth_metrics = market_data.eth
        logger.info(f"Converted dictionary market data to MarketData: BTC=${btc_metrics.price}, ETH=${eth_metrics.price}, Volume: ${btc_metrics.volume_24h}")
        logger.info(f"Market data metrics: BTC price=${btc_metrics.price}, volume=${btc_metrics.volume_24h}, open_interest=${btc_metrics.open_interest}, dominance={btc_metrics.dominance}")
        
        # Continue with the rest of the data gathering
        recent_liquidations_data = [] # Start with default for recent liquidations
        recent_trades_data = [] # Variable for trades
        # Include macro data from the cache (imported from shared_state)
        macro_data_result = macro_data_cache 

        # --- Fetch Binance Liquidations ---
        try:
            # Call the actual function to get liquidation data (returns a Dict)
            liquidation_result = get_liquidations_data() 
            logger.debug(f"Raw liquidation result type: {type(liquidation_result).__name__}")
            
            # Create a flat list of all liquidations
            flat_liquidations = []
            
            # Process differently based on what get_liquidations_data returns
            if isinstance(liquidation_result, dict):
                # Extract from dictionary structure
                if 'liquidations' in liquidation_result:
                    liquidations_by_symbol = liquidation_result.get("liquidations", {})
                    logger.debug(f"Liquidations by symbol keys: {list(liquidations_by_symbol.keys())}")
                    
                    # Flatten the nested structure
                    for symbol, symbol_data in liquidations_by_symbol.items():
                        longs = symbol_data.get("longs", [])
                        shorts = symbol_data.get("shorts", [])
                        logger.debug(f"Symbol {symbol}: {len(longs)} longs, {len(shorts)} shorts")
                        
                        for liq in longs:
                            # Ensure required fields
                            liq["symbol"] = liq.get("symbol", symbol)
                            liq["coin"] = symbol.replace("USDT", "")
                            flat_liquidations.append(liq)
                            
                        for liq in shorts:
                            # Ensure required fields
                            liq["symbol"] = liq.get("symbol", symbol)
                            liq["coin"] = symbol.replace("USDT", "")
                            flat_liquidations.append(liq)
                else:
                    logger.warning("Liquidation result dict has no 'liquidations' key")
            elif isinstance(liquidation_result, list):
                # Already a flat list
                flat_liquidations = liquidation_result
            else:
                logger.warning(f"Unexpected liquidation result type: {type(liquidation_result).__name__}")
            
            # Sort by time (if available)
            try:
                # Try different possible time keys
                time_keys = ["time", "timestamp", "created_at"]
                sort_key = next((k for k in time_keys if k in flat_liquidations[0]), None) if flat_liquidations else None
                
                if sort_key:
                    flat_liquidations.sort(key=lambda x: x.get(sort_key, ''), reverse=True)
                    logger.debug(f"Sorted liquidations by {sort_key}")
                else:
                    logger.debug("Could not find suitable time key for sorting liquidations")
            except Exception as sort_err:
                logger.warning(f"Could not sort flattened liquidations: {sort_err}")
                
            # Standardize format for frontend
            standardized_liquidations = []
            for liq in flat_liquidations:
                try:
                    # Map fields to expected names
                    std_liq = {
                        "coin": liq.get("coin", "").replace("USDT", "") or liq.get("symbol", "").replace("USDT", ""),
                        "side": liq.get("side", "").lower(),  # Standardize to lowercase
                        "size": float(liq.get("quantity", 0) or liq.get("size", 0)),
                        "price": float(liq.get("price", 0)),
                        "value_usd": float(liq.get("value_usd", 0) or liq.get("value", 0)),
                        "timestamp": liq.get("timestamp", "") or liq.get("time", "")
                    }
                    standardized_liquidations.append(std_liq)
                except Exception as e:
                    logger.warning(f"Error standardizing liquidation: {e} | Data: {liq}")
            
            # Use the standardized list
            recent_liquidations_data = standardized_liquidations
            logger.info(f"Prepared {len(recent_liquidations_data)} liquidations for dashboard")

        except Exception as liq_err:
            logger.error(f"Error processing liquidation data: {liq_err}", exc_info=True)
            recent_liquidations_data = [] # Fallback to empty list on error
            
        # --- Fetch Large Trades ---
        try:
            # Get recent large trades
            raw_trades = get_recent_large_trades()
            logger.debug(f"Raw trades count: {len(raw_trades)}")
            
            # Standardize format for frontend
            standardized_trades = []
            for trade in raw_trades:
                try:
                    # Convert timestamp string to datetime object
                    # Attempt multiple formats if necessary
                    timestamp_str = trade.get("time", "")
                    timestamp_dt = None
                    if timestamp_str:
                        try:
                            # Try ISO format with microseconds first
                            timestamp_dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                        except ValueError:
                             try:
                                # Try common format without microseconds
                                timestamp_dt = datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M:%S')
                             except ValueError:
                                 logger.warning(f"Could not parse timestamp: {timestamp_str}")
                                 continue # Skip this trade if timestamp is invalid

                    # Map fields to expected names in RecentTrade model
                    std_trade = {
                        "symbol": trade.get("symbol", "").replace("USDT", ""),
                        "side": trade.get("side", "").lower(),
                        "price": float(trade.get("price", 0)),
                        "size": float(trade.get("quantity", 0)), # Rename 'quantity' to 'size'
                        "value_usd": float(trade.get("value_usd", 0)), # Uncommented to include value_usd
                        "timestamp": timestamp_dt # Use parsed datetime object for 'timestamp'
                    }
                    standardized_trades.append(std_trade)
                except Exception as e:
                    logger.warning(f"Error standardizing trade: {e} | Data: {trade}")
            
            # Use the standardized list
            recent_trades_data = standardized_trades
            logger.info(f"Prepared {len(recent_trades_data)} trades for dashboard")
            
        except Exception as trades_err:
            logger.error(f"Error fetching trade data: {trades_err}", exc_info=True)
            # Fallback to empty list on error
            recent_trades_data = []

        # --- Create Positions (simulated for now) ---
        liquidation_positions = await generate_liquidation_positions()
            
        # Build and return the complete dashboard data model
        dashboard_data = DashboardData(
            market_data=market_data,
            liquidation_positions=liquidation_positions,
            recent_liquidations=recent_liquidations_data,
            recent_large_trades=recent_trades_data,
            macro_data=macro_data_result # Include macro data
        )
        
        # Log the final dashboard data structure
        logger.info(f"Dashboard data prepared with {len(dashboard_data.recent_liquidations)} liquidations and {len(dashboard_data.recent_large_trades)} trades")
        
        return dashboard_data
            
    except Exception as e:
        # Log the error, then return basic data
        logger.error(f"Error in gather_dashboard_data: {str(e)}", exc_info=True)
        
        # Use defaults in case of error
        return DashboardData(
            market_data=generate_default_market_data_object(),
            liquidation_positions=[],
            recent_liquidations=[],
            recent_large_trades=[],
            macro_data=macro_data_cache
        )

# Function to generate a dictionary of market data
def generate_default_market_data() -> Dict[str, Dict[str, float]]:
    """Generate default market data with realistic values"""
    logger.info("Using default market data with realistic values (dict format)")
    return {
        "btc": {
            "price": 84526.42,
            "volume_24h": 1930297877.94,
            "open_interest": 6704734192.20,
            "funding_rate": 0.0002,
            "price_change_percent": 0.0125,
            "market_cap": 1650000000000,
            "dominance": 51.2,
            "volatility_7d": 0.18,
            "bid_price": 84525.50,
            "ask_price": 84527.30,
            "spread": 1.80,
            "spread_percent": 0.00002
        },
        "eth": {
            "price": 1583.85,
            "volume_24h": 930297877.94,
            "open_interest": 1704734192.20,
            "funding_rate": 0.00017,
            "price_change_percent": 0.005,
            "market_cap": 190000000000,
            "dominance": 18.5,
            "volatility_7d": 0.23,
            "bid_price": 1583.75,
            "ask_price": 1583.95,
            "spread": 0.20,
            "spread_percent": 0.00012
        }
    }

def convert_to_market_data(data: Dict[str, Dict[str, float]]) -> MarketData:
    """Convert a dictionary of market data to a MarketData object."""
    try:
        # Create BTC metric
        btc_data = data.get("btc", {})
        btc_metric = MarketMetric(
            price=btc_data.get("price", 0.0),
            bid_price=btc_data.get("bid_price"),
            bid_qty=btc_data.get("bid_qty"),
            ask_price=btc_data.get("ask_price"),
            ask_qty=btc_data.get("ask_qty"),
            spread=btc_data.get("spread"),
            spread_percent=btc_data.get("spread_percent"),
            depth=btc_data.get("depth"),
            volume_24h=btc_data.get("volume_24h", 0.0),
            open_interest=btc_data.get("open_interest", 0.0),
            funding_rate=btc_data.get("funding_rate", 0.0),
            price_change_percent=btc_data.get("price_change_percent", 0.0),
            market_cap=btc_data.get("market_cap"),
            dominance=btc_data.get("dominance"),
            volatility_7d=btc_data.get("volatility_7d"),
            volatility_30d=btc_data.get("volatility_30d")
        )

        # Create ETH metric
        eth_data = data.get("eth", {})
        eth_metric = MarketMetric(
            price=eth_data.get("price", 0.0),
            bid_price=eth_data.get("bid_price"),
            bid_qty=eth_data.get("bid_qty"),
            ask_price=eth_data.get("ask_price"),
            ask_qty=eth_data.get("ask_qty"),
            spread=eth_data.get("spread"),
            spread_percent=eth_data.get("spread_percent"),
            depth=eth_data.get("depth"),
            volume_24h=eth_data.get("volume_24h", 0.0),
            open_interest=eth_data.get("open_interest", 0.0),
            funding_rate=eth_data.get("funding_rate", 0.0),
            price_change_percent=eth_data.get("price_change_percent", 0.0),
            market_cap=eth_data.get("market_cap"),
            dominance=eth_data.get("dominance"),
            volatility_7d=eth_data.get("volatility_7d"),
            volatility_30d=eth_data.get("volatility_30d")
        )

        # Debug log field counts
        logger.debug(f"BTC metric has {len(btc_data)} fields, ETH metric has {len(eth_data)} fields")
        
        # Create and return the MarketData object
        return MarketData(btc=btc_metric, eth=eth_metric)
    except Exception as e:
        logger.error(f"Error converting market data: {str(e)}", exc_info=True)
        # Return default on error
        return generate_default_market_data_object()
