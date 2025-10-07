import { Database } from '../utils/database';
import { logger } from '../utils/logger';

export interface SnowScienceReport {
  id?: number;
  area: string;
  areaCode: number;
  fechaElaboracion: string;
  fechaValidez: string;
  resumenSituacion?: string;
  peligroAludes?: string;
  evolucionManto?: string;
  observaciones?: string;
  datosCompletos: string; // JSON string con todos los datos de AEMET
  fechaCreacion: string;
  fechaActualizacion: string;
}

export class SnowScienceReportModel {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Inicializa la tabla de reportes de ciencia de la nieve
   */
  async initializeTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS snow_science_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        area TEXT NOT NULL,
        area_code INTEGER NOT NULL,
        fecha_elaboracion TEXT NOT NULL,
        fecha_validez TEXT NOT NULL,
        resumen_situacion TEXT,
        peligro_aludes TEXT,
        evolucion_manto TEXT,
        observaciones TEXT,
        datos_completos TEXT NOT NULL,
        fecha_creacion TEXT NOT NULL,
        fecha_actualizacion TEXT NOT NULL,
        UNIQUE(area_code, fecha_elaboracion)
      )
    `;

    try {
      await this.db.run(createTableSQL);
      logger.info('Snow science reports table initialized successfully');
    } catch (error) {
      logger.error('Error initializing snow science reports table:', error);
      throw error;
    }
  }

  /**
   * Crea un índice para mejorar las consultas por área y fecha
   */
  async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_snow_science_area_code ON snow_science_reports(area_code)',
      'CREATE INDEX IF NOT EXISTS idx_snow_science_fecha_elaboracion ON snow_science_reports(fecha_elaboracion)',
      'CREATE INDEX IF NOT EXISTS idx_snow_science_area_fecha ON snow_science_reports(area_code, fecha_elaboracion)'
    ];

    try {
      for (const indexSQL of indexes) {
        await this.db.run(indexSQL);
      }
      logger.info('Snow science reports indexes created successfully');
    } catch (error) {
      logger.error('Error creating snow science reports indexes:', error);
      throw error;
    }
  }

  /**
   * Inserta o actualiza un reporte de ciencia de la nieve
   */
  async upsert(report: Omit<SnowScienceReport, 'id'>): Promise<number> {
    const sql = `
      INSERT OR REPLACE INTO snow_science_reports (
        area, area_code, fecha_elaboracion, fecha_validez,
        resumen_situacion, peligro_aludes, evolucion_manto, observaciones,
        datos_completos, fecha_creacion, fecha_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      report.area,
      report.areaCode,
      report.fechaElaboracion,
      report.fechaValidez,
      report.resumenSituacion || null,
      report.peligroAludes || null,
      report.evolucionManto || null,
      report.observaciones || null,
      report.datosCompletos,
      report.fechaCreacion,
      report.fechaActualizacion
    ];

    try {
      const result = await this.db.run(sql, params);
      logger.info(`Snow science report upserted for area ${report.area} (${report.areaCode})`);
      return result.lastID || 0;
    } catch (error) {
      logger.error('Error upserting snow science report:', error);
      throw error;
    }
  }

  /**
   * Obtiene el reporte de ciencia de la nieve más reciente para un área específica
   */
  async getLatestByArea(areaCode: number): Promise<SnowScienceReport | null> {
    const sql = `
      SELECT 
        id, area, area_code, fecha_elaboracion, fecha_validez,
        resumen_situacion, peligro_aludes, evolucion_manto, observaciones,
        datos_completos, fecha_creacion, fecha_actualizacion
      FROM snow_science_reports 
      WHERE area_code = ?
      ORDER BY fecha_elaboracion DESC 
      LIMIT 1
    `;

    try {
      const row = await this.db.get(sql, [areaCode]);
      
      if (!row) {
        return null;
      }

      return this.mapRowToReport(row);
    } catch (error) {
      logger.error(`Error getting latest snow science report for area ${areaCode}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los reportes de ciencia de la nieve más recientes (uno por área)
   */
  async getAllLatest(): Promise<SnowScienceReport[]> {
    const sql = `
      SELECT 
        n1.id, n1.area, n1.area_code, n1.fecha_elaboracion, n1.fecha_validez,
        n1.resumen_situacion, n1.peligro_aludes, n1.evolucion_manto, n1.observaciones,
        n1.datos_completos, n1.fecha_creacion, n1.fecha_actualizacion
      FROM snow_science_reports n1
      INNER JOIN (
        SELECT area_code, MAX(fecha_elaboracion) as max_fecha
        FROM snow_science_reports
        GROUP BY area_code
      ) n2 ON n1.area_code = n2.area_code AND n1.fecha_elaboracion = n2.max_fecha
      ORDER BY n1.area_code
    `;

    try {
      const rows = await this.db.all(sql);
      return rows.map(row => this.mapRowToReport(row));
    } catch (error) {
      logger.error('Error getting all latest snow science reports:', error);
      throw error;
    }
  }

  /**
   * Obtiene reportes de ciencia de la nieve por rango de fechas para un área específica
   */
  async getByAreaAndDateRange(
    areaCode: number, 
    fechaInicio: string, 
    fechaFin: string
  ): Promise<SnowScienceReport[]> {
    const sql = `
      SELECT 
        id, area, area_code, fecha_elaboracion, fecha_validez,
        resumen_situacion, peligro_aludes, evolucion_manto, observaciones,
        datos_completos, fecha_creacion, fecha_actualizacion
      FROM snow_science_reports 
      WHERE area_code = ? 
        AND fecha_elaboracion >= ? 
        AND fecha_elaboracion <= ?
      ORDER BY fecha_elaboracion DESC
    `;

    try {
      const rows = await this.db.all(sql, [areaCode, fechaInicio, fechaFin]);
      return rows.map(row => this.mapRowToReport(row));
    } catch (error) {
      logger.error(`Error getting snow science reports for area ${areaCode} in date range:`, error);
      throw error;
    }
  }

  /**
   * Elimina reportes de ciencia de la nieve antiguos (mayor a un número de días especificado)
   */
  async cleanupOldReports(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateString = cutoffDate.toISOString();

    const sql = `
      DELETE FROM snow_science_reports 
      WHERE fecha_elaboracion < ?
    `;

    try {
      const result = await this.db.run(sql, [cutoffDateString]);
      const deletedCount = result.changes || 0;
      logger.info(`Cleaned up ${deletedCount} old snow science reports`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old snow science reports:', error);
      throw error;
    }
  }

  /**
   * Mapea una fila de la base de datos a un objeto SnowScienceReport
   */
  private mapRowToReport(row: any): SnowScienceReport {
    return {
      id: row.id,
      area: row.area,
      areaCode: row.area_code,
      fechaElaboracion: row.fecha_elaboracion,
      fechaValidez: row.fecha_validez,
      resumenSituacion: row.resumen_situacion,
      peligroAludes: row.peligro_aludes,
      evolucionManto: row.evolucion_manto,
      observaciones: row.observaciones,
      datosCompletos: row.datos_completos,
      fechaCreacion: row.fecha_creacion,
      fechaActualizacion: row.fecha_actualizacion
    };
  }

  /**
   * Obtiene estadísticas básicas de los reportes de ciencia de la nieve
   */
  async getStats(): Promise<{ totalReports: number; reportsByArea: Record<string, number> }> {
    try {
      const totalSql = 'SELECT COUNT(*) as total FROM snow_science_reports';
      const totalResult = await this.db.get(totalSql);

      const areaSql = `
        SELECT area, COUNT(*) as count 
        FROM snow_science_reports 
        GROUP BY area
      `;
      const areaResults = await this.db.all(areaSql);

      const reportsByArea: Record<string, number> = {};
      areaResults.forEach(row => {
        reportsByArea[row.area] = row.count;
      });

      return {
        totalReports: totalResult.total,
        reportsByArea
      };
    } catch (error) {
      logger.error('Error getting snow science reports stats:', error);
      throw error;
    }
  }
}