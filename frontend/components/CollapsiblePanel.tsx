import React, { useState, ReactNode } from 'react';
import styles from '@/styles/Home.module.css';

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
  initiallyExpanded?: boolean;
  className?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  initiallyExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <div className={`${styles.collapsiblePanel} ${className}`}>
      <div 
        className={styles.collapsibleHeader} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>
          <span>{isExpanded ? '▼' : '►'}</span>
          {title}
        </h3>
        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
      </div>
      <div className={`${styles.collapsibleContent} ${isExpanded ? styles.expanded : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsiblePanel; 