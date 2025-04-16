import asyncio
import json
import websockets
from typing import Dict, List, Deque
from datetime import datetime
from collections import deque
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
BINANCE_WS_URL = "wss://fstream.binance.com/ws" 
# Lower the backend threshold significantly to capture more trades
TRADE_THRESHOLD_USD = 1000  # Minimum $1k value to CAPTURE (frontend filters display)
MAX_STORED_TRADES = 100 # Maybe store more trades if threshold is lower
# Expand tracked symbols to include all potential selections
TRACKED_SYMBOLS = [
    # Top 10 (Example)
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
    # Top 3 Memes (Example)
    "SHIBUSDT", "PEPEUSDT", "WIFUSDT",
    'LTCUSDT',
    'MATICUSDT'
]

class TradeTracker:
    def __init__(self):
        self.recent_trades: Deque[Dict] = deque(maxlen=MAX_STORED_TRADES)
        self.ws: websockets.WebSocketClientProtocol | None = None
        self.running = False
        self.connecting = False
        self.reconnect_delay = 5 # Initial reconnect delay
        logger.info("TradeTracker initialized")
        
    async def _connect_websocket(self):
        if self.connecting or self.running:
            return
        self.connecting = True
        logger.info("TradeTracker: Attempting WebSocket connection...")
        try:
            # Create subscription message for trade streams
            streams = [f"{symbol.lower()}@trade" for symbol in TRACKED_SYMBOLS]
            subscribe_msg = {
                "method": "SUBSCRIBE",
                "params": streams,
                "id": 2 # Use a different ID than liquidation tracker if running concurrently
            }
            
            self.ws = await websockets.connect(BINANCE_WS_URL)
            await self.ws.send(json.dumps(subscribe_msg))
            
            # Wait for subscription confirmation (optional but good practice)
            response = await asyncio.wait_for(self.ws.recv(), timeout=10)
            logger.info(f"TradeTracker: Subscription response: {response}")
            
            self.running = True
            self.connecting = False
            self.reconnect_delay = 5 # Reset delay on successful connect
            logger.info("TradeTracker: Successfully connected to WebSocket and subscribed to trade streams.")
            
        except Exception as e:
            logger.error(f"TradeTracker: Error connecting to WebSocket: {e}")
            self.running = False
            self.connecting = False
            if self.ws:
                 try: await self.ws.close()
                 except: pass
                 self.ws = None
            # Schedule reconnect
            asyncio.create_task(self._reconnect())
            
    async def _process_trade(self, event: Dict):
        try:
            if event.get("e") != "trade":
                return
                
            symbol = event.get("s")
            if symbol not in TRACKED_SYMBOLS:
                return
                
            price = float(event.get("p", 0))
            quantity = float(event.get("q", 0))
            value_usd = price * quantity
            
            # Filter by threshold
            if value_usd < TRADE_THRESHOLD_USD:
                return
                
            trade = {
                "symbol": symbol,
                "side": "buy" if event.get("m", False) == False else "sell", # True if maker is seller (taker is buyer)
                "price": price,
                "quantity": quantity,
                "value_usd": value_usd,
                "time": datetime.fromtimestamp(event.get("T", 0) / 1000).isoformat() # Trade time
            }
            
            # Add to recent trades (deque handles maxlen)
            self.recent_trades.appendleft(trade) 
            # Log minimally to avoid spam
            # logger.info(f"TradeTracker: Processed large trade: {symbol} {trade['side']} {value_usd:.0f} USD")
            
        except Exception as e:
            logger.error(f"TradeTracker: Error processing trade event: {e} | Data: {event}", exc_info=True)
            
    async def _listen_trades(self):
        logger.info("TradeTracker: Listener task started.")
        while True:
            if not self.running:
                 logger.info("TradeTracker: Not running, attempting connection...")
                 await self._connect_websocket()
                 if not self.running: # Still not running after connect attempt
                      await asyncio.sleep(self.reconnect_delay)
                      continue
            try:
                if not self.ws:
                    logger.warning("TradeTracker: WebSocket is None, attempting reconnect...")
                    self.running = False
                    continue # Loop will trigger reconnect attempt

                message = await asyncio.wait_for(self.ws.recv(), timeout=60) # Add timeout
                event = json.loads(message)
                if "stream" in event: # Check if it's a stream wrapper
                     await self._process_trade(event.get("data", {}))
                else: # Assume direct event (less common for multi-stream)
                     await self._process_trade(event)
                
            except asyncio.TimeoutError:
                 logger.debug("TradeTracker: No message received in 60s, sending ping.")
                 try:
                     if self.ws:
                          await self.ws.ping()
                 except Exception as ping_err:
                      logger.warning(f"TradeTracker: Ping failed: {ping_err}. Assuming connection lost.")
                      self.running = False
                      if self.ws: 
                           try: await self.ws.close()
                           except: pass
                           self.ws = None
                 
            except websockets.exceptions.ConnectionClosed as e:
                logger.warning(f"TradeTracker: WebSocket connection closed ({e.code}), attempting reconnect...")
                self.running = False
                if self.ws: 
                     try: await self.ws.close()
                     except: pass
                     self.ws = None
                # Loop will trigger reconnect attempt

            except Exception as e:
                logger.error(f"TradeTracker: Error in WebSocket listener: {e}", exc_info=True)
                self.running = False
                if self.ws: 
                     try: await self.ws.close()
                     except: pass
                     self.ws = None
                # Loop will trigger reconnect attempt
                await asyncio.sleep(5) # Brief pause before potential reconnect

    async def _reconnect(self):
        await asyncio.sleep(self.reconnect_delay)
        self.reconnect_delay = min(60, self.reconnect_delay * 2) # Exponential backoff
        if not self.connecting and not self.running:
             logger.info(f"TradeTracker: Scheduling reconnect attempt after delay.")
             # The main loop will call _connect_websocket
        
    def get_recent_trades(self) -> List[Dict]:
        """Get the stored list of recent large trades."""
        # Return a thread-safe copy
        return list(self.recent_trades) 
        
    async def start(self):
        """Start the trade tracker background task."""
        if hasattr(self, '_listen_task') and not self._listen_task.done():
             logger.warning("TradeTracker: Start called but listener task already exists.")
             return
        logger.info("TradeTracker: Starting listener task.")
        self._listen_task = asyncio.create_task(self._listen_trades())
        # Attempt initial connection immediately (non-blocking)
        asyncio.create_task(self._connect_websocket())
        
    async def stop(self):
        """Stop the trade tracker."""
        logger.info("TradeTracker: Stopping...")
        self.running = False # Signal loop to stop trying
        if hasattr(self, '_listen_task') and not self._listen_task.done():
             self._listen_task.cancel()
             try: await self._listen_task
             except asyncio.CancelledError: logger.info("TradeTracker: Listener task cancelled.")
        if self.ws:
            await self.ws.close()
            self.ws = None
        logger.info("TradeTracker: Stopped.")

