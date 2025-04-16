import aiohttp
import asyncio
import logging
from typing import List

logger = logging.getLogger(__name__)

BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/24hr"
TOP_N_SYMBOLS = 50

async def get_top_symbols_from_binance(top_n: int = TOP_N_SYMBOLS) -> List[str]:
    """Fetches 24hr ticker data from Binance, sorts by quote volume, 
       and returns the top N USDT pair symbols (without 'USDT')."""
    symbols = []
    try:
        async with aiohttp.ClientSession() as session:
            logger.info(f"Fetching ticker data from {BINANCE_API_URL}...")
            async with session.get(BINANCE_API_URL) as response:
                response.raise_for_status() # Raise exception for bad status codes
                data = await response.json()
                logger.info(f"Successfully fetched {len(data)} tickers from Binance.")

                if not isinstance(data, list):
                    logger.error(f"Unexpected data format from Binance API: {type(data)}")
                    return []

                # Filter for USDT pairs and sort by quote volume (descending)
                usdt_pairs = [t for t in data if isinstance(t, dict) and t.get('symbol', '').endswith('USDT')]
                
                # Sort by quoteVolume (convert to float for safety)
                usdt_pairs.sort(key=lambda x: float(x.get('quoteVolume', 0)), reverse=True)

                # Extract top N symbols and remove 'USDT' suffix
                symbols = [pair.get('symbol', '').replace('USDT', '') 
                           for pair in usdt_pairs[:top_n] 
                           if pair.get('symbol')]
                
                logger.info(f"Extracted top {len(symbols)} USDT symbols by volume.")

    except aiohttp.ClientError as e:
        logger.error(f"HTTP Client Error fetching Binance tickers: {e}")
    except asyncio.TimeoutError:
        logger.error("Timeout Error fetching Binance tickers.")
    except Exception as e:
        logger.error(f"Unexpected error fetching or processing Binance tickers: {e}", exc_info=True)

    # Return the extracted symbols or an empty list on error
    if not symbols:
         logger.warning("Returning empty list of symbols due to fetch/processing error.")
    return symbols 