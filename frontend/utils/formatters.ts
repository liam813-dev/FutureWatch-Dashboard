export function formatNumber(num: number): string {
  if (!num && num !== 0) return '-';
  
  // Format large numbers with K, M, B suffixes
  if (Math.abs(num) >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  } else if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPercent(num: number): string {
  if (num === undefined || num === null) return '-';
  
  // Handle different scales - some values might be in decimal form (0.01 for 1%) 
  // while others might already be in percentage form (1 for 1%)
  
  // For very small values (like funding rates which are often 0.0001 or 0.001)
  if (Math.abs(num) < 0.01) {
    return `${num >= 0 ? '+' : ''}${(num * 100).toFixed(6)}%`;
  }
  
  // For normal percentage values
  if (Math.abs(num) < 1 && Math.abs(num) >= 0.01) {
    return `${num >= 0 ? '+' : ''}${(num * 100).toFixed(2)}%`;
  }
  
  // For values already in percentage form (like 2.5 for 2.5%)
  return `${num >= 0 ? '+' : ''}${Number(num).toFixed(2)}%`;
}

export function formatAddress(address: string): string {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
