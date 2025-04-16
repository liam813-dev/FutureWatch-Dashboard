import React from 'react';
import { LiquidationPosition } from '../types/data';

interface LiquidationPositionsProps {
  positions: LiquidationPosition[];
}

const LiquidationPositions: React.FC<LiquidationPositionsProps> = ({ positions }) => {
  const formatNumber = (num: number, prefix = '$') => {
    return `${prefix}${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const getDistanceColor = (distance: number) => {
    if (distance <= 2) return 'text-danger';
    if (distance <= 5) return 'text-warning';
    return 'text-success';
  };

  const getLeverageColor = (leverage: number) => {
    if (leverage >= 20) return 'text-danger';
    if (leverage >= 10) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="terminal-section">
      <h2 className="text-info mb-4">Positions Closest to Liquidation</h2>
      <table className="terminal-table">
        <thead>
          <tr>
            <th>Coin</th>
            <th>Value</th>
            <th>Entry</th>
            <th>Liquidation</th>
            <th>Distance</th>
            <th>Leverage</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => (
            <tr key={index}>
              <td className="text-info">{position.coin}</td>
              <td>{formatNumber(position.value)}</td>
              <td>{formatNumber(position.entry)}</td>
              <td>{formatNumber(position.liquidation)}</td>
              <td className={getDistanceColor(position.distance)}>
                {formatPercentage(position.distance)}
              </td>
              <td className={getLeverageColor(position.leverage)}>
                {position.leverage}x
              </td>
              <td className="text-secondary">
                {`${position.address.slice(0, 6)}...${position.address.slice(-4)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LiquidationPositions; 