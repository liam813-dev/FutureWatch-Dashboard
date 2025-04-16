import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TradeFeedAnalysis from '@/components/TradeFeedAnalysis';
import OptionsTracker from '@/components/OptionsTracker';
import { useWebSocket } from '@/contexts/WebSocketContext';
import styles from '@/styles/TradeFeedPage.module.css'; // Create this CSS file

// Import the TradeFeed component dynamically with no SSR
const TradeFeed = dynamic(() => import('@/components/TradeFeed'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

const TradeFeedPage: React.FC = () => {
  const { data, isLoading, error } = useWebSocket();

  // Extract trades data - Note: TradeFeed component handles internal filtering/sorting
  const allTrades = data?.data?.recent_large_trades || [];

  return (
    <>
      <Head>
        <title>Trade Feed | Neo Future</title>
        <meta name="description" content="Real-time cryptocurrency trade feed" />
      </Head>
      <div className={styles.pageContainer}>
        <Navigation />
        <main className={styles.mainContent}>
          <h1 className={styles.pageTitle}>Live Trade Feed & Analysis</h1>
          
          {error && <p className={styles.error}>Error loading data: {error.message}</p>}
          
          <div className={styles.contentGrid}>
            {/* Pass all fetched trades to analysis; it will calculate based on the full dataset */}
            <div className={styles.analysisSection}>
              <TradeFeedAnalysis trades={allTrades} />
            </div>

            {/* TradeFeed component handles its own display and filtering */}
            <div className={styles.feedSection}>
               <TradeFeed 
                  trades={allTrades} 
                  isLoading={isLoading} 
                  error={error}
               />
            </div>

            {/* Add Options Tracker section */}
            <div className={styles.optionsSection}>
              <OptionsTracker />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TradeFeedPage; 