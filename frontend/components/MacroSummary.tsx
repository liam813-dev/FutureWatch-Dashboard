import React from 'react';
import { MacroData, MacroDataPoint } from '@/types/data'; // Assuming types are updated
import styles from './MacroSummary.module.css';

interface MacroSummaryProps {
  macroData: MacroData | null | undefined;
}

const MacroDataPointDisplay: React.FC<{ point?: MacroDataPoint | null, defaultName: string }> = ({ point, defaultName }) => {
    if (!point) {
        return <span className={styles.errorText}>(N/A)</span>; // Data point missing entirely
    }
    if (point.error) {
        return <span className={styles.errorText}>(Error: {point.error})</span>;
    }
    if (point.value === null || point.date === null) {
         return <span className={styles.loadingText}>(...)</span>; // Show loading/pending
    }
    return (
        <span className={styles.valueText}>
            {point.value} 
            <span className={styles.dateText}> ({point.date})</span>
        </span>
    );
};

const MacroSummary: React.FC<MacroSummaryProps> = ({ macroData }) => {
  return (
    <div className={styles.macroContainer}>
      <h3 className={styles.title}>Macro & Commodity Snapshot</h3>
      <div className={styles.grid}>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.cpi?.name || 'CPI'}:</span>
            <MacroDataPointDisplay point={macroData?.cpi} defaultName="CPI" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.fed_rate?.name || 'Fed Rate'}:</span>
            <MacroDataPointDisplay point={macroData?.fed_rate} defaultName="Fed Rate" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.unemployment?.name || 'Unemployment'}:</span>
            <MacroDataPointDisplay point={macroData?.unemployment} defaultName="Unemployment" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.wti_oil?.name || 'WTI Oil'}:</span>
            <MacroDataPointDisplay point={macroData?.wti_oil} defaultName="WTI Oil" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.brent_oil?.name || 'Brent Oil'}:</span>
            <MacroDataPointDisplay point={macroData?.brent_oil} defaultName="Brent Oil" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.natural_gas?.name || 'Nat Gas'}:</span>
            <MacroDataPointDisplay point={macroData?.natural_gas} defaultName="Nat Gas" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.copper?.name || 'Copper'}:</span>
            <MacroDataPointDisplay point={macroData?.copper} defaultName="Copper" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.corn?.name || 'Corn'}:</span>
            <MacroDataPointDisplay point={macroData?.corn} defaultName="Corn" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.wheat?.name || 'Wheat'}:</span>
            <MacroDataPointDisplay point={macroData?.wheat} defaultName="Wheat" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.coffee?.name || 'Coffee'}:</span>
            <MacroDataPointDisplay point={macroData?.coffee} defaultName="Coffee" />
         </div>
         <div className={styles.item}>
            <span className={styles.label}>{macroData?.sugar?.name || 'Sugar'}:</span>
            <MacroDataPointDisplay point={macroData?.sugar} defaultName="Sugar" />
         </div>
      </div>
    </div>
  );
};

export default MacroSummary; 