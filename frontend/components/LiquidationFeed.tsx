import React, { useState, useMemo, useEffect } from 'react';
import { RecentLiquidation } from '../types/data'; // Corrected type import
import ClientRelativeTime from './ClientRelativeTime'; // Keep path as is for now, linter might be delayed
import MultiSelectDropdown from './MultiSelectDropdown'; // Import the new component
import styles from './LiquidationFeed.module.css'; // Create a CSS module for styling
import cardStyles from '../styles/CardFixes.module.css'; // Import the new card fixes styles

// Define symbol groups - keep these for defining the options
// const TOP_COINS = ... (can be removed if not used elsewhere)
// const MEME_COINS = ... (can be removed if not used elsewhere)

// Define value filter thresholds (same as TradeFeed)
const VALUE_THRESHOLDS = [
    { label: '$1k+', value: 1000 },
    { label: '$10k+', value: 10000 },
    { label: '$100k+', value: 100000 },
    { label: '$1M+', value: 1000000 },
    { label: 'All', value: 0 }, 
];

interface LiquidationFeedProps {
  liquidations: RecentLiquidation[];
  isLoading: boolean;
  error: Error | null;
}

// Use correct key type from RecentLiquidation, plus 'timestamp' which we use for sorting
type SortKey = keyof RecentLiquidation | 'timestamp';
type SortDirection = 'asc' | 'desc';

