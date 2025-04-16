import React, { useState } from 'react';
import styles from '@/components/DashboardControls.module.css';

export interface DashboardSettings {
  theme: 'dark' | 'light';
  refreshInterval: number;
  showPriceChart: boolean;
  showMarketMetrics: boolean;
  showLiquidationPositions: boolean;
  showTerminalLog: boolean;
  showHeatmap: boolean;
  showInsights: boolean;
  showAlerts: boolean;
  enableDragAndDrop: boolean;
  layout: string;
}

interface DashboardControlsProps {
  settings: DashboardSettings;
  onSettingsChange: (newSettings: DashboardSettings) => void;
  onSaveLayout: () => void;
  layoutName?: string;
}

const DashboardControls: React.FC<DashboardControlsProps> = ({ 
  settings, 
  onSettingsChange,
  onSaveLayout,
  layoutName = 'Default Layout'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingLayoutName, setEditingLayoutName] = useState(layoutName);
  
  const toggleControl = () => {
    setIsOpen(!isOpen);
  };
  
  const handleToggleSetting = (key: keyof DashboardSettings) => {
    if (typeof settings[key] === 'boolean') {
      onSettingsChange({
        ...settings,
        [key]: !settings[key]
      });
    }
  };
  
  const handleRefreshChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({
      ...settings,
      refreshInterval: parseInt(e.target.value, 10)
    });
  };
  
  const handleThemeChange = (theme: 'dark' | 'light') => {
    onSettingsChange({
      ...settings,
      theme
    });
  };
  
  const handleSaveLayout = () => {
    // Update layout name
    onSettingsChange({
      ...settings,
      layout: editingLayoutName
    });
    
    // Trigger save action
    onSaveLayout();
    
    // Close the drawer
    setIsOpen(false);
  };
  
  return (
    <div className={`${styles.controlsContainer} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.controlsToggle}
        onClick={toggleControl}
        aria-expanded={isOpen}
        aria-controls="dashboard-controls-panel"
        aria-label="Customize Dashboard"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span className={styles.toggleLabel}>
          {isOpen ? 'Close' : 'Customize'}
        </span>
      </button>
      
      <div 
        id="dashboard-controls-panel"
        className={styles.controlsPanel}
        role="region"
        aria-label="Dashboard customization controls"
      >
        <div className={styles.controlsHeader}>
          <h2>Customize Dashboard</h2>
          <button 
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close customization panel"
          >
            ×
          </button>
        </div>
        
        <div className={styles.controlsContent}>
          <div className={styles.controlSection}>
            <h3>Layout Settings</h3>
            
            <div className={styles.layoutNameContainer}>
              <label htmlFor="layout-name">Layout Name</label>
              <input 
                id="layout-name"
                type="text"
                className={styles.layoutNameInput}
                value={editingLayoutName}
                onChange={(e) => setEditingLayoutName(e.target.value)}
                aria-label="Layout name"
              />
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="enable-drag-drop" className={styles.checkboxLabel}>
                <input 
                  id="enable-drag-drop"
                  type="checkbox"
                  checked={settings.enableDragAndDrop}
                  onChange={() => handleToggleSetting('enableDragAndDrop')}
                  aria-label="Enable drag and drop"
                />
                <span className={styles.checkmark}></span>
                Enable Drag & Drop
              </label>
              <div className={styles.controlDescription}>
                Allows rearranging dashboard widgets
              </div>
            </div>
            
            <button 
              className={styles.saveButton}
              onClick={handleSaveLayout}
              aria-label="Save current layout"
            >
              Save Layout
            </button>
          </div>
          
          <div className={styles.controlSection}>
            <h3>Display Options</h3>
            
            <div className={styles.controlItem}>
              <label className={styles.controlLabel}>Theme</label>
              <div className={styles.themeToggle}>
                <button 
                  className={`${styles.themeButton} ${settings.theme === 'dark' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  aria-label="Set dark theme"
                  aria-pressed={settings.theme === 'dark'}
                >
                  Dark
                </button>
                <button 
                  className={`${styles.themeButton} ${settings.theme === 'light' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('light')}
                  aria-label="Set light theme"
                  aria-pressed={settings.theme === 'light'}
                >
                  Light
                </button>
              </div>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="refresh-interval" className={styles.controlLabel}>
                Refresh Interval
              </label>
              <select 
                id="refresh-interval"
                className={styles.selectControl}
                value={settings.refreshInterval}
                onChange={handleRefreshChange}
                aria-label="Select data refresh interval"
              >
                <option value="1000">1 second</option>
                <option value="5000">5 seconds</option>
                <option value="10000">10 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
              </select>
            </div>
          </div>
          
          <div className={styles.controlSection}>
            <h3>Visible Widgets</h3>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-price-chart" className={styles.checkboxLabel}>
                <input 
                  id="show-price-chart"
                  type="checkbox"
                  checked={settings.showPriceChart}
                  onChange={() => handleToggleSetting('showPriceChart')}
                  aria-label="Show price chart"
                />
                <span className={styles.checkmark}></span>
                Price Chart
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-market-metrics" className={styles.checkboxLabel}>
                <input 
                  id="show-market-metrics"
                  type="checkbox"
                  checked={settings.showMarketMetrics}
                  onChange={() => handleToggleSetting('showMarketMetrics')}
                  aria-label="Show market metrics"
                />
                <span className={styles.checkmark}></span>
                Market Metrics
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-liquidation-positions" className={styles.checkboxLabel}>
                <input 
                  id="show-liquidation-positions"
                  type="checkbox"
                  checked={settings.showLiquidationPositions}
                  onChange={() => handleToggleSetting('showLiquidationPositions')}
                  aria-label="Show liquidation positions"
                />
                <span className={styles.checkmark}></span>
                Liquidation Positions
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-terminal-log" className={styles.checkboxLabel}>
                <input 
                  id="show-terminal-log"
                  type="checkbox"
                  checked={settings.showTerminalLog}
                  onChange={() => handleToggleSetting('showTerminalLog')}
                  aria-label="Show terminal log"
                />
                <span className={styles.checkmark}></span>
                Terminal Log
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-heatmap" className={styles.checkboxLabel}>
                <input 
                  id="show-heatmap"
                  type="checkbox"
                  checked={settings.showHeatmap}
                  onChange={() => handleToggleSetting('showHeatmap')}
                  aria-label="Show liquidation heatmap"
                />
                <span className={styles.checkmark}></span>
                Liquidation Heatmap
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-insights" className={styles.checkboxLabel}>
                <input 
                  id="show-insights"
                  type="checkbox"
                  checked={settings.showInsights}
                  onChange={() => handleToggleSetting('showInsights')}
                  aria-label="Show market insights"
                />
                <span className={styles.checkmark}></span>
                Market Insights
              </label>
            </div>
            
            <div className={styles.controlItem}>
              <label htmlFor="show-alerts" className={styles.checkboxLabel}>
                <input 
                  id="show-alerts"
                  type="checkbox"
                  checked={settings.showAlerts}
                  onChange={() => handleToggleSetting('showAlerts')}
                  aria-label="Show alerts panel"
                />
                <span className={styles.checkmark}></span>
                Alerts Panel
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardControls; 