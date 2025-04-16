import React, { useState } from 'react';
import styles from '../styles/Settings.module.css';

interface SettingsProps {
  onUpdate: (settings: DashboardSettings) => void;
  initialSettings: DashboardSettings;
}

export interface DashboardSettings {
  theme: 'dark' | 'light';
  refreshInterval: number;
  showPriceChart: boolean;
  showLiquidationPositions: boolean;
  showTerminalLog: boolean;
  priceAlertThreshold: number;
  liquidationAlertThreshold: number;
}

const Settings: React.FC<SettingsProps> = ({ onUpdate, initialSettings }) => {
  const [settings, setSettings] = useState<DashboardSettings>(initialSettings);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof DashboardSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdate(newSettings);
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle settings"
      >
        <span className={styles.icon}>⚙️</span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <h2 className={styles.title}>Dashboard Settings</h2>
          
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <div className={`${styles.option} ${styles.formInput}`}>
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Data Refresh</h3>
            <div className={`${styles.option} ${styles.formInput}`}>
              <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
              <input
                type="number"
                id="refreshInterval"
                min="1"
                max="60"
                value={settings.refreshInterval}
                onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Components</h3>
            <div className={styles.option}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showPriceChart}
                  onChange={(e) => handleChange('showPriceChart', e.target.checked)}
                />
                Show Price Chart
              </label>
            </div>
            <div className={styles.option}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showLiquidationPositions}
                  onChange={(e) => handleChange('showLiquidationPositions', e.target.checked)}
                />
                Show Liquidation Positions
              </label>
            </div>
            <div className={styles.option}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.showTerminalLog}
                  onChange={(e) => handleChange('showTerminalLog', e.target.checked)}
                />
                Show Terminal Log
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Alerts</h3>
            <div className={`${styles.option} ${styles.formInput}`}>
              <label htmlFor="priceAlert">Price Change Alert (%)</label>
              <input
                type="number"
                id="priceAlert"
                min="0"
                max="100"
                value={settings.priceAlertThreshold}
                onChange={(e) => handleChange('priceAlertThreshold', parseFloat(e.target.value))}
              />
            </div>
            <div className={`${styles.option} ${styles.formInput}`}>
              <label htmlFor="liquidationAlert">Liquidation Distance Alert (%)</label>
              <input
                type="number"
                id="liquidationAlert"
                min="0"
                max="100"
                value={settings.liquidationAlertThreshold}
                onChange={(e) => handleChange('liquidationAlertThreshold', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 