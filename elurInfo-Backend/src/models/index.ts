import { Database, setupDatabase } from '../utils/database'
import { AvalancheReportModel } from './AvalancheReport'
import { MountainForecastModel } from './MountainForecast'
import { MunicipalForecastModel } from './MunicipalForecast'
import { ApiCacheModel } from './ApiCache'
import { SnowScienceReportModel } from './SnowScienceReport'

export class ModelManager {
  private static instance: ModelManager
  private db: Database | null = null
  
  public avalancheReports!: AvalancheReportModel
  public mountainForecasts!: MountainForecastModel
  public municipalForecasts!: MunicipalForecastModel
  public apiCache!: ApiCacheModel
  public snowScienceReports!: SnowScienceReportModel

  private constructor() {}

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager()
    }
    return ModelManager.instance
  }

  async initialize(): Promise<void> {
    if (this.db) {
      return // Already initialized
    }

    this.db = await setupDatabase()
    
    // Initialize all models with the database connection
    this.avalancheReports = new AvalancheReportModel(this.db)
    this.mountainForecasts = new MountainForecastModel(this.db)
    this.municipalForecasts = new MunicipalForecastModel(this.db)
    this.apiCache = new ApiCacheModel(this.db)
    this.snowScienceReports = new SnowScienceReportModel(this.db)

    // Initialize tables
    await this.snowScienceReports.initializeTable()
    await this.snowScienceReports.createIndexes()
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }

  isInitialized(): boolean {
    return this.db !== null
  }

  getDatabase(): Database {
    if (!this.db) {
      throw new Error('ModelManager not initialized. Call initialize() first.')
    }
    return this.db
  }
}

// Export singleton instance
export const models = ModelManager.getInstance()

// Export individual model classes for direct instantiation if needed
export { AvalancheReportModel } from './AvalancheReport'
export { MountainForecastModel } from './MountainForecast'
export { MunicipalForecastModel } from './MunicipalForecast'
export { ApiCacheModel } from './ApiCache'
export { SnowScienceReportModel } from './SnowScienceReport'

// Export types
export type { AvalancheReport } from './AvalancheReport'
export type { MountainForecast } from './MountainForecast'
export type { MunicipalForecast } from './MunicipalForecast'
export type { ApiCacheEntry } from './ApiCache'
export type { SnowScienceReport } from './SnowScienceReport'