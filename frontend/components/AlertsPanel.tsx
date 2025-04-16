import React from 'react';
import { useRouter } from 'next/router';
import styles from '@/components/AlertsPanel.module.css';

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  timestamp: Date;
}

interface AlertsPanelProps {
  alerts?: Alert[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts = [] }) => {
  const router = useRouter();
  
  // Sample alerts for demo purposes
  const sampleAlerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'BTC funding rate spike detected across major exchanges',
      timestamp: new Date(Date.now() - 15 * 60000) // 15 minutes ago
    },
    {
      id: '2',
      type: 'danger',
      message: 'Large ETH liquidation cascade imminent at $3,120',
      timestamp: new Date(Date.now() - 5 * 60000) // 5 minutes ago
    },
    {
      id: '3',
      type: 'info',
      message: 'Unusual whale movement detected on Binance',
      timestamp: new Date() // Just now
    }
  ];
  
  const displayAlerts = alerts.length > 0 ? alerts : sampleAlerts;
  
  const viewAlertDetails = (id: string) => {
    router.push(`/alerts-settings?alert=${id}`);
  };
  
  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return timestamp.toLocaleDateString();
  };
  
  const getIconByType = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🔴';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };
  
  return (
    <div className={styles.alertsPanel}>
      <div className={styles.alertsHeader}>
        <h2>Active Alerts</h2>
        <button 
          className={styles.viewAllButton}
          onClick={() => router.push('/alerts-settings')}
          aria-label="View all alerts"
        >
          View All
        </button>
      </div>
      
      <div className={styles.alertsList}>
        {displayAlerts.length === 0 ? (
          <div className={styles.noAlerts}>
            <p>No active alerts at this time</p>
          </div>
        ) : (
          displayAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`${styles.alertItem} ${styles[alert.type]}`}
              onClick={() => viewAlertDetails(alert.id)}
              role="button"
              tabIndex={0}
              aria-label={`Alert: ${alert.message}`}
            >
              <div className={styles.alertIcon}>
                {getIconByType(alert.type)}
              </div>
              <div className={styles.alertContent}>
                <p className={styles.alertMessage}>{alert.message}</p>
                <span className={styles.alertTime}>{getTimeAgo(alert.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel; 