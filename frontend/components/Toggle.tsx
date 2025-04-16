import React from 'react';
import styles from '../styles/Toggle.module.css';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  label?: string;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  id, 
  label, 
  disabled = false 
}) => {
  return (
    <div className={styles.toggleContainer}>
      <input
        type="checkbox"
        id={id}
        className={styles.toggleInput}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <label htmlFor={id} className={styles.toggleLabel}>
        <span className={styles.toggleButton}></span>
        {label && <span className={styles.toggleText}>{label}</span>}
      </label>
    </div>
  );
};

export default Toggle; 