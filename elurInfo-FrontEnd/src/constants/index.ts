// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
}

// Cache Configuration
export const CACHE_CONFIG = {
  AVALANCHE_VALIDITY_HOURS: 24,
  MOUNTAIN_VALIDITY_HOURS: 1,
  MUNICIPAL_VALIDITY_HOURS: 1
}

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [42.7, 0.8] as [number, number], // Pyrenees center
  DEFAULT_ZOOM: 9,
  MAX_ZOOM: 15,
  MIN_ZOOM: 7
}

// Risk levels configuration
export const RISK_LEVELS = {
  1: { label: 'Débil', color: '#4caf50', description: 'Riesgo de avalancha débil' },
  2: { label: 'Limitado', color: '#ffeb3b', description: 'Riesgo de avalancha limitado' },
  3: { label: 'Notable', color: '#ff9800', description: 'Riesgo de avalancha notable' },
  4: { label: 'Fuerte', color: '#f44336', description: 'Riesgo de avalancha fuerte' },
  5: { label: 'Muy fuerte', color: '#9c27b0', description: 'Riesgo de avalancha muy fuerte' }
}

// Language configuration
export const LANGUAGES = {
  'es': 'Español',
  'ca': 'Català',
  'eu': 'Euskera'
}

// Pyrenees zones
export const PYRENEES_ZONES = {
  'pirineo-aragones': 'Pirineo Aragonés',
  'pirineo-navarro': 'Pirineo Navarro',
  'pirineo-catalan': 'Pirineo Catalán'
}

// Refresh intervals (in minutes)
export const REFRESH_INTERVALS = {
  15: '15 minutos',
  30: '30 minutos',
  60: '1 hora',
  120: '2 horas'
}