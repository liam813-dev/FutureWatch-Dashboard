export interface MarketMetric {
  price: number;
  volume_24h: number;
  open_interest: number;
  funding_rate: number;
  price_change_percent: number;
  market_cap?: number;
  dominance?: number;
  volatility_7d?: number;
  volatility_30d?: number;
  // Order book data
  bid_price?: number;
  ask_price?: number;
  bid_qty?: number;
  ask_qty?: number;
  spread?: number;
  spread_percent?: number;
  depth?: {
    bids: [string, string][]; // [price, quantity]
    asks: [string, string][]; // [price, quantity]
  };
}

export interface MarketData {
  btc: MarketMetric;
  eth: MarketMetric;
  [key: string]: MarketMetric; // Allow additional coins
}

export interface LiquidationPosition {
  coin: string;
  value: number;
  entry: number;
  liquidation: number;
  distance: number;
  leverage: number;
  address: string;
}

export interface RecentLiquidation {
  coin: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  value_usd: number;
  timestamp: string;
}

export interface RecentTrade {
  id: string;
  symbol: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: string;
  value_usd: number;
  quantity: number;
  time: string;
}

export interface DashboardData {
  market_data: MarketData;
  liquidation_positions: LiquidationPosition[];
  recent_liquidations: RecentLiquidation[];
  recent_large_trades: RecentTrade[];
  macro_data: MacroData | null;
}

export interface ApiResponse {
  type: string;
  timestamp: string;
  data: DashboardData;
}

export interface PriceData {
  timestamp: string;
  btc: number;
  eth: number;
}

// Types based on backend/app/models/schemas.py

// --- Macro Data Types ---
export interface MacroDataPoint {
  name: string;
  value: string | null;
  date: string | null;
  error: string | null;
}

export interface MacroData {
  cpi: MacroDataPoint;
  fed_rate: MacroDataPoint;
  unemployment: MacroDataPoint;
  wti_oil?: MacroDataPoint | null;
  brent_oil?: MacroDataPoint | null;
  natural_gas?: MacroDataPoint | null;
  copper?: MacroDataPoint | null;
  corn?: MacroDataPoint | null;
  wheat?: MacroDataPoint | null;
  coffee?: MacroDataPoint | null;
  sugar?: MacroDataPoint | null;
}
// --- End Macro Data Types ---
