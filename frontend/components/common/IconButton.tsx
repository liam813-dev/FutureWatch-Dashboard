import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from '@/styles/IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}) => {
  return (
    <button
      className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {React.isValidElement(children) ? children : <span>{children}</span>}
    </button>
  );
};

export default IconButton; 