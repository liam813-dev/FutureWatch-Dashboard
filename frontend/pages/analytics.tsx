import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import MarketMetrics from '../components/MarketMetrics';
import TradeHeatmap from '../components/TradeHeatmap';
import MacroSummary from '../components/MacroSummary';
import { useWebSocket } from '../contexts/WebSocketContext';
import styles from '../styles/AnalyticsPage.module.css';

const AnalyticsPage: NextPage = () => {
  const { data, isLoading, error } = useWebSocket();
  const [showExtraCoins, setShowExtraCoins] = useState(true);

  // Extract market data from the API response
  const marketData = data?.data?.market_data || null;
  const macroData = data?.data?.macro_data || null;

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>Market Analytics | Neo Future Dashboard</title>
        <meta name="description" content="Comprehensive market analytics and insights for crypto traders" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Market Analytics</h1>
        
        {error && (
          <div className={styles.error}>
            Error loading data: {error.message}
          </div>
        )}

        <div className={styles.contentGrid}>
          {/* Market Metrics Section */}
          <section className={styles.metricsSection}>
            <MarketMetrics 
              layout="horizontal"
              showExtraCoins={showExtraCoins}
            />
          </section>

          {/* Trade Heatmap */}
          <section className={styles.heatmapSection}>
            <h2 className={styles.cardTitle}>Market Activity Heatmap</h2>
            <TradeHeatmap marketData={marketData} isLoading={isLoading} />
          </section>

          {/* Macro Economic Summary */}
          <section className={styles.macroSection}>
            <h2 className={styles.cardTitle}>Macro Economic Indicators</h2>
            <MacroSummary macroData={macroData} />
          </section>

          {/* Market Correlations */}
          <section className={styles.chartSection}>
            <div className={styles.analyticsCard}>
              <h2 className={styles.cardTitle}>Market Correlations</h2>
              <div className={styles.cardContent}>
                <p>Advanced correlation analysis coming soon.</p>
                <p>Track how different assets move in relation to each other.</p>
              </div>
            </div>
          </section>

          {/* Market Insights */}
          <section className={styles.insightsSection}>
            <div className={styles.analyticsCard}>
              <h2 className={styles.cardTitle}>Market Insights</h2>
              <div className={styles.cardContent}>
                <p>AI-powered market insights coming soon.</p>
                <p>Get ahead of market trends with predictive analytics.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyticsPage; 