# --- Singleton Accessor ---
_trade_tracker_instance: TradeTracker | None = None
_trade_tracker_task: asyncio.Task | None = None # Explicitly manage the task

def get_trade_tracker() -> TradeTracker:
    global _trade_tracker_instance
    if _trade_tracker_instance is None:
        logger.info("Initializing TradeTracker singleton...")
        _trade_tracker_instance = TradeTracker()
    return _trade_tracker_instance

def start_trade_tracker():
    """Start the trade tracker listener task."""
    global _trade_tracker_task
    tracker = get_trade_tracker()
    # Check if task exists and is done, or doesn't exist
    if _trade_tracker_task is None or _trade_tracker_task.done():
        logger.info("Creating and starting TradeTracker listener task...")
        tracker.running = True # Ensure running flag is set before starting task
        _trade_tracker_task = asyncio.create_task(tracker._listen_trades(), name="trade_listener")
    elif not _trade_tracker_task.done():
         logger.warning("TradeTracker listener task is already running.")

def stop_trade_tracker():
    """Stops the trade tracker listener task and closes WebSocket."""
    global _trade_tracker_task
    logger.info("Attempting to stop TradeTracker...")
    tracker = get_trade_tracker()
    tracker.running = False # Signal the listening loop to stop attempts

    if _trade_tracker_task and not _trade_tracker_task.done():
        logger.info("Cancelling TradeTracker listener task...")
        _trade_tracker_task.cancel()
        # We don't necessarily need to await the cancellation here during shutdown
        # as the main server shutdown handles cleanup.
        _trade_tracker_task = None
        logger.info("TradeTracker listener task cancellation requested.")
    else:
        logger.info("TradeTracker task was not running or already stopped.")

    # Ensure WebSocket is closed if it exists
    if tracker.ws:
        logger.info("Closing TradeTracker WebSocket connection...")
        asyncio.create_task(tracker.ws.close()) # Fire-and-forget close
        tracker.ws = None
        logger.info("TradeTracker WebSocket close requested.")

def get_recent_large_trades() -> List[Dict]:
    """Public function to get recent trades from the singleton."""
    tracker = get_trade_tracker()
    return tracker.get_recent_trades() 