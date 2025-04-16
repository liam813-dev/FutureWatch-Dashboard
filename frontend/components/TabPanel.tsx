import React, { useState, ReactNode } from 'react';
import styles from '@/styles/Home.module.css';

interface TabProps {
  label: string;
  children: ReactNode;
}

const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabPanelProps {
  children: ReactNode;
  defaultTab?: number;
  className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, defaultTab = 0, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Check if children is an array and has elements
  const tabs = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  if (tabs.length === 0) {
    return <div className={`${styles.tabPanel} ${className}`}>{children}</div>;
  }

  return (
    <div className={`${styles.tabPanel} ${className}`}>
      <div className={styles.tabButtons}>
        {tabs.map((tab, index) => {
          if (!React.isValidElement(tab)) return null;
          
          return (
            <button
              key={index}
              className={`${styles.tabButton} ${activeTab === index ? styles.active : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.props.label}
            </button>
          );
        })}
      </div>
      <div className={styles.tabContent}>
        {tabs[activeTab]}
      </div>
    </div>
  );
};

export { TabPanel, Tab }; 