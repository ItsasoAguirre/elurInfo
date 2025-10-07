import { Database } from '../utils/database'
import { logger } from '../utils/logger'

export interface MunicipalForecast {
  id?: number
  municipality_id: string
  municipality_name?: string
  forecast_json: string
  valid_date: string
  last_update: string
  created_at?: string
  updated_at?: string
}

export class MunicipalForecastModel {
  constructor(private db: Database) {}

  async create(forecast: Omit<MunicipalForecast, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO municipal_forecasts (municipality_id, municipality_name, forecast_json, valid_date, last_update)
       VALUES (?, ?, ?, ?, ?)`,
      [forecast.municipality_id, forecast.municipality_name, forecast.forecast_json, forecast.valid_date, forecast.last_update]
    )
    
    logger.debug('Created municipal forecast', { id: result.lastID, municipalityId: forecast.municipality_id })
    return result.lastID!
  }

  async findByMunicipalityId(municipalityId: string): Promise<MunicipalForecast | undefined> {
    return await this.db.get<MunicipalForecast>(
      'SELECT * FROM municipal_forecasts WHERE municipality_id = ? ORDER BY last_update DESC LIMIT 1',
      [municipalityId]
    )
  }

  async findByMunicipalityAndDate(municipalityId: string, validDate: string): Promise<MunicipalForecast | undefined> {
    return await this.db.get<MunicipalForecast>(
      'SELECT * FROM municipal_forecasts WHERE municipality_id = ? AND valid_date = ? ORDER BY last_update DESC LIMIT 1',
      [municipalityId, validDate]
    )
  }

  async findByMunicipalities(municipalityIds: string[]): Promise<MunicipalForecast[]> {
    if (municipalityIds.length === 0) return []
    
    const placeholders = municipalityIds.map(() => '?').join(',')
    return await this.db.all<MunicipalForecast>(
      `SELECT * FROM municipal_forecasts 
       WHERE municipality_id IN (${placeholders}) 
       AND (municipality_id, last_update) IN (
         SELECT municipality_id, MAX(last_update) 
         FROM municipal_forecasts 
         WHERE municipality_id IN (${placeholders})
         GROUP BY municipality_id
       )
       ORDER BY municipality_name, municipality_id`,
      [...municipalityIds, ...municipalityIds]
    )
  }

  async findAll(): Promise<MunicipalForecast[]> {
    return await this.db.all<MunicipalForecast>(
      'SELECT * FROM municipal_forecasts ORDER BY municipality_name, last_update DESC'
    )
  }

  async upsert(forecast: Omit<MunicipalForecast, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Check if a forecast exists for this municipality and date
    const existing = await this.findByMunicipalityAndDate(forecast.municipality_id, forecast.valid_date)
    
    if (existing) {
      await this.db.run(
        `UPDATE municipal_forecasts 
         SET municipality_name = ?, forecast_json = ?, last_update = ?
         WHERE municipality_id = ? AND valid_date = ?`,
        [forecast.municipality_name, forecast.forecast_json, forecast.last_update, forecast.municipality_id, forecast.valid_date]
      )
      
      logger.debug('Updated municipal forecast', { municipalityId: forecast.municipality_id, validDate: forecast.valid_date })
      return existing.id!
    } else {
      return await this.create(forecast)
    }
  }

  async deleteOlderThan(hours: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    
    const result = await this.db.run(
      'DELETE FROM municipal_forecasts WHERE last_update < ?',
      [cutoffDate]
    )
    
    logger.info('Deleted old municipal forecasts', { count: result.changes, cutoffDate })
    return result.changes || 0
  }

  async deleteExpiredForecasts(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    
    const result = await this.db.run(
      'DELETE FROM municipal_forecasts WHERE valid_date < ?',
      [today]
    )
    
    logger.info('Deleted expired municipal forecasts', { count: result.changes, today })
    return result.changes || 0
  }

  async getMunicipalityStatistics(): Promise<Array<{municipality_id: string, municipality_name: string, count: number, latest_date: string}>> {
    return await this.db.all(`
      SELECT 
        municipality_id,
        municipality_name,
        COUNT(*) as count,
        MAX(valid_date) as latest_date
      FROM municipal_forecasts 
      GROUP BY municipality_id, municipality_name 
      ORDER BY municipality_name
    `)
  }

  async isDataValid(municipalityId: string, maxAgeHours: number = 1): Promise<boolean> {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
    
    const result = await this.db.get<{count: number}>(
      'SELECT COUNT(*) as count FROM municipal_forecasts WHERE municipality_id = ? AND last_update > ?',
      [municipalityId, cutoffDate]
    )
    
    return (result?.count || 0) > 0
  }

  async getMunicipalityList(): Promise<Array<{municipality_id: string, municipality_name: string}>> {
    return await this.db.all(`
      SELECT DISTINCT municipality_id, municipality_name
      FROM municipal_forecasts 
      WHERE municipality_name IS NOT NULL
      ORDER BY municipality_name
    `)
  }
}