const LiquidationFeed: React.FC<LiquidationFeedProps> = ({ liquidations, isLoading: isLoadingLiquidations, error: liquidationsError }) => {
  const [sortKey, setSortKey] = useState<SortKey>('value_usd');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  // State for selected minimum value threshold
  const [minValueThreshold, setMinValueThreshold] = useState<number>(VALUE_THRESHOLDS[0].value); // Default to $1k+
  // State for the fetched symbols
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState<boolean>(true);
  const [symbolsError, setSymbolsError] = useState<Error | null>(null);
  // State for selected symbols (initially empty, populated after fetch)
  const [selectedSymbols, setSelectedSymbols] = useState<Set<string>>(new Set());

  // Fetch symbols on component mount
  useEffect(() => {
    const fetchSymbols = async () => {
      setIsLoadingSymbols(true);
      setSymbolsError(null);
      try {
        const response = await fetch('http://localhost:8001/api/symbols');
        if (!response.ok) {
          throw new Error(`Failed to fetch symbols: ${response.statusText}`);
        }
        const data: string[] = await response.json();
        const sortedData = data.sort();
        setAvailableSymbols(sortedData);
        setSelectedSymbols(new Set(sortedData)); // Select all fetched symbols by default
        console.log('[LiquidationFeed] Fetched and set symbols:', sortedData);
      } catch (err) {
        console.error('[LiquidationFeed] Error fetching symbols:', err);
        setSymbolsError(err instanceof Error ? err : new Error('Unknown error fetching symbols'));
        setAvailableSymbols([]);
        setSelectedSymbols(new Set());
      } finally {
        setIsLoadingSymbols(false);
      }
    };

    fetchSymbols();
  }, []);

  // Log received liquidations prop (optional debugging)
  useEffect(() => {
      console.log('[LiquidationFeed] Received liquidations:', liquidations);
  }, [liquidations]);

  const formatNumber = (num: number, prefix = '$', decimals = 2) => {
    return `${prefix}${num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };
  
  const formatSize = (num: number, coin: string) => {
    // Simple formatting, could be improved based on coin decimals
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  };

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

  // Handle value threshold change
  const handleValueThresholdChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMinValueThreshold(Number(event.target.value));
  };

  // Callback for the new dropdown
  const handleSymbolSelectionChange = (newSelection: Set<string>) => {
    setSelectedSymbols(newSelection);
  };

  const processedLiquidations = useMemo(() => {
    // Filter by value threshold AND selected symbols
    const filtered = liquidations.filter(liq => 
        liq.value_usd >= minValueThreshold &&
        selectedSymbols.has(liq.coin) // Filter by selected coin
    );
    console.log(`[LiquidationFeed] Filtering ${liquidations?.length || 0} liqs by value >= ${minValueThreshold} and ${selectedSymbols.size} symbols. Found ${filtered.length}.`);

    let sortableItems = [...filtered];
    sortableItems.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortKey === 'timestamp') { 
            aValue = new Date(a.timestamp).getTime(); // Special handling for timestamp
            bValue = new Date(b.timestamp).getTime();
        } else {
            // Access properties using keyof RecentLiquidation for type safety
            // Ensure correct comparison for strings vs numbers
            aValue = a[sortKey as keyof RecentLiquidation]; 
            bValue = b[sortKey as keyof RecentLiquidation]; 
        }

        // Type-aware comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return sortDirection === 'asc' ? comparison : -comparison;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        } else {
            // Handle potential type mismatches or fallback
             if (String(aValue) < String(bValue)) {
                return sortDirection === 'asc' ? -1 : 1;
             }
             if (String(aValue) > String(bValue)) {
                return sortDirection === 'asc' ? 1 : -1;
             }
             return 0;
        }
    });
    return sortableItems;
  }, [liquidations, minValueThreshold, selectedSymbols, sortKey, sortDirection]);

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

  // Combined loading state
  const isLoading = isLoadingLiquidations || isLoadingSymbols;
  // Combined error state
  const error = liquidationsError || symbolsError;

  if (isLoading) {
    return (
      <div className={cardStyles.cardContainer}>
        <div className={cardStyles.cardHeader}>
          <h2 className={cardStyles.cardTitle}>Liquidation Feed</h2>
        </div>
        <div className={cardStyles.loadingState}>
          <div className={cardStyles.loadingSpinner}>
            <span className={styles.loaderDot}></span>
            <span className={styles.loaderDot}></span>
            <span className={styles.loaderDot}></span>
          </div>
          <p className={cardStyles.loadingText}>Loading liquidations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cardStyles.cardContainer}>
        <div className={cardStyles.cardHeader}>
          <h2 className={cardStyles.cardTitle}>Liquidation Feed</h2>
        </div>
        <div className={cardStyles.errorState}>
          <span className={cardStyles.errorIcon}>⚠️</span>
          <p className={cardStyles.errorMessage}>Error loading liquidations: Failed to fetch</p>
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
        <h2 className={cardStyles.cardTitle}>Liquidation Feed</h2>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={minValueThreshold}
            onChange={handleValueThresholdChange}
          >
            {VALUE_THRESHOLDS.map((threshold) => (
              <option key={threshold.value} value={threshold.value}>
                {threshold.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={cardStyles.cardContent}>
        {processedLiquidations.length === 0 ? (
          <div className={cardStyles.emptyState}>
            <span className={cardStyles.emptyIcon}>📊</span>
            <p className={cardStyles.emptyText}>No liquidations matching your filters</p>
          </div>
        ) : (
          <div className={styles.listContainer}>
            <div className={styles.headerRow}>
              <SortableHeader columnKey="coin" label="Coin" className={styles.coin} />
              <SortableHeader columnKey="side" label="Side" className={styles.side} />
              <SortableHeader columnKey="value_usd" label="Value" className={styles.value} />
              <SortableHeader columnKey="timestamp" label="Time" className={styles.timeHeader} />
            </div>
            {processedLiquidations.map((liq, index) => (
              <div 
                className={`${styles.liqItem} ${liq.side === 'long' ? styles.long : styles.short}`} 
                key={`${liq.timestamp}-${liq.coin}-${liq.value_usd}-${index}`}
              >
                <div className={styles.liqInfo}>
                  <span className={styles.coin}>{liq.coin}</span>
                  <span className={styles.side}>{liq.side}</span>
                  <span className={styles.value}>{formatValue(liq.value_usd)}</span>
                </div>
                <span className={styles.time}>
                  <ClientRelativeTime timestamp={liq.timestamp} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquidationFeed; 