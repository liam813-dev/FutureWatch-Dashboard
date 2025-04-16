import { ApiResponse } from '../types/data';

interface WebSocketHandlers {
  onMessage: (data: ApiResponse) => void;
  onError?: (error: Event) => void;
  onReconnect?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second
  private pingInterval: NodeJS.Timeout | null = null;
  private handlers: WebSocketHandlers;

  constructor(url: string, handlers: WebSocketHandlers) {
    this.url = url;
    this.handlers = handlers;
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectTimeout = 1000;
      this.setupPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ApiResponse;
        this.handlers.onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.clearPing();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.handlers.onError) {
        this.handlers.onError(error);
      }
    };
  }

  private setupPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Send ping every 30 seconds
  }

  private clearPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.handlers.onError) {
        this.handlers.onError(new Event('Max reconnection attempts reached'));
      }
      return;
    }

    console.log(`Reconnecting in ${this.reconnectTimeout / 1000} seconds...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      if (this.handlers.onReconnect) {
        this.handlers.onReconnect();
      }
      this.connect();
    }, this.reconnectTimeout);

    // Exponential backoff
    this.reconnectTimeout = Math.min(this.reconnectTimeout * 2, 30000);
  }

  public disconnect(): void {
    this.clearPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 