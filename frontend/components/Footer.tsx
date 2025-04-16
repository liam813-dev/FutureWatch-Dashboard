import React from 'react';
import { FaTwitter, FaDiscord, FaGithub } from 'react-icons/fa';
import styles from '@/styles/Footer.module.css';
import { useAppContext } from '@/contexts/AppContext';

const Footer: React.FC = () => {
  const { sidebarCollapsed } = useAppContext();
  
  return (
    <footer className={`${styles.footer} ${sidebarCollapsed ? styles.footerWithCollapsedSidebar : ''}`}>
      <div className={styles.footerContent}>
        <div className={styles.branding}>
          <span className={styles.brandName}>FUTUREWATCH</span>
          <div className={styles.socialLinks}>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaTwitter />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaDiscord />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaGithub />
            </a>
          </div>
        </div>
        
        <div>
          <span className={styles.copyright}>© 2023 FUTUREWATCH. All rights reserved.</span>
          <div className={styles.privacyLinks}>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 