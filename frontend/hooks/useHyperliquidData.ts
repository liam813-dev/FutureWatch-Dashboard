import { useState, useEffect, useCallback } from 'react';
import { fetchHyperliquidData, HyperliquidData } from '../utils/hyperliquid';

interface UseHyperliquidDataProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface UseHyperliquidDataResult {
  data: HyperliquidData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export const useHyperliquidData = ({
  refreshInterval = 30000, // 30 seconds by default
  autoRefresh = true,
}: UseHyperliquidDataProps = {}): UseHyperliquidDataResult => {
  const [data, setData] = useState<HyperliquidData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching Hyperliquid data...');
      const liquidationData = await fetchHyperliquidData();
      
      // Validate that we got data back
      if (!liquidationData || !liquidationData.markets) {
        console.error('Invalid data structure returned from API');
        throw new Error('Failed to load data: Invalid response format');
      }
      
      setData(liquidationData);
      setIsLoading(false);
      console.log('Hyperliquid data fetched successfully');
    } catch (err) {
      console.error('Error fetching Hyperliquid data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch Hyperliquid data'));
      setIsLoading(false);
    }
  }, []);

  // Function to manually trigger refresh
  const refresh = useCallback(() => {
    console.log('Manual refresh triggered');
    setRefreshCount(prev => prev + 1);
  }, []);

  // Initial fetch and auto refresh
  useEffect(() => {
    // Initial fetch
    fetchData().catch(err => {
      console.error('Initial data fetch failed:', err);
    });
    
    // Set up auto refresh if enabled
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        console.log('Auto refresh triggered');
        fetchData().catch(err => {
          console.error('Auto refresh fetch failed:', err);
        });
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchData, autoRefresh, refreshInterval, refreshCount]);

  return { data, isLoading, error, refresh };
}; 