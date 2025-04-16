import React, { useState, useEffect, useRef } from 'react';
import styles from './PriceChart.module.css';

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

// Create a component that doesn't depend on any props or external state
const StablePriceChart: React.FC = () => {
  console.log("StablePriceChart rendering");
  
  // Internal state
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

  // Fetch order book data from Binance API
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
      
      // Update state based on symbol
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
      
      if (symbol === 'BTC') {
        setBtcOrderBook(marketData);
      } else if (symbol === 'ETH') {
        setEthOrderBook(marketData);
        
        // Set loading to false after both coins are loaded
        if (isLoading) {
          setIsLoading(false);
        }
      }
      
      setLastUpdated(new Date());
      
    } catch (error) {
      if (!mountedRef.current) return; // Check if still mounted before updating state
      
      console.error(`Error fetching ${symbol} order book:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Set global error state
      setError(`Error fetching ${symbol} data: ${errorMessage}`);
      
      // Update error state based on symbol
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
        setIsFetching(false);
      }
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchOrderBook('BTC');
    fetchOrderBook('ETH');
  };

  // Track when component mounts/unmounts to prevent state updates on unmounted component
  useEffect(() => {
    console.log("StablePriceChart mounting - fetching data");
    mountedRef.current = true;
    
    // Initial fetch
    fetchOrderBook('BTC');
    fetchOrderBook('ETH');
    
    // Clean up when component unmounts
    return () => {
      console.log("StablePriceChart unmounting");
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

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
              onClick={handleRefresh} 
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
            onClick={handleRefresh} 
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

export default StablePriceChart; 