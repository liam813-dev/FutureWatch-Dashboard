import React, { useState, useEffect } from 'react';
import styles from './TradeHeatmap.module.css';
import { MarketData, MarketMetric } from '@/types/data';

interface TradeHeatmapProps {
  marketData?: MarketData;
  isLoading?: boolean;
}

const TradeHeatmap: React.FC<TradeHeatmapProps> = ({ marketData, isLoading = false }) => {
  const [data, setData] = useState<Array<{
    symbol: string;
    volume: number;
    priceChange: number;
  }>>([]);

  useEffect(() => {
    if (marketData) {
      const processedData = Object.entries(marketData)
        .filter(([key]) => key !== 'timestamp')
        .map(([symbol, metrics]) => ({
          symbol: symbol.toUpperCase(),
          volume: (metrics as MarketMetric).volume_24h,
          priceChange: (metrics as MarketMetric).price_change_percent
        }))
        .sort((a, b) => b.volume - a.volume);
      
      setData(processedData);
    }
  }, [marketData]);

  const getHeatmapColor = (priceChange: number) => {
    if (priceChange > 5) return styles.veryPositive;
    if (priceChange > 2) return styles.positive;
    if (priceChange > 0) return styles.slightlyPositive;
    if (priceChange === 0) return styles.neutral;
    if (priceChange > -2) return styles.slightlyNegative;
    if (priceChange > -5) return styles.negative;
    return styles.veryNegative;
  };

  const getSize = (volume: number, maxVolume: number) => {
    const minSize = 60; // minimum tile size in pixels
    const maxSize = 120; // maximum tile size in pixels
    
    if (maxVolume === 0) return minSize;
    
    // Calculate size proportional to volume with a minimum size
    const size = minSize + ((volume / maxVolume) * (maxSize - minSize));
    return Math.round(size);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading market data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.noData}>
        <p>No market data available</p>
      </div>
    );
  }

  const maxVolume = Math.max(...data.map(item => item.volume));

  return (
    <div className={styles.heatmapContainer}>
      <h3>Market Heatmap</h3>
      <div className={styles.heatmapGrid}>
        {data.map(item => (
          <div
            key={item.symbol}
            className={`${styles.heatmapTile} ${getHeatmapColor(item.priceChange)}`}
            style={{
              width: `${getSize(item.volume, maxVolume)}px`,
              height: `${getSize(item.volume, maxVolume)}px`,
            }}
            title={`${item.symbol}: ${item.priceChange.toFixed(2)}%, Vol: $${item.volume.toLocaleString()}`}
          >
            <div className={styles.tileSymbol}>{item.symbol}</div>
            <div className={styles.tileValue}>{item.priceChange.toFixed(2)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeHeatmap; 