'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import styles from '@/styles/Home.module.css';

interface ResizableCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  id?: string;
  className?: string;
  footer?: ReactNode;
  fitContent?: boolean;
}

const ResizableCard: React.FC<ResizableCardProps> = ({ 
  title, 
  description,
  children, 
  id, 
  className,
  footer,
  fitContent = false
}) => {
  // Get saved height from localStorage if available
  const savedHeightKey = `card-height-${id || 'default'}`;
  const initialHeight = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem(savedHeightKey) || '0', 10) || 0 
    : 0;
    
  const [height, setHeight] = useState<number>(initialHeight);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Decide if we need to update the card height based on content
  useEffect(() => {
    if ((fitContent || !height) && contentRef.current && cardRef.current) {
      // Calculate ideal height based on content
      const contentHeight = contentRef.current.scrollHeight;
      const idealHeight = Math.max(contentHeight + 45, title ? 320 : 280);
      
      // Only update if there's a significant difference 
      if (Math.abs(idealHeight - height) > 20) {
        setHeight(idealHeight);
      }
    }
  }, [height, title, fitContent, children]);

  // Save height to localStorage when it changes
  useEffect(() => {
    if (height && id && !fitContent) {
      localStorage.setItem(savedHeightKey, height.toString());
      
      // Dispatch event to notify Dashboard that card size changed
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('card-resized', {
          detail: { id, height }
        }));
      }
    }
  }, [height, id, savedHeightKey, fitContent]);

  // Set up resize observer to track content size changes
  useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      if (contentRef.current && !isResizing && fitContent) {
        const contentHeight = contentRef.current.scrollHeight;
        const currentCardHeight = cardRef.current?.clientHeight || 0;
        
        // If fitContent is true, always adjust height to match content
        if (fitContent || contentHeight > currentCardHeight - 70 || currentCardHeight > contentHeight + 120) {
          const idealHeight = Math.max(contentHeight + 70, title ? 320 : 280);
          
          if (Math.abs(idealHeight - height) > 25) {
            setHeight(idealHeight);
          }
        }
      }
    });
    
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [isResizing, title, fitContent, height]);
  
  const handleResizeStart = (e: React.MouseEvent) => {
    if (fitContent) return; // Disable manual resizing if fitContent is true
    
    e.preventDefault();
    setIsResizing(true);
    
    // Add class to body to indicate resizing is happening
    document.body.classList.add('resizing-active');
    
    const startY = e.clientY;
    const startHeight = height || (cardRef.current?.clientHeight || 0);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(startHeight + deltaY, title ? 320 : 280);
      setHeight(newHeight);
      
      // Add a resize-active class to the card for styling during resize
      cardRef.current?.classList.add(styles.resizing);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      
      // Remove resize-active classes
      document.body.classList.remove('resizing-active');
      cardRef.current?.classList.remove(styles.resizing);
      
      // Notify Dashboard of resize completion
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('card-resized', {
          detail: { id, height: cardRef.current?.clientHeight || height }
        }));
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div 
      ref={cardRef}
      className={`${styles.card} ${className || ''} ${isResizing ? styles.resizing : ''}`}
      style={{ 
        height: height ? `${height}px` : 'auto',
        minHeight: title ? '320px' : '280px',
      }}
      id={id}
    >
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {description && (
            <p className={styles.cardDescription}>{description}</p>
          )}
        </div>
      )}
      
      <div 
        ref={contentRef}
        className={styles.cardContent}
      >
        {children}
      </div>
      
      {footer && (
        <div className={styles.cardFooter}>
          {footer}
        </div>
      )}
      
      {!fitContent && (
        <div 
          className={styles.resizeHandle} 
          onMouseDown={handleResizeStart}
          title="Resize"
        />
      )}
    </div>
  );
};

export default ResizableCard; 