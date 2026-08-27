import { Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// Environment Configuration — Single source of truth for all URLs/config
// ═══════════════════════════════════════════════════════════════════════════

const ENV = {
  LOCAL_IP: '192.168.0.101',
  LOCAL_PORT: '3001',
  LARAVEL_PORT: '8000',
  TUNNEL_URL: process.env.EXPO_PUBLIC_API_URL || '',
  APP_NAME: 'DURRA',
  APP_VERSION: '2.0.0',
  GAMES_BASE_PATH: '/games',
} as const;

function getBasePort(): string {
  return ENV.LOCAL_PORT;
}

export const getApiBase = (): string => {
  if (Platform.OS === 'web') return '';
  return `http://${ENV.LOCAL_IP}:${getBasePort()}`;
};

export const getLaravelApiBase = (): string => {
  if (Platform.OS === 'web') return '';
  return `http://${ENV.LOCAL_IP}:${ENV.LARAVEL_PORT}`;
};

export const getGameUrl = (gameId: string, version = 'v1'): string => {
  const base = getApiBase();
  return `${base}${ENV.GAMES_BASE_PATH}/${gameId}/${version}/index.html`;
};

export const getStatsUrl = (gameId: string): string => {
  const base = getApiBase();
  return `${base}/api/v1/games/${gameId}/stats`;
};

export const getAdminApiBase = (): string => {
  return typeof window !== 'undefined' ? window.location.origin : getApiBase();
};

export const config = {
  ...ENV,
  apiBase: getApiBase(),
  laravelApiBase: getLaravelApiBase(),
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isNative: Platform.OS !== 'web',
} as const;
