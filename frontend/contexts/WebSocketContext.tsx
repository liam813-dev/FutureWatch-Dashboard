import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getWebSocketUrl } from '../utils/endpoints';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketContextType {
  data: any | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<WebSocketContextType>({
    data: null,
    isLoading: true,
    error: null,
    isConnected: false,
    sendMessage: (message: WebSocketMessage) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
      } else {
        setState(prev => ({
          ...prev,
          error: new Error('Cannot send message: WebSocket is not connected')
        }));
      }
    }
  });

  const connect = useRef(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[WebSocketContext] Attempting to connect to WebSocket...');
      ws.current = new WebSocket(getWebSocketUrl());

      ws.current.onopen = () => {
        console.log('[WebSocketContext] WebSocket connected successfully');
        reconnectAttempts.current = 0;
        setState(prev => ({ ...prev, isLoading: false, error: null, isConnected: true }));
      };

      ws.current.onmessage = (event) => {
        try {
          console.log('[WebSocketContext] Received WebSocket message');
          const message = JSON.parse(event.data);
          console.log('[WebSocketContext] Parsed message:', {
            type: message.type,
            hasData: !!message.data,
            marketData: message.data?.market_data ? 'present' : 'missing',
            liquidations: message.data?.recent_liquidations?.length || 0,
            trades: message.data?.recent_large_trades?.length || 0
          });
          setState(prev => ({ ...prev, data: message, error: null }));
        } catch (error) {
          console.error('[WebSocketContext] Error parsing WebSocket message:', error);
          setState(prev => ({ ...prev, error: new Error('Failed to parse server message') }));
        }
      };

      ws.current.onclose = () => {
        console.log('[WebSocketContext] WebSocket disconnected');
        setState(prev => ({ ...prev, isLoading: false, isConnected: false }));

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
            MAX_RECONNECT_DELAY
          );
          console.log(`[WebSocketContext] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect.current();
          }, delay);
        } else {
          setState(prev => ({
            ...prev,
            error: new Error('Failed to connect after multiple attempts. Please refresh the page.')
          }));
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocketContext] WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: new Error('Connection error occurred'),
          isLoading: false,
          isConnected: false
        }));
      };
    } catch (error) {
      console.error('[WebSocketContext] Error in connect function:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
        isLoading: false,
        isConnected: false
      }));
    }
  });

  useEffect(() => {
    console.log('[WebSocketContext] Initial connection attempt');
    connect.current();

    return () => {
      console.log('[WebSocketContext] Cleaning up WebSocket connection');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  console.log('[WebSocketContext] Current state:', {
    isLoading: state.isLoading,
    isConnected: state.isConnected,
    hasError: !!state.error,
    hasData: !!state.data
  });

  return (
    <WebSocketContext.Provider value={state}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 