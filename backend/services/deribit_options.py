import requests
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

DERIBIT_API_URL = "https://www.deribit.com/api/v2/public"

def get_btc_options(expired: bool = False) -> Dict[str, Any]:
    """
    Fetch BTC options data from Deribit API
    
    Args:
        expired: Whether to include expired options (default: False)
        
    Returns:
        Dictionary with options data or error information
    """
    try:
        endpoint = f"{DERIBIT_API_URL}/get_instruments"
        params = {
            "currency": "BTC",
            "kind": "option",
            "expired": "true" if expired else "false"
        }
        
        response = requests.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("result"):
            # Process the data to extract only the relevant fields
            processed_options = []
            for option in data["result"]:
                processed_options.append({
                    "instrument_name": option.get("instrument_name"),
                    "expiration_timestamp": option.get("expiration_timestamp"),
                    # Format expiration timestamp as human-readable date
                    "expiration_date": datetime.fromtimestamp(
                        option.get("expiration_timestamp") / 1000
                    ).strftime("%Y-%m-%d") if option.get("expiration_timestamp") else None,
                    "strike": option.get("strike"),
                    "option_type": option.get("option_type"),
                    "settlement_period": option.get("settlement_period"),
                    "quote_currency": option.get("quote_currency"),
                    "base_currency": option.get("base_currency"),
                    "is_active": option.get("is_active", False),
                    "creation_timestamp": option.get("creation_timestamp"),
                    "expiring_soon": is_expiring_soon(option.get("expiration_timestamp"))
                })
            
            return {
                "success": True,
                "data": processed_options,
                "count": len(processed_options)
            }
        else:
            return {
                "success": False,
                "error": "No result found in the API response",
                "data": []
            }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching from Deribit API: {str(e)}")
        return {
            "success": False,
            "error": f"API request failed: {str(e)}",
            "data": []
        }
    except Exception as e:
        logger.error(f"Unexpected error processing Deribit data: {str(e)}")
        return {
            "success": False,
            "error": f"Processing error: {str(e)}",
            "data": []
        }

def is_expiring_soon(expiration_timestamp: Optional[int]) -> bool:
    """
    Check if an option is expiring within the next 7 days
    
    Args:
        expiration_timestamp: The expiration timestamp in milliseconds
        
    Returns:
        True if the option expires within the next 7 days, False otherwise
    """
    if not expiration_timestamp:
        return False
        
    now_ms = int(datetime.now().timestamp() * 1000)
    diff_ms = expiration_timestamp - now_ms
    diff_days = diff_ms / (1000 * 60 * 60 * 24)
    
    return 0 <= diff_days <= 7

def filter_options(
    options: List[Dict[str, Any]], 
    option_type: Optional[str] = None,
    min_strike: Optional[float] = None,
    max_strike: Optional[float] = None,
    expiry_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Filter options based on specified criteria
    
    Args:
        options: List of option dictionaries
        option_type: Filter by option type (call or put)
        min_strike: Minimum strike price
        max_strike: Maximum strike price
        expiry_date: Filter by specific expiry date (format: YYYY-MM-DD)
        
    Returns:
        Filtered list of options
    """
    result = options

    if option_type:
        option_type = option_type.lower()
        result = [opt for opt in result if opt.get("option_type", "").lower() == option_type]
    
    if min_strike is not None:
        result = [opt for opt in result if opt.get("strike", 0) >= min_strike]
    
    if max_strike is not None:
        result = [opt for opt in result if opt.get("strike", 0) <= max_strike]
    
    if expiry_date:
        result = [opt for opt in result if opt.get("expiration_date") == expiry_date]
    
    return result 