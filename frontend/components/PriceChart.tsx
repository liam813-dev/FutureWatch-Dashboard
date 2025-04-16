import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import styles from './PriceChart.module.css';
import { MarketData } from '../types/data';

// Utility functions for formatting
const formatPrice = (price?: number): string => {
  return price ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
};

const formatQuantity = (qty?: number): string => {
  return qty ? qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
};

const formatSpread = (spread?: number): string => {
  return spread ? spread.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
};

const formatPercent = (percent?: number): string => {
  return percent ? `${percent.toFixed(2)}%` : '-';
};

interface PriceChartProps {
  marketData?: MarketData;
  data?: any; // For backward compatibility with index page
  isLoading?: boolean;
  error?: any;
  timeframe?: string;
}

// Define interface for order book data
interface OrderBookData {
  bids: [number, number][];
  asks: [number, number][];
  lastUpdateId: number;
}

// Define interface for detailed market data
interface DetailedMarketData {
  symbol: string;
  bid_price: number;
  bid_qty: number;
  ask_price: number;
  ask_qty: number;
  spread: number;
  spread_percent: number;
  depth: OrderBookData | null;
  isLoading: boolean;
  error: string | null;
}

// Add debounce function to the PriceChart component to control data update frequency
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// The actual component implementation - completely isolated from props
const PriceChartComponent: React.FC = () => {
  console.log("PriceChart rendering");
  // Internal state for our component that doesn't depend on props
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // State for order book data
  const [btcOrderBook, setBtcOrderBook] = useState<DetailedMarketData>({
    symbol: 'BTC',
    bid_price: 0,
    bid_qty: 0,
    ask_price: 0,
    ask_qty: 0,
    spread: 0,
    spread_percent: 0,
    depth: null,
    isLoading: false,
    error: null
  });
  
  const [ethOrderBook, setEthOrderBook] = useState<DetailedMarketData>({
    symbol: 'ETH',
    bid_price: 0,
    bid_qty: 0,
    ask_price: 0,
    ask_qty: 0,
    spread: 0,
    spread_percent: 0,
    depth: null,
    isLoading: false,
    error: null
  });

  // Modify the fetchOrderBook function to add more stability
  const fetchOrderBook = async (symbol: string) => {
    if (!mountedRef.current) return;
    
    try {
      if (!isFetching) setIsFetching(true);
      
      // Clear error state before fetching
      if (error) setError(null);
      
      // Fetch best bid/ask from Book Ticker API
      const bookTickerResponse = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}USDT`);
      if (!bookTickerResponse.ok) {
        throw new Error(`Failed to fetch book ticker: ${bookTickerResponse.status}`);
      }
      const bookTickerData = await bookTickerResponse.json();
      
      // Fetch order book depth
      const depthResponse = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}USDT&limit=5`);
      if (!depthResponse.ok) {
        throw new Error(`Failed to fetch depth: ${depthResponse.status}`);
      }
      const depthData = await depthResponse.json();
      
      if (!mountedRef.current) return; // Check if still mounted before updating state
      
      // Format the depth data - convert strings to numbers
      const formattedDepth: OrderBookData = {
        lastUpdateId: depthData.lastUpdateId,
        bids: depthData.bids.map((bid: [string, string]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
        asks: depthData.asks.map((ask: [string, string]) => [parseFloat(ask[0]), parseFloat(ask[1])])
      };

      // Calculate spread
      const bidPrice = parseFloat(bookTickerData.bidPrice);
      const askPrice = parseFloat(bookTickerData.askPrice);
      const spread = askPrice - bidPrice;
      const spreadPercent = (spread / bidPrice) * 100;
      
      // Update state based on symbol - use functional update with significant change detection
      const marketData: DetailedMarketData = {
        symbol: symbol,
        bid_price: bidPrice,
        bid_qty: parseFloat(bookTickerData.bidQty),
        ask_price: askPrice,
        ask_qty: parseFloat(bookTickerData.askQty),
        spread: spread,
        spread_percent: spreadPercent,
        depth: formattedDepth,
        isLoading: false,
        error: null
      };
      
      // Check if the change is significant enough to trigger a re-render
      // This helps prevent flickering from minor price changes
      const isSignificantChange = (prev: DetailedMarketData, current: DetailedMarketData) => {
        // Only update for price changes greater than 0.01%
        const priceDiffPercent = Math.abs((prev.bid_price - current.bid_price) / prev.bid_price) * 100;
        return priceDiffPercent > 0.01 || !prev.bid_price;
      };
      
      if (symbol === 'BTC') {
        setBtcOrderBook(prevData => {
          // Only update if there's a significant change or first data
          if (isSignificantChange(prevData, marketData)) {
            return marketData;
          }
          return prevData;
        });
      } else if (symbol === 'ETH') {
        setEthOrderBook(prevData => {
          // Only update if there's a significant change or first data
          if (isSignificantChange(prevData, marketData)) {
            return marketData;
          }
          return prevData;
        });
        
        // Set loading to false after both coins are loaded
        if (isLoading) {
          setIsLoading(false);
        }
      }
      
      // Update timestamp in a way that doesn't cause a re-render cascade
      if (mountedRef.current) {
        const now = new Date();
        // Only update if more than 5 seconds have passed
        if (!lastUpdated || (now.getTime() - lastUpdated.getTime() > 5000)) {
          setLastUpdated(now);
        }
      }
      
    } catch (error) {
      if (!mountedRef.current) return; // Check if still mounted before updating state
      
      console.error(`Error fetching ${symbol} order book:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Set global error state - but only if there's no data yet or persistent error
      // This prevents flashing error states on temporary network issues
      if ((!btcOrderBook.bid_price && !ethOrderBook.bid_price) || error instanceof Error) {
        setError(`Error fetching ${symbol} data: ${errorMessage}`);
      }
      
      // Update error state based on symbol - preserve previous data
      const errorUpdate = { 
        isLoading: false, 
        error: errorMessage
      };
      
      if (symbol === 'BTC') {
        setBtcOrderBook(prev => ({ ...prev, ...errorUpdate }));
      } else if (symbol === 'ETH') {
        setEthOrderBook(prev => ({ ...prev, ...errorUpdate }));
      }
      
      // Make sure loading is set to false
      if (isLoading) {
        setIsLoading(false);
      }
    } finally {
      if (!mountedRef.current) return; // Check if still mounted before updating state
      
      // Always reset the fetching state when both coins are done
      if (symbol === 'ETH') {
        // Delay resetting fetching state to prevent too frequent updates
        setTimeout(() => {
          if (mountedRef.current) {
            setIsFetching(false);
          }
        }, 500);
      }
    }
  };

  // Add debounced version of fetchOrderBook to reduce update frequency
  const debouncedFetchOrderBook = useMemo(
    () => debounce((symbol: string) => fetchOrderBook(symbol), 300),
    []
  );

  // Update useEffect for more stable interval handling
  useEffect(() => {
    console.log("PriceChart mounting - fetching data");
    mountedRef.current = true;
    
    // Initial fetch without debounce
    fetchOrderBook('BTC');
    fetchOrderBook('ETH');
    
    // Setup periodic refresh with intelligent throttling
    let lastBtcUpdateTime = Date.now();
    let lastEthUpdateTime = Date.now();
    const minUpdateInterval = 5000; // Minimum time between updates (5 seconds)
    
    const intervalId = setInterval(() => {
      if (!mountedRef.current || isFetching) return;
      
      const now = Date.now();
      
      // Only update if minimum interval has passed
      if (now - lastBtcUpdateTime >= minUpdateInterval) {
        console.log("PriceChart auto-refreshing BTC data");
        debouncedFetchOrderBook('BTC');
        lastBtcUpdateTime = now;
      }
      
      // Stagger ETH updates to avoid simultaneous fetches
      if (now - lastEthUpdateTime >= minUpdateInterval) {
        setTimeout(() => {
          if (mountedRef.current && !isFetching) {
            console.log("PriceChart auto-refreshing ETH data");
            debouncedFetchOrderBook('ETH');
          }
          lastEthUpdateTime = now;
        }, 1500); // Stagger by 1.5s
      }
    }, 10000); // Check every 10 seconds
    
    // Clean up when component unmounts
    return () => {
      console.log("PriceChart unmounting");
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  // Initial loading state
  if (isLoading) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h3>Order Book</h3>
        </div>
        <div className={styles.loading}>Loading order book data...</div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <h3>Order Book</h3>
          <div className={styles.timeframeSelector}>
            <button 
              className={styles.refreshButton} 
              onClick={() => {
                setIsFetching(true);
                fetchOrderBook('BTC');
                fetchOrderBook('ETH');
              }} 
              disabled={isFetching}
            >
              Retry
            </button>
          </div>
        </div>
        <div className={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h3>Order Book</h3>
        <div className={styles.timeframeSelector}>
          <button 
            className={styles.refreshButton} 
            onClick={() => {
              setIsFetching(true);
              fetchOrderBook('BTC');
              fetchOrderBook('ETH');
            }} 
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <span className={styles.lastUpdated}>
            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
        </div>
      </div>
      
      <div className={styles.orderBookContainer}>
        {/* BTC/USDT Section */}
        <div className={styles.marketSection}>
          <h4>BTC/USDT</h4>
          <div className={styles.priceRow}>
            <div className={styles.bidSide}>
              <div className={styles.priceLabel}>Bid</div>
              <div className={styles.priceValue}>{formatPrice(btcOrderBook.bid_price)}</div>
              <div className={styles.qtyValue}>{formatQuantity(btcOrderBook.bid_qty)}</div>
            </div>
            <div className={styles.spreadInfo}>
              <div className={styles.spreadValue}>{formatSpread(btcOrderBook.spread)}</div>
              <div className={styles.spreadPercent}>{formatPercent(btcOrderBook.spread_percent)}</div>
            </div>
            <div className={styles.askSide}>
              <div className={styles.priceLabel}>Ask</div>
              <div className={styles.priceValue}>{formatPrice(btcOrderBook.ask_price)}</div>
              <div className={styles.qtyValue}>{formatQuantity(btcOrderBook.ask_qty)}</div>
            </div>
          </div>
          
          {btcOrderBook.depth && (
            <div className={styles.depthDisplay}>
              <div className={styles.bidDepth}>
                <div className={styles.depthHeader}>
                  <span>Price (USDT)</span>
                  <span>Amount (BTC)</span>
                </div>
                {btcOrderBook.depth.bids.map(([price, qty], i: number) => (
                  <div key={`bid-${i}`} className={styles.depthRow}>
                    <span className={styles.depthPrice}>{price.toFixed(2)}</span>
                    <span className={styles.depthQty}>{qty.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.askDepth}>
                <div className={styles.depthHeader}>
                  <span>Price (USDT)</span>
                  <span>Amount (BTC)</span>
                </div>
                {btcOrderBook.depth.asks.map(([price, qty], i: number) => (
                  <div key={`ask-${i}`} className={styles.depthRow}>
                    <span className={styles.depthPrice}>{price.toFixed(2)}</span>
                    <span className={styles.depthQty}>{qty.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* ETH/USDT Section */}
        <div className={styles.marketSection}>
          <h4>ETH/USDT</h4>
          <div className={styles.priceRow}>
            <div className={styles.bidSide}>
              <div className={styles.priceLabel}>Bid</div>
              <div className={styles.priceValue}>{formatPrice(ethOrderBook.bid_price)}</div>
              <div className={styles.qtyValue}>{formatQuantity(ethOrderBook.bid_qty)}</div>
            </div>
            <div className={styles.spreadInfo}>
              <div className={styles.spreadValue}>{formatSpread(ethOrderBook.spread)}</div>
              <div className={styles.spreadPercent}>{formatPercent(ethOrderBook.spread_percent)}</div>
            </div>
            <div className={styles.askSide}>
              <div className={styles.priceLabel}>Ask</div>
              <div className={styles.priceValue}>{formatPrice(ethOrderBook.ask_price)}</div>
              <div className={styles.qtyValue}>{formatQuantity(ethOrderBook.ask_qty)}</div>
            </div>
          </div>
          
          {ethOrderBook.depth && (
            <div className={styles.depthDisplay}>
              <div className={styles.bidDepth}>
                <div className={styles.depthHeader}>
                  <span>Price (USDT)</span>
                  <span>Amount (ETH)</span>
                </div>
                {ethOrderBook.depth.bids.map(([price, qty], i: number) => (
                  <div key={`bid-${i}`} className={styles.depthRow}>
                    <span className={styles.depthPrice}>{price.toFixed(2)}</span>
                    <span className={styles.depthQty}>{qty.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.askDepth}>
                <div className={styles.depthHeader}>
                  <span>Price (USDT)</span>
                  <span>Amount (ETH)</span>
                </div>
                {ethOrderBook.depth.asks.map(([price, qty], i: number) => (
                  <div key={`ask-${i}`} className={styles.depthRow}>
                    <span className={styles.depthPrice}>{price.toFixed(2)}</span>
                    <span className={styles.depthQty}>{qty.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component that accepts props but doesn't use them
// This is the actual component that will be exported
const PriceChart: React.FC<PriceChartProps> = () => {
  return <PriceChartComponent />;
};

// Export the component wrapped in React.memo to prevent re-renders
export default memo(PriceChart); 