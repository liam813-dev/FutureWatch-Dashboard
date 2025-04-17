import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/endpoints';

// CoinDesk Asset Events API types
export interface AssetEvent {
  id: string;
  name: string;
  description: string;
  asset_id: string;
  asset_symbol: string;
  start_date: string;
  end_date?: string;
  event_type: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetEventsResponse {
  data: AssetEvent[];
  metadata: {
    next_page?: string;
  };
}

// Use our backend proxy endpoint instead of direct CoinDesk API
const BACKEND_API_URL = `${API_BASE}/api/coindesk/events`;

/**
 * Fetches significant events for a specific digital asset from CoinDesk API via our backend proxy
 * @param asset The symbol of the digital asset (e.g., BTC, ETH)
 * @param limit Number of events to return (default 30, max 100)
 * @param toTs Unix timestamp for pagination (fetch events before this time)
 * @returns Promise with asset events data
 */
export async function fetchAssetEvents(
  asset: string,
  limit: number = 30,
  toTs?: number
): Promise<AssetEventsResponse> {
  const params = new URLSearchParams({
    asset: asset,
    asset_lookup_priority: 'SYMBOL',
    limit: limit.toString(),
  });

  if (toTs) {
    params.append('to_ts', toTs.toString());
  }

  const url = `${BACKEND_API_URL}?${params.toString()}`;
  console.log(`[CoinDesk API] Fetching events through proxy for ${asset} from: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CoinDesk API] Error response (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: AssetEventsResponse = await response.json();
    console.log(`[CoinDesk API] Successfully fetched ${data.data?.length || 0} events for ${asset}`);
    console.log('[CoinDesk API] First event sample:', data.data?.[0] || 'No events');
    return data;
  } catch (error) {
    console.error('[CoinDesk API] Error fetching asset events:', error);
    
    // Generate sample data for testing if the API is failing
    if (process.env.NODE_ENV === 'development') {
      console.log('[CoinDesk API] Using sample data due to API failure');
      return generateSampleData(asset);
    }
    
    throw error;
  }
}

// Generate sample data for testing when API fails
function generateSampleData(asset: string): AssetEventsResponse {
  return {
    data: [
      {
        id: '1',
        name: `${asset} Network Upgrade - Sample`,
        description: `This is a sample ${asset} network upgrade event for testing when the API is not available.`,
        asset_id: '1',
        asset_symbol: asset,
        start_date: new Date().toISOString(),
        event_type: 'HARD-FORK',
        source_url: 'https://example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: `${asset} Security Incident - Sample`,
        description: `This is a sample ${asset} security incident event for testing.`,
        asset_id: '1',
        asset_symbol: asset,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        event_type: 'SECURITY-INCIDENT',
        source_url: 'https://example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: `${asset} Foundation Announcement - Sample`,
        description: `This is a sample ${asset} foundation announcement for testing.`,
        asset_id: '1',
        asset_symbol: asset,
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        event_type: 'OTHER',
        source_url: 'https://example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ],
    metadata: {}
  };
}

/**
 * React hook to fetch and manage asset events data
 * @param asset The symbol of the digital asset (e.g., BTC, ETH)
 * @param limit Number of events to return (default 30, max 100)
 * @returns Object with events data, loading state, error state, and a function to load more events
 */
export function useAssetEvents(asset: string, limit: number = 30) {
  const [events, setEvents] = useState<AssetEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [nextPageTimestamp, setNextPageTimestamp] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadEvents = async (toTimestamp?: number) => {
    console.log(`[useAssetEvents] Loading events for ${asset} ${toTimestamp ? `with timestamp: ${toTimestamp}` : '(initial load)'}`);
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchAssetEvents(asset, limit, toTimestamp || undefined);
      
      if (result && Array.isArray(result.data)) { 
        if (toTimestamp) {
          // Append new events when loading more
          console.log(`[useAssetEvents] Appending ${result.data.length} new events to existing ${events.length} events`);
          setEvents(prev => [...prev, ...result.data]);
        } else {
          // Replace events when loading for the first time
          console.log(`[useAssetEvents] Setting initial ${result.data.length} events`);
          setEvents(result.data);
        }
      
        // Check if there's a next page (using result.metadata)
        if (result.metadata?.next_page) {
          const nextTimestamp = parseInt(
            new URLSearchParams(new URL(result.metadata.next_page).search).get('to_ts') || '0'
          );
          console.log(`[useAssetEvents] Next page available with timestamp: ${nextTimestamp}`);
          setNextPageTimestamp(nextTimestamp);
          setHasMore(true);
        } else {
          console.log(`[useAssetEvents] No more pages available`);
          setHasMore(false);
        }
      } else {
        // Handle cases where result or result.data is invalid/missing
        console.warn(`[useAssetEvents] Invalid or missing data in API response for ${asset}. Result:`, result);
        if (!toTimestamp) { // If initial load failed, set empty array
            setEvents([]);
        }
        setHasMore(false); 
      }

    } catch (err) {
      console.error(`[useAssetEvents] Error in hook:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching asset events'));
      setHasMore(false); // Ensure we don't try to load more on error
      
      // If in development and no events loaded yet, use sample data
      // Note: The check above handles setting empty array on error for initial load
      // if (process.env.NODE_ENV === 'development' && events.length === 0) {
      //   console.log('[useAssetEvents] Using sample data in hook due to API error');
      //   const sampleData = generateSampleData(asset);
      //   setEvents(sampleData.data);
      //   setHasMore(false);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && nextPageTimestamp && !isLoading) {
      console.log(`[useAssetEvents] Loading more events with timestamp: ${nextPageTimestamp}`);
      loadEvents(nextPageTimestamp);
    }
  };

  useEffect(() => {
    console.log(`[useAssetEvents] Effect triggered for asset: ${asset}, limit: ${limit}`);
    loadEvents();
  }, [asset, limit]);

  return { events, isLoading, error, loadMore, hasMore };
} 