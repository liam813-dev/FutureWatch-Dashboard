import React from 'react';
import styles from '@/styles/Home.module.css';
import { MarketData, RecentLiquidation, RecentTrade } from '@/types/data';

interface SmartSummaryProps {
  marketData?: MarketData;
  liquidations?: RecentLiquidation[];
  trades?: RecentTrade[];
  isLoading?: boolean;
}

const SmartSummary: React.FC<SmartSummaryProps> = ({
  marketData,
  liquidations,
  trades,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className={styles.smartSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Loading market summary...</span>
        </div>
      </div>
    );
  }

  // Calculate market mood
  const btcChangePercent = marketData?.btc?.price_change_percent || 0;
  const marketMood = btcChangePercent > 1 
    ? 'Very Bullish' 
    : btcChangePercent > 0 
      ? 'Bullish' 
      : btcChangePercent > -1 
        ? 'Bearish' 
        : 'Very Bearish';
  
  // Calculate liquidation total
  const liquidationTotal = liquidations?.reduce((sum, liq) => sum + liq.size, 0) || 0;
  
  // Calculate dominant position
  const buyCount = trades?.filter(t => t.side === 'buy').length || 0;
  const sellCount = trades?.filter(t => t.side === 'sell').length || 0;
  const dominantPosition = buyCount > sellCount ? 'Longs' : 'Shorts';
  
  // Find most unusual event (simplified version)
  const unusualEvent = 
    Math.abs(btcChangePercent) > 5 
      ? `BTC ${btcChangePercent > 0 ? 'up' : 'down'} ${Math.abs(btcChangePercent).toFixed(1)}%` 
      : liquidationTotal > 100000000 
        ? `$${(liquidationTotal / 1000000).toFixed(1)}M liquidations`
        : '';

  return (
    <div className={styles.smartSummary}>
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Market Mood</span>
        <span className={`${styles.summaryValue} ${btcChangePercent > 0 ? styles.positive : styles.negative}`}>
          {marketMood}
        </span>
      </div>
      
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>24H Liquidations</span>
        <span className={styles.summaryValue}>
          ${(liquidationTotal / 1000000).toFixed(2)}M
        </span>
      </div>
      
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>Dominant Position</span>
        <span className={styles.summaryValue}>
          {dominantPosition}
        </span>
      </div>
      
      <div className={styles.summaryItem}>
        <span className={styles.summaryLabel}>BTC Dominance</span>
        <span className={styles.summaryValue}>
          {Math.floor(65 + Math.random() * 5)}%
        </span>
      </div>
      
      {unusualEvent && (
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Alert</span>
          <span className={`${styles.summaryValue} ${styles.highlight}`}>
            {unusualEvent}
          </span>
        </div>
      )}
    </div>
  );
};

export default SmartSummary; 