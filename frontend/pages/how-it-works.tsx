import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/HowItWorks.module.css';
import Navigation from '@/components/Navigation';
import ClientAnimatedBackground from '@/components/ClientAnimatedBackground';

const HowItWorks: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isBrowser, setIsBrowser] = useState(false);
  const sectionRefs = {
    intro: useRef<HTMLDivElement>(null),
    realtime: useRef<HTMLDivElement>(null),
    insights: useRef<HTMLDivElement>(null),
    alerts: useRef<HTMLDivElement>(null),
    trading: useRef<HTMLDivElement>(null)
  };
  
  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  useEffect(() => {
    if (!isBrowser) return;
    
    // Set up intersection observer to detect which section is currently visible
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe all section elements
    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [isBrowser]);

  // Animation for the number counter elements
  useEffect(() => {
    if (!isBrowser) return;
    
    // Function to create a more controlled counter animation
    const createCounterAnimation = (targetValue: number, duration: number, setValueFunc: (value: number) => void) => {
      let startTime: number | null = null;
      let animationFrameId: number;
      
      const updateCounter = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function for smoother animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(targetValue * easeOutQuart);
        
        setValueFunc(currentValue);
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateCounter);
        } else {
          setValueFunc(targetValue);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateCounter);
      return () => cancelAnimationFrame(animationFrameId);
    };
    
    // Set up another intersection observer specifically for the stats section
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // When stats section is visible, use React state to animate the counters
          // instead of direct DOM manipulation
          setDataPointsCount(0);
          setExchangesCount(0);
          setAccuracyCount(0);
          setAssetPairsCount(0);
          
          // Start animations
          createCounterAnimation(3250, 2000, setDataPointsCount);
          createCounterAnimation(24, 2000, setExchangesCount);
          createCounterAnimation(98, 2000, setAccuracyCount);
          createCounterAnimation(186, 2000, setAssetPairsCount);
          
          statsObserver.disconnect(); // Only animate once
        }
      });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector(`.${styles.statsSection}`);
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
    
    return () => {
      statsObserver.disconnect();
    };
  }, [isBrowser]);

  // Define state for counter values
  const [dataPointsCount, setDataPointsCount] = useState(0);
  const [exchangesCount, setExchangesCount] = useState(0);
  const [accuracyCount, setAccuracyCount] = useState(0);
  const [assetPairsCount, setAssetPairsCount] = useState(0);

  return (
    <div className={styles.container}>
      <Head>
        <title>How FutureWatch Works | Real-time Crypto Intelligence</title>
        <meta name="description" content="Learn how FutureWatch provides real-time crypto market intelligence with advanced order book tracking, alerts, and trading insights." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>How It Works</h1>
            <p className={styles.heroSubtitle}>
              Discover how FutureWatch transforms complex market data into actionable trading insights
            </p>
          </div>
          <div className={styles.scrollIndicator}>
            <span className={styles.scrollText}>Scroll to explore</span>
            <div className={styles.scrollIcon}></div>
          </div>
        </section>

        {/* Navigation Dots */}
        <div className={styles.navDots}>
          <a 
            href="#intro" 
            className={`${styles.navDot} ${activeSection === 'intro' ? styles.active : ''}`}
            aria-label="Introduction section"
          ></a>
          <a 
            href="#realtime" 
            className={`${styles.navDot} ${activeSection === 'realtime' ? styles.active : ''}`}
            aria-label="Real-time data section"
          ></a>
          <a 
            href="#insights" 
            className={`${styles.navDot} ${activeSection === 'insights' ? styles.active : ''}`}
            aria-label="Market insights section"
          ></a>
          <a 
            href="#alerts" 
            className={`${styles.navDot} ${activeSection === 'alerts' ? styles.active : ''}`}
            aria-label="Alerts system section"
          ></a>
          <a 
            href="#trading" 
            className={`${styles.navDot} ${activeSection === 'trading' ? styles.active : ''}`}
            aria-label="Trading section"
          ></a>
        </div>

        {/* Introduction Section */}
        <section id="intro" ref={sectionRefs.intro} className={styles.section}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.6} />
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionText}>
              <span className={styles.sectionNumber}>01</span>
              <h2 className={styles.sectionTitle}>Complete Market Overview</h2>
              <p className={styles.sectionDescription}>
                FutureWatch consolidates fragmented market data from multiple exchanges into a single, intuitive dashboard. Our platform processes millions of data points per second to give you the complete picture.
              </p>
            </div>
            <div className={styles.sectionVisual}>
              <div className={styles.animatedDashboard}>
                <div className={styles.dashboardGrid}>
                  <div className={`${styles.dashboardCard} ${styles.cardPrimary}`}></div>
                  <div className={`${styles.dashboardCard} ${styles.cardSecondary}`}></div>
                  <div className={`${styles.dashboardCard} ${styles.cardTertiary}`}></div>
                  <div className={`${styles.dashboardCard} ${styles.cardQuaternary}`}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Data Section */}
        <section id="realtime" ref={sectionRefs.realtime} className={styles.section}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.5} />
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionVisual}>
              <div className={styles.orderBookAnimation}>
                <div className={styles.orderBookBids}></div>
                <div className={styles.orderBookAsks}></div>
                <div className={styles.orderBookSpread}></div>
                <div className={styles.tradeExecution}></div>
              </div>
            </div>
            <div className={styles.sectionText}>
              <span className={styles.sectionNumber}>02</span>
              <h2 className={styles.sectionTitle}>Real-time Order Books</h2>
              <p className={styles.sectionDescription}>
                Watch market depth and order flow in real-time. FutureWatch visualizes order book changes, large trades, and liquidation events as they happen, giving you unprecedented market visibility.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.4} />
          </div>
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{dataPointsCount}</span>
              <span className={styles.statLabel}>Data points processed per second</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{exchangesCount}</span>
              <span className={styles.statLabel}>Exchanges monitored</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{accuracyCount}</span>
              <span className={styles.statLabel}>Percent accuracy in alert detection</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{assetPairsCount}</span>
              <span className={styles.statLabel}>Asset pairs tracked</span>
            </div>
          </div>
        </section>

        {/* Market Insights Section */}
        <section id="insights" ref={sectionRefs.insights} className={styles.section}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.55} />
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionText}>
              <span className={styles.sectionNumber}>03</span>
              <h2 className={styles.sectionTitle}>Advanced Market Insights</h2>
              <p className={styles.sectionDescription}>
                Our AI-powered analytics engine identifies market patterns, whale movements, and funding rate anomalies before they affect price. Get actionable insights without the noise.
              </p>
            </div>
            <div className={styles.sectionVisual}>
              <div className={styles.insightsAnimation}>
                <div className={styles.insightCard}></div>
                <div className={styles.dataLines}>
                  <div className={`${styles.dataLine} ${styles.dataLine1}`}></div>
                  <div className={`${styles.dataLine} ${styles.dataLine2}`}></div>
                  <div className={`${styles.dataLine} ${styles.dataLine3}`}></div>
                </div>
                <div className={styles.patternDetection}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts System Section */}
        <section id="alerts" ref={sectionRefs.alerts} className={styles.section}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.45} />
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionVisual}>
              <div className={styles.alertsAnimation}>
                <div className={styles.alertItem}></div>
                <div className={styles.alertRipple}></div>
                <div className={styles.alertNotification}></div>
              </div>
            </div>
            <div className={styles.sectionText}>
              <span className={styles.sectionNumber}>04</span>
              <h2 className={styles.sectionTitle}>Intelligent Alert System</h2>
              <p className={styles.sectionDescription}>
                Never miss a market move. Configure custom alerts for price movements, liquidation levels, whale activity, and funding rate changes that matter to you.
              </p>
            </div>
          </div>
        </section>

        {/* Trading Section */}
        <section id="trading" ref={sectionRefs.trading} className={styles.section}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.5} />
          </div>
          <div className={styles.sectionContent}>
            <div className={styles.sectionText}>
              <span className={styles.sectionNumber}>05</span>
              <h2 className={styles.sectionTitle}>Trade with Confidence</h2>
              <p className={styles.sectionDescription}>
                FutureWatch provides the complete market context you need to make informed trading decisions. See order books, liquidation levels, and market sentiment in one unified interface.
              </p>
            </div>
            <div className={styles.sectionVisual}>
              <div className={styles.tradingAnimation}>
                <div className={styles.tradingInterface}></div>
                <div className={styles.tradingChart}></div>
                <div className={styles.tradingCursor}></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
            <ClientAnimatedBackground opacity={0.35} />
          </div>
          <h2 className={styles.ctaTitle}>Ready to see the full market picture?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of traders who've discovered the edge that comes with complete market visibility.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/dashboard" className={styles.primaryButton}>
              Launch Dashboard
            </Link>
            <Link href="/pricing" className={styles.secondaryButton}>
              View Pricing
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks; 