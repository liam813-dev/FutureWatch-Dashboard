import aiohttp
import logging
import asyncio
from typing import Dict, Optional, Any
from datetime import datetime
import math
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Define Settings class here to avoid circular imports
class Settings(BaseModel):
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    coingecko_api_key: Optional[str] = None

# Try to import numpy, but don't fail if it's not available
try:
    import numpy as np
    HAS_NUMPY = True
    logger.info("NumPy is available, using optimized volatility calculation")
except ImportError:
    HAS_NUMPY = False
    logger.warning("NumPy is not available, using simplified volatility calculation")

BASE_URL = "https://api.coingecko.com/api/v3"

# Rate limiting variables
_last_request_time = datetime.now()
_min_request_interval = 6.0  # seconds between requests to avoid rate limits

async def fetch_coingecko_data(endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
    """Generic function to fetch data from CoinGecko API with rate limiting."""
    global _last_request_time
    url = f"{BASE_URL}/{endpoint}"
    
    # Implement rate limiting
    now = datetime.now()
    time_since_last_request = (now - _last_request_time).total_seconds()
    if time_since_last_request < _min_request_interval:
        sleep_time = _min_request_interval - time_since_last_request
        logger.info(f"Rate limiting: Sleeping for {sleep_time:.2f}s before CoinGecko request")
        await asyncio.sleep(sleep_time)
    
    try:
        async with aiohttp.ClientSession() as session:
            logger.info(f"Fetching CoinGecko data from endpoint: {endpoint}")
            
            # Update last request time
            _last_request_time = datetime.now()
            
            async with session.get(url, params=params, timeout=10) as response:
                if response.status == 429:
                    logger.warning("CoinGecko API rate limit reached, will retry later")
                    return None
                    
                response.raise_for_status()
                data = await response.json()
                logger.debug(f"CoinGecko response for {endpoint}: {str(data)[:200]}...")
                return data
                
    except aiohttp.ClientError as e:
        logger.error(f"HTTP Client Error fetching CoinGecko ({endpoint}): {e}")
    except asyncio.TimeoutError:
        logger.error(f"Timeout error fetching CoinGecko ({endpoint})")
    except Exception as e:
        logger.error(f"Unexpected error fetching CoinGecko ({endpoint}): {e}", exc_info=True)
        
    return None

async def fetch_coin_market_data(coins: list = ['bitcoin', 'ethereum']) -> Optional[Dict[str, Any]]:
    """
    Fetch comprehensive market data for specified coins including:
    - Current price
    - Market cap
    - 24h volume
    - 24h change
    
    Args:
        coins: List of coin IDs (default: bitcoin, ethereum)
        
    Returns:
        Dictionary with coin data or None on error
    """
    params = {
        'ids': ','.join(coins),
        'vs_currencies': 'usd',
        'include_market_cap': 'true',
        'include_24hr_vol': 'true',
        'include_24hr_change': 'true',
        'include_last_updated_at': 'true'
    }
    
    data = await fetch_coingecko_data('simple/price', params)
    if data:
        logger.info(f"Successfully fetched market data for {len(data)} coins")
        return data
    
    return None

async def fetch_global_market_data() -> Optional[Dict[str, Any]]:
    """
    Fetch global market data including market cap distribution (dominance)
    
    Returns:
        Dictionary with global data or None on error
    """
    data = await fetch_coingecko_data('global')
    if data:
        logger.info("Successfully fetched global market data")
        return data
    
    return None

async def fetch_coin_history(coin_id: str, days: int = 30) -> Optional[Dict[str, Any]]:
    """
    Fetch price history and volatility data for a specific coin
    
    Args:
        coin_id: CoinGecko coin ID (e.g., 'bitcoin')
        days: Number of days of historical data to fetch
        
    Returns:
        Dictionary with historical data or None on error
    """
    params = {
        'vs_currency': 'usd',
        'days': days
    }
    
    data = await fetch_coingecko_data(f'coins/{coin_id}/market_chart', params)
    if data:
        logger.info(f"Successfully fetched {days}-day historical data for {coin_id}")
        return data
    
    return None

async def calculate_volatility(coin_id: str, days: int = 30, settings: Settings = None) -> float:
    """
    Calculate historical volatility for a given cryptocurrency.
    
    This function is self-contained and can work with or without NumPy.
    It will use NumPy if available for optimized calculation, otherwise
    falls back to a simple calculation using standard Python.
    
    Args:
        coin_id: CoinGecko coin ID
        days: Number of days to look back (default: 30)
        settings: App settings (optional)
    
    Returns:
        float: The annualized volatility (or 0 if calculation fails)
    """
    if settings is None:
        # Create default settings instead of importing get_settings
        settings = Settings()
        
    try:
        # Fetch historical data
        url = f"{settings.coingecko_base_url}/coins/{coin_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": str(days),
            "interval": "daily"
        }
        
        if settings.coingecko_api_key:
            params["x_cg_pro_api_key"] = settings.coingecko_api_key
            
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        if "rate limit" in error_text.lower():
                            logger.warning("CoinGecko API rate limit reached")
                        else:
                            logger.error(f"CoinGecko API error: {response.status} - {error_text}")
                        return 0.0
                        
                    data = await response.json()
                    
                    # Extract price data
                    if not data or 'prices' not in data or not data['prices']:
                        logger.warning(f"No price data received for {coin_id}")
                        return 0.0
                        
                    # Get just the prices from the [timestamp, price] pairs
                    prices = [price[1] for price in data['prices'] if isinstance(price, list) and len(price) > 1]
                    
                    if len(prices) < 2:
                        logger.warning(f"Insufficient price data for {coin_id}: {len(prices)} points")
                        return 0.0
                        
                    # Calculate volatility
                    logger.info(f"Calculating volatility for {coin_id} with {len(prices)} price points")
                    return _calculate_volatility_from_prices(prices)
                    
            except aiohttp.ClientError as e:
                logger.error(f"Error fetching CoinGecko data: {e}")
                return 0.0
                
    except Exception as e:
        logger.error(f"Volatility calculation failed: {e}", exc_info=True)
        return 0.0

