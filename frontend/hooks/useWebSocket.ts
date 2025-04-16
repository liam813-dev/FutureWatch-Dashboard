import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketState {
  data: any | null;
  isLoading: boolean;
  error: Error | null;
}

export const useWebSocket = (url: string, onMessage?: (message: WebSocketMessage) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    data: null,
    isLoading: true,
    error: null
  });

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isLoading: false }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setState(prev => ({ ...prev, data: message }));
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setState(prev => ({ ...prev, error: error as Error }));
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isLoading: false }));
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: new Error('WebSocket error occurred'), isLoading: false }));
      };
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, isLoading: false }));
    }
  }, [url, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  return { ...state, sendMessage };
}; 