import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PriceChart from '@/components/PriceChart';
import StablePriceChart from '@/components/StablePriceChart';
import LiquidationFeed from '@/components/LiquidationFeed';
import TradeFeed from '@/components/TradeFeed';
import ResizableCard from '@/components/ResizableCard';
import Sidebar from './Sidebar';
import { useWebSocket } from '@/contexts/WebSocketContext';
import styles from '@/styles/Home.module.css';
// Import dashboard styles
import dashboardStyles from './Dashboard.module.css';
import { MarketData, MarketMetric, DashboardData, RecentLiquidation, RecentTrade } from '@/types/data';
import { fetchAssetEvents } from '@/services/coindeskApi';
import { useAppContext } from '@/contexts/AppContext';

// Import React Grid Layout
import ReactGridLayout, { Responsive, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import components
import MarketMetrics from '@/components/MarketMetrics';
import AlertsPanel from '@/components/AlertsPanel';
import MarketInsights from '@/components/MarketInsights';
import RecentActivity from '@/components/RecentActivity';
import MacroSummary from '@/components/MacroSummary';
import AssetEvents from '@/components/AssetEvents';
import OptionsTracker from '@/components/OptionsTracker';
import TradeHeatmap from '@/components/TradeHeatmap';

// RGL setup
const ResponsiveReactGridLayout = Responsive as any; // Type assertion to avoid TS error
const WidthProvider = (ReactGridLayout as any).WidthProvider;
const ResponsiveGridLayout = WidthProvider(ResponsiveReactGridLayout);

// Default market data placeholder
const defaultMarketMetric: MarketMetric = {
  price: 0,
  volume_24h: 0,
  open_interest: 0,
  funding_rate: 0,
  price_change_percent: 0
};

// Default market data
const defaultMarketData: MarketData = {
  btc: defaultMarketMetric,
  eth: defaultMarketMetric
};

// Type for component props
type ComponentRendererProps = {
  id?: string;
  key?: string;
  className?: string;
}

// Define component mapping types
type ComponentConfig = {
  title: string;
  description: string;
  component: () => JSX.Element;
  fullWidth?: boolean;
  priority?: number;
  category: 'market' | 'trades' | 'insights' | 'alerts';
};

type ComponentMapper = Record<string, ComponentConfig>;

const Dashboard: React.FC = () => {
  const { sidebarCollapsed } = useAppContext();
  const { data, isLoading, error, sendMessage } = useWebSocket();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Dashboard view states
  const [selectedView, setSelectedView] = useState<'overview' | 'market' | 'trades' | 'insights'>('overview');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // Settings
  const [settings, setSettings] = useState({
    showPriceChart: true,
    showMarketMetrics: true,
    showLiquidationFeed: true,
    showTradeFeed: true,
    showAlerts: true,
    showInsights: true,
    showExtraCoins: false,
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  // Props for components
  const liqProps = {
    liquidations: data?.data?.recent_liquidations || [] as RecentLiquidation[],
    isLoading,
    error
  };

  const tradeProps = {
    trades: data?.data?.recent_large_trades || [] as RecentTrade[],
    isLoading,
    error
  };

  // Render a component with appropriate wrapper
  const renderComponent = (id: string, config: ComponentConfig) => {
    return (
      <div 
        key={id}
        className={`${styles.dashboardWidget} ${
          config.fullWidth ? styles.fullWidth : ''
        } ${styles[`category-${config.category}`]}`}
      >
        <ResizableCard
          id={id}
          title={config.title}
          description={config.description}
          className={styles.widgetCard}
        >
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
              <p>Loading {config.title.toLowerCase()}...</p>
            </div>
          ) : error ? (
            <div className={styles.loadingContainer}>
              <p>Error loading {config.title.toLowerCase()}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <config.component />
          )}
        </ResizableCard>
      </div>
    );
  };

  // Component mapping with added metadata
  const componentMapping: ComponentMapper = {
    'marketMetrics': {
      title: 'Market Metrics',
      description: 'Key metrics for major cryptocurrencies',
      category: 'market',
      priority: 1,
      component: () => (
        <div className={styles.cardContentWrapper}>
        <MarketMetrics 
          layout="horizontal"
          showExtraCoins={settings.showExtraCoins}
        />
        </div>
      )
    },
    'priceChart': {
      title: 'Price Chart',
      description: 'Real-time price movements',
      category: 'market',
      priority: 2,
      component: () => <PriceChart marketData={data?.data?.market_data || defaultMarketData} />
    },
    'stablePriceChart': {
      title: 'Stable Price Chart',
      description: 'Price movements for stablecoins',
      category: 'market',
      priority: 4,
      component: () => <StablePriceChart />
    },
    'liquidationFeed': {
      title: 'Liquidation Feed',
      description: 'Recent liquidation events',
      category: 'trades',
      priority: 1,
      component: () => <LiquidationFeed {...liqProps} />
    },
    'tradeFeed': {
      title: 'Trade Feed',
      description: 'Recent significant trades',
      category: 'trades',
      priority: 2,
      component: () => <TradeFeed {...tradeProps} />
    },
    'optionsTracker': {
      title: 'BTC Options',
      description: 'Live Bitcoin options data from Deribit',
      category: 'trades',
      priority: 3,
      component: () => <OptionsTracker />
    },
    'tradeVolumeSummary': {
      title: 'Trade Volume Summary',
      description: 'Aggregated trading volume statistics',
      category: 'trades',
      priority: 4,
      component: () => (
        <div className={styles.tradeVolumeSummary}>
          <h3>24h Trading Volume</h3>
          <div className={styles.volumeStats}>
            {Object.entries(data?.data?.market_data || {})
              .filter(([key]) => key !== 'timestamp')
              .map(([symbol, metrics]) => (
                <div key={symbol} className={styles.volumeStat}>
                  <span className={styles.symbol}>{symbol.toUpperCase()}</span>
                  <span className={styles.volume}>${(metrics as MarketMetric).volume_24h.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )
    },
    'alertsPanel': {
      title: 'Alerts',
      description: 'Important market alerts',
      category: 'alerts',
      priority: 1,
      component: () => <AlertsPanel key="alerts-panel" />
    },
    'marketInsights': {
      title: 'Macro Summary',
      description: 'Global economic indicators',
      category: 'insights',
      priority: 1,
      component: () => <MacroSummary key="macro-summary" macroData={data?.data?.macro_data} />
    },
    'recentActivity': {
      title: 'Recent Activity',
      description: 'Latest market activities',
      category: 'insights',
      priority: 2,
      component: () => <RecentActivity key="recent-activity" data={data?.data || null} isLoading={isLoading} error={error} />
    },
    'macroSummary': {
      title: 'Market Insights',
      description: 'Analysis and trends',
      category: 'insights',
      priority: 3,
      fullWidth: true,
      component: () => <MarketInsights key="market-insights" />
    },
    'btcEvents': {
      title: 'Bitcoin Events',
      description: 'Recent Bitcoin-related news and events',
      category: 'market',
      priority: 3,
      component: () => <AssetEvents key="btc-events" assetSymbol="BTC" limit={20} />
    },
    'tradeHeatmap': {
      title: 'Market Heatmap',
      description: 'Visual representation of market movements',
      category: 'trades',
      priority: 5,
      component: () => <TradeHeatmap marketData={data?.data?.market_data || defaultMarketData} isLoading={isLoading} />
    },
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-hide header on scroll
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollingDown = scrollY > lastScrollY;
      
      if (scrollingDown && scrollY > 100) {
        setShowHeader(false);
          } else {
        setShowHeader(true);
      }
      
      lastScrollY = scrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Filter components by category and sort by priority
  const getFilteredComponents = useCallback(() => {
    return Object.entries(componentMapping)
      .filter(([id, config]) => {
        if (selectedView === 'overview') return true;
        return config.category === selectedView;
      })
      .sort(([, configA], [, configB]) => 
        (configA.priority || 99) - (configB.priority || 99)
      );
  }, [selectedView, componentMapping]);

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
      <div className={`${styles.header} ${showHeader ? '' : styles.headerHidden}`}>
      <Navigation />
      </div>
      
      <div className={`${styles.mainWrapper} ${isSidebarOpen ? styles.withSidebar : ''} ${sidebarCollapsed ? styles.withCollapsedSidebar : ''}`}>
        <Sidebar />
        
        <main className={`${styles.main} ${sidebarCollapsed ? styles.mainWithCollapsedSidebar : ''}`}>
          <div className={styles.dashboardHeader}>
            <div className={styles.dashboardHeaderTop}>
              <h1 className={styles.dashboardTitle}>
                FutureWatch
                <span className={styles.dashboardTag}>Live Market Data</span>
              </h1>
              
              <div className={styles.dashboardDate}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
              </div>
            </div>
            
            <div className={styles.dashboardControls}>
              <div className={styles.viewSelector}>
                <button 
                  className={`${styles.viewButton} ${selectedView === 'overview' ? styles.active : ''}`}
                  onClick={() => setSelectedView('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`${styles.viewButton} ${selectedView === 'market' ? styles.active : ''}`}
                  onClick={() => setSelectedView('market')}
                >
                  Market
                </button>
                <button 
                  className={`${styles.viewButton} ${selectedView === 'trades' ? styles.active : ''}`}
                  onClick={() => setSelectedView('trades')}
                >
                  Trades
                </button>
                <button 
                  className={`${styles.viewButton} ${selectedView === 'insights' ? styles.active : ''}`}
                  onClick={() => setSelectedView('insights')}
                >
                  Insights
                </button>
              </div>
              
              <div className={styles.displayControls}>
                  <button 
                  className={`${styles.controlButton} ${isCompactMode ? styles.active : ''}`}
                  onClick={() => setIsCompactMode(!isCompactMode)}
                  title={isCompactMode ? "Switch to spacious mode" : "Switch to compact mode"}
                  >
                  {isCompactMode ? 'Compact' : 'Spacious'}
                  </button>
                
                  <button 
                  className={`${styles.controlButton} ${isDarkMode ? styles.active : ''}`}
                  onClick={toggleDarkMode}
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                  {isDarkMode ? 'Dark' : 'Light'}
                  </button>
                
                <button 
                  className={styles.controlButton}
                  onClick={() => {
                    // Ask for confirmation
                    if (window.confirm('Reset all dashboard customizations?')) {
                      // Clear local storage and reload
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  title="Reset all dashboard settings"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className={`${styles.dashboardGrid} ${isCompactMode ? styles.compact : styles.spacious}`}>
            {getFilteredComponents().map(([id, config]) => 
              renderComponent(id, config)
            )}
          </div>
          
          {/* Floating action button for mobile */}
          {isMobile && (
            <div className={styles.floatingActionButton}>
              <button
                onClick={() => {
                  const menu = document.getElementById('mobile-menu');
                  if (menu) menu.classList.toggle(styles.mobileMenuVisible);
                }}
              >
                <span className={styles.hamburger}></span>
              </button>
              
              <div id="mobile-menu" className={styles.mobileMenu}>
                <button onClick={() => setSelectedView('overview')}>Overview</button>
                <button onClick={() => setSelectedView('market')}>Market</button>
                <button onClick={() => setSelectedView('trades')}>Trades</button>
                <button onClick={() => setSelectedView('insights')}>Insights</button>
                <button onClick={toggleDarkMode}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
              </div>
                  </div>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard; 