import asyncio
import json
import websockets
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import deque
import logging
import random  # For simulated data

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BINANCE_WS_URL = "wss://fstream.binance.com/ws"  # Binance Futures WebSocket URL
MIN_LIQUIDATION_VALUE = 500  # Lower threshold to capture more events ($500 minimum)
MAX_STORED_LIQUIDATIONS = 1000
# Expanded list of tracked symbols
TRACKED_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT",
    "MATICUSDT", "LTCUSDT", "SHIBUSDT", "NEARUSDT", "ATOMUSDT",
    "AAVEUSDT", "UNIUSDT", "ARBUSDT", "OPUSDT", "SUIUSDT"
]
LIQUIDATION_WINDOW_HOURS = 48
ENABLE_FALLBACK_DATA = True  # Enable fallback simulated data
FALLBACK_INTERVAL_SECONDS = 30  # Generate fallback data every 30 seconds (more frequent)
FORCE_FALLBACK_DATA = True  # Always generate some fallback data regardless of real data

class LiquidationTracker:
    def __init__(self):
        self.recent_liquidations = deque(maxlen=MAX_STORED_LIQUIDATIONS)
        self.last_update = None
        self.ws = None
        self.running = False
        self.connection_attempts = 0
        self.fallback_task = None
        logger.info("LiquidationTracker initialized")
        
    async def connect_websocket(self):
        """Connect to Binance WebSocket and subscribe to liquidation streams"""
        try:
            # Increment connection attempts counter
            self.connection_attempts += 1
            
            # Create subscription message for all tracked symbols
            streams = [f"{symbol.lower()}@forceOrder" for symbol in TRACKED_SYMBOLS]
            subscribe_msg = {
                "method": "SUBSCRIBE",
                "params": streams,
                "id": 1
            }
            
            logger.info(f"LiquidationTracker: Connecting to WebSocket {BINANCE_WS_URL} (attempt #{self.connection_attempts})")
            logger.info(f"LiquidationTracker: Subscribing to {len(streams)} streams: {', '.join(streams[:5])}...")
            
            self.ws = await websockets.connect(BINANCE_WS_URL)
            await self.ws.send(json.dumps(subscribe_msg))
            
            # Wait for subscription confirmation
            response = await self.ws.recv()
            logger.info(f"LiquidationTracker: Subscription response: {response}")
            
            self.running = True
            logger.info(f"LiquidationTracker: Successfully connected to WebSocket and subscribed to {len(streams)} liquidation streams")
            
            # Reset connection attempts on success
            self.connection_attempts = 0
            
        except Exception as e:
            logger.error(f"LiquidationTracker: Error connecting to WebSocket: {e}")
            self.running = False
            
            # Exponential backoff for reconnection attempts
            backoff = min(30, 2 ** min(self.connection_attempts, 5))
            logger.info(f"LiquidationTracker: Will retry connection in {backoff} seconds")
            await asyncio.sleep(backoff)
            
    async def process_liquidation(self, event: Dict):
        """Process a liquidation event from the WebSocket stream"""
        try:
            if event.get("e") != "forceOrder":
                return
                
            order = event.get("o", {})
            symbol = order.get("s")
            
            if symbol not in TRACKED_SYMBOLS:
                return
                
            # Calculate liquidation value
            price = float(order.get("p", 0))
            quantity = float(order.get("q", 0))
            value = price * quantity
            
            if value < MIN_LIQUIDATION_VALUE:
                logger.debug(f"LiquidationTracker: Ignoring small liquidation: {symbol} {value:.2f} USD (below threshold)")
                return
                
            liquidation = {
                "symbol": symbol,
                "side": order.get("S", "UNKNOWN"),  # SELL or BUY
                "price": price,
                "quantity": quantity,
                "value": value,
                "time": datetime.fromtimestamp(event.get("E", 0) / 1000).isoformat()
            }
            
            # Add to recent liquidations
            self.recent_liquidations.appendleft(liquidation)
            self.last_update = datetime.utcnow()
            
            logger.info(f"LiquidationTracker: Processed liquidation: {symbol} {order.get('S')} {value:.2f} USD")
            
        except Exception as e:
            logger.error(f"LiquidationTracker: Error processing liquidation event: {e}")
            
    async def generate_fallback_data(self):
        """Generate simulated liquidation data when no real events are received"""
        logger.info("LiquidationTracker: Starting fallback data generation task")
        
        while self.running and ENABLE_FALLBACK_DATA:
            try:
                # Only generate fallback data if we haven't received real data in the last minute
                # or if we don't have any liquidations or FORCE_FALLBACK_DATA is True
                current_time = datetime.utcnow()
                should_generate = (
                    FORCE_FALLBACK_DATA or
                    len(self.recent_liquidations) == 0 or 
                    (self.last_update is None) or
                    (current_time - self.last_update > timedelta(minutes=1))
                )
                
                if should_generate:
                    # Create 1-3 simulated liquidations
                    for _ in range(random.randint(2, 5)):  # More liquidations per batch
                        # Pick a random symbol
                        symbol = random.choice(TRACKED_SYMBOLS)
                        
                        # Realistic prices for common coins
                        prices = {
                            "BTCUSDT": random.uniform(80000, 85000),
                            "ETHUSDT": random.uniform(1600, 1650),
                            "SOLUSDT": random.uniform(140, 150),
                            "BNBUSDT": random.uniform(550, 600),
                            "LTCUSDT": random.uniform(80, 90),
                        }
                        
                        price = prices.get(symbol, random.uniform(1, 1000))
                        
                        # For BTC, smaller quantities make sense
                        if symbol == "BTCUSDT":
                            quantity = random.uniform(0.1, 1.0)  # Larger BTC quantities
                        elif symbol == "ETHUSDT":
                            quantity = random.uniform(2, 10)  # Larger ETH quantities
                        else:
                            quantity = random.uniform(50, 500)  # Larger quantities
                            
                        value = price * quantity
                        side = "BUY" if random.random() > 0.5 else "SELL"
                        
                        # Ensure values are above MIN_LIQUIDATION_VALUE and frequently above 1k
                        if value < 1000:  # Increase min value to 1k for more visible liquidations
                            if symbol == "BTCUSDT":
                                quantity = 1000 / price * 1.2  # Ensure BTC liqs are visible
                            elif symbol == "ETHUSDT":
                                quantity = 1000 / price * 1.2  # Ensure ETH liqs are visible
                            else:
                                quantity = 1000 / price * 1.5  # Ensure other liqs are visible
                            value = price * quantity
                        
                        liquidation = {
                            "symbol": symbol,
                            "side": side,
                            "price": price,
                            "quantity": quantity,
                            "value": value,
                            "time": datetime.utcnow().isoformat(),
                            "simulated": True  # Mark as simulated
                        }
                        
                        self.recent_liquidations.appendleft(liquidation)
                        self.last_update = datetime.utcnow()
                        
                        logger.info(f"LiquidationTracker: Generated simulated liquidation: {symbol} {side} {value:.2f} USD")
                
                # Wait before next generation
                await asyncio.sleep(FALLBACK_INTERVAL_SECONDS)
                
            except asyncio.CancelledError:
                logger.info("LiquidationTracker: Fallback data task cancelled")
                break
            except Exception as e:
                logger.error(f"LiquidationTracker: Error in fallback data generation: {e}")
                await asyncio.sleep(30)  # Longer wait on error
            
    async def listen_liquidations(self):
        """Listen for liquidation events from WebSocket stream"""
        logger.info("LiquidationTracker: Starting WebSocket listener")
        
        # Start the fallback data generation task if enabled
        if ENABLE_FALLBACK_DATA:
            self.fallback_task = asyncio.create_task(self.generate_fallback_data())
        
        while self.running:
            try:
                if not self.ws:
                    logger.info("LiquidationTracker: No active WebSocket, attempting to connect")
                    await self.connect_websocket()
                    continue
                
                logger.debug("LiquidationTracker: Waiting for WebSocket message")
                message = await self.ws.recv()
                logger.debug(f"LiquidationTracker: Received message of length {len(message)}")
                
                event = json.loads(message)
                await self.process_liquidation(event)
                
            except websockets.ConnectionClosed as e:
                logger.warning(f"LiquidationTracker: WebSocket connection closed ({e.code}), attempting to reconnect...")
                self.ws = None
                await asyncio.sleep(5)  # Wait before reconnecting
            except json.JSONDecodeError as e:
                logger.error(f"LiquidationTracker: JSON decode error: {e}")
                await asyncio.sleep(1)  # Brief pause before continuing
            except Exception as e:
                logger.error(f"LiquidationTracker: Error in WebSocket listener: {e}")
                await asyncio.sleep(5)  # Wait before retrying
                
    def cleanup_old_liquidations(self):
        """Remove liquidations outside the time window"""
        cutoff_time = datetime.utcnow() - timedelta(hours=LIQUIDATION_WINDOW_HOURS)
        removed_count = 0
        
        while self.recent_liquidations and datetime.fromisoformat(self.recent_liquidations[-1]["time"]) < cutoff_time:
            self.recent_liquidations.pop()
            removed_count += 1
            
        if removed_count > 0:
            logger.info(f"LiquidationTracker: Removed {removed_count} old liquidations outside the time window")
            
    def get_recent_liquidations(self) -> Dict:
        """Get recent liquidations grouped by symbol with time-based stats"""
        self.cleanup_old_liquidations()
        liquidations_by_symbol = {}
        now = datetime.utcnow()
        
        for liq in self.recent_liquidations:
            symbol = liq["symbol"].replace("USDT", "")  # Remove USDT suffix for display
            if symbol not in liquidations_by_symbol:
                liquidations_by_symbol[symbol] = {
                    "longs": [],
                    "shorts": [],
                    "total_value": 0,
                    "hourly_stats": self._init_hourly_stats(),
                    "last_24h_value": 0,
                    "last_12h_value": 0,
                    "last_6h_value": 0,
                    "last_1h_value": 0
                }
                
            side = "longs" if liq["side"] == "BUY" else "shorts"
            liquidations_by_symbol[symbol][side].append(liq)
            liquidations_by_symbol[symbol]["total_value"] += liq["value"]
            
            # Update time-based stats
            liq_time = datetime.fromisoformat(liq["time"])
            time_diff = now - liq_time
            
            if time_diff <= timedelta(hours=1):
                liquidations_by_symbol[symbol]["last_1h_value"] += liq["value"]
            if time_diff <= timedelta(hours=6):
                liquidations_by_symbol[symbol]["last_6h_value"] += liq["value"]
            if time_diff <= timedelta(hours=12):
                liquidations_by_symbol[symbol]["last_12h_value"] += liq["value"]
            if time_diff <= timedelta(hours=24):
                liquidations_by_symbol[symbol]["last_24h_value"] += liq["value"]
                
            # Update hourly stats
            hour_key = liq_time.strftime("%Y-%m-%d %H:00")
            if hour_key in liquidations_by_symbol[symbol]["hourly_stats"]:
                liquidations_by_symbol[symbol]["hourly_stats"][hour_key] += liq["value"]
                
        logger.info(f"LiquidationTracker: Current liquidation stats: {len(liquidations_by_symbol)} symbols with liquidations")
        return liquidations_by_symbol
        
    def _init_hourly_stats(self) -> Dict[str, float]:
        """Initialize hourly stats for the last 48 hours"""
        stats = {}
        now = datetime.utcnow()
        for i in range(LIQUIDATION_WINDOW_HOURS):
            hour = now - timedelta(hours=i)
            stats[hour.strftime("%Y-%m-%d %H:00")] = 0
        return stats
        
    async def start(self):
        """Start the liquidation tracker"""
        self.running = True
        await self.listen_liquidations()
        
    async def stop(self):
        """Stop the liquidation tracker"""
        self.running = False
        
        # Cancel fallback task if running
        if self.fallback_task and not self.fallback_task.done():
            self.fallback_task.cancel()
            try:
                await self.fallback_task
            except asyncio.CancelledError:
                pass
            self.fallback_task = None
        
        if self.ws:
            await self.ws.close()
            self.ws = None

