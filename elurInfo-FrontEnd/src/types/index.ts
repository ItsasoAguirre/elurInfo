// API Response Types
export interface AvalancheReport {
  id: number
  zone: string
  risk_level: number
  description: string
  source_url: string
  last_update: string
}

export interface MountainForecast {
  id: number
  zone: string
  forecast_json: string
  valid_date: string
  last_update: string
}

export interface MunicipalForecast {
  id: number
  municipality_id: string
  municipality_name: string
  forecast_json: string
  valid_date: string
  last_update: string
}

export interface ApiCacheEntry {
  id: number
  endpoint: string
  params: string
  response_json: string
  last_update: string
}

// Snow Science Types
export interface SnowScienceReport {
  id: number
  area: string
  areaCode: number
  fechaElaboracion: string
  fechaValidez: string
  datosCompletos: string
  fechaCreacion: string
  fechaActualizacion: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
  cached?: boolean
  count?: number
  message?: string
}

// UI Types
export interface TabItem {
  id: string
  name: string
  path: string
  icon: string
}

export interface AppSettings {
  language: 'es' | 'en' | 'fr' | 'ca' | 'eu'
  favoriteZone: string
  autoRefresh: boolean
  refreshInterval: number
}

export interface ConnectionStatus {
  isOnline: boolean
  lastOnline?: Date
}

// Map Types
export interface AvalancheZone {
  id: string
  name: string
  coordinates: [number, number][]
  riskLevel: number
  description: string
}