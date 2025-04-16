'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/Home.module.css';

type EventData = {
  time: number;
  magnitude: number;
  type: 'liquidation' | 'trade' | 'price_change';
  symbol: string;
};

type HawkesModelParams = {
  baseIntensity: number; // μ (mu) - baseline event rate
  decayFactor: number;   // α (alpha) - how quickly excitement decays
  excitationFactor: number; // β (beta) - how much events excite future events
};

interface HawkesProcessModelProps {
  timeWindow?: number; // Time window in hours
  eventThreshold?: number; // Minimum magnitude to consider
  selectedAssets?: string[]; // Assets to include in the model
}

const DEFAULT_PARAMS: HawkesModelParams = {
  baseIntensity: 0.05,
  decayFactor: 0.3,
  excitationFactor: 0.7
};

const HawkesProcessModel: React.FC<HawkesProcessModelProps> = ({
  timeWindow = 24,
  eventThreshold = 10000,
  selectedAssets = ['BTC', 'ETH']
}) => {
  const [modelParams, setModelParams] = useState<HawkesModelParams>(DEFAULT_PARAMS);
  const [predictedEvents, setPredictedEvents] = useState<number[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch historical event data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, this would be an API call
        // For now, we'll generate mock data
        const mockData: EventData[] = generateMockEventData(timeWindow, selectedAssets);
        setHistoricalEvents(mockData);
        
        // Calculate model predictions based on mock data
        const predictions = calculateHawkesIntensity(mockData, modelParams, timeWindow);
        setPredictedEvents(predictions);
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch event data');
        setIsLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchHistoricalData();
  }, [timeWindow, selectedAssets, eventThreshold]);

  // Draw visualization when data changes
  useEffect(() => {
    if (isLoading || !canvasRef.current || historicalEvents.length === 0) return;
    
    drawVisualization(
      canvasRef.current, 
      historicalEvents, 
      predictedEvents, 
      timeWindow
    );
  }, [historicalEvents, predictedEvents, isLoading, timeWindow]);

  // Handle parameter changes
  const handleParamChange = (param: keyof HawkesModelParams, value: number) => {
    const newParams = { ...modelParams, [param]: value };
    setModelParams(newParams);
    
    // Recalculate predictions with new parameters
    const predictions = calculateHawkesIntensity(historicalEvents, newParams, timeWindow);
    setPredictedEvents(predictions);
  };

  // Generate mock data for demonstration
  const generateMockEventData = (hours: number, assets: string[]): EventData[] => {
    const events: EventData[] = [];
    const now = Date.now();
    const hourInMs = 3600000;
    
    // Simulate clustering of events (property of Hawkes processes)
    const clusterCenters = Array.from({ length: Math.floor(hours / 4) }, () => 
      Math.floor(Math.random() * hours * hourInMs)
    );
    
    clusterCenters.forEach(center => {
      // Create a cluster of 2-8 events
      const clusterSize = 2 + Math.floor(Math.random() * 6);
      
      for (let i = 0; i < clusterSize; i++) {
        // Events happen close to the cluster center
        const timeOffset = Math.floor(Math.random() * hourInMs * 2) - hourInMs;
        const eventTime = now - (center + timeOffset);
        
        events.push({
          time: eventTime,
          magnitude: 5000 + Math.random() * 45000,
          type: Math.random() > 0.6 ? 'liquidation' : (Math.random() > 0.5 ? 'trade' : 'price_change'),
          symbol: assets[Math.floor(Math.random() * assets.length)]
        });
      }
    });
    
    // Add some random events
    for (let i = 0; i < hours / 2; i++) {
      events.push({
        time: now - Math.floor(Math.random() * hours * hourInMs),
        magnitude: 5000 + Math.random() * 15000,
        type: Math.random() > 0.6 ? 'liquidation' : (Math.random() > 0.5 ? 'trade' : 'price_change'),
        symbol: assets[Math.floor(Math.random() * assets.length)]
      });
    }
    
    // Sort by time
    return events.sort((a, b) => a.time - b.time);
  };

  // Calculate Hawkes process intensity over time
  const calculateHawkesIntensity = (
    events: EventData[], 
    params: HawkesModelParams,
    hours: number
  ): number[] => {
    const { baseIntensity, decayFactor, excitationFactor } = params;
    const hourInMs = 3600000;
    const now = Date.now();
    const startTime = now - (hours * hourInMs);
    
    // Calculate intensity at 15-minute intervals
    const intervals = hours * 4; // 15-minute intervals
    const intensities: number[] = new Array(intervals).fill(baseIntensity);
    
    // For each interval, calculate the intensity based on previous events
    for (let i = 0; i < intervals; i++) {
      const currentTime = startTime + (i * 15 * 60 * 1000);
      
      // Sum the effect of all previous events on current intensity
      events.forEach(event => {
        // Only consider events that happened before current time
        if (event.time < currentTime) {
          const timeDiff = (currentTime - event.time) / hourInMs; // time difference in hours
          const excitation = excitationFactor * Math.exp(-decayFactor * timeDiff);
          
          // Scale by magnitude (larger events have more impact)
          const scaledImpact = excitation * (event.magnitude / 50000);
          intensities[i] += scaledImpact;
        }
      });
    }
    
    return intensities;
  };

  // Draw the visualization on canvas
  const drawVisualization = (
    canvas: HTMLCanvasElement,
    events: EventData[],
    intensities: number[],
    hours: number
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#4C5563';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw x-axis labels (time)
    ctx.fillStyle = '#ADB5C2';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i <= hours; i += Math.ceil(hours / 6)) {
      const x = padding + (i / hours) * chartWidth;
      ctx.fillText(`${hours - i}h`, x, height - padding + 15);
    }

    // Draw intensity line
    const maxIntensity = Math.max(...intensities, modelParams.baseIntensity * 10);
    ctx.beginPath();
    ctx.strokeStyle = '#00E0FF';
    ctx.lineWidth = 2;

    intensities.forEach((intensity, index) => {
      const x = padding + (index / intensities.length) * chartWidth;
      const y = height - padding - (intensity / maxIntensity) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw historical events as points
    const hourInMs = 3600000;
    const now = Date.now();
    const startTime = now - (hours * hourInMs);

    events.forEach(event => {
      if (event.time >= startTime) {
        const timeElapsed = now - event.time;
        const hoursPast = timeElapsed / hourInMs;
        
        // Position based on time
        const x = padding + ((hours - hoursPast) / hours) * chartWidth;
        
        // Position based on magnitude
        const normalizedMagnitude = Math.min(1, event.magnitude / 50000);
        const y = height - padding - normalizedMagnitude * chartHeight * 0.8;
        
        // Draw point
        ctx.beginPath();
        
        // Different colors for different event types
        switch (event.type) {
          case 'liquidation':
            ctx.fillStyle = '#E55C5C';
            break;
          case 'trade':
            ctx.fillStyle = '#4DAF7C';
            break;
          case 'price_change':
            ctx.fillStyle = '#F0B90B';
            break;
          default:
            ctx.fillStyle = '#636B75';
        }
        
        const radius = 4 + normalizedMagnitude * 6;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw baseline intensity
    const baselineY = height - padding - (modelParams.baseIntensity / maxIntensity) * chartHeight;
    ctx.beginPath();
    ctx.strokeStyle = '#636B75';
    ctx.setLineDash([5, 3]);
    ctx.moveTo(padding, baselineY);
    ctx.lineTo(width - padding, baselineY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw legend
    const legend = [
      { label: 'Intensity', color: '#00E0FF' },
      { label: 'Liquidations', color: '#E55C5C' },
      { label: 'Trades', color: '#4DAF7C' },
      { label: 'Price Changes', color: '#F0B90B' },
      { label: 'Baseline', color: '#636B75' }
    ];

    legend.forEach((item, index) => {
      const legendX = padding + 10;
      const legendY = padding + 15 + index * 20;
      
      ctx.beginPath();
      ctx.fillStyle = item.color;
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ADB5C2';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legendX + 10, legendY + 3);
    });
  };

  // Event risk level calculated from model
  const calculateRiskLevel = (): { level: string; color: string } => {
    if (!predictedEvents.length) return { level: 'Unknown', color: '#ADB5C2' };
    
    // Get the most recent predictions (last few intervals)
    const recentIntensity = predictedEvents.slice(-4);
    const avgIntensity = recentIntensity.reduce((sum, val) => sum + val, 0) / recentIntensity.length;
    
    // Determine risk level based on intensity
    if (avgIntensity > modelParams.baseIntensity * 5) {
      return { level: 'High', color: '#E55C5C' };
    } else if (avgIntensity > modelParams.baseIntensity * 2) {
      return { level: 'Medium', color: '#F0B90B' };
    } else {
      return { level: 'Low', color: '#4DAF7C' };
    }
  };

  const risk = calculateRiskLevel();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingIndicator}>Loading model data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.hawkesModelContainer}>
      <div className={styles.modelInfo}>
        <div className={styles.modelMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Event Count:</span>
            <span className={styles.metricValue}>{historicalEvents.length}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Current Risk:</span>
            <span className={styles.metricValue} style={{ color: risk.color }}>{risk.level}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Assets:</span>
            <span className={styles.metricValue}>{selectedAssets.join(', ')}</span>
          </div>
        </div>

        <div className={styles.modelControls}>
          <div className={styles.controlItem}>
            <label htmlFor="baseIntensity">Base Intensity (μ):</label>
            <input
              id="baseIntensity"
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={modelParams.baseIntensity}
              onChange={(e) => handleParamChange('baseIntensity', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.paramValue}>{modelParams.baseIntensity.toFixed(2)}</span>
          </div>
          
          <div className={styles.controlItem}>
            <label htmlFor="decayFactor">Decay Factor (α):</label>
            <input
              id="decayFactor"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={modelParams.decayFactor}
              onChange={(e) => handleParamChange('decayFactor', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.paramValue}>{modelParams.decayFactor.toFixed(2)}</span>
          </div>
          
          <div className={styles.controlItem}>
            <label htmlFor="excitationFactor">Excitation (β):</label>
            <input
              id="excitationFactor"
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={modelParams.excitationFactor}
              onChange={(e) => handleParamChange('excitationFactor', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.paramValue}>{modelParams.excitationFactor.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className={styles.modelCanvas}
        />
        <div className={styles.canvasLabel}>
          Time-varying intensity and historical events (past {timeWindow} hours)
        </div>
      </div>

      <div className={styles.modelExplanation}>
        <h4>Hawkes Process Model Explanation</h4>
        <p>
          The Hawkes process is a self-exciting point process where past events increase the probability of future events. 
          In financial markets, this can model how events like large trades or liquidations tend to trigger further events.
        </p>
        <p>
          <strong>Parameters:</strong><br />
          <strong>μ (Base Intensity):</strong> Background rate of events<br />
          <strong>α (Decay):</strong> How quickly excitement decays over time<br />
          <strong>β (Excitation):</strong> How much each event increases future event probability
        </p>
        <p>
          The blue line shows the model's predicted intensity (event probability) over time, while colored dots represent historical events by type.
        </p>
      </div>
    </div>
  );
};

export default HawkesProcessModel; 