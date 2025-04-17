import asyncio
import json
import websockets
from typing import Dict, List, Deque
from datetime import datetime, timedelta
from collections import deque
import logging
import random
import time
import uuid  # Added for generating unique IDs

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
BINANCE_WS_URL = "wss://fstream.binance.com/ws"
MAX_STORED_TRADES = 1000
TRADE_THRESHOLD_USD = 1000  # Increased threshold to $1000 to capture more significant trades
TRACKED_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
    "MATICUSDT", "LTCUSDT", "SHIBUSDT", "NEARUSDT", "ATOMUSDT",
    "AAVEUSDT", "UNIUSDT", "ARBUSDT", "OPUSDT", "SUIUSDT"
]

# Default price dictionary for simulated data
DEFAULT_PRICES = {
    "BTCUSDT": 84500.00,
    "ETHUSDT": 3000.00,
    "SOLUSDT": 150.00,
    "BNBUSDT": 600.00,
    "XRPUSDT": 0.50,
    "ADAUSDT": 0.45,
    "DOGEUSDT": 0.15,
    "AVAXUSDT": 35.00,
    "DOTUSDT": 7.50,
    "LINKUSDT": 15.00,
    "MATICUSDT": 0.70,
    "LTCUSDT": 80.00,
    "SHIBUSDT": 0.000025,
    "NEARUSDT": 5.50,
    "ATOMUSDT": 9.00,
    "AAVEUSDT": 90.00,
    "UNIUSDT": 8.50,
    "ARBUSDT": 1.20,
    "OPUSDT": 2.50,
    "SUIUSDT": 1.75
}

