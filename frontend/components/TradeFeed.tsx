import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RecentTrade } from '../types/data';
import ClientRelativeTime from './ClientRelativeTime';
import MultiSelectDropdown from './MultiSelectDropdown';
import styles from './TradeFeed.module.css';
import cardStyles from '../styles/CardFixes.module.css';

// Define value filter thresholds
const VALUE_THRESHOLDS = [
    { label: '$1k+', value: 1000 },
    { label: '$10k+', value: 10000 },
    { label: '$100k+', value: 100000 },
    { label: '$1M+', value: 1000000 },
    { label: 'All', value: 0 },
];

interface TradeFeedProps {
  trades: RecentTrade[];
  isLoading: boolean;
  error: Error | null;
}

type SortKey = keyof RecentTrade | 'time';
type SortDirection = 'asc' | 'desc';

const TradeFeed: React.FC<TradeFeedProps> = ({ trades, isLoading, error }) => {
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [minValueThreshold, setMinValueThreshold] = useState<number>(VALUE_THRESHOLDS[0].value);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());

  const formatValue = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}k`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (num: number) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleSort = (key: SortKey) => {
    setSortDirection((prevDirection) =>
      key === sortKey && prevDirection === 'desc' ? 'asc' : 'desc'
    );
    setSortKey(key);
  };

  const handleValueThresholdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMinValueThreshold(Number(event.target.value));
  };

  const handleSymbolSelectionChange = (newSelection: Set<string>) => {
    setSelectedSymbols(newSelection);
  };

  const processedTrades = useMemo(() => {
    const filtered = trades.filter(trade =>
      selectedSymbols.has(trade.symbol) &&
      trade.value_usd >= minValueThreshold
    );

    let sortableItems = [...filtered];
    sortableItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortKey === 'time') {
        aValue = new Date(a.time).getTime();
        bValue = new Date(b.time).getTime();
      } else {
        aValue = a[sortKey];
        bValue = b[sortKey];
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [trades, selectedSymbols, minValueThreshold, sortKey, sortDirection]);

  const SortableHeader: React.FC<{ columnKey: SortKey; label: string; className?: string; }> =
    ({ columnKey, label, className = '' }) => (
      <span
        className={`${styles.sortableHeader} ${className}`}
        onClick={() => handleSort(columnKey)}
      >
        {label}
        {sortKey === columnKey && (
          <span className={styles.sortIndicator}>
            {sortDirection === 'desc' ? '▼' : '▲'}
          </span>
        )}
      </span>
    );

  if (isLoading) {
    return (
      <div className={cardStyles.cardContainer}>
        <div className={cardStyles.cardHeader}>
          <h2 className={cardStyles.cardTitle}>Large Trades Feed</h2>
        </div>
        <div className={cardStyles.loadingState}>
          <div className={cardStyles.loadingSpinner}>
            <span className={styles.loaderDot}></span>
            <span className={styles.loaderDot}></span>
            <span className={styles.loaderDot}></span>
          </div>
          <p className={cardStyles.loadingText}>Loading trades data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cardStyles.cardContainer}>
        <div className={cardStyles.cardHeader}>
          <h2 className={cardStyles.cardTitle}>Large Trades Feed</h2>
        </div>
        <div className={cardStyles.errorState}>
          <span className={cardStyles.errorIcon}>⚠️</span>
          <p className={cardStyles.errorMessage}>Error loading data: {error.message}</p>
          <p className={cardStyles.errorHint}>
            This may be due to connection issues or API limitations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardStyles.cardContainer}>
      <div className={cardStyles.cardHeader}>
        <h2 className={cardStyles.cardTitle}>Large Trades Feed</h2>
        <div className={styles.filterControls}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Min Value:</label>
            <select
              value={minValueThreshold}
              onChange={handleValueThresholdChange}
              className={styles.filterSelect}
            >
              {VALUE_THRESHOLDS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Symbols:</label>
            <MultiSelectDropdown
              label="Symbols"
              options={Array.from(new Set(trades.map(t => t.symbol)))}
              selectedOptions={selectedSymbols}
              onChange={handleSymbolSelectionChange}
            />
          </div>
        </div>
      </div>

      <div className={cardStyles.cardContent}>
        {processedTrades.length === 0 ? (
          <div className={cardStyles.emptyState}>
            <span className={cardStyles.emptyIcon}>📊</span>
            <p className={cardStyles.emptyText}>No trades matching your filters</p>
          </div>
        ) : (
          <div className={styles.listContainer}>
            <div className={styles.headerRow}>
              <SortableHeader columnKey="symbol" label="Coin" className={styles.symbol} />
              <SortableHeader columnKey="side" label="Side" className={styles.side} />
              <SortableHeader columnKey="price" label="Price" className={styles.price} />
              <SortableHeader columnKey="quantity" label="Size" className={styles.quantity} />
              <SortableHeader columnKey="value_usd" label="Value" className={styles.value} />
              <SortableHeader columnKey="time" label="Time" className={styles.timeHeader} />
            </div>
            
            <div className={styles.tradesList}>
              {processedTrades.map((trade, index) => (
                <div 
                  key={`${trade.time}-${trade.symbol}-${trade.value_usd}-${index}`}
                  className={`${styles.tradeItem} ${trade.side === 'buy' ? styles.buy : styles.sell}`}
                >
                  <span className={styles.symbol}>{trade.symbol}</span>
                  <span className={`${styles.side} ${trade.side === 'buy' ? styles.buyText : styles.sellText}`}>
                    {trade.side.toUpperCase()}
                  </span>
                  <span className={styles.price}>{formatPrice(trade.price)}</span>
                  <span className={styles.quantity}>{trade.quantity.toLocaleString()}</span>
                  <span className={`${styles.value} ${trade.value_usd > 1000000 ? styles.largeTrade : ''}`}>
                    {formatValue(trade.value_usd)}
                  </span>
                  <span className={styles.time}>
                    <ClientRelativeTime timestamp={trade.time} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeFeed; 