import { Database } from '../utils/database'
import { logger } from '../utils/logger'

export interface AvalancheReport {
  id?: number
  zone: string
  risk_level: number
  description?: string
  source_url?: string
  last_update: string
  created_at?: string
  updated_at?: string
}

export class AvalancheReportModel {
  constructor(private db: Database) {}

  async create(report: Omit<AvalancheReport, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO avalanche_reports (zone, risk_level, description, source_url, last_update)
       VALUES (?, ?, ?, ?, ?)`,
      [report.zone, report.risk_level, report.description, report.source_url, report.last_update]
    )
    
    logger.debug('Created avalanche report', { id: result.lastID, zone: report.zone })
    return result.lastID!
  }

  async findByZone(zone: string): Promise<AvalancheReport | undefined> {
    return await this.db.get<AvalancheReport>(
      'SELECT * FROM avalanche_reports WHERE zone = ? ORDER BY last_update DESC LIMIT 1',
      [zone]
    )
  }

  async findLatest(limit: number = 10): Promise<AvalancheReport[]> {
    return await this.db.all<AvalancheReport>(
      'SELECT * FROM avalanche_reports ORDER BY last_update DESC LIMIT ?',
      [limit]
    )
  }

  async findByRiskLevel(riskLevel: number): Promise<AvalancheReport[]> {
    return await this.db.all<AvalancheReport>(
      'SELECT * FROM avalanche_reports WHERE risk_level = ? ORDER BY last_update DESC',
      [riskLevel]
    )
  }

  async upsert(report: Omit<AvalancheReport, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    // Check if a report exists for this zone
    const existing = await this.findByZone(report.zone)
    
    if (existing) {
      await this.db.run(
        `UPDATE avalanche_reports 
         SET risk_level = ?, description = ?, source_url = ?, last_update = ?
         WHERE zone = ?`,
        [report.risk_level, report.description, report.source_url, report.last_update, report.zone]
      )
      
      logger.debug('Updated avalanche report', { zone: report.zone })
      return existing.id!
    } else {
      return await this.create(report)
    }
  }

  async deleteOlderThan(hours: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    
    const result = await this.db.run(
      'DELETE FROM avalanche_reports WHERE last_update < ?',
      [cutoffDate]
    )
    
    logger.info('Deleted old avalanche reports', { count: result.changes, cutoffDate })
    return result.changes || 0
  }

  async getZoneStatistics(): Promise<Array<{zone: string, count: number, latest_risk: number}>> {
    return await this.db.all(`
      SELECT 
        zone,
        COUNT(*) as count,
        MAX(risk_level) as latest_risk
      FROM avalanche_reports 
      GROUP BY zone 
      ORDER BY zone
    `)
  }
}