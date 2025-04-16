import React, { useState } from 'react';
import styles from '@/components/MarketInsights.module.css';

interface InsightItem {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: Date;
  category: 'news' | 'analysis' | 'alert';
  url?: string;
}

interface MarketInsightsProps {
  insights?: InsightItem[];
}

const MarketInsights: React.FC<MarketInsightsProps> = ({ insights = [] }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Sample insights for demonstration purposes
  const sampleInsights: InsightItem[] = [
    {
      id: '1',
      title: 'BTC Funding Rates Spike Across Exchanges',
      content: 'Bitcoin funding rates have reached 0.02% hourly on multiple exchanges, signaling potential long squeeze conditions. Historical data suggests a correlation between elevated funding and subsequent price corrections.',
      source: 'Neo Future Analysis',
      timestamp: new Date(Date.now() - 25 * 60000), // 25 minutes ago
      category: 'analysis',
    },
    {
      id: '2',
      title: 'ETH Open Interest Reaches New ATH',
      content: 'Ethereum open interest has surpassed $10B across major platforms, setting a new all-time high. This surge in leveraged positions increases the likelihood of significant liquidation events if volatility increases.',
      source: 'CryptoDesk',
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      category: 'news',
      url: 'https://example.com/eth-open-interest'
    },
    {
      id: '3',
      title: 'Market Sentiment Shifts to Extreme Greed',
      content: 'The Crypto Fear & Greed Index has reached 85, indicating "Extreme Greed" in the market. This level has historically coincided with local tops and increased liquidation risk for leveraged longs.',
      source: 'Market Pulse',
      timestamp: new Date(Date.now() - 6 * 3600000), // 6 hours ago
      category: 'analysis',
    },
    {
      id: '4',
      title: 'Large Options Expiry Approaching',
      content: '$2.3B in BTC options set to expire this Friday, with max pain at $58,000. This could create increased volatility leading up to the expiry as market makers hedge positions.',
      source: 'Options Flow',
      timestamp: new Date(Date.now() - 12 * 3600000), // 12 hours ago
      category: 'news',
    }
  ];
  
  const displayInsights = insights.length > 0 ? insights : sampleInsights;
  
  const toggleExpand = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
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
  
  const getCategoryIcon = (category: InsightItem['category']) => {
    switch (category) {
      case 'news':
        return '📰';
      case 'analysis':
        return '📊';
      case 'alert':
        return '🚨';
      default:
        return '📌';
    }
  };
  
  return (
    <div className={styles.insightsContainer}>
      <div className={styles.insightsHeader}>
        <h2>Market Insights</h2>
        <button 
          className={styles.refreshButton}
          aria-label="Refresh insights"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>
      
      <div className={styles.insightsList}>
        {displayInsights.length === 0 ? (
          <div className={styles.noInsights}>
            <p>No market insights available at this time</p>
          </div>
        ) : (
          displayInsights.map((insight) => (
            <div 
              key={insight.id} 
              className={`${styles.insightItem} ${expandedItem === insight.id ? styles.expanded : ''}`}
            >
              <div 
                className={styles.insightHeader}
                onClick={() => toggleExpand(insight.id)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedItem === insight.id}
                aria-controls={`insight-content-${insight.id}`}
              >
                <div className={styles.insightMeta}>
                  <span className={styles.insightCategory}>
                    {getCategoryIcon(insight.category)}
                  </span>
                  <h3 className={styles.insightTitle}>{insight.title}</h3>
                </div>
                <div className={styles.insightInfo}>
                  <span className={styles.insightTime}>{getTimeAgo(insight.timestamp)}</span>
                  <span className={styles.expandIcon}>
                    {expandedItem === insight.id ? '−' : '+'}
                  </span>
                </div>
              </div>
              
              <div 
                id={`insight-content-${insight.id}`}
                className={styles.insightContent}
                aria-hidden={expandedItem !== insight.id}
              >
                <p>{insight.content}</p>
                <div className={styles.insightFooter}>
                  <span className={styles.insightSource}>Source: {insight.source}</span>
                  {insight.url && (
                    <a 
                      href={insight.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.readMoreLink}
                    >
                      Read More
                    </a>
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

export default MarketInsights; 