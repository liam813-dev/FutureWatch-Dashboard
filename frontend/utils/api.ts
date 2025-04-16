import { ApiResponse } from '../types/data';

// Determine the base API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// Remove the old unused fetch function
// export async function fetchDashboardData(): Promise<ApiResponse> {
//   const response = await fetch('/api/data');
//   if (!response.ok) {
//     throw new Error(`API error: ${response.status}`);
//   }
//   return await response.json();
// }

export function createWebSocketConnection(
  onMessage: (data: ApiResponse) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event | Error) => void
): WebSocket {
  // Determine protocol based on current page protocol
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // Use the API_BASE_URL to construct the WebSocket URL
  // Remove http:// or https:// from API_BASE_URL to get the host
  const host = API_BASE_URL.replace(/^https?:\/\//, '');
  const wsUrl = `${protocol}//${host}/ws`;

  console.log(`Connecting to WebSocket at: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    if (onOpen) onOpen();
  };
  
  ws.onmessage = (event) => {
    let parsedData: ApiResponse | null = null;
    try {
      parsedData = JSON.parse(event.data) as ApiResponse;
      if (typeof parsedData !== 'object' || parsedData === null || !parsedData.type || !parsedData.data) {
          throw new Error('Invalid message structure received');
      }
    } catch (parseError) {
      console.error('Error parsing WebSocket message:', parseError, 'Raw data:', event.data);
      if (onError) {
        onError(parseError instanceof Error ? parseError : new Error(String(parseError)));
      }
      return;
    }

    try {
        onMessage(parsedData);
    } catch (callbackError) {
        console.error('Error executing onMessage callback:', callbackError);
        if (onError) {
            onError(callbackError instanceof Error ? callbackError : new Error(String(callbackError)));
        }
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    if (onClose) onClose();
  };
  
  ws.onerror = (event: Event) => { 
    console.error('WebSocket error:', event);
    if (onError) onError(event);
  };
  
  return ws;
}
