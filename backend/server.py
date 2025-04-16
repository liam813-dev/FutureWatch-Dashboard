import asyncio
import logging
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any, Union
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging import setup_logging
from data_aggregator import gather_dashboard_data
from data_sources.hyperliquid import get_hyperliquid_service
from data_sources.liquidations import start_liquidation_tracker, get_liquidations_data, stop_liquidation_tracker
from data_sources.trades import start_trade_tracker, stop_trade_tracker
from data_sources.binance_utils import get_top_symbols_from_binance
from data_sources.alpha_vantage import (
    fetch_latest_cpi,
    fetch_latest_fed_funds_rate,
    fetch_latest_unemployment,
    fetch_latest_wti,
    fetch_latest_brent,
    fetch_latest_natural_gas,
    fetch_latest_copper,
    fetch_latest_corn,
    fetch_latest_wheat,
    fetch_latest_coffee,
    fetch_latest_sugar
)
from app.models.schemas import ApiResponse, DashboardData, MacroData, MacroDataPoint
from shared_state import macro_data_cache
import aiohttp
from fastapi.responses import JSONResponse
from routers.options import router as options_router
import traceback

# Initialize logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[*settings.BACKEND_CORS_ORIGINS, "*"],  # Add wildcard for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(options_router, prefix="/api")

# Error handling middleware
class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(f"Unhandled error: {str(e)}")
            return Response(
                content={"error": "Internal server error"},
                status_code=500
            )

app.add_middleware(ErrorHandlingMiddleware)

# Store active WebSocket connections
active_connections: List[WebSocket] = []

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
            logger.info(f"New client connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                logger.info(f"Client disconnected. Remaining connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        if not self.active_connections:
            return
        
        async with self._lock:
            dead_connections = []
            for connection in self.active_connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {str(e)}")
                    dead_connections.append(connection)
            
            # Clean up dead connections
            for dead_connection in dead_connections:
                if dead_connection in self.active_connections:
                    self.active_connections.remove(dead_connection)
                    logger.info(f"Removed dead connection. Remaining: {len(self.active_connections)}")

manager = ConnectionManager()

# --- Global State --- 
# Store the fetched symbols globally
top_symbols: List[str] = []
# Remove Redis client instance
# redis_client: Optional[redis.Redis] = None 
# Remove Redis key constant
# DASHBOARD_DATA_KEY = "dashboard_data" 

# --- Startup and Shutdown Events ---
# Bring back broadcast task variable
broadcast_task = None

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/data")
async def get_data():
    """API endpoint to get dashboard data"""
    # Revert to direct data fetching
    try:
        data = await gather_dashboard_data()
        return data
    except Exception as e:
        logger.error(f"Error in get_data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/symbols", response_model=List[str])
async def get_symbols():
    """Returns the list of top symbols fetched from Binance on startup."""
    if not top_symbols:
         logger.warning("Serving empty symbol list as it wasn't populated on startup.")
    return top_symbols

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for any message from the client to keep connection alive
            data = await websocket.receive_text()
            logger.debug(f"Received message from client: {data}")
    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
        await manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}\n{traceback.format_exc()}")
        await manager.disconnect(websocket)
    finally:
        # Ensure cleanup happens even if we get an unexpected error
        if websocket in manager.active_connections:
            await manager.disconnect(websocket)

# Bring back the data broadcasting loop
async def broadcast_data():
    while True:
        try:
            # Gather dashboard data
            dashboard_data = await gather_dashboard_data()
            logger.info("Dashboard data prepared")
            
            # Broadcast to all connected clients
            await manager.broadcast(dashboard_data)
            logger.debug("Data broadcast completed")
            
        except Exception as e:
            logger.error(f"Error in broadcast loop: {str(e)}\n{traceback.format_exc()}")
        
        # Always wait before next iteration, even if we had an error
        await asyncio.sleep(1) # Consider making this interval configurable