def _calculate_volatility_from_prices(prices):
    """
    Internal helper to calculate volatility from a list of prices.
    Uses NumPy if available, otherwise falls back to standard Python.
    
    Args:
        prices: List of price points
        
    Returns:
        float: Annualized volatility as a decimal (e.g., 0.65 for 65%)
    """
    try:
        if len(prices) < 2:
            return 0.0
            
        # Use optimized NumPy calculation if available
        if HAS_NUMPY:
            # Convert prices to numpy array and calculate log returns
            price_array = np.array(prices)
            log_returns = np.diff(np.log(price_array))
            
            # Calculate annualized volatility (standard deviation * sqrt(365))
            daily_volatility = np.std(log_returns, ddof=1)
            annualized_volatility = daily_volatility * math.sqrt(365)
            
            logger.debug(f"Calculated volatility using NumPy: {annualized_volatility:.4f}")
            return max(0.0, float(annualized_volatility))
            
        # Fall back to standard Python calculation
        else:
            # Calculate simple returns
            returns = []
            for i in range(1, len(prices)):
                if prices[i-1] > 0:  # Avoid division by zero
                    returns.append((prices[i] / prices[i-1]) - 1)
            
            if not returns:
                return 0.0
                
            # Calculate mean
            mean_return = sum(returns) / len(returns)
            
            # Calculate variance
            variance = sum((r - mean_return) ** 2 for r in returns) / (len(returns) - 1)
            
            # Calculate daily volatility
            daily_volatility = math.sqrt(variance)
            
            # Annualize volatility
            annualized_volatility = daily_volatility * math.sqrt(365)
            
            logger.debug(f"Calculated volatility using standard math: {annualized_volatility:.4f}")
            return max(0.0, annualized_volatility)
            
    except Exception as e:
        logger.error(f"Error in volatility calculation: {e}", exc_info=True)
        return 0.0

async def get_enhanced_market_data() -> Dict[str, Dict[str, Any]]:
    """
    Fetch and combine all enhanced market data for the dashboard
    
    Returns:
        Dictionary with all market metrics for BTC and ETH
    """
    # Initialize with default empty structure
    result = {
        'btc': {},
        'eth': {}
    }
    
    # Fetch basic price data
    market_data = await fetch_coin_market_data(['bitcoin', 'ethereum'])
    if market_data:
        # Extract and format Bitcoin data
        if 'bitcoin' in market_data:
            btc_data = market_data['bitcoin']
            result['btc']['price'] = btc_data.get('usd', 0)
            result['btc']['market_cap'] = btc_data.get('usd_market_cap', 0)
            result['btc']['volume_24h'] = btc_data.get('usd_24h_vol', 0)
            result['btc']['price_change_percent'] = btc_data.get('usd_24h_change', 0)
        
        # Extract and format Ethereum data
        if 'ethereum' in market_data:
            eth_data = market_data['ethereum']
            result['eth']['price'] = eth_data.get('usd', 0)
            result['eth']['market_cap'] = eth_data.get('usd_market_cap', 0)
            result['eth']['volume_24h'] = eth_data.get('usd_24h_vol', 0)
            result['eth']['price_change_percent'] = eth_data.get('usd_24h_change', 0)
    
    # Fetch global data for dominance
    global_data = await fetch_global_market_data()
    if global_data and 'data' in global_data and 'market_cap_percentage' in global_data['data']:
        dominance = global_data['data']['market_cap_percentage']
        result['btc']['dominance'] = dominance.get('btc', 0)
        result['eth']['dominance'] = dominance.get('eth', 0)
    
    # Calculate volatility metrics - this is now more robust with internal error handling
    result['btc']['volatility_7d'] = await calculate_volatility('bitcoin', 7)
    result['btc']['volatility_30d'] = await calculate_volatility('bitcoin', 30)
    result['eth']['volatility_7d'] = await calculate_volatility('ethereum', 7)
    result['eth']['volatility_30d'] = await calculate_volatility('ethereum', 30)
        
    logger.info(f"Compiled enhanced market data for BTC and ETH")
    return result 