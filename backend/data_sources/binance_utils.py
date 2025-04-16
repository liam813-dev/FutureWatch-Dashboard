import aiohttp
import asyncio
import logging
from typing import List, Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception
from datetime import datetime

logger = logging.getLogger(__name__)

BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/24hr"
BINANCE_FUTURES_API_URL = "https://fapi.binance.com/fapi/v1"
TOP_N_SYMBOLS = 50

# --- Tenacity Retry Configuration (Copied from alpha_vantage.py, adjust names if needed) --- 

def _should_retry_binance(exception) -> bool:
    """Determine if we should retry based on the exception (aiohttp focus)."""
    if isinstance(exception, aiohttp.ClientResponseError):
        # Retry on 5xx server errors and 429 rate limiting (Binance uses 418 sometimes too for IP bans)
        if exception.status >= 500 or exception.status in [429, 418]:
            logger.warning(f"Retrying Binance call due to status {exception.status}")
            return True
    if isinstance(exception, (aiohttp.ClientConnectionError, asyncio.TimeoutError)):
        logger.warning(f"Retrying Binance call due to connection/timeout error: {type(exception)}")
        return True
    # Don't retry for other client errors or unexpected errors
    logger.error(f"Not retrying Binance call for exception: {type(exception)}")
    return False

# Custom wait strategy function
def _wait_binance_retry_after(retry_state):
    exc = retry_state.outcome.exception()
    retry_after = None
    if isinstance(exc, aiohttp.ClientResponseError) and exc.status in [429, 418]: # Check 418 too
        retry_after_str = exc.headers.get('Retry-After')
        if retry_after_str:
            try:
                retry_after = int(retry_after_str)
                logger.info(f"Respecting Retry-After header: waiting {retry_after} seconds.")
            except ValueError:
                logger.warning(f"Could not parse Retry-After header: {retry_after_str}")

    if retry_after is not None and retry_after >= 0:
        return retry_after
    else:
        base_wait = 2
        multiplier = 1
        max_wait = 15 # Keep slightly higher max for Binance
        current_attempt = retry_state.attempt_number
        calculated_wait = min(max_wait, base_wait * (multiplier ** (current_attempt -1)))
        logger.info(f"No Retry-After header or invalid. Using calculated backoff: {calculated_wait}s")
        return calculated_wait

# Define the retry decorator for Binance calls
binance_retry_decorator = retry(
    stop=stop_after_attempt(4),
    wait=_wait_binance_retry_after, # Use the custom function
    retry=retry_if_exception(_should_retry_binance),
    reraise=True
)

@binance_retry_decorator
async def get_top_symbols_from_binance(top_n: int = TOP_N_SYMBOLS) -> List[str]:
    """Fetches 24hr ticker data from Binance, sorts by quote volume, 
       and returns the top N USDT pair symbols (without 'USDT'). Includes retry logic."""
    symbols = []
    # Keep original try/except for non-retryable errors or after retries fail
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
            logger.info(f"Fetching ticker data from {BINANCE_API_URL}...")
            async with session.get(BINANCE_API_URL) as response:
                 # Check for non-success status codes before raising
                if response.status >= 400:
                    logger.warning(f"Binance HTTP error status: {response.status}")
                response.raise_for_status() # Raise exception for bad status codes (triggers retry)
                data = await response.json()
                logger.info(f"Successfully fetched {len(data)} tickers from Binance.")

                if not isinstance(data, list):
                    logger.error(f"Unexpected data format from Binance API: {type(data)}")
                    return [] # Return empty on unexpected format, don't retry

                # Filter for USDT pairs and sort by quote volume (descending)
                usdt_pairs = [t for t in data if isinstance(t, dict) and t.get('symbol', '').endswith('USDT')]
                
                # Sort by quoteVolume (convert to float for safety)
                usdt_pairs.sort(key=lambda x: float(x.get('quoteVolume', 0)), reverse=True)

                # Extract top N symbols and remove 'USDT' suffix
                symbols = [pair.get('symbol', '').replace('USDT', '') 
                           for pair in usdt_pairs[:top_n] 
                           if pair.get('symbol')]
                
                logger.info(f"Extracted top {len(symbols)} USDT symbols by volume.")

    except aiohttp.ClientResponseError as e:
        logger.error(f"HTTP Error after retries fetching Binance tickers: Status={e.status}, Message={e.message}")
        raise
    except aiohttp.ClientConnectionError as e:
        logger.error(f"Connection Error after retries fetching Binance tickers: {e}")
        raise
    except asyncio.TimeoutError:
        logger.error("Timeout Error after retries fetching Binance tickers.")
        raise
    except Exception as e:
        logger.error(f"Unexpected error after retries fetching/processing Binance tickers: {e}", exc_info=True)
        raise # Reraise after logging unexpected errors

    # Return the extracted symbols or an empty list if processing failed after successful fetch
    # (Errors during fetch are reraised by tenacity or the except blocks above)
    return symbols 

@binance_retry_decorator
async def get_funding_rates() -> Dict[str, float]:
    """
    Fetch funding rates from Binance for all perpetual futures.
    Returns a dictionary mapping symbol to funding rate.
    """
    try:
        async with aiohttp.ClientSession() as session:
            # Get all perpetual futures symbols
            async with session.get("https://fapi.binance.com/fapi/v1/exchangeInfo") as response:
                if response.status != 200:
                    logger.error(f"Failed to get exchange info: {response.status}")
                    return {}
                
                data = await response.json()
                symbols = [s["symbol"] for s in data["symbols"] if s["contractType"] == "PERPETUAL"]
                
                # Get funding rates for all symbols
                async with session.get("https://fapi.binance.com/fapi/v1/premiumIndex") as response:
                    if response.status != 200:
                        logger.error(f"Failed to get funding rates: {response.status}")
                        return {}
                    
                    data = await response.json()
                    funding_rates = {
                        item["symbol"]: float(item["lastFundingRate"]) 
                        for item in data 
                        if item["symbol"] in symbols
                    }
                    
                    logger.info(f"Successfully fetched funding rates for {len(funding_rates)} pairs")
                    return funding_rates
                    
    except Exception as e:
        logger.error(f"Error fetching funding rates: {e}")
        return {} 