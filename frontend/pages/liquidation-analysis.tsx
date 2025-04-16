import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useWebSocketData } from '@/hooks/useWebSocketData';
import styles from '@/styles/LiquidationAnalysis.module.css';

const AVAILABLE_ASSETS = ['BTC', 'ETH', 'SOL'];
const AVAILABLE_TIMEFRAMES = [1, 4, 6, 12, 24, 48]; // Hours

const LiquidationAnalysisPage: React.FC = () => {
  const { data, isLoading, error } = useWebSocketData();
  const [selectedAsset, setSelectedAsset] = useState<string>(AVAILABLE_ASSETS[0]);
  const [timeframeHours, setTimeframeHours] = useState<number>(24);

  return (
    <div className={styles.pageContainer}>
      <Navigation />
      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Liquidation Analysis</h1>
        <p className={styles.pageSubtitle}>Detailed view of recent market liquidations.</p>
        
        <div className={styles.controlsContainer}>
          <div className={styles.controlGroup}>
            <label htmlFor="assetSelect">Asset:</label>
            <select 
              id="assetSelect"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className={styles.controlSelect}
            >
              {AVAILABLE_ASSETS.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label htmlFor="timeframeSelect">Timeframe:</label>
            <select 
              id="timeframeSelect"
              value={timeframeHours}
              onChange={(e) => setTimeframeHours(Number(e.target.value))}
              className={styles.controlSelect}
            >
              {AVAILABLE_TIMEFRAMES.map(hours => (
                <option key={hours} value={hours}>{hours} Hour{hours > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.contentArea}> 
          {isLoading && <p>Loading data...</p>}
          {error && <p>Error loading data: {error.message}</p>}
          {!isLoading && !error && (
             <p>Liquidation analysis content coming soon...</p>
          )}
        </div>
        
      </main>
      <Footer />
    </div>
  );
};

export default LiquidationAnalysisPage;