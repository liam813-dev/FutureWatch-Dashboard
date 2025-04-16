import React, { useMemo } from 'react';
import { RecentTrade } from '@/types/data';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './TradeFeedAnalysis.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TradeFeedAnalysisProps {
  trades: RecentTrade[]; // Accepts the filtered trades
}

const TradeFeedAnalysis: React.FC<TradeFeedAnalysisProps> = ({ trades }) => {
  // Calculate analytics using useMemo
  const analysis = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { 
        buyCount: 0, sellCount: 0, totalBuyValue: 0, totalSellValue: 0, 
        avgBuyValue: 0, avgSellValue: 0, largestBuy: null, largestSell: null, 
        hourlyFrequency: { labels: [], buyData: [], sellData: [] } 
      };
    }

    let buyCount = 0;
    let sellCount = 0;
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let largestBuy: RecentTrade | null = null;
    let largestSell: RecentTrade | null = null;
    const hourlyBins: { [hour: string]: { buys: number, sells: number } } = {};

    trades.forEach(trade => {
      const hour = new Date(trade.time).getHours(); // Group by hour of the day
      const hourKey = `${String(hour).padStart(2, '0')}:00`;
      if (!hourlyBins[hourKey]) {
        hourlyBins[hourKey] = { buys: 0, sells: 0 };
      }

      if (trade.side === 'buy') {
        buyCount++;
        totalBuyValue += trade.value_usd;
        hourlyBins[hourKey].buys++;
        if (!largestBuy || trade.value_usd > largestBuy.value_usd) {
          largestBuy = trade;
        }
      } else {
        sellCount++;
        totalSellValue += trade.value_usd;
        hourlyBins[hourKey].sells++;
        if (!largestSell || trade.value_usd > largestSell.value_usd) {
          largestSell = trade;
        }
      }
    });

    const avgBuyValue = buyCount > 0 ? totalBuyValue / buyCount : 0;
    const avgSellValue = sellCount > 0 ? totalSellValue / sellCount : 0;

    // Prepare hourly frequency data for chart
    const sortedHours = Object.keys(hourlyBins).sort();
    const hourlyLabels = sortedHours;
    const hourlyBuyData = sortedHours.map(h => hourlyBins[h].buys);
    const hourlySellData = sortedHours.map(h => hourlyBins[h].sells);

    return {
      buyCount,
      sellCount,
      totalBuyValue,
      totalSellValue,
      avgBuyValue,
      avgSellValue,
      largestBuy,
      largestSell,
      hourlyFrequency: {
        labels: hourlyLabels,
        buyData: hourlyBuyData,
        sellData: hourlySellData
      }
    };
  }, [trades]);

  // Add early return if analysis is null
  if (!analysis) {
    return <div className={styles.analysisContainer}><p>No analysis data available.</p></div>; // Or return null, or a loading indicator
  }

  const { largestBuy, largestSell } = analysis;

  // Helper function for formatting currency
  const formatValue = (num: number) => {
     if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
     if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
     return `$${num.toFixed(0)}`;
   };

  // --- Create display variables with explicit type handling ---
  // 1. Get the value safely, providing a default
  const buyValue = largestBuy?.value_usd ?? 0;
  const sellValue = largestSell?.value_usd ?? 0;

  // 2. Format the value if the trade exists, otherwise show 'N/A'
  const largestBuyValueDisplay = largestBuy ? formatValue(buyValue) : 'N/A';
  const largestSellValueDisplay = largestSell ? formatValue(sellValue) : 'N/A';
  // ---------------------------------------------------------

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ccc' }
      },
      title: {
        display: true,
        text: 'Trade Frequency by Hour',
        color: '#eee'
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        stacked: true,
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
    },
  };

  // Chart data
  const chartData = {
    labels: analysis.hourlyFrequency.labels,
    datasets: [
      {
        label: 'Buys',
        data: analysis.hourlyFrequency.buyData,
        backgroundColor: 'rgba(78, 204, 163, 0.6)', // Accent green
      },
      {
        label: 'Sells',
        data: analysis.hourlyFrequency.sellData,
        backgroundColor: 'rgba(220, 53, 69, 0.6)', // Accent red
      },
    ],
  };

  return (
    <div className={styles.analysisContainer}>
      <h3 className={styles.title}>Trade Analysis</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Buy Count</span>
          <span className={`${styles.statValue} ${styles.buy}`}>{analysis.buyCount}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Avg Buy Value</span>
          <span className={`${styles.statValue} ${styles.buy}`}>{formatValue(analysis.avgBuyValue)}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Largest Buy</span>
          <span className={`${styles.statValue} ${styles.buy}`}>{largestBuyValueDisplay}</span>
        </div>
         <div className={styles.statBox}>
          <span className={styles.statLabel}>Sell Count</span>
          <span className={`${styles.statValue} ${styles.sell}`}>{analysis.sellCount}</span>
        </div>
         <div className={styles.statBox}>
          <span className={styles.statLabel}>Avg Sell Value</span>
          <span className={`${styles.statValue} ${styles.sell}`}>{formatValue(analysis.avgSellValue)}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Largest Sell</span>
          <span className={`${styles.statValue} ${styles.sell}`}>{largestSellValueDisplay}</span>
        </div>
      </div>
      <div className={styles.chartContainer}>
        {trades.length > 0 ? (
          <Bar options={chartOptions} data={chartData} />
        ) : (
          <p className={styles.noData}>No trade data for chart.</p>
        )}
      </div>
    </div>
  );
};

export default TradeFeedAnalysis; 