import { Router, Request, Response } from 'express'
import { asyncHandler } from '../utils/errorHandler'
import { logger } from '../utils/logger'

const router = Router()

// Health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0',
    database: 'connected', // TODO: Add actual database health check
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    }
  }

  logger.info('Health check requested', { ip: req.ip })
  res.json(healthCheck)
}))

// Readiness probe
router.get('/ready', asyncHandler(async (_req: Request, res: Response) => {
  // Check if all required services are available
  const checks = {
    database: true, // TODO: Add actual database connectivity check
    externalApis: true, // TODO: Add AEMET API connectivity check
    storage: true // TODO: Add storage availability check
  }

  const isReady = Object.values(checks).every(check => check === true)
  const status = isReady ? 200 : 503

  res.status(status).json({
    status: isReady ? 'READY' : 'NOT READY',
    checks,
    timestamp: new Date().toISOString()
  })
}))

// Liveness probe
router.get('/live', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    pid: process.pid
  })
}))

export default router