import React, { useState, useEffect } from 'react';
import { useAssetEvents, AssetEvent } from '@/services/coindeskApi';
import styles from '@/components/MarketInsights.module.css';
import cardStyles from '@/styles/CardFixes.module.css';

interface AssetEventsProps {
  assetSymbol: string;
  limit?: number;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'SECURITY-INCIDENT': 'Security Incident',
  'HARD-FORK': 'Hard Fork',
  'SOFT-FORK': 'Soft Fork',
  'TICKER-CHANGE': 'Ticker Change',
  'MIGRATION': 'Migration',
  'SUPPLY-BURN': 'Supply Burn',
  'SUPPLY-LOCK': 'Supply Lock',
  'SPLIT': 'Split',
  'REVERSE-SPLIT': 'Reverse Split',
  'TOKEN-LISTING': 'Token Listing',
  'TOKEN-DELISTING': 'Token Delisting',
  'NETWORK-CONTROL-CHANGE': 'Network Control Change',
  'OTHER': 'Other'
};

const AssetEvents: React.FC<AssetEventsProps> = ({ assetSymbol, limit = 20 }) => {
  console.log(`[AssetEvents] Component rendering for ${assetSymbol} with limit ${limit}`);
  
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const { events, isLoading, error, loadMore, hasMore } = useAssetEvents(assetSymbol, limit);
  const [isComponentVisible, setIsComponentVisible] = useState<boolean>(true);
  
  // Debug log when component mounts
  useEffect(() => {
    console.log(`[AssetEvents] Component mounted for ${assetSymbol}`);
    // Check if component is visible in the layout
    const checkVisibility = () => {
      const element = document.getElementById('asset-events-container');
      setIsComponentVisible(!!element && element.offsetParent !== null);
      console.log(`[AssetEvents] Component visibility check: ${!!element && element.offsetParent !== null}`);
    };
    
    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, [assetSymbol]);
  
  // Debug log when events change
  useEffect(() => {
    console.log(`[AssetEvents] Received ${events.length} events for ${assetSymbol}`);
    if (events.length > 0) {
      console.log('[AssetEvents] Event types present:', events.map(e => e.event_type).filter((v, i, a) => a.indexOf(v) === i));
    }
  }, [events, assetSymbol]);
  
  // Get unique event types from the fetched events
  const eventTypes = React.useMemo(() => {
    const types = new Set<string>();
    events.forEach(event => {
      if (event.event_type) {
        types.add(event.event_type);
      }
    });
    const result = Array.from(types).sort();
    console.log(`[AssetEvents] Unique event types (${result.length}):`, result);
    return result;
  }, [events]);
  
  // Filter events by selected type
  const filteredEvents = React.useMemo(() => {
    if (!filterType) {
      console.log(`[AssetEvents] No filter applied, showing all ${events.length} events`);
      return events;
    }
    const filtered = events.filter(event => event.event_type === filterType);
    console.log(`[AssetEvents] Filtered to ${filtered.length} events of type "${filterType}"`);
    return filtered;
  }, [events, filterType]);
  
  const toggleExpand = (id: string) => {
    console.log(`[AssetEvents] Toggling event expansion: ${id}`);
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };
  
  // Debug loading state changes
  useEffect(() => {
    console.log(`[AssetEvents] Loading state changed: ${isLoading}`);
  }, [isLoading]);
  
  // Debug error state changes
  useEffect(() => {
    if (error) {
      console.error(`[AssetEvents] Error occurred:`, error);
    }
  }, [error]);
  
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  };
  
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'SECURITY-INCIDENT':
        return '🔒';
      case 'HARD-FORK':
      case 'SOFT-FORK':
        return '🔀';
      case 'TICKER-CHANGE':
        return '🏷️';
      case 'MIGRATION':
        return '🔄';
      case 'SUPPLY-BURN':
      case 'SUPPLY-LOCK':
        return '🔥';
      case 'SPLIT':
      case 'REVERSE-SPLIT':
        return '✂️';
      case 'TOKEN-LISTING':
        return '➕';
      case 'TOKEN-DELISTING':
        return '➖';
      case 'NETWORK-CONTROL-CHANGE':
        return '🔑';
      default:
        return '📌';
    }
  };
  
  console.log(`[AssetEvents] Rendering component with state:`, {
    events: events.length,
    filteredEvents: filteredEvents.length,
    isLoading,
    error: error?.message,
    hasMore,
    isComponentVisible
  });
  
  return (
    <div id="asset-events-container" className={cardStyles.cardContainer}>
      <div className={cardStyles.cardHeader}>
        <h2 className={cardStyles.cardTitle}>{assetSymbol} Events</h2>
        <div className={styles.filters}>
          <select 
            value={filterType || ''} 
            onChange={(e) => {
              const newValue = e.target.value || null;
              console.log(`[AssetEvents] Filter changed to: ${newValue}`);
              setFilterType(newValue);
            }}
            className={styles.filterSelect}
            disabled={isLoading || events.length === 0}
          >
            <option value="">All Event Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABELS[type] || type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className={cardStyles.cardContent}>
        {isLoading && events.length === 0 ? (
          <div className={cardStyles.loadingState}>
            <div className={cardStyles.loadingSpinner}>
              <span className={styles.loaderDot}></span>
              <span className={styles.loaderDot}></span>
              <span className={styles.loaderDot}></span>
            </div>
            <p className={cardStyles.loadingText}>Fetching {assetSymbol} events...</p>
          </div>
        ) : error && events.length === 0 ? (
          <div className={cardStyles.errorState}>
            <span className={cardStyles.errorIcon}>⚠️</span>
            <p className={cardStyles.errorMessage}>Error loading events: Failed to fetch</p>
            <p className={cardStyles.errorHint}>
              This may be due to CORS restrictions or API key limitations
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={cardStyles.emptyState}>
            <span className={cardStyles.emptyIcon}>📆</span>
            <p className={cardStyles.emptyText}>No events available for {assetSymbol}</p>
          </div>
        ) : (
          <div className={styles.insightsList}>
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className={`${styles.insightItem} ${expandedItem === event.id ? styles.expanded : ''}`}
              >
                <div 
                  className={styles.insightHeader}
                  onClick={() => toggleExpand(event.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedItem === event.id}
                  aria-controls={`event-content-${event.id}`}
                >
                  <div className={styles.insightMeta}>
                    <span className={styles.insightCategory}>
                      {getEventTypeIcon(event.event_type)}
                    </span>
                    <h3 className={styles.insightTitle}>{event.name}</h3>
                  </div>
                  <div className={styles.insightInfo}>
                    <span className={styles.insightTime}>{getTimeAgo(event.start_date)}</span>
                    <span className={styles.expandIcon}>
                      {expandedItem === event.id ? '−' : '+'}
                    </span>
                  </div>
                </div>
                
                <div 
                  id={`event-content-${event.id}`}
                  className={styles.insightContent}
                  aria-hidden={expandedItem !== event.id}
                >
                  <p>{event.description}</p>
                  <div className={styles.insightFooter}>
                    <span className={styles.eventInfo}>
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type} | {new Date(event.start_date).toLocaleDateString()}
                    </span>
                    {event.source_url && (
                      <a 
                        href={event.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.readMoreLink}
                      >
                        Source →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetEvents; 