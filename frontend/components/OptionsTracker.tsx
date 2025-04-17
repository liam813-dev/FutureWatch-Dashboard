import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import styles from './OptionsTracker.module.css';

// Types
interface OptionsData {
  instrument_name: string;
  expiration_timestamp: number;
  expiration_date: string;
  strike: number;
  option_type: string;
  settlement_period: string;
  quote_currency: string;
  base_currency: string;
  is_active: boolean;
  creation_timestamp: number;
  expiring_soon: boolean;
}

interface OptionsResponse {
  success: boolean;
  data: OptionsData[];
  total_count: number;
  call_count: number;
  put_count: number;
  expiring_soon_count: number;
  filtered?: boolean;
  error?: string;
}

const OptionsTracker: React.FC = () => {
  // State
  const [options, setOptions] = useState<OptionsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    calls: 0,
    puts: 0,
    expiringSoon: 0
  });
  
  // Filter state
  const [optionType, setOptionType] = useState<string>('');
  const [minStrike, setMinStrike] = useState<number | null>(null);
  const [maxStrike, setMaxStrike] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  
  // Derived state
  const [uniqueExpiryDates, setUniqueExpiryDates] = useState<string[]>([]);
  const [strikeRange, setStrikeRange] = useState<{min: number, max: number}>({ min: 0, max: 0 });
  
  // Load options data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<OptionsResponse>('/api/options/btc', {
          params: {
            ...(optionType && { option_type: optionType }),
            ...(minStrike !== null && { min_strike: minStrike }),
            ...(maxStrike !== null && { max_strike: maxStrike }),
            ...(expiryDate && { expiry_date: expiryDate }),
          }
        });
        
        if (response.data.success) {
          setOptions(response.data.data);
          
          // Set summary stats from the response
          setSummaryStats({
            total: response.data.total_count,
            calls: response.data.call_count,
            puts: response.data.put_count,
            expiringSoon: response.data.expiring_soon_count
          });
          
          // Extract unique expiry dates for filter
          if (!response.data.filtered) {
            const dates = Array.from(new Set(response.data.data
              .map((opt: OptionsData) => opt.expiration_date)
              .filter(Boolean))) as string[];
            setUniqueExpiryDates(dates.sort());
            
            // Calculate strike price range for filters
            const strikes = response.data.data
              .map((opt: OptionsData) => opt.strike)
              .filter(Boolean) as number[];
            if (strikes.length > 0) {
              setStrikeRange({
                min: Math.floor(Math.min(...strikes) / 1000) * 1000,  // Round down to nearest thousand
                max: Math.ceil(Math.max(...strikes) / 1000) * 1000,   // Round up to nearest thousand
              });
            }
          }
        } else {
          setError(response.data.error || 'Failed to fetch options data');
        }
      } catch (err) {
        setError('Error fetching options data');
        console.error('Error fetching options data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [optionType, minStrike, maxStrike, expiryDate]);
  
  // Reset filters
  const resetFilters = () => {
    setOptionType('');
    setMinStrike(null);
    setMaxStrike(null);
    setExpiryDate('');
  };
  
  // Generate strike price options for dropdown based on range
  const strikeOptions = useMemo(() => {
    const options: number[] = [];
    if (strikeRange.min !== 0 && strikeRange.max !== 0) {
      for (let i = strikeRange.min; i <= strikeRange.max; i += 1000) {
        options.push(i);
      }
    }
    return options;
  }, [strikeRange]);
  
  return (
    <div className={styles.optionsTrackerContainer}>
      <div className={styles.header}>
        <h2>BTC Options</h2>
        <div className={styles.statsContainer}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Total:</span>
            <span className={styles.statValue}>{loading ? '-' : summaryStats.total}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Call/Put:</span>
            <span className={styles.statValue}>
              {loading ? '- / -' : `${summaryStats.calls} / ${summaryStats.puts}`}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Expiring Soon:</span>
            <span className={styles.statValue}>
              {loading ? '-' : summaryStats.expiringSoon}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="optionType">Option Type</label>
          <select 
            id="optionType" 
            value={optionType} 
            onChange={(e) => setOptionType(e.target.value)}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="minStrike">Min Strike</label>
          <select
            id="minStrike"
            value={minStrike || ''}
            onChange={(e) => setMinStrike(e.target.value ? Number(e.target.value) : null)}
            className={styles.select}
          >
            <option value="">Any</option>
            {strikeOptions.map(strike => (
              <option key={`min-${strike}`} value={strike}>
                ${strike.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="maxStrike">Max Strike</label>
          <select
            id="maxStrike"
            value={maxStrike || ''}
            onChange={(e) => setMaxStrike(e.target.value ? Number(e.target.value) : null)}
            className={styles.select}
          >
            <option value="">Any</option>
            {strikeOptions.map(strike => (
              <option key={`max-${strike}`} value={strike}>
                ${strike.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="expiryDate">Expiry Date</label>
          <select
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={styles.select}
          >
            <option value="">All Dates</option>
            {uniqueExpiryDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={resetFilters}
          className={styles.resetButton}
        >
          Reset Filters
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading options data...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              resetFilters();
            }}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.optionsTable}>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Expiry</th>
                <th>Strike</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {options.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.noData}>No options found matching the selected filters</td>
                </tr>
              ) : (
                options.map((option) => (
                  <tr 
                    key={option.instrument_name}
                    className={`${styles.optionRow} ${option.expiring_soon ? styles.expiringSoon : ''}`}
                  >
                    <td className={styles.instrumentName} title={option.instrument_name}>
                      {option.instrument_name}
                    </td>
                    <td className={styles.expiryDate}>
                      {option.expiration_date}
                    </td>
                    <td className={styles.strike}>
                      ${option.strike.toLocaleString()}
                    </td>
                    <td className={`${styles.optionType} ${styles[option.option_type]}`}>
                      {option.option_type.toUpperCase()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OptionsTracker; 