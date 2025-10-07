import { aemetService } from './aemet.service';
import { models } from '../models';
import { logger } from '../utils/logger';
import { SnowScienceReport } from '../models/SnowScienceReport';

interface CachedSnowScienceData {
  report: SnowScienceReport;
  cachedAt: string;
  expiresAt: string;
}

export class SnowScienceCacheService {
  private readonly CACHE_TTL_HOURS = 6; // Snow science data updates less frequently
  private readonly CACHE_ENDPOINT_PREFIX = 'snow_science_';

  /**
   * Gets snow science data from cache or from AEMET if not cached or expired
   */
  async getSnowScienceData(areaCode: number): Promise<SnowScienceReport | null> {
    try {
      // Verificar si el área es válida
      if (areaCode !== 0 && areaCode !== 1) {
        throw new Error('Invalid area code. Must be 0 or 1.');
      }

      const cacheKey = `${this.CACHE_ENDPOINT_PREFIX}${areaCode}`;
      
      // Try to get from cache first
      const cachedData = await models.apiCache.getCachedResponse<CachedSnowScienceData>(cacheKey);
      
      if (cachedData && cachedData.report) {
        logger.info(`Returning cached snow science data for area ${areaCode}`);
        return cachedData.report;
      }

      // If no valid cache, try to get from local database
      const latestReport = await models.snowScienceReports.getLatestByArea(areaCode);
      
      if (latestReport && this.isRecentEnough(latestReport.fechaActualizacion)) {
        logger.info(`Returning recent database snow science data for area ${areaCode}`);
        
        // Cache the DB data just in case
        await this.cacheSnowScienceReport(latestReport, areaCode);
        return latestReport;
      }

      // If no recent data, get from AEMET
      logger.info(`Fetching fresh snow science data from AEMET for area ${areaCode}`);
      const freshData = await aemetService.getNivologicalData(areaCode);
      
      if (!freshData) {
        logger.warn(`No snow science data received from AEMET for area ${areaCode}`);
        // Return the last available data even if old
        return latestReport;
      }

      // Process and save the new data
      const newReport = await this.processAndSaveAemetData(freshData, areaCode);
      
      // Cache the new data
      await this.cacheSnowScienceReport(newReport, areaCode);
      
      return newReport;

    } catch (error) {
      logger.error(`Error getting snow science data for area ${areaCode}:`, error);
      
      // In case of error, try to return the last available data
      try {
        const fallbackReport = await models.snowScienceReports.getLatestByArea(areaCode);
        if (fallbackReport) {
          logger.info(`Returning fallback snow science data for area ${areaCode}`);
          return fallbackReport;
        }
      } catch (fallbackError) {
        logger.error(`Fallback also failed for area ${areaCode}:`, fallbackError);
      }
      
      return null;
    }
  }

  /**
   * Gets all snow science data (both areas)
   */
  async getAllSnowScienceData(): Promise<SnowScienceReport[]> {
    const areas = [0, 1];
    const results: SnowScienceReport[] = [];

    for (const areaCode of areas) {
      const data = await this.getSnowScienceData(areaCode);
      if (data) {
        results.push(data);
      }
    }

    return results;
  }