async def fetch_and_cache_macro_data():
    """Fetches all macro data points and caches them in shared_state."""
    global macro_data_cache
    # Warn about rate limits
    logger.warning("Fetching multiple Alpha Vantage endpoints. Be mindful of the 25 requests/day free limit.")
    logger.info("Fetching initial macro & commodity data from Alpha Vantage...")
    
    # Fetch all data points concurrently
    results = await asyncio.gather(
        fetch_latest_cpi(),
        fetch_latest_fed_funds_rate(),
        fetch_latest_unemployment(),
        fetch_latest_wti(),
        fetch_latest_brent(),
        fetch_latest_natural_gas(),
        fetch_latest_copper(),
        fetch_latest_corn(),
        fetch_latest_wheat(),
        fetch_latest_coffee(),
        fetch_latest_sugar(),
        return_exceptions=True # Return exceptions instead of raising them
    )
    
    # Unpack results, handling potential errors
    cpi_res, fed_res, unemp_res, wti_res, brent_res, ng_res, copper_res, corn_res, wheat_res, coffee_res, sugar_res = \
        [(r if isinstance(r, tuple) else r) for r in results] # Keep exceptions as is, tuples as is

    def create_point(name: str, result: Optional[Union[Tuple[str, str], Exception]]) -> Optional[MacroDataPoint]:
        """Tries to create a MacroDataPoint from fetch result. Handles errors.
        
        Args:
            name: Name of the data point (e.g., 'CPI')
            result: Output from fetch function - Tuple(date_str, value_str), None, or Exception.

        Returns:
            MacroDataPoint if successful, None otherwise.
        """
        if isinstance(result, Exception):
            logger.warning(f"Failed to fetch {name}: {result}")
            return None
        elif result is None:
            logger.warning(f"No data received for {name} (likely rate limited or API error).")
            return None
        elif isinstance(result, tuple) and len(result) == 2:
            date_str, value_str = result
            try:
                # Attempt to parse date and value
                timestamp_dt = datetime.strptime(date_str, '%Y-%m-%d')
                value_float = float(value_str)
                return MacroDataPoint(timestamp=timestamp_dt, value=value_float)
            except (ValueError, TypeError) as e:
                logger.error(f"Error parsing data for {name}: Date='{date_str}', Value='{value_str}'. Error: {e}")
                return None
        else:
            logger.error(f"Unexpected result format for {name}: {result}")
            return None

    # Create points, handling None returns
    cpi_point = create_point("CPI (Monthly)", cpi_res)
    fed_point = create_point("Fed Rate (Daily)", fed_res)
    unemp_point = create_point("Unemployment (Monthly)", unemp_res)
    wti_point = create_point("WTI Oil (Daily)", wti_res)
    brent_point = create_point("Brent Oil (Daily)", brent_res)
    ng_point = create_point("Natural Gas (Daily)", ng_res)
    copper_point = create_point("Copper (Daily)", copper_res)
    corn_point = create_point("Corn (Daily)", corn_res)
    wheat_point = create_point("Wheat (Daily)", wheat_res)
    coffee_point = create_point("Coffee (Daily)", coffee_res)
    sugar_point = create_point("Sugar (Daily)", sugar_res)

    # Assign to cache, using None if creation failed
    macro_data_cache = MacroData(
        cpi=cpi_point,
        fed_rate=fed_point,
        unemployment=unemp_point,
        wti_oil=wti_point,
        brent_oil=brent_point,
        natural_gas=ng_point,
        copper=copper_point,
        corn=corn_point,
        wheat=wheat_point,
        coffee=coffee_point,
        sugar=sugar_point
    )
    logger.info("Finished fetching macro & commodity data.")

