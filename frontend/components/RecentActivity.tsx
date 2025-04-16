import React, { useEffect, useRef, useState } from 'react';
import styles from '@/components/RecentActivity.module.css';
import { DashboardData } from '@/types/data';

interface RecentActivityProps {
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
}

interface ActivityEvent {
  id: string;
  time: Date;
  type: 'liquidation' | 'price_alert' | 'funding' | 'whale';
  symbol: string;
  exchange: string;
  details: string;
  value?: number;
  direction?: 'long' | 'short';
}

const RecentActivity: React.FC<RecentActivityProps> = ({ data, isLoading, error }) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const activityListRef = useRef<HTMLDivElement>(null);
  
  // Generate sample activity for demonstration
  useEffect(() => {
    if (isLoading || !data || error) return;
    
    // In a real app, these events would come from the WebSocket feed
    const sampleEvents: ActivityEvent[] = [
      {
        id: crypto.randomUUID(),
        time: new Date(),
        type: 'liquidation',
        symbol: 'BTC',
        exchange: 'Binance',
        details: 'Liquidation at $65,243',
        value: 120000,
        direction: 'long'
      },
      ...events
    ];
    
    // Keep only most recent 50 events
    setEvents(sampleEvents.slice(0, 50));
    
    // Scroll to the top of the list for newest events
    if (activityListRef.current) {
      activityListRef.current.scrollTop = 0;
    }
  }, [data]);
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };
  
  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'liquidation':
        return '💥';
      case 'price_alert':
        return '🔔';
      case 'funding':
        return '💰';
      case 'whale':
        return '🐋';
      default:
        return '📊';
    }
  };
  
  if (isLoading) {
    return (
      <div className={styles.activityContainer}>
        <div className={styles.activityHeader}>
          <h2>Recent Activity</h2>
        </div>
        <div className={styles.activityLoader}>
          <span></span><span></span><span></span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.activityContainer}>
        <div className={styles.activityHeader}>
          <h2>Recent Activity</h2>
        </div>
        <div className={styles.activityError}>
          <p>Unable to load activity data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.activityContainer}>
      <div className={styles.activityHeader}>
        <h2>Recent Activity</h2>
        <span className={styles.eventCount}>
          {events.length > 0 ? `${events.length} events` : 'No events'}
        </span>
      </div>
      
      <div className={styles.activityList} ref={activityListRef}>
        {events.length === 0 ? (
          <div className={styles.noActivity}>
            <p>No recent activities recorded</p>
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className={`${styles.activityItem} ${styles[event.type]} ${event.direction ? styles[event.direction] : ''}`}
              role="listitem"
              aria-label={`${event.type} event for ${event.symbol}`}
            >
              <div className={styles.activityIcon}>
                {getEventIcon(event.type)}
              </div>
              <div className={styles.activityContent}>
                <div className={styles.activityHeader}>
                  <div className={styles.activitySymbol}>{event.symbol}</div>
                  <div className={styles.activityExchange}>{event.exchange}</div>
                </div>
                <div className={styles.activityDetails}>{event.details}</div>
                <div className={styles.activityMeta}>
                  <span className={styles.activityTime}>{formatTime(event.time)}</span>
                  {event.value && (
                    <span className={styles.activityValue}>{formatValue(event.value)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity; 