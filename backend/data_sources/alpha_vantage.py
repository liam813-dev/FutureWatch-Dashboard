import aiohttp
import asyncio
import logging
import os
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)

BASE_URL = "https://www.alphavantage.co/query"

# Read API key from environment variable, use provided key as fallback (WARN if used)
API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")
if not API_KEY:
    logger.warning("ALPHAVANTAGE_API_KEY environment variable not set. Using fallback key U5LFS0KFHCB69N6X. This is NOT recommended for production.")
    API_KEY = "U5LFS0KFHCB69N6X" 

# --- Helper Function --- 
async def _fetch_alpha_vantage_data(function_name: str, params: Optional[Dict] = None) -> Optional[Dict]:
    """Generic function to fetch data from Alpha Vantage."""
    if not API_KEY:
        logger.error("Alpha Vantage API key is missing.")
        return None
        
    url_params = {
        "function": function_name,
        "apikey": API_KEY,
        **(params or {})
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            logger.info(f"Fetching Alpha Vantage data for function: {function_name}")
            async with session.get(BASE_URL, params=url_params) as response:
                response.raise_for_status()
                data = await response.json()
                logger.debug(f"Alpha Vantage response for {function_name}: {str(data)[:200]}...")
                
                # Check for API error messages
                if "Error Message" in data:
                    logger.error(f"Alpha Vantage API Error for {function_name}: {data['Error Message']}")
                    return None
                if "Information" in data and "The standard API call frequency" in data["Information"]:
                     logger.warning(f"Alpha Vantage API rate limit likely hit for {function_name}. Details: {data['Information']}")
                     # Return None or potentially cached data if implemented
                     return None 
                
                return data
                
    except aiohttp.ClientError as e:
        logger.error(f"HTTP Client Error fetching Alpha Vantage ({function_name}): {e}")
    except asyncio.TimeoutError:
        logger.error(f"Timeout Error fetching Alpha Vantage ({function_name}).")
    except Exception as e:
        logger.error(f"Unexpected error fetching Alpha Vantage ({function_name}): {e}", exc_info=True)
        
    return None

# --- Specific Indicator Fetch Functions --- 

async def _fetch_latest_commodity_or_rate(function_name: str, 
                                          param_name: str, 
                                          interval: str = "daily", 
                                          value_suffix: str = "") -> Optional[Tuple[str, str]]:
    """Helper to fetch latest data point for commodities or rates."""
    params = {"interval": interval} if interval else {}
    data = await _fetch_alpha_vantage_data(function_name, params)
    
    if data and isinstance(data.get("data"), list) and len(data["data"]) > 0:
        latest_entry = data["data"][0]
        if "date" in latest_entry and "value" in latest_entry and latest_entry["value"] != ".": # Ignore placeholder values
            date = latest_entry["date"]
            value = latest_entry["value"]
            logger.info(f"Fetched latest {param_name}: {date} -> {value}{value_suffix}")
            return date, f"{value}{value_suffix}"
        else:
            logger.warning(f"{param_name} data missing 'date' or 'value', or value is placeholder: {latest_entry}")
    else:
        logger.warning(f"Could not fetch or parse valid {param_name} data. Response: {str(data)[:200]}...")
    return None

# --- Existing Indicators --- 
async def fetch_latest_cpi() -> Optional[Tuple[str, str]]:
    return await _fetch_latest_commodity_or_rate("CPI", "CPI", interval="monthly")

async def fetch_latest_fed_funds_rate() -> Optional[Tuple[str, str]]:
    return await _fetch_latest_commodity_or_rate("FEDERAL_FUNDS_RATE", "Fed Rate", interval="daily", value_suffix="%")

async def fetch_latest_unemployment() -> Optional[Tuple[str, str]]:
    return await _fetch_latest_commodity_or_rate("UNEMPLOYMENT", "Unemployment", interval="monthly", value_suffix="%")

# --- New Oil Indicators --- 
async def fetch_latest_wti() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("WTI", "WTI Oil", interval="daily")

async def fetch_latest_brent() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("BRENT", "Brent Oil", interval="daily")

# --- New Commodity Indicators --- 
async def fetch_latest_natural_gas() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("NATURAL_GAS", "Natural Gas", interval="daily")

async def fetch_latest_copper() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("COPPER", "Copper", interval="daily")

async def fetch_latest_corn() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("CORN", "Corn", interval="daily")

async def fetch_latest_wheat() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("WHEAT", "Wheat", interval="daily")

async def fetch_latest_coffee() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("COFFEE", "Coffee", interval="daily")

async def fetch_latest_sugar() -> Optional[Tuple[str, str]]:
    # Use daily for latest price point
    return await _fetch_latest_commodity_or_rate("SUGAR", "Sugar", interval="daily") 