import { Database } from '../utils/database'
import { logger } from '../utils/logger'

export interface ApiCacheEntry {
  id?: number
  endpoint: string
  params?: string
  response_json: string
  last_update: string
  expires_at: string
  created_at?: string
}

export class ApiCacheModel {
  constructor(private db: Database) {}

  async set(
    endpoint: string, 
    responseData: any, 
    ttlHours: number = 1, 
    params?: Record<string, any>
  ): Promise<number> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)
    
    const paramsStr = params ? JSON.stringify(params) : null
    const responseJson = typeof responseData === 'string' ? responseData : JSON.stringify(responseData)
    
    // Use UPSERT to replace existing cache entry
    const result = await this.db.run(
      `INSERT OR REPLACE INTO api_cache (endpoint, params, response_json, last_update, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [endpoint, paramsStr, responseJson, now.toISOString(), expiresAt.toISOString()]
    )
    
    logger.debug('Cached API response', { endpoint, ttlHours, id: result.lastID })
    return result.lastID!
  }

  async get(endpoint: string, params?: Record<string, any>): Promise<ApiCacheEntry | undefined> {
    const paramsStr = params ? JSON.stringify(params) : null
    const now = new Date().toISOString()
    
    const cacheEntry = await this.db.get<ApiCacheEntry>(
      `SELECT * FROM api_cache 
       WHERE endpoint = ? AND (params = ? OR (params IS NULL AND ? IS NULL)) AND expires_at > ?
       ORDER BY last_update DESC LIMIT 1`,
      [endpoint, paramsStr, paramsStr, now]
    )
    
    if (cacheEntry) {
      logger.debug('Cache hit', { endpoint, params })
      return cacheEntry
    }
    
    logger.debug('Cache miss', { endpoint, params })
    return undefined
  }

  async getCachedResponse<T = any>(endpoint: string, params?: Record<string, any>): Promise<T | undefined> {
    const cacheEntry = await this.get(endpoint, params)
    
    if (cacheEntry) {
      try {
        return JSON.parse(cacheEntry.response_json)
      } catch (error) {
        logger.error('Failed to parse cached response', { endpoint, error })
        // Delete corrupted cache entry
        await this.delete(endpoint, params)
        return undefined
      }
    }
    
    return undefined
  }

  async delete(endpoint: string, params?: Record<string, any>): Promise<number> {
    const paramsStr = params ? JSON.stringify(params) : null
    
    const result = await this.db.run(
      `DELETE FROM api_cache 
       WHERE endpoint = ? AND (params = ? OR (params IS NULL AND ? IS NULL))`,
      [endpoint, paramsStr, paramsStr]
    )
    
    logger.debug('Deleted cache entry', { endpoint, params, deletedCount: result.changes })
    return result.changes || 0
  }

  async clearExpired(): Promise<number> {
    const now = new Date().toISOString()
    
    const result = await this.db.run(
      'DELETE FROM api_cache WHERE expires_at <= ?',
      [now]
    )
    
    logger.info('Cleared expired cache entries', { count: result.changes })
    return result.changes || 0
  }

  async clearAll(): Promise<number> {
    const result = await this.db.run('DELETE FROM api_cache')
    
    logger.info('Cleared all cache entries', { count: result.changes })
    return result.changes || 0
  }

  async clearByEndpoint(endpoint: string): Promise<number> {
    const result = await this.db.run(
      'DELETE FROM api_cache WHERE endpoint = ?',
      [endpoint]
    )
    
    logger.info('Cleared cache entries for endpoint', { endpoint, count: result.changes })
    return result.changes || 0
  }

  async getStats(): Promise<{
    total: number
    expired: number
    byEndpoint: Array<{endpoint: string, count: number}>
  }> {
    const now = new Date().toISOString()
    
    const [totalResult, expiredResult, byEndpointResults] = await Promise.all([
      this.db.get<{count: number}>('SELECT COUNT(*) as count FROM api_cache'),
      this.db.get<{count: number}>('SELECT COUNT(*) as count FROM api_cache WHERE expires_at <= ?', [now]),
      this.db.all<{endpoint: string, count: number}>(`
        SELECT endpoint, COUNT(*) as count 
        FROM api_cache 
        GROUP BY endpoint 
        ORDER BY count DESC
      `)
    ])
    
    return {
      total: totalResult?.count || 0,
      expired: expiredResult?.count || 0,
      byEndpoint: byEndpointResults
    }
  }

  async isValid(endpoint: string, params?: Record<string, any>): Promise<boolean> {
    const cacheEntry = await this.get(endpoint, params)
    return cacheEntry !== undefined
  }

  async getExpirationTime(endpoint: string, params?: Record<string, any>): Promise<Date | undefined> {
    const paramsStr = params ? JSON.stringify(params) : null
    
    const result = await this.db.get<{expires_at: string}>(
      `SELECT expires_at FROM api_cache 
       WHERE endpoint = ? AND (params = ? OR (params IS NULL AND ? IS NULL))
       ORDER BY last_update DESC LIMIT 1`,
      [endpoint, paramsStr, paramsStr]
    )
    
    return result ? new Date(result.expires_at) : undefined
  }
}