import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Landing.module.css';
import Image from 'next/image';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Handle scroll effect for the navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>FutureWatch - Real-time Crypto Intelligence Dashboard</title>
        <meta name="description" content="FutureWatch is your all-in-one crypto terminal. Monitor real-time liquidations, whale activity, ETF flows, and macro signals—all in one place." />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Navigation Bar */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <img 
                src="/futurewatch-logo.svg" 
                alt="FutureWatch Logo" 
                width="32" 
                height="32" 
              />
            </div>
            <span className={styles.logoText}>FUTUREWATCH</span>
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <ul className={styles.navLinks}>
            <li><Link href="/how-it-works" className={styles.navLink}>ABOUT</Link></li>
            <li><Link href="/dashboard" className={styles.navLink}>DASHBOARD</Link></li>
            <li><Link href="/pricing" className={styles.navLink}>PRICING</Link></li>
            <li><Link href="/features" className={styles.navLink}>FEATURES</Link></li>
            <li><Link href="/contact" className={styles.navLink}>CONTACT</Link></li>
          </ul>
        </nav>
        
        <Link href="/signin" className={styles.signInButton}>
          SIGN IN
        </Link>
        
        <button 
          className={styles.mobileMenuButton} 
          aria-label="Toggle menu" 
          onClick={toggleMobileMenu}
        >
          <span className={`${styles.mobileMenuIcon} ${mobileMenuOpen ? styles.open : ''}`}></span>
        </button>
      </header>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileLogo}>
          <div className={styles.logoIcon}>
            <img 
              src="/futurewatch-logo.svg" 
              alt="FutureWatch Logo" 
              width="40" 
              height="40" 
            />
          </div>
          <span className={styles.logoText}>FUTUREWATCH</span>
        </div>
        <ul className={styles.mobileNavLinks}>
          <li><Link href="/how-it-works" className={styles.mobileNavLink} onClick={toggleMobileMenu}>ABOUT</Link></li>
          <li><Link href="/dashboard" className={styles.mobileNavLink} onClick={toggleMobileMenu}>DASHBOARD</Link></li>
          <li><Link href="/pricing" className={styles.mobileNavLink} onClick={toggleMobileMenu}>PRICING</Link></li>
          <li><Link href="/features" className={styles.mobileNavLink} onClick={toggleMobileMenu}>FEATURES</Link></li>
          <li><Link href="/contact" className={styles.mobileNavLink} onClick={toggleMobileMenu}>CONTACT</Link></li>
          <li><Link href="/signin" className={styles.mobileNavLink} onClick={toggleMobileMenu}>SIGN IN</Link></li>
        </ul>
      </div>

      {/* Main Content Area */}
      <main className={styles.main}>
        <div className={styles.heroContent}>
          <div className={styles.heroTextContainer}>
            <h1 className={styles.heroTitle}>Welcome to FutureWatch.</h1>
            <p className={styles.heroTagline}>No euphoria. No panic. Just flows.</p>
            
            <div className={styles.ctaButtons}>
              <Link href="/dashboard" className={styles.primaryButton}>
                Launch Dashboard
              </Link>
              <Link href="/how-it-works" className={styles.secondaryButton}>
                How It Works
              </Link>
            </div>
          </div>
          
          <div className={styles.heroImageContainer}>
            <div className={styles.productInfo}>
              <h2 className={styles.productTitle}>FutureWatch</h2>
              <p className={styles.productDescription}>
                FutureWatch is your all-in-one crypto terminal. Monitor real-time liquidations, whale activity, ETF flows, and macro signals—all in one place.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Background grid overlay for futuristic effect */}
      <div className={styles.gridOverlay}></div>

      {/* Mouse Scroll Indicator */}
      <div className={styles.scrollIndicator}>
        <span className={styles.scrollIcon}></span>
      </div>
    </div>
  );
};

export default Landing; 