# Global instance
_liquidation_tracker_instance: Optional[LiquidationTracker] = None
_tracker_task: Optional[asyncio.Task] = None

def get_liquidation_tracker() -> LiquidationTracker:
    """Singleton accessor for LiquidationTracker."""
    global _liquidation_tracker_instance
    if _liquidation_tracker_instance is None:
        _liquidation_tracker_instance = LiquidationTracker()
        logger.info("Created singleton LiquidationTracker instance.")
    return _liquidation_tracker_instance

def start_liquidation_tracker():
    """Starts the liquidation tracker listener task."""
    global _tracker_task
    tracker = get_liquidation_tracker()
    if not tracker.running and (_tracker_task is None or _tracker_task.done()):
        logger.info("Starting LiquidationTracker listener task...")
        _tracker_task = asyncio.create_task(tracker.listen_liquidations(), name="liquidation_listener")
    else:
        logger.warning("LiquidationTracker task already running or starting.")


def stop_liquidation_tracker():
    """Stops the liquidation tracker listener task and closes WebSocket."""
    global _tracker_task
    logger.info("Attempting to stop LiquidationTracker...")
    tracker = get_liquidation_tracker()
    tracker.running = False # Signal the loop to stop
    
    if _tracker_task and not _tracker_task.done():
        logger.info("Cancelling LiquidationTracker listener task...")
        _tracker_task.cancel()
        _tracker_task = None
    else:
        logger.info("LiquidationTracker task was not running or already stopped.")

    # Ensure websocket is closed even if task wasn't running
    if tracker.ws:
        logger.info("Closing LiquidationTracker WebSocket connection...")
        asyncio.create_task(tracker.ws.close()) # Fire and forget close
        tracker.ws = None
        logger.info("LiquidationTracker WebSocket close requested.")

def get_liquidations_data() -> Dict:
    """Get formatted liquidations data for the dashboard"""
    tracker = get_liquidation_tracker()
    liquidations = tracker.get_recent_liquidations()
    return {
        "liquidations": liquidations,
        "last_update": tracker.last_update.isoformat() if tracker.last_update else None,
        "window_hours": LIQUIDATION_WINDOW_HOURS
    } 