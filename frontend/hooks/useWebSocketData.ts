import { useState, useEffect, useMemo, useRef } from 'react';
import { ApiResponse, MacroData, DashboardData } from '../types/data';
import { createWebSocketConnection } from '../utils/api';

export const useWebSocketData = (refreshInterval: number = 5) => {
  console.log('[useWebSocketData] Hook initialized');
  
  // State for the latest NON-macro data received
  const [latestUpdate, setLatestUpdate] = useState<Omit<DashboardData, 'macro_data'> | null>(null);
  
  // State to hold the last valid macro data received
  const [lastKnownMacroData, setLastKnownMacroData] = useState<MacroData | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs to track loading state timeouts
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Last data timestamp to prevent flashing on quick reconnects
  const lastDataTimestampRef = useRef<number>(0);

  // Effect 1: Manage WebSocket connection and update intermediate states
  useEffect(() => {
    console.log('[useWebSocketData] Connection useEffect triggered');
    let ws: WebSocket | null = null;

    // Clear any existing timeout on re-connection
    const clearLoadingTimeout = () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const connect = () => {
      console.log('[useWebSocketData] Attempting connection...');
      clearLoadingTimeout(); // Clear any existing timeout
      
      ws = createWebSocketConnection(
        (message: ApiResponse) => { // onMessage
          console.log(`[useWebSocketData] Message received. Type: ${message?.type}`);
          try {
            // --- Log raw incoming macro data --- 
            const rawIncomingMacro = message?.data?.macro_data;
            console.log(`[useWebSocketData] Raw incoming macro_data: ${JSON.stringify(rawIncomingMacro)}`);
            // ------------------------------------

            if (!message || !message.data) {
                 console.warn('[useWebSocketData] Received empty or invalid message structure.');
                 return; 
            }
            
            const { macro_data, ...restOfData } = message.data;
            
            // Update last data timestamp
            lastDataTimestampRef.current = Date.now();

            // Update latest non-macro data
            setLatestUpdate(prevData => {
              // Merge with previous data to ensure we don't lose fields
              return { ...prevData, ...restOfData };
            });

            // Update last known macro data if valid
            if (macro_data && macro_data.cpi && macro_data.cpi.value !== null) {
              // --- Log before setting last known --- 
              console.log(`[useWebSocketData] Valid macro_data received. Calling setLastKnownMacroData with: ${JSON.stringify(macro_data)}`);
              // ------------------------------------
              setLastKnownMacroData(macro_data);
            } else {
                 console.log('[useWebSocketData] No valid macro data in message. NOT updating lastKnownMacroData.'); 
            }
            
            // Only set loading to false if we're still loading
            if (isLoading) {
                 console.log('[useWebSocketData] Setting isLoading to false (onMessage)');
                 setIsLoading(false);
            }
            setError(null); 

          } catch (err) {
            console.error('[useWebSocketData] Error processing message:', err);
            setError(err instanceof Error ? err : new Error('Failed to process WebSocket message'));
            setIsLoading(false); 
          }
        },
        () => { // onOpen
          console.log('[useWebSocketData] WebSocket connected (onOpen)');
          clearLoadingTimeout(); // Clear any existing timeout
          
          if (isLoading) {
            console.log('[useWebSocketData] Setting isLoading to false (onOpen)');
            setIsLoading(false);
          }
          setError(null);
        },
        () => { // onClose
          console.log('[useWebSocketData] WebSocket disconnected (onClose)');
          
          // Only set loading state after a delay to prevent flashing
          // and only if there's no recent data
          clearLoadingTimeout();
          
          // If we've received data recently (within 5 seconds), delay showing loading state
          const timeSinceLastData = Date.now() - lastDataTimestampRef.current;
          const shouldDelayLoading = timeSinceLastData < 5000 && lastDataTimestampRef.current > 0;
          
          if (shouldDelayLoading) {
            console.log('[useWebSocketData] Recent data exists, delaying loading state change');
            loadingTimeoutRef.current = setTimeout(() => {
              // Only change loading state if we're still disconnected
              if (!ws || ws.readyState !== WebSocket.OPEN) {
                console.log('[useWebSocketData] Connection still closed after delay, setting isLoading to true');
                setIsLoading(true);
              }
            }, 2000); // 2 second delay
          } else if (!isLoading) {
            console.log('[useWebSocketData] No recent data, setting isLoading to true immediately');
            setIsLoading(true);
          }
          
          // Keep the data around for smoother reconnects
          // Do NOT clear latestUpdate here
          
          // Attempt to reconnect
          setTimeout(connect, refreshInterval * 1000);
        },
        (err) => { // onError
          // Differentiate between WebSocket Event errors and our custom Error objects
          if (err instanceof Event) {
              console.error('[useWebSocketData] WebSocket native error (onError):', err.type);
              setError(new Error(`WebSocket error: ${err.type}`)); // Create a generic Error for Event types
          } else if (err instanceof Error) {
              console.error('[useWebSocketData] WebSocket processing error (onError):', err.message);
              setError(err); // Use the specific Error object
          } else {
              console.error('[useWebSocketData] Unknown WebSocket error type (onError):', err);
              setError(new Error('Unknown WebSocket error'));
          }
          
          // Don't immediately set loading state on error
          // The connection might recover without user seeing loading state
          clearLoadingTimeout();
          loadingTimeoutRef.current = setTimeout(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              console.log('[useWebSocketData] Connection still has error after delay, setting isLoading to true');
              setIsLoading(true);
            }
          }, 1000); // 1 second delay before showing loading state
        }
      );
    };

    connect();

    // Cleanup function
    return () => {
      console.log('[useWebSocketData] Cleanup: Closing WebSocket');
      clearLoadingTimeout();
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      }
    };
  }, [refreshInterval, isLoading]); // Only depends on interval and loading state

  // Use useMemo to compute the final combined data structure
  const combinedData = useMemo<ApiResponse | null>(() => {
      // --- Log inputs to useMemo --- 
      console.log(`[useWebSocketData] useMemo calculating. latestUpdate defined: ${!!latestUpdate}, lastKnownMacroData: ${JSON.stringify(lastKnownMacroData)}`);
      // -----------------------------
      if (latestUpdate) {
          const combinedDashboardData: DashboardData = {
              ...latestUpdate,
              macro_data: lastKnownMacroData // Always use the last known macro data
          };
          const finalApiResponse: ApiResponse = {
              type: 'dashboard_update',
              timestamp: new Date().toISOString(), 
              data: combinedDashboardData
          };
          // --- Log output of useMemo --- 
          console.log(`[useWebSocketData] useMemo result: ${JSON.stringify(finalApiResponse?.data?.macro_data)}`);
          // -----------------------------
          return finalApiResponse;
      }
      console.log('[useWebSocketData] useMemo returning null (no latestUpdate).');
      return null; // Return null if we don't have the main update yet
  }, [latestUpdate, lastKnownMacroData]); // Recompute only when these change

  console.log(`[useWebSocketData] Returning state: isLoading=${isLoading}, hasData=${!!combinedData}, hasMacro=${!!combinedData?.data?.macro_data}, error=${!!error}`);
  // Return the memoized combined data
  return { data: combinedData, isLoading, error };
}; 