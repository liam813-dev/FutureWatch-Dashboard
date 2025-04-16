import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { FiUser, FiBell, FiLayout, FiSettings, FiShield, FiSliders, FiAlertCircle, FiSave, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import styles from '@/styles/Settings.module.css';
import Head from 'next/head';

// Extended settings interface with additional properties
interface ExtendedSettings {
  // Core settings
  theme: string;
  refreshInterval: number;
  liquidationAlertThreshold: number;
  largeOrderAlertThreshold: number;
  visibleComponents: {
    calculator: boolean;
    tradeFeed: boolean;
    marketOverview: boolean;
    chart: boolean;
    news: boolean;
  };
  notificationChannels: {
    desktop: boolean;
    inApp: boolean;
    sound: boolean;
  };
  
  // Profile
  username: string;
  email: string;
  
  // Notification preferences
  notifyLiquidations: boolean;
  notifyPriceAlerts: boolean;
  notifyLargeOrders: boolean;
  notifyFundingRates: boolean;
  
  // Default page behavior
  defaultPage: string;
  sidebarCollapsed: boolean;
  layoutPreference: string;
  
  // UI customization
  fontScale: number;
  animations: boolean;
  showTradingView: boolean;
  showTradeFeed: boolean;
  showLiquidations: boolean;
  
  // Alert defaults
  liquidationThreshold: number;
  largeOrderThreshold: number;
  priceAlertDefaultPercent: number;
  
  // Account & privacy
  saveAnalytics: boolean;
  saveSessionHistory: boolean;
  
  // Additional properties
  showGridLines: boolean;
  allowDataCollection: boolean;
  showProfilePublicly: boolean;
  twoFactorEnabled: boolean;
}

// Define the default settings that match the ExtendedSettings interface
const defaultSettings: ExtendedSettings = {
  // Core settings
  theme: 'dark',
  refreshInterval: 5000,
  liquidationAlertThreshold: 100000,
  largeOrderAlertThreshold: 50000,
  visibleComponents: {
    calculator: true,
    tradeFeed: true,
    marketOverview: true,
    chart: true,
    news: true,
  },
  notificationChannels: {
    desktop: true,
    inApp: true,
    sound: true,
  },
  
  // Profile
  username: 'User',
  email: 'user@example.com',
  
  // Notification preferences
  notifyLiquidations: true,
  notifyPriceAlerts: true,
  notifyLargeOrders: true,
  notifyFundingRates: false,
  
  // Default page behavior
  defaultPage: 'dashboard',
  sidebarCollapsed: false,
  layoutPreference: 'default',
  
  // UI customization
  fontScale: 1,
  animations: true,
  showTradingView: true,
  showTradeFeed: true,
  showLiquidations: true,
  
  // Alert defaults
  liquidationThreshold: 100000,
  largeOrderThreshold: 50000,
  priceAlertDefaultPercent: 5,
  
  // Account & privacy
  saveAnalytics: true,
  saveSessionHistory: true,
  
  // Additional properties
  showGridLines: true,
  allowDataCollection: true,
  showProfilePublicly: false,
  twoFactorEnabled: false,
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ExtendedSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const [sessions] = useState([
    { ip: '192.168.1.1', location: 'New York, US', time: '2023-04-22 14:30', device: 'Chrome / MacOS' },
    { ip: '86.45.213.90', location: 'London, UK', time: '2023-04-20 09:15', device: 'Safari / iOS' },
  ]);

  useEffect(() => {
    // Load settings from localStorage on component mount
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
  }, []);

  const handleChange = (field: string, value: any) => {
    // Handle nested properties
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      
      // Create a type-safe update by handling each parent property explicitly
      if (parent === 'visibleComponents') {
        setSettings({
          ...settings,
          visibleComponents: {
            ...settings.visibleComponents,
            [child]: value
          }
        });
      } else if (parent === 'notificationChannels') {
        setSettings({
          ...settings,
          notificationChannels: {
            ...settings.notificationChannels,
            [child]: value
          }
        });
      }
    } else {
      setSettings({ ...settings, [field]: value });
    }
  };

  const saveSettings = () => {
    localStorage.setItem('settings', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('settings');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const renderDashboardTab = () => (
    <div className={styles.tabContent}>
      <h3>Dashboard Settings</h3>
      
      <div className={`${styles.settingGroup} ${styles.formInput}`}>
        <label>Theme</label>
        <select 
          value={settings.theme} 
          onChange={(e) => handleChange('theme', e.target.value)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>
      
      <div className={`${styles.settingGroup} ${styles.formInput}`}>
        <label>Refresh Interval (seconds)</label>
        <input 
          type="number" 
          min="5" 
          max="600" 
          value={settings.refreshInterval} 
          onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
        />
      </div>
      
      <div className={styles.sectionContainer}>
        <h3>Dashboard Components</h3>
        {Object.entries(settings.visibleComponents).map(([key, value]) => (
          <div key={key} className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={`component-${key}`}
              checked={value}
              onChange={(e) => handleChange(`visibleComponents.${key}`, e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor={`component-${key}`} className={styles.checkboxLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
          </div>
        ))}
      </div>

      <div className={styles.sectionContainer}>
        <h3>Display Settings</h3>
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="showGridLines"
            checked={settings.showGridLines}
            onChange={(e) => handleChange('showGridLines', e.target.checked)}
            className={styles.checkbox}
          />
          <label htmlFor="showGridLines" className={styles.checkboxLabel}>
            Show Grid Lines
          </label>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <h3>Profile Settings</h3>
      
      <div className={`${styles.settingGroup} ${styles.formInput}`}>
        <label>Username</label>
        <input
          type="text"
          value={settings.username}
          onChange={(e) => handleChange('username', e.target.value)}
        />
      </div>
      
      <div className={`${styles.settingGroup} ${styles.formInput}`}>
        <label>Email</label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
      </div>
      
      <div className={`${styles.settingGroup} ${styles.formInput}`}>
        <label>Account Created</label>
        <input
          type="text"
          value="January 1, 2023"
          disabled
        />
      </div>
      
      <div className={styles.settingGroup}>
        <button className={styles.secondaryButton}>Change Password</button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className={styles.tabContent}>
      <h2>Notification Preferences</h2>
      <div className={styles.settingsGroup}>
        <h3>Alert Types</h3>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notifyLiquidations} 
              onChange={(e) => handleChange('notifyLiquidations', e.target.checked)} 
            />
            Liquidation Alerts
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notifyPriceAlerts} 
              onChange={(e) => handleChange('notifyPriceAlerts', e.target.checked)} 
            />
            Price Movement Alerts
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notifyLargeOrders} 
              onChange={(e) => handleChange('notifyLargeOrders', e.target.checked)} 
            />
            Large Order Alerts
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notifyFundingRates} 
              onChange={(e) => handleChange('notifyFundingRates', e.target.checked)} 
            />
            Funding Rate Updates
          </label>
        </div>
      </div>
      <div className={styles.settingsGroup}>
        <h3>Notification Channels</h3>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notificationChannels.desktop} 
              onChange={(e) => handleChange('notificationChannels.desktop', e.target.checked)} 
            />
            Desktop Notifications
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notificationChannels.inApp} 
              onChange={(e) => handleChange('notificationChannels.inApp', e.target.checked)} 
            />
            In-App Popups
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.notificationChannels.sound} 
              onChange={(e) => handleChange('notificationChannels.sound', e.target.checked)} 
            />
            Alert Sounds
          </label>
        </div>
      </div>
    </div>
  );

  const renderDefaultsTab = () => (
    <div className={styles.tabContent}>
      <h2>Default Page Behavior</h2>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="defaultPage">Default Landing Page</label>
        <select 
          id="defaultPage" 
          value={settings.defaultPage}
          onChange={(e) => handleChange('defaultPage', e.target.value)}
        >
          <option value="dashboard">Dashboard</option>
          <option value="whaleTracker">Whale Tracker</option>
          <option value="terminal">Terminal</option>
        </select>
      </div>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="defaultTheme">Default Theme</label>
        <select 
          id="defaultTheme" 
          value={settings.theme}
          onChange={(e) => handleChange('theme', e.target.value)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="retro">Retro</option>
        </select>
      </div>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="layoutPreference">Layout Preference</label>
        <select 
          id="layoutPreference" 
          value={settings.layoutPreference}
          onChange={(e) => handleChange('layoutPreference', e.target.value)}
        >
          <option value="grid">Grid</option>
          <option value="stacked">Stacked</option>
        </select>
      </div>
    </div>
  );

  const renderCustomizationTab = () => (
    <div className={styles.tabContent}>
      <h2>UI Customization</h2>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="fontScale">Font Size</label>
        <input
          type="range"
          id="fontScale"
          value={settings.fontScale}
          onChange={(e) => handleChange('fontScale', parseFloat(e.target.value))}
          min="0.8"
          max="1.2"
          step="0.1"
        />
        <div>{settings.fontScale}x</div>
      </div>
      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            checked={settings.animations} 
            onChange={(e) => handleChange('animations', e.target.checked)} 
          />
          Enable Animations
        </label>
      </div>
      <div className={styles.settingsGroup}>
        <h3>Widget Visibility</h3>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.visibleComponents.calculator} 
              onChange={(e) => handleChange('visibleComponents.calculator', e.target.checked)} 
            />
            Position Calculator
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.visibleComponents.tradeFeed} 
              onChange={(e) => handleChange('visibleComponents.tradeFeed', e.target.checked)} 
            />
            Trade Feed
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.visibleComponents.marketOverview} 
              onChange={(e) => handleChange('visibleComponents.marketOverview', e.target.checked)} 
            />
            Market Overview
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.visibleComponents.chart} 
              onChange={(e) => handleChange('visibleComponents.chart', e.target.checked)} 
            />
            Price Chart
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.visibleComponents.news} 
              onChange={(e) => handleChange('visibleComponents.news', e.target.checked)} 
            />
            News Feed
          </label>
        </div>
      </div>
    </div>
  );

  const renderAlertDefaultsTab = () => (
    <div className={styles.tabContent}>
      <h2>Alert Defaults</h2>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="liquidationThreshold">Liquidation Alert Threshold (USD)</label>
        <input 
          type="number" 
          id="liquidationThreshold" 
          value={settings.liquidationAlertThreshold}
          onChange={(e) => handleChange('liquidationAlertThreshold', parseInt(e.target.value))}
        />
      </div>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="largeOrderThreshold">Large Order Alert Threshold (USD)</label>
        <input 
          type="number" 
          id="largeOrderThreshold" 
          value={settings.largeOrderAlertThreshold}
          onChange={(e) => handleChange('largeOrderAlertThreshold', parseInt(e.target.value))}
        />
      </div>
      <div className={`${styles.formGroup} ${styles.formInput}`}>
        <label htmlFor="priceAlertDefaultPercent">Default Price Alert Percentage</label>
        <input 
          type="number" 
          id="priceAlertDefaultPercent" 
          value={settings.priceAlertDefaultPercent}
          onChange={(e) => handleChange('priceAlertDefaultPercent', parseInt(e.target.value))}
        />
      </div>
    </div>
  );

  const renderAccountPrivacyTab = () => (
    <div className={styles.tabContent}>
      <h2>Account & Privacy</h2>
      <div className={styles.settingsGroup}>
        <h3>Data & Privacy</h3>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.saveAnalytics} 
              onChange={(e) => handleChange('saveAnalytics', e.target.checked)} 
            />
            Allow Anonymous Usage Analytics
          </label>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settings.saveSessionHistory} 
              onChange={(e) => handleChange('saveSessionHistory', e.target.checked)} 
            />
            Save Session History
          </label>
        </div>
      </div>
      <div className={styles.settingsGroup}>
        <h3>Active Sessions</h3>
        <div className={styles.sessionTable}>
          <div className={styles.sessionRow}>
            <div><strong>IP Address</strong></div>
            <div><strong>Location</strong></div>
            <div><strong>Last Active</strong></div>
            <div><strong>Device</strong></div>
          </div>
          {sessions.map((session, index) => (
            <div key={index} className={styles.sessionRow}>
              <div className={styles.sessionIP}>{session.ip}</div>
              <div className={styles.sessionLocation}>{session.location}</div>
              <div className={styles.sessionTime}>{session.time}</div>
              <div className={styles.sessionDevice}>{session.device}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.primaryButton}>Export Data</button>
        <button className={styles.secondaryButton}>Log Out All Devices</button>
        <button className={styles.dangerButton}>Delete Account</button>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'defaults':
        return renderDefaultsTab();
      case 'customization':
        return renderCustomizationTab();
      case 'alertDefaults':
        return renderAlertDefaultsTab();
      case 'accountPrivacy':
        return renderAccountPrivacyTab();
      default:
        return renderDashboardTab();
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Settings | Neo Future Dashboard</title>
        <meta name="description" content="Manage your dashboard settings" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />
      <main className={styles.main}>
        <div className={styles.settingsContainer}>
          <div className={styles.settingsSidebar}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <ul className={styles.tabList}>
              <li 
                className={`${styles.tabItem} ${activeTab === 'dashboard' ? styles.active : ''}`} 
                onClick={() => setActiveTab('dashboard')}
              >
                <FiLayout className={styles.tabIcon} />
                <span>Dashboard</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'profile' ? styles.active : ''}`} 
                onClick={() => setActiveTab('profile')}
              >
                <FiUser className={styles.tabIcon} />
                <span>Profile</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'notifications' ? styles.active : ''}`} 
                onClick={() => setActiveTab('notifications')}
              >
                <FiBell className={styles.tabIcon} />
                <span>Notifications</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'defaults' ? styles.active : ''}`} 
                onClick={() => setActiveTab('defaults')}
              >
                <FiLayout className={styles.tabIcon} />
                <span>Default Behavior</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'customization' ? styles.active : ''}`} 
                onClick={() => setActiveTab('customization')}
              >
                <FiSliders className={styles.tabIcon} />
                <span>UI Customization</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'alertDefaults' ? styles.active : ''}`} 
                onClick={() => setActiveTab('alertDefaults')}
              >
                <FiAlertCircle className={styles.tabIcon} />
                <span>Alert Defaults</span>
              </li>
              <li 
                className={`${styles.tabItem} ${activeTab === 'accountPrivacy' ? styles.active : ''}`} 
                onClick={() => setActiveTab('accountPrivacy')}
              >
                <FiShield className={styles.tabIcon} />
                <span>Account & Privacy</span>
              </li>
            </ul>

            <div className={styles.buttonGroup} style={{ padding: '1rem 1.5rem' }}>
              <Link href="/">
                <button className={styles.secondaryButton}>Back to Dashboard</button>
              </Link>
            </div>
          </div>
          <div className={styles.settingsContent}>
            {renderActiveTab()}
            <div className={styles.actionButtons}>
              <button 
                className={styles.resetButton}
                onClick={resetToDefaults}
              >
                <FiRefreshCw style={{ marginRight: '0.5rem' }} /> Reset to Default
              </button>
              <button 
                className={styles.saveButton}
                onClick={saveSettings}
              >
                <FiSave style={{ marginRight: '0.5rem' }} /> Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage; 