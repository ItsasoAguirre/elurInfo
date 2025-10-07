import { Database } from '../utils/database'
import { logger } from '../utils/logger'

export interface MountainForecast {
  id?: number
  zone: string
  forecast_json: string
  valid_date: string
  last_update: string
  created_at?: string
  updated_at?: string
}

export class MountainForecastModel {
  constructor(private db: Database) {}

  async create(forecast: Omit<MountainForecast, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO mountain_forecasts (zone, forecast_json, valid_date, last_update)
       VALUES (?, ?, ?, ?)`,
      [forecast.zone, forecast.forecast_json, forecast.valid_date, forecast.last_update]
    )
    
    logger.debug('Created mountain forecast', { id: result.lastID, zone: forecast.zone })
    return result.lastID!
  }

  async findByZone(zone: string): Promise<MountainForecast | undefined> {
    return await this.db.get<MountainForecast>(
      'SELECT * FROM mountain_forecasts WHERE zone = ? ORDER BY last_update DESC LIMIT 1',
      [zone]
    )
  }

  async findByZoneAndDate(zone: string, validDate: string): Promise<MountainForecast | undefined> {
    return await this.db.get<MountainForecast>(
      'SELECT * FROM mountain_forecasts WHERE zone = ? AND valid_date = ? ORDER BY last_update DESC LIMIT 1',
      [zone, validDate]
    )
  }

  async findAll(): Promise<MountainForecast[]> {
    return await this.db.all<MountainForecast>(
      'SELECT * FROM mountain_forecasts ORDER BY zone, last_update DESC'
    )
  }

  async findLatestByZones(zones: string[]): Promise<MountainForecast[]> {
    if (zones.length === 0) return []
    
    const placeholders = zones.map(() => '?').join(',')
    return await this.db.all<MountainForecast>(
      `SELECT * FROM mountain_forecasts 
       WHERE zone IN (${placeholders}) 
       AND (zone, last_update) IN (
         SELECT zone, MAX(last_update) 
         FROM mountain_forecasts 
         WHERE zone IN (${placeholders})
         GROUP BY zone
       )
       ORDER BY zone`,
      [...zones, ...zones]
    )
  }

  async upsert(forecast: Omit<MountainForecast, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Check if a forecast exists for this zone and date
    const existing = await this.findByZoneAndDate(forecast.zone, forecast.valid_date)
    
    if (existing) {
      await this.db.run(
        `UPDATE mountain_forecasts 
         SET forecast_json = ?, last_update = ?
         WHERE zone = ? AND valid_date = ?`,
        [forecast.forecast_json, forecast.last_update, forecast.zone, forecast.valid_date]
      )
      
      logger.debug('Updated mountain forecast', { zone: forecast.zone, validDate: forecast.valid_date })
      return existing.id!
    } else {
      return await this.create(forecast)
    }
  }

  async deleteOlderThan(hours: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    
    const result = await this.db.run(
      'DELETE FROM mountain_forecasts WHERE last_update < ?',
      [cutoffDate]
    )
    
    logger.info('Deleted old mountain forecasts', { count: result.changes, cutoffDate })
    return result.changes || 0
  }

  async deleteExpiredForecasts(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    
    const result = await this.db.run(
      'DELETE FROM mountain_forecasts WHERE valid_date < ?',
      [today]
    )
    
    logger.info('Deleted expired mountain forecasts', { count: result.changes, today })
    return result.changes || 0
  }

  async getZoneStatistics(): Promise<Array<{zone: string, count: number, latest_date: string}>> {
    return await this.db.all(`
      SELECT 
        zone,
        COUNT(*) as count,
        MAX(valid_date) as latest_date
      FROM mountain_forecasts 
      GROUP BY zone 
      ORDER BY zone
    `)
  }

  async isDataValid(zone: string, maxAgeHours: number = 1): Promise<boolean> {
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
    
    const result = await this.db.get<{count: number}>(
      'SELECT COUNT(*) as count FROM mountain_forecasts WHERE zone = ? AND last_update > ?',
      [zone, cutoffDate]
    )
    
    return (result?.count || 0) > 0
  }
}