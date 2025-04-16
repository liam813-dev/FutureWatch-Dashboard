import React from 'react';
import styles from '@/components/DashboardSummary.module.css';
import { DashboardData } from '@/types/data';

interface DashboardSummaryProps {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
}

const DashboardSummary: React.FC<DashboardSummaryProps> = ({ data, isLoading, error }) => {
  // Calculate metrics (in a real app these would come from the API)
  const totalLiquidations = data?.liquidation_positions?.reduce(
    (total, position) => total + position.value, 
    0
  ) || 0;
  
  const avgFundingRate = data ? 
    ((data.market_data.btc.funding_rate + data.market_data.eth.funding_rate) / 2) : 
    0;
  
  const activeLiquidations = data?.liquidation_positions?.length || 0;

  if (isLoading) {
    return (
      <div className={styles.summaryContainer}>
        <div className={styles.summaryLoader}>
          <span></span><span></span><span></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.summaryContainer}>
        <div className={styles.summaryError}>
          <p>Unable to load summary data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryItem}>
          <h3>Total Liquidations (24h)</h3>
          <div className={styles.summaryValue}>${(totalLiquidations / 1000000).toFixed(2)}M</div>
          <div className={styles.summarySubtext}>
            <span className={styles.summaryTrend}>
              ↑ 12.4%
            </span> 
            from yesterday
          </div>
        </div>
        
        <div className={styles.summaryItem}>
          <h3>Avg. Funding Rate</h3>
          <div className={styles.summaryValue}>
            {(avgFundingRate * 100).toFixed(4)}%
          </div>
          <div className={styles.summarySubtext}>
            <span className={`${styles.summaryTrend} ${avgFundingRate > 0 ? styles.positive : styles.negative}`}>
              {avgFundingRate > 0 ? '↑' : '↓'} {Math.abs(avgFundingRate * 100).toFixed(4)}%
            </span>
            hourly
          </div>
        </div>
        
        <div className={styles.summaryItem}>
          <h3>Active Liquidations</h3>
          <div className={styles.summaryValue}>{activeLiquidations}</div>
          <div className={styles.summarySubtext}>
            <span className={styles.summaryTrend}>
              ↑ 5
            </span>
            in last hour
          </div>
        </div>
        
        <div className={styles.summaryItem}>
          <h3>Market Sentiment</h3>
          <div className={styles.summaryValue}>
            <span className={`${styles.sentiment} ${styles.neutral}`}>Neutral</span>
          </div>
          <div className={styles.summarySubtext}>Based on liquidation data</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary; 