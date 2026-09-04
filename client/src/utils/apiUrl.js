/**
 * Unified API & WebSocket URL resolver
 * - In local development (Vite port 5173/3000): points to http://localhost:4000
 * - In production (Docker / Render / Railway / Cloud): points to window.location.origin
 */
export const SERVER_URL = (
  typeof window !== 'undefined' &&
  (window.location.port === '5173' || window.location.port === '3000')
)
  ? `${window.location.protocol}//${window.location.hostname}:4000`
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000');

export const getApiUrl = () => SERVER_URL;
