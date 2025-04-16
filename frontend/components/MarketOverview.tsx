import React from 'react';
import styles from '@/styles/MarketOverview.module.css';
import ClientAnimatedBackground from './ClientAnimatedBackground';

const MarketOverview: React.FC = () => {
  return (
    <section id="intro" className={styles.section}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        <ClientAnimatedBackground opacity={0.6} />
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.sectionText}>
          <span className={styles.sectionNumber}>01</span>
          <h2 className={styles.sectionTitle}>Complete Market Overview</h2>
          <p className={styles.sectionDescription}>
            FutureWatch consolidates fragmented market data from multiple exchanges into a single, 
            intuitive dashboard. Our platform processes millions of data points per second to give 
            you the complete picture.
          </p>
        </div>
        <div className={styles.sectionVisual}>
          <div className={styles.animatedDashboard}>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOverview; 