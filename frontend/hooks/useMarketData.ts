import { useState, useEffect } from 'react';
import { DashboardData } from '../types';
import { ENDPOINTS } from '../utils/endpoints';

export function useMarketData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ENDPOINTS.dashboard);
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
} 