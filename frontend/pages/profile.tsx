import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Home.module.css';

const ProfilePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>User Profile</h1>
        </div>
        
        <div className={styles.dashboardGrid}>
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Account Information</h2>
              <p>Manage your personal information and preferences coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Subscription Details</h2>
              <p>View and manage your subscription plan coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 4' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Notification Settings</h2>
              <p>Customize how you receive updates and alerts coming soon...</p>
            </div>
          </div>
          
          <div className={styles.card} style={{ gridColumn: 'span 12' }}>
            <div className={styles.cardContent}>
              <h2 className="card-title">Saved Dashboards</h2>
              <p>Access your custom dashboard configurations coming soon...</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage; 