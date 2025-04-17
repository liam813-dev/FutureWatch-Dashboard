import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { RecentTrade } from '../types/data';
import ClientRelativeTime from './ClientRelativeTime';
import MultiSelectDropdown from './MultiSelectDropdown';
import styles from './TradeFeed.module.css';
import cardStyles from '../styles/CardFixes.module.css';

type SortKey = keyof RecentTrade;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

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

const TradeFeed: React.FC<TradeFeedProps> = ({ trades, isLoading, error }) => {
  console.log('[TradeFeed] Rendering with props:', {
    tradesCount: trades?.length || 0,
    isLoading,
    hasError: !!error,
    tradeSymbols: trades?.map(t => t.symbol).slice(0, 5)
  });

  const [minValueThreshold, setMinValueThreshold] = useState<number>(0);
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'time', direction: 'desc' });

  // IMPORTANT: Debug the available symbols
  useEffect(() => {
    if (trades && trades.length > 0) {
      const availableSymbols = Array.from(new Set(trades.map(t => t.symbol)));
      console.log('[TradeFeed] Available symbols:', availableSymbols);
    }
  }, [trades]);

  // Initialize popular symbols when component loads or trades change
  useEffect(() => {
    if (trades && trades.length > 0) {
      // If no symbols are selected yet, initialize with popular ones
      if (selectedSymbols.size === 0) {
        const availableSymbols = new Set(trades.map(t => t.symbol));
        const defaultSymbols = new Set<string>();
        
        // Try to add popular symbols if they exist in the data
        ['BTCUSDT', 'ETHUSDT'].forEach(symbol => {
          if (availableSymbols.has(symbol)) {
            defaultSymbols.add(symbol);
          }
        });

        // If we couldn't find the popular ones, add some of the available ones
        if (defaultSymbols.size === 0 && availableSymbols.size > 0) {
          // Add up to 3 available symbols
          const symbolsArray = Array.from(availableSymbols);
          for (let i = 0; i < Math.min(3, symbolsArray.length); i++) {
            defaultSymbols.add(symbolsArray[i]);
          }
        }

        console.log('[TradeFeed] Setting default selected symbols:', Array.from(defaultSymbols));
        if (defaultSymbols.size > 0) {
          setSelectedSymbols(defaultSymbols);
        }
      }
    }
  }, [trades]);

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
    setSortConfig(prevConfig => ({
      ...prevConfig,
      key,
      direction: prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleValueThresholdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMinValueThreshold(Number(event.target.value));
  };

  const handleSymbolSelectionChange = (newSelection: Set<string>) => {
    setSelectedSymbols(newSelection);
  };

  const processedTrades = useMemo(() => {
    console.log('[TradeFeed] Processing trades with filters:', {
      totalTrades: trades?.length || 0,
      minValueThreshold,
      selectedSymbols: selectedSymbols.size ? Array.from(selectedSymbols) : 'all'
    });

    let filtered = [...(trades || [])];
    
    // Apply value threshold filter
    if (minValueThreshold > 0) {
      filtered = filtered.filter(trade => trade.value_usd >= minValueThreshold);
    }
    
    // *** CRITICAL CHANGE: ONLY filter by symbol if we have selected symbols ***
    if (selectedSymbols.size > 0) {
      filtered = filtered.filter(trade => selectedSymbols.has(trade.symbol));
    } else {
      // If no symbols selected, show all trades (don't filter)
      console.log('[TradeFeed] No symbols selected, showing all trades');
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortConfig.key === 'time') {
        return sortConfig.direction === 'asc' 
          ? new Date(a.time).getTime() - new Date(b.time).getTime()
          : new Date(b.time).getTime() - new Date(a.time).getTime();
      }
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    console.log('[TradeFeed] Processed trades result:', {
      inputCount: trades?.length || 0,
      filteredCount: filtered.length,
      sampleTrades: filtered.slice(0, 2).map(t => `${t.symbol} ${t.side} $${t.value_usd}`)
    });
    
    return filtered;
  }, [trades, minValueThreshold, selectedSymbols, sortConfig]);

  // Add a helper to clear selection (show all trades)
  const clearSymbolSelection = () => {
    console.log('[TradeFeed] Clearing symbol selection to show all trades');
    setSelectedSymbols(new Set());
  };

  const SortableHeader: React.FC<{ columnKey: SortKey; label: string; className?: string; }> =
    ({ columnKey, label, className = '' }) => (
      <span
        className={`${styles.sortableHeader} ${className}`}
        onClick={() => handleSort(columnKey)}
      >
        {label}
        {sortConfig.key === columnKey && (
          <span className={styles.sortIndicator}>
            {sortConfig.direction === 'desc' ? '▼' : '▲'}
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
            {selectedSymbols.size > 0 && (
              <button 
                onClick={clearSymbolSelection}
                className={styles.clearButton}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={cardStyles.cardContent}>
        {processedTrades.length === 0 ? (
          <div className={cardStyles.emptyState}>
            <span className={cardStyles.emptyIcon}>📊</span>
            <p className={cardStyles.emptyText}>
              {trades.length === 0 
                ? 'No trades available from the server' 
                : 'No trades matching your filters'}
            </p>
            {selectedSymbols.size > 0 && trades.length > 0 && (
              <button
                onClick={clearSymbolSelection}
                className={styles.clearAllButton}
              >
                Show All Trades
              </button>
            )}
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
                  key={trade.id || `${trade.time}-${trade.symbol}-${trade.value_usd}-${index}`}
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