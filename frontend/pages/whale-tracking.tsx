import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Home.module.css';

const WhaleTrackingPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Whale Tracking</h1>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.card} style={{ gridColumn: 'span 12' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Whale Activity Monitor</h2>
              <p>Real-time whale trades and wallet movements coming soon...</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WhaleTrackingPage; 