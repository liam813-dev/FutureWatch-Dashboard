from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from services.deribit_options import get_btc_options, filter_options

router = APIRouter(prefix="/options", tags=["options"])

@router.get("/btc")
async def get_btc_options_data(
    option_type: Optional[str] = Query(None, description="Filter by option type (call or put)"),
    min_strike: Optional[float] = Query(None, description="Minimum strike price"),
    max_strike: Optional[float] = Query(None, description="Maximum strike price"),
    expiry_date: Optional[str] = Query(None, description="Filter by specific expiry date (YYYY-MM-DD)"),
    include_expired: bool = Query(False, description="Include expired options")
) -> Dict[str, Any]:
    """
    Get BTC options data from Deribit API with optional filtering
    """
    # Fetch options data from Deribit
    result = get_btc_options(expired=include_expired)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Apply filters if provided
    if any([option_type, min_strike is not None, max_strike is not None, expiry_date]):
        filtered_data = filter_options(
            result["data"], 
            option_type=option_type, 
            min_strike=min_strike, 
            max_strike=max_strike, 
            expiry_date=expiry_date
        )
        
        result["data"] = filtered_data
        result["count"] = len(filtered_data)
        result["filtered"] = True
    
    return result 