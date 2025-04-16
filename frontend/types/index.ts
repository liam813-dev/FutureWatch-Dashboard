export interface MarketMetric {
  price: number;
  volume_24h: number;
  open_interest: number;
  funding_rate: number;
  price_change_percent: number;
}

export interface MarketData {
  btc: MarketMetric;
  eth: MarketMetric;
}

export interface LiquidationPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  timestamp: string;
}

export interface TerminalLog {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface DashboardData {
  market_data: MarketData;
  liquidation_positions: LiquidationPosition[];
  terminal_logs?: TerminalLog[];
}

export interface ApiResponse {
  data: DashboardData;
  error: string | null;
  timestamp: string;
} 