import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TradeFeed from '@/components/TradeFeed';
import LiquidationFeed from '@/components/LiquidationFeed';
import OptionsTracker from '@/components/OptionsTracker';
import TradeHeatmap from '@/components/TradeHeatmap';
import { useWebSocket } from '@/contexts/WebSocketContext';
import styles from '@/styles/TradesPage.module.css';

const TradesPage: React.FC = () => {
  const { data, isLoading, error } = useWebSocket();

  // Extract data for components
  const tradeData = data?.data?.recent_large_trades || [];
  const liquidationData = data?.data?.recent_liquidations || [];
  
  // Create a properly typed defaultMarketData to handle empty case
  const defaultMarketMetric = {
    price: 0,
    volume_24h: 0,
    open_interest: 0,
    funding_rate: 0,
    price_change_percent: 0
  };
  
  const defaultMarketData = {
    btc: defaultMarketMetric,
    eth: defaultMarketMetric
  };
  
  const marketData = data?.data?.market_data || defaultMarketData;

  return (
    <div className={styles.pageContainer}>
      <Navigation />
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Trading Activity Center</h1>
        
        {error && <p className={styles.error}>Error loading data: {error.message}</p>}
        
        <div className={styles.contentGrid}>
          <div className={styles.mainTradeSection}>
            <TradeFeed 
              trades={tradeData} 
              isLoading={isLoading} 
              error={error}
            />
          </div>

          <div className={styles.optionsSection}>
            <OptionsTracker />
          </div>

          <div className={styles.liquidationsSection}>
            <LiquidationFeed 
              liquidations={liquidationData}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div className={styles.heatmapSection}>
            <TradeHeatmap 
              marketData={marketData}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TradesPage; 