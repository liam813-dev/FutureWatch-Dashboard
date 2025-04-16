import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './MultiSelectDropdown.module.css';

interface MultiSelectDropdownProps {
  label: string; // e.g., "Symbols"
  options: string[]; // All available symbols
  selectedOptions: Set<string>; // Currently selected symbols
  onChange: (selected: Set<string>) => void; // Callback when selection changes
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
  label, 
  options, 
  selectedOptions, 
  onChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for search input

  // Helper to toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset search term when opening
      setSearchTerm(""); 
      // Focus search input shortly after opening
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Handle checkbox change
  const handleOptionChange = (option: string, isChecked: boolean) => {
    const next = new Set(selectedOptions);
    if (isChecked) {
      next.add(option);
    } else {
      next.delete(option);
    }
    onChange(next);
  };

  // Select/Deselect All
  const handleSelectAll = (selectAll: boolean) => {
    const next = selectAll ? new Set(options) : new Set<string>();
    onChange(next);
  };

  // Click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button className={styles.dropdownButton} onClick={toggleDropdown}>
        <span>{`${selectedOptions.size} ${label} Selected`}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.up : styles.down}`}></span>
      </button>

      {isOpen && (
        <div className={styles.dropdownPanel}>
          {/* Search Input */}
          <div className={styles.searchContainer}>
            <input 
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${label}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {/* Actions */}
          <div className={styles.dropdownActions}>
            <button onClick={() => handleSelectAll(true)} className={styles.actionButton}>Select All</button>
            <button onClick={() => handleSelectAll(false)} className={styles.actionButton}>Deselect All</button>
          </div>
          {/* Options List */}
          <ul className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li key={option} className={styles.optionItem}>
                  <input
                    type="checkbox"
                    id={`ms-${label}-${option}`}
                    checked={selectedOptions.has(option)}
                    onChange={(e) => handleOptionChange(option, e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <label htmlFor={`ms-${label}-${option}`} className={styles.checkboxLabel}>{option}</label>
                </li>
              ))
            ) : (
              <li className={styles.noOptions}>No {label} found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown; 