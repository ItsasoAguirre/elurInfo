import cron from 'node-cron'
import { logger } from './logger'
import { models } from '../models'
import { dbManager } from './database'

export function setupScheduledTasks(): void {
  logger.info('Setting up scheduled tasks...')

  // Clean expired cache entries every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running scheduled task: Clean expired cache')
      
      if (!models.isInitialized()) {
        await models.initialize()
      }

      const expiredCount = await models.apiCache.clearExpired()
      logger.info('Cleaned expired cache entries', { count: expiredCount })
      
    } catch (error) {
      logger.error('Error in scheduled cache cleanup:', error)
    }
  })

  // Clean old forecasts every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      logger.info('Running scheduled task: Clean old forecasts')
      
      if (!models.isInitialized()) {
        await models.initialize()
      }

      // Remove mountain forecasts older than 7 days
      const oldMountainForecasts = await models.mountainForecasts.deleteOlderThan(7 * 24)
      
      // Remove municipal forecasts older than 7 days  
      const oldMunicipalForecasts = await models.municipalForecasts.deleteOlderThan(7 * 24)
      
      // Remove avalanche reports older than 30 days
      const oldAvalancheReports = await models.avalancheReports.deleteOlderThan(30 * 24)

      logger.info('Cleaned old forecasts', {
        mountainForecasts: oldMountainForecasts,
        municipalForecasts: oldMunicipalForecasts,
        avalancheReports: oldAvalancheReports
      })
      
    } catch (error) {
      logger.error('Error in scheduled forecast cleanup:', error)
    }
  })

  // Clean expired forecasts daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Running scheduled task: Clean expired forecasts')
      
      if (!models.isInitialized()) {
        await models.initialize()
      }

      const expiredMountain = await models.mountainForecasts.deleteExpiredForecasts()
      const expiredMunicipal = await models.municipalForecasts.deleteExpiredForecasts()

      logger.info('Cleaned expired forecasts', {
        mountainForecasts: expiredMountain,
        municipalForecasts: expiredMunicipal
      })
      
    } catch (error) {
      logger.error('Error in scheduled expired forecast cleanup:', error)
    }
  })

  // Database maintenance (VACUUM) weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    try {
      logger.info('Running scheduled task: Database maintenance')
      
      await dbManager.vacuum()
      logger.info('Database vacuum completed successfully')
      
    } catch (error) {
      logger.error('Error in scheduled database maintenance:', error)
    }
  })

  // Database backup daily at 4 AM (if enabled)
  if (process.env.BACKUP_ENABLED === 'true') {
    cron.schedule('0 4 * * *', async () => {
      try {
        logger.info('Running scheduled task: Database backup')
        
        const backupPath = await dbManager.backup()
        logger.info('Database backup completed successfully', { path: backupPath })
        
        // Clean old backups if needed
        await cleanOldBackups()
        
      } catch (error) {
        logger.error('Error in scheduled database backup:', error)
      }
    })
  }

  // Log cache statistics every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    try {
      if (!models.isInitialized()) {
        await models.initialize()
      }

      const cacheStats = await models.apiCache.getStats()
      const mountainStats = await models.mountainForecasts.getZoneStatistics()
      const municipalStats = await models.municipalForecasts.getMunicipalityStatistics()
      const avalancheStats = await models.avalancheReports.getZoneStatistics()

      logger.info('Periodic statistics report', {
        cache: cacheStats,
        mountainForecasts: mountainStats.length,
        municipalForecasts: municipalStats.length,
        avalancheReports: avalancheStats.length
      })
      
    } catch (error) {
      logger.error('Error in scheduled statistics report:', error)
    }
  })

  logger.info('Scheduled tasks configured successfully')
}

async function cleanOldBackups(): Promise<void> {
  try {
    const fs = await import('fs')
    const path = await import('path')
    
    const backupDir = process.env.DATABASE_BACKUP_PATH || path.join(process.cwd(), 'data', 'backups')
    const retainDays = parseInt(process.env.BACKUP_RETAIN_DAYS || '30')
    
    if (!fs.existsSync(backupDir)) {
      return
    }

    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date(Date.now() - retainDays * 24 * 60 * 60 * 1000)
    
    let deletedCount = 0
    
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.db')) {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath)
          deletedCount++
          logger.debug('Deleted old backup', { file, age: stats.mtime })
        }
      }
    }
    
    if (deletedCount > 0) {
      logger.info('Cleaned old backup files', { deletedCount, retainDays })
    }
    
  } catch (error) {
    logger.error('Error cleaning old backups:', error)
  }
}