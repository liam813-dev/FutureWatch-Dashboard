import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Home.module.css';

const AlertsSettingsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Alerts & Settings</h1>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.card} style={{ gridColumn: 'span 6' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Custom Alerts</h2>
              <p>Configure personalized liquidation alerts coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 6' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Dashboard Settings</h2>
              <p>Customize your dashboard experience coming soon...</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AlertsSettingsPage; 