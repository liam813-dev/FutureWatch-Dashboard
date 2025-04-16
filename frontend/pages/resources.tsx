import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Home.module.css';

const ResourcesPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Resources & Education</h1>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Tutorials</h2>
              <p>Learn how to understand and leverage liquidation data coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Research Reports</h2>
              <p>In-depth analysis of market trends coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Community Insights</h2>
              <p>Discussions and strategies from the community coming soon...</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResourcesPage; 