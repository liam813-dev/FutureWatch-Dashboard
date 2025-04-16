import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import IconButton from '@/components/common/IconButton';
import { FiChevronLeft, FiChevronRight, FiAlertCircle, FiBarChart2, FiSettings, FiBell, FiTrendingUp, FiDollarSign, FiActivity } from 'react-icons/fi';
import styles from '@/styles/components/Sidebar.module.css';
import { useMarketData } from '@/hooks/useMarketData';
import { useWebSocket } from '../contexts/WebSocketContext';

interface Liquidation {
  coin: string;
  side: string;
  value_usd: number;
}

interface Trade {
  symbol: string;
  side: string;
  value_usd: number;
}

interface ExtendedDashboardData {
  market_data: {
    btc: {
      price: number;
      volume_24h: number;
    };
    eth: {
      price: number;
    };
  };
  recent_large_trades: Trade[];
  recent_liquidations: Liquidation[];
}

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppContext();
  const { data, loading, error } = useMarketData();
  const { isConnected } = useWebSocket();
  
  // Remove the tabs state since we'll now show all sections

  // Extract data from market data
  const dashboardData = data as ExtendedDashboardData | null;
  const btcPrice = dashboardData?.market_data?.btc?.price || 0;
  const ethPrice = dashboardData?.market_data?.eth?.price || 0;
  const btcVolume = dashboardData?.market_data?.btc?.volume_24h || 0;
  const recentTrades = dashboardData?.recent_large_trades || [];
  const recentLiquidations = dashboardData?.recent_liquidations || [];

  // Format numbers
  const formatPrice = (price: number) => `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatVolume = (volume: number) => `$${(volume / 1000000000).toFixed(2)}B`;

  return (
    <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <IconButton
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </IconButton>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Loading market data...</div>
        ) : error ? (
          <div className={styles.error}>Error loading market data</div>
        ) : (
          <>
            {/* Market Stats Section */}
            <div>
              <div className={styles.sectionHeader}>
                <FiDollarSign size={14} />
                <span>Market Insights</span>
              </div>
              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>BTC Price</span>
                  <span className={styles.statValue}>{formatPrice(btcPrice)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>ETH Price</span>
                  <span className={styles.statValue}>{formatPrice(ethPrice)}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>24h Volume</span>
                  <span className={styles.statValue}>{formatVolume(btcVolume)}</span>
                </div>
              </div>
            </div>

            {/* Alerts Section */}
            <div>
              <div className={styles.sectionHeader}>
                <FiBell size={14} />
                <span>Recent Alerts</span>
              </div>
              <div className={styles.alerts}>
                {recentLiquidations.length > 0 ? (
                  recentLiquidations.slice(0, 3).map((liq: Liquidation, index: number) => (
                    <div key={index} className={styles.alertItem}>
                      <FiAlertCircle size={14} className={styles.alertIcon} />
                      <div className={styles.alertContent}>
                        <span className={styles.alertTitle}>
                          {liq.side === 'long' ? 'Long' : 'Short'} Liquidation
                        </span>
                        <span className={styles.alertDescription}>
                          {liq.coin} - {formatPrice(liq.value_usd)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noAlerts}>No recent liquidations</div>
                )}
              </div>
            </div>

            {/* Trading Insights Section */}
            <div>
              <div className={styles.sectionHeader}>
                <FiTrendingUp size={14} />
                <span>Trading Insights</span>
              </div>
              <div className={styles.insights}>
                {recentTrades.length > 0 ? (
                  recentTrades.slice(0, 3).map((trade: Trade, index: number) => (
                    <div key={index} className={styles.insightItem}>
                      <FiActivity size={14} className={styles.insightIcon} />
                      <div className={styles.insightContent}>
                        <span className={styles.insightTitle}>
                          Large {trade.side} Trade
                        </span>
                        <span className={styles.insightDescription}>
                          {trade.symbol} - {formatPrice(trade.value_usd)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noInsights}>No recent large trades</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {!sidebarCollapsed && (
        <div className={styles.footer}>
          <button className={styles.customizeButton}>
            <FiSettings size={14} />
            <span>Customize Dashboard</span>
          </button>
        </div>
      )}

      <div className={styles.connectionStatus}>
        <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
        <span className={styles.statusText}>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
};

export default Sidebar;