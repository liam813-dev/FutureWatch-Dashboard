// utils/endpoints.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';

// Determine protocol based on current page protocol
const getWebSocketProtocol = () => {
  if (typeof window === 'undefined') return 'ws:';
  return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
};

// Get the host without protocol
const getHost = () => {
  return API_BASE.replace(/^https?:\/\//, '');
};

// WebSocket endpoint
export const getWebSocketUrl = () => {
  const protocol = getWebSocketProtocol();
  const host = getHost();
  return `${protocol}//${host}/ws`;
};

// API endpoints
export const ENDPOINTS = {
  dashboard: `${API_BASE}/api/data`,
  trades: `${API_BASE}/api/trades`,
  liquidations: `${API_BASE}/api/liquidations`,
}; 