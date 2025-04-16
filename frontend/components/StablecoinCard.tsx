import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { formatNumber } from '../utils/format';

interface StablecoinCardProps {
  flow24h: number | null;
  circulating: number | null;
}

const StablecoinCard: React.FC<StablecoinCardProps> = ({ flow24h, circulating }) => {
  if (!flow24h || !circulating) {
    return null;
  }

  const flowPercent = (flow24h / circulating) * 100;
  const isPositive = flow24h > 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stablecoin Flows (24h)
        </Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography variant="body1">
            Net Flow: <span style={{ color: isPositive ? '#4caf50' : '#f44336' }}>
              {isPositive ? '+' : ''}{formatNumber(flow24h, 'currency')}
            </span>
          </Typography>
          <Typography variant="body1">
            % of Supply: <span style={{ color: isPositive ? '#4caf50' : '#f44336' }}>
              {isPositive ? '+' : ''}{flowPercent.toFixed(3)}%
            </span>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total Supply: {formatNumber(circulating, 'currency')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StablecoinCard; 