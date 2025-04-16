import React, { useEffect, useRef } from 'react';
import { formatNumber, formatPercent } from '../utils/formatters';
import Loading from './Loading';
import { MarketData } from '../types/data';
import styles from '../styles/MarketMetrics.module.css';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { RiArrowUpSFill, RiArrowDownSFill } from 'react-icons/ri';
import { useMarketData } from '../hooks/useMarketData';

interface MarketMetricsProps {
  layout: 'default' | 'horizontal';
  showExtraCoins?: boolean;
}

// Update the MarketMetric type to match the actual data structure
type MarketMetric = {
  price: number;
  volume_24h: number;
  open_interest: number;
  funding_rate: number;
  price_change_percent: number;
  market_cap: number;
  dominance: number;
  volatility_7d: number;
};

// Sample data for when real data isn't available
const sampleMarketData: MarketData = {
  btc: {
    price: 84526.42,
    volume_24h: 1930297877,
    open_interest: 6704734192,
    funding_rate: 0.0002,
    price_change_percent: 0.0125,
    market_cap: 1650000000000,
    dominance: 51.2,
    volatility_7d: 0.18
  },
  eth: {
    price: 1623.29,
    volume_24h: 890450000,
    open_interest: 2350000000,
    funding_rate: 0.0004,
    price_change_percent: -0.0075,
    market_cap: 195000000000,
    dominance: 18.4,
    volatility_7d: 0.22
  }
};

// Additional coins to display when showExtraCoins is true
const additionalCoins = {
  ltc: {
    price: 72.45,
    volume_24h: 400_000_000,
    open_interest: 150_000_000,
    funding_rate: 0.0005,
    price_change_percent: 0.023,
    market_cap: 5_450_000_000,
    dominance: 0.012,
    volatility_7d: 0.14
  },
  sol: {
    price: 146.78,
    volume_24h: 1_200_000_000,
    open_interest: 300_000_000,
    funding_rate: 0.0015,
    price_change_percent: -0.017,
    market_cap: 63_800_000_000,
    dominance: 0.045,
    volatility_7d: 0.22
  }
};

// Define constant metric sets
const ESSENTIAL_METRICS = ['price', 'price_change_percent', 'volume_24h', 'funding_rate'];
const ADDITIONAL_METRICS = ['open_interest', 'market_cap', 'dominance', 'volatility_7d'];

// Define all metrics labels and formatters
const METRICS_CONFIG: Record<string, { label: string; format: (value: number) => string }> = {
  price: {
    label: 'Price',
    format: (value: number) => `$${value.toLocaleString()}`
  },
  price_change_percent: {
    label: '24h Change',
    format: (value: number) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`
  },
  volume_24h: {
    label: '24h Volume',
    format: (value: number) => `$${(value / 1000000).toFixed(1)}M`
  },
  funding_rate: {
    label: 'Funding Rate',
    format: (value: number) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(4)}%`
  },
  open_interest: {
    label: 'Open Interest',
    format: (value: number) => `$${(value / 1000000).toFixed(1)}M`
  },
  market_cap: {
    label: 'Market Cap',
    format: (value: number) => `$${(value / 1000000000).toFixed(1)}B`
  },
  dominance: {
    label: 'Dominance',
    format: (value: number) => `${value.toFixed(2)}%`
  },
  volatility_7d: {
    label: '7d Volatility',
    format: (value: number) => `${value.toFixed(2)}%`
  }
};

const MarketMetrics: React.FC<MarketMetricsProps> = ({ 
  layout = 'default', 
  showExtraCoins = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useMarketData();
  
  // Debug the incoming data
  useEffect(() => {
    console.log('[MarketMetrics] Received props:', { layout, showExtraCoins, loading, error });
    console.log('[MarketMetrics] Data:', data);
    
    // Check if data has actual values or is just empty objects
    if (data?.market_data) {
      const hasBtcData = data.market_data.btc && Object.values(data.market_data.btc).some(val => val !== 0 && val !== undefined);
      const hasEthData = data.market_data.eth && Object.values(data.market_data.eth).some(val => val !== 0 && val !== undefined);
      console.log('[MarketMetrics] Data check: BTC has data:', hasBtcData, 'ETH has data:', hasEthData);
    }
  }, [data, layout, showExtraCoins, loading, error]);
  
  // Notify parent of size changes
  useEffect(() => {
    // Force a resize event when showExtraCoins changes to update layout
    window.dispatchEvent(new Event('resize'));
    
    console.log(`[MarketMetrics] Extra coins ${showExtraCoins ? 'ENABLED' : 'DISABLED'}`);
    
    // Log height for debugging
    if (containerRef.current) {
      const height = containerRef.current.getBoundingClientRect().height;
      console.log('[MarketMetrics] Current height:', height);
    }
  }, [showExtraCoins, layout]);

  const renderMetric = (coin: string, key: string, value: number) => {
    const config = METRICS_CONFIG[key];
    if (!config) return null;

    const isPercentage = key.includes('percent') || key === 'funding_rate' || key === 'dominance' || key === 'volatility_7d';
    const isPositive = isPercentage && value > 0;
    const isNegative = isPercentage && value < 0;
    
    return (
      <div key={`${coin}-${key}`} className={styles.metric}>
        <div className={styles.label}>{config.label}</div>
        <div className={`${styles.value} ${isPositive ? styles.positive : ''} ${isNegative ? styles.negative : ''}`}>
          {isPercentage && value > 0 && <FiArrowUp className={styles.arrowIcon} />}
          {isPercentage && value < 0 && <FiArrowDown className={styles.arrowIcon} />}
          {config.format(value)}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div 
        ref={containerRef}
        className={layout === 'horizontal' ? styles.horizontalContainer : styles.container}
        data-show-extra-coins={showExtraCoins ? 'true' : 'false'}
      >
        <h2 className={styles.title}>Market Metrics</h2>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }
  
  // Check for errors explicitly
  if (error) {
    console.error('[MarketMetrics] Error received:', error);
    return (
      <div 
        ref={containerRef}
        className={layout === 'horizontal' ? styles.horizontalContainer : styles.container}
        data-show-extra-coins={showExtraCoins ? 'true' : 'false'}
      >
        <h2 className={styles.title}>Market Metrics</h2>
        <div className={styles.errorContainer}>
          <p>Failed to load market data.</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use real data if available and valid, otherwise use sample data
  const marketData = data?.market_data || sampleMarketData;
  
  return (
    <div 
      ref={containerRef}
      className={layout === 'horizontal' ? styles.horizontalContainer : styles.container}
      data-show-extra-coins={showExtraCoins ? 'true' : 'false'}
    >
      <h2 className={styles.title}>Market Metrics</h2>
      <div className={styles.metricsGrid}>
        {Object.entries(marketData).map(([coin, metrics]) => (
          <div key={coin} className={styles.coinSection}>
            <h3 className={styles.coinTitle}>{coin.toUpperCase()}</h3>
            <div className={styles.metrics}>
              {ESSENTIAL_METRICS.map(key => 
                renderMetric(coin, key, metrics[key as keyof MarketMetric])
              )}
            </div>
          </div>
        ))}
        
        {showExtraCoins && Object.entries(additionalCoins).map(([coin, metrics]) => (
          <div key={coin} className={styles.coinSection}>
            <h3 className={styles.coinTitle}>{coin.toUpperCase()}</h3>
            <div className={styles.metrics}>
              {ESSENTIAL_METRICS.map(key => 
                renderMetric(coin, key, metrics[key as keyof MarketMetric])
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketMetrics; 