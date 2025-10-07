import localforage from 'localforage'
import type { AvalancheReport, MountainForecast, MunicipalForecast, SnowScienceReport } from '@/types'

class OfflineService {
  private avalancheStore: LocalForage
  private mountainStore: LocalForage
  private municipalStore: LocalForage
  private snowScienceStore: LocalForage
  private settingsStore: LocalForage

  constructor() {
    // Configure separate stores for different data types
    this.avalancheStore = localforage.createInstance({
      name: 'elurInfo',
      storeName: 'avalanche_reports'
    })

    this.mountainStore = localforage.createInstance({
      name: 'elurInfo',
      storeName: 'mountain_forecasts'
    })

    this.municipalStore = localforage.createInstance({
      name: 'elurInfo',
      storeName: 'municipal_forecasts'
    })

    this.snowScienceStore = localforage.createInstance({
      name: 'elurInfo',
      storeName: 'snow_science_reports'
    })

    this.settingsStore = localforage.createInstance({
      name: 'elurInfo',
      storeName: 'settings'
    })
  }

  // Avalanche Reports
  async saveAvalancheReports(reports: AvalancheReport[]): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.avalancheStore.setItem('reports', {
      data: reports,
      timestamp
    })
  }

  async getAvalancheReports(): Promise<{ data: AvalancheReport[], timestamp: string } | null> {
    return await this.avalancheStore.getItem('reports')
  }

  // Mountain Forecasts
  async saveMountainForecasts(forecasts: MountainForecast[]): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.mountainStore.setItem('forecasts', {
      data: forecasts,
      timestamp
    })
  }

  async getMountainForecasts(): Promise<{ data: MountainForecast[], timestamp: string } | null> {
    return await this.mountainStore.getItem('forecasts')
  }

  // Municipal Forecasts
  async saveMunicipalForecast(municipalityId: string, forecast: MunicipalForecast): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.municipalStore.setItem(municipalityId, {
      data: forecast,
      timestamp
    })
  }

  async getMunicipalForecast(municipalityId: string): Promise<{ data: MunicipalForecast, timestamp: string } | null> {
    return await this.municipalStore.getItem(municipalityId)
  }

  // Snow Science Reports
  async saveSnowScienceReports(reports: SnowScienceReport[]): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.snowScienceStore.setItem('reports', {
      data: reports,
      timestamp
    })
  }

  async getSnowScienceReports(): Promise<{ data: SnowScienceReport[], timestamp: string } | null> {
    return await this.snowScienceStore.getItem('reports')
  }

  // Settings
  async saveSettings(settings: any): Promise<void> {
    await this.settingsStore.setItem('app_settings', settings)
  }

  async getSettings(): Promise<any> {
    return await this.settingsStore.getItem('app_settings')
  }

  // Clear all offline data
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.avalancheStore.clear(),
      this.mountainStore.clear(),
      this.municipalStore.clear(),
      this.snowScienceStore.clear()
    ])
  }

  // Check if data is still valid based on timestamp
  isDataValid(timestamp: string, validHours: number): boolean {
    const now = new Date()
    const dataTime = new Date(timestamp)
    const diffHours = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60)
    return diffHours < validHours
  }
}

export const offlineService = new OfflineService()