import aiohttp
import asyncio
import logging
import os
from typing import Dict, Optional, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception, wait_base

logger = logging.getLogger(__name__)

BASE_URL = "https://www.alphavantage.co/query"

# Read API key from environment variable, use provided key as fallback (WARN if used)
API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")
if not API_KEY:
    logger.warning("ALPHAVANTAGE_API_KEY environment variable not set. Using fallback key U5LFS0KFHCB69N6X. This is NOT recommended for production.")
    API_KEY = "U5LFS0KFHCB69N6X"

# --- Tenacity Retry Configuration --- 

def _should_retry_alpha_vantage(exception) -> bool:
    """Determine if we should retry based on the exception (aiohttp focus)."""
    if isinstance(exception, aiohttp.ClientResponseError):
        # Retry on 5xx server errors and 429 rate limiting
        if exception.status >= 500 or exception.status == 429:
            logger.warning(f"Retrying Alpha Vantage call due to status {exception.status}")
            return True
    if isinstance(exception, (aiohttp.ClientConnectionError, asyncio.TimeoutError)):
        logger.warning(f"Retrying Alpha Vantage call due to connection/timeout error: {type(exception)}")
        return True
    # Don't retry for other client errors (4xx except 429) or unexpected errors
    logger.error(f"Not retrying Alpha Vantage call for exception: {type(exception)}")
    return False

class _wait_with_retry_after(wait_base):
    """Custom wait strategy respecting Retry-After header, falling back to exponential."""
    def __init__(self, fallback):
        self.fallback = fallback

    def __call__(self, retry_state):
        exc = retry_state.outcome.exception()
        retry_after = None

        if isinstance(exc, aiohttp.ClientResponseError) and exc.status == 429:
            retry_after_str = exc.headers.get('Retry-After')
            if retry_after_str:
                try:
                    retry_after = int(retry_after_str) # AlphaVantage likely uses seconds
                    logger.info(f"Respecting Retry-After header: waiting {retry_after} seconds.")
                except ValueError:
                    logger.warning(f"Could not parse Retry-After header: {retry_after_str}")
                    # Could add HTTP date parsing here if needed

        if retry_after is not None and retry_after >= 0:
             return retry_after # Wait the specified time
        else:
            # Use the fallback (e.g., exponential backoff)
            return self.fallback(retry_state)

# Define the retry decorator
alpha_vantage_retry_decorator = retry(
    stop=stop_after_attempt(3),
    wait=_wait_with_retry_after(fallback=wait_exponential(multiplier=1, min=2, max=10)),
    retry=retry_if_exception(_should_retry_alpha_vantage),
    reraise=True # Reraise the exception if all retries fail
)

# --- Helper Function --- 
@alpha_vantage_retry_decorator
async def _fetch_alpha_vantage_data(function_name: str, params: Optional[Dict] = None) -> Optional[Dict]:
    """Generic function to fetch data from Alpha Vantage with retry logic."""
    if not API_KEY:
        logger.error("Alpha Vantage API key is missing.")
        return None

    url_params = {
        "function": function_name,
        "apikey": API_KEY,
        **(params or {})
    }

    # Keep original try/except but it will only run if retries fail (due to reraise=True)
    try:
        # Increased timeout slightly for potentially longer waits due to retries
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session: 
            logger.info(f"Fetching Alpha Vantage data for function: {function_name}")
            async with session.get(BASE_URL, params=url_params) as response:
                # Check for non-success status codes before raising
                if response.status >= 400:
                     logger.warning(f"Alpha Vantage HTTP error status: {response.status} for {function_name}")
                     # Let raise_for_status handle it to trigger retry logic if applicable
                response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
                data = await response.json()
                logger.debug(f"Alpha Vantage response for {function_name}: {str(data)[:200]}...")

                # Check for API error messages within the JSON response (after successful HTTP status)
                if isinstance(data, dict):
                    if "Error Message" in data:
                        logger.error(f"Alpha Vantage API Error (in JSON) for {function_name}: {data['Error Message']}")
                        return None # Don't retry logical API errors
                    if "Information" in data and "The standard API call frequency" in data["Information"]:
                         logger.warning(f"Alpha Vantage API rate limit likely hit (in JSON) for {function_name}. Details: {data['Information']}")
                         # Treat this as an error to potentially trigger retry if status was also bad, otherwise return None
                         # Depending on AV behavior, a 429 might be better, but sometimes they return 200 with info message
                         return None # Don't retry logical API rate limit messages if status was 200

                return data

    except aiohttp.ClientResponseError as e: # Explicitly catch for logging before reraise
        logger.error(f"HTTP Error after retries fetching Alpha Vantage ({function_name}): Status={e.status}, Message={e.message}")
        raise # Reraised by tenacity
    except aiohttp.ClientConnectionError as e:
        logger.error(f"Connection Error after retries fetching Alpha Vantage ({function_name}): {e}")
        raise
    except asyncio.TimeoutError:
        logger.error(f"Timeout Error after retries fetching Alpha Vantage ({function_name}).")
        raise
    except Exception as e: # Catch any other unexpected errors after retries
        logger.error(f"Unexpected error after retries fetching Alpha Vantage ({function_name}): {e}", exc_info=True)
        raise # Reraise the final exception

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