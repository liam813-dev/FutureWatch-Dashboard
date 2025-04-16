import React from 'react';
import styles from '../styles/HowItWorks.module.css';

const HowItWorks: React.FC = () => {
  return (
    <div className={styles.container}>
      <section id="intro" className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionText}>
            <span className={styles.sectionNumber}>01</span>
            <h2 className={styles.sectionTitle}>Welcome to FutureWatch</h2>
            <p className={styles.sectionDescription}>
              Navigate the markets with precision. FutureWatch delivers institutional-grade analytics, 
              real-time market intelligence, and actionable insights—all in one powerful terminal.
            </p>
          </div>
          <div className={styles.sectionVisual}>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionText}>
            <span className={styles.sectionNumber}>02</span>
            <h2 className={styles.sectionTitle}>Real-Time Market Intelligence</h2>
            <p className={styles.sectionDescription}>
              Stay ahead of market movements with our comprehensive suite of tools. Track whale activity, 
              monitor liquidation levels, analyze ETF flows, and interpret macro signals—all in real-time.
            </p>
          </div>
          <div className={styles.sectionVisual}>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionText}>
            <span className={styles.sectionNumber}>03</span>
            <h2 className={styles.sectionTitle}>Institutional-Grade Analytics</h2>
            <p className={styles.sectionDescription}>
              Access the same tools used by professional traders. Our advanced analytics platform 
              provides deep market insights, helping you make informed decisions with confidence.
            </p>
          </div>
          <div className={styles.sectionVisual}>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionContent}>
          <div className={styles.sectionText}>
            <span className={styles.sectionNumber}>04</span>
            <h2 className={styles.sectionTitle}>Actionable Market Insights</h2>
            <p className={styles.sectionDescription}>
              Transform data into opportunity. Our platform synthesizes complex market signals into 
              clear, actionable insights, helping you identify trends and make strategic decisions.
            </p>
          </div>
          <div className={styles.sectionVisual}>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
              <div className={styles.dashboardCard}></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks; 