class TradeTracker:
    def __init__(self):
        self.recent_trades: Deque[Dict] = deque(maxlen=MAX_STORED_TRADES)
        self.ws: websockets.WebSocketClientProtocol | None = None
        self.running = False
        self.connecting = False
        self.reconnect_delay = 5 # Initial reconnect delay
        self.max_reconnect_delay = 300 # Maximum delay of 5 minutes
        self.connection_attempts = 0
        self.max_connection_attempts = 10
        self.last_message_time = 0
        self.health_check_interval = 30 # Health check every 30 seconds
        self.ping_interval = 20 # Ping every 20 seconds
        self.ping_timeout = 10 # 10 second timeout for pings
        self.last_real_trade_time = 0 # Track when we last got a real trade
        self.generate_fallback_data = True # Flag to enable fallback data generation
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
            
            # Add timeout to connection attempt
            self.ws = await asyncio.wait_for(
                websockets.connect(
                    BINANCE_WS_URL,
                    ping_interval=self.ping_interval,
                    ping_timeout=self.ping_timeout,
                    close_timeout=10
                ),
                timeout=10
            )
            
            # Send subscription message with timeout
            await asyncio.wait_for(self.ws.send(json.dumps(subscribe_msg)), timeout=5)
            
            # Wait for subscription confirmation with timeout
            response = await asyncio.wait_for(self.ws.recv(), timeout=10)
            logger.info(f"TradeTracker: Subscription response: {response}")
            
            self.running = True
            self.connecting = False
            self.reconnect_delay = 5 # Reset delay on successful connect
            self.connection_attempts = 0 # Reset connection attempts
            self.last_message_time = time.time()
            logger.info("TradeTracker: Successfully connected to WebSocket and subscribed to trade streams.")
            
        except asyncio.TimeoutError:
            logger.error("TradeTracker: Connection attempt timed out")
            self._handle_connection_failure()
        except Exception as e:
            logger.error(f"TradeTracker: Error connecting to WebSocket: {e}")
            self._handle_connection_failure()
            
    def _handle_connection_failure(self):
        """Handle WebSocket connection failure and schedule reconnect"""
        self.running = False
        self.connecting = False
        if self.ws:
            try: 
                asyncio.create_task(self.ws.close())
            except: 
                pass
            self.ws = None
            
        self.connection_attempts += 1
        if self.connection_attempts >= self.max_connection_attempts:
            logger.error("TradeTracker: Max connection attempts reached, giving up")
            return
            
        # Exponential backoff with jitter
        self.reconnect_delay = min(
            self.max_reconnect_delay,
            self.reconnect_delay * 2 + (random.random() * 2) # Add some jitter
        )
        logger.info(f"TradeTracker: Scheduling reconnect in {self.reconnect_delay:.1f} seconds")
        asyncio.create_task(self._reconnect())
        
    async def _health_check(self):
        """Periodic health check of the WebSocket connection"""
        while self.running:
            try:
                current_time = time.time()
                if current_time - self.last_message_time > self.health_check_interval:
                    logger.warning("TradeTracker: No messages received recently, checking connection...")
                    if self.ws:
                        try:
                            await self.ws.ping()
                            logger.info("TradeTracker: Health check ping successful")
                        except Exception as e:
                            logger.error(f"TradeTracker: Health check failed: {e}")
                            self.running = False
                            if self.ws:
                                try: await self.ws.close()
                                except: pass
                                self.ws = None
                            break
                
                # Check if we should generate fallback data
                if self.generate_fallback_data and (current_time - self.last_real_trade_time > 30):
                    # Generate a fallback trade every 5-10 seconds
                    await self._generate_fallback_trade()
                    
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                logger.error(f"TradeTracker: Error in health check: {e}")
                await asyncio.sleep(5)
    
    async def _generate_fallback_trade(self):
        """Generate fallback trade data for development purposes"""
        try:
            # Only generate fallback data if we haven't received a real trade in a while
            current_time = time.time()
            if not self.generate_fallback_data or (current_time - self.last_real_trade_time < 30):
                return
                
            # Choose a random symbol
            symbol = random.choice(TRACKED_SYMBOLS)
            
            # Get base price for the symbol
            base_price = DEFAULT_PRICES.get(symbol, 1000)
            
            # Randomize the price slightly (±1%)
            price_variation = random.uniform(-0.01, 0.01) * base_price
            price = base_price + price_variation
            
            # Generate a random quantity (larger for more expensive coins)
            if price > 10000:  # BTC
                quantity = random.uniform(0.2, 5)
            elif price > 1000:  # ETH
                quantity = random.uniform(1, 20)
            elif price > 100:   # SOL, BNB
                quantity = random.uniform(5, 50)
            elif price > 10:    # LINK, DOT
                quantity = random.uniform(50, 500)
            elif price > 1:     # ADA, MATIC
                quantity = random.uniform(1000, 10000)
            else:               # SHIB
                quantity = random.uniform(100000, 10000000)
                
            # Calculate value in USD
            value_usd = price * quantity
            
            # Ensure the trade is above threshold
            while value_usd < TRADE_THRESHOLD_USD:
                quantity *= 2
                value_usd = price * quantity
            
            # Current time as ISO format
            timestamp = datetime.now().isoformat()
                
            # Create a simulated trade
            trade = {
                "id": f"{symbol}-{timestamp}-{uuid.uuid4().hex[:8]}",
                "symbol": symbol,
                "side": random.choice(["buy", "sell"]),
                "price": price,
                "quantity": quantity,
                "value_usd": value_usd,
                "time": timestamp,
                "coin": symbol.replace("USDT", "")
            }
            
            # Add to recent trades
            self.recent_trades.appendleft(trade)
            self.last_real_trade_time = time.time()  # Update the last real trade time
            logger.info(f"TradeTracker: Generated fallback trade: {symbol} {trade['side']} {value_usd:.0f} USD")
            
        except Exception as e:
            logger.error(f"TradeTracker: Error generating fallback trade: {e}")
                
    async def _process_trade(self, event: Dict):
        try:
            # Log raw event for debugging
            logger.debug(f"TradeTracker: Received event: {event}")
            
            # Handle both stream wrapper and direct event formats
            if "stream" in event:
                event = event.get("data", {})
            
            if event.get("e") != "trade":
                logger.debug(f"TradeTracker: Ignoring non-trade event: {event.get('e')}")
                return
                
            symbol = event.get("s")
            if not symbol or symbol not in TRACKED_SYMBOLS:
                logger.debug(f"TradeTracker: Ignoring untracked symbol: {symbol}")
                return
                
            # Extract and validate numeric fields
            try:
                price = float(event.get("p", 0))
                quantity = float(event.get("q", 0))
                value_usd = price * quantity
                
                if price <= 0 or quantity <= 0:
                    logger.debug(f"TradeTracker: Invalid price or quantity: {price}, {quantity}")
                    return
            except (ValueError, TypeError) as e:
                logger.warning(f"TradeTracker: Error parsing numeric fields: {e}")
                return
            
            # Log trade details for debugging
            logger.debug(f"TradeTracker: Processing trade - Symbol: {symbol}, Price: {price}, Quantity: {quantity}, Value: {value_usd}")
            
            # Filter by threshold
            if value_usd < TRADE_THRESHOLD_USD:
                logger.debug(f"TradeTracker: Ignoring small trade: {symbol} {value_usd:.2f} USD (below threshold)")
                return
                
            # Create standardized trade object
            trade = {
                "symbol": symbol,
                "side": "buy" if event.get("m", False) == False else "sell", # True if maker is seller (taker is buyer)
                "price": price,
                "quantity": quantity,
                "value_usd": value_usd,
                "time": datetime.fromtimestamp(event.get("T", 0) / 1000).isoformat(), # Trade time
                "coin": symbol.replace("USDT", "") # Add coin field for frontend
            }
            
            # Add to recent trades (deque handles maxlen)
            self.recent_trades.appendleft(trade) 
            self.last_real_trade_time = time.time()  # Update the last real trade time
            logger.info(f"TradeTracker: Processed large trade: {symbol} {trade['side']} {value_usd:.0f} USD at {trade['time']}")
            
        except Exception as e:
            logger.error(f"TradeTracker: Error processing trade event: {e} | Data: {event}", exc_info=True)
            
    async def _listen_trades(self):
        logger.info("TradeTracker: Listener task started.")
        # Start health check task
        health_check_task = asyncio.create_task(self._health_check())
        
        # Generate initial fallback trades to ensure UI has data immediately
        if self.generate_fallback_data:
            logger.info("TradeTracker: Generating initial set of fallback trades.")
            for _ in range(10):
                await self._generate_fallback_trade()
        
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
                self.last_message_time = time.time() # Update last message time
                event = json.loads(message)
                
                # Log raw message for debugging
                logger.debug(f"TradeTracker: Received message: {message[:200]}...") # Log first 200 chars
                
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
                
        # Cleanup health check task
        health_check_task.cancel()
        try:
            await health_check_task
        except asyncio.CancelledError:
            pass

    async def _reconnect(self):
        await asyncio.sleep(self.reconnect_delay)
        self.reconnect_delay = min(60, self.reconnect_delay * 2) # Exponential backoff
        if not self.connecting and not self.running:
             logger.info(f"TradeTracker: Scheduling reconnect attempt after delay.")
             # The main loop will call _connect_websocket
        
    def get_recent_trades(self) -> List[Dict]:
        """Get the stored list of recent large trades."""
        # Return a thread-safe copy with standardized format
        trades = []
        for trade in self.recent_trades:
            try:
                # Ensure all required fields are present and properly formatted
                std_trade = {
                    "symbol": str(trade.get("symbol", "")),
                    "coin": str(trade.get("coin", trade.get("symbol", "").replace("USDT", ""))),
                    "side": str(trade.get("side", "")).lower(),
                    "price": float(trade.get("price", 0)),
                    "quantity": float(trade.get("quantity", 0)),
                    "value_usd": float(trade.get("value_usd", 0)),
                    "time": str(trade.get("time", "")),
                    "timestamp": str(trade.get("time", "")) # Add timestamp field
                }
                
                # Generate a unique ID for the frontend
                std_trade["id"] = trade.get("id") or f"{std_trade['symbol']}-{std_trade['time']}-{uuid.uuid4().hex[:8]}"
                
                # Add the trade to the list
                trades.append(std_trade)
            except Exception as e:
                logger.warning(f"Error standardizing trade: {e}")
                
        # Log number of trades returned
        logger.info(f"TradeTracker: Returning {len(trades)} recent trades")
        return trades
        
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