  /**
   * Forces data update from AEMET ignoring cache
   */
  async forceRefresh(areaCode?: number): Promise<SnowScienceReport[]> {
    const areas = areaCode !== undefined ? [areaCode] : [0, 1];
    const results: SnowScienceReport[] = [];

    for (const area of areas) {
      try {
        // Clear cache for this area
        await this.clearCacheForArea(area);
        
        // Get fresh data
        const freshData = await aemetService.getNivologicalData(area);
        
        if (freshData) {
          const newReport = await this.processAndSaveAemetData(freshData, area);
          await this.cacheSnowScienceReport(newReport, area);
          results.push(newReport);
        }

        // Pause between requests
        if (areas.length > 1 && area === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        logger.error(`Error during force refresh for area ${area}:`, error);
      }
    }

    return results;
  }

  /**
   * Checks if data is recent enough
   */
  private isRecentEnough(fechaActualizacion: string, maxHours: number = 12): boolean {
    const updateTime = new Date(fechaActualizacion);
    const now = new Date();
    const diffHours = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
    
    return diffHours < maxHours;
  }

  /**
   * Processes and saves AEMET data to database
   */
  private async processAndSaveAemetData(aemetData: any, areaCode: number): Promise<SnowScienceReport> {
    const now = new Date().toISOString();
    
    const report: Omit<SnowScienceReport, 'id'> = {
      area: aemetData.area,
      areaCode,
      fechaElaboracion: aemetData.fecha,
      fechaValidez: aemetData.fecha,
      datosCompletos: JSON.stringify(aemetData.datos),
      fechaCreacion: now,
      fechaActualizacion: now
    };

    // If AEMET data contains structured information, extract it
    if (aemetData.datos && typeof aemetData.datos === 'object') {
      // Here you can extract specific fields according to the real data structure
      // For example:
      // report.resumenSituacion = aemetData.datos.resumen;
      // report.peligroAludes = aemetData.datos.peligro;
      // etc.
    }

    const id = await models.snowScienceReports.upsert(report);
    
    return {
      id,
      ...report
    };
  }

  /**
   * Caches a snow science report
   */
  private async cacheSnowScienceReport(report: SnowScienceReport, areaCode: number): Promise<void> {
    const cacheKey = `${this.CACHE_ENDPOINT_PREFIX}${areaCode}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_HOURS * 60 * 60 * 1000);
    
    const cachedData: CachedSnowScienceData = {
      report,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    await models.apiCache.set(cacheKey, cachedData, this.CACHE_TTL_HOURS);
    logger.debug(`Cached snow science report for area ${areaCode}`);
  }

  /**
   * Clears cache for a specific area
   */
  async clearCacheForArea(areaCode: number): Promise<void> {
    const cacheKey = `${this.CACHE_ENDPOINT_PREFIX}${areaCode}`;
    await models.apiCache.delete(cacheKey);
    logger.info(`Cleared cache for snow science area ${areaCode}`);
  }

  /**
   * Clears all snow science cache
   */
  async clearAllCache(): Promise<void> {
    await models.apiCache.clearByEndpoint(this.CACHE_ENDPOINT_PREFIX);
    logger.info('Cleared all snow science cache');
  }

  /**
   * Gets snow science cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    cacheByArea: Record<number, boolean>;
    nextExpiration?: Date;
  }> {
    const areas = [0, 1];
    const cacheByArea: Record<number, boolean> = {};
    let nextExpiration: Date | undefined;
    let totalCached = 0;

    for (const area of areas) {
      const cacheKey = `${this.CACHE_ENDPOINT_PREFIX}${area}`;
      const isValid = await models.apiCache.isValid(cacheKey);
      cacheByArea[area] = isValid;
      
      if (isValid) {
        totalCached++;
        const expiration = await models.apiCache.getExpirationTime(cacheKey);
        if (expiration && (!nextExpiration || expiration < nextExpiration)) {
          nextExpiration = expiration;
        }
      }
    }

    const result: {
      totalCached: number;
      cacheByArea: Record<number, boolean>;
      nextExpiration?: Date;
    } = {
      totalCached,
      cacheByArea
    };

    if (nextExpiration) {
      result.nextExpiration = nextExpiration;
    }

    return result;
  }

  /**
   * Checks if there is cached data for an area
   */
  async isCached(areaCode: number): Promise<boolean> {
    const cacheKey = `${this.CACHE_ENDPOINT_PREFIX}${areaCode}`;
    return await models.apiCache.isValid(cacheKey);
  }

  /**
   * Schedule periodic cleanup of old data
   */
  async scheduleCleanup(): Promise<void> {
    // Clean old snow science reports (older than 30 days)
    await models.snowScienceReports.cleanupOldReports(30);
    
    // Clean expired cache
    await models.apiCache.clearExpired();
    
    logger.info('Snow science cache cleanup completed');
  }
}

// Export a singleton instance
export const snowScienceCacheService = new SnowScienceCacheService();