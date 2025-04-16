import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '@/styles/components/Navigation.module.css';
import { useAppContext } from '@/contexts/AppContext';
import { FiMenu, FiX } from 'react-icons/fi';

// Icons (replace with your actual imports or ensure react-icons is installed)
import { 
  RiHome4Line, 
  RiDashboardLine, 
  RiPieChartLine, 
  RiNotification3Line, 
  RiSettings4Line,
  RiMenuLine,
  RiCloseLine,
  RiUserLine,
  RiInformationLine,
  RiPriceTag3Line
} from 'react-icons/ri';

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { toggleSidebar } = useAppContext();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Store component references instead of JSX elements
  const navLinks = [
    { name: 'DASHBOARD', path: '/dashboard', IconComponent: RiDashboardLine },
    { name: 'TRADE FEED', path: '/trade-feed', IconComponent: RiPieChartLine },
    { name: 'ANALYTICS', path: '/analytics', IconComponent: RiPieChartLine },
    { name: 'PRICING', path: '/pricing', IconComponent: RiPriceTag3Line },
    { name: 'PROFILE', path: '/profile', IconComponent: RiUserLine },
  ];

  return (
    <nav className={`${styles.navigation} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logo}>
              <img src="/futurewatch-logo.svg" alt="FUTUREWATCH Logo" className={styles.logoImage} />
              <span className={styles.logoText}>FUTUREWATCH</span>
            </div>
          </Link>
        </div>

        <div className={styles.navLinksContainer}>
          <ul className={styles.navLinks}>
            {navLinks.map((link) => {
              const { IconComponent } = link; // Destructure here
              return (
                <li key={link.path} className={router.pathname === link.path ? styles.active : ''}>
                  <Link href={link.path} className={styles.navLink}>
                    <span><IconComponent /></span> {/* Render the component */} 
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.navRight}>
          <button 
            className={styles.signInButton}
            onClick={toggleSidebar}
          >
            SETTINGS
          </button>
          
          <button 
            className={styles.mobileMenuButton} 
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            <span className={styles.menuIcon}>☰</span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileLogo}>
          <img src="/futurewatch-logo.svg" alt="FUTUREWATCH Logo" className={styles.logoImage} />
          <span className={styles.logoText}>FUTUREWATCH</span>
        </div>
        <ul className={styles.mobileNavLinks}>
          {navLinks.map((link) => {
            const { IconComponent } = link; // Destructure here
            return (
              <li key={link.path}>
                <Link 
                  href={link.path} 
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                >
                  <span><IconComponent /></span> {/* Render the component */} 
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation; 