@app.on_event("startup")
async def startup_event():
    global broadcast_task, top_symbols # Add broadcast_task back
    logger.info("--- LOG: Server starting up... --- ")
    
    # Remove Redis Connection Init
    # redis_client = get_redis_connection()
    # if not redis_client:
    #      logger.warning("Redis connection failed on startup. /api/data endpoint will not function.")

    # Initialize Hyperliquid Service (async)
    logger.info("Initializing Hyperliquid Service...")
    await get_hyperliquid_service() 
    logger.info("Hyperliquid Service initialization requested.")

    # Fetch symbols (async)
    logger.info("Fetching top symbols from Binance...")
    top_symbols = await get_top_symbols_from_binance() 
    if top_symbols:
        logger.info(f"Successfully fetched {len(top_symbols)} symbols: {top_symbols[:5]}...")
    else:
        logger.warning("Failed to fetch top symbols from Binance.")
        # Consider using a default list or handling the error more robustly
        top_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] # Example default
        logger.info(f"Using default symbols: {top_symbols}")
    
    # Fetch initial macro data (async, fire-and-forget or await if critical for startup)
    asyncio.create_task(fetch_and_cache_macro_data())
    logger.info("Macro data fetching task scheduled.")
    
    # Start background WebSocket listeners
    logger.info("Starting background Liquidation Tracker...")
    start_liquidation_tracker() 
    logger.info("Starting background Trade Tracker...")
    start_trade_tracker() 

    # Bring back scheduling of broadcast_data
    logger.info("Starting broadcast task...")
    if broadcast_task is None:
         broadcast_task = asyncio.create_task(broadcast_data())
         logger.info("Dashboard data broadcast task started.")

@app.on_event("shutdown")
async def shutdown_event():
    global broadcast_task # Add broadcast_task back
    logger.info("--- LOG: Server shutting down... --- ")

    # Bring back cancellation of broadcast_task
    if broadcast_task:
        logger.info("Cancelling broadcast task...")
        broadcast_task.cancel()
        try:
            await broadcast_task
        except asyncio.CancelledError:
            logger.info("Broadcast task cancelled successfully.")
        except Exception as e:
             logger.error(f"Error during broadcast task cancellation: {e}")
            
    logger.info("Stopping liquidation tracker...")
    await stop_liquidation_tracker()
    logger.info("Liquidation tracker stopped.")
    
    logger.info("Stopping trade tracker...")
    await stop_trade_tracker()
    logger.info("Trade tracker stopped.")
    
    # Close WebSocket connections gracefully
    logger.info(f"Closing {len(manager.active_connections)} WebSocket connections...")
    tasks = [conn.close() for conn in manager.active_connections]
    await asyncio.gather(*tasks, return_exceptions=True)
    logger.info("WebSocket connections closed.")

    # Clean up Hyperliquid service (ensure this is present if needed)
    logger.info("Stopping Hyperliquid Service...")
    hyperliquid_service = await get_hyperliquid_service() # Get instance
    if hyperliquid_service: # Check if it was initialized
        await hyperliquid_service.stop() # Call its stop method
        logger.info("Hyperliquid Service stopped.")
    else:
        logger.warning("Hyperliquid service instance not found during shutdown.")

    logger.info("--- LOG: Server shutting down... --- ")

@app.get("/api/macro", response_model=Optional[MacroData])
async def get_macro_data():
    return macro_data_cache

@app.get("/api/coindesk/events")
async def get_coindesk_events(
    asset: str, 
    asset_lookup_priority: str = "SYMBOL", 
    limit: int = 30, 
    to_ts: Optional[int] = None
):
    """
    Proxy endpoint for CoinDesk Asset Events API
    """
    COINDESK_API_BASE_URL = "https://data-api.coindesk.com/asset/v1"
    # Get API key from environment or use a placeholder for logging
    API_KEY = os.environ.get("COINDESK_API_KEY", "API_KEY_HIDDEN")
    
    # Build the query parameters
    params = {
        "asset": asset,
        "asset_lookup_priority": asset_lookup_priority,
        "limit": limit
    }
    
    if to_ts:
        params["to_ts"] = to_ts
    
    url = f"{COINDESK_API_BASE_URL}/events"
    
    try:
        logger.info(f"Proxying CoinDesk API request for asset: {asset}, limit: {limit}")
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url, 
                params=params,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"CoinDesk API error: {response.status} - {error_text}")
                    return JSONResponse(
                        status_code=response.status,
                        content={"error": f"CoinDesk API error: {response.status}"}
                    )
                
                data = await response.json()
                logger.info(f"Successfully proxied CoinDesk API request for {asset}. Received {len(data.get('data', []))} events.")
                return data
                
    except Exception as e:
        logger.error(f"Error proxying CoinDesk API request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error proxying CoinDesk API request: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server on http://0.0.0.0:8001")
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
