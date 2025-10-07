import cron from 'node-cron'
import { logger } from './logger'

export function setupScheduledTasks(): void {
  logger.info('Setting up scheduled tasks...')

  // Simple health check task every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Scheduled health check executed')
  })

  logger.info('Scheduled tasks configured successfully')
}