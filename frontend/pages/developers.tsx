import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Home.module.css';

const DevelopersPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Developers & API</h1>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.card} style={{ gridColumn: 'span 8' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">API Documentation</h2>
              <p>Comprehensive guide to our data endpoints coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Sandbox</h2>
              <p>Test our API in a developer-friendly environment coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 12' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">SDK & Code Examples</h2>
              <p>Ready-to-use libraries and example implementations coming soon...</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DevelopersPage; 